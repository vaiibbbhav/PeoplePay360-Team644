import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateSalaryStructure,
  validateCreateSalaryRule,
  validateCreatePayrunWizard,
} from './payroll.validators';
import * as payrollService from './payroll.service';

const router = Router();

// Salary Structures
router.get('/structures', asyncHandler(async (_req, res) => {
  const structures = await payrollService.listSalaryStructures();
  res.json(structures);
}));

router.get('/structures/:id', asyncHandler(async (req, res) => {
  const structure = await payrollService.getSalaryStructureById(req.params.id);
  res.json(structure);
}));

router.post('/structures', asyncHandler(async (req, res) => {
  const validated = validateCreateSalaryStructure(req.body);
  const created = await payrollService.createSalaryStructure(validated);
  res.status(201).json(created);
}));

// Salary Rules
router.post('/rules', asyncHandler(async (req, res) => {
  const validated = validateCreateSalaryRule(req.body);
  const created = await payrollService.createSalaryRule(validated);
  res.status(201).json(created);
}));

// Payrun Wizard Step 1 Helper: List Eligible Employees
router.get('/wizard/eligible-employees', asyncHandler(async (req, res) => {
  const periodStart = req.query.periodStart as string;
  const periodEnd = req.query.periodEnd as string;
  const eligible = await payrollService.getEligibleEmployeesForPeriod(periodStart, periodEnd);
  res.json(eligible);
}));

// Payruns
router.get('/payruns', asyncHandler(async (_req, res) => {
  const payruns = await payrollService.listPayruns();
  res.json(payruns);
}));

router.get('/payruns/:id', asyncHandler(async (req, res) => {
  const payrun = await payrollService.getPayrunById(req.params.id);
  res.json(payrun);
}));

// Two-step Payrun creation (step 2 submit)
router.post('/payruns', asyncHandler(async (req, res) => {
  const validated = validateCreatePayrunWizard(req.body);
  const payrun = await payrollService.createPayrunWizard(validated);
  res.status(201).json(payrun);
}));

router.post('/payruns/:id/validate', asyncHandler(async (req, res) => {
  const validated = await payrollService.validatePayrun(req.params.id);
  res.json(validated);
}));

router.post('/payruns/:id/mark-paid', asyncHandler(async (req, res) => {
  const paid = await payrollService.markPayrunPaid(req.params.id);
  res.json(paid);
}));

// Payslips
router.get('/payslips/:id', asyncHandler(async (req, res) => {
  const payslip = await payrollService.getPayslipById(req.params.id);
  res.json(payslip);
}));

export default router;
