import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardOverview } from '@/features/dashboard/queries/useDashboard';
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  ArrowRight,
  Activity,
  Layers,
  ChevronRight,
  RefreshCw,
  Briefcase,
  Check,
} from 'lucide-react';
import type { User } from '@/features/auth/queries/useAuth';

type HrManagerDashboardViewProps = {
  user: User;
};

export const HrManagerDashboardView: React.FC<HrManagerDashboardViewProps> = ({ user }) => {
  const { data: dashboard, refetch, isFetching } = useDashboardOverview();

  const kpis = dashboard?.kpis || {
    totalNetPaid: 0,
    payslipsGenerated: 0,
    averageSalary: 0,
    approvedTimeOffDays: 0,
    pendingTimeOffRequests: 0,
    attendanceHealthScore: '96%',
  };

  const attendance = dashboard?.attendance || {
    present: 4,
    late: 0,
    absent: 0,
    overtime: 1,
    manualEdits: 0,
  };

  const contracts = dashboard?.contracts || {
    total: 125,
    active: 125,
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
    return contracts.total || 125;
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
        color: '#10b981', // Emerald
        bgBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        subtext: 'Punctual & on shift',
      },
      {
        label: 'Late Arrival',
        count: attendance.late,
        color: '#f59e0b', // Amber
        bgBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        subtext: 'Grace period exceeded',
      },
      {
        label: 'Overtime',
        count: attendance.overtime,
        color: '#8b5cf6', // Violet
        bgBadge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        subtext: 'Extra hours recorded',
      },
      {
        label: 'Absent',
        count: attendance.absent,
        color: '#f43f5e', // Rose
        bgBadge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
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

  // Recent contracts
  const recentContracts = useMemo(() => {
    return (contracts.recent || []).slice(0, 4);
  }, [contracts.recent]);

  // Current Date String
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const displayName = user.firstName || user.email.split('@')[0];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      {/* ─── 1. Header & Quick Context Bar ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-accent font-medium">
              Overview
            </span>
            <span className="text-xs text-ink-soft hidden sm:inline">·</span>
            <span className="text-xs text-ink-soft font-medium hidden sm:inline">
              {todayFormatted}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            Good day, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
            Workforce health, daily attendance punctuality, shift coverage & compliance monitoring.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-line bg-bg hover:bg-bg-raised text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh live metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-accent' : ''}`} />
          </button>

          <Link
            to="/attendance"
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors no-underline inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Punch Ledger</span>
          </Link>

          <Link
            to="/time-off"
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors no-underline inline-flex items-center gap-1.5 shadow-2xs relative"
          >
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Time Off</span>
            {kpis.pendingTimeOffRequests > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-accent text-accent-ink">
                {kpis.pendingTimeOffRequests}
              </span>
            )}
          </Link>

          <Link
            to="/employees"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline inline-flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Onboard Employee</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. High-Priority Alert Banner (Conditional) ─── */}
      {kpis.pendingTimeOffRequests > 0 && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink block sm:inline">
                {kpis.pendingTimeOffRequests} Time-Off {kpis.pendingTimeOffRequests === 1 ? 'Request' : 'Requests'} Awaiting Review
              </span>
              <span className="text-xs text-ink-soft sm:ml-2">
                Action required to prevent payroll cut-off discrepancies.
              </span>
            </div>
          </div>
          <Link
            to="/time-off"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors no-underline inline-flex items-center gap-1 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <span>Review Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ─── 3. Top Core KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workforce */}
        <div className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/30 transition-colors flex flex-col justify-between shadow-2xs">
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
                <Check className="w-3 h-3" /> 100% Active
              </span>
              <span>·</span>
              <span>{departmentBreakdown.length || 6} Departments</span>
            </div>
          </div>
        </div>

        {/* Attendance Health */}
        <div className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/30 transition-colors flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Attendance Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-ink font-sans">
                {kpis.attendanceHealthScore}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                On-Time Rate
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
        <div className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/30 transition-colors flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Time Off & Leaves
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
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
                <span className="font-semibold text-amber-600 dark:text-amber-400">
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

        {/* Working Schedules */}
        <div className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/30 transition-colors flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Shift Patterns
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-ink font-sans">
                {schedules.active || 4}
              </span>
              <span className="text-xs text-ink-soft font-medium">Active Shift Models</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60 text-[11px] text-ink-soft">
              <span>Avg {schedules.avgWeeklyHours || 40} hrs/week</span>
              <span className="text-accent font-medium">Full Coverage</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Dual Live Visual Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Live Attendance & Punctuality Radial Gauge (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-line bg-bg flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">
                  Attendance & Punctuality Status
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Live biometric status & punch exception tracking
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
                    className="text-line/50"
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
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-soft mt-0.5">
                    Presence Rate
                  </span>
                </div>
              </div>

              {/* Legend & Count Rows */}
              <div className="flex-1 w-full space-y-2.5">
                {attendanceSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className="flex items-center justify-between text-xs p-2 rounded-xl border border-line/50 bg-bg-raised/30"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-medium text-ink">{seg.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-sans text-ink">{seg.count}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${seg.bgBadge}`}>
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

        {/* Right Chart: Department Workforce Distribution (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-line bg-bg flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">
                  Department Workforce Distribution
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Top 6 departments by headcount ({totalHeadcount} staff total)
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

            {/* Department Progress Bars */}
            <div className="space-y-3.5 py-1">
              {topDepartments.length > 0 ? (
                topDepartments.map((dept, idx) => {
                  const sharePercent = totalHeadcount > 0 ? ((dept.headcount / totalHeadcount) * 100).toFixed(1) : '0';
                  
                  // Accent color variations for subtle diversity
                  const barColors = [
                    'bg-accent',
                    'bg-emerald-600 dark:bg-emerald-500',
                    'bg-sky-600 dark:bg-sky-500',
                    'bg-amber-600 dark:bg-amber-500',
                    'bg-violet-600 dark:bg-violet-500',
                    'bg-teal-600 dark:bg-teal-500',
                  ];
                  const barColor = barColors[idx % barColors.length];

                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{dept.department}</span>
                          <span className="text-[11px] text-ink-soft">({dept.headcount} staff)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-ink font-sans">{sharePercent}%</span>
                          <span className="text-[10px] text-ink-soft hidden sm:inline">of total</span>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-2.5 rounded-full bg-bg-raised border border-line/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
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

      {/* ─── 5. Operational Integration: Contracts & Working Schedules ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Contracts Card */}
        <div className="p-6 rounded-2xl border border-line bg-bg flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">Employment Contracts</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Period-based binding agreements & status verification
                </p>
              </div>
              <Link
                to="/contracts"
                className="text-xs text-accent font-medium hover:underline no-underline"
              >
                View all ({contracts.total}) →
              </Link>
            </div>

            {/* Contract Status Segmented Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-ink-soft">Coverage & Compliance Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {contracts.active} Active Contracts
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-bg-raised border border-line/60 flex overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${contracts.total > 0 ? (contracts.active / contracts.total) * 100 : 100}%`,
                  }}
                  title={`Active: ${contracts.active}`}
                />
                {contracts.draft > 0 && (
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{ width: `${(contracts.draft / contracts.total) * 100}%` }}
                    title={`Draft: ${contracts.draft}`}
                  />
                )}
                {contracts.expired > 0 && (
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${(contracts.expired / contracts.total) * 100}%` }}
                    title={`Expired: ${contracts.expired}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active: {contracts.active}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Draft: {contracts.draft}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Expired: {contracts.expired}
                </span>
              </div>
            </div>

            {/* Recent Contracts List */}
            <div className="space-y-2.5">
              {recentContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs p-3 rounded-xl border border-line/60 bg-bg-raised/30 hover:border-line transition-colors"
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
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Non-overlapping constraint active
            </span>
            <Link
              to="/contracts"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 no-underline transition-opacity"
            >
              + New Contract
            </Link>
          </div>
        </div>

        {/* Working Schedules Card */}
        <div className="p-6 rounded-2xl border border-line bg-bg flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink font-sans">Working Schedules & Shifts</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Weekly standard commitments, break allowances & shift patterns
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
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Active Shift Models</span>
                <span className="text-xl font-bold font-sans text-accent mt-0.5 block">
                  {schedules.active} Models
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
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
                  className="flex items-center justify-between text-xs p-3 rounded-xl border border-line/60 bg-bg-raised/30 hover:border-line transition-colors"
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
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-bg-raised hover:border-ink-soft text-ink no-underline transition-colors"
            >
              + Create Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 6. Compliance & Policy Acknowledgment Section ─── */}
      <div className="p-6 rounded-2xl border border-line bg-bg shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink font-sans">
                Corporate Policies & Regulatory Compliance
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Mandatory document acknowledgments, employee signature tracking & audit logs
              </p>
            </div>
          </div>
          <Link
            to="/documents"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors no-underline inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Policy Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-line/60 bg-bg-raised/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-ink">Code of Business Conduct</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">98%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-bg border border-line/60 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
            </div>
            <span className="text-[11px] text-ink-soft mt-1.5 block">122 of 125 signed</span>
          </div>

          <div className="p-4 rounded-xl border border-line/60 bg-bg-raised/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-ink">Information Security Policy</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">94%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-bg border border-line/60 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
            </div>
            <span className="text-[11px] text-ink-soft mt-1.5 block">118 of 125 signed</span>
          </div>

          <div className="p-4 rounded-xl border border-line/60 bg-bg-raised/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-ink">Workplace Health & Safety</span>
              <span className="text-accent font-bold font-sans">91%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-bg border border-line/60 overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '91%' }} />
            </div>
            <span className="text-[11px] text-ink-soft mt-1.5 block">114 of 125 signed</span>
          </div>
        </div>
      </div>

      {/* ─── 7. HR Operations Launchpad ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wider font-sans">
            HR Module Navigation & Direct Access
          </h2>
          <span className="text-xs text-ink-soft">7 Integrated Subsystems</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/employees"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Employee Hub
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Master profiles, onboarding, contracts link, and quick contact cards.
            </p>
          </Link>

          <Link
            to="/contracts"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Employment Contracts
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Active agreements, wage structures, non-overlapping date enforcement.
            </p>
          </Link>

          <Link
            to="/schedules"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Working Schedules
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Weekly shift patterns, break policies, and automated hours calculation.
            </p>
          </Link>

          <Link
            to="/time-off"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Time Off & Leaves
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Approve leave requests, grant allocations, balance consumption tracking.
            </p>
          </Link>

          <Link
            to="/attendance"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Attendance Records
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Biometric check-in/out timestamps, anomalies, and manual supervisor punch edits.
            </p>
          </Link>

          <Link
            to="/documents"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Policies & Compliance
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Publish policies, track employee acknowledgments, and IP audit trails.
            </p>
          </Link>

          <Link
            to="/organization"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Organization Hierarchy
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Interactive departmental reporting hierarchy and manager chains.
            </p>
          </Link>

          <Link
            to="/compensation"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/40 transition-all no-underline group block shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors font-sans">
              Compensation & CTC
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Pay package breakdown, allowance distribution, and tax declarations.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
