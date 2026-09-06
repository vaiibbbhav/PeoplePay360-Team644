import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Calendar, AlertCircle, Info } from 'lucide-react';
import {
  useTimeOffTypes,
  useLeaveBalances,
  useCreateLeaveRequest,
  type CreateLeaveRequestPayload,
} from '../queries/useTimeOff';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDialogAccessibility } from '@/components/ui/useDialogAccessibility';

type ApplyLeaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTypeId?: string;
  targetEmployeeId?: string;
};

// Safe date parsing that avoids timezone midnight shifting
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // Noon local time
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  initialTypeId,
  targetEmployeeId,
}) => {
  const { data: user } = useCurrentUser();
  const effectiveEmployeeId = targetEmployeeId || user?.employeeId || 'emp-001';

  const { data: types = [] } = useTimeOffTypes();
  const { data: balances = [] } = useLeaveBalances(effectiveEmployeeId);
  const createMutation = useCreateLeaveRequest();

  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [duration, setDuration] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill type and default dates when opening
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      // If today is a weekend, default to next Monday
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 6) {
        today.setDate(today.getDate() + 2); // Monday
      } else if (dayOfWeek === 0) {
        today.setDate(today.getDate() + 1); // Monday
      }

      const todayStr = formatDateString(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setIsHalfDay(false);
      setExcludeWeekends(true);
      setReason('');
      setErrorMessage('');

      // Pre-select type
      const defaultType = initialTypeId || (types.length > 0 ? types[0].id : '');
      setSelectedTypeId(defaultType);
    }
  }, [isOpen, initialTypeId, types]);

  // Find active type balance
  const activeBalance = useMemo(() => {
    return balances.find((b) => b.typeId === selectedTypeId);
  }, [balances, selectedTypeId]);

  // Recalculate duration automatically whenever dates or flags change
  const dateCalculation = useMemo(() => {
    if (!startDate || !endDate) {
      return { workingDays: 0, calendarDays: 0, weekendDays: 0 };
    }

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    if (end < start) {
      return { workingDays: 0, calendarDays: 0, weekendDays: 0 };
    }

    let workingCount = 0;
    let weekendCount = 0;
    const cur = new Date(start);

    while (cur <= end) {
      const day = cur.getDay();
      if (day === 0 || day === 6) {
        weekendCount++;
      } else {
        workingCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const calendarDays = workingCount + weekendCount;
    const effectiveWorking = excludeWeekends ? workingCount : calendarDays;

    return {
      workingDays: effectiveWorking,
      calendarDays,
      weekendDays: weekendCount,
    };
  }, [startDate, endDate, excludeWeekends]);

  // Sync calculated duration
  useEffect(() => {
    if (isHalfDay) {
      setDuration(0.5);
    } else {
      setDuration(Math.max(1, dateCalculation.workingDays));
    }
  }, [dateCalculation, isHalfDay]);

  if (!isOpen) return null;

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val < startDate) {
      setStartDate(val);
    }
  };

  const handleToggleHalfDay = () => {
    if (!isHalfDay) {
      setIsHalfDay(true);
      setEndDate(startDate); // half day is always single date
    } else {
      setIsHalfDay(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedTypeId) {
      setErrorMessage('Please select a leave category.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Please specify both start and end dates.');
      return;
    }
    if (duration <= 0) {
      setErrorMessage('Duration must be greater than 0.');
      return;
    }

    // Balance check
    if (activeBalance && activeBalance.requiresAllocation) {
      if (duration > activeBalance.remaining) {
        setErrorMessage(
          `Insufficient balance. You requested ${duration} days but only have ${activeBalance.remaining.toFixed(1)} days remaining.`,
        );
        return;
      }
    }

    const payload: CreateLeaveRequestPayload = {
      employeeId: effectiveEmployeeId,
      timeOffTypeId: selectedTypeId,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      duration,
      reason: reason.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Failed to submit leave request.';
      setErrorMessage(msg);
    }
  };

  const dialogRef = useDialogAccessibility({ isOpen, onClose });
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    if (!createMutation.isPending) onClose();
  }, isOpen);

  const setCombinedRef = (node: HTMLDivElement | null) => {
    (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div
          ref={setCombinedRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-leave-title"
          tabIndex={-1}
          className="relative w-full max-w-lg bg-bg border border-line rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-line flex items-center justify-between bg-bg-raised/40">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                Time Off Request
              </span>
              <h2 id="apply-leave-title" className="text-lg sm:text-xl font-serif font-bold text-ink mt-0.5">
                Apply for Leave
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Leave Category Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Leave Category <span className="text-rose-500">*</span>
                </label>
                {activeBalance && (
                  <span className="text-[11px] font-medium text-accent font-mono">
                    {activeBalance.requiresAllocation
                      ? `${activeBalance.remaining.toFixed(1)} ${activeBalance.unit} remaining`
                      : 'Unlimited allocation'}
                  </span>
                )}
              </div>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent shadow-xs"
              >
                <option value="" disabled>
                  Select leave category...
                </option>
                {types.map((t) => {
                  const bal = balances.find((b) => b.typeId === t.id);
                  const balStr =
                    bal && bal.requiresAllocation
                      ? ` (${bal.remaining.toFixed(1)} ${t.unit} remaining)`
                      : !t.requiresAllocation
                        ? ' (Unlimited)'
                        : '';
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} {balStr}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={isHalfDay ? startDate : endDate}
                  min={startDate}
                  disabled={isHalfDay}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Duration & Options Bar */}
            <div className="p-3.5 rounded-xl bg-bg-raised/70 border border-line space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-xs text-ink font-semibold">Total Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="90"
                    value={duration}
                    onChange={(e) => {
                      setDuration(parseFloat(e.target.value) || 0);
                      setIsHalfDay(false);
                    }}
                    className="w-16 px-2 py-1 text-right text-xs font-mono font-bold border border-line rounded-lg bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                  <span className="text-xs font-medium text-ink-soft">Days</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={excludeWeekends}
                    disabled={isHalfDay}
                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                    className="rounded border-line text-accent focus:ring-accent w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-ink-soft">
                    Exclude Weekends ({dateCalculation.weekendDays} sat/sun skipped)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleToggleHalfDay}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    isHalfDay
                      ? 'bg-accent text-white border-accent'
                      : 'border-line bg-bg text-ink hover:bg-bg-raised'
                  }`}
                >
                  {isHalfDay ? 'Half-Day (0.5d) Active' : 'Half-Day (0.5d)'}
                </button>
              </div>

              {/* Calculation Explanation */}
              <div className="flex items-center gap-1.5 text-[11px] text-ink-soft pt-1">
                <Info className="w-3 h-3 text-accent shrink-0" />
                <span>
                  {dateCalculation.calendarDays} total calendar days • {duration} working days requested
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Reason / Note (Optional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the context or reason for this leave request..."
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent resize-none placeholder:text-ink-soft/60"
              />
            </div>

            {/* Action buttons */}
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
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
