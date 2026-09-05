import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const checkInSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  checkIn: z.string().datetime().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  checkOut: z.string().datetime().optional(),
});

export const attendanceRecordSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  checkIn: z.string().datetime().optional().nullable(),
  checkOut: z.string().datetime().optional().nullable(),
  workedHours: z.number().min(0).max(24).optional(),
  status: z.enum(['Present', 'Late', 'Absent', 'Overtime', 'Half-day']).default('Present'),
  exceptionNote: z.string().optional().nullable(),
  isManualEdit: z.boolean().optional(),
});

export const updateAttendanceSchema = attendanceRecordSchema.partial();

export function validateAttendanceRecord(data: unknown) {
  const result = attendanceRecordSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdateAttendance(data: unknown) {
  const result = updateAttendanceSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
