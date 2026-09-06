import React, { useState } from 'react';
import { useEmployeeContracts } from '../queries/useEmployeePayslips';
import { formatCurrency } from '@/lib/formatters';
import { useClickOutside } from '@/hooks/useClickOutside';

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

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    setSelectedContractForBreakdown(null);
  }, Boolean(selectedContractForBreakdown));

  return (
    <div className="space-y-6 pt-2">
      <div className="flex justify-between items-center pb-2 border-b border-line">
        <div>
          <h2 className="font-sans text-lg sm:text-xl font-semibold text-ink">Pay Package & CTC Breakdown</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Historical and active compensation contracts with salary rule decomposition.
          </p>
        </div>
        <span className="text-xs text-ink-soft font-mono shrink-0">FY 2026-27</span>
      </div>

      {contracts.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-8 text-center bg-bg-raised/20">
          <p className="text-sm font-medium text-ink">No contracts found</p>
          <p className="text-xs text-ink-soft mt-1">
            There are no active or historical contracts recorded for this profile.
          </p>
        </div>
      ) : (
        <div className="border border-line rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-bg-raised text-ink-soft border-b border-line">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Contract</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Salary Structure</th>
                <th className="py-2.5 px-4 font-semibold">Effective Period</th>
                <th className="py-2.5 px-4 font-semibold text-right">Wage (Gross/Mo)</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contracts.map((c: any) => {
                const isActive = c.status === 'active';
                return (
                  <tr key={c.id} className="hover:bg-bg-raised/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">{c.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-bg-raised text-ink-soft border-line'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {c.salary_structure_name || 'Default Monthly'}
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {c.start_date ? new Date(c.start_date).toLocaleDateString() : 'N/A'} -{' '}
                      {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'Present'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-ink">
                      {formatCurrency(c.wage, showValues)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedContractForBreakdown(c)}
                        className="px-2.5 py-1 rounded bg-bg border border-line hover:border-accent text-accent transition-colors font-medium cursor-pointer"
                      >
                        View CTC
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
          <div
            ref={modalRef}
            className="bg-bg border border-line rounded-xl max-w-xl w-full p-6 shadow-xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <h3 className="font-sans text-lg font-bold text-ink">
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
