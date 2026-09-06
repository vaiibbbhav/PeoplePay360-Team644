import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
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
    <div className="bg-bg-raised border border-line rounded-2xl p-5 sm:p-6 transition-all font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                isFullyCompliant
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                  : 'bg-accent-soft text-accent border border-accent/30'
              }`}
            >
              {isFullyCompliant ? '100% Compliant' : `${stats.pendingCount} Action Required`}
            </span>
            <span className="text-xs text-ink-soft">
              {stats.acceptedCount} of {stats.total} policies signed &amp; acknowledged
            </span>
          </div>

          <p className="text-xs sm:text-sm text-ink-soft mt-2 max-w-2xl leading-relaxed">
            Review, sign, and maintain compliance with mandatory organizational guidelines, code of
            conduct, and workplace standards.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 min-w-[240px] shrink-0">
          {!isFullyCompliant ? (
            <button
              type="button"
              onClick={onAcceptAllClick}
              disabled={isAcceptingAll}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-ink text-xs font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAcceptingAll ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept All Outstanding ({stats.pendingCount})</span>
                </>
              )}
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>All mandatory policies acknowledged</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-5 pt-4 border-t border-line">
        <div className="flex items-center justify-between text-xs font-mono text-ink-soft mb-2">
          <span>Compliance Progress</span>
          <span className="font-semibold text-ink">{stats.compliancePercentage}%</span>
        </div>
        <div className="w-full h-2 bg-line/40 rounded-full overflow-hidden">
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
