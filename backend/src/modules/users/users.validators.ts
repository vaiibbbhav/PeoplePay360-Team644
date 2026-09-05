import { z } from 'zod';
import { userRoleEnum, passwordSchema } from '../auth/auth.validators';

export { userRoleEnum, passwordSchema };

export const createUserSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: passwordSchema,
  role: userRoleEnum,
  employeeId: z.string().uuid('Invalid employee ID').nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  role: userRoleEnum.optional(),
  employeeId: z.string().uuid('Invalid employee ID').nullable().optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
