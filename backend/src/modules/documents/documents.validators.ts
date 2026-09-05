import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const acceptPolicySchema = z.object({
  policyVersion: z.string().min(1).default('1.0'),
});

export const policyCategoryEnum = z.enum(['compliance', 'security', 'workplace', 'hr']);

export const createPolicySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  code: z.string().min(2, 'Code is required').max(60),
  category: policyCategoryEnum.default('hr'),
  version: z.string().min(1).max(20).default('1.0'),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  isMandatory: z.boolean().default(true),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid effective date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
});

export const updatePolicySchema = createPolicySchema.partial();

export type AcceptPolicyInput = z.infer<typeof acceptPolicySchema>;
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

export function validateCreatePolicy(data: unknown): CreatePolicyInput {
  const result = createPolicySchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateUpdatePolicy(data: unknown): UpdatePolicyInput {
  const result = updatePolicySchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
