import React, { useState } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useApproveLeaveRequest, type TimeOffRequest } from '../queries/useTimeOff';
import { RefuseLeaveModal } from './RefuseLeaveModal';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Pagination, usePagination } from '@/components/ui/Pagination';

type LeaveRequestsTableProps = {
  requests: TimeOffRequest[];
  isLoading?: boolean;
  canManage?: boolean;
};

export const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  requests,
  isLoading,
  canManage,
}) => {
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedRequests,
  } = usePagination(requests, 15);
  const approveMutation = useApproveLeaveRequest();
  const [selectedForRefusal, setSelectedForRefusal] = useState<TimeOffRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending Review
          </span>
        );
      case 'refused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Refused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-bg-raised text-ink-soft border border-line">
            {status}
          </span>
        );
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionError(null);
      await approveMutation.mutateAsync(id);
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to approve request.',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="border border-line rounded-2xl p-8 sm:p-12 text-center bg-bg font-sans">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-ink-soft">Loading leave requests ledger...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="border border-line rounded-2xl p-8 sm:p-12 text-center bg-bg font-sans">
        <div className="w-12 h-12 rounded-2xl bg-bg-raised border border-line flex items-center justify-center mx-auto mb-3 text-ink-soft">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="font-sans text-base font-medium text-ink">No Leave Requests Found</h4>
        <p className="text-xs text-ink-soft max-w-sm mx-auto mt-1">
          No records match your active view or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {actionError && <InlineAlert>{actionError}</InlineAlert>}
      <div className="border border-line rounded-2xl overflow-hidden bg-bg">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-bg-raised/60 text-ink-soft uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 sm:px-4 font-semibold">Employee</th>
                <th className="py-3 px-3.5 sm:px-4 font-semibold">Leave Type</th>
                <th className="py-3 px-3.5 sm:px-4 font-semibold">Date Range</th>
                <th className="py-3 px-3.5 sm:px-4 font-semibold">Duration</th>
                <th className="py-3 px-3.5 sm:px-4 font-semibold">Status</th>
                <th className="py-3 px-3.5 sm:px-4 font-semibold">Reason / Audit</th>
                {canManage && <th className="py-3 px-3.5 sm:px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paginatedRequests.map((req) => (
                <tr key={req.id} className="hover:bg-bg-raised/40 transition-colors">
                  {/* Employee */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent/20 text-accent flex items-center justify-center text-xs font-semibold shrink-0">
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
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
                          {req.employee_name || req.employee_id}
                        </div>
                        <div className="text-[10px] text-ink-soft truncate">
                          {req.department_name || 'General Staff'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Leave Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-ink">{req.type_name}</div>
                    <div className="text-[10px] text-ink-soft">
                      {req.is_paid ? 'Paid Time Off' : 'Unpaid Leave'}
                    </div>
                  </td>

                  {/* Date Range */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-ink">
                      {req.start_date} → {req.end_date}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-ink">
                    {req.duration} {req.type_unit}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>

                  {/* Reason / Notes */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="space-y-0.5">
                      {req.reason && (
                        <p className="text-xs text-ink truncate" title={req.reason}>
                          {req.reason}
                        </p>
                      )}
                      {req.status === 'refused' && req.refused_reason && (
                        <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 italic">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate" title={req.refused_reason}>
                            Refusal: {req.refused_reason}
                          </span>
                        </div>
                      )}
                      {req.status === 'approved' && req.approved_at && (
                        <span className="text-[10px] text-ink-soft">
                          Approved on {new Date(req.approved_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedForRefusal(req)}
                            className="px-2.5 py-1 rounded-lg border border-line hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] font-medium transition-colors"
                          >
                            Refuse
                          </button>
                          <button
                            type="button"
                            disabled={approveMutation.isPending}
                            onClick={() => handleApprove(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-accent text-white hover:bg-accent/90 text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-soft italic">Completed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={requests.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 15, 25, 50]}
          itemName="leave requests"
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      <RefuseLeaveModal
        isOpen={Boolean(selectedForRefusal)}
        onClose={() => setSelectedForRefusal(null)}
        request={selectedForRefusal}
      />
    </div>
  );
};
