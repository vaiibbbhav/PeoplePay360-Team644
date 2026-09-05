import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
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

// --- Layout ---
export type AppLayoutProps = {
  children?: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Error / unauthenticated
  if (isError || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-bg text-ink font-sans">
        <div className="max-w-sm w-full p-6 border border-line rounded-xl bg-bg-raised">
          <p className="text-over-red text-sm font-medium">Session expired or user not found.</p>
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

  // Build nav groups
  const navGroups: NavGroup[] = [
    {
      title: 'Navigation',
      items: [
        ...(user.role !== 'Admin'
          ? [{ label: 'Overview', path: '/dashboard', icon: HomeIcon }]
          : [{ label: 'User Management', path: '/users', icon: UsersIcon }]),
      ],
    },
    {
      title: 'Core HR',
      items: [
        { label: 'Employees', path: '/employees', icon: EmployeesIcon },
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
    {
      title: 'Payroll',
      items: [
        { label: 'Payrun Wizard', path: '/payruns', icon: PayrunIcon },
        { label: 'Analytics', path: '/analytics', icon: AnalyticsIcon },
      ],
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

  return (
    <div className="min-h-screen flex bg-bg text-ink font-sans">
      {/* -------- SIDEBAR -------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-bg-raised/40 backdrop-blur-md flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand — click goes to landing page */}
        <div className="h-16 px-5 border-b border-line flex items-center">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="font-serif text-lg font-bold tracking-tight text-ink">
              PeoplePay<span className="text-accent">360</span>
            </span>
          </Link>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/60">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors no-underline ${
                        isActive
                          ? 'bg-accent text-accent-ink'
                          : 'text-ink hover:bg-bg-raised hover:text-ink'
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: User card + Sign Out */}
        <div className="p-3 border-t border-line space-y-2">
          {/* User card */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate">{displayName}</div>
              <div className="text-[11px] text-ink-soft truncate">{user.email}</div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
          >
            <SignOutIcon className="w-3.5 h-3.5 text-ink-soft" />
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

      {/* -------- MAIN CANVAS -------- */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header — mobile hamburger + theme toggle only */}
        <header className="h-16 border-b border-line px-6 sm:px-8 flex items-center justify-between bg-bg/80 sticky top-0 z-20 backdrop-blur-md">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-line bg-bg text-ink cursor-pointer"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          {/* Empty spacer on desktop so theme toggle stays right-aligned */}
          <div className="hidden lg:block" />

          {/* Theme toggle */}
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
        <main className="flex-1">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
};
