import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Printer, X, FileText } from 'lucide-react';

export type Form12BBProps = {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  panNumber?: string;
  designation?: string;
  financialYear: string;
  regime: 'new' | 'old';
  rentPaid: number;
  landlordName?: string;
  landlordPan?: string;
  landlordAddress?: string;
  homeLoanInterest: number;
  lenderName?: string;
  lenderPan?: string;
  ltaAmount: number;
  section80CItems: Array<{ label: string; amount: number }>;
  section80DAmount: number;
  section80CCD1BAmount: number;
  otherDeductionsItems: Array<{ label: string; amount: number }>;
};

export const Form12BBDocumentModal: React.FC<Form12BBProps> = ({
  isOpen,
  onClose,
  employeeName,
  panNumber = 'ABCDE1234F',
  designation = 'Staff Member',
  financialYear,
  regime,
  rentPaid,
  landlordName = 'N/A',
  landlordPan = 'N/A',
  landlordAddress = 'N/A',
  homeLoanInterest,
  lenderName = 'N/A',
  lenderPan = 'N/A',
  ltaAmount,
  section80CItems,
  section80DAmount,
  section80CCD1BAmount,
  otherDeductionsItems,
}) => {
  if (!isOpen) return null;

  const total80C = section80CItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOther = otherDeductionsItems.reduce((acc, curr) => acc + curr.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-bg border border-line rounded-2xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 my-8 print:border-none print:shadow-none print:m-0 print:p-4 text-ink">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans text-xl font-bold text-ink tracking-tight">
                Income Tax Form 12BB (Rule 26C)
              </h2>
              <p className="text-xs text-ink-soft">
                Statement of claims by an employee for deduction of tax under section 192
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-bg-raised cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Form 12BB Content */}
        <div className="space-y-6 text-xs sm:text-sm font-sans">
          {/* Header */}
          <div className="text-center border-b border-line pb-4 space-y-1">
            <h1 className="font-sans text-lg sm:text-xl font-bold uppercase tracking-wider text-ink">
              FORM NO. 12BB
            </h1>
            <p className="text-xs text-ink-soft font-mono">[See rule 26C]</p>
            <p className="text-xs text-ink-soft max-w-lg mx-auto">
              Statement of claims by an employee for deduction of tax under section 192 of the
              Income-tax Act, 1961
            </p>
          </div>

          {/* Employee Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-bg-raised border border-line text-xs">
            <div>
              <span className="text-ink-soft block font-mono text-[11px] uppercase">
                1. Name of Employee
              </span>
              <span className="font-bold text-ink mt-0.5 block">{employeeName}</span>
            </div>
            <div>
              <span className="text-ink-soft block font-mono text-[11px] uppercase">
                2. Permanent Account No. (PAN)
              </span>
              <span className="font-mono font-bold text-ink mt-0.5 block">{panNumber}</span>
            </div>
            <div>
              <span className="text-ink-soft block font-mono text-[11px] uppercase">
                3. Designation / Role
              </span>
              <span className="font-medium text-ink mt-0.5 block">{designation}</span>
            </div>
            <div>
              <span className="text-ink-soft block font-mono text-[11px] uppercase">
                4. Financial Year
              </span>
              <span className="font-bold text-accent mt-0.5 block">{financialYear}</span>
            </div>
          </div>

          {/* Regime Banner */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-line bg-bg text-xs">
            <span className="text-ink-soft">Declared Tax Regime for TDS:</span>
            <span className="font-bold uppercase tracking-wider text-accent">
              {regime === 'new'
                ? 'New Tax Regime (Section 115BAC)'
                : 'Old Tax Regime (With Chapter VI-A Deductions)'}
            </span>
          </div>

          {/* Table of Claims */}
          <div className="border border-line rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-bg-raised text-ink-soft font-semibold">
                  <th className="py-2.5 px-3 text-center w-12">Sl. No.</th>
                  <th className="py-2.5 px-3 text-left">Nature of Claim</th>
                  <th className="py-2.5 px-3 text-right w-36">Amount (Rs.)</th>
                  <th className="py-2.5 px-3 text-left w-56">Evidence Details / Particulars</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {/* 1. House Rent Allowance */}
                <tr className="hover:bg-bg-raised/40">
                  <td className="py-3 px-3 text-center font-mono font-bold text-ink">1</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-ink block">House Rent Allowance (HRA)</span>
                    <span className="text-ink-soft text-[11px]">
                      Rent paid to the landlord during the financial year
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-ink">
                    {formatCurrency(rentPaid, true)}
                  </td>
                  <td className="py-3 px-3 text-ink-soft text-[11px] space-y-0.5">
                    <div>
                      <b>Landlord:</b> {landlordName}
                    </div>
                    <div>
                      <b>Landlord PAN:</b> {landlordPan}
                    </div>
                    <div>
                      <b>Address:</b> {landlordAddress}
                    </div>
                  </td>
                </tr>

                {/* 2. Leave Travel Concession */}
                <tr className="hover:bg-bg-raised/40">
                  <td className="py-3 px-3 text-center font-mono font-bold text-ink">2</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-ink block">
                      Leave Travel Concession / Assistance
                    </span>
                    <span className="text-ink-soft text-[11px]">
                      Travel expenditure incurred within India (Section 10(5))
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-ink">
                    {formatCurrency(ltaAmount, true)}
                  </td>
                  <td className="py-3 px-3 text-ink-soft text-[11px]">
                    {ltaAmount > 0
                      ? 'Travel boarding tickets and proof vouchers attached'
                      : 'Nil declared'}
                  </td>
                </tr>

                {/* 3. Housing Loan Interest */}
                <tr className="hover:bg-bg-raised/40">
                  <td className="py-3 px-3 text-center font-mono font-bold text-ink">3</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-ink block">
                      Deduction of Interest on Borrowing
                    </span>
                    <span className="text-ink-soft text-[11px]">
                      Interest payable on loan for self-occupied / let-out property (u/s 24(b))
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-ink">
                    {formatCurrency(homeLoanInterest, true)}
                  </td>
                  <td className="py-3 px-3 text-ink-soft text-[11px] space-y-0.5">
                    <div>
                      <b>Lender:</b> {lenderName}
                    </div>
                    <div>
                      <b>Lender PAN:</b> {lenderPan}
                    </div>
                    <div>
                      <b>Certificate:</b> Provisional Interest Certificate
                    </div>
                  </td>
                </tr>

                {/* 4. Chapter VI-A: 80C */}
                <tr className="hover:bg-bg-raised/40">
                  <td className="py-3 px-3 text-center font-mono font-bold text-ink" rowSpan={2}>
                    4
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-ink block">
                      Deductions under Chapter VI-A (Section 80C & 80CCC)
                    </span>
                    <div className="mt-1 space-y-0.5 text-[11px] text-ink-soft">
                      {section80CItems.filter((i) => i.amount > 0).length === 0 ? (
                        <span>EPF / Standard deductions</span>
                      ) : (
                        section80CItems
                          .filter((i) => i.amount > 0)
                          .map((i) => (
                            <div key={i.label} className="flex justify-between max-w-sm">
                              <span>• {i.label}</span>
                              <span className="font-mono">{formatCurrency(i.amount, true)}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-ink align-top">
                    {formatCurrency(total80C, true)}
                  </td>
                  <td className="py-3 px-3 text-ink-soft text-[11px] align-top">
                    Max statutory cap under Section 80CCE is Rs. 1,50,000/-
                  </td>
                </tr>

                {/* 4b. Other Chapter VI-A items (80D, 80CCD, etc.) */}
                <tr className="hover:bg-bg-raised/40">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-ink block">
                      Other Deductions under Chapter VI-A
                    </span>
                    <div className="mt-1 space-y-0.5 text-[11px] text-ink-soft">
                      {section80DAmount > 0 && (
                        <div className="flex justify-between max-w-sm">
                          <span>• Section 80D (Health Insurance / Mediclaim)</span>
                          <span className="font-mono">
                            {formatCurrency(section80DAmount, true)}
                          </span>
                        </div>
                      )}
                      {section80CCD1BAmount > 0 && (
                        <div className="flex justify-between max-w-sm">
                          <span>• Section 80CCD(1B) (Voluntary NPS Contribution)</span>
                          <span className="font-mono">
                            {formatCurrency(section80CCD1BAmount, true)}
                          </span>
                        </div>
                      )}
                      {otherDeductionsItems
                        .filter((i) => i.amount > 0)
                        .map((i) => (
                          <div key={i.label} className="flex justify-between max-w-sm">
                            <span>• {i.label}</span>
                            <span className="font-mono">{formatCurrency(i.amount, true)}</span>
                          </div>
                        ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-ink align-top">
                    {formatCurrency(section80DAmount + section80CCD1BAmount + totalOther, true)}
                  </td>
                  <td className="py-3 px-3 text-ink-soft text-[11px] align-top">
                    Receipts and policy premium receipts registered with employer
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statutory Verification Declaration */}
          <div className="p-4 rounded-xl border border-line bg-bg-raised space-y-3">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
              Verification Declaration
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed italic">
              I, <strong className="text-ink not-italic">{employeeName}</strong>, do hereby certify
              that what is stated above is true to the best of my knowledge and belief. I undertake
              to indemnify the employer for any short-deduction or penalty arising out of incorrect
              or incomplete declarations provided by me.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-line/60 text-xs">
              <div>
                <span className="text-ink-soft block font-mono text-[11px]">
                  Place of Submission: India
                </span>
                <span className="text-ink-soft block font-mono text-[11px]">
                  Date:{' '}
                  {new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="text-right">
                <div className="h-10 flex items-center justify-end">
                  <span className="font-sans italic text-accent font-semibold">{employeeName}</span>
                </div>
                <div className="w-48 border-t border-ink/40 pt-1 text-ink font-semibold text-xs text-right">
                  (Signature of the Employee)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end border-t border-line pt-4 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
