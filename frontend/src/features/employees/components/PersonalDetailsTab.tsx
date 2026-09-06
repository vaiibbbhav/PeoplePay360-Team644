import React from 'react';
import type { EmployeeHubDetails } from '../queries/useEmployees';

type PersonalDetailsTabProps = {
  employee: EmployeeHubDetails;
};

export const PersonalDetailsTab: React.FC<PersonalDetailsTabProps> = ({ employee }) => {
  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Identity & Basic Information */}
      <div className="bg-bg border border-line rounded-2xl p-4 sm:p-8">
        <h3 className="font-serif text-lg font-semibold text-ink mb-6 pb-3 border-b border-line">
          Identity & Contact
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          <div>
            <span className="text-xs text-ink-soft block mb-1">First Name</span>
            <span className="text-sm font-medium text-ink">{employee.first_name}</span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Last Name</span>
            <span className="text-sm font-medium text-ink">{employee.last_name}</span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Work Email</span>
            <span className="text-sm font-medium text-ink break-all">{employee.email}</span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Primary Phone</span>
            <span className="text-sm font-medium text-ink">{employee.phone || '—'}</span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Date Of Birth</span>
            <span className="text-sm font-medium text-ink">
              {formatDate(employee.date_of_birth)}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Gender</span>
            <span className="text-sm font-medium text-ink capitalize">
              {employee.gender || '—'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">
              Identification Number (Tax ID / SSN)
            </span>
            <span className="text-sm font-medium text-ink">
              {employee.identification_number || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Banking & Settlement Information */}
      <div className="bg-bg border border-line rounded-2xl p-4 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-6">
          <h3 className="font-sans text-lg font-semibold text-ink">
            Banking & Payroll Payout Details
          </h3>
          <span className="text-xs text-ink-soft">Direct Deposit Destination</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          <div>
            <span className="text-xs text-ink-soft block mb-1">Bank Name</span>
            <span className="text-sm font-medium text-ink">
              {employee.bank_name || 'Not configured'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">Bank Account Number</span>
            <span className="text-sm font-medium text-ink">
              {employee.bank_account_number
                ? `•••• •••• ${employee.bank_account_number.slice(-4)}`
                : 'Not configured'}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-soft block mb-1">
              Bank Routing Code / IFSC / SWIFT
            </span>
            <span className="text-sm font-medium text-ink">
              {employee.bank_routing_code || 'Not configured'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
