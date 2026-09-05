import { AppError, ValidationError } from '../../shared/errors';
import { roundToTwoDecimals } from '../../shared/formatters';

export type ComputationMethod = 'fixed' | 'percentage' | 'formula';

export type SalaryRule = {
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
};

export type RuleContext = {
  results: Record<string, number>;
  contractWage?: number;
  workedDays?: number;
  [key: string]: unknown;
};

export type PayslipLine = {
  ruleId?: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
};

class ArithmeticParser {
  private position = 0;
  private readonly tokens: string[];

  constructor(
    expression: string,
    private readonly values: Record<string, number>,
  ) {
    this.tokens =
      expression.match(/[A-Za-z_][A-Za-z0-9_]*|(?:\d+(?:\.\d*)?|\.\d+)|[()+*/-]/g) || [];
    const reconstructed = this.tokens.join('');
    if (reconstructed !== expression.replace(/\s+/g, ''))
      throw new ValidationError('Invalid payroll formula');
  }

  parse(): number {
    const result = this.parseExpression();
    if (this.position !== this.tokens.length || !Number.isFinite(result))
      throw new ValidationError('Invalid payroll formula');
    return result;
  }

  private parseExpression(): number {
    let value = this.parseTerm();
    while (this.tokens[this.position] === '+' || this.tokens[this.position] === '-') {
      const operator = this.tokens[this.position++];
      const right = this.parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (this.tokens[this.position] === '*' || this.tokens[this.position] === '/') {
      const operator = this.tokens[this.position++];
      const right = this.parseFactor();
      if (operator === '/' && right === 0)
        throw new ValidationError('Payroll formula cannot divide by zero');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  private parseFactor(): number {
    const token = this.tokens[this.position++];
    if (token === '(') {
      const value = this.parseExpression();
      if (this.tokens[this.position++] !== ')')
        throw new ValidationError('Invalid payroll formula');
      return value;
    }
    if (token === '-') return -this.parseFactor();
    if (!token) throw new ValidationError('Invalid payroll formula');
    if (/^\d/.test(token) || token.startsWith('.')) return Number(token);
    if (/^[A-Za-z_]/.test(token))
      return this.values[token] ?? this.values[token.toUpperCase()] ?? 0;
    throw new ValidationError('Invalid payroll formula');
  }
}

/**
 * Evaluates formula by replacing variables with context values.
 */
export function evaluateFormula(formula: string | undefined, context: RuleContext): number {
  if (!formula || !formula.trim()) return 0;

  const values: Record<string, number> = {
    ...Object.fromEntries(
      Object.entries(context.results).map(([key, value]) => [key, Number(value) || 0]),
    ),
    WAGE: Number(context.contractWage) || 0,
    BASIC_WAGE: Number(context.contractWage) || 0,
    contractWage: Number(context.contractWage) || 0,
    WORKED_DAYS: Number(context.workedDays) || 0,
    workedDays: Number(context.workedDays) || 0,
  };
  return roundToTwoDecimals(new ArithmeticParser(formula.replace(/\s+/g, ''), values).parse());
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
