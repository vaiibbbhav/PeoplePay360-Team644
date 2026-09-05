import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../features/auth/queries/useAuth';

type NavItem = {
  label: string;
  path: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  adminOnly?: boolean;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center text-ink-soft bg-bg font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading session...</span>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-bg text-ink font-sans">
        <div className="max-w-sm w-full p-6 border border-line rounded-2xl bg-bg-raised">
          <p className="text-red-500 text-sm font-medium">Session expired or user not found.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Redirect standard employees to self-service employee portal
  if (user.role === 'Employee') {
    navigate('/employee/dashboard', { replace: true });
    return null;
  }

  const navGroups: NavGroup[] = [
    {
      title: 'Navigation',
      items: [
        {
          label: 'Overview',
          path: '/dashboard',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          ),
        },
        ...(user.role === 'Admin'
          ? [
              {
                label: 'User Management',
                path: '/users',
                adminOnly: true,
                badge: 'Admin',
                icon: ({ className }: { className?: string }) => (
                  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ),
              },
            ]
          : []),
      ],
    },
    {
      title: 'Core HR',
      items: [
        {
          label: 'Employees',
          path: '/employees',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          ),
        },
        {
          label: 'Contracts',
          path: '#contracts',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
        },
        {
          label: 'Work Schedules',
          path: '#schedules',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Time & Attendance',
      items: [
        {
          label: 'Attendance Records',
          path: '#attendance',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          ),
        },
        {
          label: 'Time Off Requests',
          path: '#timeoff',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Payroll Operations',
      items: [
        {
          label: 'Payrun Wizard',
          path: '#payruns',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          ),
        },
        {
          label: 'Compensation & Payslips',
          path: '/compensation',
          badge: 'Self-Service',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
        },
        {
          label: 'Salary Structures',
          path: '#structures',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z"
              />
            </svg>
          ),
        },
        {
          label: 'Payroll Analytics',
          path: '#analytics',
          icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-bg text-ink font-sans">
      {/* ---------------- SIDEBAR ---------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-bg-raised/40 backdrop-blur-md flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-line flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 no-underline">
            <span className="font-serif text-lg font-bold tracking-tight text-ink">
              PeoplePay<span className="text-accent">360</span>
            </span>
          </Link>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-line bg-bg text-ink-soft">
            v1.0
          </span>
        </div>

        {/* User Quick Info */}
        <div className="p-4 border-b border-line bg-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
              {user.employee?.firstName?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate">
                {user.employee
                  ? `${user.employee.firstName} ${user.employee.lastName}`
                  : user.email.split('@')[0]}
              </div>
              <div className="text-[11px] text-accent font-medium truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/70">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors no-underline ${
                        isActive
                          ? 'bg-accent text-accent-ink shadow-xs'
                          : 'text-ink hover:bg-bg-raised hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                            isActive
                              ? 'bg-accent-ink/20 text-accent-ink'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-line bg-bg/40">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-ink-soft"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ---------------- MAIN CANVAS ---------------- */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-line px-6 sm:px-8 flex items-center justify-between bg-bg/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-line bg-bg text-ink cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span>Console</span>
              <span className="text-line">/</span>
              <span className="text-ink font-medium">Dashboard Overview</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'Admin' && (
              <Link
                to="/users"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors no-underline shadow-xs"
              >
                <svg
                  className="w-3.5 h-3.5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Manage Users
              </Link>
            )}
            <div className="text-xs text-ink-soft hidden md:block">{user.email}</div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10">
          {/* Welcome Banner */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Welcome, {user.employee?.firstName || user.email.split('@')[0]}
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
                  ? `${user.employee.firstName} ${user.employee.lastName}`
                  : 'System Administrator'}
              </div>
              <span className="text-[11px] text-ink-soft mt-1 block">
                {user.employeeId
                  ? `ID: ${user.employeeId.substring(0, 8)}...`
                  : 'Unlinked root access'}
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
              ].map((card) => (
                <div
                  key={card.title}
                  className={`border border-line rounded-xl p-5 sm:p-6 bg-bg-raised/50 flex flex-col justify-between transition-colors ${
                    card.isDirectLink ? 'ring-1 ring-accent/30 bg-bg' : ''
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        card.isDirectLink ? 'text-purple-600 dark:text-purple-400' : 'text-accent'
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
        </main>

        {/* Footer */}
        <footer className="border-t border-line py-4 px-8 text-center text-xs text-ink-soft mt-auto">
          PeoplePay360 — Integrated HR & Payroll Operations Platform
        </footer>
      </div>
    </div>
  );
};
