import React, { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';

export type TaxSheetTabProps = {
  showValues: boolean;
};

const MONTHS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

export const TaxSheetTab: React.FC<TaxSheetTabProps> = ({ showValues }) => {
  const [subTab, setSubTab] = useState<'taxsheet' | 'computation'>('taxsheet');

  const monthlyGross = 90000;
  const monthlyDeductions = 12700;
  const monthlyTds = 2500;
  const monthlyNet = monthlyGross - monthlyDeductions;

  const totalGross = monthlyGross * 12;
  const standardDeduction = 75000; // New Tax Regime Standard Deduction FY 2026-27
  const taxableSalary = Math.max(0, totalGross - standardDeduction);

  // Simplified New Tax Regime Slab Calculation
  // Up to 3L: 0%
  // 3L - 7L: 5% (20,000)
  // 7L - 10L: 10% (30,000)
  // 10L - 12L: 15% (30,000)
  // 12L - 15L: 20%
  const annualTax = 30000; // estimated annual TDS

  return (
    <div className="space-y-6 pt-2">
      {/* Sub-navigation and Regime Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-line p-0.5 bg-bg-raised">
            <button
              onClick={() => setSubTab('taxsheet')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                subTab === 'taxsheet'
                  ? 'bg-bg text-ink shadow-xs font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Taxsheet
            </button>
            <button
              onClick={() => setSubTab('computation')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                subTab === 'computation'
                  ? 'bg-bg text-ink shadow-xs font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Income Tax Computation sheet
            </button>
          </div>

          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold uppercase tracking-wider">
            New Tax Regime
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-soft font-mono">Currency: INR</span>
          <button
            onClick={() => window.print()}
            className="text-xs px-3 py-1 rounded border border-line bg-bg hover:bg-bg-raised text-ink font-medium transition-colors cursor-pointer"
          >
            Preview
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs px-3 py-1 rounded border border-line bg-ink text-bg hover:opacity-90 font-medium transition-opacity cursor-pointer"
          >
            Download
          </button>
        </div>
      </div>

      {subTab === 'taxsheet' ? (
        <div className="border border-line rounded-lg overflow-x-auto bg-bg">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg-raised text-ink-soft">
                <th className="py-2.5 px-3 text-left font-semibold sticky left-0 bg-bg-raised min-w-[160px]">
                  Particulars
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="py-2.5 px-3 text-right font-medium min-w-[80px]">
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right font-bold text-ink min-w-[90px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {/* Earnings Section */}
              <tr className="bg-bg-raised/40 font-semibold text-ink">
                <td className="py-2 px-3 sticky left-0 bg-bg-raised/40" colSpan={14}>
                  Earnings
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2 px-3 text-ink sticky left-0 bg-bg">Basic + Allowances</td>
                {MONTHS.map((m) => (
                  <td key={m} className="py-2 px-3 text-right font-mono text-ink">
                    {formatCurrency(monthlyGross, showValues)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-mono font-bold text-ink">
                  {formatCurrency(totalGross, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50 font-medium">
                <td className="py-2 px-3 text-ink font-bold sticky left-0 bg-bg">
                  Gross Salary (A)
                </td>
                {MONTHS.map((m) => (
                  <td key={m} className="py-2 px-3 text-right font-mono text-ink font-semibold">
                    {formatCurrency(monthlyGross, showValues)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-mono font-bold text-accent">
                  {formatCurrency(totalGross, showValues)}
                </td>
              </tr>

              {/* Deductions Section */}
              <tr className="bg-bg-raised/40 font-semibold text-ink">
                <td className="py-2 px-3 sticky left-0 bg-bg-raised/40" colSpan={14}>
                  Deductions
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2 px-3 text-ink sticky left-0 bg-bg">PF & Professional Tax</td>
                {MONTHS.map((m) => (
                  <td key={m} className="py-2 px-3 text-right font-mono text-over-red">
                    {formatCurrency(monthlyDeductions - monthlyTds, showValues)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-mono font-bold text-over-red">
                  {formatCurrency((monthlyDeductions - monthlyTds) * 12, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2 px-3 text-ink sticky left-0 bg-bg">TDS Deduction</td>
                {MONTHS.map((m) => (
                  <td key={m} className="py-2 px-3 text-right font-mono text-ink-soft">
                    {formatCurrency(monthlyTds, showValues)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-mono font-bold text-ink-soft">
                  {formatCurrency(monthlyTds * 12, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50 font-medium">
                <td className="py-2 px-3 text-ink font-bold sticky left-0 bg-bg">
                  Total Deductions (B)
                </td>
                {MONTHS.map((m) => (
                  <td
                    key={m}
                    className="py-2 px-3 text-right font-mono text-over-red font-semibold"
                  >
                    {formatCurrency(monthlyDeductions, showValues)}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-mono font-bold text-over-red">
                  {formatCurrency(monthlyDeductions * 12, showValues)}
                </td>
              </tr>

              {/* Net Pay */}
              <tr className="bg-bg-raised font-bold text-ink border-t-2 border-line">
                <td className="py-2.5 px-3 sticky left-0 bg-bg-raised">Net Pay (A - B)</td>
                {MONTHS.map((m) => (
                  <td key={m} className="py-2.5 px-3 text-right font-mono font-bold">
                    {formatCurrency(monthlyNet, showValues)}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-accent">
                  {formatCurrency(monthlyNet * 12, showValues)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        /* Income Tax Computation Sheet */
        <div className="border border-line rounded-lg overflow-hidden bg-bg">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg-raised text-ink-soft text-xs font-semibold">
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-right">Declared Amount</th>
                <th className="py-3 px-4 text-right">Exemption</th>
                <th className="py-3 px-4 text-right">Taxable Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-xs">
              <tr className="hover:bg-bg-raised/50 font-semibold text-ink">
                <td className="py-3 px-4">Gross Salary (Current Employer)</td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(totalGross, showValues)}
                </td>
                <td className="py-3 px-4 text-right font-mono">₹0.00</td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {formatCurrency(totalGross, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 text-ink-soft">Less: CTC Reimbursements</td>
                <td className="py-2.5 px-4 text-right font-mono">₹0.00</td>
                <td className="py-2.5 px-4 text-right font-mono">₹0.00</td>
                <td className="py-2.5 px-4 text-right font-mono">₹0.00</td>
              </tr>
              <tr className="hover:bg-bg-raised/50 font-medium">
                <td className="py-2.5 px-4 text-ink">
                  Standard Deduction under Section 19(1)(2) (New Regime)
                </td>
                <td className="py-2.5 px-4 text-right font-mono">₹75,000.00</td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                  {formatCurrency(standardDeduction, showValues)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-over-red">
                  -{formatCurrency(standardDeduction, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50 font-bold bg-bg-raised/30">
                <td className="py-3 px-4 text-ink">Total Taxable Income ("Salaries")</td>
                <td className="py-3 px-4 text-right font-mono">-</td>
                <td className="py-3 px-4 text-right font-mono">-</td>
                <td className="py-3 px-4 text-right font-mono text-accent text-sm">
                  {formatCurrency(taxableSalary, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 text-ink-soft">Calculated Tax Payable (Slabs)</td>
                <td className="py-2.5 px-4 text-right font-mono">-</td>
                <td className="py-2.5 px-4 text-right font-mono">-</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-ink">
                  {formatCurrency(annualTax, showValues)}
                </td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 text-ink-soft">Health & Education Cess (4%)</td>
                <td className="py-2.5 px-4 text-right font-mono">-</td>
                <td className="py-2.5 px-4 text-right font-mono">-</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-ink">
                  {formatCurrency(annualTax * 0.04, showValues)}
                </td>
              </tr>
              <tr className="bg-bg-raised font-bold text-ink border-t-2 border-line">
                <td className="py-3 px-4">Total Tax Liability for FY 2026-27</td>
                <td className="py-3 px-4 text-right font-mono">-</td>
                <td className="py-3 px-4 text-right font-mono">-</td>
                <td className="py-3 px-4 text-right font-mono text-base text-accent">
                  {formatCurrency(annualTax * 1.04, showValues)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
