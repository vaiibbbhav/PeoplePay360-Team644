import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Clock } from 'lucide-react';
import { useAdminOverview } from '@/features/dashboard/queries/useDashboard';
import { UserAddModal } from '@/features/users/components/UserAddModal';
import { useCreateUser, useEmployeeOptions } from '@/features/users/queries/useUsers';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { User } from '@/features/auth/queries/useAuth';

type AdminDashboardViewProps = {
  user: User;
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const formatTimeAgo = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return 'recently';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'recently';

  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ user }) => {
  const { data: overview, isLoading, refetch } = useAdminOverview();
  const { data: employees = [] } = useEmployeeOptions();
  const createMutation = useCreateUser();

  // Quick Action Modal states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const auditModalRef = useClickOutside<HTMLDivElement>(() => {
    setIsAuditModalOpen(false);
  }, isAuditModalOpen);

  const attention = overview?.attention || {
    incompleteProfiles: { count: 0, items: [] },
    deactivatedAccounts: { count30Days: 0, totalCount: 0, items: [] },
    unassignedRolesCount: 0,
  };

  const access = overview?.access || {
    totalActiveUsers: 0,
    totalUsers: 0,
    roleBreakdown: {
      Admin: 0,
      'HR Manager': 0,
      'HR Payroll Manager': 0,
      'HR Payroll User': 0,
      Employee: 0,
    },
    createdThisWeek: { count: 0, sample: [] },
  };

  const anomalies = overview?.anomalies || {
    employeesWithoutContract: { count: 0, items: [] },
    draftPayruns: { count: 0, items: [] },
  };

  const recentActivity = overview?.recentActivity || [];

  const handleCreateUser = async (data: any) => {
    await createMutation.mutateAsync(data);
    setIsAddUserOpen(false);
    refetch();
  };

  // Role breakdown data
  const rolesList = [
    {
      role: 'Admin',
      count: access.roleBreakdown['Admin'] || 0,
      bgClass: 'bg-accent',
      swatchClass: 'bg-accent',
    },
    {
      role: 'HR Manager',
      count: access.roleBreakdown['HR Manager'] || 0,
      bgClass: 'bg-[#4a2b72] dark:bg-[#9d7bc4]',
      swatchClass: 'bg-[#4a2b72] dark:bg-[#9d7bc4]',
    },
    {
      role: 'HR Payroll Manager',
      count: access.roleBreakdown['HR Payroll Manager'] || 0,
      bgClass: 'bg-[#3b235b] dark:bg-[#8563ad]',
      swatchClass: 'bg-[#3b235b] dark:bg-[#8563ad]',
    },
    {
      role: 'HR Payroll User',
      count: access.roleBreakdown['HR Payroll User'] || 0,
      bgClass: 'bg-[#2a1941] dark:bg-[#6c4e94]',
      swatchClass: 'bg-[#2a1941] dark:bg-[#6c4e94]',
    },
    {
      role: 'Employee',
      count: access.roleBreakdown['Employee'] || 0,
      bgClass: 'bg-line dark:bg-neutral-700',
      swatchClass: 'bg-ink-faint',
    },
  ];

  const totalRoleCount = rolesList.reduce((sum, r) => sum + r.count, 0) || 1;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-ink-soft">Loading system administration console...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Access &amp; Governance Overview
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Logged in as <b className="text-ink font-medium">{user.email}</b> · {user.role}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            + Create User
          </button>
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-line bg-transparent hover:bg-bg-raised text-ink transition-colors whitespace-nowrap"
          >
            Manage Users
          </Link>
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-line bg-transparent hover:bg-bg-raised text-ink transition-colors cursor-pointer whitespace-nowrap"
          >
            View Audit Log
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-line my-5 sm:my-6" />

      {/* ── Section 1: Needs your attention ── */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">Needs your attention</h2>
          <span className="text-xs text-ink-faint hidden sm:inline">
            Single-module and cross-module items, together
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {/* Card 1: Incomplete profiles */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">Incomplete profiles</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    attention.incompleteProfiles.count > 0 ? 'bg-over-red' : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {attention.incompleteProfiles.count}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                Accounts created, but department, manager, or schedule was never filled in.
              </p>
              {attention.incompleteProfiles.items.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {attention.incompleteProfiles.items.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className="text-[11px] px-2.5 py-0.5 rounded-full border border-line text-ink-soft"
                    >
                      {item.firstName} {item.lastName}
                    </span>
                  ))}
                  {attention.incompleteProfiles.count > 2 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-line text-ink-soft">
                      +{attention.incompleteProfiles.count - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Link
              to="/employees"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Complete in directory →
            </Link>
          </div>

          {/* Card 2: Employees without a contract */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">
                  Employees without a contract
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    anomalies.employeesWithoutContract.count > 0 ? 'bg-over-red' : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {anomalies.employeesWithoutContract.count}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                Active employees with no contract on file — payroll can't run for them yet.
              </p>
              {anomalies.employeesWithoutContract.items.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {anomalies.employeesWithoutContract.items.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className="text-[11px] px-2.5 py-0.5 rounded-full border border-line text-ink-soft"
                    >
                      {item.firstName} {item.lastName}
                    </span>
                  ))}
                  {anomalies.employeesWithoutContract.count > 2 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-line text-ink-soft">
                      +{anomalies.employeesWithoutContract.count - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Link
              to="/contracts"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Assign contracts →
            </Link>
          </div>

          {/* Card 3: Deactivated, last 30 days */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">
                  Deactivated, last 30 days
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    attention.deactivatedAccounts.count30Days > 0 ? 'bg-over-red' : 'bg-ink-faint'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {attention.deactivatedAccounts.count30Days}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                {attention.deactivatedAccounts.count30Days === 0
                  ? 'No accounts disabled recently — nothing to double-check here.'
                  : `${attention.deactivatedAccounts.count30Days} account(s) deactivated recently. Review disabled logins.`}
              </p>
            </div>
            <Link
              to="/users"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              Review deactivated accounts →
            </Link>
          </div>

          {/* Card 4: Role assignment integrity */}
          <div className="bg-bg p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-ink-soft">
                  Role assignment integrity
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    attention.unassignedRolesCount === 0 ? 'bg-emerald-600' : 'bg-over-red'
                  }`}
                />
              </div>
              <div className="text-3xl font-semibold font-serif leading-none mb-2 text-ink">
                {attention.unassignedRolesCount === 0 ? 'Clean' : attention.unassignedRolesCount}
              </div>
              <p className="text-xs text-ink-soft m-0 mb-3 leading-relaxed">
                {attention.unassignedRolesCount === 0
                  ? 'Every account maps to one valid role. Nothing outside the permission matrix.'
                  : 'Orphaned or unassigned roles detected in the directory. Check permissions.'}
              </p>
            </div>
            <Link
              to="/users"
              className="text-xs text-accent font-medium border-t border-line pt-3 block hover:underline"
            >
              View role matrix →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 2: Enterprise Operations Hub ── */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-ink">Enterprise Operations Hub</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Direct access to all administrative modules, workforce hierarchy, and governance consoles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Org View */}
          <Link
            to="/organization"
            className="group p-5 rounded-xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM9 20a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM7 10v4a1 1 0 001 1h8a1 1 0 001-1v-4M12 15v3"
                    />
                  </svg>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-line text-ink-soft">
                  Hierarchy
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                Organization & Hierarchy
              </h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Interactive corporate chart, leadership tree, direct reports map, and department roster.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>View Org Chart</span>
              <span>→</span>
            </div>
          </Link>

          {/* Policies & Documents */}
          <Link
            to="/documents"
            className="group p-5 rounded-xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-line text-ink-soft">
                  Compliance
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                Policies & Compliance
              </h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Mandatory regulations, code of conduct catalog, and employee acknowledgment audit trails.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Manage Compliance</span>
              <span>→</span>
            </div>
          </Link>

          {/* User Management */}
          <Link
            to="/users"
            className="group p-5 rounded-xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-line text-ink-soft">
                  Security
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                User Management & Roles
              </h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Credentials, role-based authorization matrix, account status, and system access.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Configure Users</span>
              <span>→</span>
            </div>
          </Link>

          {/* Payruns & Compensation */}
          <Link
            to="/payruns"
            className="group p-5 rounded-xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-line text-ink-soft">
                  Payroll
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                Payruns & Payslips
              </h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                2-step payrun execution wizard, salary rules computation, and company-wide payslip archive.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Execute Payruns</span>
              <span>→</span>
            </div>
          </Link>

          {/* Contracts & Schedules */}
          <Link
            to="/contracts"
            className="group p-5 rounded-xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-line text-ink-soft">
                  Contracts
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                Contracts & Work Schedules
              </h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Governing wage agreements, duration terms, and working schedule hour rules.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Manage Contracts</span>
              <span>→</span>
            </div>
          </Link>

          {/* Biometric Terminal & Attendance */}
          <Link
            to="/attendance/terminal"
            className="group p-5 rounded-xl border border-line bg-bg hover:border-accent/50 hover:bg-bg-raised/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border border-line text-ink-soft">
                  Biometrics
                </span>
              </div>
              <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                Kiosk Terminal & Attendance
              </h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Live punch kiosk, scanner hardware logs, daily worked hours, and exception audit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line text-xs font-medium text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open Kiosk Terminal</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Section 3: Access snapshot ── */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">Access snapshot</h2>
          <Link to="/users" className="text-xs text-accent font-medium hover:underline">
            Manage user directory →
          </Link>
        </div>

        <div className="border border-line rounded-xl p-5 sm:p-6 bg-bg">
          {/* Proportional Role Bar */}
          <div className="flex h-2 rounded-md overflow-hidden mb-5 bg-line">
            {rolesList.map(({ role, count, bgClass }) => {
              if (count === 0) return null;
              const weight = Math.max(1, Math.round((count / totalRoleCount) * 10));
              const flexClass =
                weight >= 5
                  ? 'flex-[5]'
                  : weight === 4
                    ? 'flex-[4]'
                    : weight === 3
                      ? 'flex-[3]'
                      : weight === 2
                        ? 'flex-[2]'
                        : 'flex-1';
              return (
                <span
                  key={role}
                  className={`h-full ${bgClass} ${flexClass} border-r border-bg last:border-0`}
                />
              );
            })}
          </div>

          {/* Role Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {rolesList.map(({ role, count, swatchClass }) => {
              const pct = totalRoleCount > 0 ? Math.round((count / totalRoleCount) * 100) : 0;
              return (
                <div key={role} className="border-t border-line pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft mb-1.5">
                    <span className={`w-2 h-2 rounded-xs ${swatchClass}`} />
                    {role}
                  </div>
                  <div className="font-serif text-2xl font-semibold text-ink leading-tight">
                    {count}
                  </div>
                  <div className="text-[11px] text-ink-faint mt-0.5">{pct}% of accounts</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: Provisioned this week ── */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">Provisioned this week</h2>
          <Link to="/users" className="text-xs text-accent font-medium hover:underline">
            Full provisioning log →
          </Link>
        </div>

        <div className="border border-line rounded-xl bg-bg overflow-hidden divide-y divide-line">
          {access.createdThisWeek.sample.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-faint">
              No new accounts provisioned this week.
            </div>
          ) : (
            access.createdThisWeek.sample.map((acc) => {
              const initials =
                `${acc.firstName?.[0] || ''}${acc.lastName?.[0] || ''}`.toUpperCase() || 'U';
              return (
                <div
                  key={acc.id}
                  className="flex items-center gap-3.5 px-5 py-3 hover:bg-bg-raised/40 transition-colors text-xs sm:text-sm"
                >
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {acc.firstName} {acc.lastName}
                    </div>
                    <div className="text-xs text-ink-faint truncate">{acc.email}</div>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full border border-line text-ink-soft flex-shrink-0">
                    {acc.role}
                  </span>
                  <span className="text-xs text-ink-faint w-16 text-right flex-shrink-0">
                    {formatTimeAgo(acc.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Section 4: Recent admin activity ── */}
      <div>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-ink">Recent admin activity</h2>
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="text-xs text-accent font-medium hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            View full audit history →
          </button>
        </div>

        <div className="border border-line rounded-xl bg-bg overflow-hidden divide-y divide-line">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-faint">
              No admin activity recorded yet.
            </div>
          ) : (
            recentActivity.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-bg-raised/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full flex-shrink-0 bg-accent-soft text-accent flex items-center justify-center text-xs font-bold mt-0.5">
                  ＋
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-ink leading-snug">
                    {act.description}
                  </div>
                  <div className="text-xs text-ink-faint mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>By {act.actorName || 'Admin'}</span>
                    <span>·</span>
                    <code className="text-[10px] font-mono bg-bg-raised px-1.5 py-0.5 rounded border border-line/50">
                      {act.action}
                    </code>
                  </div>
                </div>
                <span className="text-xs text-ink-faint flex-shrink-0 pt-0.5">
                  {formatTimeAgo(act.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Add User Modal ── */}
      <UserAddModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSave={handleCreateUser}
        isPending={createMutation.isPending}
        employees={employees}
      />

      {/* ── Full Audit Trail Modal ── */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAuditModalOpen(false)}
          />
          <div
            ref={auditModalRef}
            className="relative z-10 w-full max-w-3xl bg-bg border border-line rounded-xl shadow-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-ink">System Audit Trail</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Chronological record of account modifications, provision events, and permissions
                  changes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-raised text-ink-soft hover:text-ink cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 divide-y divide-line/60">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-soft">No audit logs found.</div>
              ) : (
                recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="pt-3 first:pt-0 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold text-ink">{act.description}</div>
                      <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                        <span>Actor: {act.actorName || 'Admin'}</span>
                        <span>·</span>
                        <span>Target: {act.entityType}</span>
                        <span>·</span>
                        <span className="font-mono text-[10px] uppercase bg-bg-raised px-1.5 py-0.5 rounded border border-line">
                          {act.action}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-ink-soft font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-ink-faint" />
                      {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-line bg-bg-raised/40 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-bg border border-line text-ink hover:bg-bg-raised cursor-pointer transition-colors"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
