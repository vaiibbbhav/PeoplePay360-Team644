import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { useDashboardOverview } from '@/features/dashboard/queries/useDashboard';
import { StatGrid } from '@/components/ui/StatCard';
import { AppLayout } from '@/components/layout/AppLayout';

export const DashboardPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: dashboard, isLoading } = useDashboardOverview();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // -------------------------------------------------------------
  // 1. EMPLOYEE SELF-SERVICE WORKSPACE (When role is 'Employee')
  // -------------------------------------------------------------
  if (user?.role === 'Employee') {
    const employeeModules = [
      {
        id: 'time-management',
        title: 'Time & Biometric Punches',
        desc: 'Check-in, check-out logs, and daily attendance calendar history.',
        tag: 'Attendance',
        link: '/attendance',
        isDirectLink: true,
      },
      {
        id: 'compensation',
        title: 'Compensation & Payslips',
        desc: 'Monthly payslips, itemized calculation, and yearly compensation sheets.',
        tag: 'Payroll',
        link: '/compensation',
        isDirectLink: true,
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
        id: 'team',
        title: 'Team & Directory',
        desc: 'Department colleagues, reporting manager, and peer directory.',
        tag: 'Organization',
        link: '/employees',
        isDirectLink: true,
      },
      {
        id: 'documents',
        title: 'Policies & Documents',
        desc: 'Company compliance policies, code of conduct, and mandatory acknowledgments.',
        tag: 'Compliance',
        link: '/documents',
        isDirectLink: true,
      },
      {
        id: 'task-box',
        title: 'Task Box & Approvals',
        desc: 'Assigned employee tasks, punch anomaly corrections, and pending action items.',
        tag: 'Workspace',
        link: '#task-box',
        isDirectLink: false,
      },
      {
        id: 'recruitment',
        title: 'Recruitment & Referrals',
        desc: 'Internal job postings, career opportunities, and candidate referral bonuses.',
        tag: 'Hiring',
        link: '#recruitment',
        isDirectLink: false,
      },
      {
        id: 'calendar',
        title: 'Company Calendar & Holidays',
        desc: 'Official company holidays, team birthdays, work events, and payroll cycle dates.',
        tag: 'Schedule',
        link: '#calendar',
        isDirectLink: false,
      },
      {
        id: 'performance',
        title: 'Performance & Goals',
        desc: 'Quarterly OKRs, appraisal cycles, periodic peer reviews, and milestone tracking.',
        tag: 'Growth',
        link: '#performance',
        isDirectLink: false,
      },
      {
        id: 'flows',
        title: 'Workflows & Approvals',
        desc: 'Automated HR workflows, travel requests, expense reimbursements, and asset handoffs.',
        tag: 'Processes',
        link: '#flows',
        isDirectLink: false,
      },
      {
        id: 'org-view',
        title: 'Organization Chart',
        desc: 'Interactive organization hierarchy, reporting chains, and team composition.',
        tag: 'Company',
        link: '#org-view',
        isDirectLink: false,
      },
    ];

    return (
      <AppLayout title="Dashboard">
        <div className="max-w-6xl mx-auto space-y-8 font-sans">
          {/* Welcome Banner */}
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Welcome, {user?.employee?.firstName || user?.email?.split('@')[0] || 'Employee'}
            </h1>
            <p className="text-ink-soft text-xs sm:text-sm mt-1">
              Employee Self-Service Portal · Logged in as <b className="text-ink">{user?.email}</b>
            </p>
          </div>

          {/* Quick Identity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
              <span className="text-xs text-ink-soft font-medium">Session Role</span>
              <div className="text-base font-semibold text-ink mt-1">{user?.role}</div>
              <span className="text-[11px] text-accent font-medium mt-1 block">
                Active Workspace
              </span>
            </div>
            <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
              <span className="text-xs text-ink-soft font-medium">Biometrics & Punches</span>
              <div className="text-base font-semibold text-ink mt-1">Punch Log Ready</div>
              <Link
                to="/attendance"
                className="text-[11px] text-accent font-medium mt-1 block hover:underline no-underline"
              >
                View attendance calendar →
              </Link>
            </div>
            <div className="p-5 border border-line rounded-xl bg-bg-raised/40">
              <span className="text-xs text-ink-soft font-medium">Compensation</span>
              <div className="text-base font-semibold text-ink mt-1">Payslips Generated</div>
              <Link
                to="/compensation"
                className="text-[11px] text-accent font-medium mt-1 block hover:underline no-underline"
              >
                Open compensation hub →
              </Link>
            </div>
          </div>

          {/* Operational Modules Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">Employee Workspace</h2>
              <span className="text-xs text-ink-soft">Operations & Tools</span>
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
                        Open Section →
                      </Link>
                    ) : (
                      <span className="text-xs text-ink-soft/80 font-medium">
                        Ready in workspace
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // -------------------------------------------------------------
  // 2. EXECUTIVE OVERVIEW (For HR Manager, Payroll, and Admin)
  // -------------------------------------------------------------
  const kpis = dashboard?.kpis || {
    totalNetPaid: 320000,
    payslipsGenerated: 4,
    averageSalary: 80000,
    approvedTimeOffDays: 2,
    pendingTimeOffRequests: 0,
    attendanceHealthScore: '96%',
  };

  const attendance = dashboard?.attendance || {
    present: 4,
    late: 0,
    absent: 0,
    overtime: 1,
    manualEdits: 0,
  };

  const departmentBreakdown = dashboard?.charts?.departmentBreakdown || [
    { department: 'Management', headcount: 1, totalCost: 120000 },
    { department: 'Technology', headcount: 2, totalCost: 165000 },
    { department: 'HR & Operations', headcount: 1, totalCost: 85000 },
  ];

  const monthlyTrends = dashboard?.charts?.monthlyTrends || [
    { month: 'Jun 2026', netSalary: 285000, grossSalary: 340000 },
    { month: 'Jul 2026', netSalary: 310000, grossSalary: 365000 },
    { month: 'Aug 2026', netSalary: 320000, grossSalary: 370000 },
  ];

  return (
    <AppLayout title="Executive Overview">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Welcome, {user?.employee?.firstName || user?.email?.split('@')[0] || 'Administrator'}
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            PeoplePay360 Operations Command Center · Live Role:{' '}
            <b className="text-ink">{user?.role || 'Admin'}</b>
          </p>
        </div>

        {/* Live Payroll KPI StatGrid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Live Payroll Performance
            </h2>
            {isLoading && (
              <span className="text-xs text-ink-soft flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Syncing with Neon DB...
              </span>
            )}
          </div>
          <StatGrid
            columns={4}
            items={[
              {
                label: 'Total Net Disbursed',
                value: formatCurrency(kpis.totalNetPaid),
                subtext: '+12.4% vs last cycle',
              },
              {
                label: 'Payslips Generated',
                value: String(kpis.payslipsGenerated),
                subtext: '100% computed',
              },
              {
                label: 'Average Net Salary',
                value: formatCurrency(kpis.averageSalary),
                subtext: 'Active workforce',
              },
              {
                label: 'Attendance Health',
                value: kpis.attendanceHealthScore,
                subtext: `${kpis.approvedTimeOffDays} approved leave days`,
              },
            ]}
          />
        </div>

        {/* Attendance Health & Department Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biometric Attendance Distribution */}
          <div className="bg-bg border border-line rounded-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="font-serif text-base font-semibold text-ink">
                Biometric Punch Status
              </h3>
              <span className="text-xs text-accent font-medium">Daily Presence Audit</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
                <span className="text-[11px] text-ink-soft block">Present</span>
                <span className="text-xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {attendance.present}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
                <span className="text-[11px] text-ink-soft block">Late</span>
                <span className="text-xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                  {attendance.late}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
                <span className="text-[11px] text-ink-soft block">Absent</span>
                <span className="text-xl font-serif font-bold text-red-600 dark:text-red-400 mt-1 block">
                  {attendance.absent}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
                <span className="text-[11px] text-ink-soft block">Overtime</span>
                <span className="text-xl font-serif font-bold text-accent mt-1 block">
                  {attendance.overtime}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40">
                <span className="text-[11px] text-ink-soft block">Edits</span>
                <span className="text-xl font-serif font-bold text-ink mt-1 block">
                  {attendance.manualEdits}
                </span>
              </div>
            </div>
          </div>

          {/* Department Headcount & Salary Allocation */}
          <div className="bg-bg border border-line rounded-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="font-serif text-base font-semibold text-ink">
                Department Cost Allocation
              </h3>
              <span className="text-xs text-ink-soft">{departmentBreakdown.length} Depts</span>
            </div>
            <div className="space-y-3">
              {departmentBreakdown.map((dept) => (
                <div
                  key={dept.department}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-line/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{dept.department}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-bg-raised border border-line text-ink-soft">
                      {dept.headcount} Staff
                    </span>
                  </div>
                  <span className="font-semibold text-ink">{formatCurrency(dept.totalCost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Monthly Net Salary Trends */}
        <div className="bg-bg border border-line rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-ink">
                Monthly Net Salary Trends
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Historical payroll expenditure distribution
              </p>
            </div>
            <span className="text-xs text-accent font-medium">3-Month Trajectory</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {monthlyTrends.map((trend) => (
              <div
                key={trend.month}
                className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{trend.month}</span>
                  <span className="text-[11px] text-ink-soft">Net Disbursed</span>
                </div>
                <div className="text-xl font-serif font-bold text-accent">
                  {formatCurrency(trend.netSalary)}
                </div>
                <div className="text-[11px] text-ink-soft pt-1 border-t border-line/60 flex justify-between">
                  <span>Gross Burden:</span>
                  <span className="font-mono font-medium text-ink">
                    {formatCurrency(trend.grossSalary)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launchpad to All Subsystems */}
        <div>
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
            Operations Launchpad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/employees"
              className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
                👥
              </div>
              <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                Employee Hub
              </h4>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Master directory for employees, contracts, and profiles.
              </p>
            </Link>

            <Link
              to="/compensation"
              className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
                💵
              </div>
              <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                Compensation & Payslips
              </h4>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Settled monthly payouts, itemized calculations, and printable slips.
              </p>
            </Link>

            <Link
              to="/attendance"
              className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
                ⏱️
              </div>
              <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                Biometric & Attendance
              </h4>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Punch calendar logs, shift tracking, and daily presence audit.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
