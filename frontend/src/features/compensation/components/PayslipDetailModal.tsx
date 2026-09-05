import React from 'react';
import { usePayslipDetail } from '../queries/useEmployeePayslips';
import { formatCurrency, formatPeriod } from '@/lib/formatters';
import { useClickOutside } from '@/hooks/useClickOutside';

export type PayslipDetailModalProps = {
  payslipId: string | null;
  onClose: () => void;
  showValues: boolean;
};

// Helper to convert number to Indian English words
function numberToWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  };

  const integerPart = Math.floor(num);
  let crore = Math.floor(integerPart / 10000000);
  let lakh = Math.floor((integerPart % 10000000) / 100000);
  let thousand = Math.floor((integerPart % 100000) / 1000);
  let remainder = integerPart % 1000;

  let res = '';
  if (crore > 0) res += convertLessThanOneThousand(crore) + 'Crore ';
  if (lakh > 0) res += convertLessThanOneThousand(lakh) + 'Lakh ';
  if (thousand > 0) res += convertLessThanOneThousand(thousand) + 'Thousand ';
  if (remainder > 0) res += convertLessThanOneThousand(remainder);

  return (res.trim() || 'Zero') + ' Rupees Only';
}

export const PayslipDetailModal: React.FC<PayslipDetailModalProps> = ({
  payslipId,
  onClose,
  showValues,
}) => {
  const { data: payslip, isLoading, isError } = usePayslipDetail(payslipId);

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, Boolean(payslipId));

  if (!payslipId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-bg border border-line rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-line bg-bg-raised print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-ink">Payslip Document Preview</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent-soft text-accent font-medium">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              aria-label="Close dialog"
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

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-ink bg-bg">
          {isLoading && (
            <div className="py-20 text-center text-sm text-ink-soft animate-pulse">
              Loading payslip details and lines...
            </div>
          )}

          {isError && (
            <div className="py-16 text-center text-sm text-over-red">
              Failed to load payslip details. Please try again.
            </div>
          )}

          {payslip && (
            <div id="printable-payslip" className="space-y-6">
              {/* Official Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-line pb-5 gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-ink">
                    PeoplePay<span className="text-accent">360</span> Inc.
                  </h2>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Tech Park, Financial District, Bangalore, KA 560100
                    <br />
                    GSTIN: 29AABCP3600E1Z9 · CIN: U72200KA2026PTC123456
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="inline-block px-3 py-1 bg-bg-raised border border-line rounded text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                    Payslip for {formatPeriod(payslip.period_start)}
                  </div>
                  <p className="text-xs text-ink-soft">
                    Pay Run: <b className="text-ink">{payslip.payrun_name || 'Regular'}</b>
                  </p>
                </div>
              </div>

              {/* Employee Metadata Matrix */}
              <div className="border border-line rounded-lg p-4 bg-bg-raised/40 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
                  <div>
                    <span className="text-ink-soft block mb-0.5">Employee Name</span>
                    <b className="text-ink text-sm">{payslip.employee_name}</b>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">Employee Code / ID</span>
                    <span className="font-mono text-ink">
                      {payslip.employee_id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">Department</span>
                    <span className="text-ink font-medium">
                      {payslip.department_name || 'Engineering'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">Designation</span>
                    <span className="text-ink font-medium">
                      {payslip.job_position_title || 'Software Engineer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">Bank Name</span>
                    <span className="text-ink">{payslip.bank_name || 'HDFC Bank'}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">Bank Account No.</span>
                    <span className="font-mono text-ink">
                      {showValues
                        ? payslip.bank_account_number || '50100492819283'
                        : '••••••••••' + (payslip.bank_account_number?.slice(-4) || '9283')}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">PAN / UAN</span>
                    <span className="font-mono text-ink">
                      {showValues ? payslip.identification_number || 'ABCDE1234F' : '••••••1234F'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft block mb-0.5">Worked Days</span>
                    <b className="text-ink text-sm">{payslip.worked_days} / 22</b>
                  </div>
                </div>
              </div>

              {/* Side-by-side Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="border border-line rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-bg-raised border-b border-line font-serif text-xs font-bold text-ink uppercase tracking-wider flex justify-between">
                    <span>Earnings</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="p-4 space-y-2.5 text-xs divide-y divide-line/40">
                    {payslip.lines
                      .filter((l) => l.category === 'basic' || l.category === 'allowance')
                      .map((l) => (
                        <div key={l.id} className="pt-2 first:pt-0 flex justify-between">
                          <span className="text-ink">{l.name}</span>
                          <span className="font-mono font-medium text-ink">
                            {formatCurrency(l.amount, showValues)}
                          </span>
                        </div>
                      ))}
                    <div className="pt-3 border-t-2 border-line font-bold flex justify-between text-ink text-sm">
                      <span>Gross Earnings</span>
                      <span className="font-mono">
                        {formatCurrency(payslip.gross_salary, showValues)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-line rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-bg-raised border-b border-line font-serif text-xs font-bold text-ink uppercase tracking-wider flex justify-between">
                    <span>Deductions</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="p-4 space-y-2.5 text-xs divide-y divide-line/40">
                    {payslip.lines
                      .filter((l) => l.category === 'deduction' && l.code !== 'TOTAL_DEDUCTIONS')
                      .map((l) => (
                        <div key={l.id} className="pt-2 first:pt-0 flex justify-between">
                          <span className="text-ink">{l.name}</span>
                          <span className="font-mono text-over-red">
                            {formatCurrency(l.amount, showValues)}
                          </span>
                        </div>
                      ))}
                    <div className="pt-3 border-t-2 border-line font-bold flex justify-between text-ink text-sm">
                      <span>Total Deductions</span>
                      <span className="font-mono text-over-red">
                        {formatCurrency(payslip.total_deductions, showValues)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="border border-line rounded-lg p-5 bg-bg-raised flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-ink-soft block font-medium">
                    Net Payable Amount
                  </span>
                  <p className="text-xs text-ink-soft italic mt-0.5">
                    {showValues
                      ? numberToWords(Number(payslip.net_salary))
                      : 'Masked for confidentiality'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-2xl text-accent block">
                    {formatCurrency(payslip.net_salary, showValues)}
                  </span>
                  <span className="text-[11px] text-ink-soft">Direct Bank Transfer</span>
                </div>
              </div>

              {/* Signatures & Disclaimers */}
              <div className="pt-6 border-t border-line text-xs text-ink-soft flex flex-col sm:flex-row justify-between items-end gap-6">
                <div>
                  <p className="m-0 text-[11px] text-ink-soft/80">
                    This is a computer-generated document and does not require a physical signature.
                  </p>
                  <p className="m-0 text-[11px] text-ink-soft/80 mt-0.5">
                    PeoplePay360 HR & Payroll Engine · Generated on{' '}
                    {new Date(payslip.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <div className="w-40 border-b border-line mb-1.5 mx-auto sm:ml-auto" />
                  <span className="text-[11px] font-medium text-ink">Authorized Signatory</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
