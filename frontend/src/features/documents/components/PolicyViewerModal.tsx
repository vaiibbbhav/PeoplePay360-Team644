import React, { useState } from 'react';
import { useDialogAccessibility } from '@/components/ui/useDialogAccessibility';
import type { Policy } from '../queries/useDocuments';

type PolicyViewerModalProps = {
  policy: Policy | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (policy: Policy) => void;
  isAccepting?: boolean;
};

export const PolicyViewerModal: React.FC<PolicyViewerModalProps> = ({
  policy,
  isOpen,
  onClose,
  onAccept,
  isAccepting = false,
}) => {
  const [agreedPolicyId, setAgreedPolicyId] = useState<string | null>(null);
  const dialogRef = useDialogAccessibility({ isOpen, onClose });

  if (!isOpen || !policy) return null;

  const agreed = agreedPolicyId === policy.id;

  const formattedAcceptedDate = policy.acceptedAt
    ? new Date(policy.acceptedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Simple markdown renderer for headers and paragraphs
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4
            key={idx}
            className="text-base font-sans font-semibold text-ink mt-6 mb-2 tracking-tight"
          >
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-ink-soft leading-relaxed my-1">
            {line.replace('- ', '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-ink-soft leading-relaxed mb-3">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Policy: ${policy.title}`}
        tabIndex={-1}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-bg-raised border border-line rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Modal Topbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-bg">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-bg-sunken text-ink-soft border border-line-subtle">
              {policy.code}
            </span>
            <span className="text-[10px] font-mono text-ink-faint">v{policy.version}</span>
            {policy.isAccepted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Signed & Acknowledged
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print document"
              className="p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-bg-sunken transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-bg-sunken transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Official Document Header */}
          <div className="border-b border-line pb-6 text-center">
            <p className="text-[11px] uppercase tracking-widest text-ink-faint font-mono">
              Anchorage Technologies Pvt. Ltd. • Corporate Policy Register
            </p>
            <h2 className="text-2xl md:text-3xl font-sans text-ink font-normal mt-2 tracking-tight">
              {policy.title}
            </h2>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-ink-faint font-mono">
              <span>Effective Date: {policy.effectiveDate || '2026-04-01'}</span>
              <span>•</span>
              <span>Document Version: {policy.version}</span>
              <span>•</span>
              <span>Classification: Confidential</span>
            </div>
          </div>

          {/* Executive Summary Box */}
          <div className="p-4 bg-bg-sunken border border-line-subtle rounded-xl">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-ink-soft block mb-1">
              Executive Summary
            </span>
            <p className="text-xs text-ink-soft leading-relaxed italic">{policy.summary}</p>
          </div>

          {/* Document Content */}
          <div className="prose prose-sm max-w-none text-ink">
            {renderFormattedContent(policy.content)}
          </div>

          {/* Acceptance Audit Stamp (if accepted) */}
          {policy.isAccepted && (
            <div className="mt-8 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Officially Signed & Acknowledged
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Signed by you on {formattedAcceptedDate} • Version{' '}
                    {policy.acceptedVersion || policy.version}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded">
                SECURE COMPLIANCE RECORD
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer (Action or Dismiss) */}
        <div className="px-6 py-4 border-t border-line bg-bg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {!policy.isAccepted ? (
            <>
              <label className="flex items-start gap-2.5 text-xs text-ink-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreedPolicyId(e.target.checked ? policy.id : null)}
                  className="mt-0.5 w-4 h-4 rounded border-line text-accent focus:ring-accent"
                />
                <span>
                  I confirm that I have read, understood, and agree to strictly adhere to the terms
                  and conditions set forth in this policy.
                </span>
              </label>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => onAccept(policy)}
                  disabled={!agreed || isAccepting}
                  className="px-5 py-2 text-xs font-medium bg-accent text-accent-ink rounded-xl hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  {isAccepting ? 'Recording Signature...' : 'I Agree & Accept Policy'}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-ink-faint">
                You have fulfilled the compliance requirement for this document.
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-medium bg-ink text-bg rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
