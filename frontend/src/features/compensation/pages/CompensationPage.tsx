import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '@/features/auth/queries/useAuth';
import { useEmployeePayslips, usePayslipDetail } from '../queries/useEmployeePayslips';
import { CompensationHeader } from '../components/CompensationHeader';
import { CompensationTabs, type CompensationTab } from '../components/CompensationTabs';
import { PayslipsTable } from '../components/PayslipsTable';
import { MonthlyPayslipDocument } from '../components/MonthlyPayslipDocument';
import { YearlyPayslipDocument } from '../components/YearlyPayslipDocument';
import { PayPackageTab } from '../components/PayPackageTab';
import { TaxSheetTab } from '../components/TaxSheetTab';
import { ITDeclarationTab } from '../components/ITDeclarationTab';

export const CompensationPage: React.FC = () => {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const logout = useLogout();

  const [activeTab, setActiveTab] = useState<CompensationTab>('pay-slips');
  const [financialYear, setFinancialYear] = useState<string>('2026-27');
  const [showValues, setShowValues] = useState<boolean>(true);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [isYearlyDocumentOpen, setIsYearlyDocumentOpen] = useState<boolean>(false);

  // If user has linked employeeId, pass it to filter their specific payslips.
  // Otherwise, queries all available payslips (for Admin/HR testing preview).
  const targetEmployeeId = user?.employeeId || undefined;
  const {
    data: payslips = [],
    isLoading: isPayslipsLoading,
    isError: isPayslipsError,
    refetch: refetchPayslips,
  } = useEmployeePayslips(targetEmployeeId);

  const { data: activePayslipDetail } = usePayslipDetail(selectedPayslipId);

  const handleDownloadPayslip = (payslipId: string) => {
    setSelectedPayslipId(payslipId);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-accent-soft selection:text-accent">
      {/* Top Application Header */}
      <header className="border-b border-line px-6 sm:px-8 py-3.5 flex justify-between items-center bg-bg sticky top-0 z-40">
        <div className="flex items-center gap-5 sm:gap-7">
          <Link to="/dashboard" className="flex items-center gap-1.5 no-underline">
            <span className="font-serif text-xl font-bold tracking-tight text-ink">
              PeoplePay<span className="text-accent">360</span>
            </span>
          </Link>

          <span className="text-line">/</span>

          <span className="font-serif text-sm font-semibold text-ink">Compensation Hub</span>

          {user?.role && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-accent-soft text-accent font-medium">
              {user.role}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-xs text-ink-soft hover:text-ink transition-colors no-underline hidden sm:inline-block"
          >
            ← Back to Dashboard
          </Link>

          <div className="h-4 w-px bg-line hidden sm:block" />

          {user && (
            <span className="text-xs text-ink-soft hidden md:inline-block">{user.email}</span>
          )}

          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Compensation Content Area */}
      <main className="max-w-6xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Header with Title and Controls */}
        <CompensationHeader
          financialYear={financialYear}
          onFinancialYearChange={setFinancialYear}
          showValues={showValues}
          onToggleShowValues={() => setShowValues((prev) => !prev)}
        />

        {/* Navigation Tabs */}
        <CompensationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'pay-slips' && (
            <PayslipsTable
              payslips={payslips}
              isLoading={isPayslipsLoading || isUserLoading}
              isError={isPayslipsError}
              showValues={showValues}
              onViewPayslip={(id) => setSelectedPayslipId(id)}
              onDownloadPayslip={handleDownloadPayslip}
              onOpenYearlyPayslips={() => setIsYearlyDocumentOpen(true)}
              onRetry={refetchPayslips}
            />
          )}

          {activeTab === 'pay-package' && (
            <PayPackageTab employeeId={targetEmployeeId} showValues={showValues} />
          )}

          {activeTab === 'tax-sheet' && <TaxSheetTab showValues={showValues} />}

          {activeTab === 'it-declaration' && <ITDeclarationTab />}

          {(activeTab === 'extra-payments' ||
            activeTab === 'loans' ||
            activeTab === 'payroll-docs') && (
            <div className="py-14 border border-line rounded-xl bg-bg-raised text-center p-8">
              <h3 className="font-serif text-base font-semibold text-ink mb-1">
                No Records for FY {financialYear}
              </h3>
              <p className="text-xs text-ink-soft max-w-sm mx-auto">
                No active entries, claims, or attachments found under this section for the selected
                financial year.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Monthly Salary Slip Modal (Exact match to reference Image 2) */}
      {selectedPayslipId && activePayslipDetail && (
        <MonthlyPayslipDocument
          payslip={activePayslipDetail}
          onClose={() => setSelectedPayslipId(null)}
        />
      )}

      {/* Yearly Salary Slip Modal (Exact match to reference Image 1) */}
      {isYearlyDocumentOpen && (
        <YearlyPayslipDocument
          payslips={payslips}
          financialYear={financialYear}
          onClose={() => setIsYearlyDocumentOpen(false)}
        />
      )}

      {/* Bottom Footer */}
      <footer className="border-t border-line py-5 px-8 text-center text-xs text-ink-soft mt-12">
        PeoplePay360 — Integrated HR & Payroll Operations Platform
      </footer>
    </div>
  );
};
