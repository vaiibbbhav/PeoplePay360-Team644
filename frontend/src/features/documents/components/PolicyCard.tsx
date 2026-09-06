import React from 'react';
import type { Policy } from '../queries/useDocuments';

type PolicyCardProps = {
  policy: Policy;
  onView: (policy: Policy) => void;
  onAccept: (policy: Policy) => void;
  onEdit?: (policy: Policy) => void;
  isAccepting?: boolean;
};

export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  onView,
  onAccept,
  onEdit,
  isAccepting = false,
}) => {
  const formattedAcceptedDate = policy.acceptedAt
    ? new Date(policy.acceptedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const categoryLabels: Record<string, string> = {
    compliance: 'Compliance & Legal',
    security: 'Security & Data',
    workplace: 'Workplace & Hybrid',
    hr: 'HR & Operations',
  };

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between bg-bg hover:border-ink/30 transition-all font-sans ${
        policy.isAccepted ? 'border-line' : 'border-accent/40 shadow-2xs'
      }`}
    >
      <div>
        {/* Card Header: Category + Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-medium text-ink-soft bg-bg-raised px-2.5 py-1 rounded-md border border-line">
            {categoryLabels[policy.category] || policy.category}
          </span>

          {policy.isAccepted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Signed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full border border-accent/40">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Action Required</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-bold text-ink tracking-tight mb-2 leading-snug">
          {policy.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-ink-soft leading-relaxed line-clamp-3 mb-4">
          {policy.summary}
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="pt-3.5 border-t border-line flex items-center justify-between gap-3">
        <div className="text-[11px] text-ink-soft">
          {policy.isAccepted && formattedAcceptedDate ? (
            <span>Signed {formattedAcceptedDate}</span>
          ) : (
            <span className="text-accent font-medium">Action required</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(policy)}
              className="px-2.5 py-1 text-xs font-medium text-ink-soft hover:text-ink border border-line rounded-lg hover:bg-bg-raised transition-colors cursor-pointer"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onView(policy)}
            className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-lg hover:bg-bg-raised transition-colors cursor-pointer"
          >
            {policy.isAccepted ? 'View Policy' : 'Review'}
          </button>

          {!policy.isAccepted && (
            <button
              type="button"
              onClick={() => onAccept(policy)}
              disabled={isAccepting}
              className="px-3 py-1.5 text-xs font-semibold bg-accent text-accent-ink rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isAccepting ? 'Signing...' : 'Accept'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
