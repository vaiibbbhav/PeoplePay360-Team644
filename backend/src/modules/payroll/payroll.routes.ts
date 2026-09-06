import { Router } from 'express';
import * as payrollController from './payroll.controller';
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
  payrollController.listSalaryStructures,
);

router.get(
  '/structures/:id',
  requirePermission('payroll.structure.read'),
  payrollController.getSalaryStructureById,
);

router.post(
  '/structures',
  requirePermission('payroll.structure.write'),
  payrollController.createSalaryStructure,
);

// Salary Rules
router.get(
  '/rules',
  requirePermission('payroll.structure.read'),
  payrollController.listSalaryRules,
);

router.post(
  '/rules',
  requirePermission('payroll.rule.write'),
  payrollController.createSalaryRule,
);

// Payrun Wizard Step 1 Helper: List Eligible Employees
router.get(
  '/wizard/eligible-employees',
  requirePermission('payroll.payrun.create'),
  payrollController.getEligibleEmployeesForPeriod,
);

// Payruns
router.get(
  '/payruns',
  requirePermission('payroll.payrun.read'),
  payrollController.listPayruns,
);

router.get(
  '/payruns/:id',
  requirePermission('payroll.payrun.read'),
  payrollController.getPayrunById,
);

// Two-step Payrun creation (step 2 submit)
router.post(
  '/payruns',
  requirePermission('payroll.payrun.create'),
  payrollController.createPayrunWizard,
);

router.post(
  '/payruns/:id/validate',
  requirePermission('payroll.payrun.update'),
  payrollController.validatePayrun,
);

router.post(
  '/payruns/:id/mark-paid',
  requirePermission('payroll.payrun.update'),
  payrollController.markPayrunPaid,
);

router.post(
  '/payruns/:id/send-payslips',
  requirePermission('payroll.payrun.update'),
  payrollController.sendPayslips,
);

// Payslips
router.get(
  ['/payslips', '/'],
  requireAnyPermission(['payroll.payslip.read', 'payslip.self.read']),
  payrollController.listPayslips,
);

router.get(
  ['/payslips/:id', '/:id([0-9a-fA-F-]{36})'],
  requireAnyPermission(['payroll.payslip.read', 'payslip.self.read']),
  payrollController.getPayslipById,
);

router.post(
  ['/payslips/:id/send', '/:id([0-9a-fA-F-]{36})/send'],
  requireAnyPermission(['payroll.payrun.update', 'payroll.payslip.read']),
  payrollController.sendIndividualPayslip,
);

// Fast testing route for Aarav payslip email delivery
router.post(
  '/send-aarav-payslip',
  payrollController.sendAaravPayslip,
);

export default router;
