import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateSalaryStructure,
  validateCreateSalaryRule,
  validateCreatePayrunWizard,
} from './payroll.validators';
import * as payrollService from './payroll.service';
import {
  authenticateToken,
  requireAnyPermission,
  requirePermission,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

// Salary Structures
router.get(
  '/structures',
  requirePermission('payroll.structure.read'),
  asyncHandler(async (_req, res) => {
    const structures = await payrollService.listSalaryStructures();
    res.json(structures);
  }),
);

router.get(
  '/structures/:id',
  requirePermission('payroll.structure.read'),
  asyncHandler(async (req, res) => {
    const structure = await payrollService.getSalaryStructureById(req.params.id);
    res.json(structure);
  }),
);

router.post(
  '/structures',
  requirePermission('payroll.structure.write'),
  asyncHandler(async (req, res) => {
    const validated = validateCreateSalaryStructure(req.body);
    const created = await payrollService.createSalaryStructure(validated);
    res.status(201).json(created);
  }),
);

// Salary Rules
router.post(
  '/rules',
  requirePermission('payroll.rule.write'),
  asyncHandler(async (req, res) => {
    const validated = validateCreateSalaryRule(req.body);
    const created = await payrollService.createSalaryRule(validated);
    res.status(201).json(created);
  }),
);

// Payrun Wizard Step 1 Helper: List Eligible Employees
router.get(
  '/wizard/eligible-employees',
  requirePermission('payroll.payrun.create'),
  asyncHandler(async (req, res) => {
    const periodStart = req.query.periodStart as string;
    const periodEnd = req.query.periodEnd as string;
    const eligible = await payrollService.getEligibleEmployeesForPeriod(periodStart, periodEnd);
    res.json(eligible);
  }),
);

// Payruns
router.get(
  '/payruns',
  requirePermission('payroll.payrun.read'),
  asyncHandler(async (_req, res) => {
    const payruns = await payrollService.listPayruns();
    res.json(payruns);
  }),
);

router.get(
  '/payruns/:id',
  requirePermission('payroll.payrun.read'),
  asyncHandler(async (req, res) => {
    const payrun = await payrollService.getPayrunById(req.params.id);
    res.json(payrun);
  }),
);

// Two-step Payrun creation (step 2 submit)
router.post(
  '/payruns',
  requirePermission('payroll.payrun.create'),
  asyncHandler(async (req, res) => {
    const validated = validateCreatePayrunWizard(req.body);
    const payrun = await payrollService.createPayrunWizard(validated);
    res.status(201).json(payrun);
  }),
);

router.post(
  '/payruns/:id/validate',
  requirePermission('payroll.payrun.update'),
  asyncHandler(async (req, res) => {
    const validated = await payrollService.validatePayrun(req.params.id);
    res.json(validated);
  }),
);

router.post(
  '/payruns/:id/mark-paid',
  requirePermission('payroll.payrun.update'),
  asyncHandler(async (req, res) => {
    const paid = await payrollService.markPayrunPaid(req.params.id);
    res.json(paid);
  }),
);

// Payslips
router.get(
  ['/payslips', '/'],
  requireAnyPermission(['payroll.payslip.read', 'payslip.self.read']),
  asyncHandler(async (req, res) => {
    const employeeId =
      req.user?.role === 'Employee'
        ? req.user.employeeId
        : (req.query.employeeId as string | undefined);
    const payrunId = req.query.payrunId as string | undefined;
    const payslips = await payrollService.listPayslips({ employeeId, payrunId });
    res.json(payslips);
  }),
);

router.get(
  ['/payslips/:id', '/:id'],
  requireAnyPermission(['payroll.payslip.read', 'payslip.self.read']),
  asyncHandler(async (req, res) => {
    const payslip = await payrollService.getPayslipById(req.params.id);
    if (req.user?.role === 'Employee' && payslip.employee_id !== req.user.employeeId) {
      res.status(403).json({ error: 'Employees may only access their own payslips' });
      return;
    }
    res.json(payslip);
  }),
);

export default router;
