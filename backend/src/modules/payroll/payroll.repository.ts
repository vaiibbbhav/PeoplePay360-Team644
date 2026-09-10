import { db } from '../../shared/db';
import {
  salaryStructures,
  salaryRules,
  payruns,
  payslips,
  payslipLines,
  employees,
  users,
  departments,
  jobPositions,
} from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { PayslipLine, SalaryRule, ComputationMethod } from './rule-engine';

export type CreateStructureData = {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
};

export type CreateRuleData = {
  structureId: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  computationMethod: ComputationMethod;
  amount?: number | string | null;
  percentageOfCode?: string | null;
  percentage?: number | string | null;
  formula?: string | null;
};

export async function findAllStructures() {
  return await db.select().from(salaryStructures).orderBy(salaryStructures.name);
}

export async function findStructureById(id: string) {
  const rows = await db.select().from(salaryStructures).where(eq(salaryStructures.id, id)).limit(1);
  return rows[0] || null;
}

export async function insertStructure(data: CreateStructureData) {
  const [created] = await db
    .insert(salaryStructures)
    .values({
      name: data.name,
      code: data.code,
      description: data.description || null,
      isActive: data.isActive ?? true,
    })
    .returning();
  return created;
}

export async function findRulesByStructureId(structureId: string): Promise<SalaryRule[]> {
  const rows = await db
    .select()
    .from(salaryRules)
    .where(eq(salaryRules.structureId, structureId))
    .orderBy(salaryRules.sequence);

  return rows.map((r) => ({
    id: r.id,
    structureId: r.structureId,
    name: r.name,
    code: r.code,
    category: r.category,
    sequence: r.sequence,
    computationMethod: r.computationMethod as ComputationMethod,
    amount: r.amount ? parseFloat(r.amount) : 0,
    percentageOfCode: r.percentageOfCode || undefined,
    percentage: r.percentage ? parseFloat(r.percentage) : undefined,
    formula: r.formula || undefined,
  }));
}

export async function findAllRules(structureId?: string): Promise<SalaryRule[]> {
  const baseQuery = db.select().from(salaryRules);
  const rows = structureId
    ? await baseQuery.where(eq(salaryRules.structureId, structureId)).orderBy(salaryRules.sequence)
    : await baseQuery.orderBy(salaryRules.sequence);

  return rows.map((r) => ({
    id: r.id,
    structureId: r.structureId,
    name: r.name,
    code: r.code,
    category: r.category,
    sequence: r.sequence,
    computationMethod: r.computationMethod as ComputationMethod,
    amount: r.amount ? parseFloat(r.amount) : 0,
    percentageOfCode: r.percentageOfCode || undefined,
    percentage: r.percentage ? parseFloat(r.percentage) : undefined,
    formula: r.formula || undefined,
  }));
}

export async function insertRule(data: CreateRuleData) {
  const [created] = await db
    .insert(salaryRules)
    .values({
      structureId: data.structureId,
      name: data.name,
      code: data.code,
      category: data.category,
      sequence: data.sequence,
      computationMethod: data.computationMethod,
      amount: String(data.amount || 0),
      percentageOfCode: data.percentageOfCode || null,
      percentage: data.percentage ? String(data.percentage) : null,
      formula: data.formula || null,
    })
    .returning();
  return created;
}

export async function findAllPayruns() {
  return await db
    .select({
      id: payruns.id,
      name: payruns.name,
      salary_structure_id: payruns.salaryStructureId,
      salary_structure_name: salaryStructures.name,
      period_start: payruns.periodStart,
      period_end: payruns.periodEnd,
      status: payruns.status,
      total_basic: payruns.totalBasic,
      total_gross: payruns.totalGross,
      total_deductions: payruns.totalDeductions,
      total_net: payruns.totalNet,
      payslip_count: payruns.payslipCount,
      warnings: payruns.warnings,
      notes: payruns.notes,
      created_at: payruns.createdAt,
    })
    .from(payruns)
    .leftJoin(salaryStructures, eq(payruns.salaryStructureId, salaryStructures.id))
    .orderBy(desc(payruns.createdAt));
}

