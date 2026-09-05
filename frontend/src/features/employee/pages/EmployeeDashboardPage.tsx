import React from 'react';
import { Link } from 'react-router-dom';
import { EmployeeLayout } from '../components/EmployeeLayout';
import { useCurrentUser } from '@/features/auth/queries/useAuth';

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
      link: '/profile',
      isDirectLink: true,
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
      link: '/compensation',
      isDirectLink: true,
    },
    {
      id: 'documents',
      title: 'Policies & Documents',
      desc: 'Mandatory company policies, code of conduct, and compliance acknowledgments.',
      tag: 'Compliance',
      link: '/documents',
      isDirectLink: true,
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
            {currentUser.employee?.id
              ? `ID: ${currentUser.employee.id.substring(0, 8)}...`
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
