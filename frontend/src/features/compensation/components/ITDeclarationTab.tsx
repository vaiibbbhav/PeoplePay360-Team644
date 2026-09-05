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

export type ITDeclarationTabProps = {
  financialYear?: string;
  showValues?: boolean;
  employeeId?: string;
};

type SchemeCategory =
  | '80c'
  | 'hra'
  | '80d'
  | '24b'
  | 'nps'
  | 'other'
  | 'previous-employment';

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
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'submitted'>('submitted');
  const [lastUpdated, setLastUpdated] = useState<string>('01 Sep 2026, 14:30 IST');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // 1. Section 80C Schemes (Max ₹1,50,000)
  const [epfDeclared, setEpfDeclared] = useState(25920); // auto from payroll
  const [ppfDeclared, setPpfDeclared] = useState(50000);
  const [elssDeclared, setElssDeclared] = useState(40000);
  const [licDeclared, setLicDeclared] = useState(25000);
  const [nscDeclared, setNscDeclared] = useState(0);
  const [fd5YearDeclared, setFd5YearDeclared] = useState(0);
  const [tuitionFeesDeclared, setTuitionFeesDeclared] = useState(0);
  const [homeLoanPrincipal, setHomeLoanPrincipal] = useState(35000);
  const [ssyDeclared, setSsyDeclared] = useState(0);
  const [stampDutyDeclared, setStampDutyDeclared] = useState(0);

  // 2. House Rent Allowance (HRA) & Section 10
  const [monthlyRent, setMonthlyRent] = useState(22000);
  const [isMetroCity, setIsMetroCity] = useState(true);
  const [landlordName, setLandlordName] = useState('Rameshwar Sharma');
  const [landlordPan, setLandlordPan] = useState('ABCPS1234F');
  const [landlordAddress, setLandlordAddress] = useState('Flat 402, Lotus Greens, Indiranagar, Bengaluru');
  const [ltaDeclared, setLtaDeclared] = useState(25000);
  const [childrenEduAllowance, setChildrenEduAllowance] = useState(2400);

  // 3. Section 80D (Health Insurance)
  const [healthSelf, setHealthSelf] = useState(18000);
  const [healthSelfSenior, setHealthSelfSenior] = useState(false);
  const [healthParents, setHealthParents] = useState(28000);
  const [healthParentsSenior, setHealthParentsSenior] = useState(true);
  const [preventiveCheckup, setPreventiveCheckup] = useState(4500);

  // 4. Section 24(b) (Home Loan Interest)
  const [homeLoanInterest, setHomeLoanInterest] = useState(145000);
  const [propertyType, setPropertyType] = useState<'self_occupied' | 'let_out'>('self_occupied');
  const [lenderName, setLenderName] = useState('HDFC Bank Ltd');
  const [lenderPan, setLenderPan] = useState('AAACH1234H');
  const [rentalIncome, setRentalIncome] = useState(0);
  const [municipalTaxes, setMunicipalTaxes] = useState(0);

  // 5. Section 80CCD - NPS Schemes
  const [npsEmployee80CCD1B, setNpsEmployee80CCD1B] = useState(50000); // Max 50k
  const [npsEmployer80CCD2, setNpsEmployer80CCD2] = useState(Math.round(annualGrossSalary * 0.05)); // 5% of basic
  const [pranNumber, setPranNumber] = useState('110022334455');

  // 6. Other Chapter VI-A Deductions
  const [sec80EDeclared, setSec80EDeclared] = useState(0); // Education loan interest
  const [sec80EEADeclared, setSec80EEADeclared] = useState(0); // Affordable housing
  const [sec80EEBDeclared, setSec80EEBDeclared] = useState(0); // Electric Vehicle
  const [sec80GDeclared, setSec80GDeclared] = useState(10000); // Donations
  const [sec80TTADeclared, setSec80TTADeclared] = useState(8500); // Savings interest
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
        if (parsed.monthlyRent !== undefined) setMonthlyRent(parsed.monthlyRent);
        if (parsed.homeLoanInterest !== undefined) setHomeLoanInterest(parsed.homeLoanInterest);
        if (parsed.healthSelf !== undefined) setHealthSelf(parsed.healthSelf);
        if (parsed.healthParents !== undefined) setHealthParents(parsed.healthParents);
        if (parsed.npsEmployee80CCD1B !== undefined) setNpsEmployee80CCD1B(parsed.npsEmployee80CCD1B);
      }
    } catch {
      // ignore
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
      monthlyRent,
      homeLoanInterest,
      healthSelf,
      healthParents,
      npsEmployee80CCD1B,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch {
      // ignore
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

  // HRA Exemption Calculation:
  // Rule 2A: Least of:
  // 1. Actual HRA received (assume 50% of Basic or 25% of gross)
  // 2. Rent paid - 10% of Basic (basic ~ 50% of gross)
  // 3. 50% of Basic (metro) or 40% (non-metro)
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
      homeLoanInterest: propertyType === 'self_occupied' ? Math.min(200000, homeLoanInterest) : homeLoanInterest,
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
              Declare tax-saving investments, rent receipts, home loans, and select your preferred tax regime for TDS calculations.
              <span className="ml-2 font-mono text-[11px] opacity-75">Last updated: {lastUpdated}</span>
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
                    Lower slab rates with enhanced standard deduction of <b>₹75,000</b>. Section 87A rebate offers <b>zero tax up to ₹7,75,000</b> income.
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
                    Full eligibility for Chapter VI-A deductions: 80C (₹1.5L), 80D Mediclaim, HRA exemption, and Section 24(b) Home Loan interest (₹2L).
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
              <b>Active Regime: New Tax Regime (Section 115BAC).</b> Under this regime, itemized deductions (like 80C, 80D, and HRA) do not reduce tax liability, but you benefit from lower slab rates and a ₹75,000 standard deduction. Your declared investments below are saved and can be evaluated anytime by clicking <b>"Compare Regimes"</b>.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-950/20 text-xs text-violet-900 dark:text-violet-300 leading-relaxed">
            <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p>
              <b>Active Regime: Old Tax Regime.</b> Your TDS will be computed after factoring in all eligible Chapter VI-A deductions, HRA exemptions, and home loan interest claims declared below.
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

      {/* 1. Section 80C Panel */}
      {activeCategory === '80c' && (
        <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="font-sans text-lg font-bold text-ink">
                Section 80C & 80CCC Deductions
              </h3>
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
              <span>{raw80CTotal >= 150000 ? 'Cap Reached (100%)' : `Remaining: ${formatCurrency(Math.max(0, 150000 - raw80CTotal), showValues)}`}</span>
            </div>
          </div>

          {/* Scheme Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EPF */}
            <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-xs text-ink">Employee Provident Fund (EPF / VPF)</h4>
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
                  <h4 className="font-semibold text-xs text-ink">Life Insurance Premium (LIC / Term)</h4>
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
                  <p className="text-[11px] text-ink-soft">Full time school/college fees (max 2 kids)</p>
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
                  <p className="text-[11px] text-ink-soft">5-year Post Office certificate & accrued interest</p>
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
      )}

      {/* 2. HRA & Section 10 Panel */}
      {activeCategory === 'hra' && (
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
      )}

      {/* 3. Section 80D Panel */}
      {activeCategory === '80d' && (
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
                Cap: {healthSelfSenior ? '₹50,000' : '₹25,000'} | Declared: {formatCurrency(healthSelf, showValues)}
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
                Cap: {healthParentsSenior ? '₹50,000' : '₹25,000'} | Declared: {formatCurrency(healthParents, showValues)}
              </span>
            </div>

            {/* Preventive Health Checkup */}
            <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3 md:col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-xs text-ink">Preventive Health Check-Up</h4>
                  <p className="text-[11px] text-ink-soft">Combined cap of ₹5,000 for family within overall 80D limit</p>
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
      )}

      {/* 4. Section 24(b) Home Loan Panel */}
      {activeCategory === '24b' && (
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
                {formatCurrency(propertyType === 'self_occupied' ? Math.min(200000, homeLoanInterest) : homeLoanInterest, showValues)}
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
                  <span className="text-amber-600 font-medium">Capped at statutory limit of ₹2,00,000 for self-occupied.</span>
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
      )}

      {/* 5. Section 80CCD NPS Panel */}
      {activeCategory === 'nps' && (
        <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="font-sans text-lg font-bold text-ink">
                National Pension System (NPS) u/s 80CCD
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Voluntary employee contributions & corporate employer contributions.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-ink-soft block font-mono">Total NPS Deduction</span>
              <span className="text-base font-bold text-accent font-mono">
                {formatCurrency(Math.min(50000, npsEmployee80CCD1B) + npsEmployer80CCD2, showValues)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 80CCD(1B) */}
            <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3">
              <div>
                <h4 className="font-semibold text-xs text-ink">Section 80CCD(1B) - Employee Voluntary NPS</h4>
                <p className="text-[11px] text-ink-soft">
                  Additional exclusive deduction of up to <b>₹50,000</b> over and above Section 80C limit!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={npsEmployee80CCD1B}
                  onChange={(e) => setNpsEmployee80CCD1B(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <span className="text-[11px] text-ink-soft font-mono">
                Statutory ceiling: ₹50,000 | Declared: {formatCurrency(npsEmployee80CCD1B, showValues)}
              </span>
            </div>

            {/* 80CCD(2) */}
            <div className="p-4 rounded-xl border border-line bg-bg-raised/40 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs text-ink">Section 80CCD(2) - Employer NPS Contribution</h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    BOTH REGIMES
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">
                  Allowed under <b>both New and Old Tax Regimes</b> (up to 14% of Basic salary).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={npsEmployer80CCD2}
                  onChange={(e) => setNpsEmployer80CCD2(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <span className="text-[11px] text-ink-soft font-mono">
                Deductible under both regimes
              </span>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-ink">PRAN (Permanent Retirement Account Number)</label>
              <input
                type="text"
                value={pranNumber}
                onChange={(e) => setPranNumber(e.target.value)}
                placeholder="12-digit PRAN number"
                className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent max-w-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Other Chapter VI-A Panel */}
      {activeCategory === 'other' && (
        <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="font-sans text-lg font-bold text-ink">
                Other Chapter VI-A Deductions
              </h3>
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
              <h4 className="font-semibold text-xs text-ink">Section 80E - Higher Education Loan Interest</h4>
              <p className="text-[11px] text-ink-soft">No upper limit on interest paid for 8 consecutive years</p>
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
              <h4 className="font-semibold text-xs text-ink">Section 80G - Donations to Charitable Funds</h4>
              <p className="text-[11px] text-ink-soft">Donations to PM Relief, approved NGOs & Trusts</p>
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
              <h4 className="font-semibold text-xs text-ink">Section 80TTA - Savings Account Interest</h4>
              <p className="text-[11px] text-ink-soft">Deduction up to ₹10,000 on savings bank interest</p>
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
              <h4 className="font-semibold text-xs text-ink">Section 80EEB - Electric Vehicle (EV) Loan Interest</h4>
              <p className="text-[11px] text-ink-soft">Interest deduction up to ₹1,50,000 on EV loans</p>
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
              <h4 className="font-semibold text-xs text-ink">Section 80EEA - Affordable Housing Loan Interest</h4>
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
              <h4 className="font-semibold text-xs text-ink">Section 80U / 80DD - Person with Disability</h4>
              <p className="text-[11px] text-ink-soft">Fixed deduction (₹75,000 normal / ₹1,25,000 severe)</p>
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
      )}

      {/* 7. Previous Employment (Form 12B) Panel */}
      {activeCategory === 'previous-employment' && (
        <div className="border border-line rounded-2xl p-6 bg-bg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="font-sans text-lg font-bold text-ink">
                Previous Employment Details (Form 12B)
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                If you joined in FY {financialYear}, declare earnings & TDS from your previous employer to prevent under-deduction.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Gross Salary from Previous Employer</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={prevGrossSalary}
                  onChange={(e) => setPrevGrossSalary(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">TDS Deducted by Previous Employer</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={prevTdsDeducted}
                  onChange={(e) => setPrevTdsDeducted(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Provident Fund (PF) Deducted</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={prevPfDeducted}
                  onChange={(e) => setPrevPfDeducted(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Professional Tax (PT) Paid</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={prevPtDeducted}
                  onChange={(e) => setPrevPtDeducted(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-bg text-ink font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>
        </div>
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
