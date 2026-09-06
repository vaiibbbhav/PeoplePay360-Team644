import React from 'react';
import type { ComplianceStats } from '../queries/useDocuments';

type ComplianceHeaderProps = {
  stats: ComplianceStats;
  onAcceptAllClick: () => void;
  isAcceptingAll?: boolean;
};

export const ComplianceHeader: React.FC<ComplianceHeaderProps> = ({
  stats,
  onAcceptAllClick,
  isAcceptingAll = false,
}) => {
  const isFullyCompliant = stats.allAccepted;

  return (
    <div className="bg-bg-raised border border-line rounded-2xl p-6 mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${
                isFullyCompliant
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-accent/10 text-accent border border-accent/20'
              }`}
            >
              {isFullyCompliant ? '100% Compliant' : `${stats.pendingCount} Action Required`}
            </span>
            <span className="text-xs text-ink-soft">
              {stats.acceptedCount} of {stats.total} policies signed & acknowledged
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-sans text-ink font-normal mt-2 tracking-tight">
            Company Policies & Document Compliance
          </h1>
          <p className="text-sm text-ink-soft mt-1 max-w-2xl leading-relaxed">
            Review, sign, and maintain compliance with mandatory organizational guidelines, code of
            conduct, and workplace standards.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 min-w-[260px]">
          {!isFullyCompliant && (
            <button
              onClick={onAcceptAllClick}
              disabled={isAcceptingAll}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-accent-ink text-xs font-medium tracking-wider uppercase rounded-xl hover:opacity-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAcceptingAll ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Accept All Outstanding ({stats.pendingCount})</span>
                </>
              )}
            </button>
          )}

          {isFullyCompliant && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-medium">
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>All mandatory policies acknowledged</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-6 pt-5 border-t border-line-subtle">
        <div className="flex items-center justify-between text-xs font-mono text-ink-soft mb-2">
          <span>Compliance Progress</span>
          <span className="font-semibold text-ink">{stats.compliancePercentage}%</span>
        </div>
        <div className="w-full h-2 bg-bg-sunken rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFullyCompliant ? 'bg-emerald-600' : 'bg-accent'
            }`}
            style={{ width: `${stats.compliancePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
