import { z } from 'zod';
import { ValidationError } from '../../shared/errors';
import { realCalendarDateSchema } from '../../shared/validators';

export const baseContractSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  name: z.string().min(1, 'Contract title/name is required'),
  wage: z.number().positive('Wage must be greater than 0'),
  wageType: z.enum(['monthly', 'hourly']).default('monthly'),
  salaryStructureId: z.string().uuid('Salary structure ID is required'),
  workingScheduleId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  jobPositionId: z.string().uuid().optional().nullable(),
  startDate: realCalendarDateSchema,
  endDate: realCalendarDateSchema.optional().nullable(),
  status: z.enum(['draft', 'active', 'expired', 'cancelled']).default('draft'),
  notes: z.string().optional().nullable(),
});

export const createContractSchema = baseContractSchema.refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: 'End date cannot be earlier than start date', path: ['endDate'] },
);

export const updateContractSchema = baseContractSchema.partial().refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: 'End date cannot be earlier than start date', path: ['endDate'] },
);

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;

export function validateCreateContract(data: unknown): CreateContractInput {
  const result = createContractSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdateContract(data: unknown): UpdateContractInput {
  const result = updateContractSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
