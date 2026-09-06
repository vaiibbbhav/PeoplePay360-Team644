import React from 'react';
import type { AttendanceRecord } from '../queries/useAttendance';
import { formatTimeIST, getTodayIST } from '@/lib/formatters';

type AttendanceCalendarGridProps = {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  recordsMap: Map<string, AttendanceRecord>;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AttendanceCalendarGrid: React.FC<AttendanceCalendarGridProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  recordsMap,
  selectedDateStr,
  onSelectDate,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month name
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // First day of month (0 = Sunday, 1 = Monday, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startPadding = (firstDayIndex + 6) % 7;

  // Number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Today string YYYY-MM-DD in Indian Standard Time
  const todayStr = getTodayIST();

  const formatShortTime = (isoString?: string | null) => {
    return formatTimeIST(isoString);
  };

  return (
    <div className="border border-line rounded-2xl p-3 sm:p-6 bg-bg font-sans shadow-xs">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-base sm:text-xl font-bold text-ink m-0 tracking-tight">
            {monthLabel}
          </h3>
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1 text-[11px] font-medium border border-line rounded-lg bg-bg-raised hover:bg-bg text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-2 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-2 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Padding cells before start of month */}
        {Array.from({ length: startPadding }).map((_, idx) => (
          <div
            key={`pad-${idx}`}
            className="min-h-20 sm:min-h-24 p-2 rounded-xl border border-dashed border-line/40 bg-bg-raised/20 opacity-40 pointer-events-none"
          />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(
            2,
            '0',
          )}`;
          const record = recordsMap.get(dateStr);
          const isSelected = selectedDateStr === dateStr;
          const isTodayDate = todayStr === dateStr;

          const dayOfWeekIndex = (startPadding + idx) % 7;
          const isWeekend = dayOfWeekIndex === 5 || dayOfWeekIndex === 6;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`min-h-16 sm:min-h-24 p-1 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
                  : 'border-line hover:border-accent/40 bg-bg-raised/30 hover:bg-bg-raised/60'
              } ${isTodayDate ? 'border-accent/60' : ''}`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    isTodayDate
                      ? 'w-6 h-6 rounded-full bg-accent text-accent-ink flex items-center justify-center font-bold text-[11px]'
                      : isSelected
                        ? 'text-accent font-bold'
                        : 'text-ink'
                  }`}
                >
                  {dayNum}
                </span>

                {record?.is_manual_edit && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                    title="Manual HR adjustment logged"
                  />
                )}
              </div>

              {/* Attendance Day Card Content */}
              <div className="mt-1 space-y-1">
                {record ? (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded truncate ${
                          record.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : record.status === 'Late'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : record.status === 'Half-Day'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                : 'bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {record.status}
                      </span>
                      <span className="text-[10px] font-mono text-ink-soft font-medium">
                        {record.worked_hours}h
                      </span>
                    </div>

                    <div className="hidden sm:block text-[10px] font-mono text-ink-soft/80 truncate">
                      {formatShortTime(record.check_in)}
                      {record.check_out && ` - ${formatShortTime(record.check_out)}`}
                    </div>
                  </>
                ) : isWeekend ? (
                  <span className="text-[10px] text-ink-soft/50 font-medium">Weekend</span>
                ) : (
                  <span className="text-[10px] text-ink-soft/40 italic">No punch</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
