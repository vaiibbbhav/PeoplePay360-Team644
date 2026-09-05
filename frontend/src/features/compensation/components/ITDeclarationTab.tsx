import React from 'react';

export const ITDeclarationTab: React.FC = () => {
  return (
    <div className="space-y-6 pt-2">
      <div className="border border-line rounded-xl p-6 bg-bg-raised">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-ink">
                IT Declaration for FY 2026-27
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold uppercase tracking-wider">
                CLOSED
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              Go Ahead with New Tax Regime (No Tax Exemption / Deductions Under Section 202(1)) :{' '}
              <b className="text-ink">NEW</b>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-md border border-line bg-bg text-ink hover:bg-bg-raised font-medium transition-colors cursor-pointer"
            >
              Compare Tax
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-md border border-line bg-bg text-ink hover:bg-bg-raised font-medium transition-colors cursor-pointer"
            >
              IT Forms ▾
            </button>
          </div>
        </div>

        {/* Sub sections pills */}
        <div className="flex flex-wrap gap-2 pt-4">
          {[
            'HRA & Others (U/S 10)',
            'House Property (U/S 24(b))',
            'Investment Declaration (U/S 80C & Others)',
            'Others',
            'Previous Employment (Form 12B)',
          ].map((p, idx) => (
            <span
              key={p}
              className={`text-xs px-3 py-1.5 rounded-full border border-line transition-colors ${
                idx === 0 ? 'bg-ink text-bg font-medium' : 'bg-bg text-ink-soft hover:text-ink'
              }`}
            >
              {p}
            </span>
          ))}
        </div>

        <div className="mt-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-300">
          <b>Note:</b> Investment declaration window for FY 2026-27 is currently closed for
          submission. New submissions will reopen during the mid-year POI (Proof of Investment)
          cycle.
        </div>
      </div>
    </div>
  );
};
