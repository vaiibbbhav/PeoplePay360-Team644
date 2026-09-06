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
  const pct = stats.compliancePercentage;

  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-line font-sans">
      {/* Left: progress + label */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Circular-ish progress indicator — just a text ring */}
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 border-line bg-bg-raised">
          <span className="text-[11px] font-bold font-mono text-ink leading-none">{pct}%</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              {stats.acceptedCount} / {stats.total} acknowledged
            </span>
            {isFullyCompliant && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compliant
              </span>
            )}
          </div>
          {!isFullyCompliant && (
            <p className="text-[11px] text-ink-soft mt-0.5">
              {stats.pendingCount} {stats.pendingCount === 1 ? 'policy requires' : 'policies require'} your acknowledgment
            </p>
          )}
        </div>
      </div>

      {/* Right: action */}
      {!isFullyCompliant && (
        <button
          type="button"
          onClick={onAcceptAllClick}
          disabled={isAcceptingAll}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-accent-ink text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {isAcceptingAll ? (
            <span className="w-3 h-3 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Accept All ({stats.pendingCount})
        </button>
      )}
    </div>
  );
};
