import { z } from 'zod';
import { userRoleEnum, passwordSchema } from '../auth/auth.validators';

export { userRoleEnum, passwordSchema };

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid work email address'),
  password: passwordSchema,
  role: userRoleEnum,
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
