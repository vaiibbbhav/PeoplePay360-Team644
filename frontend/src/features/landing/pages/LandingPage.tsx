import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, LogOut } from 'lucide-react';
import { useCurrentUser, useLogout } from '@/features/auth/queries/useAuth';

export const LandingPage: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const displayName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.employee?.firstName && user.employee?.lastName
        ? `${user.employee.firstName} ${user.employee.lastName}`
        : user.email.split('@')[0]
    : '';

  const initials = user
    ? user.firstName
      ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
      : user.employee?.firstName
        ? user.employee.firstName[0].toUpperCase()
        : user.email[0].toUpperCase()
    : '';

  const dashboardPath =
    user?.role === 'Employee' ? '/dashboard' : user?.role === 'Admin' ? '/users' : '/dashboard';

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* ---------- Sticky Nav ---------- */}
      <header className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md border-b border-line">
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4.5 max-w-6xl mx-auto">
          <a
            href="#top"
            className="font-serif text-lg sm:text-xl font-bold tracking-tight text-ink no-underline"
          >
            PeoplePay<span className="text-accent">360</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm text-ink-soft">
            <a href="#modules" className="no-underline hover:text-ink transition-colors">
              Modules
            </a>
            <a href="#flow" className="no-underline hover:text-ink transition-colors">
              Flow
            </a>
            <a href="#validation" className="no-underline hover:text-ink transition-colors">
              Validation Engine
            </a>
            <a href="#roles" className="no-underline hover:text-ink transition-colors">
              Roles
            </a>
            <Link to="/attendance/terminal" className="no-underline hover:text-ink transition-colors">
              Biometric Punch
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Theme Toggle with Light/Dark icons */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-lg border border-line bg-bg-raised text-ink cursor-pointer hover:bg-bg transition-colors"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full bg-accent text-accent-ink font-semibold flex items-center justify-center text-xs cursor-pointer border border-line shadow-xs hover:opacity-90 transition-opacity focus:outline-none"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  title={displayName}
                >
                  {initials}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-max min-w-[160px] rounded-xl border border-line bg-bg-raised shadow-lg py-1.5 z-50 text-left">
                    <div className="px-3.5 py-2.5 border-b border-line flex flex-col items-start whitespace-nowrap">
                      <div className="text-xs font-semibold text-ink">{displayName}</div>
                      <div className="text-[11px] text-ink-soft">{user.email}</div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={dashboardPath}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors no-underline cursor-pointer text-left whitespace-nowrap"
                      >
                        <LayoutDashboard size={14} className="text-ink-soft" />
                        <span>Dashboard</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left whitespace-nowrap"
                      >
                        <LogOut size={14} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline cursor-pointer"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="pt-10 sm:pt-20 pb-10 sm:pb-16 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-14 items-end">
            <div>
              <div className="text-xs sm:text-sm text-ink-soft mb-3 sm:mb-5 tracking-wide">
                Past fragmented HR records, for real operational enterprise teams.
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-semibold text-ink leading-[1.15] sm:leading-[1.12] max-w-[16ch] m-0">
                An HR & Payroll engine that <span className="text-accent">unifies, computes,</span>{' '}
                and reconciles itself.
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-ink-soft max-w-[46ch] leading-relaxed">
                Employee master records, period-specific contracts, attendance exceptions, and
                sequential salary rule engines unified on a single ledger.
              </p>
              <div className="mt-6 sm:mt-8 flex gap-3 items-center flex-wrap">
                <a
                  href="#flow"
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline cursor-pointer"
                >
                  See the full flow
                </a>
                <Link
                  to={user ? dashboardPath : '/login'}
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors no-underline cursor-pointer"
                >
                  {user ? 'Go to Dashboard' : 'Access Console'}
                </Link>
              </div>
            </div>

            {/* Hero Flow Mini Panel */}
            <div className="border border-line rounded-2xl p-5 sm:p-7 bg-bg-raised">
              <div className="text-xs text-ink-soft mb-4.5 font-medium">
                Employee to payslip, one connected flow
              </div>
              <div className="flex flex-col">
                {[
                  {
                    title: 'Employee Profile & Schedule Assigned',
                    sub: 'Master identity, department, working hours',
                    filled: true,
                  },
                  {
                    title: 'Active Period Contract Bound',
                    sub: 'Period-matched wage & salary structure',
                    filled: true,
                  },
                  {
                    title: 'Attendance & Leave Exceptions Logged',
                    sub: 'Punches, manual edits, allocation deductions',
                    filled: true,
                  },
                  {
                    title: 'Salary Rules Evaluated in Sequence',
                    sub: 'Basic → Allowances → Gross → Deductions → Net',
                    filled: true,
                  },
                  {
                    title: 'Payrun Validated, Paid & Dispatched',
                    sub: 'PDF payslips generated & emailed',
                    filled: false,
                  },
                ].map((step, idx, arr) => (
                  <div key={step.title} className="flex items-start gap-3.5 py-2.5 relative">
                    {idx !== arr.length - 1 && (
                      <div className="absolute left-[5px] top-7 w-px h-6 bg-line" />
                    )}
                    <div
                      className={`w-2.5 h-2.5 rounded-full border border-accent mt-1 shrink-0 ${
                        step.filled ? 'bg-accent' : 'bg-transparent'
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-ink block">{step.title}</span>
                      <small className="text-ink-soft text-xs block mt-0.5">{step.sub}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- PROBLEM SECTION ---------- */}
        <section className="py-12 sm:py-20 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="max-w-[56ch] mb-8 sm:mb-11">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink m-0">
                Most basic HR tools stop at isolated CRUD tables.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
              <div>
                <div className="text-xs font-semibold text-accent mb-2">
                  The basics fall short
                </div>
                <p className="text-ink-soft text-sm sm:text-base m-0 leading-relaxed">
                  An employee accumulates multiple historical contracts, but payroll accidentally
                  pulls an outdated wage. Working hours mismatch schedule templates, leave requests
                  get approved without allocation balance deductions, and manual attendance edits
                  slip through unnoticed.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-accent mb-2">
                  A unified operational engine instead
                </div>
                <p className="text-ink-soft text-sm sm:text-base m-0 leading-relaxed">
                  Every payroll batch enforces period-specific contract matching. Worked hours
                  compare directly against working schedule lines, approved leaves automatically
                  decrement allocations, and salary rules execute sequentially with full
                  auditability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- FLOW STRIP ---------- */}
        <section id="flow" className="py-12 sm:py-20 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="max-w-[56ch] mb-8 sm:mb-11">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink m-0">
                The complete operational lifecycle
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-line rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-line bg-bg">
              {[
                {
                  fnum: '01. Master Hub',
                  title: 'Employee & Schedule',
                  desc: 'Central profile, department, manager, and weekly shift definition.',
                },
                {
                  fnum: '02. Contracts',
                  title: 'Period Binding',
                  desc: 'Active contract validity matching the target payroll cycle dates.',
                },
                {
                  fnum: '03. Operations',
                  title: 'Time & Leave',
                  desc: 'Daily attendance punches, exception reviews, and leave balance deductions.',
                },
                {
                  fnum: '04. Rule Engine',
                  title: 'Formula Sequence',
                  desc: 'Basic, HRA, PF deductions, and gross-to-net salary computation.',
                },
                {
                  fnum: '05. Settlement',
                  title: 'Payrun & Payslips',
                  desc: 'Batch review, warning checks, PDF generation, and bulk email distribution.',
                },
              ].map((cell) => (
                <div key={cell.fnum} className="p-5 sm:p-6 bg-bg">
                  <div className="text-accent text-xs font-semibold mb-2">{cell.fnum}</div>
                  <h4 className="text-base font-semibold text-ink mb-1.5 m-0 font-sans">
                    {cell.title}
                  </h4>
                  <p className="text-xs text-ink-soft m-0 leading-relaxed">{cell.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- MODULES GRID ---------- */}
        <section id="modules" className="py-12 sm:py-20 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="max-w-[56ch] mb-8 sm:mb-11">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink m-0">
                Two sides, one unified data model
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-line border border-line rounded-2xl overflow-hidden">
              <div className="bg-bg p-5 sm:p-9">
                <span className="text-xs text-accent font-semibold mb-4 block">
                  Configuration & Policies
                </span>
                <h3 className="font-sans text-xl sm:text-2xl font-semibold mb-5 text-ink m-0">
                  HR Backend Management
                </h3>
                <ul className="list-none m-0 p-0 divide-y divide-line">
                  {[
                    {
                      label: 'Employee Master',
                      desc: 'Kanban, List, and Form views with departmental hierarchy.',
                    },
                    {
                      label: 'Contract History',
                      desc: 'Wage tiers, wage types, and historical agreement archives.',
                    },
                    {
                      label: 'Working Schedules',
                      desc: 'Weekly shift blocks, break rules, and auto-computed weekly hours.',
                    },
                    {
                      label: 'Time Off Types',
                      desc: 'Paid/unpaid policies, day/hour units, and approval workflows.',
                    },
                    {
                      label: 'Salary Structures',
                      desc: 'Containers grouping ordered salary rules for execution.',
                    },
                    {
                      label: 'Salary Rule Engine',
                      desc: 'Fixed, percentage-of-code, and dynamic formula calculations.',
                    },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="py-3 text-sm text-ink-soft flex flex-col sm:flex-row gap-2.5"
                    >
                      <b className="text-ink font-medium min-w-[130px]">{item.label}</b>
                      <span>{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg p-5 sm:p-9">
                <span className="text-xs text-accent font-semibold mb-4 block">
                  Operational Experience
                </span>
                <h3 className="font-sans text-xl sm:text-2xl font-semibold mb-5 text-ink m-0">
                  HR & Payroll Operations
                </h3>
                <ul className="list-none m-0 p-0 divide-y divide-line">
                  {[
                    {
                      label: 'Employee Hub',
                      desc: 'Smart navigation buttons linking to Attendance, Contracts, and Leaves.',
                    },
                    {
                      label: 'Attendance Review',
                      desc: 'Real-time punch records, worked hours, and manual correction audit logs.',
                    },
                    {
                      label: 'Leave Requests',
                      desc: 'Employee requests with approval/refusal and balance decrementing.',
                    },
                    {
                      label: 'Payrun Wizard',
                      desc: 'Two-step creation: scope & period definition, then eligible staff selection.',
                    },
                    {
                      label: 'Payslip Breakdown',
                      desc: 'Itemized rule calculations (Basic, Allowances, Gross, Deductions, Net).',
                    },
                    {
                      label: 'Payroll Dashboard',
                      desc: 'Aggregated analytics: live KPIs, department salary charts, and warnings.',
                    },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="py-3 text-sm text-ink-soft flex flex-col sm:flex-row gap-2.5"
                    >
                      <b className="text-ink font-medium min-w-[130px]">{item.label}</b>
                      <span>{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- VALIDATION & ANOMALY DIAGNOSTICS ---------- */}
        <section id="validation" className="py-12 sm:py-20 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="max-w-[56ch] mb-8 sm:mb-11">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink m-0">
                Pre-computation payroll validation
              </h2>
              <p className="mt-2 sm:mt-3 text-ink-soft text-sm sm:text-base leading-relaxed">
                Checked line by line prior to final payrun validation, preventing erroneous payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div>
                <p className="text-ink-soft text-sm sm:text-base leading-relaxed m-0 mb-4">
                  A payrun should never execute blindly. Our system verifies employee master
                  readiness, active period contracts, attendance integrity, and duplicate slip
                  risks.
                </p>
                <div className="border-l-2 border-accent pl-4 font-serif italic text-base sm:text-lg text-ink my-5 sm:my-6">
                  "One missing bank routing number or unconfirmed attendance edit flags the payrun
                  before funds are committed."
                </div>
                <p className="text-ink-soft text-xs sm:text-sm leading-relaxed m-0">
                  Officers can inspect anomalies with single-click filtering, update records, and
                  recompute the batch instantly.
                </p>
              </div>

              {/* Validation Card */}
              <div className="border border-line rounded-2xl p-5 sm:p-7 bg-bg-raised">
                <div className="text-xs text-ink-soft mb-4 sm:mb-5 font-medium">
                  Live Payrun Batch Diagnostics · Period: Oct 01 – Oct 31
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                    <span className="text-ink">Active Contract Verification</span>
                    <span className="text-ink-soft text-xs">32 / 32 Valid</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-line overflow-hidden">
                    <div className="h-full w-full bg-accent" />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                    <span className="text-ink">Bank Routing Information</span>
                    <span className="text-over-red text-xs font-medium">1 Missing</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-line overflow-hidden">
                    <div className="h-full w-[96%] bg-over-red" />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                    <span className="text-ink">Attendance Punch Coverage</span>
                    <span className="text-ink-soft text-xs">100% Reconciled</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-line overflow-hidden">
                    <div className="h-full w-full bg-accent" />
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-line text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Batch flagged for audit:{' '}
                  <span className="text-over-red font-medium">
                    Employee #104 (Marcus Vance) requires bank account details before dispatch.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- ROLES SECTION ---------- */}
        <section id="roles" className="py-12 sm:py-20 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="max-w-[56ch] mb-8 sm:mb-11">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink m-0">
                Five roles, one unified ledger
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
              {[
                {
                  role: 'Employee',
                  items: [
                    'Self-service portal',
                    'Check in / check out',
                    'Submit leave requests',
                    'Download PDF payslips',
                  ],
                },
                {
                  role: 'HR Manager',
                  items: [
                    'Full CRUD on Employees',
                    'Contract management',
                    'Approve/refuse time off',
                    'Attendance manual edits',
                  ],
                },
                {
                  role: 'HR Payroll User',
                  items: [
                    'All HR Manager rights',
                    'Create & execute payruns',
                    'Generate payslips',
                    'Read-only salary rules',
                  ],
                },
                {
                  role: 'HR Payroll Mgr',
                  items: [
                    'Full platform CRUD',
                    'Salary rule formulas',
                    'Bulk email distribution',
                    'Full payroll history',
                  ],
                },
                {
                  role: 'Admin',
                  items: [
                    'System administration',
                    'User management',
                    'Role assignments',
                    'Database audits',
                  ],
                },
              ].map((card) => (
                <div key={card.role} className="border border-line rounded-xl p-4 sm:p-5 bg-bg">
                  <h4 className="font-serif text-base font-semibold pb-2.5 mb-3 border-b border-line text-ink m-0">
                    {card.role}
                  </h4>
                  <ul className="list-none m-0 p-0 text-ink-soft text-xs space-y-2">
                    {card.items.map((it) => (
                      <li key={it} className="relative pl-3.5 flex items-center">
                        <span className="absolute left-0 w-1.5 h-1.5 rounded-full bg-accent" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA / DELIVERABLES ---------- */}
        <section className="py-12 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-center">
            <div>
              <h2 className="font-sans text-2xl sm:text-3xl font-semibold text-ink max-w-[16ch] m-0">
                Operational integrity ready for demonstration
              </h2>
              <p className="text-ink-soft mt-3 sm:mt-4 max-w-[42ch] text-sm sm:text-base leading-relaxed">
                Real business logic — contract selection, working schedule mathematics, and ordered
                salary computation — runs in application code.
              </p>
              <div className="mt-5 sm:mt-7 flex gap-3.5 flex-wrap">
                <Link
                  to={user ? dashboardPath : '/login'}
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline cursor-pointer"
                >
                  {user ? 'Go to Dashboard' : 'Access Platform Console'}
                </Link>
              </div>
            </div>

            <div className="border border-line rounded-2xl px-5 sm:px-7 py-2 bg-bg-raised divide-y divide-line">
              {[
                {
                  title: 'Working Full-Stack Platform',
                  desc: 'React 19 + Express + Neon Postgres',
                },
                {
                  title: 'Live Demonstration Flow',
                  desc: 'Employee to Payslip & Leave Allocation',
                },
                { title: 'Interactive Wireframe Prototype', desc: 'Excalidraw mockup verified' },
                { title: 'Modular Architecture', desc: '4-layer backend & feature-driven UI' },
              ].map((row) => (
                <div
                  key={row.title}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-5 py-3 sm:py-4 text-xs sm:text-sm"
                >
                  <span className="text-ink font-medium">{row.title}</span>
                  <span className="text-ink-soft sm:text-right text-xs">{row.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer className="border-t border-line py-6 sm:py-9 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-ink-soft gap-2 sm:gap-3 text-center sm:text-left">
            <span>PeoplePay360 — Integrated HR & Payroll Operations Platform</span>
            <span className="hidden sm:inline">Master Data → Contracts → Time Off → Payroll → Reporting</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
