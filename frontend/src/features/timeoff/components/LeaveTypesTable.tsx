import React, { useState } from 'react';
import { Plus, Settings, ShieldCheck } from 'lucide-react';
import { useTimeOffTypes } from '../queries/useTimeOff';
import { NewLeaveTypeModal } from './NewLeaveTypeModal';

type LeaveTypesTableProps = {
  canManage?: boolean;
};

export const LeaveTypesTable: React.FC<LeaveTypesTableProps> = ({ canManage }) => {
  const { data: types = [], isLoading } = useTimeOffTypes();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Time Off Policies & Types
          </h3>
          <p className="text-xs text-ink-soft">
            Define leave categories, tracking units, approval rules, and payroll integration.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Leave Policy</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="border border-line rounded-2xl p-12 text-center bg-bg">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-ink-soft">Loading policies...</p>
        </div>
      ) : types.length === 0 ? (
        <div className="border border-line rounded-2xl p-12 text-center bg-bg">
          <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-line flex items-center justify-center mx-auto mb-3 text-ink-soft">
            <Settings className="w-6 h-6" />
          </div>
          <h4 className="font-sans text-base font-medium text-ink">No Policies Defined</h4>
          <p className="text-xs text-ink-soft max-w-sm mx-auto mt-1">
            Create standard leave types such as Paid Vacation, Sick Leave, or Parental Leave.
          </p>
        </div>
      ) : (
        <div className="border border-line rounded-2xl overflow-hidden bg-bg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-bg-raised/60 text-ink-soft uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Policy Name</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Unit</th>
                  <th className="py-3 px-4 font-semibold">Compensation</th>
                  <th className="py-3 px-4 font-semibold">Allocation</th>
                  <th className="py-3 px-4 font-semibold">Approval Flow</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-bg-raised/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-ink">{t.name}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-accent">
                      {t.code}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap capitalize text-ink">
                      {t.unit}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Paid Leave
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-ink-soft bg-bg-raised px-2 py-0.5 rounded border border-line">
                          Unpaid
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.requiresAllocation ? (
                        <span className="text-ink font-medium">Pre-allocated Quota</span>
                      ) : (
                        <span className="text-ink-soft italic">No Quota Required</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs text-ink-soft capitalize">
                        {t.approvalType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {t.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="text-ink-soft text-[11px]">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewLeaveTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
