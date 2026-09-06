import React from 'react';
import type { AttendanceRecord } from '../queries/useAttendance';
import { formatTimeIST } from '@/lib/formatters';

type AttendanceDetailCardProps = {
  record: AttendanceRecord | null;
  selectedDateStr: string;
  onClose?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  isToday?: boolean;
};

export const AttendanceDetailCard: React.FC<AttendanceDetailCardProps> = ({
  record,
  selectedDateStr,
  onClose,
  onCheckIn,
  onCheckOut,
  isToday,
}) => {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    return formatTimeIST(isoString, true);
  };

  const formattedDate = (() => {
    try {
      const d = new Date(`${selectedDateStr}T12:00:00`);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  })();

  const dayNumber = selectedDateStr.split('-')[2] || '—';

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Present':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-raised text-ink border border-line">
            Present
          </span>
        );
      case 'Late':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-raised text-ink-soft border border-line">
            Late
          </span>
        );
      case 'Half-Day':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-raised text-ink border border-line">
            Half-Day
          </span>
        );
      case 'Absent':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-raised text-ink-soft line-through border border-line">
            Absent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-raised text-ink-soft border border-line">
            {status || 'Unrecorded'}
          </span>
        );
    }
  };

  return (
    <div className="border border-line rounded-xl p-4 sm:p-5 bg-bg font-sans transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-line bg-bg-raised text-ink font-mono font-bold text-sm flex items-center justify-center shrink-0">
            {dayNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink m-0">Daily Attendance Record</h3>
              {record ? getStatusBadge(record.status) : getStatusBadge('Unrecorded')}
            </div>
            <span className="text-xs text-ink-soft mt-0.5 block">{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isToday && (
            <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded border border-line bg-bg-raised text-ink-soft">
              Today
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-ink-soft hover:text-ink p-1 rounded-md hover:bg-bg-raised cursor-pointer transition-colors"
              title="Close details"
              aria-label="Close details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {record ? (
        <div className="space-y-4">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-line bg-bg-raised/40">
              <span className="text-[11px] text-ink-soft block mb-1">Check In</span>
              <div className="text-sm font-semibold text-ink font-mono">
                {formatTime(record.check_in)}
              </div>
              <span className="text-[10px] text-ink-soft">Morning punch</span>
            </div>

            <div className="p-3 rounded-lg border border-line bg-bg-raised/40">
              <span className="text-[11px] text-ink-soft block mb-1">Check Out</span>
              <div className="text-sm font-semibold text-ink font-mono">
                {formatTime(record.check_out)}
              </div>
              <span className="text-[10px] text-ink-soft">Evening punch</span>
            </div>

            <div className="p-3 rounded-lg border border-line bg-bg-raised/40">
              <span className="text-[11px] text-ink-soft block mb-1">Worked Hours</span>
              <div className="text-sm font-semibold text-ink font-mono">
                {record.worked_hours || '0.00'}{' '}
                <span className="text-xs font-normal text-ink-soft">hrs</span>
              </div>
              <span className="text-[10px] text-ink-soft">Net duration</span>
            </div>

            <div className="p-3 rounded-lg border border-line bg-bg-raised/40">
              <span className="text-[11px] text-ink-soft block mb-1">Verification</span>
              <div className="text-xs font-semibold text-ink truncate">
                {record.is_manual_edit ? 'Manual Entry' : 'Biometric Verified'}
              </div>
              <span className="text-[10px] text-ink-soft">Integrity status</span>
            </div>
          </div>

          {/* Exception / Operational Notes (Only shown if present) */}
          {record.exception_note && (
            <div className="p-3 rounded-lg border border-line bg-bg-raised/30 text-xs space-y-1">
              <span className="font-medium text-ink block">Exception Note</span>
              <p className="text-ink-soft m-0">{record.exception_note}</p>
            </div>
          )}

          {record.is_manual_edit && !record.exception_note && (
            <div className="text-[11px] text-ink-soft">
              This record was manually adjusted or corrected by an authorized supervisor.
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center bg-bg-raised/30 rounded-lg border border-line">
          <h4 className="text-xs font-semibold text-ink m-0">No Attendance Logged</h4>
          <p className="text-[11px] text-ink-soft max-w-sm mx-auto mt-1 mb-3">
            No check-in or check-out punch recorded for {formattedDate}.
          </p>

          {isToday && onCheckIn && (
            <button
              type="button"
              onClick={onCheckIn}
              className="py-1.5 px-3.5 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
            >
              Punch Check-In for Today
            </button>
          )}
        </div>
      )}

      {/* Quick Punch Bar for Today */}
      {isToday && record && (!record.check_in || !record.check_out) && (
        <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-soft">Shift Actions:</span>
          <div className="flex gap-2">
            {!record.check_in && onCheckIn && (
              <button
                type="button"
                onClick={onCheckIn}
                className="py-1.5 px-3 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                Punch Check-In
              </button>
            )}
            {record.check_in && !record.check_out && onCheckOut && (
              <button
                type="button"
                onClick={onCheckOut}
                className="py-1.5 px-3 rounded-lg border border-line hover:bg-bg-raised text-ink text-xs font-medium transition-colors cursor-pointer"
              >
                Punch Check-Out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
