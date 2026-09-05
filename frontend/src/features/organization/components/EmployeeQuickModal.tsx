import React from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';

type EmployeeQuickModalProps = {
  employee: EmployeeListItem | null;
  isOpen: boolean;
  onClose: () => void;
  directReportsCount: number;
};

export const EmployeeQuickModal: React.FC<EmployeeQuickModalProps> = ({
  employee,
  isOpen,
  onClose,
  directReportsCount,
}) => {
  if (!isOpen || !employee) return null;

  const initials =
    `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-bg-raised border border-line rounded-2xl shadow-xl overflow-hidden p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-bg-sunken transition-colors cursor-pointer"
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

        {/* Profile Card Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-line">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent font-bold text-lg flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-accent block">
              {employee.department_name || 'General Staff'}
            </span>
            <h3 className="text-xl font-sans text-ink font-medium tracking-tight mt-0.5 truncate">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-xs text-ink-soft truncate mt-0.5">
              {employee.job_position_title || 'Team Member'}
            </p>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="my-5 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-line-subtle">
            <span className="text-ink-faint">Work Email</span>
            <span className="font-mono text-ink select-all">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center justify-between py-1.5 border-b border-line-subtle">
              <span className="text-ink-faint">Work Phone</span>
              <span className="font-mono text-ink">{employee.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-1.5 border-b border-line-subtle">
            <span className="text-ink-faint">Reports To</span>
            <span className="font-medium text-ink">
              {employee.manager_name || 'Executive Leadership / Board'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-line-subtle">
            <span className="text-ink-faint">Direct Reports</span>
            <span className="font-mono font-semibold text-accent">
              {directReportsCount} {directReportsCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-line-subtle">
            <span className="text-ink-faint">Joining Date</span>
            <span className="font-mono text-ink">
              {new Date(employee.date_of_joining).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Action Link */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to={`/employees/${employee.id}`}
            className="w-full text-center py-2 px-4 rounded-xl text-xs font-medium bg-ink text-bg hover:opacity-90 transition-opacity cursor-pointer"
          >
            View Full Employee Profile →
          </Link>
        </div>
      </div>
    </div>
  );
};
