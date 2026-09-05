import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardOverview } from '@/features/dashboard/queries/useDashboard';
import { StatGrid } from '@/components/ui/StatCard';
import type { User } from '@/features/auth/queries/useAuth';

type AdminDashboardViewProps = {
  user: User;
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ user }) => {
  const { data: dashboard, isLoading } = useDashboardOverview();

  const kpis = dashboard?.kpis || {
    totalNetPaid: 320000,
    payslipsGenerated: 4,
    averageSalary: 80000,
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

  const departmentBreakdown = dashboard?.charts?.departmentBreakdown || [
    { department: 'Management', headcount: 1, totalCost: 120000 },
    { department: 'Technology', headcount: 2, totalCost: 165000 },
    { department: 'HR & Operations', headcount: 1, totalCost: 85000 },
  ];

  const totalHeadcount = departmentBreakdown.reduce((acc, curr) => acc + (curr.headcount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            System Administration Console
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Global system administration, access management, and platform oversight · Logged in as{' '}
            <b className="text-ink">{user.email}</b> ({user.role})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/users"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline inline-flex items-center gap-1.5 shadow-sm"
          >
            🛡️ User Management
          </Link>
          <Link
            to="/employees"
            className="py-2.5 px-4 rounded-xl text-xs font-medium border border-line bg-bg-raised hover:border-ink-soft text-ink transition-colors no-underline inline-flex items-center gap-1.5"
          >
            👥 All Employees
          </Link>
        </div>
      </div>

      {/* Admin KPI StatGrid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Platform Health & Operations Overview
          </h2>
          {isLoading && (
            <span className="text-xs text-ink-soft flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Syncing live system telemetry...
            </span>
          )}
        </div>
        <StatGrid
          columns={4}
          items={[
            {
              label: 'Total Workforce Headcount',
              value: String(totalHeadcount || 4),
              subtext: `${departmentBreakdown.length} active departments`,
            },
            {
              label: 'System Attendance Coverage',
              value: kpis.attendanceHealthScore,
              subtext: `${attendance.present} present, ${attendance.late} late`,
            },
            {
              label: 'Pending Leave Approvals',
              value: String(kpis.pendingTimeOffRequests),
              subtext: `${kpis.approvedTimeOffDays} approved this month`,
            },
            {
              label: 'Database Status',
              value: 'Online',
              subtext: 'Neon Serverless PostgreSQL',
            },
          ]}
        />
      </div>

      {/* Role Scopes & Security Card */}
      <div className="bg-bg border border-line rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div>
            <h3 className="font-serif text-base font-semibold text-ink">
              System Roles & Access Control
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Active security roles configured in PeoplePay360 RBAC
            </p>
          </div>
          <Link
            to="/users"
            className="text-xs text-accent font-medium hover:underline no-underline"
          >
            Manage User Accounts →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-1">
            <span className="text-xs font-semibold text-accent block">Admin</span>
            <p className="text-xs text-ink-soft leading-relaxed">
              Full wildcard access across all modules, configuration, and user permissions.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-1">
            <span className="text-xs font-semibold text-ink block">HR Manager</span>
            <p className="text-xs text-ink-soft leading-relaxed">
              Full CRUD on employees, contracts, schedules, attendance, and leaves. No payroll access.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-1">
            <span className="text-xs font-semibold text-ink block">HR Payroll Manager</span>
            <p className="text-xs text-ink-soft leading-relaxed">
              Full HR control plus full Payruns, Payslips, Salary Structures, and Rules.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-1">
            <span className="text-xs font-semibold text-ink-soft block">Employee</span>
            <p className="text-xs text-ink-soft leading-relaxed">
              Self-service workspace: profile, biometrics, leave requests, and personal payslips.
            </p>
          </div>
        </div>
      </div>

      {/* Administrative Operations Launchpad */}
      <div>
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
          Administrative Launchpad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/users"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              🛡️
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              User Management
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Create and manage authentication accounts, assign roles, and activate/deactivate users.
            </p>
          </Link>

          <Link
            to="/employees"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              👥
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Employees Master
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Global employee directory, job titles, manager links, and working schedules.
            </p>
          </Link>

          <Link
            to="/payruns"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              ⚡
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Payroll Engine
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Payrun batches, payslip generation, and rule evaluation audit.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
