import { z } from 'zod';
import { ValidationError } from '../../shared/errors';
import { realCalendarDateSchema } from '../../shared/validators';

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1, 'Structure name is required'),
  code: z.string().min(1, 'Structure code is required'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const createSalaryRuleSchema = z.object({
  structureId: z.string().uuid('Salary structure ID is required'),
  name: z.string().min(1, 'Rule name is required'),
  code: z.string().min(1, 'Rule code is required'),
  category: z.enum(['basic', 'allowance', 'gross', 'deduction', 'net']),
  sequence: z.number().int().min(1).default(1),
  computationMethod: z.enum(['fixed', 'percentage', 'formula']),
  amount: z.number().optional().nullable(),
  percentageOfCode: z.string().optional().nullable(),
  percentage: z.number().optional().nullable(),
  formula: z.string().optional().nullable(),
});

export const createPayrunWizardSchema = z
  .object({
    name: z.string().min(1, 'Payrun name is required'),
    salaryStructureId: z.string().uuid('Salary structure ID is required'),
    periodStart: realCalendarDateSchema,
    periodEnd: realCalendarDateSchema,
    employeeIds: z
      .array(z.string().uuid())
      .min(1, 'At least one employee must be selected in step 2'),
    notes: z.string().optional().nullable(),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    path: ['periodEnd'],
    message: 'periodEnd must be on or after periodStart',
  });

export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type CreateSalaryRuleInput = z.infer<typeof createSalaryRuleSchema>;
export type CreatePayrunWizardInput = z.infer<typeof createPayrunWizardSchema>;

export function validateCreateSalaryStructure(data: unknown): CreateSalaryStructureInput {
  const result = createSalaryStructureSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreateSalaryRule(data: unknown): CreateSalaryRuleInput {
  const result = createSalaryRuleSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreatePayrunWizard(data: unknown): CreatePayrunWizardInput {
  const result = createPayrunWizardSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
