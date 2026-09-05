import React from 'react';
import { Link } from 'react-router-dom';

import { getTodayIST } from '@/lib/formatters';

export type AttendanceFilterState = {
  search: string;
  startDate: string;
  endDate: string;
  status: string;
  exceptionsOnly: boolean;
};

type AttendanceFilterToolbarProps = {
  filter: AttendanceFilterState;
  onFilterChange: (filter: AttendanceFilterState) => void;
  onOpenManualDrawer: () => void;
  canManage: boolean;
};

export const AttendanceFilterToolbar: React.FC<AttendanceFilterToolbarProps> = ({
  filter,
  onFilterChange,
  onOpenManualDrawer,
  canManage,
}) => {
  const setField = <K extends keyof AttendanceFilterState>(
    field: K,
    value: AttendanceFilterState[K],
  ) => {
    onFilterChange({ ...filter, [field]: value });
  };

  const handleQuickPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const todayStr = getTodayIST();

    if (preset === 'today') {
      onFilterChange({ ...filter, startDate: todayStr, endDate: todayStr });
    } else if (preset === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const mondayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(monday);
      onFilterChange({ ...filter, startDate: mondayStr, endDate: todayStr });
    } else if (preset === 'month') {
      const startOfMonth = `${todayStr.substring(0, 7)}-01`;
      onFilterChange({ ...filter, startDate: startOfMonth, endDate: todayStr });
    } else {
      onFilterChange({ ...filter, startDate: '', endDate: '' });
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-line bg-bg font-sans">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by employee name or email..."
            value={filter.search}
            onChange={(e) => setField('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink placeholder:text-ink-soft focus:outline-hidden focus:border-accent"
          />
        </div>

        {/* Date inputs & Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={filter.status}
            onChange={(e) => setField('status', e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-hidden focus:border-accent"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half-day">Half-day</option>
            <option value="Overtime">Overtime</option>
            <option value="Absent">Absent</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-hidden focus:border-accent"
            />
            <span>to</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setField('endDate', e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-hidden focus:border-accent"
            />
          </div>

          {/* Action buttons */}
          {canManage && (
            <button
              type="button"
              onClick={onOpenManualDrawer}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>+</span> Manual Punch / Edit
            </button>
          )}

          <Link
            to="/attendance/terminal"
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors no-underline flex items-center gap-1.5 shrink-0"
          >
            <span>📱</span> Hardware Terminal
          </Link>
        </div>
      </div>

      {/* Preset pills & Checkbox */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-soft uppercase tracking-wider font-semibold">
            Date Presets:
          </span>
          <button
            type="button"
            onClick={() => handleQuickPreset('today')}
            className="px-2 py-0.5 rounded text-[11px] font-medium border border-line hover:border-accent transition-colors text-ink cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('week')}
            className="px-2 py-0.5 rounded text-[11px] font-medium border border-line hover:border-accent transition-colors text-ink cursor-pointer"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('month')}
            className="px-2 py-0.5 rounded text-[11px] font-medium border border-line hover:border-accent transition-colors text-ink cursor-pointer"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('all')}
            className="px-2 py-0.5 rounded text-[11px] font-medium border border-line hover:border-accent transition-colors text-ink cursor-pointer"
          >
            Clear Date
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filter.exceptionsOnly}
            onChange={(e) => setField('exceptionsOnly', e.target.checked)}
            className="rounded border-line text-accent focus:ring-accent"
          />
          <span>Show exceptions & manual adjustments only</span>
        </label>
      </div>
    </div>
  );
};
