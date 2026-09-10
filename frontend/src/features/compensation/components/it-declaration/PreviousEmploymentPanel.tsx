import React from 'react';

export type PreviousEmploymentPanelProps = {
  financialYear: string;
  prevGrossSalary: number;
  setPrevGrossSalary: (val: number) => void;
  prevTdsDeducted: number;
  setPrevTdsDeducted: (val: number) => void;
  prevPfDeducted: number;
  setPrevPfDeducted: (val: number) => void;
  prevPtDeducted: number;
  setPrevPtDeducted: (val: number) => void;
  showValues?: boolean;
};

export const PreviousEmploymentPanel: React.FC<PreviousEmploymentPanelProps> = ({
  financialYear,
  prevGrossSalary,
  setPrevGrossSalary,
  prevTdsDeducted,
  setPrevTdsDeducted,
  prevPfDeducted,
  setPrevPfDeducted,
  prevPtDeducted,
  setPrevPtDeducted,
}) => {
  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">
            Previous Employment Details (Form 12B)
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            If you joined in FY {financialYear}, declare earnings & TDS from your previous employer
            to prevent under-deduction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">
            Gross Salary from Previous Employer
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={prevGrossSalary}
              onChange={(e) => setPrevGrossSalary(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">
            TDS Deducted by Previous Employer
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={prevTdsDeducted}
              onChange={(e) => setPrevTdsDeducted(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Provident Fund (PF) Deducted</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={prevPfDeducted}
              onChange={(e) => setPrevPfDeducted(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Professional Tax (PT) Paid</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={prevPtDeducted}
              onChange={(e) => setPrevPtDeducted(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
