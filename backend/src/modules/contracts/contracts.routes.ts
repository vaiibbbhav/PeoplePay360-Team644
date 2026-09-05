import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validateCreateContract, validateUpdateContract } from './contracts.validators';
import * as contractsService from './contracts.service';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId as string | undefined;
    const contracts = await contractsService.listContracts(employeeId);
    res.json(contracts);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const contract = await contractsService.getContractById(req.params.id);
    res.json(contract);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const validated = validateCreateContract(req.body);
    const created = await contractsService.createContract(validated);
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const validated = validateUpdateContract(req.body);
    const updated = await contractsService.updateContract(req.params.id, validated);
    res.json(updated);
  }),
);

export default router;
