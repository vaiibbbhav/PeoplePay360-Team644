import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import {
  useCreateTimeOffType,
  type CreateTimeOffTypePayload,
} from '../queries/useTimeOff';

type NewLeaveTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const NewLeaveTypeModal: React.FC<NewLeaveTypeModalProps> = ({ isOpen, onClose }) => {
  const createMutation = useCreateTimeOffType();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState<'days' | 'hours'>('days');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [approvalType, setApprovalType] = useState<'hr_only' | 'manager_and_hr' | 'auto'>('hr_only');
  const [isPaid, setIsPaid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please provide a policy name.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Please provide a short code.');
      return;
    }

    const payload: CreateTimeOffTypePayload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      unit,
      requiresAllocation,
      approvalType,
      isPaid,
      isActive: true,
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Failed to create leave policy.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-bg border border-line rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-bg-raised/40">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                HR Policy Definition
              </span>
              <h2 className="text-xl font-sans font-medium text-ink mt-0.5">
                New Leave Policy
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Policy Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Parental Leave"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Short Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. PARENT"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Tracking Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'days' | 'hours')}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="days">Days (Standard)</option>
                  <option value="hours">Hours (Hourly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Approval Workflow
                </label>
                <select
                  value={approvalType}
                  onChange={(e) =>
                    setApprovalType(e.target.value as 'hr_only' | 'manager_and_hr' | 'auto')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="hr_only">HR Administrator Only</option>
                  <option value="manager_and_hr">Direct Manager & HR</option>
                  <option value="auto">Auto-Approved</option>
                </select>
              </div>
            </div>

            {/* Checkbox options */}
            <div className="space-y-2.5 pt-2 border-t border-line">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresAllocation}
                  onChange={(e) => setRequiresAllocation(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent w-4 h-4"
                />
                <div>
                  <div className="text-xs font-medium text-ink">Requires Prior Quota Allocation</div>
                  <div className="text-[11px] text-ink-soft">
                    Employees must have an approved balance before requesting this leave.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent w-4 h-4"
                />
                <div>
                  <div className="text-xs font-medium text-ink">Paid Leave (Counts Toward Payroll)</div>
                  <div className="text-[11px] text-ink-soft">
                    Days taken will be paid out as standard working days in the payroll salary calculation.
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-xs"
              >
                {createMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Leave Policy</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
