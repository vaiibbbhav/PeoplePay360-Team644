import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as documentsService from './documents.service';
import {
  acceptPolicySchema,
  validateCreatePolicy,
  validateUpdatePolicy,
} from './documents.validators';
import { UnauthorizedError } from '../../shared/errors';

export const listPolicies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();
  const result = await documentsService.getPoliciesForUser(userId);
  res.json(result);
});

export const getPolicyById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();
  const policy = await documentsService.getPolicyById(req.params.id, userId);
  res.json(policy);
});

export const acceptPolicy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) throw new UnauthorizedError();
  const input = acceptPolicySchema.parse(req.body || {});
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const updated = await documentsService.acceptPolicy(
    req.params.id,
    { id: user.id, employeeId: user.employeeId },
    { version: input.policyVersion, ipAddress, userAgent },
  );
  res.status(200).json(updated);
});

export const acceptAllPolicies = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) throw new UnauthorizedError();
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const overview = await documentsService.acceptAllPolicies(
      { id: user.id, employeeId: user.employeeId },
      { ipAddress, userAgent },
    );
    res.status(200).json(overview);
  },
);

export const getComplianceStats = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const stats = await documentsService.getCompanyComplianceStats();
    res.json(stats);
  },
);

export const createPolicy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validateCreatePolicy(req.body);
  const created = await documentsService.createPolicy(input);
  res.status(201).json(created);
});

export const updatePolicy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validateUpdatePolicy(req.body);
  const updated = await documentsService.updatePolicy(req.params.id, input);
  res.json(updated);
});

export const deletePolicy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await documentsService.deletePolicy(req.params.id);
  res.json(result);
});

export const getComplianceRoster = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const roster = await documentsService.getCompanyComplianceRoster();
    res.json(roster);
  },
);

