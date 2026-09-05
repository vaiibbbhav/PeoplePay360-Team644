import { Router } from 'express';
import * as attendanceController from './attendance.controller';

const router = Router();

router.get('/', attendanceController.listAttendance);
router.get('/:id', attendanceController.getAttendanceById);
router.post('/check-in', attendanceController.recordCheckIn);
router.post('/check-out', attendanceController.recordCheckOut);
router.post('/manual', attendanceController.saveManualAttendance);

export default router;
