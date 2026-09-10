import React from 'react';
import type { EmployeePayslip } from '../queries/useEmployeePayslips';
import { formatCurrency, formatPeriod } from '@/lib/formatters';

export type PayslipsTableProps = {
  payslips: EmployeePayslip[];
  isLoading: boolean;
  isError: boolean;
  showValues: boolean;
  onViewPayslip: (payslipId: string) => void;
  onDownloadPayslip: (payslipId: string) => void;
  onOpenYearlyPayslips: () => void;
  onRetry?: () => void;
};

export const PayslipsTable: React.FC<PayslipsTableProps> = ({
  payslips,
  isLoading,
  isError,
  showValues,
  onViewPayslip,
  onDownloadPayslip,
  onOpenYearlyPayslips,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-6 bg-bg-raised animate-pulse rounded w-1/4" />
        <div className="border border-line rounded-lg overflow-hidden">
          <div className="h-10 bg-bg-raised animate-pulse border-b border-line" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-bg animate-pulse border-b border-line" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 border border-line rounded-xl bg-bg-raised text-center p-8">
        <p className="text-over-red font-medium text-sm sm:text-base">
          Unable to load payslips from the server.
        </p>
        <p className="text-xs text-ink-soft mt-1">
          Please verify that you are connected and your session is active.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h2 className="font-sans text-lg sm:text-xl font-semibold text-ink">
          Pay Slips for FY 2026-27
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-soft bg-bg-raised border border-line rounded px-2.5 py-1 font-mono">
            Currency: INR
          </span>
          <button
            type="button"
            className="text-xs px-3 py-1 rounded border border-line bg-transparent hover:bg-bg-raised text-accent font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            onClick={onOpenYearlyPayslips}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Yearly Pay Slips (FY 2026-27)</span>
          </button>
        </div>
      </div>

      {/* Table or Empty State */}
      {payslips.length === 0 ? (
        <div className="py-14 border border-line rounded-xl bg-bg-raised text-center p-8">
          <svg
            className="w-10 h-10 mx-auto text-ink-soft/60 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="font-sans text-base font-semibold text-ink mb-1">No Payslips Available</h3>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            Payslips will appear here as soon as monthly payruns are computed and published by the
            payroll administrator.
          </p>
        </div>
      ) : (
        <div className="border border-line rounded-lg overflow-x-auto bg-bg">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-line bg-bg-raised text-ink-soft text-xs font-semibold">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-line text-accent focus:ring-accent cursor-pointer"
                    aria-label="Select all payslips"
                  />
                </th>
                <th className="py-3 px-4">For Period</th>
                <th className="py-3 px-4">Payslip Type</th>
                <th className="py-3 px-4 text-center">Total Work Days</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Deduction</th>
                <th className="py-3 px-4 text-right">TDS</th>
                <th className="py-3 px-4 text-right">Net</th>
                <th className="py-3 px-4 text-right">Total Pay</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payslips.map((ps) => {
                // Determine approximate TDS (deduction component or default share)
                const deductionsNum = parseFloat(String(ps.total_deductions)) || 0;
                const estimatedTds = deductionsNum > 2700 ? 2500 : 0;

                return (
                  <tr key={ps.id} className="hover:bg-bg-raised/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-line text-accent focus:ring-accent cursor-pointer"
                        aria-label={`Select payslip for ${formatPeriod(ps.period_start)}`}
                      />
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink whitespace-nowrap">
                      {formatPeriod(ps.period_start)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
                        Regular
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-ink-soft whitespace-nowrap">
                      {ps.worked_days}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-ink whitespace-nowrap">
                      {formatCurrency(ps.gross_salary, showValues)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-over-red whitespace-nowrap">
                      {formatCurrency(ps.total_deductions, showValues)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-ink-soft whitespace-nowrap">
                      {formatCurrency(estimatedTds, showValues)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(ps.net_salary, showValues)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-ink whitespace-nowrap">
                      {formatCurrency(ps.net_salary, showValues)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDownloadPayslip(ps.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-line bg-ink text-bg hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Download printable payslip"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewPayslip(ps.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
