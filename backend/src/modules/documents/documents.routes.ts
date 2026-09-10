import { Router } from 'express';
import * as documentsController from './documents.controller';
import { authenticateToken, requireRole } from '../../shared/auth-middleware';

const router = Router();

router.use(authenticateToken);

// Reading & stats
router.get('/', documentsController.listPolicies);
router.get('/stats', documentsController.getComplianceStats);
router.get(
  '/admin/compliance',
  requireRole(['Admin', 'HR Manager', 'HR Payroll Manager']),
  documentsController.getComplianceRoster,
);
router.get('/:id', documentsController.getPolicyById);

// Acceptance
router.post('/accept-all', documentsController.acceptAllPolicies);
router.post('/:id/accept', documentsController.acceptPolicy);

// Management (HR Manager / Admin only)
router.post(
  '/',
  requireRole(['Admin', 'HR Manager', 'HR Payroll Manager']),
  documentsController.createPolicy,
);
router.put(
  '/:id',
  requireRole(['Admin', 'HR Manager', 'HR Payroll Manager']),
  documentsController.updatePolicy,
);
router.delete(
  '/:id',
  requireRole(['Admin', 'HR Manager', 'HR Payroll Manager']),
  documentsController.deletePolicy,
);

export default router;
