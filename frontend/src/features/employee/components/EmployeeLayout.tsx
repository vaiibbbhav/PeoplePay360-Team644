import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCurrentUser, useLogout, type User } from '@/features/auth/queries/useAuth';

type NavItem = {
  label: string;
  path: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  badge?: string;
  hasSubmenu?: boolean;
};

type EmployeeLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({
  children,
  title = 'Dashboard',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser: User = user || {
    id: 'emp-session',
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@peoplepay360.com',
    role: 'Employee',
    employee: {
      id: 'emp-001',
      firstName: 'Employee',
      lastName: 'User',
      email: 'employee@peoplepay360.com',
    },
  };

  const employeeNavItems: NavItem[] = [
    {
      label: 'Dashboard',
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
    {
      label: 'Task Box',
      path: '#task-box',
      hasSubmenu: true,
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
      label: 'Profile',
      path: '/profile',
      hasSubmenu: true,
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      label: 'Time Management',
      path: '/attendance',
      hasSubmenu: true,
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
    {
      label: 'Team',
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
      label: 'Compensation',
      path: '/compensation',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Recruitment',
      path: '#recruitment',
      hasSubmenu: true,
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: 'Calendar',
      path: '#calendar',
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
    {
      label: 'Performance',
      path: '#performance',
      hasSubmenu: true,
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      label: 'Flows',
      path: '#flows',
      hasSubmenu: true,
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
    {
      label: 'Docs',
      path: '/documents',
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
      label: 'Org View',
      path: '/employee/org-view',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM9 20a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM7 10v4a1 1 0 001 1h8a1 1 0 001-1v-4M12 15v3"
          />
        </svg>
      ),
    },
  ];

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/dashboard') {
      return (
        (location.pathname === '/dashboard' || location.pathname === '/employee/dashboard') &&
        (!location.hash || location.hash === '')
      );
    }
    if (itemPath === '/attendance') {
      return location.pathname === '/attendance' || location.pathname === '/employee/attendance';
    }
    if (itemPath === '/profile') {
      return location.pathname === '/profile' || location.pathname.startsWith('/employees/');
    }
    if (itemPath === '/employees') {
      return location.pathname === '/employees';
    }
    if (itemPath === '/compensation') {
      return location.pathname === '/compensation' || location.pathname.startsWith('/payslip');
    }
    if (itemPath === '/documents') {
      return location.pathname === '/documents' || location.pathname === '/policies';
    }
    if (itemPath === '/employee/docs') {
      return (
        location.pathname === '/employee/docs' ||
        location.pathname === '/employee/documents' ||
        location.pathname === '/documents' ||
        location.pathname === '/policies'
      );
    }
    if (itemPath === '/employee/org-view') {
      return (
        location.pathname === '/employee/org-view' ||
        location.pathname === '/org-view' ||
        location.pathname === '/organization'
      );
    }
    if (itemPath === '/compensation') {
      return location.pathname === '/compensation' || location.pathname === '/payslips';
    }
    if (itemPath.startsWith('#')) {
      return (
        (location.pathname === '/dashboard' || location.pathname === '/employee/dashboard') &&
        location.hash === itemPath
      );
    }
    return location.pathname === itemPath;
  };

  const getTargetUrl = (itemPath: string) => {
    if (itemPath.startsWith('#')) {
      const isDash =
        location.pathname === '/dashboard' || location.pathname === '/employee/dashboard';
      return isDash ? itemPath : `/dashboard${itemPath}`;
    }
    return itemPath;
  };

  const handleSignOut = () => {
    try {
      logout();
    } catch {
      navigate('/login');
    }
  };

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
          <Link to="/employee/dashboard" className="flex items-center gap-2 no-underline">
            <span className="font-serif text-lg font-bold tracking-tight text-ink">
              PeoplePay<span className="text-accent">360</span>
            </span>
          </Link>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-line bg-bg text-ink-soft">
            Employee
          </span>
        </div>

        {/* User Quick Info */}
        <div className="p-4 border-b border-line bg-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
              {currentUser.employee?.firstName?.[0] || currentUser.email[0]?.toUpperCase() || 'E'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate">
                {currentUser.employee
                  ? `${currentUser.employee.firstName} ${currentUser.employee.lastName}`
                  : currentUser.email.split('@')[0]}
              </div>
              <div className="text-[11px] text-accent font-medium truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {currentUser.role || 'Employee'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/70">
            Employee Portal
          </div>
          {employeeNavItems.map((item) => {
            const active = isItemActive(item.path);
            const targetUrl = getTargetUrl(item.path);

            return (
              <Link
                key={item.label}
                to={targetUrl}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors no-underline ${
                  active
                    ? 'bg-accent text-accent-ink shadow-xs'
                    : 'text-ink hover:bg-bg-raised hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        active
                          ? 'bg-accent-ink/20 text-accent-ink'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.hasSubmenu && (
                    <svg
                      className={`w-3.5 h-3.5 opacity-60 transition-transform ${
                        active ? 'text-accent-ink' : 'text-ink-soft'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-line bg-bg/40">
          <button
            onClick={handleSignOut}
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
              aria-label="Toggle navigation menu"
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
              <span>Employee Portal</span>
              <span className="text-line">/</span>
              <span className="text-ink font-medium">{title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-ink-soft hidden md:block">{currentUser.email}</div>
            <Link
              to="/profile"
              title="View your profile"
              className="w-7 h-7 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-[11px] hover:ring-2 hover:ring-accent/40 transition-all no-underline"
            >
              {currentUser.employee?.firstName?.[0] || currentUser.email[0]?.toUpperCase() || 'E'}
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-line py-4 px-8 text-center text-xs text-ink-soft mt-auto">
          PeoplePay360 — Integrated HR & Payroll Operations Platform
        </footer>
      </div>
    </div>
  );
};
