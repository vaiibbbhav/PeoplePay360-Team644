import React, { useState, useEffect } from 'react';
import type { ScheduleItem, CreateSchedulePayload } from '../queries/useSchedules';
import { useClickOutside } from '@/hooks/useClickOutside';

type ScheduleFormDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSchedulePayload) => Promise<void>;
  initialData?: ScheduleItem | null;
  isSubmitting?: boolean;
};

type DayState = {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

const DEFAULT_DAYS: DayState[] = [
  { dayOfWeek: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayOfWeek: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayOfWeek: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayOfWeek: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayOfWeek: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayOfWeek: 'Saturday', enabled: false, startTime: '09:00', endTime: '14:00', breakMinutes: 30 },
  { dayOfWeek: 'Sunday', enabled: false, startTime: '09:00', endTime: '14:00', breakMinutes: 30 },
];

export const ScheduleFormDrawer: React.FC<ScheduleFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [days, setDays] = useState<DayState[]>(DEFAULT_DAYS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIsActive(initialData.isActive);

      const lineMap = new Map(initialData.lines.map((l) => [l.dayOfWeek, l]));
      setDays(
        DEFAULT_DAYS.map((d) => {
          const matched = lineMap.get(d.dayOfWeek);
          if (matched) {
            return {
              dayOfWeek: d.dayOfWeek,
              enabled: true,
              startTime: matched.startTime.slice(0, 5),
              endTime: matched.endTime.slice(0, 5),
              breakMinutes: matched.breakMinutes,
            };
          }
          return { ...d, enabled: false };
        }),
      );
    } else {
      setName('');
      setIsActive(true);
      setDays(DEFAULT_DAYS);
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const calculateDayHours = (d: DayState) => {
    if (!d.enabled) return 0;
    const [sh, sm] = d.startTime.split(':').map(Number);
    const [eh, em] = d.endTime.split(':').map(Number);
    const totalMinutes = (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0));
    const workedMinutes = Math.max(0, totalMinutes - (d.breakMinutes || 0));
    return Math.max(0, workedMinutes / 60);
  };

  const totalWeeklyHours = days
    .reduce((sum, d) => sum + calculateDayHours(d), 0)
    .toFixed(2);

  const handleDayChange = (index: number, field: keyof DayState, value: any) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter a schedule name');
      return;
    }

    const enabledLines = days.filter((d) => d.enabled);
    if (enabledLines.length === 0) {
      setErrorMessage('At least one working day must be enabled');
      return;
    }

    for (const d of enabledLines) {
      if (calculateDayHours(d) <= 0) {
        setErrorMessage(`${d.dayOfWeek}: End time must be after start time minus break`);
        return;
      }
    }

    try {
      await onSubmit({
        name: name.trim(),
        isActive,
        lines: enabledLines.map((l) => ({
          dayOfWeek: l.dayOfWeek,
          startTime: `${l.startTime}:00`,
          endTime: `${l.endTime}:00`,
          breakMinutes: Number(l.breakMinutes) || 0,
        })),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err.message || 'Failed to save schedule');
    }
  };

  const drawerRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, isOpen);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-xl bg-bg border-l border-line shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-line flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {initialData ? 'Edit Schedule' : 'New Schedule'}
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-ink mt-0.5 mb-0">
                {initialData ? initialData.name : 'Configure Working Hours'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-line bg-transparent text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors flex items-center justify-center cursor-pointer shrink-0 ml-2"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-over-red text-xs">
                {errorMessage}
              </div>
            )}

            {/* General Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Schedule Name <span className="text-over-red">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard 40h Full-Time, EMEA Shift"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-sm placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-bg-raised/40">
                <div>
                  <span className="text-xs font-semibold text-ink block">Active Status</span>
                  <span className="text-[11px] text-ink-soft">
                    Allow assigning this schedule to employees & contracts
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>
            </div>

            {/* Total Hours Banner */}
            <div className="p-4 rounded-xl border border-accent/30 bg-accent-soft flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-accent block">Calculated Total</span>
                <span className="text-[11px] text-ink-soft">
                  Sum of all enabled working day shifts minus breaks
                </span>
              </div>
              <div className="text-right">
                <span className="font-serif text-2xl font-bold text-accent">
                  {totalWeeklyHours}
                </span>
                <span className="text-xs text-ink-soft block -mt-1">hrs / week</span>
              </div>
            </div>

            {/* 7-Day Pattern */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                Weekly Day-by-Day Pattern
              </label>

              <div className="space-y-2">
                {days.map((d, idx) => {
                  const hours = calculateDayHours(d);
                  return (
                    <div
                      key={d.dayOfWeek}
                      className={`p-3 rounded-xl border transition-colors ${
                        d.enabled
                          ? 'border-line bg-bg'
                          : 'border-line/40 bg-bg-raised/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={d.enabled}
                            onChange={(e) => handleDayChange(idx, 'enabled', e.target.checked)}
                            className="rounded border-line text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-ink">{d.dayOfWeek}</span>
                        </label>
                        {d.enabled && (
                          <span className="text-[11px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded">
                            {hours.toFixed(1)} hrs
                          </span>
                        )}
                      </div>

                      {d.enabled && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/50">
                          <div>
                            <span className="text-[10px] text-ink-soft block mb-1">Start Time</span>
                            <input
                              type="time"
                              value={d.startTime}
                              onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-ink-soft block mb-1">End Time</span>
                            <input
                              type="time"
                              value={d.endTime}
                              onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-ink-soft block mb-1">Break (min)</span>
                            <input
                              type="number"
                              min="0"
                              max="300"
                              step="15"
                              value={d.breakMinutes}
                              onChange={(e) => handleDayChange(idx, 'breakMinutes', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{initialData ? 'Update Schedule' : 'Create Schedule'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
