import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { checkInSchema, checkOutSchema, validateAttendanceRecord } from './attendance.validators';
import * as attendanceService from './attendance.service';
import { assertEmployeeAccess } from '../../shared/auth-middleware';

export const listAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let employeeId = req.query.employeeId as string | undefined;
  if (req.user?.role === 'Employee') employeeId = req.user.employeeId;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const records = await attendanceService.listAttendance(employeeId, startDate, endDate);
  res.json(records);
});

export const getAttendanceById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const record = await attendanceService.getAttendanceById(req.params.id);
    assertEmployeeAccess(req, record.employeeId);
    res.json(record);
  },
);

export const recordCheckIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { employeeId, checkIn } = checkInSchema.parse(req.body);
  const record = await attendanceService.recordCheckIn(employeeId, checkIn);
  res.status(201).json(record);
});

export const recordCheckOut = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { employeeId, checkOut } = checkOutSchema.parse(req.body);
  const record = await attendanceService.recordCheckOut(employeeId, checkOut);
  res.json(record);
});

export const saveManualAttendance = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validated = validateAttendanceRecord(req.body);
    const record = await attendanceService.saveManualAttendance(validated);
    res.status(201).json(record);
  },
);

export const deleteAttendance = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await attendanceService.deleteAttendance(req.params.id);
    res.status(204).send();
  },
);
