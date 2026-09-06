import * as attendanceRepo from './attendance.repository';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { formatDateIso, roundToTwoDecimals, getIstTimeParts } from '../../shared/formatters';

export async function listAttendance(employeeId?: string, startDate?: string, endDate?: string) {
  return await attendanceRepo.findAllAttendance(employeeId, startDate, endDate);
}

export async function getAttendanceById(id: string) {
  const record = await attendanceRepo.findAttendanceById(id);
  if (!record) {
    throw new NotFoundError(`Attendance record with ID ${id} not found`);
  }
  return record;
}

export async function getWorkedDaysInPeriod(
  employeeId: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  return await attendanceRepo.countWorkedDaysForPeriod(employeeId, startDate, endDate);
}

export async function recordCheckIn(employeeId: string, checkInTime?: string) {
  const now = checkInTime ? new Date(checkInTime) : new Date();
  const dateStr = formatDateIso(now);
  const existing = await attendanceRepo.findAttendanceByEmployeeAndDate(employeeId, dateStr);

  if (existing && existing.checkIn) {
    throw new ValidationError('Employee has already checked in today');
  }

  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  }).format(now);
  const schedule = await attendanceRepo.findScheduleLineForDate(employeeId, dayOfWeek);
  let status = 'Present';
  if (schedule) {
    const { hours, minutes } = getIstTimeParts(now);
    const [startHour, startMinute] = String(schedule.startTime).split(':').map(Number);
    const isLate = hours * 60 + minutes > startHour * 60 + startMinute;
    status = isLate ? 'Late' : 'Present';
  }

  return await attendanceRepo.upsertAttendance({
    employeeId,
    date: dateStr,
    checkIn: now.toISOString(),
    checkOut: existing?.checkOut ? existing.checkOut.toISOString() : null,
    workedHours: existing?.workedHours ? parseFloat(existing.workedHours) : 0,
    status,
    isManualEdit: false,
  });
}

export async function recordCheckOut(employeeId: string, checkOutTime?: string) {
  const now = checkOutTime ? new Date(checkOutTime) : new Date();
  const existing = await attendanceRepo.findOpenAttendance(employeeId);

  if (!existing || !existing.checkIn) {
    throw new ValidationError('No active check-in found for today');
  }

  const checkInDate = new Date(existing.checkIn);
  const diffMs = now.getTime() - checkInDate.getTime();
  const diffHours = roundToTwoDecimals(Math.max(0, diffMs / (1000 * 60 * 60)));

  let status = existing.status;
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  }).format(checkInDate);
  const schedule = await attendanceRepo.findScheduleLineForDate(employeeId, dayOfWeek);
  if (schedule) {
    const startMinutes = String(schedule.startTime).split(':').map(Number);
    const endMinutes = String(schedule.endTime).split(':').map(Number);
    const scheduledHours =
      (endMinutes[0] * 60 +
        endMinutes[1] -
        (startMinutes[0] * 60 + startMinutes[1]) -
        Number(schedule.breakMinutes)) /
      60;
    if (diffHours > scheduledHours) status = 'Overtime';
    else if (diffHours < scheduledHours / 2) status = 'Half-day';
  }

  return await attendanceRepo.upsertAttendance({
    employeeId,
    date: existing.date,
    checkIn: existing.checkIn.toISOString(),
    checkOut: now.toISOString(),
    workedHours: diffHours,
    status,
    isManualEdit: false,
  });
}

import { ManualAttendanceInput } from './attendance.validators';

export async function saveManualAttendance(data: ManualAttendanceInput) {
  let workedHours = data.workedHours;

  if (data.checkIn && data.checkOut && !workedHours) {
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const diffMs = end.getTime() - start.getTime();
    workedHours = roundToTwoDecimals(Math.max(0, diffMs / (1000 * 60 * 60)));
  }

  return await attendanceRepo.upsertAttendance({
    ...data,
    workedHours: workedHours || 0,
    isManualEdit: true,
  });
}

export async function deleteAttendance(id: string) {
  const record = await attendanceRepo.findAttendanceById(id);
  if (!record) {
    throw new NotFoundError(`Attendance record with ID ${id} not found`);
  }
  return await attendanceRepo.deleteAttendance(id);
}
