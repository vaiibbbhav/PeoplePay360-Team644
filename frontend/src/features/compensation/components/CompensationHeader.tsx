import React from 'react';

export type CompensationHeaderProps = {
  financialYear: string;
  onFinancialYearChange: (fy: string) => void;
  showValues: boolean;
  onToggleShowValues: () => void;
};

export const CompensationHeader: React.FC<CompensationHeaderProps> = ({
  financialYear,
  onFinancialYearChange,
  showValues,
  onToggleShowValues,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5 sm:pb-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Compensation
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
          Review pay package, download monthly payslips, and inspect tax computations.
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Financial Year Selector */}
        <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-1.5 bg-bg-raised text-xs sm:text-sm">
          <svg
            className="w-4 h-4 text-ink-soft"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <label htmlFor="fy-select" className="text-ink-soft font-medium">
            Financial Year :
          </label>
          <select
            id="fy-select"
            value={financialYear}
            onChange={(e) => onFinancialYearChange(e.target.value)}
            className="bg-transparent border-none text-ink font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="2026-27">2026-27</option>
            <option value="2025-26">2025-26</option>
            <option value="2024-25">2024-25</option>
          </select>
        </div>

        {/* Show Values Toggle (Privacy Protection) */}
        <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-1.5 bg-bg-raised text-xs sm:text-sm">
          <span className="text-ink-soft font-medium select-none">Show Values</span>
          <button
            type="button"
            role="switch"
            aria-checked={showValues}
            onClick={onToggleShowValues}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              showValues ? 'bg-accent' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                showValues ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs text-ink-soft">
            {showValues ? (
              <svg
                className="w-3.5 h-3.5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 text-ink-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
