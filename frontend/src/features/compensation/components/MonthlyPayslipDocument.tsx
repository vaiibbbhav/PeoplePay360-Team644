import React from 'react';
import type { PayslipDetail } from '../queries/useEmployeePayslips';

export type MonthlyPayslipDocumentProps = {
  payslip: PayslipDetail;
  onClose: () => void;
};

// Convert number to Indian currency words
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

  return (res.trim() || 'Zero') + ' Rupees Only.';
}

export const MonthlyPayslipDocument: React.FC<MonthlyPayslipDocumentProps> = ({
  payslip,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const periodDate = new Date(payslip.period_start);
  const monthName = periodDate.toLocaleDateString('en-US', { month: 'long' });
  const yearNum = periodDate.getFullYear();

  const earnings = payslip.lines.filter(
    (l) => l.category === 'basic' || l.category === 'allowance',
  );
  const deductions = payslip.lines.filter(
    (l) => l.category === 'deduction' && l.code !== 'TOTAL_DEDUCTIONS',
  );

  const maxRows = Math.max(earnings.length, deductions.length, 1);
  const netAmount = Math.round(Number(payslip.net_salary) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-black border border-neutral-300 rounded-lg max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Modal Controls Toolbar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-300 bg-neutral-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs sm:text-sm font-bold text-neutral-800">
              Monthly Salary Slip ({monthName} - {yearNum})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-purple-800 text-white hover:bg-purple-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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
              className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors cursor-pointer"
              aria-label="Close"
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

        {/* Printable Paper Document (Pure B&W Table Structure matching Image 2) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white text-black font-sans text-xs">
          <div id="monthly-salary-slip" className="border border-black max-w-3xl mx-auto">
            {/* Top Company Header */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-3 border-r border-black p-4 flex items-center justify-center">
                {/* Logo Box */}
                <div className="w-16 h-16 border border-neutral-300 rounded flex items-center justify-center text-center text-[10px] text-neutral-500 font-serif font-bold p-1">
                  PeoplePay 360
                </div>
              </div>
              <div className="col-span-9 p-4 text-center">
                <h1 className="text-xl sm:text-2xl font-sans font-medium text-black m-0">
                  Anchorage Technologies Pvt. Ltd.
                </h1>
                <p className="text-[11px] leading-relaxed text-neutral-800 mt-1 mb-0.5">
                  <b>Office Address :</b> 3rd Floor, Le Parc Richmonde, Richmond Rd, Shanthala
                  Nagar, Bengaluru, Karnataka 560025, Bangalore , Karnataka, India
                </p>
                <p className="text-[11px] font-bold text-black m-0">Business Unit : NA</p>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="border-b border-black py-2 text-center bg-white">
              <h2 className="text-base sm:text-lg font-normal text-black m-0">
                Salary Slip for {monthName} - {yearNum}
              </h2>
            </div>

            {/* Employee Metadata Matrix (Bordered Table per screenshot) */}
            <div className="border-b border-black text-[11px]">
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Employee Name : </span>
                  <b>{payslip.employee_name}</b>
                </div>
                <div className="col-span-3 p-1.5 pl-2">
                  <span>Employee Type : </span>
                  <b>Full-Time / Regular</b>
                </div>
                <div className="col-span-3 p-1.5 pl-2">
                  <span>Employee Code : </span>
                  <b>{payslip.employee_id.slice(0, 8).toUpperCase()}</b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Designation: </span>
                  <b>{payslip.job_position_title || 'SOFTWARE ENGINEER'}</b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Duration: </span>
                  <b>
                    1st {monthName}, {yearNum} to 31st {monthName}, {yearNum}
                  </b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Department: </span>
                  <b>
                    {payslip.department_name
                      ? payslip.department_name.toUpperCase()
                      : 'ENGINEERING'}
                  </b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>No of Days in the Month: </span>
                  <b>31</b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Date of Joining: </span>
                  <b>01-04-2026</b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Working Days: </span>
                  <b>{payslip.worked_days}</b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Provident Fund: </span>
                  <b>N.A.</b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>ESIC Number: </span>
                  <b>N.A.</b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Current Office Location: </span>
                  <b>Richmond Road, Bangalore</b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Increment Arrear Days: </span>
                  <b>0</b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>Total Arrear Days: </span>
                  <b>0</b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>LOP: </span>
                  <b>0</b>
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-black">
                <div className="col-span-6 p-1.5 pl-2">
                  <span>UAN No: </span>
                  <b>000000000000</b>
                </div>
                <div className="col-span-6 p-1.5 pl-2">
                  <span>PAN No: </span>
                  <b>{payslip.identification_number || 'JFCPM0169G'}</b>
                </div>
              </div>
            </div>

            {/* Earnings and Deductions Table Grid */}
            <div className="text-[11px]">
              {/* Main Headers */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black text-center font-bold">
                <div className="col-span-6 py-1">Earnings</div>
                <div className="col-span-6 py-1">Deductions</div>
              </div>

              {/* Sub Columns */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black font-bold">
                <div className="col-span-4 p-1.5 pl-2">Components</div>
                <div className="col-span-2 p-1.5 text-right pr-2">Amount (Rs.)</div>
                <div className="col-span-4 p-1.5 pl-2">Common Deductions</div>
                <div className="col-span-2 p-1.5 text-right pr-2">Amount (Rs.)</div>
              </div>

              {/* Itemized Rows */}
              {Array.from({ length: maxRows }).map((_, idx) => {
                const earn = earnings[idx];
                const ded = deductions[idx];

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 border-b border-black divide-x divide-black min-h-[26px]"
                  >
                    <div className="col-span-4 p-1.5 pl-2">{earn ? earn.name : ''}</div>
                    <div className="col-span-2 p-1.5 text-right pr-2 font-mono">
                      {earn ? Math.round(Number(earn.amount)) : ''}
                    </div>
                    <div className="col-span-4 p-1.5 pl-2">{ded ? ded.name : ''}</div>
                    <div className="col-span-2 p-1.5 text-right pr-2 font-mono">
                      {ded ? Math.round(Number(ded.amount)) : ''}
                    </div>
                  </div>
                );
              })}

              {/* Summary Rows */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black font-bold">
                <div className="col-span-4 p-1.5 pl-2">Gross Earning (A)</div>
                <div className="col-span-2 p-1.5 text-right pr-2 font-mono">
                  {Math.round(Number(payslip.gross_salary))}
                </div>
                <div className="col-span-4 p-1.5 pl-2">Total Deductions (B)</div>
                <div className="col-span-2 p-1.5 text-right pr-2 font-mono">
                  {Math.round(Number(payslip.total_deductions))}
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black font-bold">
                <div className="col-span-4 p-1.5 pl-2">Net Pay (A - B)</div>
                <div className="col-span-2 p-1.5 text-right pr-2 font-mono">
                  {Math.round(Number(payslip.net_salary))}
                </div>
                <div className="col-span-6 p-1.5 pl-2 text-right pr-2"></div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black font-bold">
                <div className="col-span-4 p-1.5 pl-2">Total Pay</div>
                <div className="col-span-2 p-1.5 text-right pr-2 font-mono">
                  {Math.round(Number(payslip.net_salary))}
                </div>
                <div className="col-span-6 p-2 text-right pr-2 font-sans font-normal italic leading-tight">
                  {numberToWords(netAmount)}
                </div>
              </div>

              {/* Empty spacing block before note */}
              <div className="h-6 border-b border-black"></div>

              {/* Note Footer */}
              <div className="py-2 text-center text-[11px]">
                <b>Note:</b> This is a Computer Generated Slip and does not require signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
