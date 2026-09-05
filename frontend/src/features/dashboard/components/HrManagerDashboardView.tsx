import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardOverview } from '@/features/dashboard/queries/useDashboard';
import { StatGrid } from '@/components/ui/StatCard';
import type { User } from '@/features/auth/queries/useAuth';

type HrManagerDashboardViewProps = {
  user: User;
};

export const HrManagerDashboardView: React.FC<HrManagerDashboardViewProps> = ({ user }) => {
  const { data: dashboard, isLoading } = useDashboardOverview();

  const kpis = dashboard?.kpis || {
    totalNetPaid: 0,
    payslipsGenerated: 0,
    averageSalary: 0,
    approvedTimeOffDays: 2,
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

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      {/* Welcome Banner */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          HR Management Console
        </h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Workforce, attendance tracking, and leave operations · Logged in as{' '}
          <b className="text-ink">{user.email}</b> ({user.role})
        </p>
      </div>

      {/* Workforce Health Stats (NO payroll figures shown) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Workforce & Attendance Health
          </h2>
          {isLoading && (
            <span className="text-xs text-ink-soft flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Syncing live metrics...
            </span>
          )}
        </div>
        <StatGrid
          columns={4}
          items={[
            {
              label: 'Attendance Health Score',
              value: kpis.attendanceHealthScore,
              subtext: 'Daily workforce coverage',
            },
            {
              label: 'Approved Time-Off Days',
              value: `${kpis.approvedTimeOffDays} Days`,
              subtext: 'Current month cycle',
            },
            {
              label: 'Pending Leave Requests',
              value: String(kpis.pendingTimeOffRequests),
              subtext: 'Action needed in Time Off',
            },
            {
              label: 'Active Punches Logged',
              value: String(attendance.present + attendance.late),
              subtext: 'Present & on shift today',
            },
          ]}
        />
      </div>

      {/* Biometric Punch Audit */}
      <div className="bg-bg border border-line rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div>
            <h3 className="font-serif text-base font-semibold text-ink">
              Biometric Punch & Attendance Exceptions
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Daily status tracking, punctuality, and manual punch edits
            </p>
          </div>
          <Link
            to="/attendance"
            className="text-xs text-accent font-medium hover:underline no-underline"
          >
            Open Attendance Log →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
            <span className="text-[11px] text-ink-soft block">Present</span>
            <span className="text-xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {attendance.present}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
            <span className="text-[11px] text-ink-soft block">Late Arrival</span>
            <span className="text-xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1 block">
              {attendance.late}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
            <span className="text-[11px] text-ink-soft block">Absent</span>
            <span className="text-xl font-serif font-bold text-red-600 dark:text-red-400 mt-1 block">
              {attendance.absent}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
            <span className="text-[11px] text-ink-soft block">Overtime</span>
            <span className="text-xl font-serif font-bold text-accent mt-1 block">
              {attendance.overtime}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
            <span className="text-[11px] text-ink-soft block">Manual Edits</span>
            <span className="text-xl font-serif font-bold text-ink mt-1 block">
              {attendance.manualEdits}
            </span>
          </div>
        </div>
      </div>

      {/* HR Operations Launchpad */}
      <div>
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
          HR Management Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/employees"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              👥
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Employee Hub
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Master directory for employee profiles, onboarding, and assignments.
            </p>
          </Link>

          <Link
            to="/contracts"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              📄
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Employment Contracts
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Active agreements, contract terms, tenure, and status verification.
            </p>
          </Link>

          <Link
            to="/schedules"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              📅
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Working Schedules
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Weekly shift patterns, break times, and automated hour calculations.
            </p>
          </Link>

          <Link
            to="/time-off"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              🏖️
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Time Off & Leaves
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Approve leave requests, review allocations, and balance consumption.
            </p>
          </Link>

          <Link
            to="/attendance"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              ⏱️
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Attendance Records
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Check-in/out stamps, punch anomalies, and supervisor corrections.
            </p>
          </Link>

          <Link
            to="/documents"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              🛡️
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Policies & Compliance
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Publish policies, track mandatory acknowledgments, and IP audit trails.
            </p>
          </Link>

          <Link
            to="/employee/org-view"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              🌳
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Organization Hierarchy
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Interactive departmental reporting hierarchy and manager chains.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
