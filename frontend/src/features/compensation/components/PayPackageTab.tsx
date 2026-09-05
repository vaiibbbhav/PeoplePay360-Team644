import React, { useState } from 'react';
import { useEmployeeContracts } from '../queries/useEmployeePayslips';
import { formatCurrency } from '@/lib/formatters';

export type PayPackageTabProps = {
  employeeId?: string;
  showValues: boolean;
};

export const PayPackageTab: React.FC<PayPackageTabProps> = ({ employeeId, showValues }) => {
  const { data: contracts = [], isLoading, isError, refetch } = useEmployeeContracts(employeeId);
  const [selectedContractForBreakdown, setSelectedContractForBreakdown] = useState<any | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-6 bg-bg-raised animate-pulse rounded w-1/4" />
        <div className="h-20 bg-bg-raised animate-pulse rounded" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-10 border border-line rounded-xl bg-bg-raised text-center p-6">
        <p className="text-over-red text-sm font-medium">Failed to load pay package contracts.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeContract = contracts.find((c) => c.status === 'active') || contracts[0];
  const monthlyWage = activeContract ? parseFloat(activeContract.wage) : 85000;
  const annualCtc = monthlyWage * 12;

  // Breakdown components calculation
  const basic = monthlyWage * 0.5;
  const hra = basic * 0.5;
  const specialAllowance = basic * 0.3;
  const conveyance = 1600;
  const medical = 1250;
  const pf = basic * 0.12;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-lg sm:text-xl font-semibold text-ink">Pay Package</h2>
        <span className="text-xs text-ink-soft font-mono">FY 2026-27</span>
      </div>

      {contracts.length === 0 ? (
        <div className="border border-line rounded-xl p-8 bg-bg-raised text-center">
          <p className="text-sm text-ink-soft">No employment contract found for this employee.</p>
        </div>
      ) : (
        <div className="border border-line rounded-lg overflow-x-auto bg-bg">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg-raised text-ink-soft text-xs font-semibold">
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4 text-right">Monthly CTC</th>
                <th className="py-3 px-4 text-right">Total CTC (Annual)</th>
                <th className="py-3 px-4 text-center">CTC Proration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contracts.map((c) => {
                const mWage = parseFloat(c.wage) || 0;
                const aWage = mWage * 12;
                const isActive = c.status === 'active';

                return (
                  <tr key={c.id} className="hover:bg-bg-raised/60 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">
                          {new Date(c.start_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium text-ink whitespace-nowrap">
                      {formatCurrency(mWage, showValues)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-ink whitespace-nowrap">
                      {formatCurrency(aWage, showValues)}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedContractForBreakdown(c)}
                        className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                      >
                        View Breakdown
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CTC Breakdown Modal / Drawer */}
      {selectedContractForBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-bg border border-line rounded-xl max-w-xl w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink">
                  CTC Compensation Structure Breakdown
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  {selectedContractForBreakdown.name || 'Standard Full-Time Package'}
                </p>
              </div>
              <button
                onClick={() => setSelectedContractForBreakdown(null)}
                className="text-ink-soft hover:text-ink p-1 cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border border-line rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 bg-bg-raised p-2.5 font-semibold text-ink-soft border-b border-line">
                  <span>Component</span>
                  <span className="text-right">Monthly (INR)</span>
                  <span className="text-right">Annual (INR)</span>
                </div>
                <div className="divide-y divide-line p-2">
                  <div className="grid grid-cols-3 py-2 px-1 text-ink">
                    <span>Basic Salary (50%)</span>
                    <span className="text-right font-mono">
                      {formatCurrency(basic, showValues)}
                    </span>
                    <span className="text-right font-mono">
                      {formatCurrency(basic * 12, showValues)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-2 px-1 text-ink">
                    <span>House Rent Allowance (HRA)</span>
                    <span className="text-right font-mono">{formatCurrency(hra, showValues)}</span>
                    <span className="text-right font-mono">
                      {formatCurrency(hra * 12, showValues)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-2 px-1 text-ink">
                    <span>Special Allowance</span>
                    <span className="text-right font-mono">
                      {formatCurrency(specialAllowance, showValues)}
                    </span>
                    <span className="text-right font-mono">
                      {formatCurrency(specialAllowance * 12, showValues)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-2 px-1 text-ink">
                    <span>Conveyance Allowance</span>
                    <span className="text-right font-mono">
                      {formatCurrency(conveyance, showValues)}
                    </span>
                    <span className="text-right font-mono">
                      {formatCurrency(conveyance * 12, showValues)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-2 px-1 text-ink">
                    <span>Medical Allowance</span>
                    <span className="text-right font-mono">
                      {formatCurrency(medical, showValues)}
                    </span>
                    <span className="text-right font-mono">
                      {formatCurrency(medical * 12, showValues)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 py-2 px-1 text-ink-soft italic">
                    <span>Provident Fund Employer (Retirals)</span>
                    <span className="text-right font-mono">{formatCurrency(pf, showValues)}</span>
                    <span className="text-right font-mono">
                      {formatCurrency(pf * 12, showValues)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 bg-bg-raised p-3 font-bold text-ink border-t border-line text-sm">
                  <span>Total CTC</span>
                  <span className="text-right font-mono text-accent">
                    {formatCurrency(monthlyWage, showValues)}
                  </span>
                  <span className="text-right font-mono text-accent">
                    {formatCurrency(annualCtc, showValues)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedContractForBreakdown(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
