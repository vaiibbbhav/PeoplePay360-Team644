import React, { useState } from 'react';
import { X, Check, ShieldAlert } from 'lucide-react';
import { useEmployeesList } from '@/features/employees/queries/useEmployees';
import {
  useTimeOffTypes,
  useCreateAllocation,
  type CreateAllocationPayload,
} from '../queries/useTimeOff';

type GrantAllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const GrantAllocationModal: React.FC<GrantAllocationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: employees = [] } = useEmployeesList();
  const { data: types = [] } = useTimeOffTypes();
  const createMutation = useCreateAllocation();

  const currentYear = new Date().getFullYear();
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState<number>(20);
  const [validFrom, setValidFrom] = useState(`${currentYear}-01-01`);
  const [validTo, setValidTo] = useState(`${currentYear}-12-31`);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!employeeId) {
      setErrorMessage('Please select an employee.');
      return;
    }
    if (!timeOffTypeId) {
      setErrorMessage('Please select a leave category.');
      return;
    }
    if (allocatedAmount <= 0) {
      setErrorMessage('Allocated amount must be greater than 0.');
      return;
    }
    if (validTo < validFrom) {
      setErrorMessage('Valid To date cannot be earlier than Valid From date.');
      return;
    }

    const payload: CreateAllocationPayload = {
      employeeId,
      timeOffTypeId,
      allocatedAmount,
      validFrom,
      validTo,
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Failed to create leave allocation.';
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
                HR Allocation Quota
              </span>
              <h2 className="text-xl font-sans font-medium text-ink mt-0.5">
                Grant Leave Allocation
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
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Employee */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Target Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
              >
                <option value="" disabled>
                  Select employee...
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.department_name || 'No Dept'})
                  </option>
                ))}
              </select>
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={timeOffTypeId}
                onChange={(e) => setTimeOffTypeId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
              >
                <option value="" disabled>
                  Select category...
                </option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Allocated Quota Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="365"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent font-mono"
              />
            </div>

            {/* Validity Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Valid From
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Valid To
                </label>
                <input
                  type="date"
                  value={validTo}
                  min={validFrom}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>
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
                <span>Grant Allocation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
