import React from 'react';

export type CompensationTab =
  | 'pay-slips'
  | 'pay-package'
  | 'tax-sheet'
  | 'it-declaration'
  | 'extra-payments'
  | 'loans'
  | 'payroll-docs';

export type CompensationTabsProps = {
  activeTab: CompensationTab;
  onTabChange: (tab: CompensationTab) => void;
};

const TABS: Array<{ id: CompensationTab; label: string; badge?: string }> = [
  { id: 'pay-slips', label: 'Pay Slips' },
  { id: 'pay-package', label: 'Pay Package' },
  { id: 'tax-sheet', label: 'Tax Sheet' },
  { id: 'it-declaration', label: 'IT Declaration', badge: 'ACTIVE' },
  { id: 'extra-payments', label: 'Extra Payments' },
  { id: 'loans', label: 'Loans' },
  { id: 'payroll-docs', label: 'Payroll Documents' },
];

export const CompensationTabs: React.FC<CompensationTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-line overflow-x-auto scrollbar-none">
      <nav className="flex space-x-6 min-w-max" aria-label="Compensation sub-navigation">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                    tab.badge === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : tab.badge === 'CLOSED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-accent-soft text-accent'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
