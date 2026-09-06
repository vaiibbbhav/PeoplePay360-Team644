import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useCurrentUser, useLogout } from '@/features/auth/queries/useAuth';

type NavItem = {
  label: string;
  path: string;
  icon: (props: { className?: string }) => React.JSX.Element;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

// --- Icons ---
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const EmployeesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ContractIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ScheduleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AttendanceIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

const TimeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PayrunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const AnalyticsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const SignOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const OrgIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM9 20a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM7 10v4a1 1 0 001 1h8a1 1 0 001-1v-4M12 15v3"
    />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const CompensationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);


// --- Layout ---
export type AppLayoutProps = {
  children?: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  // Sync theme to document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-ink-soft">Loading session...</span>
        </div>
      </div>
    );
  }

  // ProtectedRoute owns redirects. This only prevents a stale query result from rendering shell UI.
  if (isError || !user) {
    return null;
  }

  const currentEmployeeId = user.employee?.id || user.employeeId;
  const myProfilePath = currentEmployeeId ? `/employees/${currentEmployeeId}` : '/employees';

  // Employee Navigation Items (Exact 12 tabs from specification)
  type EmployeeNavItem = {
    label: string;
    path: string;
    icon: (props: { className?: string }) => React.JSX.Element;
    hasSubmenu?: boolean;
    badge?: string;
  };

  const employeeNavItems: EmployeeNavItem[] = [
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
      label: 'My Profile',
      path: myProfilePath,
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
      label: 'Attendance',
      path: '/attendance/my',
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
      label: 'Time Off',
      path: '/time-off',
      icon: TimeOffIcon,
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
      label: 'Team Directory',
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
      label: 'Org View',
      path: '/organization',
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
    {
      label: 'Documents',
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
  ];

  const isEmployeeActive = (itemPath: string) => {
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' && (!location.hash || location.hash === '');
    }
    if (itemPath === '/attendance/my') {
      return location.pathname === '/attendance/my';
    }
    if (itemPath === myProfilePath) {
      return location.pathname === myProfilePath;
    }
    if (itemPath === '/employees') {
      return location.pathname === '/employees';
    }
    if (itemPath === '/compensation') {
      return location.pathname === '/compensation' || location.pathname.startsWith('/payslip');
    }
    if (itemPath === '/time-off') {
      return location.pathname.startsWith('/time-off');
    }
    if (itemPath === '/documents') {
      return location.pathname.startsWith('/documents');
    }
    if (itemPath === '/organization') {
      return location.pathname === '/organization';
    }
    return location.pathname === itemPath;
  };

  // Build nav groups tailored to role
  const canAccessPayroll =
    user.role === 'Admin' || user.role === 'HR Payroll Manager' || user.role === 'HR Payroll User';

  const navGroups: NavGroup[] = [
    {
      title: 'Navigation',
      items: [
        { label: 'Overview', path: '/dashboard', icon: HomeIcon },
        ...(user.role === 'Admin'
          ? [{ label: 'User Management', path: '/users', icon: UsersIcon }]
          : []),
      ],
    },
    {
      title: 'Core HR',
      items: [
        { label: 'Employees', path: '/employees', icon: EmployeesIcon },
        { label: 'Org View', path: '/organization', icon: OrgIcon },
        { label: 'Contracts', path: '/contracts', icon: ContractIcon },
        { label: 'Work Schedules', path: '/schedules', icon: ScheduleIcon },
      ],
    },
    {
      title: 'Time & Attendance',
      items: [
        { label: 'Attendance Records', path: '/attendance', icon: AttendanceIcon },
        { label: 'Time Off Requests', path: '/time-off', icon: TimeOffIcon },
      ],
    },
    ...(canAccessPayroll
      ? [
          {
            title: 'Payroll & Compensation',
            items: [
              { label: 'Payruns', path: '/payruns', icon: PayrunIcon },
              { label: 'Payslips', path: '/payslips', icon: AnalyticsIcon },
              { label: 'Compensation', path: '/compensation', icon: CompensationIcon },
              { label: 'Salary Structures', path: '/salary-structures', icon: ContractIcon },
            ],
          },
        ]
      : []),
    {
      title: 'Company & Compliance',
      items: [{ label: 'Policies & Documents', path: '/documents', icon: DocumentIcon }],
    },
  ];

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.employee?.firstName && user.employee?.lastName
        ? `${user.employee.firstName} ${user.employee.lastName}`
        : user.email.split('@')[0];
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : user.employee?.firstName
      ? user.employee.firstName[0].toUpperCase()
      : user.email[0].toUpperCase();

  const isEmployeeRole = user.role === 'Employee';

  return (
    <div className="min-h-screen flex bg-bg text-ink font-sans w-full min-w-0 overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-accent-ink"
      >
        Skip to main content
      </a>
      {/* -------- SIDEBAR -------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-line bg-bg-raised/95 backdrop-blur-md flex flex-col transition-transform duration-200 ease-in-out w-64 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand — click goes to landing page */}
        <div
          className={`h-16 border-b border-line flex items-center justify-between px-4 ${
            sidebarCollapsed ? 'lg:justify-center lg:px-1' : ''
          }`}
        >
          <Link
            to="/"
            title="PeoplePay360"
            className="flex items-center gap-2 no-underline overflow-hidden"
          >
            <span className="font-serif text-lg font-bold tracking-tight text-ink whitespace-nowrap">
              {sidebarCollapsed ? (
                <>
                  <span className="lg:hidden">
                    PeoplePay<span className="text-accent">360</span>
                  </span>
                  <span className="hidden lg:inline text-[15px]">
                    P<span className="text-accent">360</span>
                  </span>
                </>
              ) : (
                <>
                  PeoplePay<span className="text-accent">360</span>
                </>
              )}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {!sidebarCollapsed && isEmployeeRole && (
              <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border border-line bg-bg text-ink-soft">
                Employee
              </span>
            )}
            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav
          id="primary-navigation"
          aria-label="Primary navigation"
          className="flex-1 px-2.5 py-4 overflow-y-auto space-y-1"
        >
          {isEmployeeRole ? (
            <>
              {!sidebarCollapsed && (
                <div
                  className={` ${sidebarCollapsed ? 'invisible' : 'block'} px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/70`}
                >
                  Workspace
                </div>
              )}
              {employeeNavItems.map((item) => {
                const active = isEmployeeActive(item.path);
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center ${
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2 rounded-lg text-xs font-medium no-underline ${
                      active
                        ? 'bg-accent text-accent-ink shadow-xs'
                        : 'text-ink hover:bg-bg-raised hover:text-ink'
                    }`}
                  >
                    <div
                      className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'} truncate`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
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
                            className={`w-3.5 h-3.5 opacity-60 ${
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
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            // ============================================
            // HR / ADMIN SIDEBAR: GROUPED PORTALS
            // ============================================
            navGroups.map((group) => (
              <div key={group.title} className="mb-5 last:mb-0">
                {!sidebarCollapsed && (
                  <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/60">
                    {group.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        title={sidebarCollapsed ? item.label : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center ${
                          sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
                        } py-2 rounded-lg text-xs font-medium no-underline ${
                          isActive
                            ? 'bg-accent text-accent-ink'
                            : 'text-ink hover:bg-bg-raised hover:text-ink'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* Bottom: User card + Sign Out */}
        <div className="p-2.5 border-t border-line space-y-2">
          {/* User card */}
          <Link
            to={myProfilePath}
            title={sidebarCollapsed ? `${displayName} (${user.email})` : 'View Profile'}
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center p-1' : 'gap-2.5 px-2 py-2'
            } rounded-xl hover:bg-bg-raised transition-colors cursor-pointer text-ink no-underline group`}
          >
            <div
              className="w-8 h-8 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-xs shrink-0 group-hover:bg-accent group-hover:text-accent-ink transition-colors"
            >
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-ink truncate group-hover:text-accent transition-colors">{displayName}</div>
                <div className="text-[11px] text-ink-soft truncate">{user.email}</div>
              </div>
            )}
          </Link>

          {/* Sign Out */}
          <button
            onClick={logout}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center justify-center ${
              sidebarCollapsed ? 'p-2' : 'gap-2 px-3 py-2'
            } rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer`}
          >
            <SignOutIcon className="w-3.5 h-3.5 text-ink-soft" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
          aria-label="Close navigation menu"
        />
      )}

      {/* -------- MAIN CANVAS -------- */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 border-b border-line px-4 sm:px-6 flex items-center justify-between bg-bg/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="primary-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden p-2 rounded-lg border border-line bg-bg text-ink cursor-pointer"
            >
              <MenuIcon className="w-4 h-4" />
            </button>

            <span className="lg:hidden font-serif font-bold text-base tracking-tight text-ink">
              PeoplePay<span className="text-accent">360</span>
            </span>

            {/* Desktop abrupt sidebar fold/expand toggle */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink text-xs font-medium cursor-pointer"
            >
              <MenuIcon className="w-4 h-4 text-ink-soft" />
              <span className="text-[11px] text-ink-soft font-mono">
                {sidebarCollapsed ? 'Expand' : 'Collapse'}
              </span>
            </button>
          </div>

          {/* Right controls: Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-bg-raised text-ink cursor-pointer hover:bg-bg transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Page Content */}
        <main id="main-content" tabIndex={-1} aria-label={title} className="flex-1 min-w-0 w-full">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};
