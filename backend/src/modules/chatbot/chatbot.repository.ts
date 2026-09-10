import { db } from '../../shared/db';
import {
  employees,
  users,
  departments,
  jobPositions,
  contracts,
  workingSchedules,
  attendance,
  timeOffRequests,
  timeOffTypes,
  payruns,
  payslips,
  salaryStructures,
  salaryRules,
  companyPolicies,
} from '../../db/schema';
import { eq, sql, count, desc, or, ilike, and, gte, lte } from 'drizzle-orm';

export type HRQuickSnapshot = {
  headcount: {
    totalEmployees: number;
    activeEmployees: number;
    incompleteProfiles: number;
  };
  contracts: {
    activeContracts: number;
    draftContracts: number;
    expiringWithin30Days: number;
  };
  latestPayrun: {
    id: string | null;
    name: string | null;
    period: string | null;
    status: string | null;
    totalNet: number;
    payslipCount: number;
    warningCount: number;
  } | null;
  attendanceToday: {
    present: number;
    late: number;
    absent: number;
    overtime: number;
    manualEdits: number;
    total: number;
  };
  timeOff: {
    pendingRequests: number;
    approvedDaysThisMonth: number;
  };
  policies: {
    totalPolicies: number;
    mandatoryPolicies: number;
  };
};

export async function getHRQuickSnapshot(): Promise<HRQuickSnapshot> {
  // 1. Headcount & employment statuses
  const [empStats] = await db
    .select({
      total: count(),
      active: sql<number>`COUNT(CASE WHEN ${employees.employmentStatus} = 'active' THEN 1 END)`,
      incomplete: sql<number>`COUNT(CASE WHEN ${employees.employmentStatus} = 'incomplete' THEN 1 END)`,
    })
    .from(employees);

  // 2. Contracts summary
  const [contractStats] = await db
    .select({
      active: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'active' THEN 1 END)`,
      draft: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'draft' THEN 1 END)`,
      expiringSoon: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'active' AND ${contracts.endDate} IS NOT NULL AND ${contracts.endDate} <= (CURRENT_DATE + INTERVAL '30 days') AND ${contracts.endDate} >= CURRENT_DATE THEN 1 END)`,
    })
    .from(contracts);

  // 3. Latest Payrun
  const latestPayrunRows = await db
    .select({
      id: payruns.id,
      name: payruns.name,
      periodStart: payruns.periodStart,
      periodEnd: payruns.periodEnd,
      status: payruns.status,
      totalNet: payruns.totalNet,
      payslipCount: payruns.payslipCount,
      warnings: payruns.warnings,
    })
    .from(payruns)
    .orderBy(desc(payruns.createdAt))
    .limit(1);

  const lp = latestPayrunRows[0];
  const latestPayrun = lp
    ? {
        id: lp.id,
        name: lp.name,
        period: `${lp.periodStart} to ${lp.periodEnd}`,
        status: lp.status,
        totalNet: parseFloat(lp.totalNet || '0'),
        payslipCount: lp.payslipCount || 0,
        warningCount: Array.isArray(lp.warnings) ? lp.warnings.length : 0,
      }
    : null;

  // 4. Attendance Today / Latest
  const [attStats] = await db
    .select({
      present: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Present' THEN 1 END)`,
      late: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Late' THEN 1 END)`,
      absent: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Absent' THEN 1 END)`,
      overtime: sql<number>`COUNT(CASE WHEN ${attendance.status} = 'Overtime' THEN 1 END)`,
      manualEdits: sql<number>`COUNT(CASE WHEN ${attendance.isManualEdit} = true THEN 1 END)`,
      total: count(),
    })
    .from(attendance);

  // 5. Time Off stats
  const [toStats] = await db
    .select({
      pending: sql<number>`COUNT(CASE WHEN ${timeOffRequests.status} = 'pending' THEN 1 END)`,
      approvedDays: sql<number>`COALESCE(SUM(CASE WHEN ${timeOffRequests.status} = 'approved' THEN ${timeOffRequests.duration} ELSE 0 END), 0)`,
    })
    .from(timeOffRequests);

  // 6. Policies count
  const [policyStats] = await db
    .select({
      total: count(),
      mandatory: sql<number>`COUNT(CASE WHEN ${companyPolicies.isMandatory} = true THEN 1 END)`,
    })
    .from(companyPolicies);

  return {
    headcount: {
      totalEmployees: Number(empStats?.total || 0),
      activeEmployees: Number(empStats?.active || 0),
      incompleteProfiles: Number(empStats?.incomplete || 0),
    },
    contracts: {
      activeContracts: Number(contractStats?.active || 0),
      draftContracts: Number(contractStats?.draft || 0),
      expiringWithin30Days: Number(contractStats?.expiringSoon || 0),
    },
    latestPayrun,
    attendanceToday: {
      present: Number(attStats?.present || 0),
      late: Number(attStats?.late || 0),
      absent: Number(attStats?.absent || 0),
      overtime: Number(attStats?.overtime || 0),
      manualEdits: Number(attStats?.manualEdits || 0),
      total: Number(attStats?.total || 0),
    },
    timeOff: {
      pendingRequests: Number(toStats?.pending || 0),
      approvedDaysThisMonth: parseFloat(String(toStats?.approvedDays || 0)),
    },
    policies: {
      totalPolicies: Number(policyStats?.total || 0),
      mandatoryPolicies: Number(policyStats?.mandatory || 0),
    },
  };
}

