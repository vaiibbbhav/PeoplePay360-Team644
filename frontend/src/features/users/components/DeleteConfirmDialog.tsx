import React from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

type Props = {
  isOpen: boolean;
  isDeleting: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const DeleteConfirmDialog: React.FC<Props> = ({
  isOpen,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isDeleting) onCancel();
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Dialog */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-sm bg-bg border border-line rounded-xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="w-10 h-10 rounded-full bg-over-red/10 flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-over-red"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h2 className="font-sans text-base font-semibold text-ink">Are you sure?</h2>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            This action cannot be undone. This will permanently delete the user from the system.
          </p>
          {error && (
            <div className="mt-3 p-2.5 rounded-lg bg-over-red/10 border border-over-red/30 text-xs text-over-red">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-end gap-2.5 border-t border-line pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-over-red text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
