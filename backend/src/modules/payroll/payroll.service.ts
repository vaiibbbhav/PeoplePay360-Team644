import * as payrollRepo from './payroll.repository';
import * as contractsService from '../contracts/contracts.service';
import * as attendanceService from '../attendance/attendance.service';
import * as hrService from '../hr/hr.service';
import { computePayslipLines } from './rule-engine';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { roundToTwoDecimals } from '../../shared/formatters';
import { sendPayslipEmail } from '../../shared/mailer';
import { db } from '../../shared/db';
import { users, employees, payruns, payslips } from '../../db/schema';
import { eq, or, desc } from 'drizzle-orm';

function countPeriodDays(periodStart: string, periodEnd: string): number {
  const start = Date.parse(`${periodStart}T00:00:00Z`);
  const end = Date.parse(`${periodEnd}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new ValidationError('Payroll period end must be on or after period start');
  }
  return Math.floor((end - start) / 86_400_000) + 1;
}

import {
  CreateSalaryStructureInput,
  CreateSalaryRuleInput,
} from './payroll.validators';

export async function listSalaryStructures() {
  return await payrollRepo.findAllStructures();
}

export async function getSalaryStructureById(id: string) {
  const structure = await payrollRepo.findStructureById(id);
  if (!structure) {
    throw new NotFoundError(`Salary structure with ID ${id} not found`);
  }
  const rules = await payrollRepo.findRulesByStructureId(id);
  return { ...structure, rules };
}

export async function createSalaryStructure(data: CreateSalaryStructureInput) {
  return await payrollRepo.insertStructure(data);
}

export async function createSalaryRule(data: CreateSalaryRuleInput) {
  await getSalaryStructureById(data.structureId);
  return await payrollRepo.insertRule(data);
}

export async function listSalaryRules(structureId?: string) {
  return await payrollRepo.findAllRules(structureId);
}

export async function listPayruns() {
  return await payrollRepo.findAllPayruns();
}

export async function getPayrunById(id: string) {
  const payrun = await payrollRepo.findPayrunById(id);
  if (!payrun) {
    throw new NotFoundError(`Payrun with ID ${id} not found`);
  }
  const payslips = await payrollRepo.findPayslipsByPayrunId(id);
  return { ...payrun, payslips };
}

export async function getEligibleEmployeesForPeriod(periodStart: string, periodEnd: string) {
  const allEmployees = await hrService.listEmployees();
  if (allEmployees.length === 0) return [];

  const employeeIds = allEmployees.map((e) => e.id);
  const activeContracts = await contractsService.getActiveContractsForEmployees(
    employeeIds,
    periodStart,
    periodEnd,
  );

  const contractMap = new Map<string, (typeof activeContracts)[0]>();
  for (const c of activeContracts) {
    if (!contractMap.has(c.employee_id)) {
      contractMap.set(c.employee_id, c);
    }
  }

  return allEmployees.map((emp) => {
    const contract = contractMap.get(emp.id) || null;
    const hasActiveContract = Boolean(contract);
    const hasBankDetails = Boolean(emp.bank_account_number && emp.bank_name);

    return {
      employee: emp,
      hasActiveContract,
      activeContract: contract,
      hasBankDetails,
      eligible: hasActiveContract,
    };
  });
}

export async function createPayrunWizard(data: {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  employeeIds: string[];
  notes?: string | null;
}) {
  const totalPeriodDays = countPeriodDays(data.periodStart, data.periodEnd);
  const structure = await getSalaryStructureById(data.salaryStructureId);
  const rules = structure.rules || [];

  if (rules.length === 0) {
    throw new ValidationError('Selected salary structure has no rules configured');
  }

  let totalBasic = 0;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  const payrunWarnings: Array<{
    employeeId: string;
    message: string;
    severity: 'warning' | 'blocking';
  }> = [];
  const employeePayslips = [];

  for (const employeeId of data.employeeIds) {
    const employee = await hrService.getEmployeeById(employeeId);
    const contract = await contractsService.getActiveContractForPeriod(
      employeeId,
      data.periodStart,
      data.periodEnd,
    );

    const empWarnings: Array<{ message: string; severity: 'warning' | 'blocking' }> = [];

    if (!contract) {
      throw new ValidationError(
        `Employee ${employee.first_name} ${employee.last_name} has no active contract for this period`,
      );
    }

    if (!employee.bank_account_number) {
      empWarnings.push({
        message: 'Missing bank account information',
        severity: 'warning',
      });
    }

    const existingPayslip = await payrollRepo.findExistingPayslip(
      employeeId,
      data.periodStart,
      data.periodEnd,
    );
    if (existingPayslip) {
      empWarnings.push({
        message: `Duplicate payslip detected for period ${data.periodStart} to ${data.periodEnd}`,
        severity: 'blocking',
      });
    }

    const wage = contract ? parseFloat(contract.wage) : 0;
    const workedDays = await attendanceService.getWorkedDaysInPeriod(
      employeeId,
      data.periodStart,
      data.periodEnd,
    );
    const context = {
      results: {},
      contractWage: wage,
      workedDays,
      totalPeriodDays,
    };

    const lines = computePayslipLines(rules, context);

    let basic = 0;
    let gross = 0;
    let deductions = 0;
    let net = 0;

    for (const line of lines) {
      if (line.category === 'basic') basic += line.amount;
      else if (line.category === 'allowance') gross += line.amount;
      else if (line.category === 'gross') gross = line.amount;
      else if (line.category === 'deduction') deductions += line.amount;
      else if (line.category === 'net') net = line.amount;
    }

    if (gross === 0) gross = basic;
    if (net === 0) net = gross - deductions;

    basic = roundToTwoDecimals(basic);
    gross = roundToTwoDecimals(gross);
    deductions = roundToTwoDecimals(deductions);
    net = roundToTwoDecimals(net);

    totalBasic += basic;
    totalGross += gross;
    totalDeductions += deductions;
    totalNet += net;

    for (const w of empWarnings) {
      payrunWarnings.push({ employeeId, ...w });
    }

    employeePayslips.push({
      payslip: {
        employeeId,
        contractId: contract.id,
        structureId: data.salaryStructureId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        workedDays,
        basicSalary: basic,
        grossSalary: gross,
        totalDeductions: deductions,
        netSalary: net,
        warnings: empWarnings,
      },
      lines,
    });
  }

  let payrun;
  try {
    payrun = await payrollRepo.executeCreatePayrunTx(
      {
        name: data.name,
        salaryStructureId: data.salaryStructureId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        notes: data.notes,
      },
      employeePayslips,
      {
        basic: roundToTwoDecimals(totalBasic),
        gross: roundToTwoDecimals(totalGross),
        deductions: roundToTwoDecimals(totalDeductions),
        net: roundToTwoDecimals(totalNet),
        count: data.employeeIds.length,
        warnings: payrunWarnings,
      },
    );
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      throw new ConflictError('A payslip already exists for an employee in this payroll period');
    }
    throw error;
  }

  return await getPayrunById(payrun.id);
}

export async function validatePayrun(id: string) {
  const payrun = await getPayrunById(id);
  if (payrun.status !== 'computed' && payrun.status !== 'draft') {
    throw new ValidationError(`Cannot validate payrun with status '${payrun.status}'`);
  }

  const blockingWarnings = ((payrun.warnings as payrollRepo.PayrunWarning[]) || []).filter(
    (w) => w.severity === 'error' || (w.severity as string) === 'blocking',
  );
  if (blockingWarnings.length > 0) {
    throw new ValidationError(
      `Cannot validate payrun: ${blockingWarnings.length} blocking warning(s) found`,
    );
  }

  return await payrollRepo.updatePayrunStatus(id, 'validated');
}

export async function markPayrunPaid(id: string) {
  const payrun = await getPayrunById(id);
  if (payrun.status !== 'validated') {
    throw new ValidationError('Only validated payruns can be marked as paid');
  }
  return await payrollRepo.updatePayrunStatus(id, 'paid');
}

export async function listPayslips(filter?: { employeeId?: string; payrunId?: string }) {
  return await payrollRepo.findPayslips(filter);
}

export async function getPayslipById(id: string) {
  const payslip = await payrollRepo.findPayslipById(id);
  if (!payslip) {
    throw new NotFoundError(`Payslip with ID ${id} not found`);
  }
  return payslip;
}

export async function sendPayrunPayslips(id: string): Promise<{ sent: number; failed: number; total: number }> {
  const payrun = await getPayrunById(id);
  if (payrun.status !== 'paid') {
    throw new ValidationError('Payslips can only be sent for paid payruns');
  }

  const payslips = payrun.payslips ?? [];
  if (payslips.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const periodLabel = `${new Date(payrun.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

  let sent = 0;
  let failed = 0;

  for (const payslip of payslips) {
    if (!payslip.employee_email) {
      failed++;
      continue;
    }
    const result = await sendPayslipEmail({
      toEmail: payslip.employee_email,
      employeeName: payslip.employee_name,
      period: periodLabel,
      netSalary: Number(payslip.net_salary),
      grossSalary: Number(payslip.gross_salary),
      totalDeductions: Number(payslip.total_deductions),
      payrunName: payrun.name,
      payslipId: payslip.id,
    });
    if (result.success) sent++;
    else failed++;
  }

  return { sent, failed, total: payslips.length };
}

export async function sendSinglePayslip(
  payslipId: string,
  customEmail?: string,
): Promise<{ success: boolean; messageId?: string; error?: string; toEmail: string }> {
  const payslip = await payrollRepo.findPayslipById(payslipId);
  if (!payslip) {
    throw new NotFoundError(`Payslip with ID ${payslipId} not found`);
  }

  const toEmail = customEmail || payslip.employee_email;
  if (!toEmail) {
    throw new ValidationError('No recipient email address available for this payslip');
  }

  const periodLabel = `${new Date(payslip.period_start).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })}`;

  const result = await sendPayslipEmail({
    toEmail,
    employeeName: payslip.employee_name || 'Employee',
    period: periodLabel,
    netSalary: Number(payslip.net_salary),
    grossSalary: Number(payslip.gross_salary),
    totalDeductions: Number(payslip.total_deductions),
    payrunName: payslip.payrun_name || 'Regular Payrun',
    payslipId: payslip.id,
  });

  return { ...result, toEmail };
}

export async function sendAaravTestPayslipEmail(
  targetEmail: string = 'devanshnair.05@gmail.com',
): Promise<{ success: boolean; messageId?: string; error?: string; details?: Record<string, unknown> }> {
  try {
    // 1. Locate Aarav in users table (by email or firstName)
    let aaravUser = await db
      .select()
      .from(users)
      .where(or(eq(users.firstName, 'Aarav'), eq(users.email, 'aarav@company.com'), eq(users.email, targetEmail)))
      .limit(1)
      .then((rows) => rows[0]);

    if (aaravUser) {
      // Update Aarav's email to targetEmail so bulk sends also deliver to targetEmail
      if (aaravUser.email !== targetEmail) {
        await db
          .update(users)
          .set({ email: targetEmail, updatedAt: new Date() })
          .where(eq(users.id, aaravUser.id));
        aaravUser.email = targetEmail;
        console.log(`[AARAV PAYSIP] Updated Aarav user email in database to ${targetEmail}`);
      }
    }

    // 2. Locate employee record
    let employee = aaravUser
      ? await db
          .select()
          .from(employees)
          .where(eq(employees.userId, aaravUser.id))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    // 3. Find latest payslip for this employee
    let payslipRecord = employee
      ? await db
          .select()
          .from(payslips)
          .where(eq(payslips.employeeId, employee.id))
          .orderBy(desc(payslips.createdAt))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    // If no payslip found for Aarav specifically, use the latest payslip in DB
    if (!payslipRecord) {
      const existingPayslip = await db
        .select()
        .from(payslips)
        .orderBy(desc(payslips.createdAt))
        .limit(1)
        .then((rows) => rows[0]);

      if (existingPayslip) {
        payslipRecord = existingPayslip;
      }
    }

    // Find payrun info
    const payrunRecord = payslipRecord
      ? await db
          .select()
          .from(payruns)
          .where(eq(payruns.id, payslipRecord.payrunId))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    const employeeName = aaravUser ? `${aaravUser.firstName} ${aaravUser.lastName}` : 'Aarav Sharma';
    const periodLabel = payslipRecord
      ? new Date(payslipRecord.periodStart).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      : 'Aug 2026';
    const netSalary = payslipRecord ? Number(payslipRecord.netSalary) : 74500;
    const grossSalary = payslipRecord ? Number(payslipRecord.grossSalary) : 85000;
    const totalDeductions = payslipRecord ? Number(payslipRecord.totalDeductions) : 10500;
    const payrunName = payrunRecord?.name || 'August 2026 Regular Payrun';

    console.log(`[AARAV PAYSIP] Dispatching payslip email for ${employeeName} to ${targetEmail}...`);

    const result = await sendPayslipEmail({
      toEmail: targetEmail,
      employeeName,
      period: periodLabel,
      netSalary,
      grossSalary,
      totalDeductions,
      payrunName,
      payslipId: payslipRecord?.id,
    });

    console.log('[AARAV PAYSIP] Email send result:', result);

    return {
      ...result,
      details: {
        toEmail: targetEmail,
        employeeName,
        period: periodLabel,
        netSalary,
        grossSalary,
        totalDeductions,
        payrunName,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AARAV PAYSIP] Error in sendAaravTestPayslipEmail:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

