import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../features/auth/queries/useAuth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-15 text-center text-ink-soft bg-bg">
        Loading session...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-15 text-center bg-bg text-ink">
        <p className="text-over-red text-base">Session expired or user not found.</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      {/* Top Console Navigation */}
      <header className="border-b border-line px-8 py-4 flex justify-between items-center bg-bg">
        <div className="flex items-center gap-7">
          <span className="font-serif text-xl font-bold text-ink">
            PeoplePay<span className="text-accent">360</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-accent-soft text-accent font-semibold">
            {user.role}
          </span>
          {user.role === 'Admin' && (
            <Link
              to="/users"
              className="text-xs px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-medium hover:opacity-80 transition-opacity no-underline flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              User Management
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-soft">
            {user.email}
          </span>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="max-w-6xl mx-auto w-full flex-1 px-8 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2 text-ink">
            Welcome, {user.employee?.firstName || user.email.split('@')[0]}
          </h1>
          <p className="text-ink-soft text-sm sm:text-base m-0">
            Operational Command Center · Role: <b className="text-ink">{user.role}</b>
          </p>
        </div>

        {/* Action Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {[
            ...(user.role === 'Admin'
              ? [
                  {
                    title: 'User Management',
                    desc: 'System access control, employee account provisioning, and RBAC permission grants.',
                    tag: 'Admin Only',
                    link: '/users',
                    isDirectLink: true,
                  },
                ]
              : []),
            {
              title: 'Employee Master',
              desc: 'Central employee profiles, departments, and working schedules.',
              tag: 'Core HR',
              link: '#',
              isDirectLink: false,
            },
            {
              title: 'Contract Management',
              desc: 'Period-active compensation contracts and wage structures.',
              tag: 'Contracts',
              link: '#',
              isDirectLink: false,
            },
            {
              title: 'Attendance & Punches',
              desc: 'Check-in, check-out logs, and manual exception reviews.',
              tag: 'Operations',
              link: '#',
              isDirectLink: false,
            },
            {
              title: 'Time Off & Balances',
              desc: 'Leave allocations, employee requests, and approval actions.',
              tag: 'Leaves',
              link: '#',
              isDirectLink: false,
            },
            {
              title: 'Payrun Wizard',
              desc: 'Initiate batch payruns, compute salary rules, and validate slips.',
              tag: 'Payroll',
              link: '#',
              isDirectLink: false,
            },
            {
              title: 'Live Payroll Analytics',
              desc: 'Department salary distributions, KPI cards, and anomaly warnings.',
              tag: 'Reporting',
              link: '#',
              isDirectLink: false,
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`border border-line rounded-xl p-6 bg-bg-raised flex flex-col justify-between ${
                card.isDirectLink ? 'ring-1 ring-accent/30 shadow-xs' : ''
              }`}
            >
              <div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    card.isDirectLink ? 'text-purple-600 dark:text-purple-400' : 'text-accent'
                  }`}
                >
                  {card.tag}
                </span>
                <h3 className="text-lg my-2 font-semibold font-sans text-ink">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-ink-soft m-0 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className="mt-5">
                {card.isDirectLink ? (
                  <Link
                    to={card.link}
                    className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1 cursor-pointer no-underline"
                  >
                    Open Console →
                  </Link>
                ) : (
                  <span className="text-xs text-accent font-medium hover:underline cursor-pointer">
                    Ready in module →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Profile Card */}
        <div className="border border-line rounded-xl p-7 bg-bg">
          <h3 className="font-serif text-lg sm:text-xl font-semibold mb-4 text-ink">
            Current Session Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-ink-soft block text-xs mb-1">User ID</span>
              <span className="font-mono text-xs sm:text-sm text-ink">{user.id}</span>
            </div>
            <div>
              <span className="text-ink-soft block text-xs mb-1">Assigned Role</span>
              <b className="text-ink">{user.role}</b>
            </div>
            <div>
              <span className="text-ink-soft block text-xs mb-1">Linked Employee ID</span>
              <span className="font-mono text-xs sm:text-sm text-ink">{user.employeeId || 'None (System Admin)'}</span>
            </div>
            <div>
              <span className="text-ink-soft block text-xs mb-1">Auth Status</span>
              <span className="text-accent font-medium">Authenticated (JWT)</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-5 px-8 text-center text-xs text-ink-soft">
        PeoplePay360 — Integrated HR & Payroll Operations Platform
      </footer>
    </div>
  );
};
