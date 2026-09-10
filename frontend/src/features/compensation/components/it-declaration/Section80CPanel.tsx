import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export type Section80CPanelProps = {
  epfDeclared: number;
  setEpfDeclared: (val: number) => void;
  ppfDeclared: number;
  setPpfDeclared: (val: number) => void;
  elssDeclared: number;
  setElssDeclared: (val: number) => void;
  licDeclared: number;
  setLicDeclared: (val: number) => void;
  homeLoanPrincipal: number;
  setHomeLoanPrincipal: (val: number) => void;
  tuitionFeesDeclared: number;
  setTuitionFeesDeclared: (val: number) => void;
  fd5YearDeclared: number;
  setFd5YearDeclared: (val: number) => void;
  ssyDeclared: number;
  setSsyDeclared: (val: number) => void;
  nscDeclared: number;
  setNscDeclared: (val: number) => void;
  stampDutyDeclared: number;
  setStampDutyDeclared: (val: number) => void;
  raw80CTotal: number;
  eligible80CTotal: number;
  showValues?: boolean;
};

export const Section80CPanel: React.FC<Section80CPanelProps> = ({
  epfDeclared,
  setEpfDeclared,
  ppfDeclared,
  setPpfDeclared,
  elssDeclared,
  setElssDeclared,
  licDeclared,
  setLicDeclared,
  homeLoanPrincipal,
  setHomeLoanPrincipal,
  tuitionFeesDeclared,
  setTuitionFeesDeclared,
  fd5YearDeclared,
  setFd5YearDeclared,
  ssyDeclared,
  setSsyDeclared,
  nscDeclared,
  setNscDeclared,
  stampDutyDeclared,
  setStampDutyDeclared,
  raw80CTotal,
  eligible80CTotal,
  showValues = true,
}) => {
  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">Section 80C & 80CCC Deductions</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Aggregate statutory limit under Section 80CCE is <b>₹1,50,000 per financial year</b>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-ink-soft block font-mono">Eligible Deduction</span>
            <span className="text-base font-bold text-accent font-mono">
              {formatCurrency(eligible80CTotal, showValues)} / ₹1,50,000
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-bg-raised h-2 rounded-full overflow-hidden border border-line">
          <div
            className="bg-accent h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, (raw80CTotal / 150000) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-ink-soft">
          <span>Total Declared: {formatCurrency(raw80CTotal, showValues)}</span>
          <span>
            {raw80CTotal >= 150000
              ? 'Cap Reached (100%)'
              : `Remaining: ${formatCurrency(Math.max(0, 150000 - raw80CTotal), showValues)}`}
          </span>
        </div>
      </div>

      {/* Scheme Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EPF */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">
                Employee Provident Fund (EPF / VPF)
              </h4>
              <p className="text-[11px] text-ink-soft">Auto-calculated from payroll deductions</p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              Auto-Payroll
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={epfDeclared}
              onChange={(e) => setEpfDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* PPF */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">Public Provident Fund (PPF)</h4>
              <p className="text-[11px] text-ink-soft">Government backed 15-year deposit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={ppfDeclared}
              onChange={(e) => setPpfDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* ELSS */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">ELSS Mutual Funds (Tax Saver)</h4>
              <p className="text-[11px] text-ink-soft">Equity linked savings with 3-year lock-in</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={elssDeclared}
              onChange={(e) => setElssDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Life Insurance (LIC) */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">
                Life Insurance Premium (LIC / Term)
              </h4>
              <p className="text-[11px] text-ink-soft">Premium for Self, Spouse, Children</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={licDeclared}
              onChange={(e) => setLicDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Home Loan Principal */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">Home Loan Principal Repayment</h4>
              <p className="text-[11px] text-ink-soft">Housing loan principal component</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={homeLoanPrincipal}
              onChange={(e) => setHomeLoanPrincipal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Children Tuition Fees */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">Children Tuition Fees</h4>
              <p className="text-[11px] text-ink-soft">
                Full time school/college fees (max 2 kids)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={tuitionFeesDeclared}
              onChange={(e) => setTuitionFeesDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 5-Yr Tax Saver FD */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">5-Year Tax Saver Fixed Deposit</h4>
              <p className="text-[11px] text-ink-soft">Bank / Post office term deposit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={fd5YearDeclared}
              onChange={(e) => setFd5YearDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Sukanya Samriddhi Yojana */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">Sukanya Samriddhi Yojana (SSY)</h4>
              <p className="text-[11px] text-ink-soft">Government savings scheme for girl child</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={ssyDeclared}
              onChange={(e) => setSsyDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* National Savings Certificate */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">National Savings Certificate (NSC)</h4>
              <p className="text-[11px] text-ink-soft">
                5-year Post Office certificate & accrued interest
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={nscDeclared}
              onChange={(e) => setNscDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Stamp Duty & Registration */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-xs text-ink">Stamp Duty & Registration Charges</h4>
              <p className="text-[11px] text-ink-soft">Paid for house purchase during the FY</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={stampDutyDeclared}
              onChange={(e) => setStampDutyDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
