import { Router } from 'express';
import * as hrController from './hr.controller';
import {
  authenticateToken,
  requirePermission,
  requireEmployeeRead,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

// Employee listings and metadata
router.get('/', requirePermission('employee.read'), hrController.listEmployees);
router.get('/meta', requirePermission('employee.read'), hrController.getMetadataOptions);
router.get('/kanban', requirePermission('employee.read'), hrController.getEmployeesForKanban);

// Individual employee operational views
router.get('/:id', requireEmployeeRead, hrController.getEmployeeById);
router.get('/:id/hub', requireEmployeeRead, hrController.getEmployeeHubDetails);
router.get('/:id/payslips', requireEmployeeRead, hrController.getEmployeePayslips);

// Mutations
router.post('/', requirePermission('employee.write'), hrController.createEmployee);
router.put('/:id', requirePermission('employee.write'), hrController.updateEmployee);
router.delete('/:id', requirePermission('employee.delete'), hrController.deleteEmployee);

export default router;
