import { Router } from 'express';
import * as documentsController from './documents.controller';
import { authenticateToken } from '../../shared/auth-middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', documentsController.listPolicies);
router.get('/stats', documentsController.getComplianceStats);
router.get('/:id', documentsController.getPolicyById);
router.post('/accept-all', documentsController.acceptAllPolicies);
router.post('/:id/accept', documentsController.acceptPolicy);

export default router;
