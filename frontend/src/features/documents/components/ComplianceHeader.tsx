import React from 'react';
import { CheckCircle2 } from 'lucide-react';
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
    <div className="p-5 sm:p-6 rounded-2xl border border-line bg-bg-raised font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Summary text */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-semibold text-ink m-0">
            {isFullyCompliant
              ? `All ${stats.total} policies acknowledged`
              : `${stats.acceptedCount} of ${stats.total} policies acknowledged`}
          </h2>
          {isFullyCompliant && (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              · Up to date
            </span>
          )}
        </div>
        <p className="text-xs text-ink-soft mt-1 leading-relaxed m-0">
          {isFullyCompliant
            ? 'All mandatory organization guidelines and workplace policies are signed.'
            : `${stats.pendingCount} ${
                stats.pendingCount === 1 ? 'policy requires' : 'policies require'
              } your review and formal acknowledgment.`}
        </p>
      </div>

      {/* Right: Accept All Action (only if pending) */}
      {!isFullyCompliant && (
        <button
          type="button"
          onClick={onAcceptAllClick}
          disabled={isAcceptingAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-ink text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0 shadow-2xs"
        >
          {isAcceptingAll ? (
            <span className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>Accept All ({stats.pendingCount})</span>
        </button>
      )}
    </div>
  );
};
