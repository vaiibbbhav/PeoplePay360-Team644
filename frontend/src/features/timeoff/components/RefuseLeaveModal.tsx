import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useRefuseLeaveRequest, type TimeOffRequest } from '../queries/useTimeOff';

type RefuseLeaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  request: TimeOffRequest | null;
};

export const RefuseLeaveModal: React.FC<RefuseLeaveModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const refuseMutation = useRefuseLeaveRequest();

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide a justification reason for refusing this leave request.');
      return;
    }

    try {
      await refuseMutation.mutateAsync({
        requestId: request.id,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Failed to refuse leave request.';
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
        <div className="relative w-full max-w-md bg-bg border border-line rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-bg-raised/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-serif font-medium text-ink">Refuse Leave Request</h2>
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
            <div className="p-3.5 bg-bg-raised rounded-xl border border-line text-xs space-y-1">
              <div className="font-semibold text-ink">
                {request.employee_name} ({request.type_name})
              </div>
              <div className="text-ink-soft">
                {request.start_date} to {request.end_date} • {request.duration} days
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Refusal Justification / Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason (e.g. key project milestone conflict, insufficient team coverage)..."
                required
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-rose-500 resize-none placeholder:text-ink-soft/60"
              />
              <p className="text-[11px] text-ink-soft mt-1">
                This reason will be visible to the employee on their leave tracking screen.
              </p>
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
                disabled={refuseMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {refuseMutation.isPending ? 'Processing...' : 'Confirm Refusal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
