import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export type OtherDeductionsPanelProps = {
  sec80EDeclared: number;
  setSec80EDeclared: (val: number) => void;
  sec80GDeclared: number;
  setSec80GDeclared: (val: number) => void;
  sec80TTADeclared: number;
  setSec80TTADeclared: (val: number) => void;
  sec80EEBDeclared: number;
  setSec80EEBDeclared: (val: number) => void;
  sec80EEADeclared: number;
  setSec80EEADeclared: (val: number) => void;
  sec80UDeclared: number;
  setSec80UDeclared: (val: number) => void;
  otherDeductionsTotal: number;
  showValues?: boolean;
};

export const OtherDeductionsPanel: React.FC<OtherDeductionsPanelProps> = ({
  sec80EDeclared,
  setSec80EDeclared,
  sec80GDeclared,
  setSec80GDeclared,
  sec80TTADeclared,
  setSec80TTADeclared,
  sec80EEBDeclared,
  setSec80EEBDeclared,
  sec80EEADeclared,
  setSec80EEADeclared,
  sec80UDeclared,
  setSec80UDeclared,
  otherDeductionsTotal,
  showValues = true,
}) => {
  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">Other Chapter VI-A Deductions</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Specialized deductions for education loans, donations, savings interest, and disability.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-ink-soft block font-mono">Total Other Claims</span>
          <span className="text-base font-bold text-accent font-mono">
            {formatCurrency(otherDeductionsTotal, showValues)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 80E */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">
            Section 80E - Higher Education Loan Interest
          </h4>
          <p className="text-[11px] text-ink-soft">
            No upper limit on interest paid for 8 consecutive years
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={sec80EDeclared}
              onChange={(e) => setSec80EDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 80G */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">
            Section 80G - Donations to Charitable Funds
          </h4>
          <p className="text-[11px] text-ink-soft">
            Donations to PM Relief, approved NGOs & Trusts
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={sec80GDeclared}
              onChange={(e) => setSec80GDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 80TTA */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">
            Section 80TTA - Savings Account Interest
          </h4>
          <p className="text-[11px] text-ink-soft">
            Deduction up to ₹10,000 on savings bank interest
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={sec80TTADeclared}
              onChange={(e) => setSec80TTADeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 80EEB */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">
            Section 80EEB - Electric Vehicle (EV) Loan Interest
          </h4>
          <p className="text-[11px] text-ink-soft">
            Interest deduction up to ₹1,50,000 on EV loans
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={sec80EEBDeclared}
              onChange={(e) => setSec80EEBDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 80EEA */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">
            Section 80EEA - Affordable Housing Loan Interest
          </h4>
          <p className="text-[11px] text-ink-soft">Additional interest deduction up to ₹1,50,000</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={sec80EEADeclared}
              onChange={(e) => setSec80EEADeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* 80U */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">
            Section 80U / 80DD - Person with Disability
          </h4>
          <p className="text-[11px] text-ink-soft">
            Fixed deduction (₹75,000 normal / ₹1,25,000 severe)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={sec80UDeclared}
              onChange={(e) => setSec80UDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
