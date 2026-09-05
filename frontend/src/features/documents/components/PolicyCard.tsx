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
      className={`relative flex flex-col justify-between p-6 bg-bg-raised border rounded-2xl transition-all duration-200 hover:border-ink/40 ${
        policy.isAccepted ? 'border-line' : 'border-accent/40 bg-accent/[0.01]'
      }`}
    >
      <div>
        {/* Card Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-md bg-bg-sunken text-ink-soft border border-line-subtle">
              {categoryLabels[policy.category] || policy.category}
            </span>
            <span className="text-[10px] font-mono text-ink-faint">v{policy.version}</span>
          </div>

          {policy.isAccepted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Signed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>Action Required</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-sans font-medium text-ink tracking-tight mb-2 leading-snug">
          {policy.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-ink-soft leading-relaxed line-clamp-3 mb-6">{policy.summary}</p>
      </div>

      {/* Footer / Actions */}
      <div className="pt-4 border-t border-line-subtle flex items-center justify-between gap-3">
        <div className="text-[11px] text-ink-faint">
          {policy.isAccepted && formattedAcceptedDate ? (
            <span>Signed on {formattedAcceptedDate}</span>
          ) : (
            <span className="text-amber-700 font-medium">Mandatory acknowledgment</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(policy)}
              className="px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink border border-line rounded-lg hover:bg-bg-sunken transition-all cursor-pointer"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => onView(policy)}
            className="px-3 py-1.5 text-xs font-medium text-ink border border-line rounded-lg hover:border-ink hover:bg-bg-sunken transition-all cursor-pointer"
          >
            {policy.isAccepted ? 'View Policy' : 'Read & Review'}
          </button>

          {!policy.isAccepted && (
            <button
              onClick={() => onAccept(policy)}
              disabled={isAccepting}
              className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-ink rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
