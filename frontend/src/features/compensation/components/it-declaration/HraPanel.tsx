import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export type HraPanelProps = {
  monthlyRent: number;
  setMonthlyRent: (val: number) => void;
  isMetroCity: boolean;
  setIsMetroCity: (val: boolean) => void;
  landlordName: string;
  setLandlordName: (val: string) => void;
  landlordPan: string;
  setLandlordPan: (val: string) => void;
  landlordAddress: string;
  setLandlordAddress: (val: string) => void;
  ltaDeclared: number;
  setLtaDeclared: (val: number) => void;
  childrenEduAllowance: number;
  setChildrenEduAllowance: (val: number) => void;
  annualRentPaid: number;
  eligibleHraExemption: number;
  showValues?: boolean;
};

export const HraPanel: React.FC<HraPanelProps> = ({
  monthlyRent,
  setMonthlyRent,
  isMetroCity,
  setIsMetroCity,
  landlordName,
  setLandlordName,
  landlordPan,
  setLandlordPan,
  landlordAddress,
  setLandlordAddress,
  ltaDeclared,
  setLtaDeclared,
  childrenEduAllowance,
  setChildrenEduAllowance,
  annualRentPaid,
  eligibleHraExemption,
  showValues = true,
}) => {
  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">
            House Rent Allowance (HRA) & Section 10 Exemptions
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Exemption calculated as per Rule 2A of the Income-tax Rules, 1962.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-ink-soft block font-mono">Computed Exemption</span>
          <span className="text-base font-bold text-accent font-mono">
            {formatCurrency(eligibleHraExemption, showValues)}
          </span>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Monthly Rent Paid (INR)</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] text-ink-soft font-mono">
            Annual Rent: {formatCurrency(annualRentPaid, showValues)}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Accommodation City Classification</label>
          <div className="flex gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="radio"
                name="cityType"
                checked={isMetroCity}
                onChange={() => setIsMetroCity(true)}
                className="accent-accent"
              />
              <span>Metro (50% of Basic - Delhi, Mumbai, Kolkata, Chennai)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="radio"
                name="cityType"
                checked={!isMetroCity}
                onChange={() => setIsMetroCity(false)}
                className="accent-accent"
              />
              <span>Non-Metro (40% of Basic)</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Landlord Full Name</label>
          <input
            type="text"
            value={landlordName}
            onChange={(e) => setLandlordName(e.target.value)}
            placeholder="Full name as per PAN"
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Landlord PAN Number</label>
          <input
            type="text"
            value={landlordPan}
            onChange={(e) => setLandlordPan(e.target.value.toUpperCase())}
            placeholder="e.g. ABCDE1234F"
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono uppercase focus:outline-none focus:border-accent"
          />
          {annualRentPaid > 100000 && !landlordPan && (
            <span className="text-[11px] text-amber-600 font-semibold block">
              ⚠️ Landlord PAN is mandatory under IT rules for rent exceeding ₹1,00,000 per annum.
            </span>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-ink">Rental Property Address</label>
          <input
            type="text"
            value={landlordAddress}
            onChange={(e) => setLandlordAddress(e.target.value)}
            placeholder="Complete address of the rented premises"
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* LTA & Other Allowances */}
      <div className="border-t border-line pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">Leave Travel Allowance (LTA u/s 10(5))</h4>
          <p className="text-[11px] text-ink-soft">Actual domestic travel expenses for vacation</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={ltaDeclared}
              onChange={(e) => setLtaDeclared(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
          <h4 className="font-semibold text-xs text-ink">Children Education Allowance</h4>
          <p className="text-[11px] text-ink-soft">₹100 per month per child (max 2 children)</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={childrenEduAllowance}
              onChange={(e) => setChildrenEduAllowance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
