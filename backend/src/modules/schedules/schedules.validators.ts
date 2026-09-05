import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const dayOfWeekEnum = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);

export const scheduleLineSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Format must be HH:MM or HH:MM:SS'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Format must be HH:MM or HH:MM:SS'),
  breakMinutes: z.number().int().min(0).max(480).default(60),
});

export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required').max(100),
  isActive: z.boolean().default(true),
  lines: z.array(scheduleLineSchema).min(1, 'At least one working day schedule is required'),
});

export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  lines: z.array(scheduleLineSchema).optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ScheduleLineInput = z.infer<typeof scheduleLineSchema>;

export function validateCreateSchedule(data: unknown): CreateScheduleInput {
  const result = createScheduleSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdateSchedule(data: unknown): UpdateScheduleInput {
  const result = updateScheduleSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
