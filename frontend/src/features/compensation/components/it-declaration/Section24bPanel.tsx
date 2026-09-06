import React from 'react';
import { formatCurrency } from '@/lib/formatters';

export type Section24bPanelProps = {
  propertyType: 'self_occupied' | 'let_out';
  setPropertyType: (val: 'self_occupied' | 'let_out') => void;
  homeLoanInterest: number;
  setHomeLoanInterest: (val: number) => void;
  lenderName: string;
  setLenderName: (val: string) => void;
  lenderPan: string;
  setLenderPan: (val: string) => void;
  rentalIncome: number;
  setRentalIncome: (val: number) => void;
  municipalTaxes: number;
  setMunicipalTaxes: (val: number) => void;
  showValues?: boolean;
};

export const Section24bPanel: React.FC<Section24bPanelProps> = ({
  propertyType,
  setPropertyType,
  homeLoanInterest,
  setHomeLoanInterest,
  lenderName,
  setLenderName,
  lenderPan,
  setLenderPan,
  rentalIncome,
  setRentalIncome,
  municipalTaxes,
  setMunicipalTaxes,
  showValues = true,
}) => {
  const eligibleDeduction =
    propertyType === 'self_occupied' ? Math.min(200000, homeLoanInterest) : homeLoanInterest;

  return (
    <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-ink">
            Section 24(b) - Interest on Housing Loan
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Deduction of interest on borrowed capital for acquisition/construction of residential property.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-ink-soft block font-mono">Eligible 24(b) Deduction</span>
          <span className="text-base font-bold text-accent font-mono">
            {formatCurrency(eligibleDeduction, showValues)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Property Occupation Type</label>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="radio"
                name="propertyType"
                checked={propertyType === 'self_occupied'}
                onChange={() => setPropertyType('self_occupied')}
                className="accent-accent"
              />
              <span>Self-Occupied (Max ₹2,00,000)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="radio"
                name="propertyType"
                checked={propertyType === 'let_out'}
                onChange={() => setPropertyType('let_out')}
                className="accent-accent"
              />
              <span>Let-Out (Rental Property)</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Annual Interest Payable (INR)</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">₹</span>
            <input
              type="number"
              value={homeLoanInterest}
              onChange={(e) => setHomeLoanInterest(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] text-ink-soft font-mono">
            {propertyType === 'self_occupied' && homeLoanInterest > 200000 && (
              <span className="text-amber-600 font-medium">
                Capped at statutory limit of ₹2,00,000 for self-occupied.
              </span>
            )}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Lender Financial Institution Name</label>
          <input
            type="text"
            value={lenderName}
            onChange={(e) => setLenderName(e.target.value)}
            placeholder="e.g. State Bank of India / HDFC Bank"
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink">Lender PAN / Registration Number</label>
          <input
            type="text"
            value={lenderPan}
            onChange={(e) => setLenderPan(e.target.value.toUpperCase())}
            placeholder="e.g. AAACH1234H"
            className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono uppercase focus:outline-none focus:border-accent"
          />
        </div>

        {propertyType === 'let_out' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Gross Annual Rent Received</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={rentalIncome}
                  onChange={(e) => setRentalIncome(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Municipal Taxes Paid</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={municipalTaxes}
                  onChange={(e) => setMunicipalTaxes(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
