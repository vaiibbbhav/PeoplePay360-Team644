import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardOverview } from '@/features/dashboard/queries/useDashboard';
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  Layers,
  RefreshCw,
  Activity,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { User } from '@/features/auth/queries/useAuth';

type HrManagerDashboardViewProps = {
  user: User;
};

export const HrManagerDashboardView: React.FC<HrManagerDashboardViewProps> = ({ user }) => {
  const { data: dashboard, refetch, isFetching, isLoading } = useDashboardOverview();

  const kpis = dashboard?.kpis || {
    totalNetPaid: 0,
    payslipsGenerated: 0,
    averageSalary: 0,
    approvedTimeOffDays: 0,
    pendingTimeOffRequests: 0,
    attendanceHealthScore: '96%',
  };

  const attendance = dashboard?.attendance || {
    present: 0,
    late: 0,
    absent: 0,
    overtime: 0,
    manualEdits: 0,
  };

  const contracts = dashboard?.contracts || {
    total: 0,
    active: 0,
    draft: 0,
    expired: 0,
    recent: [],
  };

  const schedules = dashboard?.schedules || {
    total: 4,
    active: 4,
    avgWeeklyHours: 40,
    list: [],
  };

  const departmentBreakdown = dashboard?.charts?.departmentBreakdown || [];

  const topDepartments = useMemo(() => {
    return [...departmentBreakdown]
      .sort((a, b) => b.headcount - a.headcount)
      .slice(0, 6);
  }, [departmentBreakdown]);

  const totalHeadcount = useMemo(() => {
    if (departmentBreakdown.length > 0) {
      return departmentBreakdown.reduce((sum, d) => sum + d.headcount, 0);
    }
    return contracts.total || 0;
  }, [departmentBreakdown, contracts.total]);

  // Attendance Donut calculations
  const totalAttendanceEntries =
    (attendance.present || 0) +
    (attendance.late || 0) +
    (attendance.absent || 0) +
    (attendance.overtime || 0) || 1;

  const donutCircumference = 2 * Math.PI * 54; // r = 54
  const attendanceSegments = useMemo(() => {
    const raw = [
      {
        label: 'Present',
        count: attendance.present,
        color: '#6A3FA0', // Primary Accent Violet
        swatchClass: 'bg-accent',
        subtext: 'Punctual & on shift',
      },
      {
        label: 'Overtime',
        count: attendance.overtime,
        color: '#9333ea', // Secondary violet
        swatchClass: 'bg-purple-600',
        subtext: 'Extra hours recorded',
      },
      {
        label: 'Late Arrival',
        count: attendance.late,
        color: '#d97706', // Subtle amber
        swatchClass: 'bg-amber-600',
        subtext: 'Grace period exceeded',
      },
      {
        label: 'Absent',
        count: attendance.absent,
        color: '#dc2626', // Subtle red
        swatchClass: 'bg-red-600',
        subtext: 'Unscheduled absence',
      },
    ];

    let currentOffset = 0;
    return raw.map((item) => {
      const percentage = (item.count / totalAttendanceEntries) * 100;
      const strokeLength = (percentage / 100) * donutCircumference;
      const offset = currentOffset;
      currentOffset += strokeLength;

      return {
        ...item,
        percentage: Math.round(percentage),
        strokeDasharray: `${strokeLength} ${donutCircumference - strokeLength}`,
        strokeDashoffset: -offset,
      };
    });
  }, [attendance, totalAttendanceEntries, donutCircumference]);

  const recentContracts = useMemo(() => {
    return (contracts.recent || []).slice(0, 4);
  }, [contracts.recent]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-ink-soft">Loading workforce overview...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="mb-1">
            <span className="text-xs font-mono text-accent font-medium">
              Overview
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            HR Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
            Logged in as <b className="text-ink font-medium">{user.email}</b> · {user.role}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Link
            to="/employees"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Employee</span>
          </Link>
          <Link
            to="/time-off?tab=requests&status=pending"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-line bg-transparent hover:bg-bg-raised text-ink transition-colors whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            <span>Time Off</span>
            {kpis.pendingTimeOffRequests > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-accent text-accent-ink">
                {kpis.pendingTimeOffRequests}
              </span>
            )}
          </Link>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-line bg-transparent hover:bg-bg-raised text-ink transition-colors whitespace-nowrap"
          >
            <Clock className="w-4 h-4" />
            <span>Punch Ledger</span>
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg border border-line bg-transparent hover:bg-bg-raised text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh live metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-line my-5 sm:my-6" />

      {/* ── Section 1: Needs your attention ── */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">Needs your attention</h2>
          <span className="text-xs text-ink-soft hidden sm:inline">
            Action items across attendance, leave approvals, and contracts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {/* Card 1: Pending Time Off Requests */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">Pending leave requests</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    kpis.pendingTimeOffRequests > 0 ? 'bg-over-red' : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {kpis.pendingTimeOffRequests}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                {kpis.pendingTimeOffRequests > 0
                  ? 'Time-off requests awaiting review before payroll cycle cut-off.'
                  : 'All leave requests have been reviewed and approved.'}
              </p>
            </div>
            <Link
              to="/time-off?tab=requests&status=pending"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Review leave requests →
            </Link>
          </div>

          {/* Card 2: Attendance Exceptions */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">Attendance exceptions</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    (attendance.late || 0) + (attendance.absent || 0) > 0
                      ? 'bg-over-red'
                      : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {(attendance.late || 0) + (attendance.absent || 0)}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                {(attendance.late || 0) + (attendance.absent || 0) > 0
                  ? `${attendance.late} late arrival(s) and ${attendance.absent} absence(s) recorded today.`
                  : 'No attendance exceptions or unscheduled absences today.'}
              </p>
            </div>
            <Link
              to="/attendance"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Audit punch ledger →
            </Link>
          </div>

          {/* Card 3: Contracts Attention */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">Contracts attention</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    (contracts.draft || 0) + (contracts.expired || 0) > 0
                      ? 'bg-over-red'
                      : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {(contracts.draft || 0) + (contracts.expired || 0)}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                {(contracts.draft || 0) + (contracts.expired || 0) > 0
                  ? `${contracts.draft} draft agreements and ${contracts.expired} expired terms requiring review.`
                  : 'All contracts are in active standing with valid terms.'}
              </p>
            </div>
            <Link
              to="/contracts"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Manage contracts →
            </Link>
          </div>

          {/* Card 4: Shift Schedule Integrity */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">Shift schedule models</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {schedules.active || 4}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                Active shift patterns regulating biometric check-in windows (avg {schedules.avgWeeklyHours || 40} hrs/wk).
              </p>
            </div>
            <Link
              to="/schedules"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Configure schedules →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 2: Core Workforce & Operational KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Workforce */}
        <div className="p-5 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Total Workforce
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-ink font-sans">
                {totalHeadcount}
              </span>
              <span className="text-xs text-ink-soft font-medium">Headcount</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-line/60 text-[11px] text-ink-soft">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-3 h-3" /> {contracts.active} Active
              </span>
              <span>·</span>
              <span>{departmentBreakdown.length || 6} Departments</span>
            </div>
          </div>
        </div>

        {/* Attendance Health */}
        <div className="p-5 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Attendance Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-ink font-sans">
                {kpis.attendanceHealthScore}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Presence Rate
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-line/60 text-[11px] text-ink-soft">
              <span>{attendance.present} Present</span>
              <span>·</span>
              <span>{attendance.late} Late</span>
              <span>·</span>
              <span>{attendance.absent} Absent</span>
            </div>
          </div>
        </div>

        {/* Time Off & Leaves */}
        <div className="p-5 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Approved Time Off
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-ink font-sans">
                {kpis.approvedTimeOffDays}
              </span>
              <span className="text-xs text-ink-soft font-medium">Days Approved</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60 text-[11px] text-ink-soft">
              <span>Cycle Consumption</span>
              {kpis.pendingTimeOffRequests > 0 ? (
                <span className="font-semibold text-over-red">
                  {kpis.pendingTimeOffRequests} Pending Review
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Queue Cleared
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shift Patterns */}
        <div className="p-5 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Working Schedules
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-ink font-sans">
                {schedules.active || 4}
              </span>
              <span className="text-xs text-ink-soft font-medium">Shift Models</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60 text-[11px] text-ink-soft">
              <span>Avg {schedules.avgWeeklyHours || 40} hrs/week</span>
              <span className="text-accent font-medium">Full Coverage</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Daily Presence & Department Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: Daily Attendance & Punctuality Donut (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">
                  Attendance &amp; Punctuality Status
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Daily biometric ledger status &amp; exception tracking
                </p>
              </div>
              <Link
                to="/attendance"
                className="text-xs text-accent font-medium hover:underline no-underline inline-flex items-center gap-1"
              >
                <span>Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Donut Chart & Breakdown */}
            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              {/* SVG Donut */}
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                  {/* Track ring */}
                  <circle
                    cx="65"
                    cy="65"
                    r="54"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-line/40"
                  />
                  {/* Data Segments */}
                  {attendanceSegments.map((seg) => (
                    <circle
                      key={seg.label}
                      cx="65"
                      cy="65"
                      r="54"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  ))}
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tracking-tight text-ink font-sans">
                    {kpis.attendanceHealthScore}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-soft mt-0.5">
                    Presence Rate
                  </span>
                </div>
              </div>

              {/* Legend & Count Rows */}
              <div className="flex-1 w-full space-y-2">
                {attendanceSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-line/60 bg-bg-raised/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.swatchClass}`} />
                      <span className="font-medium text-ink">{seg.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-sans text-ink">{seg.count}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-line bg-bg font-medium text-ink-soft">
                        {seg.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3.5 mt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-soft">
            <span>Manual edits recorded: <b className="text-ink">{attendance.manualEdits}</b></span>
            <span className="text-[11px] text-accent font-medium">Biometric Sync Active</span>
          </div>
        </div>

        {/* Right: Department Workforce Distribution (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">
                  Department Workforce Distribution
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Top departments by headcount ({totalHeadcount} staff total)
                </p>
              </div>
              <Link
                to="/organization"
                className="text-xs text-accent font-medium hover:underline no-underline inline-flex items-center gap-1"
              >
                <span>Org Chart</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Department Progress Bars - Uniform Clean Styling */}
            <div className="space-y-3.5 py-1">
              {topDepartments.length > 0 ? (
                topDepartments.map((dept) => {
                  const sharePercent = totalHeadcount > 0 ? ((dept.headcount / totalHeadcount) * 100).toFixed(1) : '0';

                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{dept.department}</span>
                          <span className="text-[11px] text-ink-soft">({dept.headcount} staff)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-ink font-sans">{sharePercent}%</span>
                          <span className="text-[10px] text-ink-soft hidden sm:inline">of total</span>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-2 rounded-full bg-bg-raised border border-line/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(Number(sharePercent), 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-ink-soft">
                  Loading department distribution...
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3.5 mt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-soft">
            <span>
              Showing Top {topDepartments.length} of {departmentBreakdown.length || 6} Operational Departments
            </span>
            <Link to="/employees" className="text-accent hover:underline font-medium no-underline">
              View All Profiles →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 4: Contracts & Working Schedules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Contracts */}
        <div className="p-6 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">Employment Contracts</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Period-based agreements &amp; wage term compliance
                </p>
              </div>
              <Link
                to="/contracts"
                className="text-xs text-accent font-medium hover:underline no-underline"
              >
                View all ({contracts.total}) →
              </Link>
            </div>

            {/* Contract Status Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-ink-soft">Coverage &amp; Compliance Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {contracts.active} Active Contracts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-raised border border-line/60 flex overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{
                    width: `${contracts.total > 0 ? (contracts.active / contracts.total) * 100 : 100}%`,
                  }}
                  title={`Active: ${contracts.active}`}
                />
                {contracts.draft > 0 && (
                  <div
                    className="bg-ink-soft h-full transition-all duration-500"
                    style={{ width: `${(contracts.draft / contracts.total) * 100}%` }}
                    title={`Draft: ${contracts.draft}`}
                  />
                )}
                {contracts.expired > 0 && (
                  <div
                    className="bg-over-red h-full transition-all duration-500"
                    style={{ width: `${(contracts.expired / contracts.total) * 100}%` }}
                    title={`Expired: ${contracts.expired}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" /> Active: {contracts.active}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-ink-soft" /> Draft: {contracts.draft}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-over-red" /> Expired: {contracts.expired}
                </span>
              </div>
            </div>

            {/* Recent Contracts List */}
            <div className="space-y-2.5">
              {recentContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs p-3 rounded-lg border border-line/60 bg-bg-raised/30 hover:border-line transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink font-sans">{c.employee_name || c.name}</span>
                    <span className="text-[11px] text-ink-soft">
                      Effective:{' '}
                      {new Date(c.start_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-ink text-[11px]">
                      ₹{Number(c.wage).toLocaleString('en-IN')}/{c.wage_type === 'hourly' ? 'hr' : 'mo'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        c.status === 'active'
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-line bg-bg-raised text-ink-soft'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center text-xs">
            <span className="text-ink-soft flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              Non-overlapping constraint active
            </span>
            <Link
              to="/contracts"
              className="text-accent font-medium hover:underline"
            >
              Open Contracts Registry →
            </Link>
          </div>
        </div>

        {/* Working Schedules */}
        <div className="p-6 rounded-xl border border-line bg-bg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">Working Schedules &amp; Shifts</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Standard weekly shift templates &amp; break allowances
                </p>
              </div>
              <Link
                to="/schedules"
                className="text-xs text-accent font-medium hover:underline no-underline"
              >
                Configure ({schedules.total}) →
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Active Shift Models</span>
                <span className="text-xl font-bold font-sans text-accent mt-0.5 block">
                  {schedules.active} Models
                </span>
              </div>
              <div className="p-3 rounded-lg border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Avg Weekly Commitment</span>
                <span className="text-xl font-bold font-sans text-ink mt-0.5 block">
                  {schedules.avgWeeklyHours} hrs/wk
                </span>
              </div>
            </div>

            {/* Schedules Preview List */}
            <div className="space-y-2.5">
              {(schedules.list || []).slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs p-3 rounded-lg border border-line/60 bg-bg-raised/30 hover:border-line transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink font-sans">{s.name}</span>
                    <span className="text-[11px] text-ink-soft">Weekly scheduled commitment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-accent text-xs">
                      {s.weekly_hours} hrs/wk
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        s.is_active
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-line bg-bg-raised text-ink-soft'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center text-xs">
            <span className="text-ink-soft flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              Automated break deduction enabled
            </span>
            <Link
              to="/schedules"
              className="text-accent font-medium hover:underline"
            >
              Open Schedule Builder →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
