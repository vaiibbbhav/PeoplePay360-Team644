import React from 'react';
import { useCompanyComplianceRoster } from '../queries/useDocuments';

type CompanyComplianceTableProps = {
  onEditPolicy: (policyId: string) => void;
  onDeletePolicy: (policyId: string, title: string) => void;
};

export const CompanyComplianceTable: React.FC<CompanyComplianceTableProps> = ({
  onEditPolicy,
  onDeletePolicy,
}) => {
  const { data: roster = [], isLoading, error } = useCompanyComplianceRoster();

  if (isLoading) {
    return (
      <div className="border border-line rounded-2xl p-12 flex flex-col items-center justify-center gap-3 bg-bg">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-ink-soft">Loading compliance audit metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-line rounded-2xl p-8 text-center bg-bg text-over-red text-xs">
        Failed to load company compliance metrics.
      </div>
    );
  }

  return (
    <div className="border border-line rounded-2xl overflow-hidden bg-bg">
      <div className="px-4 sm:px-6 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-ink m-0">
            Company-Wide Policy Sign-off Audit
          </h3>
          <p className="text-xs text-ink-soft mt-0.5 mb-0">
            Track employee acceptance rates and manage published regulatory documents.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-accent-soft text-accent shrink-0 self-start sm:self-auto">
          {roster.length} Documents Monitored
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead>
            <tr className="border-b border-line bg-bg-raised/70 text-ink-soft font-semibold text-xs">
              <th className="py-3 px-6 font-semibold">Policy Name & Ref</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Version</th>
              <th className="py-3 px-4 font-semibold">Scope</th>
              <th className="py-3 px-6 font-semibold">Accepted / Total</th>
              <th className="py-3 px-6 font-semibold">Compliance Rate</th>
              <th className="py-3 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {roster.map((item) => (
              <tr key={item.policyId} className="hover:bg-bg-raised/30 transition-colors">
                <td className="py-3.5 px-6">
                  <span className="font-semibold text-ink block">{item.title}</span>
                  <span className="text-[11px] text-ink-soft font-mono">{item.code}</span>
                </td>

                <td className="py-3.5 px-4 capitalize text-ink-soft font-medium">
                  {item.category}
                </td>

                <td className="py-3.5 px-4 font-mono text-ink">
                  v{item.version}
                </td>

                <td className="py-3.5 px-4">
                  {item.isMandatory ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-over-red border border-red-500/20">
                      Mandatory
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-bg-raised text-ink-soft border border-line">
                      Advisory
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-6 font-medium text-ink">
                  {item.acceptedCount} / {item.totalUsers} users
                </td>

                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 w-24 bg-bg-raised rounded-full h-2 overflow-hidden border border-line">
                      <div
                        className={`h-full rounded-full ${
                          item.complianceRate === 100
                            ? 'bg-emerald-500'
                            : item.complianceRate >= 50
                            ? 'bg-accent'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.complianceRate}%` }}
                      />
                    </div>
                    <span className="font-semibold text-ink text-xs min-w-[32px]">
                      {item.complianceRate}%
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditPolicy(item.policyId)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePolicy(item.policyId, item.title)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-line/50 bg-transparent text-over-red hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Delete
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
