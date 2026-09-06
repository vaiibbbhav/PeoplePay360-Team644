import React, { useState } from 'react';
import { Plus, Check, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTimeOffAllocations, useApproveAllocation } from '../queries/useTimeOff';
import { GrantAllocationModal } from './GrantAllocationModal';
import { InlineAlert } from '@/components/ui/InlineAlert';

type AllocationsTableProps = {
  canManage?: boolean;
};

export const AllocationsTable: React.FC<AllocationsTableProps> = ({ canManage }) => {
  const { data: allocations = [], isLoading } = useTimeOffAllocations();
  const approveMutation = useApproveAllocation();
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    try {
      setActionError(null);
      await approveMutation.mutateAsync(id);
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to approve allocation.',
      );
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Employee Leave Allocations
          </h3>
          <p className="text-xs text-ink-soft">
            Annual entitlements, taken quotas, and remaining leave balances.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsGrantModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Grant Allocation</span>
          </button>
        )}
      </div>

      {actionError && <InlineAlert>{actionError}</InlineAlert>}

      {isLoading ? (
        <div className="border border-line rounded-2xl p-12 text-center bg-bg">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-ink-soft">Loading allocations ledger...</p>
        </div>
      ) : allocations.length === 0 ? (
        <div className="border border-line rounded-2xl p-12 text-center bg-bg">
          <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-line flex items-center justify-center mx-auto mb-3 text-ink-soft">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="font-sans text-base font-medium text-ink">No Allocations Recorded</h4>
          <p className="text-xs text-ink-soft max-w-sm mx-auto mt-1">
            Assign annual vacation, sick, and personal leave days to employees using the button
            above.
          </p>
        </div>
      ) : (
        <div className="border border-line rounded-2xl overflow-hidden bg-bg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-bg-raised/60 text-ink-soft uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Leave Type</th>
                  <th className="py-3 px-4 font-semibold">Allocated</th>
                  <th className="py-3 px-4 font-semibold">Taken</th>
                  <th className="py-3 px-4 font-semibold">Remaining</th>
                  <th className="py-3 px-4 font-semibold">Validity Period</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  {canManage && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-bg-raised/40 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-ink">
                        {alloc.employee_name || alloc.employee_id}
                      </div>
                      <div className="text-[10px] text-ink-soft">
                        {alloc.department_name || 'Staff'}
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-ink">{alloc.type_name}</span>
                    </td>

                    {/* Allocated */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-ink">
                      {parseFloat(String(alloc.allocated_amount)).toFixed(1)} {alloc.type_unit}
                    </td>

                    {/* Taken */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-ink-soft">
                      {parseFloat(String(alloc.taken_amount)).toFixed(1)} {alloc.type_unit}
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-accent">
                      {parseFloat(String(alloc.remaining_amount)).toFixed(1)} {alloc.type_unit}
                    </td>

                    {/* Validity Period */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-ink-soft">
                      {alloc.valid_from} → {alloc.valid_to}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {alloc.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" />
                          Draft / Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {alloc.status === 'draft' ? (
                          <button
                            type="button"
                            disabled={approveMutation.isPending}
                            onClick={() => handleApprove(alloc.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-white text-[11px] font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-ink-soft">Active</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GrantAllocationModal isOpen={isGrantModalOpen} onClose={() => setIsGrantModalOpen(false)} />
    </div>
  );
};
