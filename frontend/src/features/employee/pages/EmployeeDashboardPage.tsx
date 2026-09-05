import React from 'react';
import { Link } from 'react-router-dom';
import { EmployeeLayout } from '../components/EmployeeLayout';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { useFingerprintStatus } from '@/features/attendance/queries/useFingerprint';

export const EmployeeDashboardPage: React.FC = () => {
  const { data: user } = useCurrentUser();

  const currentUser = user || {
    id: 'emp-session',
    email: 'employee@peoplepay360.com',
    role: 'Employee',
    employee: {
      id: 'emp-001',
      firstName: 'Employee',
      lastName: 'User',
      email: 'employee@peoplepay360.com',
    },
  };

  const employeeId = currentUser.employee?.id || currentUser.employeeId || currentUser.id || '';
  const { data: fpStatus } = useFingerprintStatus(employeeId);
  const hasFingerprint = fpStatus?.enrolled;

  const employeeModules = [
    {
      id: 'attendance',
      title: 'Attendance & Punches',
      desc: 'Check-in, check-out logs, and daily attendance history.',
      tag: 'Time & Attendance',
      link: '/employee/attendance',
      isDirectLink: true,
    },
    {
      id: 'task-box',
      title: 'Task Box',
      desc: 'Pending tasks, personal action items, and task completions.',
      tag: 'Workspace',
      link: '#task-box',
      isDirectLink: false,
    },
    {
      id: 'profile',
      title: 'Profile & Documents',
      desc: 'Personal details, emergency contacts, and employment history.',
      tag: 'Account',
      link: '#profile',
      isDirectLink: false,
    },
    {
      id: 'time-management',
      title: 'Time Management',
      desc: 'Work schedule hours, shifts, and time allocation tracking.',
      tag: 'Schedules',
      link: '#time-management',
      isDirectLink: false,
    },
    {
      id: 'team',
      title: 'Team Directory',
      desc: 'Department colleagues, reporting manager, and peer directory.',
      tag: 'Organization',
      link: '#team',
      isDirectLink: false,
    },
    {
      id: 'compensation',
      title: 'Compensation & Slips',
      desc: 'Monthly payslips, wage breakdown, and tax declarations.',
      tag: 'Payroll',
      link: '#compensation',
      isDirectLink: false,
    },
    {
      id: 'recruitment',
      title: 'Recruitment & Referrals',
      desc: 'Internal vacancies, candidate referrals, and application status.',
      tag: 'Careers',
      link: '#recruitment',
      isDirectLink: false,
    },
    {
      id: 'calendar',
      title: 'Company Calendar',
      desc: 'Public holidays, planned leave dates, and company events.',
      tag: 'Planning',
      link: '#calendar',
      isDirectLink: false,
    },
    {
      id: 'performance',
      title: 'Performance & Goals',
      desc: 'Review goals, periodic feedback, and key quarterly milestones.',
      tag: 'Growth',
      link: '#performance',
      isDirectLink: false,
    },
    {
      id: 'flows',
      title: 'Workflows & Approvals',
      desc: 'Submit approval requests, review pending flows, and sign-offs.',
      tag: 'Operations',
      link: '#flows',
      isDirectLink: false,
    },
    {
      id: 'docs',
      title: 'Docs & Policies',
      desc: 'Employee handbook, compliance documents, and company policies.',
      tag: 'Knowledge',
      link: '#docs',
      isDirectLink: false,
    },
    {
      id: 'org-view',
      title: 'Org View',
      desc: 'Organizational hierarchy, department mapping, and teams structure.',
      tag: 'Company',
      link: '#org-view',
      isDirectLink: false,
    },
  ];

  return (
    <EmployeeLayout title="Dashboard Overview">
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Welcome, {currentUser.employee?.firstName || currentUser.email.split('@')[0]}
        </h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Employee Self-Service Portal · Active Role: <b className="text-ink">{currentUser.role}</b>
        </p>
      </div>

      {/* Biometric Registration Alert Banner */}
      {hasFingerprint === false && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-accent/40 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
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
            to="/employee/attendance?register=true"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline text-center shrink-0"
          >
            Add Fingerprint
          </Link>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Session Identity</span>
          <div className="text-base font-semibold text-ink mt-1 truncate">{currentUser.email}</div>
          <span className="text-[11px] text-accent font-medium mt-1 block">JWT Verified</span>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Workspace Status</span>
          <div className="text-base font-semibold text-ink mt-1">Active Employee</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Portal Active
          </span>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Linked Profile</span>
          <div className="text-base font-semibold text-ink mt-1 truncate">
            {currentUser.employee
              ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
              : 'Employee Account'}
          </div>
          <span className="text-[11px] text-ink-soft mt-1 block truncate">
            {currentUser.employeeId
              ? `ID: ${currentUser.employeeId.substring(0, 8)}...`
              : 'Linked Member ID'}
          </span>
        </div>
      </div>

      {/* Operational Modules Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">Employee Workspace</h2>
          <span className="text-xs text-ink-soft">Self-service modules & tools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {employeeModules.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className={`border border-line rounded-xl p-5 sm:p-6 bg-bg-raised/50 flex flex-col justify-between transition-colors scroll-mt-24 ${
                card.isDirectLink ? 'ring-1 ring-accent/30 bg-bg' : ''
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    card.isDirectLink ? 'text-accent' : 'text-ink-soft'
                  }`}
                >
                  {card.tag}
                </span>
                <h3 className="text-base my-2 font-semibold text-ink">{card.title}</h3>
                <p className="text-xs text-ink-soft m-0 leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-5 pt-3 border-t border-line/60">
                {card.isDirectLink ? (
                  <Link
                    to={card.link}
                    className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1 cursor-pointer no-underline"
                  >
                    Open Console →
                  </Link>
                ) : (
                  <span className="text-xs text-ink-soft/80 font-medium">Ready in portal</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboardPage;
