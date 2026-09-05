import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { checkInSchema, checkOutSchema, validateAttendanceRecord } from './attendance.validators';
import * as attendanceService from './attendance.service';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const records = await attendanceService.listAttendance(employeeId, startDate, endDate);
    res.json(records);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const record = await attendanceService.getAttendanceById(req.params.id);
    res.json(record);
  }),
);

router.post(
  '/check-in',
  asyncHandler(async (req, res) => {
    const { employeeId, checkIn } = checkInSchema.parse(req.body);
    const record = await attendanceService.recordCheckIn(employeeId, checkIn);
    res.status(201).json(record);
  }),
);

router.post(
  '/check-out',
  asyncHandler(async (req, res) => {
    const { employeeId, checkOut } = checkOutSchema.parse(req.body);
    const record = await attendanceService.recordCheckOut(employeeId, checkOut);
    res.json(record);
  }),
);

router.post(
  '/manual',
  asyncHandler(async (req, res) => {
    const validated = validateAttendanceRecord(req.body);
    const record = await attendanceService.saveManualAttendance(validated);
    res.status(201).json(record);
  }),
);

export default router;
