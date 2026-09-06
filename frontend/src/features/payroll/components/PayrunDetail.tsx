import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatGrid } from '@/components/ui/StatCard';
import {
  useValidatePayrun,
  useMarkPayrunPaid,
  type PayrunItem,
} from '../queries/usePayruns';

export type PayrunDetailProps = {
  payrun: PayrunItem;
  onBack: () => void;
  canManage: boolean;
};

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

export const PayrunDetail: React.FC<PayrunDetailProps> = ({ payrun, onBack, canManage }) => {
  const validateMutation = useValidatePayrun();
  const markPaidMutation = useMarkPayrunPaid();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleValidate = async () => {
    setActionError(null);
    try {
      await validateMutation.mutateAsync(payrun.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setActionError(errorObj?.response?.data?.error || errorObj?.message || 'Failed to validate payrun');
    }
  };

  const handleMarkPaid = async () => {
    setActionError(null);
    try {
      await markPaidMutation.mutateAsync(payrun.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setActionError(errorObj?.response?.data?.error || errorObj?.message || 'Failed to mark payrun as paid');
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
          <h2 className="font-sans text-2xl font-bold text-ink">{payrun.name}</h2>
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
                className={`text-xs px-3 py-2 rounded-lg border ${
                  w.severity === 'blocking'
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
            <h3 className="font-sans text-base font-semibold text-ink">
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
