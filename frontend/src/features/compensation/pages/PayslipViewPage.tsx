import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePayslipDetail } from '../queries/useEmployeePayslips';

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

export const PayslipViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: payslip, isLoading, error } = usePayslipDetail(id);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-8 gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-ink-soft">Loading official salary slip...</span>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-8 text-center">
        <h2 className="font-serif text-xl font-bold text-ink mb-2">Salary Slip Not Found</h2>
        <p className="text-xs text-ink-soft max-w-sm mb-4">
          The requested payslip record identifier does not exist or has been removed.
        </p>
        <Link
          to="/compensation"
          className="px-4 py-2 text-xs font-medium bg-accent text-accent-ink rounded-lg no-underline"
        >
          Return to Compensation Hub
        </Link>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#FAFAF8] text-ink font-sans flex flex-col selection:bg-accent-soft selection:text-accent">
      {/* Top Document Controls Bar (Hidden during Print) */}
      <header className="sticky top-0 z-40 bg-white border-b border-line px-6 py-3 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <span className="font-serif text-base font-bold text-ink">
            PeoplePay<span className="text-accent">360</span>
          </span>
          <span className="text-line">/</span>
          <span className="text-xs font-medium text-ink-soft">
            Salary Slip — {monthName} {yearNum}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="px-3 py-2 rounded-lg text-xs font-medium border border-line bg-bg text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </header>

      {/* Main Document Viewer Container */}
      <main className="flex-1 p-4 sm:p-8 flex justify-center print:p-0 print:m-0">
        <div className="bg-white text-black border border-black max-w-3xl w-full p-0 shadow-sm print:shadow-none print:border-black print:m-0">
          {/* Top Company Header */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black p-4 flex items-center justify-center">
              <div className="w-16 h-16 border border-neutral-300 rounded flex items-center justify-center text-center text-[10px] text-neutral-500 font-serif font-bold p-1">
                PeoplePay 360
              </div>
            </div>
            <div className="col-span-9 p-4 text-center">
              <h1 className="text-xl sm:text-2xl font-sans font-medium text-black m-0">
                PeoplePay360 Operations Ltd.
              </h1>
              <p className="text-[11px] leading-relaxed text-neutral-800 mt-1 mb-0.5">
                <b>Registered Office :</b> 3rd Floor, Corporate Tower, Richmond Rd, Bengaluru,
                Karnataka 560025, India
              </p>
              <p className="text-[11px] font-bold text-black m-0">
                Business Unit : Technology & Operations
              </p>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="border-b border-black py-2 text-center bg-white">
            <h2 className="text-base sm:text-lg font-normal text-black m-0">
              Salary Slip for {monthName} - {yearNum}
            </h2>
          </div>

          {/* Employee Metadata Matrix */}
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
                <b>{payslip.job_position_title || 'EMPLOYEE'}</b>
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
                  {payslip.department_name ? payslip.department_name.toUpperCase() : 'OPERATIONS'}
                </b>
              </div>
              <div className="col-span-6 p-1.5 pl-2">
                <span>Worked Days: </span>
                <b>{payslip.worked_days}</b>
              </div>
            </div>

            <div className="grid grid-cols-12 divide-x divide-black">
              <div className="col-span-6 p-1.5 pl-2">
                <span>Bank Name: </span>
                <b>{payslip.bank_name || 'HDFC Bank'}</b>
              </div>
              <div className="col-span-6 p-1.5 pl-2">
                <span>Account Number: </span>
                <b>{payslip.bank_account_number || '•••• •••• ••••'}</b>
              </div>
            </div>
          </div>

          {/* Earnings and Deductions Table Grid */}
          <div className="text-[11px]">
            {/* Main Headers */}
            <div className="grid grid-cols-12 border-b border-black divide-x divide-black text-center font-bold">
              <div className="col-span-6 py-1 bg-neutral-50">Earnings</div>
              <div className="col-span-6 py-1 bg-neutral-50">Deductions</div>
            </div>

            {/* Sub Columns */}
            <div className="grid grid-cols-12 border-b border-black divide-x divide-black font-bold bg-neutral-50">
              <div className="col-span-4 p-1.5 pl-2">Components</div>
              <div className="col-span-2 p-1.5 text-right pr-2">Amount (Rs.)</div>
              <div className="col-span-4 p-1.5 pl-2">Components</div>
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

            {/* Note Footer */}
            <div className="py-2.5 text-center text-[11px] text-neutral-600">
              <b>Note:</b> This is a computer-generated salary slip and does not require a
              signature.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
