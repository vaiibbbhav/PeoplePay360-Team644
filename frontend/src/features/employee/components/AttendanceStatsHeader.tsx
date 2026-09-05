import React from 'react';
import type { AttendanceRecord, FingerprintRecord } from '../queries/useAttendance';

type AttendanceStatsHeaderProps = {
  records: AttendanceRecord[];
  fingerprint: FingerprintRecord | null;
  onOpenFingerprintModal: () => void;
  monthName: string;
  year: number;
};

export const AttendanceStatsHeader: React.FC<AttendanceStatsHeaderProps> = ({
  records,
  fingerprint,
  onOpenFingerprintModal,
  monthName,
  year,
}) => {
  const totalRecords = records.length;
  const presentRecords = records.filter(
    (r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-Day'
  );
  const lateRecords = records.filter((r) => r.status === 'Late');
  const manualEdits = records.filter((r) => r.is_manual_edit);

  const totalWorkedHours = records.reduce((acc, curr) => {
    const val = parseFloat(String(curr.worked_hours || 0));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const averageHoursPerDay =
    presentRecords.length > 0 ? (totalWorkedHours / presentRecords.length).toFixed(1) : '0.0';

  const attendanceRate =
    totalRecords > 0 ? Math.round((presentRecords.length / totalRecords) * 100) : 0;

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner with Fingerprint action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border border-line rounded-2xl bg-bg-raised/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-accent">
              Attendance Management Console
            </span>
            <span className="text-line">•</span>
            <span className="text-xs text-ink-soft">
              {monthName} {year}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-ink m-0">Monthly Attendance Overview</h2>
          <p className="text-xs text-ink-soft mt-1 m-0">
            Hardware biometric punch integration, worked time summaries, and exception auditing.
          </p>
        </div>

        {/* Change Fingerprint Option button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenFingerprintModal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-bg hover:bg-bg-raised text-ink text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004.07 9m5.918 8d.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h2z"
              />
            </svg>
            <div className="text-left">
              <span className="block text-xs font-semibold leading-tight text-ink">Change Fingerprint</span>
              <span className="text-[10px] text-ink-soft leading-tight">
                {fingerprint?.encryted_template ? 'Enrolled Key Active' : 'Configure Biometrics'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Top States & Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* State 1: Present Rate */}
        <div className="p-4 sm:p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-[11px] font-medium text-ink-soft block">Attendance Rate</span>
          <div className="text-xl sm:text-2xl font-bold font-serif text-ink mt-1 flex items-baseline gap-1.5">
            <span>{attendanceRate}%</span>
            <span className="text-xs font-sans font-normal text-ink-soft">
              ({presentRecords.length} / {totalRecords} days)
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Standard Schedule
          </span>
        </div>

        {/* State 2: Total Hours */}
        <div className="p-4 sm:p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-[11px] font-medium text-ink-soft block">Total Worked Hours</span>
          <div className="text-xl sm:text-2xl font-bold font-serif text-accent mt-1">
            {totalWorkedHours.toFixed(1)} <span className="text-xs font-sans font-normal text-ink-soft">hrs</span>
          </div>
          <span className="text-[10px] text-ink-soft font-medium mt-1 block">
            Avg. {averageHoursPerDay} hrs/shift
          </span>
        </div>

        {/* State 3: Late Punches */}
        <div className="p-4 sm:p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-[11px] font-medium text-ink-soft block">Late Arrivals</span>
          <div className="text-xl sm:text-2xl font-bold font-serif text-ink mt-1">
            {lateRecords.length}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">
            {lateRecords.length > 0 ? 'Exceptions verified' : 'Zero arrival exceptions'}
          </span>
        </div>

        {/* State 4: Biometric & Manual Audits */}
        <div className="p-4 sm:p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-[11px] font-medium text-ink-soft block">Audit & Edits</span>
          <div className="text-xl sm:text-2xl font-bold font-serif text-ink mt-1">
            {manualEdits.length} <span className="text-xs font-sans font-normal text-ink-soft">manual</span>
          </div>
          <span className="text-[10px] text-accent font-medium mt-1 block truncate">
            {fingerprint?.encryted_template ? 'Hardware Fingerprint Active' : 'Scanner Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};
