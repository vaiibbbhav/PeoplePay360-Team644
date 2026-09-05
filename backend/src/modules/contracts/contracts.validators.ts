import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const createContractSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  name: z.string().min(1, 'Contract title/name is required'),
  wage: z.number().positive('Wage must be greater than 0'),
  wageType: z.enum(['monthly', 'hourly']).default('monthly'),
  salaryStructureId: z.string().uuid('Salary structure ID is required'),
  workingScheduleId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  jobPositionId: z.string().uuid().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  status: z.enum(['draft', 'active', 'expired', 'cancelled']).default('draft'),
  notes: z.string().optional().nullable(),
});

export const updateContractSchema = createContractSchema.partial();

export function validateCreateContract(data: unknown) {
  const result = createContractSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdateContract(data: unknown) {
  const result = updateContractSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
