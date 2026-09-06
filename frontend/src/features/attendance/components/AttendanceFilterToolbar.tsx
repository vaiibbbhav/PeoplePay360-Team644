import React from 'react';
import { Plus } from 'lucide-react';
import { getTodayIST } from '@/lib/formatters';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';

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
        <SearchInput
          placeholder="Search by employee name or email..."
          value={filter.search}
          onChange={(e) => setField('search', e.target.value)}
          wrapperClassName="min-w-[240px]"
        />

        {/* Date inputs & Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select
            value={filter.status || 'all'}
            onValueChange={(val) => setField('status', val === 'all' ? '' : val)}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
              <SelectItem value="Half-day">Half-day</SelectItem>
              <SelectItem value="Overtime">Overtime</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
            </SelectContent>
          </Select>

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
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Punch / Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset pills & Checkbox */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-line/60 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-ink-soft font-medium mr-1">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => handleQuickPreset('today')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised transition-colors text-ink cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('week')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised transition-colors text-ink cursor-pointer"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('month')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised transition-colors text-ink cursor-pointer"
          >
            This Month
          </button>
          {(filter.startDate || filter.endDate) && (
            <button
              type="button"
              onClick={() => handleQuickPreset('all')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised transition-colors text-ink-soft hover:text-ink cursor-pointer"
            >
              Clear Dates
            </button>
          )}
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
