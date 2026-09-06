import React from 'react';
import { Link } from 'react-router-dom';
import { useFingerprintStatus } from '@/features/attendance/queries/useFingerprint';
import type { User } from '@/features/auth/queries/useAuth';

type EmployeeDashboardViewProps = {
  user: User;
  section?: string;
};

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ user }) => {
  const employeeId = user.employee?.id || user.employeeId || user.id || '';
  const { data: fpStatus } = useFingerprintStatus(employeeId);
  const hasFingerprint = fpStatus?.enrolled;

  const employeeModules = [
    {
      id: 'attendance',
      title: 'Attendance & Punches',
      desc: 'Check-in, check-out logs, daily attendance history, and punch terminal.',
      tag: 'Time & Attendance',
      link: '/attendance',
    },
    {
      id: 'time-off',
      title: 'Time Off & Leaves',
      desc: 'Submit leave requests, review available balances, and track approvals.',
      tag: 'Leaves',
      link: '/time-off',
    },
    {
      id: 'compensation',
      title: 'Compensation & Slips',
      desc: 'Monthly payslips, wage breakdown, and tax declarations.',
      tag: 'Payroll',
      link: '/compensation',
    },
    {
      id: 'profile',
      title: 'My Profile',
      desc: 'Personal details, emergency contacts, and employment history.',
      tag: 'Account',
      link: '/profile',
    },
    {
      id: 'team',
      title: 'Org View & Directory',
      desc: 'Visual reporting hierarchy, leadership tree, and team rosters.',
      tag: 'Organization',
      link: '/employee/org-view',
    },
    {
      id: 'documents',
      title: 'Policies & Documents',
      desc: 'Mandatory company policies, code of conduct, and compliance acknowledgments.',
      tag: 'Compliance',
      link: '/employee/docs',
    },
    {
      id: 'contracts',
      title: 'My Contracts',
      desc: 'View your current and historical employment contracts and wage details.',
      tag: 'Employment',
      link: '/contracts',
    },
    {
      id: 'schedules',
      title: 'Work Schedules',
      desc: 'View your assigned working schedule, shift hours, and break times.',
      tag: 'Schedules',
      link: '/schedules',
    },
  ];


  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      {/* Welcome Banner */}
      <div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-ink">
          Welcome, {user.employee?.firstName || user.firstName || user.email.split('@')[0]}
        </h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Employee Self-Service Portal · Logged in as <b className="text-ink">{user.email}</b>
        </p>
      </div>

      {/* Biometric Registration Alert Banner */}
      {hasFingerprint === false && (
        <div className="p-4 sm:p-5 rounded-2xl border border-accent/40 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004.07 9m5.918 8d.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-ink flex items-center gap-2">
                <span>Biometric Fingerprint Setup Required</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-accent text-accent-ink uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Your profile does not have an enrolled fingerprint. Register now to enable one-touch biometric check-in & check-out.
              </p>
            </div>
          </div>
          <Link
            to="/attendance?register=true"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline text-center shrink-0"
          >
            Add Fingerprint
          </Link>
        </div>
      )}

      {/* Quick Summary Cards: Identity, Contract, Schedule, Biometrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Session Role</span>
          <div className="text-base font-semibold text-ink mt-1">{user.role}</div>
          <span className="text-[11px] text-accent font-medium mt-1 block">
            Active Workspace
          </span>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Employment Contract</span>
          <div className="text-base font-semibold text-ink mt-1">Active Agreement</div>
          <Link
            to="/compensation"
            className="text-[11px] text-accent font-medium mt-1 block hover:underline no-underline"
          >
            View wage & contract →
          </Link>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Working Schedule</span>
          <div className="text-base font-semibold text-ink mt-1">Standard 40h Shift</div>
          <Link
            to="/attendance"
            className="text-[11px] text-accent font-medium mt-1 block hover:underline no-underline"
          >
            Check shift timetable →
          </Link>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Biometrics & Punches</span>
          <div className="text-base font-semibold text-ink mt-1">
            {hasFingerprint ? 'Enrolled & Verified' : 'Punch Clock Ready'}
          </div>
          <Link
            to="/attendance"
            className="text-[11px] text-accent font-medium mt-1 block hover:underline no-underline"
          >
            Open punch terminal →
          </Link>
        </div>
      </div>

      {/* Operational Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">Employee Workspace</h2>
          <span className="text-xs text-ink-soft">12 Self-service modules & tools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {employeeModules.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className="border border-line rounded-xl p-5 sm:p-6 bg-bg-raised/50 flex flex-col justify-between transition-colors scroll-mt-24 ring-1 ring-accent/20 bg-bg"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {card.tag}
                </span>
                <h3 className="text-base my-2 font-semibold text-ink">{card.title}</h3>
                <p className="text-xs text-ink-soft m-0 leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-5 pt-3 border-t border-line/60">
                <Link
                  to={card.link}
                  className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1 cursor-pointer no-underline"
                >
                  Open Console →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
