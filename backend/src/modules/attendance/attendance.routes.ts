import { Router } from 'express';
import * as attendanceController from './attendance.controller';
import {
  authenticateToken,
  requireAnyPermission,
  requirePermission,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

router.get(
  '/',
  requireAnyPermission(['attendance.read', 'attendance.self.read']),
  attendanceController.listAttendance,
);
router.get(
  '/:id',
  requireAnyPermission(['attendance.read', 'attendance.self.read']),
  attendanceController.getAttendanceById,
);
router.post(
  '/check-in',
  requireAnyPermission(['attendance.self.create', 'attendance.write']),
  attendanceController.recordCheckIn,
);
router.post(
  '/check-out',
  requireAnyPermission(['attendance.self.create', 'attendance.write']),
  attendanceController.recordCheckOut,
);
router.post(
  '/manual',
  requirePermission('attendance.write'),
  attendanceController.saveManualAttendance,
);

export default router;