export async function findPayrunById(id: string) {
  const rows = await db
    .select({
      id: payruns.id,
      name: payruns.name,
      salary_structure_id: payruns.salaryStructureId,
      salary_structure_name: salaryStructures.name,
      period_start: payruns.periodStart,
      period_end: payruns.periodEnd,
      status: payruns.status,
      total_basic: payruns.totalBasic,
      total_gross: payruns.totalGross,
      total_deductions: payruns.totalDeductions,
      total_net: payruns.totalNet,
      payslip_count: payruns.payslipCount,
      warnings: payruns.warnings,
      notes: payruns.notes,
      created_at: payruns.createdAt,
    })
    .from(payruns)
    .leftJoin(salaryStructures, eq(payruns.salaryStructureId, salaryStructures.id))
    .where(eq(payruns.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function updatePayrunStatus(id: string, status: string) {
  const [updated] = await db
    .update(payruns)
    .set({ status, updatedAt: new Date() })
    .where(eq(payruns.id, id))
    .returning();

  // Cascade status to child payslips in this payrun
  await db.update(payslips).set({ status, updatedAt: new Date() }).where(eq(payslips.payrunId, id));

  return updated || null;
}

export async function findPayslipsByPayrunId(payrunId: string) {
  return await db
    .select({
      id: payslips.id,
      payrun_id: payslips.payrunId,
      employee_id: payslips.employeeId,
      employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      employee_email: users.email,
      structure_id: payslips.structureId,
      structure_name: salaryStructures.name,
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
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(salaryStructures, eq(payslips.structureId, salaryStructures.id))
    .where(eq(payslips.payrunId, payrunId));
}

export async function findPayslips(filter?: { employeeId?: string; payrunId?: string }) {
  let query = db
    .select({
      id: payslips.id,
      payrun_id: payslips.payrunId,
      payrun_name: payruns.name,
      payrun_status: payruns.status,
      employee_id: payslips.employeeId,
      employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      employee_email: users.email,
      structure_id: payslips.structureId,
      structure_name: salaryStructures.name,
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
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(salaryStructures, eq(payslips.structureId, salaryStructures.id))
    .leftJoin(payruns, eq(payslips.payrunId, payruns.id))
    .$dynamic();

  if (filter?.employeeId && filter?.payrunId) {
    query = query.where(
      and(eq(payslips.employeeId, filter.employeeId), eq(payslips.payrunId, filter.payrunId)),
    );
  } else if (filter?.employeeId) {
    query = query.where(eq(payslips.employeeId, filter.employeeId));
  } else if (filter?.payrunId) {
    query = query.where(eq(payslips.payrunId, filter.payrunId));
  }

  return await query.orderBy(desc(payslips.periodStart));
}

export async function findPayslipById(id: string) {
  const rows = await db
    .select({
      id: payslips.id,
      payrun_id: payslips.payrunId,
      payrun_name: payruns.name,
      employee_id: payslips.employeeId,
      employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      employee_email: users.email,
      employee_phone: employees.phone,
      identification_number: employees.identificationNumber,
      bank_name: employees.bankName,
      bank_account_number: employees.bankAccountNumber,
      bank_routing_code: employees.bankRoutingCode,
      department_name: departments.name,
      job_position_title: jobPositions.title,
      structure_id: payslips.structureId,
      structure_name: salaryStructures.name,
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
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .leftJoin(salaryStructures, eq(payslips.structureId, salaryStructures.id))
    .leftJoin(payruns, eq(payslips.payrunId, payruns.id))
    .where(eq(payslips.id, id))
    .limit(1);

  if (!rows[0]) return null;

  const lines = await db
    .select()
    .from(payslipLines)
    .where(eq(payslipLines.payslipId, id))
    .orderBy(payslipLines.sequence);

  return { ...rows[0], lines };
}

export async function findExistingPayslip(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
) {
  const rows = await db
    .select()
    .from(payslips)
    .where(
      and(
        eq(payslips.employeeId, employeeId),
        eq(payslips.periodStart, periodStart),
        eq(payslips.periodEnd, periodEnd),
      ),
    )
    .limit(1);

  return rows[0] || null;
}

export type PayrunWarning = {
  code?: string;
  message: string;
  severity: 'warning' | 'error' | 'blocking' | 'info';
  employeeId?: string;
  employeeName?: string;
};

export type PayrunInsertData = {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  notes?: string | null;
};

export type PayslipInsertData = {
  employeeId: string;
  contractId: string;
  structureId: string;
  periodStart: string;
  periodEnd: string;
  workedDays: number | string;
  basicSalary: number | string;
  grossSalary: number | string;
  totalDeductions: number | string;
  netSalary: number | string;
  warnings?: unknown[];
};

export async function executeCreatePayrunTx(
  payrunData: PayrunInsertData,
  employeePayslips: Array<{
    payslip: PayslipInsertData;
    lines: PayslipLine[];
  }>,
  totals: {
    basic: number;
    gross: number;
    deductions: number;
    net: number;
    count: number;
    warnings: PayrunWarning[];
  },
) {
  return await db.transaction(async (tx) => {
    const [payrun] = await tx
      .insert(payruns)
      .values({
        name: payrunData.name,
        salaryStructureId: payrunData.salaryStructureId,
        periodStart: payrunData.periodStart,
        periodEnd: payrunData.periodEnd,
        status: 'computed',
        totalBasic: String(totals.basic),
        totalGross: String(totals.gross),
        totalDeductions: String(totals.deductions),
        totalNet: String(totals.net),
        payslipCount: totals.count,
        warnings: totals.warnings,
        notes: payrunData.notes || null,
      })
      .returning();

    if (employeePayslips.length > 0) {
      const insertedPayslips = await tx
        .insert(payslips)
        .values(
          employeePayslips.map((item) => ({
            payrunId: payrun.id,
            employeeId: item.payslip.employeeId,
            contractId: item.payslip.contractId,
            structureId: item.payslip.structureId,
            periodStart: item.payslip.periodStart,
            periodEnd: item.payslip.periodEnd,
            workedDays: String(item.payslip.workedDays),
            basicSalary: String(item.payslip.basicSalary),
            grossSalary: String(item.payslip.grossSalary),
            totalDeductions: String(item.payslip.totalDeductions),
            netSalary: String(item.payslip.netSalary),
            status: 'computed',
            warnings: item.payslip.warnings,
          })),
        )
        .returning();

      const allLinesToInsert: Array<{
        payslipId: string;
        ruleId: string | null;
        code: string;
        name: string;
        category: string;
        sequence: number;
        amount: string;
      }> = [];

      for (let i = 0; i < insertedPayslips.length; i++) {
        const savedPayslip = insertedPayslips[i];
        const lines = employeePayslips[i]?.lines || [];
        for (const l of lines) {
          allLinesToInsert.push({
            payslipId: savedPayslip.id,
            ruleId: l.ruleId || null,
            code: l.code,
            name: l.name,
            category: l.category,
            sequence: l.sequence,
            amount: String(l.amount),
          });
        }
      }

      if (allLinesToInsert.length > 0) {
        await tx.insert(payslipLines).values(allLinesToInsert);
      }
    }

    return payrun;
  });
}
