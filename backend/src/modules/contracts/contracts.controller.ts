import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validateCreateContract, validateUpdateContract } from './contracts.validators';
import * as contractsService from './contracts.service';
import { z } from 'zod';

const contractsQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
});

export const listContracts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = contractsQuerySchema.parse(req.query);
  const contracts = await contractsService.listContracts(query.employeeId);
  res.json(contracts);
});

export const getContractsMetadata = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const meta = await contractsService.getContractsMetadata();
  res.json(meta);
});

export const getContractById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const contract = await contractsService.getContractById(req.params.id);
  res.json(contract);
});

export const createContract = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateCreateContract(req.body);
  const created = await contractsService.createContract(validated);
  res.status(201).json(created);
});

export const updateContract = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = validateUpdateContract(req.body);
  const updated = await contractsService.updateContract(req.params.id, validated);
  res.json(updated);
});
