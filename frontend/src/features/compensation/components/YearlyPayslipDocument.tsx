import React from 'react';
import type { EmployeePayslip } from '../queries/useEmployeePayslips';

export type YearlyPayslipDocumentProps = {
  payslips: EmployeePayslip[];
  financialYear: string;
  onClose: () => void;
};

const FY_MONTHS = [
  { key: '2026-04', label: 'April-2026', days: 30 },
  { key: '2026-05', label: 'May-2026', days: 31 },
  { key: '2026-06', label: 'June-2026', days: 30 },
  { key: '2026-07', label: 'July-2026', days: 31 },
  { key: '2026-08', label: 'August-2026', days: 31 },
  { key: '2026-09', label: 'September-2026', days: 30 },
  { key: '2026-10', label: 'October-2026', days: 31 },
  { key: '2026-11', label: 'November-2026', days: 30 },
  { key: '2026-12', label: 'December-2026', days: 31 },
  { key: '2027-01', label: 'January-2027', days: 31 },
  { key: '2027-02', label: 'February-2027', days: 28 },
  { key: '2027-03', label: 'March-2027', days: 31 },
];

export const YearlyPayslipDocument: React.FC<YearlyPayslipDocumentProps> = ({
  payslips,
  financialYear,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const sampleSlip = payslips[0];
  const employeeName = sampleSlip?.employee_name || 'Vinayak Mohanty';
  const employeeCode = sampleSlip?.employee_id
    ? sampleSlip.employee_id.slice(0, 8).toUpperCase()
    : 'INT-194';

  // Map monthly data from existing payslips
  const monthMap: Record<string, EmployeePayslip | undefined> = {};
  for (const p of payslips) {
    const ym = p.period_start.slice(0, 7);
    monthMap[ym] = p;
  }

  // Calculate totals
  let totalMonthDays = 0;
  let totalWorkingDays = 0;
  let totalBasic = 0;
  let totalGross = 0;
  let totalDeduction = 0;
  let totalNet = 0;

  for (const m of FY_MONTHS) {
    const slip = monthMap[m.key];
    if (slip) {
      totalMonthDays += m.days;
      totalWorkingDays += Number(slip.worked_days) || 0;
      totalBasic += Number(slip.basic_salary) || 0;
      totalGross += Number(slip.gross_salary) || 0;
      totalDeduction += Number(slip.total_deductions) || 0;
      totalNet += Number(slip.net_salary) || 0;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-black border border-neutral-300 rounded-lg max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-300 bg-neutral-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs sm:text-sm font-bold text-neutral-800">
              Yearly Salary Slips Summary (FY {financialYear})
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
              Annual Statement
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-purple-800 text-white hover:bg-purple-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Paper Document (Pure B&W Table Structure matching Image 1) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white text-black font-sans text-xs">
          <div id="yearly-salary-slip" className="border border-black w-full mx-auto overflow-x-auto">
            {/* Top Company Header */}
            <div className="grid grid-cols-12 border-b border-black">
              <div className="col-span-2 border-r border-black p-4 flex items-center justify-center">
                <div className="w-14 h-14 border border-neutral-300 rounded flex items-center justify-center text-center text-[10px] text-neutral-500 font-serif font-bold p-1">
                  PeoplePay 360
                </div>
              </div>
              <div className="col-span-10 p-4 text-center">
                <h1 className="text-xl sm:text-2xl font-sans font-medium text-black m-0">
                  Anchorage Technologies Pvt. Ltd.
                </h1>
                <p className="text-[11px] leading-relaxed text-neutral-800 mt-1 m-0">
                  <b>Office Address :</b> 3rd Floor, Le Parc Richmonde, Richmond Rd, Shanthala Nagar, Bengaluru, Karnataka 560025, Bangalore , Karnataka, India
                </p>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="border-b border-black py-2 text-center bg-white">
              <h2 className="text-base sm:text-lg font-normal text-black m-0">
                Salary Slips for FY {financialYear}
              </h2>
            </div>

            {/* Employee Metadata Matrix */}
            <div className="border-b border-black text-[11px]">
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-5 p-1.5 pl-2">
                  <span>Employee Name : </span>
                  <b>{employeeName}</b>
                </div>
                <div className="col-span-3 p-1.5 pl-2">
                  <span>Employee Type: </span>
                  <b>Full-Time / Intern</b>
                </div>
                <div className="col-span-2 p-1.5 pl-2">
                  <span>Employee Code: </span>
                  <b>{employeeCode}</b>
                </div>
                <div className="col-span-2 p-1.5 pl-2">
                  <span>Pan Number: </span>
                  <b>JFCPM0169G</b>
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
                <div className="col-span-5 p-1.5 pl-2">
                  <span>Designation: </span>
                  <b>BACKEND ENGINEER INTERN</b>
                </div>
                <div className="col-span-4 p-1.5 pl-2">
                  <span>Department: </span>
                  <b>ENGINEERING</b>
                </div>
                <div className="col-span-3 p-1.5 pl-2">
                  <span>Date of Joining: </span>
                  <b>14th August, 2026</b>
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-black">
                <div className="col-span-5 p-1.5 pl-2">
                  <span>Provident Fund: </span>
                  <b>N.A.</b>
                </div>
                <div className="col-span-4 p-1.5 pl-2">
                  <span>ESIC Number: </span>
                  <b>N.A.</b>
                </div>
                <div className="col-span-3 p-1.5 pl-2">
                  <span>Current Office Location: </span>
                  <b>Richmond Road, Bangalore</b>
                </div>
              </div>
            </div>

            {/* 14-Column Yearly Breakdown Table (Earning and Deduction + 12 Months + Total) */}
            <div className="overflow-x-auto text-[10px]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black font-bold divide-x divide-black bg-white">
                    <th className="py-2 px-2 min-w-[130px]">Earning and Deduction</th>
                    {FY_MONTHS.map((m) => (
                      <th key={m.key} className="py-2 px-1.5 text-center min-w-[68px]">
                        {m.label}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-right min-w-[75px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {/* Days Rows */}
                  <tr className="divide-x divide-black">
                    <td className="py-1.5 px-2 font-medium">Total Month Days</td>
                    {FY_MONTHS.map((m) => {
                      const slip = monthMap[m.key];
                      return (
                        <td key={m.key} className="py-1.5 px-1 text-center font-mono">
                          {slip ? m.days.toFixed(2) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-right font-mono font-bold">
                      {totalMonthDays.toFixed(2)}
                    </td>
                  </tr>

                  <tr className="divide-x divide-black">
                    <td className="py-1.5 px-2 font-medium">Total Working Days</td>
                    {FY_MONTHS.map((m) => {
                      const slip = monthMap[m.key];
                      return (
                        <td key={m.key} className="py-1.5 px-1 text-center font-mono">
                          {slip ? Number(slip.worked_days).toFixed(2) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-right font-mono font-bold">
                      {totalWorkingDays.toFixed(2)}
                    </td>
                  </tr>

                  {/* EARNINGS HEADER */}
                  <tr className="divide-x divide-black font-bold italic bg-neutral-50">
                    <td className="py-1 px-2" colSpan={14}>
                      EARNINGS
                    </td>
                  </tr>

                  <tr className="divide-x divide-black">
                    <td className="py-1.5 px-2 pl-4">Stipend / Basic</td>
                    {FY_MONTHS.map((m) => {
                      const slip = monthMap[m.key];
                      return (
                        <td key={m.key} className="py-1.5 px-1 text-center font-mono">
                          {slip ? Math.round(Number(slip.basic_salary)) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-right font-mono font-bold">
                      {Math.round(totalBasic)}
                    </td>
                  </tr>

                  <tr className="divide-x divide-black font-semibold">
                    <td className="py-1.5 px-2">Gross Salary</td>
                    {FY_MONTHS.map((m) => {
                      const slip = monthMap[m.key];
                      return (
                        <td key={m.key} className="py-1.5 px-1 text-center font-mono">
                          {slip ? Math.round(Number(slip.gross_salary)) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-right font-mono font-bold">
                      {Math.round(totalGross)}
                    </td>
                  </tr>

                  {/* DEDUCTIONS HEADER */}
                  <tr className="divide-x divide-black font-bold italic bg-neutral-50">
                    <td className="py-1 px-2" colSpan={14}>
                      DEDUCTIONS
                    </td>
                  </tr>

                  <tr className="divide-x divide-black">
                    <td className="py-1.5 px-2 pl-4">Gross Deduction</td>
                    {FY_MONTHS.map((m) => {
                      const slip = monthMap[m.key];
                      return (
                        <td key={m.key} className="py-1.5 px-1 text-center font-mono">
                          {slip ? Math.round(Number(slip.total_deductions)) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-right font-mono font-bold">
                      {Math.round(totalDeduction)}
                    </td>
                  </tr>

                  {/* NET SALARY ROW */}
                  <tr className="divide-x divide-black font-bold bg-neutral-100/50">
                    <td className="py-2 px-2">Net Salary</td>
                    {FY_MONTHS.map((m) => {
                      const slip = monthMap[m.key];
                      return (
                        <td key={m.key} className="py-2 px-1 text-center font-mono">
                          {slip ? Math.round(Number(slip.net_salary)) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-right font-mono font-bold text-black">
                      {Math.round(totalNet)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Note Footer */}
              <div className="py-2.5 text-center text-[11px] border-t border-black bg-white">
                <b>Note:</b> This is a Computer Generated Slip and does not require signature.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
