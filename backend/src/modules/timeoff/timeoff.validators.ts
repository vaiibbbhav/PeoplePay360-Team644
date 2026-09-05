import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  unit: z.enum(['days', 'hours']).default('days'),
  requiresAllocation: z.boolean().default(true),
  approvalType: z.enum(['hr_only', 'manager_and_hr', 'auto']).default('hr_only'),
  isPaid: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const createAllocationSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  timeOffTypeId: z.string().uuid('Invalid time off type ID'),
  allocatedAmount: z.number().positive('Allocated amount must be greater than 0'),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid validFrom date format (YYYY-MM-DD)'),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid validTo date format (YYYY-MM-DD)'),
});

export const createRequestSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  timeOffTypeId: z.string().uuid('Invalid time off type ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid startDate format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format (YYYY-MM-DD)'),
  duration: z.number().positive('Duration must be greater than 0'),
  reason: z.string().optional().nullable(),
});

export function validateCreateTimeOffType(data: unknown) {
  const result = createTimeOffTypeSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreateAllocation(data: unknown) {
  const result = createAllocationSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreateRequest(data: unknown) {
  const result = createRequestSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
