import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  employeeListQuerySchema,
  validateCreateEmployee,
  validateUpdateEmployee,
} from './hr.validators';
import * as hrService from './hr.service';

export const listEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.query.page === undefined) {
    const employees = await hrService.listEmployees();
    res.json(employees);
    return;
  }

  const query = employeeListQuerySchema.parse(req.query);
  const employees = await hrService.listPaginatedEmployees(query);
  res.json(employees);
});

export const getMetadataOptions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const meta = await hrService.getMetadataOptions();
  res.json(meta);
});

export const getEmployeesForKanban = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const kanban = await hrService.getEmployeesForKanban();
  res.json(kanban);
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const employee = await hrService.getEmployeeById(req.params.id);
  res.json(employee);
});

export const getEmployeeHubDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const hubData = await hrService.getEmployeeHubDetails(req.params.id);
  res.json(hubData);
});

export const getEmployeePayslips = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const payslips = await hrService.getEmployeePayslips(req.params.id);
  res.json(payslips);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateEmployee(req.body);
  const created = await hrService.createEmployee(validated);
  res.status(201).json(created);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateUpdateEmployee(req.body);
  const updated = await hrService.updateEmployee(req.params.id, validated);
  res.json(updated);
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await hrService.deleteEmployee(req.params.id);
  res.status(204).send();
});
