import { db } from '../../shared/db';
import {
  employees,
  departments,
  jobPositions,
  workingSchedules,
  contracts,
  attendance,
  timeOffRequests,
  payslips,
} from '../../db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const managers = alias(employees, 'managers');

export async function findAllEmployees() {
  return await db
    .select({
      id: employees.id,
      first_name: employees.firstName,
      last_name: employees.lastName,
      email: employees.email,
      phone: employees.phone,
      department_id: employees.departmentId,
      department_name: departments.name,
      job_position_id: employees.jobPositionId,
      job_position_title: jobPositions.title,
      manager_id: employees.managerId,
      manager_name: sql<string | null>`concat(${managers.firstName}, ' ', ${managers.lastName})`,
      working_schedule_id: employees.workingScheduleId,
      working_schedule_name: workingSchedules.name,
      employment_status: employees.employmentStatus,
      date_of_joining: employees.dateOfJoining,
      date_of_birth: employees.dateOfBirth,
      gender: employees.gender,
      identification_number: employees.identificationNumber,
      bank_name: employees.bankName,
      bank_account_number: employees.bankAccountNumber,
      bank_routing_code: employees.bankRoutingCode,
      avatar_url: employees.avatarUrl,
      created_at: employees.createdAt,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .leftJoin(workingSchedules, eq(employees.workingScheduleId, workingSchedules.id))
    .leftJoin(managers, eq(employees.managerId, managers.id))
    .orderBy(desc(employees.createdAt));
}

export async function findEmployeeById(id: string) {
  const rows = await db
    .select({
      id: employees.id,
      first_name: employees.firstName,
      last_name: employees.lastName,
      email: employees.email,
      phone: employees.phone,
      department_id: employees.departmentId,
      department_name: departments.name,
      job_position_id: employees.jobPositionId,
      job_position_title: jobPositions.title,
      manager_id: employees.managerId,
      manager_name: sql<string | null>`concat(${managers.firstName}, ' ', ${managers.lastName})`,
      working_schedule_id: employees.workingScheduleId,
      working_schedule_name: workingSchedules.name,
      weekly_hours: workingSchedules.weeklyHours,
      employment_status: employees.employmentStatus,
      date_of_joining: employees.dateOfJoining,
      date_of_birth: employees.dateOfBirth,
      gender: employees.gender,
      identification_number: employees.identificationNumber,
      bank_name: employees.bankName,
      bank_account_number: employees.bankAccountNumber,
      bank_routing_code: employees.bankRoutingCode,
      avatar_url: employees.avatarUrl,
      created_at: employees.createdAt,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .leftJoin(workingSchedules, eq(employees.workingScheduleId, workingSchedules.id))
    .leftJoin(managers, eq(employees.managerId, managers.id))
    .where(eq(employees.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function findEmployeeByEmail(email: string) {
  const rows = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
  return rows[0] || null;
}

export async function insertEmployee(data: Record<string, any>) {
  const [created] = await db
    .insert(employees)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId,
      jobPositionId: data.jobPositionId,
      managerId: data.managerId,
      workingScheduleId: data.workingScheduleId,
      employmentStatus: data.employmentStatus || 'active',
      dateOfJoining: data.dateOfJoining,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      identificationNumber: data.identificationNumber,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      bankRoutingCode: data.bankRoutingCode,
      avatarUrl: data.avatarUrl,
    })
    .returning();
  return created;
}

export async function updateEmployeeById(id: string, data: Record<string, any>) {
  const values: Record<string, any> = {};
  const mapping: Record<string, keyof typeof employees.$inferInsert> = {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    departmentId: 'departmentId',
    jobPositionId: 'jobPositionId',
    managerId: 'managerId',
    workingScheduleId: 'workingScheduleId',
    employmentStatus: 'employmentStatus',
    dateOfJoining: 'dateOfJoining',
    dateOfBirth: 'dateOfBirth',
    gender: 'gender',
    identificationNumber: 'identificationNumber',
    bankName: 'bankName',
    bankAccountNumber: 'bankAccountNumber',
    bankRoutingCode: 'bankRoutingCode',
    avatarUrl: 'avatarUrl',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (data[key] !== undefined) {
      values[col] = data[key];
    }
  }

  values.updatedAt = new Date();
  const [updated] = await db.update(employees).set(values).where(eq(employees.id, id)).returning();
  return updated || null;
}

export async function deleteEmployeeById(id: string) {
  const deleted = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });
  return deleted.length > 0;
}

export async function getEmployeeStats(employeeId: string) {
  const [contractRes] = await db
    .select({ val: count() })
    .from(contracts)
    .where(eq(contracts.employeeId, employeeId));
  const [attendanceRes] = await db
    .select({ val: count() })
    .from(attendance)
    .where(eq(attendance.employeeId, employeeId));
  const [timeOffRes] = await db
    .select({ val: count() })
    .from(timeOffRequests)
    .where(eq(timeOffRequests.employeeId, employeeId));
  const [payslipRes] = await db
    .select({ val: count() })
    .from(payslips)
    .where(eq(payslips.employeeId, employeeId));

  return {
    contract_count: contractRes?.val ?? 0,
    attendance_count: attendanceRes?.val ?? 0,
    time_off_count: timeOffRes?.val ?? 0,
    payslip_count: payslipRes?.val ?? 0,
  };
}

export async function findAllDepartments() {
  return await db.select().from(departments).orderBy(departments.name);
}

export async function findAllJobPositions() {
  return await db.select().from(jobPositions).orderBy(jobPositions.title);
}

export async function findAllWorkingSchedules() {
  return await db.select().from(workingSchedules).orderBy(workingSchedules.name);
}
export async function findPayslipsByEmployeeId(employeeId: string) {
  return await db
    .select({
      id: payslips.id,
      payrun_id: payslips.payrunId,
      period_start: payslips.periodStart,
      period_end: payslips.periodEnd,
      worked_days: payslips.workedDays,
      basic_salary: payslips.basicSalary,
      gross_salary: payslips.grossSalary,
      total_deductions: payslips.totalDeductions,
      net_salary: payslips.netSalary,
      status: payslips.status,
      warnings: payslips.warnings,
      created_at: payslips.createdAt,
    })
    .from(payslips)
    .where(eq(payslips.employeeId, employeeId))
    .orderBy(desc(payslips.periodStart));
}
