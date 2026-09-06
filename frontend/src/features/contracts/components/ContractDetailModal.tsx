import React from 'react';
import { useDialogAccessibility } from '@/components/ui/useDialogAccessibility';
import type { ContractItem } from '../queries/useContracts';
import { useClickOutside } from '@/hooks/useClickOutside';

type ContractDetailModalProps = {
  contract: ContractItem | null;
  onClose: () => void;
  onEdit: (contract: ContractItem) => void;
};

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  onClose,
  onEdit,
}) => {
  const dialogRef = useDialogAccessibility({ isOpen: Boolean(contract), onClose });
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, Boolean(contract));

  const setCombinedRef = (node: HTMLDivElement | null) => {
    (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  if (!contract) return null;

  const formatDate = (val?: string | null) => {
    if (!val) return 'Indefinite / Permanent';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div
        ref={setCombinedRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contract-detail-title"
        tabIndex={-1}
        className="bg-bg border border-line rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-line flex items-center justify-between bg-bg-raised/30">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              Employment Agreement
            </span>
            <h2
              id="contract-detail-title"
              className="font-serif text-lg sm:text-xl font-bold text-ink mt-0.5 mb-0"
            >
              {contract.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-line bg-transparent text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors flex items-center justify-center cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs">
          {/* Employee Hero Card with Status Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-line bg-bg-raised/40">
            <div className="flex items-center gap-3 min-w-0">
              {contract.employee_avatar ? (
                <img
                  src={contract.employee_avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-line shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent/20 text-accent font-serif font-bold text-sm flex items-center justify-center shrink-0">
                  {(contract.employee_name || 'E').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-sm font-bold text-ink block truncate">
                  {contract.employee_name || 'Contract Beneficiary'}
                </span>
                <span className="text-[11px] text-ink-soft block truncate">
                  {contract.job_position_title || 'Position not specified'} · {contract.department_name || 'No department'}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border border-accent/30 bg-accent-soft text-accent shrink-0">
              {contract.status}
            </span>
          </div>

          {/* Key Terms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-bg flex flex-col justify-between">
              <span className="text-[11px] text-ink-soft block mb-1">Contract Wage</span>
              <div>
                <span className="font-sans text-xl font-bold text-ink tracking-tight block">
                  {formatCurrency(contract.wage)}
                </span>
                <span className="text-[11px] text-ink-soft capitalize">
                  Paid {contract.wage_type === 'hourly' ? 'Hourly' : 'Monthly'}
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-bg flex flex-col justify-between">
              <span className="text-[11px] text-ink-soft block mb-1">Salary Structure</span>
              <div>
                <span className="font-semibold text-ink text-sm block leading-snug">
                  {contract.salary_structure_name || 'Standard'}
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-bg flex flex-col justify-between">
              <span className="text-[11px] text-ink-soft block mb-1">Working Schedule</span>
              <div>
                <span className="font-semibold text-ink text-sm block leading-snug">
                  {contract.working_schedule_name || 'Standard 40h'}
                </span>
              </div>
            </div>
          </div>

          {/* Validity & Period */}
          <div className="border border-line rounded-xl p-4 bg-bg space-y-3">
            <h4 className="font-semibold text-ink mb-2 text-xs uppercase tracking-wider m-0">
              Validity & Period
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-ink-soft block mb-0.5">Start Date</span>
                <span className="font-medium text-ink text-sm">
                  {formatDate(contract.start_date)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-soft block mb-0.5">End Date</span>
                <span className="font-medium text-ink text-sm">
                  {formatDate(contract.end_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes (only shown if present) */}
          {contract.notes && contract.notes.trim() !== '' && (
            <div className="border border-line rounded-xl p-4 bg-bg space-y-1.5">
              <h4 className="font-semibold text-ink mb-1 text-xs uppercase tracking-wider m-0">
                Notes
              </h4>
              <p className="text-xs text-ink-soft leading-relaxed m-0 whitespace-pre-line">
                {contract.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-2.5 bg-bg-raised/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(contract);
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
          >
            Edit Agreement
          </button>
        </div>
      </div>
    </div>
  );
};
