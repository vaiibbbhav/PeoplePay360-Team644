import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { useEmployeeContracts } from '../queries/useEmployeePayslips';
import {
  CompareTaxModal,
  calculateOldRegimeTax,
  calculateNewRegimeTax,
  type TaxComparisonData,
} from './CompareTaxModal';
import { Form12BBDocumentModal } from './Form12BBDocumentModal';
import {
  Scale,
  FileText,
  Save,
  CheckCircle,
  Building2,
  Home,
  ShieldCheck,
  Award,
  DollarSign,
  HeartPulse,
  Info,
  Check,
} from 'lucide-react';

import { Section80CPanel } from './it-declaration/Section80CPanel';
import { HraPanel } from './it-declaration/HraPanel';
import { Section80DPanel } from './it-declaration/Section80DPanel';
import { Section24bPanel } from './it-declaration/Section24bPanel';
import { NpsPanel } from './it-declaration/NpsPanel';
import { OtherDeductionsPanel } from './it-declaration/OtherDeductionsPanel';
import { PreviousEmploymentPanel } from './it-declaration/PreviousEmploymentPanel';

export type ITDeclarationTabProps = {
  financialYear?: string;
  showValues?: boolean;
  employeeId?: string;
};

type SchemeCategory = '80c' | 'hra' | '80d' | '24b' | 'nps' | 'other' | 'previous-employment';

