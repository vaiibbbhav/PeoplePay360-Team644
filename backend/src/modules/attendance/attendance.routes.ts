import { Router } from 'express';
import * as attendanceController from './attendance.controller';
import {
  authenticateToken,
  requireAnyPermission,
  requirePermission,
  requireEmployeeBodyAccess,
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
  requireEmployeeBodyAccess,
  attendanceController.recordCheckIn,
);
router.post(
  '/check-out',
  requireAnyPermission(['attendance.self.create', 'attendance.write']),
  requireEmployeeBodyAccess,
  attendanceController.recordCheckOut,
);
router.post(
  '/manual',
  requirePermission('attendance.write'),
  requireEmployeeBodyAccess,
  attendanceController.saveManualAttendance,
);

export default router;
