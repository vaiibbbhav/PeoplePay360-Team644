import { z } from 'zod';
import { ValidationError } from '../../shared/errors';

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const createSalaryRuleSchema = z.object({
  structureId: z.string().uuid('Invalid structure ID'),
  name: z.string().min(1, 'Rule name is required'),
  code: z.string().min(1, 'Rule code is required'),
  category: z.enum(['basic', 'allowance', 'gross', 'deduction', 'net']),
  sequence: z.number().int().min(1),
  computationMethod: z.enum(['fixed', 'percentage', 'formula']),
  amount: z.number().optional().nullable(),
  percentageOfCode: z.string().optional().nullable(),
  percentage: z.number().optional().nullable(),
  formula: z.string().optional().nullable(),
});

export const createPayrunWizardSchema = z.object({
  name: z.string().min(1, 'Payrun name is required'),
  salaryStructureId: z.string().uuid('Salary structure ID is required'),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid periodStart format (YYYY-MM-DD)'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid periodEnd format (YYYY-MM-DD)'),
  employeeIds: z
    .array(z.string().uuid())
    .min(1, 'At least one employee must be selected in step 2'),
  notes: z.string().optional().nullable(),
});

export function validateCreateSalaryStructure(data: unknown) {
  const result = createSalaryStructureSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreateSalaryRule(data: unknown) {
  const result = createSalaryRuleSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}

export function validateCreatePayrunWizard(data: unknown) {
  const result = createPayrunWizardSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(errorMsg);
  }
  return result.data;
}
