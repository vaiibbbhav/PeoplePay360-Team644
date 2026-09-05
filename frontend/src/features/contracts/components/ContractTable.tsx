import React from 'react';
import type { ContractItem, ContractStatus } from '../queries/useContracts';

type ContractTableProps = {
  contracts: ContractItem[];
  onSelect: (contract: ContractItem) => void;
  onEdit: (contract: ContractItem) => void;
};

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onSelect,
  onEdit,
}) => {
  const formatDate = (val?: string | null) => {
    if (!val) return 'Indefinite';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const formatCurrency = (val: string | number, type: string) => {
    const num = Number(val) || 0;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
    return `${formatted} / ${type === 'hourly' ? 'hr' : 'mo'}`;
  };

  const renderStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border border-accent/40 bg-accent-soft text-accent">
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-line bg-bg-raised text-ink-soft">
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-red-500/30 bg-red-500/10 text-over-red">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-line bg-bg-raised text-ink-soft">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="border border-line rounded-2xl overflow-hidden bg-bg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-bg-raised text-ink-soft uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Employee</th>
              <th className="py-3 px-4 font-semibold">Contract Ref</th>
              <th className="py-3 px-4 font-semibold">Wage & Rate</th>
              <th className="py-3 px-4 font-semibold">Duration</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className="hover:bg-bg-raised/40 transition-colors cursor-pointer"
                onClick={() => onSelect(contract)}
              >
                {/* Employee */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    {contract.employee_avatar ? (
                      <img
                        src={contract.employee_avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-line"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent/20 text-accent font-sans font-bold text-xs flex items-center justify-center">
                        {(contract.employee_name || 'E').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-ink block">
                        {contract.employee_name || 'Unnamed Employee'}
                      </span>
                      <span className="text-[11px] text-ink-soft block">
                        {contract.job_position_title || contract.department_name || contract.employee_email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Contract Name */}
                <td className="py-3.5 px-4 font-medium text-ink">
                  {contract.name}
                </td>

                {/* Wage */}
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-ink block">
                    {formatCurrency(contract.wage, contract.wage_type)}
                  </span>
                  <span className="text-[10px] text-ink-soft capitalize">
                    {contract.wage_type} baseline
                  </span>
                </td>

                {/* Duration */}
                <td className="py-3.5 px-4">
                  <span className="text-ink block">
                    {formatDate(contract.start_date)}
                  </span>
                  <span className="text-[10px] text-ink-soft block">
                    to {formatDate(contract.end_date)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  {renderStatusBadge(contract.status)}
                </td>

                {/* Actions */}
                <td
                  className="py-3.5 px-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelect(contract)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(contract)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-accent-soft text-accent hover:bg-accent hover:text-accent-ink transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
