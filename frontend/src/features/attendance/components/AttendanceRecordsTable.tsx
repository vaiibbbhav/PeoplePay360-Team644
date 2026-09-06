import React from 'react';
import {
  Clock,
  Fingerprint,
  FileEdit,
  AlertTriangle,
  User,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import type { AttendanceRecord } from '../queries/useAttendance';

import { formatTimeIST, formatDateIST } from '@/lib/formatters';

type AttendanceRecordsTableProps = {
  records: AttendanceRecord[];
  isLoading?: boolean;
  onEditRecord: (record: AttendanceRecord) => void;
  canManage: boolean;
};

export const AttendanceRecordsTable: React.FC<AttendanceRecordsTableProps> = ({
  records,
  isLoading,
  onEditRecord,
  canManage,
}) => {
  const formatTime = (isoString?: string | null) => {
    return formatTimeIST(isoString);
  };

  const formatDate = (dateStr: string, checkIn?: string | null) => {
    try {
      const targetDateStr = checkIn ? formatDateIST(checkIn) || dateStr : dateStr;
      const d = new Date(targetDateStr + 'T12:00:00+05:30');
      const weekday = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
      const dayMonthYear = d.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      return { weekday, dayMonthYear };
    } catch {
      return { weekday: '', dayMonthYear: dateStr };
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('present')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Present
        </span>
      );
    }
    if (s.includes('late')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Late Arrival
        </span>
      );
    }
    if (s.includes('half')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Half-Day
        </span>
      );
    }
    if (s.includes('overtime')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/30">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Overtime
        </span>
      );
    }
    if (s.includes('absent')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-bg-raised text-ink-soft border border-line">
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="border border-line rounded-2xl p-12 text-center bg-bg">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-sans text-ink-soft">Loading attendance ledger records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="border border-line rounded-2xl p-12 text-center bg-bg">
        <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-line flex items-center justify-center mx-auto mb-4 text-ink-soft">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="font-sans text-lg font-medium text-ink mb-1">No Attendance Records Found</h3>
        <p className="text-xs font-sans text-ink-soft max-w-sm mx-auto">
          No logs match your active filters or date selection. Adjust filters or record a manual
          punch using the toolbar above.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-2xl overflow-hidden bg-bg font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-bg-raised/60 text-ink-soft uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Employee</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Check In</th>
              <th className="py-3 px-4 font-semibold">Check Out</th>
              <th className="py-3 px-4 font-semibold">Hours Logged</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Source / Exception</th>
              {canManage && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {records.map((record) => {
              const { weekday, dayMonthYear } = formatDate(record.date, record.check_in);
              const hrs =
                typeof record.worked_hours === 'number'
                  ? record.worked_hours.toFixed(2)
                  : parseFloat(String(record.worked_hours || '0')).toFixed(2);

              return (
                <tr
                  key={record.id}
                  className="hover:bg-bg-raised/40 transition-colors group"
                >
                  {/* Employee identity */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent/30 text-accent flex items-center justify-center text-xs font-semibold shrink-0">
                        {record.employee_name
                          ? record.employee_name.charAt(0).toUpperCase()
                          : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
                          {record.employee_name || record.employee_id}
                        </div>
                        <div className="text-[10px] text-ink-soft font-mono">
                          {record.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-ink">{dayMonthYear}</div>
                    <div className="text-[10px] text-ink-soft uppercase tracking-wider">
                      {weekday}
                    </div>
                  </td>

                  {/* Check In */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-ink">
                      <Clock className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                      <span>{formatTime(record.check_in)}</span>
                    </div>
                  </td>

                  {/* Check Out */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-ink">
                      <Clock className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                      <span>{formatTime(record.check_out)}</span>
                    </div>
                  </td>

                  {/* Worked Hours */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-ink font-mono">{hrs} hrs</div>
                    {Number(hrs) > 8 ? (
                      <span className="text-[10px] text-accent font-medium">Standard + OT</span>
                    ) : (
                      <span className="text-[10px] text-ink-soft">Standard Shift</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>

                  {/* Source & Exceptions */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {record.is_manual_edit ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <FileEdit className="w-3 h-3" />
                            HR Manual Edit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-soft bg-bg-raised px-1.5 py-0.5 rounded border border-line">
                            <Fingerprint className="w-3 h-3 text-accent" />
                            Biometric Sensor
                          </span>
                        )}
                      </div>
                      {record.exception_note && (
                        <div
                          className="text-[11px] text-ink-soft italic truncate flex items-center gap-1"
                          title={record.exception_note}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{record.exception_note}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onEditRecord(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink transition-colors"
                      >
                        <span>Adjust</span>
                        <ArrowRight className="w-3 h-3 text-ink-soft" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-bg-raised/40 border-t border-line flex items-center justify-between text-xs text-ink-soft">
        <div>
          Showing <span className="font-semibold text-ink">{records.length}</span> recorded attendance logs
        </div>
        <div className="text-[11px]">
          All timestamps synced to company timezone
        </div>
      </div>
    </div>
  );
};
