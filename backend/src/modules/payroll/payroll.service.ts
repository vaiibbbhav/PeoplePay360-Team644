import * as payrollRepo from './payroll.repository';
import * as contractsService from '../contracts/contracts.service';
import * as attendanceService from '../attendance/attendance.service';
import * as hrService from '../hr/hr.service';
import { computePayslipLines } from './rule-engine';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { roundToTwoDecimals } from '../../shared/formatters';

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

export async function createSalaryStructure(data: Record<string, unknown>) {
  return await payrollRepo.insertStructure(data);
}

export async function createSalaryRule(data: Record<string, unknown>) {
  await getSalaryStructureById(data.structureId as string);
  return await payrollRepo.insertRule(data);
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
  const eligible = [];

  for (const emp of allEmployees) {
    const contract = await contractsService.getActiveContractForPeriod(
      emp.id,
      periodStart,
      periodEnd,
    );
    const hasActiveContract = Boolean(contract);
    const hasBankDetails = Boolean(emp.bank_account_number && emp.bank_name);

    eligible.push({
      employee: emp,
      hasActiveContract,
      activeContract: contract,
      hasBankDetails,
      eligible: hasActiveContract,
    });
  }

  return eligible;
}

export async function createPayrunWizard(data: {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  employeeIds: string[];
  notes?: string | null;
}) {
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
      empWarnings.push({
        message: `Employee ${employee.first_name} ${employee.last_name} has no active contract for this period`,
        severity: 'blocking',
      });
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
    const effectiveWorkedDays = workedDays > 0 ? workedDays : 22;

    const context = {
      results: {},
      contractWage: wage,
      workedDays: effectiveWorkedDays,
      totalPeriodDays: 22,
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
        contractId: contract?.id || '00000000-0000-0000-0000-000000000000',
        structureId: data.salaryStructureId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        workedDays: effectiveWorkedDays,
        basicSalary: basic,
        grossSalary: gross,
        totalDeductions: deductions,
        netSalary: net,
        warnings: empWarnings,
      },
      lines,
    });
  }

  const payrun = await payrollRepo.executeCreatePayrunTx(
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

  return await getPayrunById(payrun.id);
}

export async function validatePayrun(id: string) {
  const payrun = await getPayrunById(id);
  if (payrun.status !== 'computed' && payrun.status !== 'draft') {
    throw new ValidationError(`Cannot validate payrun with status '${payrun.status}'`);
  }

  const blockingWarnings = ((payrun.warnings as any[]) || []).filter(
    (w) => w.severity === 'blocking',
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

export async function getPayslipById(id: string) {
  const payslip = await payrollRepo.findPayslipById(id);
  if (!payslip) {
    throw new NotFoundError(`Payslip with ID ${id} not found`);
  }
  return payslip;
}
