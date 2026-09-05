import React, { useState } from 'react';
import { Check, X, Calendar, Users } from 'lucide-react';
import {
  useApproveLeaveRequest,
  type TimeOffRequest,
} from '../queries/useTimeOff';
import { RefuseLeaveModal } from './RefuseLeaveModal';

type TeamApprovalsSectionProps = {
  requests: TimeOffRequest[];
  isLoading?: boolean;
};

export const TeamApprovalsSection: React.FC<TeamApprovalsSectionProps> = ({
  requests,
  isLoading,
}) => {
  const approveMutation = useApproveLeaveRequest();
  const [selectedForRefusal, setSelectedForRefusal] = useState<TimeOffRequest | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to approve request.',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="border border-line rounded-2xl p-8 text-center bg-bg font-sans">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-ink-soft">Loading direct reports leave queue...</p>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="border border-line rounded-2xl p-8 text-center bg-bg font-sans">
        <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-line flex items-center justify-center mx-auto mb-3 text-ink-soft">
          <Users className="w-6 h-6 text-accent" />
        </div>
        <h4 className="font-serif text-base font-medium text-ink">All Team Requests Reviewed</h4>
        <p className="text-xs text-ink-soft max-w-sm mx-auto mt-1">
          You have 0 pending leave requests from your direct reports. New requests will appear here
          for review and approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
            <span>Direct Reports Approvals</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {pendingRequests.length} Pending
            </span>
          </h3>
          <p className="text-xs text-ink-soft">
            Review and take action on leave requests from team members reporting to you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingRequests.map((req) => (
          <div
            key={req.id}
            className="border border-line rounded-2xl bg-bg p-5 hover:border-line-strong transition-all flex flex-col justify-between"
          >
            <div>
              {/* Employee info header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent/20 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                  {req.employee_avatar ? (
                    <img
                      src={req.employee_avatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (req.employee_name || 'E').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-ink text-sm truncate">
                    {req.employee_name || req.employee_id}
                  </h4>
                  <div className="text-[11px] text-ink-soft truncate">
                    {req.job_position_title || 'Direct Report'} • {req.department_name || 'General'}
                  </div>
                </div>
              </div>

              {/* Leave detail chip */}
              <div className="p-3 bg-bg-raised/60 rounded-xl border border-line mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{req.type_name}</span>
                  <span className="font-mono font-bold text-accent">
                    {req.duration} {req.type_unit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {req.start_date} → {req.end_date}
                  </span>
                </div>
              </div>

              {/* Employee reason note */}
              {req.reason && (
                <div className="text-xs text-ink-soft italic mb-4 bg-bg-raised/20 p-2.5 rounded-lg border border-line/50">
                  &ldquo;{req.reason}&rdquo;
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-line flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedForRefusal(req)}
                className="flex-1 py-1.5 px-3 rounded-xl border border-line hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium text-ink-soft transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Refuse</span>
              </button>

              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={() => handleApprove(req.id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <RefuseLeaveModal
        isOpen={Boolean(selectedForRefusal)}
        onClose={() => setSelectedForRefusal(null)}
        request={selectedForRefusal}
      />
    </div>
  );
};
