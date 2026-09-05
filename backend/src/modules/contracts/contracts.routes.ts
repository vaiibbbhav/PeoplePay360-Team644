import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { validateCreateContract, validateUpdateContract } from './contracts.validators';
import * as contractsService from './contracts.service';
import { authenticateToken, requirePermission } from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

router.get(
  '/',
  requirePermission('contracts.read'),
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId as string | undefined;
    const contracts = await contractsService.listContracts(employeeId);
    res.json(contracts);
  }),
);

router.get(
  '/meta',
  requirePermission('contracts.read'),
  asyncHandler(async (_req, res) => {
    const meta = await contractsService.getContractsMetadata();
    res.json(meta);
  }),
);

router.get(
  '/:id',
  requirePermission('contracts.read'),
  asyncHandler(async (req, res) => {
    const contract = await contractsService.getContractById(req.params.id);
    res.json(contract);
  }),
);

router.post(
  '/',
  requirePermission('contracts.write'),
  asyncHandler(async (req, res) => {
    const validated = validateCreateContract(req.body);
    const created = await contractsService.createContract(validated);
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  requirePermission('contracts.write'),
  asyncHandler(async (req, res) => {
    const validated = validateUpdateContract(req.body);
    const updated = await contractsService.updateContract(req.params.id, validated);
    res.json(updated);
  }),
);

export default router;
