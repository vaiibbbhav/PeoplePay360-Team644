import React from 'react';
import { Calendar, Plus, Clock, ShieldCheck } from 'lucide-react';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="border border-line rounded-2xl p-6 bg-bg flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center border border-accent/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-sans font-medium text-ink">No Active Leave Allocations</h4>
            <p className="text-xs text-ink-soft">
              Contact your HR administrator to set up your annual vacation, sick, and casual leave quotas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onApplyLeave()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
            Available Leave Quotas & Balances
          </h3>
          <p className="text-xs text-ink-soft">
            Annual entitlements, taken days, and remaining valid quota.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApplyLeave()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply for Leave</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((item) => {
          const percentUsed =
            item.allocated > 0
              ? Math.min(100, Math.round((item.taken / item.allocated) * 100))
              : 0;

          return (
            <div
              key={item.typeId}
              className="p-4 rounded-2xl border border-line bg-bg hover:border-line-strong transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ink-soft">
                      {item.typeCode}
                    </span>
                    <h4 className="text-base font-sans font-medium text-ink leading-tight">
                      {item.typeName}
                    </h4>
                  </div>
                  {item.isPaid ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Paid
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-ink-soft bg-bg-raised px-1.5 py-0.5 rounded border border-line">
                      Unpaid
                    </span>
                  )}
                </div>

                {/* Remaining Amount */}
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl lg:text-3xl font-sans font-bold text-ink tracking-tight">
                    {item.requiresAllocation ? item.remaining.toFixed(1) : '∞'}
                  </span>
                  <span className="text-xs text-ink-soft font-medium">
                    {item.unit} remaining
                  </span>
                </div>

                {/* Progress bar */}
                {item.requiresAllocation && (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full bg-bg-raised rounded-full overflow-hidden border border-line">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentUsed > 80 ? 'bg-amber-500' : 'bg-accent'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft">
                      <span>Taken: {item.taken.toFixed(1)} {item.unit}</span>
                      <span>Total: {item.allocated.toFixed(1)} {item.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-[11px] text-ink-soft">
                  {item.requiresAllocation ? `${percentUsed}% consumed` : 'Unlimited'}
                </span>
                <button
                  type="button"
                  onClick={() => onApplyLeave(item.typeId)}
                  className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
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