export const ITDeclarationTab: React.FC<ITDeclarationTabProps> = ({
  financialYear = '2026-27',
  showValues = true,
  employeeId,
}) => {
  const { data: user } = useCurrentUser();
  const targetEmpId = employeeId || user?.employeeId || 'default-employee';

  // Contracts query to derive base gross salary
  const { data: contracts = [] } = useEmployeeContracts(employeeId);
  const activeContract = contracts.find((c) => c.status === 'active') || contracts[0];
  const monthlyWage = activeContract ? parseFloat(activeContract.wage) || 85000 : 90000;
  const annualGrossSalary = monthlyWage * 12;

  // Storage key for persistence
  const storageKey = `it_declaration_${targetEmpId}_${financialYear}`;

  // Tax Regime State
  const [selectedRegime, setSelectedRegime] = useState<'new' | 'old'>('new');
  const [activeCategory, setActiveCategory] = useState<SchemeCategory>('80c');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isForm12BBModalOpen, setIsForm12BBModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'submitted'>('draft');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // 1. Section 80C Schemes (Max ₹1,50,000)
  const [epfDeclared, setEpfDeclared] = useState(0);
  const [ppfDeclared, setPpfDeclared] = useState(0);
  const [elssDeclared, setElssDeclared] = useState(0);
  const [licDeclared, setLicDeclared] = useState(0);
  const [nscDeclared, setNscDeclared] = useState(0);
  const [fd5YearDeclared, setFd5YearDeclared] = useState(0);
  const [tuitionFeesDeclared, setTuitionFeesDeclared] = useState(0);
  const [homeLoanPrincipal, setHomeLoanPrincipal] = useState(0);
  const [ssyDeclared, setSsyDeclared] = useState(0);
  const [stampDutyDeclared, setStampDutyDeclared] = useState(0);

  // 2. House Rent Allowance (HRA) & Section 10
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [isMetroCity, setIsMetroCity] = useState(true);
  const [landlordName, setLandlordName] = useState('');
  const [landlordPan, setLandlordPan] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [ltaDeclared, setLtaDeclared] = useState(0);
  const [childrenEduAllowance, setChildrenEduAllowance] = useState(0);

  // 3. Section 80D (Health Insurance)
  const [healthSelf, setHealthSelf] = useState(0);
  const [healthSelfSenior, setHealthSelfSenior] = useState(false);
  const [healthParents, setHealthParents] = useState(0);
  const [healthParentsSenior, setHealthParentsSenior] = useState(false);
  const [preventiveCheckup, setPreventiveCheckup] = useState(0);

  // 4. Section 24(b) (Home Loan Interest)
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);
  const [propertyType, setPropertyType] = useState<'self_occupied' | 'let_out'>('self_occupied');
  const [lenderName, setLenderName] = useState('');
  const [lenderPan, setLenderPan] = useState('');
  const [rentalIncome, setRentalIncome] = useState(0);
  const [municipalTaxes, setMunicipalTaxes] = useState(0);

  // 5. Section 80CCD - NPS Schemes
  const [npsEmployee80CCD1B, setNpsEmployee80CCD1B] = useState(0); // Max 50k
  const [npsEmployer80CCD2, setNpsEmployer80CCD2] = useState(0);
  const [pranNumber, setPranNumber] = useState('');

  // 6. Other Chapter VI-A Deductions
  const [sec80EDeclared, setSec80EDeclared] = useState(0); // Education loan interest
  const [sec80EEADeclared, setSec80EEADeclared] = useState(0); // Affordable housing
  const [sec80EEBDeclared, setSec80EEBDeclared] = useState(0); // Electric Vehicle
  const [sec80GDeclared, setSec80GDeclared] = useState(0); // Donations
  const [sec80TTADeclared, setSec80TTADeclared] = useState(0); // Savings interest
  const [sec80UDeclared, setSec80UDeclared] = useState(0); // Disability

  // 7. Previous Employment (Form 12B)
  const [prevGrossSalary, setPrevGrossSalary] = useState(0);
  const [prevTdsDeducted, setPrevTdsDeducted] = useState(0);
  const [prevPfDeducted, setPrevPfDeducted] = useState(0);
  const [prevPtDeducted, setPrevPtDeducted] = useState(0);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedRegime) setSelectedRegime(parsed.selectedRegime);
        if (parsed.submissionStatus) setSubmissionStatus(parsed.submissionStatus);
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
        if (parsed.ppfDeclared !== undefined) setPpfDeclared(parsed.ppfDeclared);
        if (parsed.elssDeclared !== undefined) setElssDeclared(parsed.elssDeclared);
        if (parsed.licDeclared !== undefined) setLicDeclared(parsed.licDeclared);
        if (parsed.homeLoanPrincipal !== undefined) setHomeLoanPrincipal(parsed.homeLoanPrincipal);
        if (parsed.monthlyRent !== undefined) setMonthlyRent(parsed.monthlyRent);
        if (parsed.landlordName !== undefined) setLandlordName(parsed.landlordName);
        if (parsed.landlordPan !== undefined) setLandlordPan(parsed.landlordPan);
        if (parsed.landlordAddress !== undefined) setLandlordAddress(parsed.landlordAddress);
        if (parsed.homeLoanInterest !== undefined) setHomeLoanInterest(parsed.homeLoanInterest);
        if (parsed.lenderName !== undefined) setLenderName(parsed.lenderName);
        if (parsed.lenderPan !== undefined) setLenderPan(parsed.lenderPan);
        if (parsed.healthSelf !== undefined) setHealthSelf(parsed.healthSelf);
        if (parsed.healthParents !== undefined) setHealthParents(parsed.healthParents);
        if (parsed.npsEmployee80CCD1B !== undefined)
          setNpsEmployee80CCD1B(parsed.npsEmployee80CCD1B);
        if (parsed.pranNumber !== undefined) setPranNumber(parsed.pranNumber);
        if (parsed.sec80GDeclared !== undefined) setSec80GDeclared(parsed.sec80GDeclared);
        if (parsed.sec80TTADeclared !== undefined) setSec80TTADeclared(parsed.sec80TTADeclared);
      }
    } catch (err) {
      console.warn('Failed to load IT declaration from storage:', err);
    }
  }, [storageKey]);

  // Save to localStorage
  const handleSave = (status: 'draft' | 'submitted') => {
    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const stateToSave = {
      selectedRegime,
      submissionStatus: status,
      lastUpdated: timestamp,
      ppfDeclared,
      elssDeclared,
      licDeclared,
      homeLoanPrincipal,
      monthlyRent,
      landlordName,
      landlordPan,
      landlordAddress,
      homeLoanInterest,
      lenderName,
      lenderPan,
      healthSelf,
      healthParents,
      npsEmployee80CCD1B,
      pranNumber,
      sec80GDeclared,
      sec80TTADeclared,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('Failed to save IT declaration to storage:', err);
    }
    setSubmissionStatus(status);
    setLastUpdated(timestamp);
    setSaveToast(
      status === 'submitted'
        ? 'Declaration successfully submitted for FY ' + financialYear + '!'
        : 'Declaration draft saved successfully.',
    );
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Calculations
  // Total 80C
  const raw80CTotal =
    epfDeclared +
    ppfDeclared +
    elssDeclared +
    licDeclared +
    nscDeclared +
    fd5YearDeclared +
    tuitionFeesDeclared +
    homeLoanPrincipal +
    ssyDeclared +
    stampDutyDeclared;
  const eligible80CTotal = Math.min(150000, raw80CTotal);

  // Total 80D
  const selfCap = healthSelfSenior ? 50000 : 25000;
  const parentsCap = healthParentsSenior ? 50000 : 25000;
  const eligibleSelf = Math.min(selfCap, healthSelf + Math.min(5000, preventiveCheckup));
  const eligibleParents = Math.min(parentsCap, healthParents);
  const eligible80DTotal = eligibleSelf + eligibleParents;

  // HRA Exemption Calculation
  const annualBasic = annualGrossSalary * 0.5;
  const actualHraReceived = annualBasic * 0.5;
  const annualRentPaid = monthlyRent * 12;
  const rentMinusTenPercent = Math.max(0, annualRentPaid - 0.1 * annualBasic);
  const cityCap = isMetroCity ? 0.5 * annualBasic : 0.4 * annualBasic;
  const eligibleHraExemption = Math.min(actualHraReceived, rentMinusTenPercent, cityCap);

  // Total Chapter VI-A Other Deductions
  const otherDeductionsTotal =
    sec80EDeclared +
    sec80EEADeclared +
    sec80EEBDeclared +
    sec80GDeclared +
    Math.min(10000, sec80TTADeclared) +
    sec80UDeclared;

  // Aggregated data for Tax Computation and Comparison
  const comparisonData: TaxComparisonData = useMemo(() => {
    return {
      grossSalary: annualGrossSalary + prevGrossSalary,
      hraExemption: eligibleHraExemption,
      section80C: eligible80CTotal,
      section80D: eligible80DTotal,
      section80CCD1B: Math.min(50000, npsEmployee80CCD1B),
      section80CCD2: npsEmployer80CCD2,
      homeLoanInterest:
        propertyType === 'self_occupied' ? Math.min(200000, homeLoanInterest) : homeLoanInterest,
      otherDeductions: otherDeductionsTotal,
    };
  }, [
    annualGrossSalary,
    prevGrossSalary,
    eligibleHraExemption,
    eligible80CTotal,
    eligible80DTotal,
    npsEmployee80CCD1B,
    npsEmployer80CCD2,
    propertyType,
    homeLoanInterest,
    otherDeductionsTotal,
  ]);

  const oldTax = useMemo(() => calculateOldRegimeTax(comparisonData), [comparisonData]);
  const newTax = useMemo(() => calculateNewRegimeTax(comparisonData), [comparisonData]);

  const activeTaxCalculation = selectedRegime === 'new' ? newTax : oldTax;
  const totalDeclaredInvestments =
    eligible80CTotal +
    eligible80DTotal +
    Math.min(50000, npsEmployee80CCD1B) +
    npsEmployer80CCD2 +
    (propertyType === 'self_occupied' ? Math.min(200000, homeLoanInterest) : homeLoanInterest) +
    otherDeductionsTotal +
    eligibleHraExemption;

  return (
    <div className="space-y-6 pt-2 font-sans">
      {/* Toast Alert */}
      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="opacity-80 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Main Header Card with Regime Choice and Actions */}
      <div className="border border-line rounded-2xl p-6 bg-bg-raised space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
                Income Tax Act, 1961
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  submissionStatus === 'submitted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {submissionStatus === 'submitted' ? 'SUBMITTED & ACTIVE' : 'DRAFT IN PROGRESS'}
              </span>
            </div>
            <h2 className="font-sans text-2xl font-bold text-ink tracking-tight mt-1">
              IT Declaration for FY {financialYear}
            </h2>
            <p className="text-xs text-ink-soft mt-1">
              Declare tax-saving investments, rent receipts, home loans, and select your preferred
              tax regime for TDS calculations.
              <span className="ml-2 font-mono text-[11px] opacity-75">
                Last updated: {lastUpdated}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border border-line bg-bg text-ink hover:bg-bg-raised font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Scale className="w-3.5 h-3.5 text-accent" />
              <span>Compare Regimes</span>
            </button>

            <button
              type="button"
              onClick={() => setIsForm12BBModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border border-line bg-bg text-ink hover:bg-bg-raised font-semibold transition-all cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-ink-soft" />
              <span>Form 12BB (Print)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('submitted')}
              className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit Declaration</span>
            </button>
          </div>
        </div>

        {/* Tax Regime Selector Cards */}
        <div>
          <label className="text-xs font-bold text-ink uppercase tracking-wider block mb-3">
            Select Your Applicable Tax Regime (Section 115BAC vs Old Regime)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Tax Regime Option */}
            <div
              onClick={() => setSelectedRegime('new')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                selectedRegime === 'new'
                  ? 'border-accent bg-accent/5 shadow-xs'
                  : 'border-line bg-bg hover:border-line/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-base text-ink">New Tax Regime</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent text-white font-bold tracking-wide">
                      DEFAULT
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Lower slab rates with enhanced standard deduction of <b>₹75,000</b>. Section 87A
                    rebate offers <b>zero tax up to ₹7,75,000</b> income.
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedRegime === 'new' ? 'border-accent bg-accent text-white' : 'border-line'
                  }`}
                >
                  {selectedRegime === 'new' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono">
                <span className="text-ink-soft">Tax under New Regime:</span>
                <span className="font-bold text-ink text-sm">
                  {formatCurrency(newTax.totalTax, showValues)}
                </span>
              </div>
            </div>

            {/* Old Tax Regime Option */}
            <div
              onClick={() => setSelectedRegime('old')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                selectedRegime === 'old'
                  ? 'border-accent bg-accent/5 shadow-xs'
                  : 'border-line bg-bg hover:border-line/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-base text-ink">Old Tax Regime</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-bg-raised text-ink border border-line font-medium">
                      WITH DEDUCTIONS
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Full eligibility for Chapter VI-A deductions: 80C (₹1.5L), 80D Mediclaim, HRA
                    exemption, and Section 24(b) Home Loan interest (₹2L).
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedRegime === 'old' ? 'border-accent bg-accent text-white' : 'border-line'
                  }`}
                >
                  {selectedRegime === 'old' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono">
                <span className="text-ink-soft">Tax under Old Regime:</span>
                <span className="font-bold text-ink text-sm">
                  {formatCurrency(oldTax.totalTax, showValues)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        {selectedRegime === 'new' ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-accent/20 bg-accent/5 text-xs text-ink leading-relaxed">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p>
              <b>Active Regime: New Tax Regime (Section 115BAC).</b> Under this regime, itemized
              deductions (like 80C, 80D, and HRA) do not reduce tax liability, but you benefit from
              lower slab rates and a ₹75,000 standard deduction. Your declared investments below are
              saved and can be evaluated anytime by clicking <b>"Compare Regimes"</b>.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-950/20 text-xs text-violet-900 dark:text-violet-300 leading-relaxed">
            <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p>
              <b>Active Regime: Old Tax Regime.</b> Your TDS will be computed after factoring in all
              eligible Chapter VI-A deductions, HRA exemptions, and home loan interest claims
              declared below.
            </p>
          </div>
        )}
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-line bg-bg">
          <span className="text-xs text-ink-soft block font-medium">Gross Total Salary</span>
          <span className="text-lg font-sans font-bold text-ink mt-1 block">
            {formatCurrency(annualGrossSalary + prevGrossSalary, showValues)}
          </span>
          <span className="text-[11px] text-ink-soft mt-0.5 block">Estimated annual earnings</span>
        </div>

        <div className="p-4 rounded-xl border border-line bg-bg">
          <span className="text-xs text-ink-soft block font-medium">Total Declared Deductions</span>
          <span className="text-lg font-sans font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(totalDeclaredInvestments, showValues)}
          </span>
          <span className="text-[11px] text-ink-soft mt-0.5 block">
            {selectedRegime === 'old' ? 'Applied to taxable income' : 'For comparison only'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-line bg-bg">
          <span className="text-xs text-ink-soft block font-medium">Net Taxable Income</span>
          <span className="text-lg font-sans font-bold text-accent mt-1 block">
            {formatCurrency(activeTaxCalculation.taxableIncome, showValues)}
          </span>
          <span className="text-[11px] text-ink-soft mt-0.5 block">
            After {selectedRegime === 'new' ? '₹75,000 std ded.' : 'eligible deductions'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-line bg-bg">
          <span className="text-xs text-ink-soft block font-medium">Projected Annual Tax</span>
          <span className="text-lg font-sans font-bold text-ink mt-1 block">
            {formatCurrency(activeTaxCalculation.totalTax, showValues)}
          </span>
          <span className="text-[11px] font-mono text-ink-soft mt-0.5 block">
            ~{formatCurrency(Math.round(activeTaxCalculation.totalTax / 12), showValues)}/month TDS
          </span>
        </div>
      </div>

      {/* Category Sub-Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-bg-raised border border-line overflow-x-auto scrollbar-none">
        {[
          { id: '80c', label: 'Section 80C & 80CCC', sub: 'Max ₹1.5L', icon: DollarSign },
          { id: 'hra', label: 'HRA & Section 10', sub: 'Rent Exemption', icon: Home },
          { id: '80d', label: 'Section 80D', sub: 'Medical Insurance', icon: HeartPulse },
          { id: '24b', label: 'Section 24(b)', sub: 'Home Loan Interest', icon: Building2 },
          { id: 'nps', label: 'Section 80CCD (NPS)', sub: 'Tier-1 & Employer', icon: Award },
          { id: 'other', label: 'Other Chapter VI-A', sub: '80E, 80G, 80TTA', icon: ShieldCheck },
          { id: 'previous-employment', label: 'Form 12B', sub: 'Past Employer', icon: FileText },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as SchemeCategory)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-bg text-ink shadow-xs border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-accent" />
              <div className="text-left">
                <span className="block leading-none">{tab.label}</span>
                <span className="text-[10px] opacity-70 block mt-0.5 font-normal">{tab.sub}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Category Content Panels */}
      {activeCategory === '80c' && (
        <Section80CPanel
          epfDeclared={epfDeclared}
          setEpfDeclared={setEpfDeclared}
          ppfDeclared={ppfDeclared}
          setPpfDeclared={setPpfDeclared}
          elssDeclared={elssDeclared}
          setElssDeclared={setElssDeclared}
          licDeclared={licDeclared}
          setLicDeclared={setLicDeclared}
          homeLoanPrincipal={homeLoanPrincipal}
          setHomeLoanPrincipal={setHomeLoanPrincipal}
          tuitionFeesDeclared={tuitionFeesDeclared}
          setTuitionFeesDeclared={setTuitionFeesDeclared}
          fd5YearDeclared={fd5YearDeclared}
          setFd5YearDeclared={setFd5YearDeclared}
          ssyDeclared={ssyDeclared}
          setSsyDeclared={setSsyDeclared}
          nscDeclared={nscDeclared}
          setNscDeclared={setNscDeclared}
          stampDutyDeclared={stampDutyDeclared}
          setStampDutyDeclared={setStampDutyDeclared}
          raw80CTotal={raw80CTotal}
          eligible80CTotal={eligible80CTotal}
          showValues={showValues}
        />
      )}

      {activeCategory === 'hra' && (
        <HraPanel
          monthlyRent={monthlyRent}
          setMonthlyRent={setMonthlyRent}
          isMetroCity={isMetroCity}
          setIsMetroCity={setIsMetroCity}
          landlordName={landlordName}
          setLandlordName={setLandlordName}
          landlordPan={landlordPan}
          setLandlordPan={setLandlordPan}
          landlordAddress={landlordAddress}
          setLandlordAddress={setLandlordAddress}
          ltaDeclared={ltaDeclared}
          setLtaDeclared={setLtaDeclared}
          childrenEduAllowance={childrenEduAllowance}
          setChildrenEduAllowance={setChildrenEduAllowance}
          annualRentPaid={annualRentPaid}
          eligibleHraExemption={eligibleHraExemption}
          showValues={showValues}
        />
      )}

      {activeCategory === '80d' && (
        <Section80DPanel
          healthSelf={healthSelf}
          setHealthSelf={setHealthSelf}
          healthSelfSenior={healthSelfSenior}
          setHealthSelfSenior={setHealthSelfSenior}
          healthParents={healthParents}
          setHealthParents={setHealthParents}
          healthParentsSenior={healthParentsSenior}
          setHealthParentsSenior={setHealthParentsSenior}
          preventiveCheckup={preventiveCheckup}
          setPreventiveCheckup={setPreventiveCheckup}
          eligible80DTotal={eligible80DTotal}
          showValues={showValues}
        />
      )}

      {activeCategory === '24b' && (
        <Section24bPanel
          propertyType={propertyType}
          setPropertyType={setPropertyType}
          homeLoanInterest={homeLoanInterest}
          setHomeLoanInterest={setHomeLoanInterest}
          lenderName={lenderName}
          setLenderName={setLenderName}
          lenderPan={lenderPan}
          setLenderPan={setLenderPan}
          rentalIncome={rentalIncome}
          setRentalIncome={setRentalIncome}
          municipalTaxes={municipalTaxes}
          setMunicipalTaxes={setMunicipalTaxes}
          showValues={showValues}
        />
      )}

      {activeCategory === 'nps' && (
        <NpsPanel
          npsEmployee80CCD1B={npsEmployee80CCD1B}
          setNpsEmployee80CCD1B={setNpsEmployee80CCD1B}
          npsEmployer80CCD2={npsEmployer80CCD2}
          setNpsEmployer80CCD2={setNpsEmployer80CCD2}
          pranNumber={pranNumber}
          setPranNumber={setPranNumber}
          showValues={showValues}
        />
      )}

      {activeCategory === 'other' && (
        <OtherDeductionsPanel
          sec80EDeclared={sec80EDeclared}
          setSec80EDeclared={setSec80EDeclared}
          sec80GDeclared={sec80GDeclared}
          setSec80GDeclared={setSec80GDeclared}
          sec80TTADeclared={sec80TTADeclared}
          setSec80TTADeclared={setSec80TTADeclared}
          sec80EEBDeclared={sec80EEBDeclared}
          setSec80EEBDeclared={setSec80EEBDeclared}
          sec80EEADeclared={sec80EEADeclared}
          setSec80EEADeclared={setSec80EEADeclared}
          sec80UDeclared={sec80UDeclared}
          setSec80UDeclared={setSec80UDeclared}
          otherDeductionsTotal={otherDeductionsTotal}
          showValues={showValues}
        />
      )}

      {activeCategory === 'previous-employment' && (
        <PreviousEmploymentPanel
          financialYear={financialYear}
          prevGrossSalary={prevGrossSalary}
          setPrevGrossSalary={setPrevGrossSalary}
          prevTdsDeducted={prevTdsDeducted}
          setPrevTdsDeducted={setPrevTdsDeducted}
          prevPfDeducted={prevPfDeducted}
          setPrevPfDeducted={setPrevPfDeducted}
          prevPtDeducted={prevPtDeducted}
          setPrevPtDeducted={setPrevPtDeducted}
          showValues={showValues}
        />
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 rounded-2xl border border-line bg-bg-raised flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Save className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-ink block">
              Draft or Finalize Declaration
            </span>
            <span className="text-[11px] text-ink-soft block">
              You can modify and re-submit your declarations anytime before the POI lock date.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('submitted')}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Submit Declaration</span>
          </button>
        </div>
      </div>

      {/* Compare Tax Modal */}
      <CompareTaxModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        data={comparisonData}
        activeRegime={selectedRegime}
        onSelectRegime={(regime) => {
          setSelectedRegime(regime);
          handleSave(submissionStatus);
        }}
        showValues={showValues}
      />

      {/* Form 12BB Modal */}
      <Form12BBDocumentModal
        isOpen={isForm12BBModalOpen}
        onClose={() => setIsForm12BBModalOpen(false)}
        employeeName={user ? `${user.firstName} ${user.lastName}`.trim() : 'Employee Member'}
        panNumber="ABCDE1234F"
        designation={user?.role || 'Staff Member'}
        financialYear={financialYear}
        regime={selectedRegime}
        rentPaid={annualRentPaid}
        landlordName={landlordName}
        landlordPan={landlordPan}
        landlordAddress={landlordAddress}
        homeLoanInterest={homeLoanInterest}
        lenderName={lenderName}
        lenderPan={lenderPan}
        ltaAmount={ltaDeclared}
        section80CItems={[
          { label: 'Employee Provident Fund (EPF)', amount: epfDeclared },
          { label: 'Public Provident Fund (PPF)', amount: ppfDeclared },
          { label: 'ELSS Mutual Funds', amount: elssDeclared },
          { label: 'Life Insurance Premium (LIC)', amount: licDeclared },
          { label: 'Home Loan Principal Repayment', amount: homeLoanPrincipal },
          { label: 'Children Tuition Fees', amount: tuitionFeesDeclared },
        ]}
        section80DAmount={eligible80DTotal}
        section80CCD1BAmount={Math.min(50000, npsEmployee80CCD1B)}
        otherDeductionsItems={[
          { label: 'Section 80CCD(2) (Employer NPS)', amount: npsEmployer80CCD2 },
          { label: 'Section 80G (Charitable Donations)', amount: sec80GDeclared },
          { label: 'Section 80TTA (Savings Account Interest)', amount: sec80TTADeclared },
        ]}
      />
    </div>
  );
};

export default ITDeclarationTab;
