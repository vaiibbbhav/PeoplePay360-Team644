import { z } from 'zod';
import { ValidationError } from '../../shared/errors';
import { realCalendarDateSchema } from '../../shared/validators';

const pastOrPresentDateTimeSchema = z
  .string()
  .datetime()
  .refine(
    (dt) => {
      const parsed = Date.parse(dt);
      return !isNaN(parsed) && parsed <= Date.now() + 5 * 60 * 1000;
    },
    { message: 'Timestamp cannot be in the future' },
  );

export const checkInSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  checkIn: pastOrPresentDateTimeSchema.optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  checkOut: pastOrPresentDateTimeSchema.optional(),
});

const baseAttendanceRecordSchema = z.object({
  id: z.string().uuid('Invalid record ID').optional().nullable(),
  employeeId: z.string().uuid('Invalid employee ID'),
  date: realCalendarDateSchema,
  checkIn: pastOrPresentDateTimeSchema.optional().nullable(),
  checkOut: pastOrPresentDateTimeSchema.optional().nullable(),
  workedHours: z.number().min(0).max(24).optional(),
  status: z.enum(['Present', 'Late', 'Absent', 'Overtime', 'Half-day']).default('Present'),
  exceptionNote: z.string().optional().nullable(),
  isManualEdit: z.boolean().optional(),
});

export const attendanceRecordSchema = baseAttendanceRecordSchema.refine(
  (data: any) => {
    if (data.checkIn && data.checkOut) {
      return Date.parse(data.checkOut) >= Date.parse(data.checkIn);
    }
    return true;
  },
  { message: 'Check-out timestamp cannot be earlier than check-in', path: ['checkOut'] },
);

export type ManualAttendanceInput = z.infer<typeof attendanceRecordSchema>;

export const updateAttendanceSchema = baseAttendanceRecordSchema.partial().refine(
  (data: any) => {
    if (data.checkIn && data.checkOut) {
      return Date.parse(data.checkOut) >= Date.parse(data.checkIn);
    }
    return true;
  },
  { message: 'Check-out timestamp cannot be earlier than check-in', path: ['checkOut'] },
);

export function validateAttendanceRecord(data: unknown) {
  const result = attendanceRecordSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors
      .map((e: any) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdateAttendance(data: unknown) {
  const result = updateAttendanceSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors
      .map((e: any) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
