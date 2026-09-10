import React from 'react';
import type { ScheduleLineItem } from '../queries/useSchedules';

type WeeklyTimetableGridProps = {
  lines: ScheduleLineItem[];
};

const ALL_DAYS: Array<ScheduleLineItem['dayOfWeek']> = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const WeeklyTimetableGrid: React.FC<WeeklyTimetableGridProps> = ({ lines }) => {
  const lineMap = new Map<string, ScheduleLineItem>();
  for (const l of lines) {
    lineMap.set(l.dayOfWeek, l);
  }

  const calculateDailyHours = (start?: string, end?: string, breakMin?: number) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const totalMin = (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0));
    const workedMin = Math.max(0, totalMin - (breakMin || 0));
    return (workedMin / 60).toFixed(1);
  };

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-bg">
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[460px] sm:min-w-0">
          <div className="grid grid-cols-7 border-b border-line bg-bg-raised text-[11px] font-semibold text-ink-soft uppercase tracking-wider text-center py-2">
            {ALL_DAYS.map((day) => (
              <div key={day} className="px-1">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-line text-center text-xs">
            {ALL_DAYS.map((day) => {
              const item = lineMap.get(day);
              const isWorking = Boolean(item);
              const dailyHours = isWorking
                ? calculateDailyHours(item?.startTime, item?.endTime, item?.breakMinutes)
                : null;

              return (
                <div
                  key={day}
                  className={`p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1 min-h-[72px] ${
                    isWorking ? 'bg-bg' : 'bg-bg-raised/40 text-ink-soft'
                  }`}
                >
                  {isWorking ? (
                    <>
                      <span className="font-semibold text-ink text-[11px] whitespace-nowrap">
                        {item?.startTime.slice(0, 5)} - {item?.endTime.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-ink-soft whitespace-nowrap">
                        {item?.breakMinutes}m break
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent-soft text-accent font-medium">
                        {dailyHours}h
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-ink-soft italic">Off</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
