import React, { useState } from 'react';
import { X, Calendar, Clock, Check, AlertTriangle, FileText } from 'lucide-react';
import {
  useApproveLeaveRequest,
  useRefuseLeaveRequest,
  type TimeOffRequest,
} from '../queries/useTimeOff';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDialogAccessibility } from '@/components/ui/useDialogAccessibility';

type RequestDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  request: TimeOffRequest | null;
  canManage?: boolean;
};

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  canManage = false,
}) => {
  const [isRefusing, setIsRefusing] = useState(false);
  const [refusalReason, setRefusalReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const approveMutation = useApproveLeaveRequest();
  const refuseMutation = useRefuseLeaveRequest();

  const dialogRef = useDialogAccessibility({ isOpen, onClose });
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    if (!approveMutation.isPending && !refuseMutation.isPending) {
      handleClose();
    }
  }, isOpen);

  const setCombinedRef = (node: HTMLDivElement | null) => {
    (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const handleClose = () => {
    setIsRefusing(false);
    setRefusalReason('');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen || !request) return null;

  const isPending = request.status?.toLowerCase() === 'pending';

  const handleApprove = async () => {
    try {
      setErrorMessage('');
      await approveMutation.mutateAsync(request.id);
      handleClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to approve request.');
      setErrorMessage(msg);
    }
  };

  const handleRefuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refusalReason.trim()) {
      setErrorMessage('Please provide a justification reason for refusing this request.');
      return;
    }
    try {
      setErrorMessage('');
      await refuseMutation.mutateAsync({
        requestId: request.id,
        reason: refusalReason.trim(),
      });
      handleClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to refuse request.');
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={setCombinedRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-modal-title"
          className="relative w-full max-w-lg bg-bg border border-line rounded-2xl shadow-xl overflow-hidden p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <span className="text-[11px] font-mono font-medium text-accent uppercase tracking-wider">
                Time Off Request Detail
              </span>
              <h2 id="request-modal-title" className="font-serif text-xl font-bold text-ink mt-0.5">
                {request.type_name}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Submitted by {request.employee_name || 'Staff Member'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Employee & Job Context */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-line bg-bg-raised/40">
            <div className="w-10 h-10 rounded-full bg-accent text-accent-ink font-bold text-sm flex items-center justify-center shrink-0">
              {request.employee_avatar ? (
                <img
                  src={request.employee_avatar}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (request.employee_name || 'E').charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink text-sm truncate">
                {request.employee_name || request.employee_id}
              </div>
              <div className="text-xs text-ink-soft truncate flex items-center gap-2 mt-0.5">
                <span>{request.job_position_title || 'Employee'}</span>
                <span>·</span>
                <span>{request.department_name || 'General Staff'}</span>
              </div>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isPending
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : request.status === 'approved'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPending
                  ? 'Pending Review'
                  : request.status === 'approved'
                    ? 'Approved'
                    : 'Refused'}
              </span>
            </div>
          </div>

          {/* Request Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-line bg-bg">
              <span className="text-ink-soft block flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>Date Range</span>
              </span>
              <span className="font-semibold text-ink text-sm">
                {request.start_date} → {request.end_date}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-bg">
              <span className="text-ink-soft block flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Duration</span>
              </span>
              <span className="font-semibold text-ink text-sm">
                {request.duration} {request.type_unit} ({request.is_paid ? 'Paid' : 'Unpaid'})
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="p-3.5 rounded-xl border border-line bg-bg space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>Employee Stated Reason</span>
            </span>
            <p className="text-xs text-ink-soft leading-relaxed">
              {request.reason || 'No specific reason provided by employee.'}
            </p>
          </div>

          {/* Refusal / Approval Notes */}
          {request.status === 'refused' && request.refused_reason && (
            <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Refusal Justification</span>
              </div>
              <p>{request.refused_reason}</p>
            </div>
          )}

          {request.status === 'approved' && request.approved_at && (
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300">
              Approved and deducted from allocation on{' '}
              {new Date(request.approved_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              .
            </div>
          )}

          {/* Refusal Reason Input Form (Conditional) */}
          {isRefusing && (
            <form onSubmit={handleRefuse} className="space-y-3 pt-2 border-t border-line">
              <label className="text-xs font-semibold text-ink block">
                Refusal Justification (Mandatory)
              </label>
              <textarea
                rows={3}
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="State the operational reason for refusing this leave..."
                className="w-full text-xs p-3 rounded-xl border border-line bg-bg text-ink focus:outline-none focus:border-accent resize-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRefusing(false)}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink hover:bg-bg-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refuseMutation.isPending || !refusalReason.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {refuseMutation.isPending ? 'Refusing...' : 'Confirm Refusal'}
                </button>
              </div>
            </form>
          )}

          {/* Action Buttons for Pending Requests */}
          {canManage && isPending && !isRefusing && (
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setIsRefusing(true)}
                className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
              >
                Refuse Request
              </button>
              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-accent text-accent-ink text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{approveMutation.isPending ? 'Approving...' : 'Approve Leave Request'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
