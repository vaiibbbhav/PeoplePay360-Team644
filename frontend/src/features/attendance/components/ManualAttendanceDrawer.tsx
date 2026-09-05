import React, { useState, useEffect } from 'react';
import { X, Check, Clock, User, AlertCircle } from 'lucide-react';
import { useEmployeesList } from '@/features/employees/queries/useEmployees';
import {
  useSaveManualAttendance,
  type AttendanceRecord,
  type SaveManualAttendancePayload,
} from '@/features/employee/queries/useAttendance';
import { getTodayIST, formatDateIST } from '@/lib/formatters';

type ManualAttendanceDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  initialRecord?: AttendanceRecord | null;
};

const formatTimeInputIST = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
};

export const ManualAttendanceDrawer: React.FC<ManualAttendanceDrawerProps> = ({
  isOpen,
  onClose,
  initialRecord,
}) => {
  const { data: employees = [] } = useEmployeesList();
  const saveMutation = useSaveManualAttendance();

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:30');
  const [workedHours, setWorkedHours] = useState('8.50');
  const [status, setStatus] = useState<string>('Present');
  const [exceptionNote, setExceptionNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill state when opening
  useEffect(() => {
    if (initialRecord) {
      setEmployeeId(initialRecord.employee_id);
      const effectiveDate = initialRecord.check_in
        ? formatDateIST(initialRecord.check_in) || initialRecord.date
        : initialRecord.date;
      setDate(effectiveDate);

      setCheckInTime(formatTimeInputIST(initialRecord.check_in) || '09:00');
      setCheckOutTime(formatTimeInputIST(initialRecord.check_out) || '17:30');

      const hrs =
        typeof initialRecord.worked_hours === 'number'
          ? initialRecord.worked_hours.toString()
          : String(initialRecord.worked_hours || '8.00');
      setWorkedHours(hrs);
      setStatus(initialRecord.status || 'Present');
      setExceptionNote(initialRecord.exception_note || '');
    } else {
      const todayStr = getTodayIST();
      setDate(todayStr);
      setCheckInTime('09:00');
      setCheckOutTime('17:30');
      setWorkedHours('8.50');
      setStatus('Present');
      setExceptionNote('');
      if (employees.length > 0) {
        setEmployeeId((prev) => prev || employees[0].id);
      }
    }
    setErrorMessage('');
  }, [initialRecord, isOpen, employees]);

  if (!isOpen) return null;

  // Auto-calculate worked hours when times change
  const handleTimeRecalculate = (inVal: string, outVal: string) => {
    if (!inVal || !outVal) return;
    const [inH, inM] = inVal.split(':').map(Number);
    const [outH, outM] = outVal.split(':').map(Number);
    let diffMinutes = outH * 60 + outM - (inH * 60 + inM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Next day wrap
    const hrs = (diffMinutes / 60).toFixed(2);
    setWorkedHours(hrs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!employeeId) {
      setErrorMessage('Please select an employee.');
      return;
    }
    if (!date) {
      setErrorMessage('Please specify an attendance date.');
      return;
    }

    // Parse input times with Indian Standard Time (+05:30) offset
    const checkInIso = checkInTime ? new Date(`${date}T${checkInTime}:00+05:30`).toISOString() : null;
    const checkOutIso = checkOutTime ? new Date(`${date}T${checkOutTime}:00+05:30`).toISOString() : null;

    const payload: SaveManualAttendancePayload = {
      employeeId,
      date,
      checkIn: checkInIso,
      checkOut: checkOutIso,
      workedHours: parseFloat(workedHours) || 0,
      status,
      exceptionNote: exceptionNote || 'Manual HR entry/correction',
    };

    try {
      await saveMutation.mutateAsync(payload);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Failed to save attendance record.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-bg border-l border-line shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-line flex items-center justify-between bg-bg-raised/40">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                HR Exception Override
              </span>
              <h2 className="text-xl font-sans font-medium text-ink mt-0.5">
                {initialRecord ? 'Adjust Attendance Log' : 'Record Manual Attendance'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Employee selection */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Employee <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={Boolean(initialRecord)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    Select an employee...
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.department_name || 'No Dept'}) - {emp.id}
                    </option>
                  ))}
                </select>
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none" />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>

            {/* Timings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Check-In Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => {
                      setCheckInTime(e.target.value);
                      handleTimeRecalculate(e.target.value, checkOutTime);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-soft pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Check-Out Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => {
                      setCheckOutTime(e.target.value);
                      handleTimeRecalculate(checkInTime, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-soft pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Worked Hours & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Worked Hours
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={workedHours}
                  onChange={(e) => setWorkedHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late Arrival</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>

            {/* Exception Note / Reason */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Adjustment Reason / Exception Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
                placeholder="Reason for manual adjustment (e.g., biometric scanner error, field offsite assignment, badge reissue)..."
                required
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-xs text-ink focus:outline-none focus:border-accent resize-none placeholder:text-ink-soft/60"
              />
              <p className="text-[11px] text-ink-soft mt-1">
                Required for payroll audit trail. This note will appear in exception reports and
                payslip calculation validation logs.
              </p>
            </div>

            {/* Warning callout */}
            <div className="p-3 bg-accent-soft/40 border border-accent/20 rounded-xl text-[11px] text-ink">
              <span className="font-semibold text-accent">Audited Entry:</span> Saving this log will
              flag this record as a manual HR correction with your supervisor credentials.
            </div>

            {/* Submit buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-xs"
              >
                {saveMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{initialRecord ? 'Save Adjustment' : 'Save Attendance'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
