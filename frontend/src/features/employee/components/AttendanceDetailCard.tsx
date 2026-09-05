import React from 'react';
import type { AttendanceRecord } from '../queries/useAttendance';
import { formatTimeIST, formatDateTimeIST, getRecordDateIST } from '@/lib/formatters';

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
    return formatTimeIST(isoString, true);
  };

  const formatTimestamp = (isoString?: string | null) => {
    return formatDateTimeIST(isoString);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Present':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            Present
          </span>
        );
      case 'Late':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            Late
          </span>
        );
      case 'Half-Day':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
            Half-Day
          </span>
        );
      case 'Absent':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30">
            Absent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-bg-raised text-ink-soft border border-line">
            {status || 'No Log'}
          </span>
        );
    }
  };

  return (
    <div className="p-6 sm:p-7 bg-bg font-sans transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-serif font-bold text-base">
            {selectedDateStr.split('-')[2] || '—'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-ink m-0">Daily Attendance Record</h3>
              {record ? getStatusBadge(record.status) : getStatusBadge('Unrecorded')}
            </div>
            <span className="text-xs text-ink-soft font-mono mt-0.5 block">{selectedDateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isToday && (
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border border-line bg-bg text-accent">
              Today
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-ink-soft hover:text-ink p-1 rounded-md cursor-pointer transition-colors"
              title="Close details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="space-y-5">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-line bg-bg">
              <span className="text-[11px] text-ink-soft block mb-1">Check In</span>
              <div className="text-sm font-semibold text-ink font-mono">
                {formatTime(record.check_in)}
              </div>
              <span className="text-[10px] text-ink-soft">Morning punch</span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-bg">
              <span className="text-[11px] text-ink-soft block mb-1">Check Out</span>
              <div className="text-sm font-semibold text-ink font-mono">
                {formatTime(record.check_out)}
              </div>
              <span className="text-[10px] text-ink-soft">Evening punch</span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-bg">
              <span className="text-[11px] text-ink-soft block mb-1">Worked Hours</span>
              <div className="text-sm font-semibold text-accent font-mono">
                {record.worked_hours} <span className="text-xs text-ink-soft">hrs</span>
              </div>
              <span className="text-[10px] text-ink-soft">Net duration</span>
            </div>

            <div className="p-3 rounded-xl border border-line bg-bg">
              <span className="text-[11px] text-ink-soft block mb-1">Audit Type</span>
              <div className="text-xs font-semibold text-ink">
                {record.is_manual_edit ? (
                  <span className="text-amber-600 dark:text-amber-400">Manual Edit</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">Biometric Verified</span>
                )}
              </div>
              <span className="text-[10px] text-ink-soft">Integrity status</span>
            </div>
          </div>

          {/* Full Database Field Inspection Table */}
          <div className="border border-line rounded-xl overflow-hidden bg-bg">
            <div className="px-4 py-2.5 bg-bg-raised/70 border-b border-line flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Attendance Entity Statistics</span>
              <span className="text-[10px] text-ink-soft font-mono">Database Schema Fields</span>
            </div>

            <div className="divide-y divide-line text-xs">
              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">id</span>
                <span className="font-mono text-ink text-[11px] select-all break-all">
                  {record.id}
                </span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">employee_id</span>
                <span className="font-mono text-ink text-[11px] select-all break-all">
                  {record.employee_id}
                </span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">date</span>
                <span className="font-mono text-ink font-semibold">{getRecordDateIST(record) || record.date}</span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">check_in</span>
                <span className="font-mono text-ink">{record.check_in || 'null'}</span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">check_out</span>
                <span className="font-mono text-ink">{record.check_out || 'null'}</span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">worked_hours</span>
                <span className="font-mono text-ink font-semibold">{record.worked_hours}</span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">status</span>
                <div>{getStatusBadge(record.status)}</div>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">exception_note</span>
                <span className="text-ink text-right max-w-sm italic">
                  {record.exception_note || (
                    <span className="text-ink-soft/70">No exception note filed</span>
                  )}
                </span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">is_manual_edit</span>
                <span
                  className={`font-semibold ${
                    record.is_manual_edit
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600'
                  }`}
                >
                  {record.is_manual_edit
                    ? 'true (Manual HR Adjustment)'
                    : 'false (Raw Biometric Machine Punch)'}
                </span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">created_at</span>
                <span className="font-mono text-ink-soft text-[11px]">
                  {formatTimestamp(record.created_at)}
                </span>
              </div>

              <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-ink-soft font-medium">updated_at</span>
                <span className="font-mono text-ink-soft text-[11px]">
                  {formatTimestamp(record.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-bg rounded-xl border border-line">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-ink m-0">No attendance punch recorded</h4>
          <p className="text-xs text-ink-soft max-w-sm mx-auto mt-1 mb-4">
            No biometric check-in or checkout activity was logged for {selectedDateStr}.
          </p>

          {isToday && onCheckIn && (
            <button
              onClick={onCheckIn}
              className="py-2 px-4 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Punch Check-In for Today
            </button>
          )}
        </div>
      )}

      {/* Quick Punch bar for Today */}
      {isToday && record && (
        <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-soft">Current Day Punch Actions:</span>
          <div className="flex gap-2">
            {!record.check_in && onCheckIn && (
              <button
                onClick={onCheckIn}
                className="py-1.5 px-3 rounded-lg bg-accent text-accent-ink text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                Punch Check-In
              </button>
            )}
            {record.check_in && !record.check_out && onCheckOut && (
              <button
                onClick={onCheckOut}
                className="py-1.5 px-3 rounded-lg border border-accent text-accent hover:bg-accent/10 text-xs font-medium transition-colors cursor-pointer"
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
