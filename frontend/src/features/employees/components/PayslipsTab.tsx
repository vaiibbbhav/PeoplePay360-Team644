import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useEmployeePayslips } from '../queries/useEmployees';
import { usePayslipDetail } from '@/features/compensation/queries/useEmployeePayslips';
import { MonthlyPayslipDocument } from '@/features/compensation/components/MonthlyPayslipDocument';
import { StatGrid } from '@/components/ui/StatCard';

type PayslipsTabProps = {
  employeeId: string;
};

export const PayslipsTab: React.FC<PayslipsTabProps> = ({ employeeId }) => {
  const { data: payslips = [], isLoading, error } = useEmployeePayslips(employeeId);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const { data: activePayslipDetail, isLoading: isDetailLoading } =
    usePayslipDetail(selectedPayslipId);

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

  if (isLoading) {
    return (
      <div className="bg-bg border border-line rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-ink-soft">Loading payslip records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg border border-line rounded-2xl p-8 text-center">
        <p className="text-xs text-over-red">Failed to load payslips for this employee.</p>
      </div>
    );
  }

  const totalNet = payslips.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
  const latestPayslip = payslips.length > 0 ? payslips[0] : null;

  return (
    <div className="space-y-6">
      {/* Overview Metric Bar */}
      <StatGrid
        columns={3}
        items={[
          { label: 'Total Payslips', value: payslips.length },
          { label: 'Total Net Pay', value: formatCurrency(totalNet) },
          {
            label: 'Latest Period',
            value: latestPayslip
              ? `${formatDate(latestPayslip.period_start)} – ${formatDate(latestPayslip.period_end)}`
              : 'None',
          },
        ]}
      />

      {/* Payslips Table */}
      <div className="bg-bg border border-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-sans text-base font-semibold text-ink">Payroll Settlements</h3>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/compensation"
              className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-medium transition-colors"
              title="Go to full Compensation Hub"
            >
              <span>Compensation Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            {/* <span className="text-xs text-ink-soft px-2.5 py-1 rounded-md border border-line bg-bg-raised">
              {payslips.length} Records
            </span> */}
          </div>
        </div>

        {payslips.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl border border-line bg-bg-raised flex items-center justify-center text-ink-soft text-lg font-sans">
              ₹
            </div>
            <h4 className="font-sans text-base font-semibold text-ink mb-1">
              No Payslips Generated Yet
            </h4>
            <p className="text-xs text-ink-soft max-w-sm mx-auto">
              Payslips will be generated automatically when monthly payruns are executed and
              validated for this employee.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-bg-raised/40 text-ink-soft font-medium">
                  <th className="py-3 px-6">Pay Period</th>
                  <th className="py-3 px-4">Worked Days</th>
                  <th className="py-3 px-4 text-right">Basic Salary</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-6 text-right font-semibold text-ink">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-bg-raised/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPayslipId(payslip.id)}
                        className="inline-flex items-center gap-1.5 text-accent hover:underline group text-xs font-medium cursor-pointer text-left"
                        title="Open payslip modal"
                      >
                        <span>
                          {formatDate(payslip.period_start)} – {formatDate(payslip.period_end)}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-ink-soft whitespace-nowrap">
                      {payslip.worked_days} days
                    </td>
                    <td className="py-3.5 px-4 text-right text-ink whitespace-nowrap">
                      {formatCurrency(payslip.basic_salary)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-ink whitespace-nowrap">
                      {formatCurrency(payslip.gross_salary)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-over-red whitespace-nowrap">
                      -{formatCurrency(payslip.total_deductions)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-semibold text-ink whitespace-nowrap">
                      {formatCurrency(payslip.net_salary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Salary Slip Document Modal */}
      {selectedPayslipId &&
        (activePayslipDetail ? (
          <MonthlyPayslipDocument
            payslip={activePayslipDetail}
            onClose={() => setSelectedPayslipId(null)}
          />
        ) : isDetailLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <div className="bg-bg border border-line rounded-2xl p-6 flex items-center gap-3 shadow-lg">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-ink-soft">Loading salary slip document...</span>
            </div>
          </div>
        ) : null)}
    </div>
  );
};
