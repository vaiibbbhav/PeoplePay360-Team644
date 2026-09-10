import * as payrollRepo from './payroll.repository';
import * as contractsService from '../contracts/contracts.service';
import * as attendanceService from '../attendance/attendance.service';
import * as hrService from '../hr/hr.service';
import { computePayslipLines } from './rule-engine';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors';
import { roundToTwoDecimals } from '../../shared/formatters';
import { sendPayslipEmail } from '../../shared/mailer';
import { queuePayslipEmails, PayslipEmailJobData } from '../../shared/queue';

function countPeriodDays(periodStart: string, periodEnd: string): number {
  const start = Date.parse(`${periodStart}T00:00:00Z`);
  const end = Date.parse(`${periodEnd}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new ValidationError('Payroll period end must be on or after period start');
  }
  return Math.floor((end - start) / 86_400_000) + 1;
}

import { CreateSalaryStructureInput, CreateSalaryRuleInput } from './payroll.validators';

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

export async function sendPayrunPayslips(
  id: string,
): Promise<{ sent: number; failed: number; total: number; queuedCount: number; mode: string }> {
  const payrun = await getPayrunById(id);
  if (payrun.status !== 'paid' && payrun.status !== 'sent') {
    throw new ValidationError('Payslips can only be sent for paid payruns');
  }

  const payslips = payrun.payslips ?? [];
  const periodLabel = `${new Date(payrun.period_start).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })}`;

  const emailJobs: PayslipEmailJobData[] = payslips
    .filter((p) => Boolean(p.employee_email))
    .map((p) => ({
      payslipId: p.id,
      employeeName: p.employee_name || 'Employee',
      toEmail: p.employee_email as string,
      period: periodLabel,
      netSalary: Number(p.net_salary),
      grossSalary: Number(p.gross_salary),
      totalDeductions: Number(p.total_deductions),
      payrunName: payrun.name,
    }));

  const queueResult = await queuePayslipEmails(emailJobs);

  return {
    sent: emailJobs.length,
    failed: 0,
    total: payslips.length,
    queuedCount: queueResult.queuedCount,
    mode: queueResult.mode,
  };
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

export async function sendAaravTestPayslipEmail(targetEmail?: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  details?: Record<string, unknown>;
}> {
  try {
    const recipient = targetEmail || process.env.SMTP_USER || 'employee@company.com';

    const latest = await payrollRepo.findLatestPayslipWithPayrun();
    if (!latest || !latest.payslip) {
      throw new NotFoundError('No payslip records available to dispatch');
    }
    const payslipRecord = latest.payslip;
    const payrunRecord = latest.payrun;

    const periodLabel = new Date(payslipRecord.periodStart).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });

    const result = await sendPayslipEmail({
      toEmail: recipient,
      employeeName: 'Aarav Sharma',
      period: periodLabel,
      netSalary: Number(payslipRecord.netSalary),
      grossSalary: Number(payslipRecord.grossSalary),
      totalDeductions: Number(payslipRecord.totalDeductions),
      payrunName: payrunRecord?.name || 'Regular Payrun',
      payslipId: payslipRecord.id,
    });

    return {
      ...result,
      details: {
        toEmail: recipient,
        period: periodLabel,
        payrunName: payrunRecord?.name,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[TEST PAYSLIP] Error sending test payslip email:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
