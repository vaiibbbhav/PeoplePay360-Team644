import { describe, it, expect } from 'vitest';
import {
  computePayslipLines,
  SalaryRule,
  evaluateFormula,
} from '../src/modules/payroll/rule-engine';

describe('Salary Rule Engine', () => {
  it('should correctly evaluate formula strings without eval()', () => {
    const context = {
      results: { BASIC: 5000, HRA: 1000, TRANSPORT: 300 },
      contractWage: 5000,
      workedDays: 22,
    };

    expect(evaluateFormula('BASIC + HRA + TRANSPORT', context)).toBe(6300);
    expect(evaluateFormula('BASIC * 0.12', context)).toBe(600);
    expect(evaluateFormula('(BASIC + HRA) * 0.10', context)).toBe(600);
    expect(evaluateFormula('BASIC - 500', context)).toBe(4500);
  });

  it('should compute ordered payslip lines with fixed, percentage, and formula rules', () => {
    const rules: SalaryRule[] = [
      {
        code: 'BASIC',
        name: 'Basic Salary',
        category: 'basic',
        sequence: 1,
        computationMethod: 'fixed',
        amount: 4000,
      },
      {
        code: 'HRA',
        name: 'House Rent Allowance',
        category: 'allowance',
        sequence: 2,
        computationMethod: 'percentage',
        percentageOfCode: 'BASIC',
        percentage: 40,
      },
      {
        code: 'GROSS',
        name: 'Gross Salary',
        category: 'gross',
        sequence: 3,
        computationMethod: 'formula',
        formula: 'BASIC + HRA',
      },
      {
        code: 'PF',
        name: 'Provident Fund',
        category: 'deduction',
        sequence: 4,
        computationMethod: 'percentage',
        percentageOfCode: 'BASIC',
        percentage: 12,
      },
      {
        code: 'NET',
        name: 'Net Salary',
        category: 'net',
        sequence: 5,
        computationMethod: 'formula',
        formula: 'GROSS - PF',
      },
    ];

    const context = {
      results: {},
      contractWage: 4000,
      workedDays: 22,
    };

    const lines = computePayslipLines(rules, context);

    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatchObject({ code: 'BASIC', amount: 4000 });
    expect(lines[1]).toMatchObject({ code: 'HRA', amount: 1600 }); // 40% of 4000
    expect(lines[2]).toMatchObject({ code: 'GROSS', amount: 5600 }); // 4000 + 1600
    expect(lines[3]).toMatchObject({ code: 'PF', amount: 480 }); // 12% of 4000
    expect(lines[4]).toMatchObject({ code: 'NET', amount: 5120 }); // 5600 - 480
  });
});
