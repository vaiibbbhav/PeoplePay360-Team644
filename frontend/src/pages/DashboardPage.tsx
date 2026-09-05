import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/queries/useAuth';

export const DashboardPage: React.FC = () => {
  const { data: user } = useCurrentUser();

  if (!user) return null;

  // Admin does not have Overview page — redirect straight to User Management
  if (user.role === 'Admin') {
    return <Navigate to="/users" replace />;
  }

  const modules = [
    ...(user.role === 'Admin'
      ? [
          {
            title: 'User Management',
            desc: 'System access control, employee account provisioning, and RBAC permission grants.',
            tag: 'Admin',
            link: '/users',
            isLink: true,
          },
        ]
      : []),
    {
      title: 'Employee Master',
      desc: 'Central employee profiles, departments, and working schedules.',
      tag: 'Core HR',
      link: '/employees',
      isLink: false,
    },
    {
      title: 'Contract Management',
      desc: 'Period-active compensation contracts and wage structures.',
      tag: 'Contracts',
      link: '/contracts',
      isLink: false,
    },
    {
      title: 'Attendance & Punches',
      desc: 'Check-in, check-out logs, and manual exception reviews.',
      tag: 'Operations',
      link: '/attendance',
      isLink: false,
    },
    {
      title: 'Time Off & Balances',
      desc: 'Leave allocations, employee requests, and approval actions.',
      tag: 'Leaves',
      link: '/time-off',
      isLink: false,
    },
    {
      title: 'Payrun Wizard',
      desc: 'Initiate batch payruns, compute salary rules, and validate slips.',
      tag: 'Payroll',
      link: '/payruns',
      isLink: false,
    },
    {
      title: 'Payroll Analytics',
      desc: 'Department salary distributions, KPI cards, and anomaly warnings.',
      tag: 'Reporting',
      link: '/analytics',
      isLink: false,
    },
  ];

  return (
    <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Welcome, {user.firstName || user.employee?.firstName || user.email.split('@')[0]}
        </h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Operational Command Center · Active Role:{' '}
          <span className="font-medium text-ink">{user.role}</span>
        </p>
      </div>

      {/* Modules Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">Operational Modules</h2>
          <span className="text-xs text-ink-soft">Ready for workflow execution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((card) => (
            <div
              key={card.title}
              className="border border-line rounded-xl p-5 bg-bg-raised/40 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {card.tag}
                </span>
                <h3 className="text-sm font-semibold text-ink my-2">{card.title}</h3>
                <p className="text-xs text-ink-soft leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60">
                {card.isLink ? (
                  <Link
                    to={card.link}
                    className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1 no-underline"
                  >
                    Open Console →
                  </Link>
                ) : (
                  <span className="text-xs text-ink-soft/70 font-medium">Coming soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
