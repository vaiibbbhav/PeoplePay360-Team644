import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { CheckCircle2, ArrowRight, X, Scale, AlertCircle } from 'lucide-react';

export type TaxComparisonData = {
  grossSalary: number;
  hraExemption: number;
  section80C: number;
  section80D: number;
  section80CCD1B: number;
  section80CCD2: number;
  homeLoanInterest: number;
  otherDeductions: number;
};

export type CompareTaxModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: TaxComparisonData;
  activeRegime: 'new' | 'old';
  onSelectRegime: (regime: 'new' | 'old') => void;
  showValues?: boolean;
};

// Calculate Old Tax Regime
export function calculateOldRegimeTax(d: TaxComparisonData) {
  const standardDeduction = 50000;
  const eligible80C = Math.min(150000, d.section80C);
  const eligible80D = Math.min(100000, d.section80D);
  const eligible80CCD1B = Math.min(50000, d.section80CCD1B);
  const eligibleHomeLoan = Math.min(200000, d.homeLoanInterest);

  const totalExemptions = d.hraExemption;
  const totalDeductions =
    standardDeduction +
    eligible80C +
    eligible80D +
    eligible80CCD1B +
    d.section80CCD2 +
    eligibleHomeLoan +
    d.otherDeductions;

  const taxableIncome = Math.max(0, d.grossSalary - totalExemptions - totalDeductions);

  // Slabs: 0-2.5L: 0%, 2.5L-5L: 5%, 5L-10L: 20%, >10L: 30%
  let baseTax = 0;
  if (taxableIncome > 1000000) {
    baseTax += (taxableIncome - 1000000) * 0.3;
    baseTax += 500000 * 0.2; // 1,00,000
    baseTax += 250000 * 0.05; // 12,500
  } else if (taxableIncome > 500000) {
    baseTax += (taxableIncome - 500000) * 0.2;
    baseTax += 250000 * 0.05; // 12,500
  } else if (taxableIncome > 250000) {
    baseTax += (taxableIncome - 250000) * 0.05;
  }

  // Section 87A rebate for Old Regime: if taxable <= 5L, rebate up to 12,500
  let rebate87A = 0;
  if (taxableIncome <= 500000 && taxableIncome > 0) {
    rebate87A = Math.min(baseTax, 12500);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    standardDeduction,
    totalExemptions,
    totalDeductions,
    taxableIncome,
    baseTax,
    rebate87A,
    cess,
    totalTax,
  };
}

// Calculate New Tax Regime (Section 115BAC - FY 2026-27 Budget)
export function calculateNewRegimeTax(d: TaxComparisonData) {
  const standardDeduction = 75000;
  const totalDeductions = standardDeduction + d.section80CCD2;
  const taxableIncome = Math.max(0, d.grossSalary - totalDeductions);

  // Slabs:
  // 0 - 3L: Nil
  // 3L - 7L: 5% (max 20,000)
  // 7L - 10L: 10% (max 30,000)
  // 10L - 12L: 15% (max 30,000)
  // 12L - 15L: 20% (max 60,000)
  // > 15L: 30%
  let baseTax = 0;
  if (taxableIncome > 1500000) {
    baseTax += (taxableIncome - 1500000) * 0.3;
    baseTax += 300000 * 0.2; // 60,000
    baseTax += 200000 * 0.15; // 30,000
    baseTax += 300000 * 0.1; // 30,000
    baseTax += 400000 * 0.05; // 20,000
  } else if (taxableIncome > 1200000) {
    baseTax += (taxableIncome - 1200000) * 0.2;
    baseTax += 200000 * 0.15; // 30,000
    baseTax += 300000 * 0.1; // 30,000
    baseTax += 400000 * 0.05; // 20,000
  } else if (taxableIncome > 1000000) {
    baseTax += (taxableIncome - 1000000) * 0.15;
    baseTax += 300000 * 0.1; // 30,000
    baseTax += 400000 * 0.05; // 20,000
  } else if (taxableIncome > 700000) {
    baseTax += (taxableIncome - 700000) * 0.1;
    baseTax += 400000 * 0.05; // 20,000
  } else if (taxableIncome > 300000) {
    baseTax += (taxableIncome - 300000) * 0.05;
  }

  // Section 87A rebate for New Regime: if taxable <= 7L, full rebate up to 25,000
  let rebate87A = 0;
  if (taxableIncome <= 700000 && taxableIncome > 0) {
    rebate87A = Math.min(baseTax, 25000);
  }

  // Marginal relief: if income marginally above 7L
  let marginalRelief = 0;
  if (taxableIncome > 700000 && taxableIncome < 727777) {
    const excessIncome = taxableIncome - 700000;
    if (baseTax > excessIncome) {
      marginalRelief = baseTax - excessIncome;
      baseTax = excessIncome;
    }
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    standardDeduction,
    totalExemptions: 0,
    totalDeductions,
    taxableIncome,
    baseTax,
    rebate87A,
    marginalRelief,
    cess,
    totalTax,
  };
}

