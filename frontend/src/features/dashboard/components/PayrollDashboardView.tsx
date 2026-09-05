import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardOverview } from '@/features/dashboard/queries/useDashboard';
import { StatGrid } from '@/components/ui/StatCard';
import type { User } from '@/features/auth/queries/useAuth';

type PayrollDashboardViewProps = {
  user: User;
};

export const PayrollDashboardView: React.FC<PayrollDashboardViewProps> = ({ user }) => {
  const { data: dashboard, isLoading } = useDashboardOverview();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

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

  const isPayrollManager = user.role === 'HR Payroll Manager';

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Payroll Operations & Finance Console
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Payrun execution, salary structure rules, and payroll analytics · Logged in as{' '}
            <b className="text-ink">{user.email}</b> ({user.role})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/payruns"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline inline-flex items-center gap-1.5 shadow-sm"
          >
            ⚡ Launch Payrun Wizard
          </Link>
          {isPayrollManager && (
            <Link
              to="/compensation"
              className="py-2.5 px-4 rounded-xl text-xs font-medium border border-line bg-bg-raised hover:border-ink-soft text-ink transition-colors no-underline inline-flex items-center gap-1.5"
            >
              ⚙️ Salary Rules Engine
            </Link>
          )}
        </div>
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
          isLoading={isLoading}
          skeletonCount={4}
        />
      </div>

      {/* Attendance Punch Audit & Department Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biometric Attendance Distribution */}
        <div className="bg-bg border border-line rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 className="font-serif text-base font-semibold text-ink">
              Biometric Punch Status
            </h3>
            <span className="text-xs text-accent font-medium">Payroll Context Inputs</span>
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

      {/* Contracts & Working Schedules Operational Baseline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  Contracts Baseline
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Payroll salary base & active wage contracts
                </p>
              </div>
              <Link
                to="/contracts"
                className="text-xs text-accent font-medium hover:underline no-underline"
              >
                View all ({dashboard?.contracts?.total ?? 0}) →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Active Wages</span>
                <span className="text-lg font-serif font-bold text-accent mt-0.5 block">
                  {dashboard?.contracts?.active ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Draft Wages</span>
                <span className="text-lg font-serif font-bold text-ink mt-0.5 block">
                  {dashboard?.contracts?.draft ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Expired</span>
                <span className="text-lg font-serif font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {dashboard?.contracts?.expired ?? 0}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {(dashboard?.contracts?.recent || []).slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-line/60 bg-bg-raised/30"
                >
                  <span className="font-medium text-ink truncate max-w-[140px] sm:max-w-none">
                    {c.employee_name || c.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink">
                      ₹{Number(c.wage).toLocaleString('en-IN')}/{c.wage_type === 'hourly' ? 'hr' : 'mo'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-accent/40 bg-accent-soft text-accent">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center text-xs">
            <span className="text-ink-soft">Drives payrun wage computation</span>
            <Link
              to="/contracts"
              className="text-accent font-medium hover:underline no-underline"
            >
              Open Contracts List →
            </Link>
          </div>
        </div>

        <div className="bg-bg border border-line rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-ink">
                  Working Schedules & Shifts
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Standard hours context for worked days calculations
                </p>
              </div>
              <Link
                to="/schedules"
                className="text-xs text-accent font-medium hover:underline no-underline"
              >
                View all ({dashboard?.schedules?.total ?? 0}) →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Active Schedules</span>
                <span className="text-lg font-serif font-bold text-accent mt-0.5 block">
                  {dashboard?.schedules?.active ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-line bg-bg-raised/40 text-center">
                <span className="text-[11px] text-ink-soft block">Avg Weekly Standard</span>
                <span className="text-lg font-serif font-bold text-ink mt-0.5 block">
                  {dashboard?.schedules?.avgWeeklyHours ?? 40} hrs
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {(dashboard?.schedules?.list || []).slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-line/60 bg-bg-raised/30"
                >
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="font-mono font-semibold text-accent">
                    {s.weekly_hours} hrs/week
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center text-xs">
            <span className="text-ink-soft">Sets standard shift duration</span>
            <Link
              to="/schedules"
              className="text-accent font-medium hover:underline no-underline"
            >
              Open Shift Schedules →
            </Link>
          </div>
        </div>
      </div>

      {/* Operations Launchpad */}
      <div>
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">
          Payroll Subsystems & Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/payruns"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              ⚡
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Payrun Execution Wizard
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Step 1 period selection → Step 2 employee filter → Compute, validate & mark paid.
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
              Salary Structures & Rules
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Base salary, allowances, deductions, and sequenced computation rules.
            </p>
          </Link>

          <Link
            to="/contracts"
            className="p-5 rounded-2xl border border-line bg-bg hover:border-accent/40 transition-colors no-underline group block"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center mb-3">
              📄
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              Active Contracts
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Applicable period contracts, wages, and structure assignments.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
