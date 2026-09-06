import { z } from 'zod';
import { ValidationError } from '../../shared/errors';
import { realCalendarDateSchema } from '../../shared/validators';

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  unit: z.enum(['days', 'hours']).default('days'),
  requiresAllocation: z.boolean().default(true),
  approvalType: z.enum(['hr_only', 'manager_and_hr', 'auto']).default('hr_only'),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const createAllocationSchema = z
  .object({
    employeeId: z.string().uuid('Invalid employee ID'),
    timeOffTypeId: z.string().uuid('Invalid time off type ID'),
    allocatedAmount: z.number().positive('Allocated amount must be greater than 0'),
    validFrom: realCalendarDateSchema,
    validTo: realCalendarDateSchema,
  })
  .refine((data) => data.validTo >= data.validFrom, {
    message: 'validTo cannot be earlier than validFrom',
    path: ['validTo'],
  });

export const createRequestSchema = z
  .object({
    employeeId: z.string().uuid('Invalid employee ID'),
    timeOffTypeId: z.string().uuid('Invalid time off type ID'),
    startDate: realCalendarDateSchema,
    endDate: realCalendarDateSchema,
    duration: z.number().positive('Duration must be greater than 0'),
    reason: z.string().optional().nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'endDate cannot be earlier than startDate',
    path: ['endDate'],
  });

export type CreateTimeOffTypeInput = z.infer<typeof createTimeOffTypeSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export function validateCreateTimeOffType(data: unknown): CreateTimeOffTypeInput {
  const result = createTimeOffTypeSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreateAllocation(data: unknown): CreateAllocationInput {
  const result = createAllocationSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreateRequest(data: unknown): CreateRequestInput {
  const result = createRequestSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
