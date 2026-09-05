import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/queries/useAuth';

export const DashboardPage: React.FC = () => {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-red-500 text-sm font-medium">Session expired or user not found.</p>
        <Link
          to="/login"
          className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-ink no-underline hover:opacity-90"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Admin does not have Overview page — redirect straight to User Management
  if (user.role === 'Admin') {
    return <Navigate to="/users" replace />;
  }

  // Redirect standard employees to self-service employee portal
  if (user.role === 'Employee') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  const modules = [
    {
      title: 'My Compensation & Payslips',
      desc: 'View active CTC packages, download monthly verified payslips, and inspect income tax computation.',
      tag: 'Self-Service',
      link: '/compensation',
      isDirectLink: true,
    },
    {
      title: 'Employee Master',
      desc: 'Central employee profiles, departments, and working schedules.',
      tag: 'Core HR',
      link: '/employees',
      isDirectLink: true,
    },
    {
      title: 'Policies & Documents',
      desc: 'Company compliance policies, code of conduct, and employee acknowledgments.',
      tag: 'Compliance',
      link: '/documents',
      isDirectLink: true,
    },
    {
      title: 'Contract Management',
      desc: 'Period-active compensation contracts and wage structures.',
      tag: 'Contracts',
      link: '#contracts',
      isDirectLink: false,
    },
    {
      title: 'Attendance & Punches',
      desc: 'Check-in, check-out logs, and manual exception reviews.',
      tag: 'Operations',
      link: '#attendance',
      isDirectLink: false,
    },
    {
      title: 'Time Off & Balances',
      desc: 'Leave allocations, employee requests, and approval actions.',
      tag: 'Leaves',
      link: '#timeoff',
      isDirectLink: false,
    },
    {
      title: 'Payrun Wizard',
      desc: 'Initiate batch payruns, compute salary rules, and validate slips.',
      tag: 'Payroll',
      link: '#payruns',
      isDirectLink: false,
    },
    {
      title: 'Live Payroll Analytics',
      desc: 'Department salary distributions, KPI cards, and anomaly warnings.',
      tag: 'Reporting',
      link: '#analytics',
      isDirectLink: false,
    },
  ];

  return (
    <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10">
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Welcome, {user.firstName || user.employee?.firstName || user.email.split('@')[0]}
        </h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Operational Command Center · Active Role: <b className="text-ink">{user.role}</b>
        </p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Session Identity</span>
          <div className="text-base font-semibold text-ink mt-1 truncate">{user.email}</div>
          <span className="text-[11px] text-accent font-medium mt-1 block">JWT Verified</span>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Permission Scope</span>
          <div className="text-base font-semibold text-ink mt-1">{user.role}</div>
          <span className="text-[11px] text-ink-soft mt-1 block">RBAC Enforcement Active</span>
        </div>
        <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
          <span className="text-xs text-ink-soft font-medium">Linked Profile</span>
          <div className="text-base font-semibold text-ink mt-1">
            {user.employee
              ? `${user.employee.firstName || ''} ${user.employee.lastName || ''}`.trim() ||
                user.firstName
              : 'System Administrator'}
          </div>
          <span className="text-[11px] text-ink-soft mt-1 block">
            {user.employee?.id
              ? `ID: ${user.employee.id.substring(0, 8)}...`
              : 'Corporate Identity'}
          </span>
        </div>
      </div>

      {/* Operational Modules Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">Operational Modules</h2>
          <span className="text-xs text-ink-soft">Ready for workflow execution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((card) => (
            <div
              key={card.title}
              className={`border border-line rounded-xl p-5 sm:p-6 bg-bg-raised/50 flex flex-col justify-between transition-colors ${
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
                  <span className="text-xs text-ink-soft/80 font-medium">Ready in module</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
