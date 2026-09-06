import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  jobPositionId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  workingScheduleId: z.string().uuid().optional().nullable(),
  employmentStatus: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  dateOfJoining: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  identificationNumber: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankRoutingCode: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export function validateCreateEmployee(data: unknown): CreateEmployeeInput {
  const result = createEmployeeSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdateEmployee(data: unknown): UpdateEmployeeInput {
  const result = updateEmployeeSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
