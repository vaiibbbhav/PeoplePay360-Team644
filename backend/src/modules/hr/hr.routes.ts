import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validateCreateEmployee, validateUpdateEmployee } from './hr.validators';
import * as hrService from './hr.service';
import {
  authenticateToken,
  requirePermission,
  requireEmployeeRead,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

router.get(
  '/',
  requirePermission('employee.read'),
  asyncHandler(async (_req, res) => {
    const employees = await hrService.listEmployees();
    res.json(employees);
  }),
);

router.get(
  '/meta',
  requirePermission('employee.read'),
  asyncHandler(async (_req, res) => {
    const meta = await hrService.getMetadataOptions();
    res.json(meta);
  }),
);

router.get(
  '/kanban',
  requirePermission('employee.read'),
  asyncHandler(async (_req, res) => {
    const kanban = await hrService.getEmployeesForKanban();
    res.json(kanban);
  }),
);

router.get(
  '/:id',
  requireEmployeeRead,
  asyncHandler(async (req, res) => {
    const employee = await hrService.getEmployeeById(req.params.id);
    res.json(employee);
  }),
);

router.get(
  '/:id/hub',
  requireEmployeeRead,
  asyncHandler(async (req, res) => {
    const hubData = await hrService.getEmployeeHubDetails(req.params.id);
    res.json(hubData);
  }),
);

router.get(
  '/:id/payslips',
  requireEmployeeRead,
  asyncHandler(async (req, res) => {
    const payslips = await hrService.getEmployeePayslips(req.params.id);
    res.json(payslips);
  }),
);

router.post(
  '/',
  requirePermission('employee.write'),
  asyncHandler(async (req, res) => {
    const validated = validateCreateEmployee(req.body);
    const created = await hrService.createEmployee(validated);
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  requirePermission('employee.write'),
  asyncHandler(async (req, res) => {
    const validated = validateUpdateEmployee(req.body);
    const updated = await hrService.updateEmployee(req.params.id, validated);
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  requirePermission('employee.delete'),
  asyncHandler(async (req, res) => {
    await hrService.deleteEmployee(req.params.id);
    res.status(204).send();
  }),
);

export default router;
