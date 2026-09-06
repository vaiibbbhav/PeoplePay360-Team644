import React, { useState } from 'react';
import type { Policy } from '../queries/useDocuments';
import { useClickOutside } from '@/hooks/useClickOutside';

type AcceptAllModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pendingPolicies: Policy[];
  onConfirm: () => void;
  isAccepting: boolean;
};

export const AcceptAllModal: React.FC<AcceptAllModalProps> = ({
  isOpen,
  onClose,
  pendingPolicies,
  onConfirm,
  isAccepting,
}) => {
  const [agreed, setAgreed] = useState(false);

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isAccepting) onClose();
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-bg-raised border border-line rounded-2xl shadow-xl overflow-hidden p-4 sm:p-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-accent block">
              Batch Compliance Signing
            </span>
            <h3 className="text-xl font-sans text-ink font-medium tracking-tight mt-1">
              Accept All Outstanding Policies
            </h3>
          </div>
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

        <div className="my-5">
          <p className="text-xs text-ink-soft leading-relaxed mb-4">
            You are about to digitally acknowledge and accept the following{' '}
            <strong className="text-ink">
              {pendingPolicies.length} mandatory corporate policies
            </strong>
            :
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-line-subtle rounded-xl p-3 bg-bg-sunken">
            {pendingPolicies.map((pol) => (
              <div key={pol.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-ink font-medium truncate max-w-[280px]">{pol.title}</span>
                <span className="text-[10px] font-mono text-ink-faint">v{pol.version}</span>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2.5 mt-5 text-xs text-ink-soft cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-line text-accent focus:ring-accent"
            />
            <span>
              I certify that I have read or received access to all listed corporate policies, agree
              to abide by their requirements, and understand this constitutes a binding compliance
              record.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <button
            onClick={onClose}
            disabled={isAccepting}
            className="px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed || isAccepting}
            className="px-5 py-2 text-xs font-medium bg-accent text-accent-ink rounded-xl hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {isAccepting ? 'Signing All Policies...' : `Accept All (${pendingPolicies.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
