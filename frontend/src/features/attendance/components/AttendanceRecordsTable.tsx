import React from 'react';
import { Fingerprint, FileEdit, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import type { AttendanceRecord } from '../queries/useAttendance';
import { Pagination, usePagination } from '@/components/ui/Pagination';

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
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedRecords,
  } = usePagination(records, 20);
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Present
        </span>
      );
    }
    if (s.includes('late')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Late Arrival
        </span>
      );
    }
    if (s.includes('half')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          Half-Day
        </span>
      );
    }
    if (s.includes('overtime')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent-soft text-accent border border-accent/40">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          Overtime
        </span>
      );
    }
    if (s.includes('absent')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
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
            <tr className="border-b border-line bg-bg-raised/70 text-ink-soft font-semibold text-xs">
              <th className="py-3 px-4 w-[24%] min-w-[200px]">Employee</th>
              <th className="py-3 px-4 w-[14%] min-w-[120px]">Date</th>
              <th className="py-3 px-3 w-[10%] min-w-[85px]">Check In</th>
              <th className="py-3 px-3 w-[10%] min-w-[85px]">Check Out</th>
              <th className="py-3 px-3 w-[10%] min-w-[85px]">Hours</th>
              <th className="py-3 px-3 w-[12%] min-w-[110px] text-center">Status</th>
              <th className="py-3 px-4 w-[20%] max-w-[200px]">Source & Exceptions</th>
              {canManage && <th className="py-3 px-4 w-[80px] text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paginatedRecords.map((record) => {
              const { weekday, dayMonthYear } = formatDate(record.date, record.check_in);
              const hrs =
                typeof record.worked_hours === 'number'
                  ? record.worked_hours.toFixed(2)
                  : parseFloat(String(record.worked_hours || '0')).toFixed(2);

              const initials = (record.employee_name || 'E')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <tr key={record.id} className="hover:bg-bg-raised/40 transition-colors group">
                  {/* Employee identity */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-ink block text-xs truncate">
                          {record.employee_name || 'Unnamed Employee'}
                        </span>
                        {record.employee_email ? (
                          <span className="text-[11px] text-ink-soft block font-mono truncate">
                            {record.employee_email}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-ink">{dayMonthYear}</div>
                    <div className="text-[11px] text-ink-soft">{weekday}</div>
                  </td>

                  {/* Check In */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-ink text-xs">
                    {formatTime(record.check_in) || '—'}
                  </td>

                  {/* Check Out */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-ink text-xs">
                    {formatTime(record.check_out) || '—'}
                  </td>

                  {/* Worked Hours */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-semibold text-ink font-mono">{hrs} hrs</div>
                    {Number(hrs) > 8 && (
                      <span className="text-[10px] text-accent font-medium block">
                        +{(Number(hrs) - 8).toFixed(1)}h OT
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-center">
                    {getStatusBadge(record.status)}
                  </td>

                  {/* Source & Exceptions */}
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {record.is_manual_edit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/60">
                            <FileEdit className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Manual Edit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft bg-bg-raised/70 px-2 py-0.5 rounded-md border border-line">
                            <Fingerprint className="w-3 h-3 text-accent" />
                            Biometric
                          </span>
                        )}
                      </div>
                      {record.exception_note && (
                        <div
                          className="text-[11px] text-ink-soft italic flex items-center gap-1 max-w-full"
                          title={record.exception_note}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[170px] block">
                            {record.exception_note}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditRecord(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
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
      <Pagination
        currentPage={currentPage}
        totalItems={records.length}
        pageSize={pageSize}
        pageSizeOptions={[15, 20, 50, 100]}
        itemName="attendance records"
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};
