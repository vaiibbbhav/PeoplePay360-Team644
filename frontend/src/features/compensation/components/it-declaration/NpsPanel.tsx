import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export type NpsPanelProps = {
  npsEmployee80CCD1B: number;
  setNpsEmployee80CCD1B: (val: number) => void;
  npsEmployer80CCD2: number;
  setNpsEmployer80CCD2: (val: number) => void;
  pranNumber: string;
  setPranNumber: (val: string) => void;
  showValues?: boolean;
};

export const NpsPanel: React.FC<NpsPanelProps> = ({
  npsEmployee80CCD1B,
  setNpsEmployee80CCD1B,
  npsEmployer80CCD2,
  setNpsEmployer80CCD2,
  pranNumber,
  setPranNumber,
  showValues = true,
}) => {
  const totalNpsDeduction = Math.min(50000, npsEmployee80CCD1B) + npsEmployer80CCD2;

  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">
            National Pension System (NPS) u/s 80CCD
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Voluntary employee contributions & corporate employer contributions.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-ink-soft block font-mono">Total NPS Deduction</span>
          <span className="text-base font-bold text-accent font-mono">
            {formatCurrency(totalNpsDeduction, showValues)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 80CCD(1B) */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3">
          <div>
            <h4 className="font-semibold text-xs text-ink">Section 80CCD(1B) - Employee Voluntary NPS</h4>
            <p className="text-[11px] text-ink-soft">
              Additional exclusive deduction of up to <b>₹50,000</b> over and above Section 80C limit!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={npsEmployee80CCD1B}
              onChange={(e) => setNpsEmployee80CCD1B(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] text-ink-soft font-mono">
            Statutory ceiling: ₹50,000 | Declared: {formatCurrency(npsEmployee80CCD1B, showValues)}
          </span>
        </div>

        {/* 80CCD(2) */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-xs text-ink">Section 80CCD(2) - Employer NPS Contribution</h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                BOTH REGIMES
              </span>
            </div>
            <p className="text-[11px] text-ink-soft">
              Allowed under <b>both New and Old Tax Regimes</b> (up to 14% of Basic salary).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={npsEmployer80CCD2}
              onChange={(e) => setNpsEmployer80CCD2(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] text-ink-soft font-mono">
            Deductible under both regimes
          </span>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-ink">PRAN (Permanent Retirement Account Number)</label>
          <input
            type="text"
            value={pranNumber}
            onChange={(e) => setPranNumber(e.target.value)}
            placeholder="12-digit PRAN number"
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent max-w-md"
          />
        </div>
      </div>
    </div>
  );
};
