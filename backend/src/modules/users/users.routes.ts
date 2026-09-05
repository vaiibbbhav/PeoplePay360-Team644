import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticateToken, requireRole } from '../../shared/auth-middleware';

const router = Router();

// All user management routes strictly require authenticated Admin role
router.use(authenticateToken);
router.use(requireRole(['Admin']));

router.get('/', usersController.listUsers);
router.get('/employees-options', usersController.getEmployeeOptions);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

export default router;
