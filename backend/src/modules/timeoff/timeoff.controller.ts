import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateTimeOffType,
  validateCreateAllocation,
  validateCreateRequest,
} from './timeoff.validators';
import * as timeoffService from './timeoff.service';
import { z } from 'zod';

const balancesQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
});

const allocationsQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
});

const requestsQuerySchema = z.object({
  scope: z.string().optional(),
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
});

export const getTimeOffMeta = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const isManager = await timeoffService.hasDirectReports(req.user?.employeeId);
  res.json({
    isManager,
    employeeId: req.user?.employeeId || null,
    role: req.user?.role || 'Employee',
  });
});

export const getEmployeeBalances = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = balancesQuerySchema.parse(req.query);
  const employeeId =
    req.user?.role === 'Employee'
      ? req.user.employeeId
      : query.employeeId || req.user?.employeeId;

  if (!employeeId) {
    res.json([]);
    return;
  }

  const balances = await timeoffService.getEmployeeBalances(employeeId);
  res.json(balances);
});

export const listTimeOffTypes = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const types = await timeoffService.listTimeOffTypes();
  res.json(types);
});

export const createTimeOffType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateTimeOffType(req.body);
  const created = await timeoffService.createTimeOffType(validated);
  res.status(201).json(created);
});

export const listAllocations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = allocationsQuerySchema.parse(req.query);
  const employeeId =
    req.user?.role === 'Employee'
      ? req.user.employeeId
      : query.employeeId;
  const allocations = await timeoffService.listAllocations(employeeId);
  res.json(allocations);
});

export const createAllocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateAllocation(req.body);
  const created = await timeoffService.createAllocation(validated);
  res.status(201).json(created);
});

export const approveAllocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const approverId = req.user?.id;
  const approved = await timeoffService.approveAllocation(req.params.id, approverId);
  res.json(approved);
});

export const listRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = requestsQuerySchema.parse(req.query);

  if (query.scope === 'team') {
    const managerId = req.user?.employeeId;
    if (!managerId) {
      res.json([]);
      return;
    }
    const requests = await timeoffService.listRequests({
      managerId,
      status: query.status,
    });
    res.json(requests);
    return;
  }

  if (req.user?.role === 'Employee') {
    const requests = await timeoffService.listRequests({
      employeeId: req.user.employeeId,
      status: query.status,
    });
    res.json(requests);
    return;
  }

  const requests = await timeoffService.listRequests({
    employeeId: query.employeeId,
    status: query.status,
  });
  res.json(requests);
});

export const getRequestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const request = await timeoffService.getRequestById(req.params.id);
  const isHrOrAdmin = [
    'Admin',
    'HR Manager',
    'HR Payroll Manager',
    'HR Payroll User',
  ].includes(req.user?.role || '');

  if (!isHrOrAdmin && req.user?.employeeId !== request.employee_id) {
    if (req.user?.employeeId !== request.manager_id) {
      res.status(403).json({ error: 'You are not authorized to view this request' });
      return;
    }
  }
  res.json(request);
});

export const createRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateRequest(req.body);
  const created = await timeoffService.createRequest(validated);
  res.status(201).json(created);
});

export const approveRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user ? { id: req.user.id, role: req.user.role, employeeId: req.user.employeeId } : undefined;
  const approved = await timeoffService.approveRequest(req.params.id, user);
  res.json(approved);
});

export const refuseRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reason = req.body?.reason as string | undefined;
  const user = req.user ? { id: req.user.id, role: req.user.role, employeeId: req.user.employeeId } : undefined;
  const refused = await timeoffService.refuseRequest(req.params.id, reason, user);
  res.json(refused);
});
