import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validateCreateEmployee, validateUpdateEmployee } from './hr.validators';
import * as hrService from './hr.service';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const employees = await hrService.listEmployees();
    res.json(employees);
  }),
);

router.get(
  '/kanban',
  asyncHandler(async (_req, res) => {
    const kanban = await hrService.getEmployeesForKanban();
    res.json(kanban);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const employee = await hrService.getEmployeeById(req.params.id);
    res.json(employee);
  }),
);

router.get(
  '/:id/hub',
  asyncHandler(async (req, res) => {
    const hubData = await hrService.getEmployeeHubDetails(req.params.id);
    res.json(hubData);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const validated = validateCreateEmployee(req.body);
    const created = await hrService.createEmployee(validated);
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const validated = validateUpdateEmployee(req.body);
    const updated = await hrService.updateEmployee(req.params.id, validated);
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await hrService.deleteEmployee(req.params.id);
    res.status(204).send();
  }),
);

export default router;
