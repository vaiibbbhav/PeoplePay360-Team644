import { Router } from 'express';
import * as schedulesController from './schedules.controller';
import { authenticateToken, requirePermission } from '../../shared/auth-middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('schedules.read'), schedulesController.listSchedules);
router.get('/:id', requirePermission('schedules.read'), schedulesController.getScheduleById);
router.post('/', requirePermission('schedules.write'), schedulesController.createSchedule);
router.put('/:id', requirePermission('schedules.write'), schedulesController.updateSchedule);
router.delete('/:id', requirePermission('schedules.delete'), schedulesController.deleteSchedule);

export default router;
