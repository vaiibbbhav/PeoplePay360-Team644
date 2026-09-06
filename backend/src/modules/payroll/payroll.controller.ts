import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateSalaryStructure,
  validateCreateSalaryRule,
  validateCreatePayrunWizard,
} from './payroll.validators';
import * as payrollService from './payroll.service';
import { z } from 'zod';

const wizardEligibilityQuerySchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid periodStart format'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid periodEnd format'),
});

const listPayslipsQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  payrunId: z.string().uuid().optional(),
});

export const listSalaryStructures = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const structures = await payrollService.listSalaryStructures();
  res.json(structures);
});

export const getSalaryStructureById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const structure = await payrollService.getSalaryStructureById(req.params.id);
  res.json(structure);
});

export const createSalaryStructure = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateSalaryStructure(req.body);
  const created = await payrollService.createSalaryStructure(validated);
  res.status(201).json(created);
});

export const createSalaryRule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateSalaryRule(req.body);
  const created = await payrollService.createSalaryRule(validated);
  res.status(201).json(created);
});

export const listSalaryRules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const structureId = req.query.structureId as string | undefined;
  const rules = await payrollService.listSalaryRules(structureId);
  res.json(rules);
});

export const getEligibleEmployeesForPeriod = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = wizardEligibilityQuerySchema.parse(req.query);
  const eligible = await payrollService.getEligibleEmployeesForPeriod(query.periodStart, query.periodEnd);
  res.json(eligible);
});

export const listPayruns = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const payruns = await payrollService.listPayruns();
  res.json(payruns);
});

export const getPayrunById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payrun = await payrollService.getPayrunById(req.params.id);
  res.json(payrun);
});

export const createPayrunWizard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreatePayrunWizard(req.body);
  const payrun = await payrollService.createPayrunWizard(validated);
  res.status(201).json(payrun);
});

export const validatePayrun = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = await payrollService.validatePayrun(req.params.id);
  res.json(validated);
});

export const markPayrunPaid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const paid = await payrollService.markPayrunPaid(req.params.id);
  res.json(paid);
});

export const listPayslips = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = listPayslipsQuerySchema.parse(req.query);
  const employeeId =
    req.user?.role === 'Employee'
      ? req.user.employeeId
      : query.employeeId;
  const payslips = await payrollService.listPayslips({ employeeId, payrunId: query.payrunId });
  res.json(payslips);
});

export const getPayslipById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payslip = await payrollService.getPayslipById(req.params.id);
  if (req.user?.role === 'Employee' && payslip.employee_id !== req.user.employeeId) {
    res.status(403).json({ error: 'Employees may only access their own payslips' });
    return;
  }
  res.json(payslip);
});

export const sendPayslips = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await payrollService.sendPayrunPayslips(req.params.id);
  res.json(result);
});

export const sendAaravPayslip = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const targetEmail = (req.body?.email as string) || 'devanshnair.05@gmail.com';
  const result = await payrollService.sendAaravTestPayslipEmail(targetEmail);
  res.json(result);
});

export const sendIndividualPayslip = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customEmail = req.body?.recipientEmail as string | undefined;
  const result = await payrollService.sendSinglePayslip(req.params.id, customEmail);
  res.json(result);
});
