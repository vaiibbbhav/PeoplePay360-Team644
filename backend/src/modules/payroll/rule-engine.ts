import { AppError } from '../../shared/errors';
import { roundToTwoDecimals } from '../../shared/formatters';

export type ComputationMethod = 'fixed' | 'percentage' | 'formula';

export interface SalaryRule {
  id?: string;
  structureId?: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
  computationMethod: ComputationMethod;
  amount?: number;
  percentageOfCode?: string;
  percentage?: number;
  formula?: string;
}

export interface RuleContext {
  results: Record<string, number>;
  contractWage?: number;
  workedDays?: number;
  [key: string]: unknown;
}

export interface PayslipLine {
  ruleId?: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
}

/**
 * Evaluates formula by replacing variables with context values.
 */
export function evaluateFormula(formula: string | undefined, context: RuleContext): number {
  if (!formula || !formula.trim()) return 0;

  const expression = formula.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (match) => {
    const key = match.toUpperCase();
    if (context.results[match] !== undefined) return String(context.results[match]);
    if (context.results[key] !== undefined) return String(context.results[key]);
    if (key === 'WAGE' || key === 'BASIC_WAGE' || match === 'contractWage')
      return String(context.contractWage || 0);
    if (key === 'WORKED_DAYS' || match === 'workedDays') return String(context.workedDays || 0);
    return '0';
  });

  return roundToTwoDecimals(Number(new Function(`return (${expression})`)()) || 0);
}

export function evaluateRule(rule: SalaryRule, context: RuleContext): number {
  switch (rule.computationMethod) {
    case 'fixed':
      return roundToTwoDecimals(Number(rule.amount) || 0);
    case 'percentage': {
      const baseKey = rule.percentageOfCode || '';
      const baseAmount =
        context.results[baseKey] ??
        context.results[baseKey.toUpperCase()] ??
        (context.contractWage || 0);
      const pct = Number(rule.percentage) || 0;
      return roundToTwoDecimals(baseAmount * (pct / 100));
    }
    case 'formula':
      return evaluateFormula(rule.formula, context);
    default:
      throw new AppError(`Unknown computation method: ${rule.computationMethod}`, 500);
  }
}

export function computePayslipLines(rules: SalaryRule[], context: RuleContext): PayslipLine[] {
  const sorted = [...rules].sort((a, b) => a.sequence - b.sequence);
  const results: Record<string, number> = { ...context.results };
  const lines: PayslipLine[] = [];

  for (const rule of sorted) {
    const amount = evaluateRule(rule, { ...context, results });
    results[rule.code] = amount;
    results[rule.code.toUpperCase()] = amount;
    lines.push({
      ruleId: rule.id,
      code: rule.code,
      name: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount,
    });
  }

  return lines;
}
