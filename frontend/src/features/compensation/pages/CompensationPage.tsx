import React, { useState } from 'react';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { useEmployeePayslips, usePayslipDetail } from '../queries/useEmployeePayslips';
import { CompensationHeader } from '../components/CompensationHeader';
import { CompensationTabs, type CompensationTab } from '../components/CompensationTabs';
import { PayslipsTable } from '../components/PayslipsTable';
import { MonthlyPayslipDocument } from '../components/MonthlyPayslipDocument';
import { YearlyPayslipDocument } from '../components/YearlyPayslipDocument';
import { PayPackageTab } from '../components/PayPackageTab';
import { TaxSheetTab } from '../components/TaxSheetTab';
import { ITDeclarationTab } from '../components/ITDeclarationTab';
import { AppLayout } from '@/components/layout/AppLayout';

export const CompensationPage: React.FC = () => {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

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
    <AppLayout title="Compensation Hub">
      {/* Main Compensation Content Area */}
      <div className="max-w-6xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8 space-y-6">
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

          {activeTab === 'it-declaration' && (
            <ITDeclarationTab
              financialYear={financialYear}
              showValues={showValues}
              employeeId={targetEmployeeId}
            />
          )}

          {(activeTab === 'extra-payments' ||
            activeTab === 'loans' ||
            activeTab === 'payroll-docs') && (
            <div className="py-14 border border-line rounded-xl bg-bg-raised text-center p-8">
              <h3 className="font-sans text-base font-semibold text-ink mb-1">
                No Records for FY {financialYear}
              </h3>
              <p className="text-xs text-ink-soft max-w-sm mx-auto">
                No active entries, claims, or attachments found under this section for the selected
                financial year.
              </p>
            </div>
          )}
        </div>
      </div>

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
    </AppLayout>
  );
};
