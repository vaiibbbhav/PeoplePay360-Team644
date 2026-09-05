import React from 'react';
import { useEmployeeContracts, type EmployeeContract } from '../queries/useEmployees';
import { StatGrid } from '@/components/ui/StatCard';

type ContractsTabProps = {
  employeeId: string;
};

export const ContractsTab: React.FC<ContractsTabProps> = ({ employeeId }) => {
  const { data: contracts = [], isLoading, error } = useEmployeeContracts(employeeId);

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const renderStatusBadge = (status: EmployeeContract['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-accent/30 bg-accent-soft text-accent">
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-line bg-bg-raised text-ink-soft">
            Expired
          </span>
        );
      case 'terminated':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-line bg-bg-raised text-over-red">
            Terminated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-line bg-bg-raised text-ink-soft capitalize">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-bg border border-line rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-ink-soft">Loading employment contracts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg border border-line rounded-2xl p-8 text-center">
        <p className="text-xs text-over-red">Failed to load contracts for this employee.</p>
      </div>
    );
  }

  const activeContract = contracts.find((c) => c.status === 'active') || contracts[0];

  return (
    <div className="space-y-6">
      {/* Overview Metric Bar */}
      <StatGrid
        columns={3}
        items={[

          {
            label: 'Agreed Wage',
            value: activeContract ? (
              <span>
                {formatCurrency(activeContract.wage)}
                <span className="text-xs text-ink-soft font-normal ml-1">
                  / {activeContract.wage_type || 'month'}
                </span>
              </span>
            ) : (
              '—'
            ),
          },
          { label: 'Total Contracts', value: contracts.length },
        ]}
      />

      {/* Contracts Table */}
      <div className="bg-bg border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-ink">
              Employment Contracts
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Historical and active contracts driving payroll context, schedule, and wage computations.
            </p>
          </div>
          <span className="text-xs text-ink-soft px-2.5 py-1 rounded-md border border-line bg-bg-raised">
            {contracts.length} Records
          </span>
        </div>

        {contracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl border border-line bg-bg-raised flex items-center justify-center text-ink-soft text-lg font-serif">
              §
            </div>
            <h4 className="font-serif text-base font-semibold text-ink mb-1">
              No Contracts Found
            </h4>
            <p className="text-xs text-ink-soft max-w-sm mx-auto">
              No employment contracts are currently linked to this employee profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-bg-raised/40 text-ink-soft font-medium">
                  <th className="py-3 px-6">Contract Name</th>
                  <th className="py-3 px-4">Salary Structure</th>
                  <th className="py-3 px-4 text-right">Wage</th>
                  <th className="py-3 px-4 text-center">Frequency</th>
                  <th className="py-3 px-6">Validity Period</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-bg-raised/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-ink whitespace-nowrap">
                      {contract.name}
                    </td>
                    <td className="py-3.5 px-4 text-ink-soft whitespace-nowrap">
                      {contract.salary_structure_name || 'Standard Structure'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-ink whitespace-nowrap">
                      {formatCurrency(contract.wage)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-ink-soft capitalize whitespace-nowrap">
                      {contract.wage_type || 'Monthly'}
                    </td>
                    <td className="py-3.5 px-6 text-ink-soft whitespace-nowrap">
                      {formatDate(contract.start_date)} –{' '}
                      {contract.end_date ? formatDate(contract.end_date) : 'Present (Ongoing)'}
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      {renderStatusBadge(contract.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
