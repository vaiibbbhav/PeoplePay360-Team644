import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatGrid } from '@/components/ui/StatCard';
import {
  usePayrunsList,
  usePayrunById,
  useCreatePayrun,
  type CreatePayrunPayload,
} from '../queries/usePayruns';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { WizardStep1, type WizardStep1Data } from '../components/WizardStep1';
import { WizardStep2 } from '../components/WizardStep2';
import { PayrunDetail } from '../components/PayrunDetail';

type WizardStep = 'list' | 'step1' | 'step2' | 'detail';

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-ink-soft border-line bg-bg-raised',
  computed: 'text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/40',
  validated: 'text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40',
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

export const PayrunsPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: payruns = [], isLoading, isError } = usePayrunsList();
  const createPayrunMutation = useCreatePayrun();

  const [view, setView] = useState<WizardStep>('list');
  const [step1Data, setStep1Data] = useState<WizardStep1Data | null>(null);
  const [selectedPayrunId, setSelectedPayrunId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: selectedPayrun } = usePayrunById(selectedPayrunId);

  const canManage =
    user?.role === 'Admin' ||
    user?.role === 'HR Payroll Manager' ||
    user?.role === 'HR Payroll User';

  const canWrite = user?.role === 'Admin' || user?.role === 'HR Payroll Manager';

  const handleWizardStep1 = (data: WizardStep1Data) => {
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setCreateError(errorObj?.response?.data?.error || errorObj?.message || 'Failed to create payrun');
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
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-ink">
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
          isLoading={isLoading}
          skeletonCount={3}
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
            <h3 className="font-sans text-base font-semibold text-ink mb-1">No Payruns Yet</h3>
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
                    <th className="py-3 px-4 text-left font-semibold text-ink-soft w-64 min-w-[220px]">Period</th>
                    <th className="py-3 px-4 text-right font-semibold text-ink-soft w-24">Payslips</th>
                    <th className="py-3 px-4 text-right font-semibold text-ink-soft w-32">Net Total</th>
                    <th className="py-3 px-4 text-center font-semibold text-ink-soft w-28">Status</th>
                    <th className="py-3 px-4 text-right font-semibold text-ink-soft w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {payruns.map((pr) => (
                    <tr key={pr.id} className="hover:bg-bg-raised/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink">{pr.name}</div>
                        <div className="text-ink-soft text-[11px]">{pr.salary_structure_name}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap min-w-[220px]">
                        <div className="text-xs font-medium text-ink flex items-center gap-1.5">
                          <span>{formatDate(pr.period_start)}</span>
                          <span className="text-ink-soft/60 text-[11px]">→</span>
                          <span>{formatDate(pr.period_end)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-ink font-medium">{pr.payslip_count}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-accent">
                        {formatCurrency(pr.total_net)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLORS[pr.status] || ''}`}
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