export const CompareTaxModal: React.FC<CompareTaxModalProps> = ({
  isOpen,
  onClose,
  data,
  activeRegime,
  onSelectRegime,
  showValues = true,
}) => {
  if (!isOpen) return null;

  const oldCalc = calculateOldRegimeTax(data);
  const newCalc = calculateNewRegimeTax(data);

  const diff = oldCalc.totalTax - newCalc.totalTax;
  const recommendedRegime: 'new' | 'old' = diff >= 0 ? 'new' : 'old';
  const savings = Math.abs(diff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-bg border border-line rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Tax Regime Comparison (FY 2026-27)
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Side-by-side analysis of New Tax Regime (u/s 115BAC) vs Old Tax Regime based on your declarations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-2 rounded-lg hover:bg-bg-raised transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recommendation Banner */}
        <div
          className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            recommendedRegime === 'new'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
              : 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/40 text-violet-900 dark:text-violet-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {savings === 0 ? (
                  <span>Both regimes result in the exact same tax liability for your income.</span>
                ) : (
                  <span>
                    You save <strong className="font-bold underline">{formatCurrency(savings, showValues)}</strong> annually with the{' '}
                    <strong className="font-bold uppercase tracking-wide">
                      {recommendedRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}
                    </strong>!
                  </span>
                )}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                {recommendedRegime === 'new'
                  ? 'Lower slab rates and enhanced ₹75,000 standard deduction offer higher net take-home salary.'
                  : 'Your high Chapter VI-A investments, HRA, and home loan deductions make the Old Regime more beneficial.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectRegime(recommendedRegime);
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-1.5 ${
              recommendedRegime === activeRegime
                ? 'bg-bg text-ink border border-line opacity-75'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {recommendedRegime === activeRegime ? 'Currently Selected' : `Switch to ${recommendedRegime === 'new' ? 'New' : 'Old'} Regime`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="border border-line rounded-xl overflow-hidden bg-bg">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg-raised text-ink-soft text-xs font-semibold">
                <th className="py-3 px-4 text-left">Compensation & Tax Component</th>
                <th className="py-3 px-4 text-right font-medium">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Old Tax Regime</span>
                    {activeRegime === 'old' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-right font-medium">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>New Tax Regime (115BAC)</span>
                    {activeRegime === 'new' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-xs">
              {/* Gross Total Income */}
              <tr className="hover:bg-bg-raised/40 font-medium">
                <td className="py-3 px-4 text-ink">Gross Total Salary (Annual)</td>
                <td className="py-3 px-4 text-right font-mono text-ink">
                  {formatCurrency(data.grossSalary, showValues)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-ink">
                  {formatCurrency(data.grossSalary, showValues)}
                </td>
              </tr>

              {/* Standard Deduction */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Standard Deduction (Section 16(ia))
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(oldCalc.standardDeduction, showValues)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  -{formatCurrency(newCalc.standardDeduction, showValues)}
                </td>
              </tr>

              {/* HRA & Section 10 Exemptions */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: House Rent Allowance Exemption (u/s 10(13A))
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.hraExemption > 0 ? `-${formatCurrency(data.hraExemption, showValues)}` : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink-soft italic">
                  Not Eligible
                </td>
              </tr>

              {/* Section 24(b) Home Loan Interest */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Home Loan Interest (Section 24(b))
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.homeLoanInterest > 0
                    ? `-${formatCurrency(Math.min(200000, data.homeLoanInterest), showValues)}`
                    : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink-soft italic">
                  Not Eligible
                </td>
              </tr>

              {/* Chapter VI-A: 80C */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Section 80C Investments (PPF, EPF, ELSS, LIC)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.section80C > 0
                    ? `-${formatCurrency(Math.min(150000, data.section80C), showValues)}`
                    : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink-soft italic">
                  Not Eligible
                </td>
              </tr>

              {/* Chapter VI-A: 80D */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Section 80D Health Insurance (Mediclaim)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.section80D > 0
                    ? `-${formatCurrency(Math.min(100000, data.section80D), showValues)}`
                    : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink-soft italic">
                  Not Eligible
                </td>
              </tr>

              {/* Section 80CCD(1B) Additional NPS */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Section 80CCD(1B) Additional NPS (Tier-1)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.section80CCD1B > 0
                    ? `-${formatCurrency(Math.min(50000, data.section80CCD1B), showValues)}`
                    : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink-soft italic">
                  Not Eligible
                </td>
              </tr>

              {/* Section 80CCD(2) Employer NPS */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Section 80CCD(2) Employer NPS Contribution
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.section80CCD2 > 0 ? `-${formatCurrency(data.section80CCD2, showValues)}` : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.section80CCD2 > 0 ? `-${formatCurrency(data.section80CCD2, showValues)}` : '₹0'}
                </td>
              </tr>

              {/* Other Deductions (80E, 80G, etc.) */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Other Chapter VI-A (80E Education, 80G Charity, 80TTA)
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {data.otherDeductions > 0 ? `-${formatCurrency(data.otherDeductions, showValues)}` : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink-soft italic">
                  Not Eligible
                </td>
              </tr>

              {/* Net Taxable Income */}
              <tr className="bg-bg-raised/60 font-bold border-t border-line">
                <td className="py-3 px-4 text-ink">Net Taxable Income</td>
                <td className="py-3 px-4 text-right font-mono text-sm text-ink">
                  {formatCurrency(oldCalc.taxableIncome, showValues)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-ink">
                  {formatCurrency(newCalc.taxableIncome, showValues)}
                </td>
              </tr>

              {/* Tax Calculated on Slabs */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">Gross Income Tax (per Slabs)</td>
                <td className="py-2.5 px-4 text-right font-mono text-ink">
                  {formatCurrency(oldCalc.baseTax, showValues)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink">
                  {formatCurrency(newCalc.baseTax, showValues)}
                </td>
              </tr>

              {/* Section 87A Rebate */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">
                  Less: Section 87A Tax Rebate
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {oldCalc.rebate87A > 0 ? `-${formatCurrency(oldCalc.rebate87A, showValues)}` : '₹0'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {newCalc.rebate87A > 0 ? `-${formatCurrency(newCalc.rebate87A, showValues)}` : '₹0'}
                </td>
              </tr>

              {/* Health and Education Cess */}
              <tr className="hover:bg-bg-raised/40">
                <td className="py-2.5 px-4 text-ink-soft">Health & Education Cess (4%)</td>
                <td className="py-2.5 px-4 text-right font-mono text-ink">
                  {formatCurrency(oldCalc.cess, showValues)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink">
                  {formatCurrency(newCalc.cess, showValues)}
                </td>
              </tr>

              {/* Total Annual Tax Liability */}
              <tr className="bg-bg-raised font-bold border-t-2 border-line text-sm">
                <td className="py-3 px-4 text-ink">Total Annual Tax Liability</td>
                <td
                  className={`py-3 px-4 text-right font-mono font-extrabold ${
                    oldCalc.totalTax <= newCalc.totalTax ? 'text-emerald-600 dark:text-emerald-400 text-base' : 'text-ink'
                  }`}
                >
                  {formatCurrency(oldCalc.totalTax, showValues)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono font-extrabold ${
                    newCalc.totalTax <= oldCalc.totalTax ? 'text-emerald-600 dark:text-emerald-400 text-base' : 'text-ink'
                  }`}
                >
                  {formatCurrency(newCalc.totalTax, showValues)}
                </td>
              </tr>

              {/* Monthly Estimated TDS */}
              <tr className="hover:bg-bg-raised/40 text-xs">
                <td className="py-2.5 px-4 text-ink-soft">Estimated Monthly TDS Deduction</td>
                <td className="py-2.5 px-4 text-right font-mono text-ink font-medium">
                  {formatCurrency(Math.round(oldCalc.totalTax / 12), showValues)}/mo
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-ink font-medium">
                  {formatCurrency(Math.round(newCalc.totalTax / 12), showValues)}/mo
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Note on Section 115BAC & Opt-Out */}
        <div className="mt-4 flex items-start gap-2 text-xs text-ink-soft bg-bg-raised p-3 rounded-lg border border-line">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p>
            Under Section 115BAC of the Income Tax Act, the New Tax Regime is the default regime for all salaried individuals.
            Salaried employees can opt for the Old Tax Regime every financial year at the time of filing IT declaration or ITR filing u/s 139(1).
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-line">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">Selected Regime:</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                activeRegime === 'new'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
              }`}
            >
              {activeRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectRegime(activeRegime === 'new' ? 'old' : 'new');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-bg-raised hover:bg-line text-ink border border-line cursor-pointer transition-colors"
            >
              Toggle to {activeRegime === 'new' ? 'Old Regime' : 'New Regime'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
