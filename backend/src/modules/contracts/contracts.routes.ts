import { Router } from 'express';
import * as contractsController from './contracts.controller';
import { authenticateToken, requirePermission } from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

router.get('/', requirePermission('contracts.read'), contractsController.listContracts);
router.get('/meta', requirePermission('contracts.read'), contractsController.getContractsMetadata);
router.get('/:id', requirePermission('contracts.read'), contractsController.getContractById);
router.post('/', requirePermission('contracts.write'), contractsController.createContract);
router.put('/:id', requirePermission('contracts.write'), contractsController.updateContract);

export default router;
