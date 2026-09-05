import { z } from 'zod';

export const userRoleEnum = z.enum([
  'Employee',
  'HR Manager',
  'HR Payroll User',
  'HR Payroll Manager',
  'Admin',
]);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type UserRole = z.infer<typeof userRoleEnum>;