export async function getDepartmentSummary() {
  return db
    .select({
      departmentId: departments.id,
      departmentName: departments.name,
      employeeCount: sql<number>`COUNT(DISTINCT ${employees.id})`,
      totalWages: sql<number>`COALESCE(SUM(CASE WHEN ${contracts.status} = 'active' THEN ${contracts.wage} ELSE 0 END), 0)`,
    })
    .from(departments)
    .leftJoin(employees, eq(employees.departmentId, departments.id))
    .leftJoin(contracts, eq(contracts.employeeId, employees.id))
    .groupBy(departments.id, departments.name)
    .orderBy(desc(sql`COUNT(DISTINCT ${employees.id})`));
}

export async function getPendingLeaveRequestsWithDetails(limit = 5) {
  return db
    .select({
      requestId: timeOffRequests.id,
      employeeId: timeOffRequests.employeeId,
      employeeCode: employees.employeeCode,
      firstName: users.firstName,
      lastName: users.lastName,
      leaveType: timeOffTypes.name,
      startDate: timeOffRequests.startDate,
      endDate: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
    })
    .from(timeOffRequests)
    .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
    .innerJoin(users, eq(employees.userId, users.id))
    .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
    .where(eq(timeOffRequests.status, 'pending'))
    .orderBy(desc(timeOffRequests.createdAt))
    .limit(limit);
}

export async function searchEmployees(searchTerm: string, limit = 5) {
  const pattern = `%${searchTerm.trim()}%`;
  return db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      department: departments.name,
      position: jobPositions.title,
      status: employees.employmentStatus,
      dateOfJoining: employees.dateOfJoining,
      location: employees.location,
    })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .where(
      or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
        ilike(employees.employeeCode, pattern),
        ilike(jobPositions.title, pattern),
        ilike(departments.name, pattern),
      ),
    )
    .limit(limit);
}

export async function getAllPolicies() {
  return db
    .select({
      id: companyPolicies.id,
      title: companyPolicies.title,
      code: companyPolicies.code,
      category: companyPolicies.category,
      version: companyPolicies.version,
      summary: companyPolicies.summary,
      content: companyPolicies.content,
      isMandatory: companyPolicies.isMandatory,
    })
    .from(companyPolicies)
    .orderBy(companyPolicies.category, companyPolicies.title);
}

export async function getSalaryRulesStructure() {
  return db
    .select({
      structureId: salaryStructures.id,
      structureName: salaryStructures.name,
      structureCode: salaryStructures.code,
      ruleName: salaryRules.name,
      ruleCode: salaryRules.code,
      category: salaryRules.category,
      computationMethod: salaryRules.computationMethod,
      sequence: salaryRules.sequence,
      amount: salaryRules.amount,
      percentage: salaryRules.percentage,
      percentageOfCode: salaryRules.percentageOfCode,
      formula: salaryRules.formula,
    })
    .from(salaryStructures)
    .innerJoin(salaryRules, eq(salaryRules.structureId, salaryStructures.id))
    .where(eq(salaryStructures.isActive, true))
    .orderBy(salaryRules.sequence);
}

export async function getRecentPayruns(limit = 4) {
  return db
    .select({
      id: payruns.id,
      name: payruns.name,
      periodStart: payruns.periodStart,
      periodEnd: payruns.periodEnd,
      status: payruns.status,
      totalNet: payruns.totalNet,
      totalGross: payruns.totalGross,
      payslipCount: payruns.payslipCount,
      warningsCount: sql<number>`jsonb_array_length(COALESCE(${payruns.warnings}, '[]'::jsonb))`,
      createdAt: payruns.createdAt,
    })
    .from(payruns)
    .orderBy(desc(payruns.createdAt))
    .limit(limit);
}

export async function findPendingLeaveBySearch(searchTerm: string, limit = 5) {
  const pattern = `%${searchTerm.trim()}%`;
  return db
    .select({
      requestId: timeOffRequests.id,
      employeeId: timeOffRequests.employeeId,
      employeeCode: employees.employeeCode,
      firstName: users.firstName,
      lastName: users.lastName,
      leaveType: timeOffTypes.name,
      startDate: timeOffRequests.startDate,
      endDate: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
    })
    .from(timeOffRequests)
    .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
    .innerJoin(users, eq(employees.userId, users.id))
    .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
    .where(
      and(
        eq(timeOffRequests.status, 'pending'),
        or(
          ilike(users.firstName, pattern),
          ilike(users.lastName, pattern),
          ilike(employees.employeeCode, pattern),
          ilike(sql`concat(${users.firstName}, ' ', ${users.lastName})`, pattern),
          ilike(timeOffTypes.name, pattern),
          sql`${timeOffRequests.id}::text ILIKE ${pattern}`,
        ),
      ),
    )
    .limit(limit);
}

export async function findPendingLeaveById(requestId: string) {
  const [res] = await db
    .select({
      requestId: timeOffRequests.id,
      employeeId: timeOffRequests.employeeId,
      employeeCode: employees.employeeCode,
      firstName: users.firstName,
      lastName: users.lastName,
      leaveType: timeOffTypes.name,
      startDate: timeOffRequests.startDate,
      endDate: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
    })
    .from(timeOffRequests)
    .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
    .innerJoin(users, eq(employees.userId, users.id))
    .innerJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
    .where(and(eq(timeOffRequests.id, requestId), eq(timeOffRequests.status, 'pending')));
  return res || null;
}
