import React from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import type { LeaveBalanceItem } from '../queries/useTimeOff';

type LeaveBalanceCardsProps = {
  balances: LeaveBalanceItem[];
  onApplyLeave: (typeId?: string) => void;
  isLoading?: boolean;
};

export const LeaveBalanceCards: React.FC<LeaveBalanceCardsProps> = ({
  balances,
  onApplyLeave,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-48 bg-ink/10 rounded animate-pulse" />
            <div className="h-3 w-64 bg-ink/10 rounded mt-1.5 animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-ink/10 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-line bg-bg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-12 bg-ink/10 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-ink/10 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-12 bg-ink/10 rounded animate-pulse" />
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <div className="h-8 w-16 bg-ink/10 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-ink/10 rounded animate-pulse" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-full bg-ink/10 rounded-full animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-2.5 w-16 bg-ink/10 rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-ink/10 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <div className="h-3 w-20 bg-ink/10 rounded animate-pulse" />
                <div className="h-3 w-14 bg-ink/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="border border-line rounded-2xl p-4 sm:p-6 bg-bg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center border border-accent/20 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-sans font-medium text-ink">No Active Leave Allocations</h4>
            <p className="text-xs text-ink-soft mt-0.5">
              Contact your HR administrator to set up your annual vacation, sick, and casual leave
              quotas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onApplyLeave()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div>
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Leave Quotas &amp; Balances
        </h3>
        <p className="text-xs text-ink-soft mt-0.5">
          Available annual allocations, taken leaves, and active quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {balances.map((item) => {
          const percentUsed =
            item.allocated > 0 ? Math.min(100, Math.round((item.taken / item.allocated) * 100)) : 0;

          return (
            <div
              key={item.typeId}
              className="p-5 sm:p-6 rounded-2xl border border-line bg-bg hover:border-line-strong transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                {/* Header: Name + Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-serif font-bold text-ink truncate leading-tight">
                    {item.typeName}
                  </h4>
                  {item.isPaid ? (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                      Paid
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-ink-soft shrink-0">Unpaid</span>
                  )}
                </div>

                {/* Big Metric Display */}
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-sans text-ink tracking-tight">
                    {item.requiresAllocation ? item.remaining.toFixed(1) : '∞'}
                  </span>
                  <span className="text-xs text-ink-soft font-medium">days available</span>
                </div>

                {/* Progress Bar (Only for quota-based allocations) */}
                {item.requiresAllocation ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full bg-line/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentUsed > 80 ? 'bg-amber-500' : 'bg-accent'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft font-mono">
                      <span>Used: {item.taken.toFixed(1)}d</span>
                      <span>Total: {item.allocated.toFixed(1)}d</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-ink-soft">Unlimited policy quota</div>
                )}
              </div>

              {/* Bottom Row */}
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                <span className="text-[11px] text-ink-soft">
                  {item.requiresAllocation ? `${percentUsed}% used` : 'No deduction'}
                </span>
                <button
                  type="button"
                  onClick={() => onApplyLeave(item.typeId)}
                  className="text-xs font-semibold text-accent hover:opacity-85 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  <span>Request</span>
                  <Clock className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
