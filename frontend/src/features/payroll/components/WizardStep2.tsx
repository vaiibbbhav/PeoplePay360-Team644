import React, { useState, useEffect } from 'react';
import { useEligibleEmployees } from '../queries/usePayruns';

export type WizardStep2Props = {
  step1Data: { name: string; salaryStructureId: string; periodStart: string; periodEnd: string };
  onSubmit: (employeeIds: string[]) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
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

export const WizardStep2: React.FC<WizardStep2Props> = ({
  step1Data,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const { data: eligible = [], isLoading } = useEligibleEmployees(step1Data.periodStart, step1Data.periodEnd);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Auto-select eligible employees on load
  useEffect(() => {
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
        <h2 className="font-sans text-xl font-bold text-ink">Step 2 — Select Employees</h2>
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
              className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
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
                  id={`emp-select-${emp.id}`}
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleEmployee(emp.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-line accent-accent cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
