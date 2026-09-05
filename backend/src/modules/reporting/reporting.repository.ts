import { db } from '../../shared/db';
import {
  payruns,
  timeOffRequests,
  attendance,
  employees,
  users,
  departments,
  contracts,
  workingSchedules,
} from '../../db/schema';
import { eq, and, sql, count, desc } from 'drizzle-orm';

export async function getPayrollKpis() {
  const [res] = await db
    .select({
      total_net_paid: sql<string>`COALESCE(SUM(${payruns.totalNet}), 0)`,
      payslips_generated: sql<number>`COALESCE(SUM(${payruns.payslipCount}), 0)`,
    })
    .from(payruns)
    .where(eq(payruns.status, 'paid'));

  const totalNet = parseFloat(res?.total_net_paid || '0');
  const countPayslips = Number(res?.payslips_generated || 0);
  const avg = countPayslips > 0 ? totalNet / countPayslips : 0;

  return {
    total_net_paid: totalNet,
    payslips_generated: countPayslips,
    average_salary: avg,
  };
}

export async function getTimeOffStats() {
  const [res] = await db
    .select({
      approved_days: sql<string>`COALESCE(SUM(CASE WHEN ${timeOffRequests.status} = 'approved' THEN ${timeOffRequests.duration} ELSE 0 END), 0)`,
      pending_requests: sql<number>`COUNT(CASE WHEN ${timeOffRequests.status} = 'pending' THEN 1 END)`,
    })
    .from(timeOffRequests);

  return {
    approved_days: parseFloat(res?.approved_days || '0'),
    pending_requests: Number(res?.pending_requests || 0),
  };
}

export async function getAttendanceHealthStats() {
  const [res] = await db
    .select({
      present_count: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Present' THEN 1 END)`,
      late_count: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Late' THEN 1 END)`,
      absent_count: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Absent' THEN 1 END)`,
      overtime_count: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Overtime' THEN 1 END)`,
      manual_edits_count: sql<number>`COUNT(CASE WHEN ${attendance.isManualEdit} = true THEN 1 END)`,
      total_attendance_entries: count(),
    })
    .from(attendance);

  return {
    present_count: Number(res?.present_count || 0),
    late_count: Number(res?.late_count || 0),
    absent_count: Number(res?.absent_count || 0),
    overtime_count: Number(res?.overtime_count || 0),
    manual_edits_count: Number(res?.manual_edits_count || 0),
    total_attendance_entries: Number(res?.total_attendance_entries || 0),
  };
}

export async function getSalaryCostByDepartment() {
  return await db
    .select({
      department_name: sql<string>`COALESCE(${departments.name}, 'Unassigned')`,
      employee_count: sql<number>`COUNT(DISTINCT ${employees.id})`,
      total_salary_cost: sql<string>`COALESCE(SUM(${contracts.wage}), 0)`,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(
      contracts,
      and(eq(employees.id, contracts.employeeId), eq(contracts.status, 'active')),
    )
    .groupBy(departments.name);
}

export async function getMonthlySalaryTrends() {
  const monthLabel = sql<string>`TO_CHAR(${payruns.periodStart}, 'Mon YYYY')`;
  const monthDate = sql<string>`DATE_TRUNC('month', ${payruns.periodStart})`;

  return await db
    .select({
      month_label: monthLabel,
      month_date: monthDate,
      total_net: sql<string>`COALESCE(SUM(${payruns.totalNet}), 0)`,
      total_gross: sql<string>`COALESCE(SUM(${payruns.totalGross}), 0)`,
    })
    .from(payruns)
    .groupBy(monthLabel, monthDate)
    .orderBy(sql`${monthDate} ASC`)
    .limit(12);
}

export async function getContractAndScheduleStats() {
  const [contractRes] = await db
    .select({
      total: count(),
      active: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'active' THEN 1 END)`,
      draft: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'draft' THEN 1 END)`,
      expired: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'expired' THEN 1 END)`,
    })
    .from(contracts);

  const [scheduleRes] = await db
    .select({
      total: count(),
      active: sql<number>`COUNT(CASE WHEN ${workingSchedules.isActive} = true THEN 1 END)`,
      avg_weekly_hours: sql<string>`COALESCE(AVG(${workingSchedules.weeklyHours}), 40.0)`,
    })
    .from(workingSchedules);

  const recentContracts = await db
    .select({
      id: contracts.id,
      name: contracts.name,
      employee_id: contracts.employeeId,
      employee_name: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      wage: contracts.wage,
      wage_type: contracts.wageType,
      status: contracts.status,
      start_date: contracts.startDate,
      end_date: contracts.endDate,
    })
    .from(contracts)
    .leftJoin(employees, eq(contracts.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .orderBy(desc(contracts.createdAt))
    .limit(5);

  const activeSchedules = await db
    .select({
      id: workingSchedules.id,
      name: workingSchedules.name,
      weekly_hours: workingSchedules.weeklyHours,
      is_active: workingSchedules.isActive,
    })
    .from(workingSchedules)
    .orderBy(desc(workingSchedules.weeklyHours))
    .limit(5);

  return {
    contracts: {
      total: Number(contractRes?.total || 0),
      active: Number(contractRes?.active || 0),
      draft: Number(contractRes?.draft || 0),
      expired: Number(contractRes?.expired || 0),
      recent: recentContracts,
    },
    schedules: {
      total: Number(scheduleRes?.total || 0),
      active: Number(scheduleRes?.active || 0),
      avgWeeklyHours: parseFloat(scheduleRes?.avg_weekly_hours || '40.0'),
      list: activeSchedules,
    },
  };
}
