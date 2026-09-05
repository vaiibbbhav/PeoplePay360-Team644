import { db } from '../../shared/db';
import {
  payruns,
  timeOffRequests,
  attendance,
  employees,
  departments,
  contracts,
  users,
  auditLogs,
} from '../../db/schema';
import { eq, and, sql, count, gte, desc, or, isNull } from 'drizzle-orm';

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

export async function getAdminAttentionMetrics() {
  // Incomplete employee profiles
  const incompleteEmployees = await db
    .select({
      id: employees.id,
      userId: employees.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      dateOfJoining: employees.dateOfJoining,
    })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .where(eq(employees.employmentStatus, 'incomplete'))
    .limit(10);

  const [incompleteCountRes] = await db
    .select({ count: count() })
    .from(employees)
    .where(eq(employees.employmentStatus, 'incomplete'));

  // Deactivated accounts within last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deactivatedUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(eq(users.isActive, false), gte(users.updatedAt, thirtyDaysAgo)))
    .orderBy(desc(users.updatedAt))
    .limit(10);

  const [deactivated30dCountRes] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.isActive, false), gte(users.updatedAt, thirtyDaysAgo)));

  const [totalDeactivatedRes] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, false));

  // Users with unassigned or empty role
  const [unassignedRolesRes] = await db
    .select({ count: count() })
    .from(users)
    .where(or(isNull(users.role), eq(users.role, '')));

  return {
    incompleteProfiles: {
      count: Number(incompleteCountRes?.count || 0),
      items: incompleteEmployees,
    },
    deactivatedAccounts: {
      count30Days: Number(deactivated30dCountRes?.count || 0),
      totalCount: Number(totalDeactivatedRes?.count || 0),
      items: deactivatedUsers,
    },
    unassignedRolesCount: Number(unassignedRolesRes?.count || 0),
  };
}

export async function getAdminAccessSnapshot() {
  const [activeRes] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));

  const [totalRes] = await db.select({ count: count() }).from(users);

  // Group by role for active users
  const roleCountsRaw = await db
    .select({
      role: users.role,
      count: count(),
    })
    .from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.role);

  const roleBreakdown: Record<string, number> = {
    Admin: 0,
    'HR Manager': 0,
    'HR Payroll Manager': 0,
    'HR Payroll User': 0,
    Employee: 0,
  };

  for (const r of roleCountsRaw) {
    if (r.role) {
      roleBreakdown[r.role] = Number(r.count || 0);
    }
  }

  // Accounts created this week (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [createdThisWeekRes] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo));

  const recentCreatedUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo))
    .orderBy(desc(users.createdAt))
    .limit(5);

  return {
    totalActiveUsers: Number(activeRes?.count || 0),
    totalUsers: Number(totalRes?.count || 0),
    roleBreakdown,
    createdThisWeek: {
      count: Number(createdThisWeekRes?.count || 0),
      sample: recentCreatedUsers,
    },
  };
}

export async function getCrossModuleAnomalies() {
  // 1. Active employees with no active contract
  const employeesWithoutContractRes = await db.execute(sql`
    SELECT e.id, u.first_name as "firstName", u.last_name as "lastName", u.email, d.name as "departmentName"
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE u.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM contracts c
        WHERE c.employee_id = e.id AND c.status = 'active'
      )
    LIMIT 10
  `);

  const employeesWithoutContractCountRes = await db.execute(sql`
    SELECT COUNT(*)::int as count
    FROM employees e
    JOIN users u ON e.user_id = u.id
    WHERE u.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM contracts c
        WHERE c.employee_id = e.id AND c.status = 'active'
      )
  `);

  const employeesWithoutContractCount =
    Number((employeesWithoutContractCountRes.rows[0] as any)?.count || 0);

  // 2. Payruns stuck in draft
  const draftPayruns = await db
    .select({
      id: payruns.id,
      name: payruns.name,
      periodStart: payruns.periodStart,
      periodEnd: payruns.periodEnd,
      createdAt: payruns.createdAt,
    })
    .from(payruns)
    .where(eq(payruns.status, 'draft'))
    .orderBy(desc(payruns.createdAt))
    .limit(10);

  const [draftPayrunsCountRes] = await db
    .select({ count: count() })
    .from(payruns)
    .where(eq(payruns.status, 'draft'));

  return {
    employeesWithoutContract: {
      count: employeesWithoutContractCount,
      items: employeesWithoutContractRes.rows,
    },
    draftPayruns: {
      count: Number(draftPayrunsCountRes?.count || 0),
      items: draftPayruns,
    },
  };
}

export async function getRecentAdminActivity(limit = 15) {
  const logs = await db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      actorName: auditLogs.actorName,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      description: auditLogs.description,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  if (logs.length > 0) {
    return logs;
  }

  // Synthesize from users table if empty so feed is never blank
  const recentUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return recentUsers.map((u) => ({
    id: u.id,
    actorId: null,
    actorName: 'Admin',
    action: u.isActive ? 'USER_CREATED' : 'USER_DEACTIVATED',
    entityType: 'user',
    entityId: u.id,
    description: u.isActive
      ? `Admin created user ${u.firstName} ${u.lastName} — ${u.role}`
      : `Admin deactivated user ${u.firstName} ${u.lastName}`,
    metadata: { role: u.role, email: u.email },
    createdAt: u.createdAt || new Date(),
  }));
}

