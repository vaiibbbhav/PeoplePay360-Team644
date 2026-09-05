import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatGrid } from '@/components/ui/StatCard';
import {
  usePayrunsList,
  usePayrunById,
  useSalaryStructures,
  useEligibleEmployees,
  useCreatePayrun,
  useValidatePayrun,
  useMarkPayrunPaid,
  type PayrunItem,
  type CreatePayrunPayload,
} from '../queries/usePayruns';
import { useCurrentUser } from '@/features/auth/queries/useAuth';

type WizardStep = 'list' | 'step1' | 'step2' | 'detail';

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-ink-soft border-line bg-bg-raised',
  computed: 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:bg-blue-950',
  validated: 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950',
  paid: 'text-accent border-accent/40 bg-accent-soft',
};

const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Step 1: Select structure and period
const WizardStep1: React.FC<{
  onNext: (data: { name: string; salaryStructureId: string; periodStart: string; periodEnd: string }) => void;
  onCancel: () => void;
}> = ({ onNext, onCancel }) => {
  const { data: structures = [], isLoading } = useSalaryStructures();
  const [name, setName] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim()) return setError('Payrun name is required.');
    if (!salaryStructureId) return setError('Please select a salary structure.');
    if (!periodStart || !periodEnd) return setError('Please set both period start and end dates.');
    if (new Date(periodEnd) < new Date(periodStart)) return setError('Period end must be after period start.');
    setError(null);
    onNext({ name: name.trim(), salaryStructureId, periodStart, periodEnd });
  };

  // Auto-generate a payrun name suggestion
  const handlePeriodChange = (start: string, end: string) => {
    if (start && end && !name) {
      const d = new Date(start);
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      setName(`Payrun — ${monthName}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-ink">Step 1 — Select Structure & Period</h2>
        <p className="text-xs text-ink-soft mt-1">Choose the salary structure and payroll period for this run.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4 p-6 rounded-2xl border border-line bg-bg">
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Payrun Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Payrun — August 2026"
            className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Salary Structure</label>
          {isLoading ? (
            <div className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink-soft">
              Loading structures...
            </div>
          ) : (
            <select
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="">— Select a structure —</option>
              {structures
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                handlePeriodChange(e.target.value, periodEnd);
              }}
              className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                handlePeriodChange(periodStart, e.target.value);
              }}
              className="w-full px-3 py-2 border border-line rounded-xl bg-bg-raised text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
        >
          Next: Select Employees →
        </button>
      </div>
    </div>
  );
};

// Step 2: Employee selection
const WizardStep2: React.FC<{
  step1Data: { name: string; salaryStructureId: string; periodStart: string; periodEnd: string };
  onSubmit: (employeeIds: string[]) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}> = ({ step1Data, onSubmit, onBack, isSubmitting }) => {
  const { data: eligible = [], isLoading } = useEligibleEmployees(step1Data.periodStart, step1Data.periodEnd);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Auto-select eligible employees on load
  React.useEffect(() => {
    if (eligible.length > 0) {
      const eligibleIds = new Set(eligible.filter((e) => e.eligible).map((e) => e.employee.id));
      setSelectedIds(eligibleIds);
    }
  }, [eligible]);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === eligible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible.map((e) => e.employee.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return setError('Please select at least one employee.');
    setError(null);
    await onSubmit(Array.from(selectedIds));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-xs text-ink-soft">Loading eligible employees...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-ink">Step 2 — Select Employees</h2>
        <p className="text-xs text-ink-soft mt-1">
          Showing employees eligible for{' '}
          <span className="font-semibold text-ink">
            {formatDate(step1Data.periodStart)} — {formatDate(step1Data.periodEnd)}
          </span>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-bg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedIds.size === eligible.length && eligible.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-line accent-[#6A3FA0] cursor-pointer"
            />
            <label htmlFor="select-all" className="text-xs font-semibold text-ink cursor-pointer">
              Select All ({eligible.length} employees)
            </label>
          </div>
          <span className="text-xs text-ink-soft">{selectedIds.size} selected</span>
        </div>

        <div className="divide-y divide-line/60">
          {eligible.map((item) => {
            const emp = item.employee;
            const isSelected = selectedIds.has(emp.id);
            const hasWarning = !item.hasActiveContract || !item.hasBankDetails;

            return (
              <div
                key={emp.id}
                className={`flex items-center gap-3 p-4 transition-colors cursor-pointer hover:bg-bg-raised/50 ${isSelected ? 'bg-accent-soft/30' : ''}`}
                onClick={() => toggleEmployee(emp.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleEmployee(emp.id)}
                  className="w-4 h-4 rounded border-line accent-[#6A3FA0] cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center  gap-2">
                    <span className="text-xs font-semibold text-ink">
                      {emp.first_name} {emp.last_name}
                    </span>
                    {!item.eligible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-semibold uppercase">
                        No Contract
                      </span>
                    )}
                    {hasWarning && item.eligible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-semibold uppercase">
                        Warning
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-soft mt-0.5">{emp.email}</div>
                  {emp.department_name && (
                    <div className="text-[11px] text-ink-soft">{emp.department_name}</div>
                  )}
                </div>
                {item.activeContract && (
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-ink">
                      {formatCurrency(item.activeContract.wage)}
                      <span className="text-ink-soft font-normal">
                        /{item.activeContract.wage_type === 'hourly' ? 'hr' : 'mo'}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-soft">{item.activeContract.name}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedIds.size === 0}
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
              Computing Payrun...
            </>
          ) : (
            `⚡ Compute Payrun (${selectedIds.size} employees)`
          )}
        </button>
      </div>
    </div>
  );
};

// Payrun detail view
const PayrunDetail: React.FC<{
  payrun: PayrunItem;
  onBack: () => void;
  canManage: boolean;
}> = ({ payrun, onBack, canManage }) => {
  const validateMutation = useValidatePayrun();
  const markPaidMutation = useMarkPayrunPaid();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleValidate = async () => {
    setActionError(null);
    try {
      await validateMutation.mutateAsync(payrun.id);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || err.message || 'Failed to validate payrun');
    }
  };

  const handleMarkPaid = async () => {
    setActionError(null);
    try {
      await markPaidMutation.mutateAsync(payrun.id);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || err.message || 'Failed to mark payrun as paid');
    }
  };

  const warnings = payrun.warnings || [];
  const blockingWarnings = warnings.filter((w) => w.severity === 'blocking');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-ink-soft hover:text-ink transition-colors mb-2 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Payruns
          </button>
          <h2 className="font-serif text-2xl font-bold text-ink">{payrun.name}</h2>
          <p className="text-xs text-ink-soft mt-1">
            {formatDate(payrun.period_start)} — {formatDate(payrun.period_end)} ·{' '}
            {payrun.salary_structure_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLORS[payrun.status] || ''}`}
          >
            {payrun.status}
          </span>
          {canManage && payrun.status === 'computed' && (
            <button
              onClick={handleValidate}
              disabled={validateMutation.isPending || blockingWarnings.length > 0}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Validate Payrun
            </button>
          )}
          {canManage && payrun.status === 'validated' && (
            <button
              onClick={handleMarkPaid}
              disabled={markPaidMutation.isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              Mark Paid
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
          {actionError}
        </div>
      )}

      {/* KPI Summary */}
      <StatGrid
        columns={4}
        items={[
          {
            label: 'Total Net Paid',
            value: formatCurrency(payrun.total_net),
            subtext: `${payrun.payslip_count} payslips`,
          },
          {
            label: 'Gross Salary Burden',
            value: formatCurrency(payrun.total_gross),
            subtext: 'Before deductions',
          },
          {
            label: 'Total Deductions',
            value: formatCurrency(payrun.total_deductions),
            subtext: 'Taxes & statutory',
          },
          {
            label: 'Basic Component',
            value: formatCurrency(payrun.total_basic),
            subtext: 'Fixed base salary',
          },
        ]}
      />

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 space-y-2">
          <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            ⚠ Payrun Warnings ({warnings.length})
          </h3>
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-2 rounded-lg border ${w.severity === 'blocking'
                    ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
                    : 'border-amber-200 bg-amber-50/50 text-amber-800 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-300'
                  }`}
              >
                <span className="font-semibold uppercase tracking-wide mr-1.5">[{w.severity}]</span>
                {w.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payslips table */}
      {payrun.payslips && payrun.payslips.length > 0 && (
        <div className="rounded-2xl border border-line bg-bg overflow-hidden">
          <div className="p-4 border-b border-line">
            <h3 className="font-serif text-base font-semibold text-ink">
              Payslips ({payrun.payslips.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line bg-bg-raised/60">
                  <th className="py-3 px-4 text-left font-semibold text-ink-soft">Employee</th>
                  <th className="py-3 px-4 text-right font-semibold text-ink-soft">Basic</th>
                  <th className="py-3 px-4 text-right font-semibold text-ink-soft">Gross</th>
                  <th className="py-3 px-4 text-right font-semibold text-ink-soft">Deductions</th>
                  <th className="py-3 px-4 text-right font-semibold text-ink-soft">Net Pay</th>
                  <th className="py-3 px-4 text-right font-semibold text-ink-soft">Days</th>
                  <th className="py-3 px-4 text-right font-semibold text-ink-soft">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {payrun.payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-bg-raised/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{ps.employee_name}</div>
                      <div className="text-ink-soft text-[11px]">{ps.employee_email}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink">
                      {formatCurrency(ps.basic_salary)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink">
                      {formatCurrency(ps.gross_salary)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
                      -{formatCurrency(ps.total_deductions)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-accent">
                      {formatCurrency(ps.net_salary)}
                    </td>
                    <td className="py-3 px-4 text-right text-ink-soft">{ps.worked_days}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/payslip/${ps.id}`}
                        className="text-accent font-medium hover:underline no-underline text-[11px]"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const PayrunsPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: payruns = [], isLoading, isError } = usePayrunsList();
  const createPayrunMutation = useCreatePayrun();

  const [view, setView] = useState<WizardStep>('list');
  const [step1Data, setStep1Data] = useState<{
    name: string;
    salaryStructureId: string;
    periodStart: string;
    periodEnd: string;
  } | null>(null);
  const [selectedPayrunId, setSelectedPayrunId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: selectedPayrun } = usePayrunById(selectedPayrunId);

  const canManage =
    user?.role === 'Admin' ||
    user?.role === 'HR Payroll Manager' ||
    user?.role === 'HR Payroll User';

  const canWrite = user?.role === 'Admin' || user?.role === 'HR Payroll Manager';

  const handleWizardStep1 = (data: typeof step1Data) => {
    setStep1Data(data);
    setView('step2');
  };

  const handleWizardStep2 = async (employeeIds: string[]) => {
    if (!step1Data) return;
    setCreateError(null);
    try {
      const payload: CreatePayrunPayload = {
        ...step1Data,
        employeeIds,
      };
      const created = await createPayrunMutation.mutateAsync(payload);
      setSelectedPayrunId(created.id);
      setView('detail');
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err.message || 'Failed to create payrun');
      setView('step2');
    }
  };

  // KPI calculations from the list
  const totalPaid = payruns.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.total_net), 0);
  const paidCount = payruns.filter((p) => p.status === 'paid').length;
  const pendingCount = payruns.filter((p) => p.status !== 'paid').length;

  const renderContent = () => {
    if (view === 'step1') {
      return (
        <WizardStep1
          onNext={handleWizardStep1}
          onCancel={() => setView('list')}
        />
      );
    }

    if (view === 'step2' && step1Data) {
      return (
        <WizardStep2
          step1Data={step1Data}
          onSubmit={handleWizardStep2}
          onBack={() => setView('step1')}
          isSubmitting={createPayrunMutation.isPending}
        />
      );
    }

    if (view === 'detail' && selectedPayrun && user) {
      return (
        <PayrunDetail
          payrun={selectedPayrun}
          onBack={() => {
            setSelectedPayrunId(null);
            setView('list');
          }}
          canManage={canManage}
        />
      );
    }

    // Default: list view
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Payrun Management
            </h1>
            <p className="text-xs text-ink-soft mt-1">
              Execute payroll runs, validate, and mark payslips as paid.
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setView('step1')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              ⚡ New Payrun Wizard
            </button>
          )}
        </div>

        {createError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
            {createError}
          </div>
        )}

        {/* KPIs */}
        <StatGrid
          columns={3}
          items={[
            {
              label: 'Total Paid (All Time)',
              value: formatCurrency(totalPaid),
              subtext: `${paidCount} completed payruns`,
            },
            {
              label: 'Total Payruns',
              value: String(payruns.length),
              subtext: 'Across all periods',
            },
            {
              label: 'Pending Action',
              value: String(pendingCount),
              subtext: 'Draft, computed, or validated',
            },
          ]}
        />

        {/* Payruns list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-ink-soft">Loading payruns...</span>
          </div>
        ) : isError ? (
          <div className="py-12 text-center border border-line rounded-2xl bg-bg">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Failed to load payruns.</p>
          </div>
        ) : payruns.length === 0 ? (
          <div className="py-16 text-center border border-line border-dashed rounded-2xl bg-bg">
            <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚡
            </div>
            <h3 className="font-serif text-base font-semibold text-ink mb-1">No Payruns Yet</h3>
            <p className="text-xs text-ink-soft max-w-xs mx-auto">
              Launch the Payrun Wizard to compute your first payroll cycle.
            </p>
            {canWrite && (
              <button
                onClick={() => setView('step1')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
              >
                ⚡ Launch Payrun Wizard
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-bg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line bg-bg-raised/60">
                    <th className="py-3 px-4 text-left font-semibold text-ink-soft">Payrun</th>
                    <th className="py-3 px-4 text-left font-semibold text-ink-soft">Period</th>
                    <th className="py-3 px-4 text-right font-semibold text-ink-soft">Payslips</th>
                    <th className="py-3 px-4 text-right font-semibold text-ink-soft">Net Total</th>
                    <th className="py-3 px-4 text-center font-semibold text-ink-soft">Status</th>
                    <th className="py-3 px-4 text-right font-semibold text-ink-soft">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {payruns.map((pr) => (
                    <tr key={pr.id} className="hover:bg-bg-raised/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink">{pr.name}</div>
                        <div className="text-ink-soft text-[11px]">{pr.salary_structure_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-ink">{formatDate(pr.period_start)}</div>
                        <div className="text-ink-soft">→ {formatDate(pr.period_end)}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-ink font-medium">{pr.payslip_count}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-accent">
                        {formatCurrency(pr.total_net)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLORS[pr.status] || ''}`}
                        >
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPayrunId(pr.id);
                            setView('detail');
                          }}
                          className="text-accent font-medium hover:underline text-[11px] cursor-pointer"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout title="Payrun Management">
      <main className="max-w-6xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8">
        {renderContent()}
      </main>
    </AppLayout>
  );
};

export default PayrunsPage;
