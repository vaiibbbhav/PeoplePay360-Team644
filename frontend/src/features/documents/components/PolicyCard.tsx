import React from 'react';
import type { Policy } from '../queries/useDocuments';

type PolicyCardProps = {
  policy: Policy;
  onView: (policy: Policy) => void;
  onAccept: (policy: Policy) => void;
  onEdit?: (policy: Policy) => void;
  isAccepting?: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  compliance: 'Compliance & Legal',
  security: 'Security & Data',
  workplace: 'Workplace & Culture',
  hr: 'HR & Operations',
};

export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  onView,
  onAccept,
  onEdit,
  isAccepting = false,
}) => {
  const acceptedDate = policy.acceptedAt
    ? new Date(policy.acceptedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-5 sm:p-6 flex flex-col justify-between hover:border-ink/20 transition-all font-sans shadow-2xs">
      <div>
        {/* Top: category + status label (no dots) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-ink-soft">
            {CATEGORY_LABEL[policy.category] ?? policy.category}
          </span>

          {policy.isAccepted ? (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Signed
            </span>
          ) : (
            <span className="text-xs font-semibold text-accent">
              Action Required
            </span>
          )}
        </div>

        {/* Title + summary */}
        <h3 className="font-serif text-lg font-bold text-ink tracking-tight leading-snug">
          {policy.title}
        </h3>
        <p className="text-xs text-ink-soft leading-relaxed line-clamp-3 mt-2">
          {policy.summary}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-4 mt-5 border-t border-line">
        <span className="text-xs text-ink-soft">
          {policy.isAccepted && acceptedDate ? `Signed ${acceptedDate}` : 'Mandatory'}
        </span>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(policy)}
              className="text-xs font-medium text-ink-soft hover:text-ink transition-colors cursor-pointer px-1 py-1"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onView(policy)}
            className="px-3 py-1.5 text-xs font-medium border border-line rounded-xl bg-bg hover:bg-bg-raised transition-colors cursor-pointer text-ink"
          >
            {policy.isAccepted ? 'View' : 'Review'}
          </button>
          {!policy.isAccepted && (
            <button
              type="button"
              onClick={() => onAccept(policy)}
              disabled={isAccepting}
              className="px-3.5 py-1.5 text-xs font-semibold bg-accent text-accent-ink rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isAccepting ? 'Signing…' : 'Accept'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

