import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export type Section80DPanelProps = {
  healthSelf: number;
  setHealthSelf: (val: number) => void;
  healthSelfSenior: boolean;
  setHealthSelfSenior: (val: boolean) => void;
  healthParents: number;
  setHealthParents: (val: number) => void;
  healthParentsSenior: boolean;
  setHealthParentsSenior: (val: boolean) => void;
  preventiveCheckup: number;
  setPreventiveCheckup: (val: number) => void;
  eligible80DTotal: number;
  showValues?: boolean;
};

export const Section80DPanel: React.FC<Section80DPanelProps> = ({
  healthSelf,
  setHealthSelf,
  healthSelfSenior,
  setHealthSelfSenior,
  healthParents,
  setHealthParents,
  healthParentsSenior,
  setHealthParentsSenior,
  preventiveCheckup,
  setPreventiveCheckup,
  eligible80DTotal,
  showValues = true,
}) => {
  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">
            Section 80D Medical & Health Insurance
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Deductions on health insurance policies and preventive health checkups.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-ink-soft block font-mono">Eligible 80D Deduction</span>
          <span className="text-base font-bold text-accent font-mono">
            {formatCurrency(eligible80DTotal, showValues)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Self, Spouse & Children */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-xs text-ink">Self, Spouse & Dependent Children</h4>
            <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={healthSelfSenior}
                onChange={(e) => setHealthSelfSenior(e.target.checked)}
                className="accent-accent"
              />
              <span>Senior Citizen (60+ yrs)</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={healthSelf}
              onChange={(e) => setHealthSelf(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] text-ink-soft font-mono">
            Cap: {healthSelfSenior ? '₹50,000' : '₹25,000'} | Declared:{' '}
            {formatCurrency(healthSelf, showValues)}
          </span>
        </div>

        {/* Parents */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-xs text-ink">Parents Medical Insurance</h4>
            <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={healthParentsSenior}
                onChange={(e) => setHealthParentsSenior(e.target.checked)}
                className="accent-accent"
              />
              <span>Parents are Senior Citizens (60+)</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={healthParents}
              onChange={(e) => setHealthParents(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] text-ink-soft font-mono">
            Cap: {healthParentsSenior ? '₹50,000' : '₹25,000'} | Declared:{' '}
            {formatCurrency(healthParents, showValues)}
          </span>
        </div>

        {/* Preventive Health Checkup */}
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3 md:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-xs text-ink">Preventive Health Check-Up</h4>
              <p className="text-[11px] text-ink-soft">
                Combined cap of ₹5,000 for family within overall 80D limit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={preventiveCheckup}
              onChange={(e) => setPreventiveCheckup(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
