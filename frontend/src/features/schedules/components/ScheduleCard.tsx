import React from 'react';
import type { ScheduleItem } from '../queries/useSchedules';
import { WeeklyTimetableGrid } from './WeeklyTimetableGrid';

type ScheduleCardProps = {
  schedule: ScheduleItem;
  onEdit: (schedule: ScheduleItem) => void;
  onDelete: (schedule: ScheduleItem) => void;
};

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onEdit, onDelete }) => {
  const workingDayCount = schedule.lines.length;

  return (
    <div className="border border-line rounded-2xl p-4 sm:p-6 bg-bg hover:border-accent/40 transition-colors flex flex-col justify-between gap-5">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-ink m-0">{schedule.name}</h3>
            </div>
            <p className="text-xs text-ink-soft mt-1 mb-0">
              {workingDayCount} working days per week · {schedule.employeeCount || 0} employees
              assigned
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {schedule.weeklyHours}
            </span>
            <span className="text-xs text-ink-soft block -mt-1">hrs / week</span>
          </div>
        </div>

        {/* Timetable visualizer */}
        <div className="mt-4">
          <WeeklyTimetableGrid lines={schedule.lines} />
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between pt-4 border-t border-line/60">
        <span className="text-[11px] text-ink-soft">
          Created{' '}
          {new Date(schedule.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(schedule)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Edit Schedule
          </button>
          <button
            type="button"
            onClick={() => onDelete(schedule)}
            disabled={(schedule.employeeCount || 0) > 0}
            title={
              (schedule.employeeCount || 0) > 0
                ? 'Cannot delete schedule assigned to active employees'
                : 'Delete schedule'
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line/50 bg-transparent text-over-red hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
