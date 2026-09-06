import React, { useState } from 'react';
import { useSalaryStructures } from '../queries/usePayruns';

export type WizardStep1Data = {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
};

type WizardStep1Props = {
  onNext: (data: WizardStep1Data) => void;
  onCancel: () => void;
};

export const WizardStep1: React.FC<WizardStep1Props> = ({ onNext, onCancel }) => {
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
        <h2 className="font-sans text-xl font-bold text-ink">Step 1 — Select Structure & Period</h2>
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
