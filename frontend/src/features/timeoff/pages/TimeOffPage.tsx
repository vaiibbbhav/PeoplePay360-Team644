import React, { useState } from 'react';
import {
  useTimeOffRequests,
  useTimeOffAllocations,
  useTimeOffTypes,
  useApproveRequest,
  useRefuseRequest,
  useApproveAllocation,
} from '../queries/useTimeOff';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatGrid } from '@/components/ui/StatCard';
import { RequestTimeOffModal } from '../components/RequestTimeOffModal';
import { useCurrentUser } from '@/features/auth/queries/useAuth';

export const TimeOffPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const isEmployeeRole = user?.role === 'Employee';
  const canApprove = user?.role === 'Admin' || user?.role === 'HR Manager';

  const employeeFilterId = isEmployeeRole ? (user?.employee?.id || user?.employeeId || undefined) : undefined;

  const { data: requests = [], isLoading: loadingRequests } = useTimeOffRequests(employeeFilterId);
  const { data: allocations = [], isLoading: loadingAllocations } = useTimeOffAllocations(employeeFilterId);
  const { data: types = [] } = useTimeOffTypes();

  const approveRequestMutation = useApproveRequest();
  const refuseRequestMutation = useRefuseRequest();
  const approveAllocMutation = useApproveAllocation();

  const [activeTab, setActiveTab] = useState<'requests' | 'allocations' | 'types'>('requests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'refused'>('all');
  const [search, setSearch] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [refusingRequestId, setRefusingRequestId] = useState<string | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      (r.employee_name && r.employee_name.toLowerCase().includes(term)) ||
      (r.type_name && r.type_name.toLowerCase().includes(term)) ||
      (r.reason && r.reason.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalApprovedDays = requests
    .filter((r) => r.status === 'approved')
    .reduce((acc, r) => acc + (parseFloat(r.duration) || 0), 0);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const totalRemainingBalance = allocations
    .filter((a) => a.status === 'approved')
    .reduce((acc, a) => acc + (parseFloat(a.remaining_amount) || 0), 0);

  const handleApproveRequest = async (id: string) => {
    setActionError(null);
    try {
      await approveRequestMutation.mutateAsync(id);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || err.message || 'Approval failed');
    }
  };

  const handleRefuseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refusingRequestId) return;
    setActionError(null);
    try {
      await refuseRequestMutation.mutateAsync({
        id: refusingRequestId,
        reason: refuseReason.trim() || undefined,
      });
      setRefusingRequestId(null);
      setRefuseReason('');
    } catch (err: any) {
      setActionError(err?.response?.data?.error || err.message || 'Refusal failed');
    }
  };

  const handleApproveAllocation = async (id: string) => {
    setActionError(null);
    try {
      await approveAllocMutation.mutateAsync(id);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || err.message || 'Allocation approval failed');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        );
      case 'pending':
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
      case 'refused':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Refused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-bg-raised text-ink-soft border border-line">
            {status}
          </span>
        );
    }
  };

  return (
    <AppLayout
      title="Time Off & Leaves"
      actions={
        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>+</span> Request Time Off
        </button>
      }
    >
      <main className="max-w-6xl mx-auto w-full flex-1 md:px-6 py-8 space-y-8 font-sans">
        {/* KPI Cards */}
        <StatGrid
          columns={4}
          items={[
            {
              label: 'Approved Leave Days',
              value: `${totalApprovedDays.toFixed(1)}d`,
              subtext: 'Accumulated approved leaves',
            },
            {
              label: 'Pending Requests',
              value: String(pendingCount),
              subtext: 'Awaiting HR sign-off',
            },
            {
              label: 'Available Balance',
              value: `${totalRemainingBalance.toFixed(1)}d`,
              subtext: 'Allocated days remaining',
            },
            {
              label: 'Configured Types',
              value: String(types.length),
              subtext: 'Active leave policies',
            },
          ]}
        />

        {actionError && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-over-red rounded-xl">
            {actionError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-ink text-bg font-semibold'
                  : 'bg-bg text-ink-soft hover:text-ink hover:bg-bg-raised'
              }`}
            >
              Leave Requests ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('allocations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'allocations'
                  ? 'bg-ink text-bg font-semibold'
                  : 'bg-bg text-ink-soft hover:text-ink hover:bg-bg-raised'
              }`}
            >
              Allocations ({allocations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('types')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'types'
                  ? 'bg-ink text-bg font-semibold'
                  : 'bg-bg text-ink-soft hover:text-ink hover:bg-bg-raised'
              }`}
            >
              Leave Policies ({types.length})
            </button>
          </div>

          {activeTab === 'requests' && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests..."
                className="px-3 py-1.5 text-xs border border-line rounded-lg bg-bg text-ink focus:outline-hidden focus:border-accent w-48"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-line rounded-lg bg-bg text-ink focus:outline-hidden focus:border-accent cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="refused">Refused</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Requests Table */}
        {activeTab === 'requests' && (
          <div className="border border-line rounded-2xl overflow-hidden bg-bg">
            {loadingRequests ? (
              <div className="p-8 text-center text-xs text-ink-soft">Loading leave requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-ink-soft">
                <p className="text-sm font-medium mb-2">No leave requests found</p>
                <p className="text-xs mb-4">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Submit your first leave request to get started'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 cursor-pointer"
                >
                  + Request Time Off
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-bg-raised text-ink-soft uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-semibold">Employee</th>
                      <th className="py-3 px-4 font-semibold">Leave Type</th>
                      <th className="py-3 px-4 font-semibold">Period & Dates</th>
                      <th className="py-3 px-4 font-semibold">Duration</th>
                      <th className="py-3 px-4 font-semibold">Reason</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      {canApprove && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-bg-raised/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-accent-soft border border-accent/20 text-accent font-bold text-[11px] flex items-center justify-center shrink-0">
                              {(req.employee_name || 'E').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-ink block">
                                {req.employee_name || 'Employee'}
                              </span>
                              <span className="text-[10px] text-ink-soft block">
                                {req.employee_email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-ink">
                          {req.type_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-ink font-medium block">
                            {req.start_date} to {req.end_date}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-ink">
                            {req.duration} {req.type_unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-ink-soft">
                          {req.reason || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(req.status)}
                          {req.refused_reason && (
                            <span className="block text-[10px] text-over-red mt-0.5">
                              {req.refused_reason}
                            </span>
                          )}
                        </td>
                        {canApprove && (
                          <td className="py-3.5 px-4 text-right">
                            {req.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApproveRequest(req.id)}
                                  disabled={approveRequestMutation.isPending}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer border border-emerald-500/20"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRefusingRequestId(req.id)}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer border border-red-500/20"
                                >
                                  Refuse
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-ink-soft italic">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Allocations Table */}
        {activeTab === 'allocations' && (
          <div className="border border-line rounded-2xl overflow-hidden bg-bg">
            {loadingAllocations ? (
              <div className="p-8 text-center text-xs text-ink-soft">Loading allocations...</div>
            ) : allocations.length === 0 ? (
              <div className="p-12 text-center text-ink-soft">
                <p className="text-sm font-medium mb-1">No leave allocations found</p>
                <p className="text-xs">Leave balances are allocated per annual cycle</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-bg-raised text-ink-soft uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-semibold">Employee</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Allocated</th>
                      <th className="py-3 px-4 font-semibold">Taken</th>
                      <th className="py-3 px-4 font-semibold">Remaining</th>
                      <th className="py-3 px-4 font-semibold">Validity</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      {canApprove && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-bg-raised/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-ink">
                          {alloc.employee_name || 'Employee'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-ink">
                          {alloc.type_name}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-ink">
                          {alloc.allocated_amount} {alloc.type_unit}
                        </td>
                        <td className="py-3.5 px-4 text-ink-soft">
                          {alloc.taken_amount} {alloc.type_unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-accent">
                            {alloc.remaining_amount} {alloc.type_unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-ink-soft text-[11px]">
                          {alloc.valid_from} to {alloc.valid_to}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(alloc.status)}
                        </td>
                        {canApprove && (
                          <td className="py-3.5 px-4 text-right">
                            {alloc.status === 'draft' && (
                              <button
                                type="button"
                                onClick={() => handleApproveAllocation(alloc.id)}
                                disabled={approveAllocMutation.isPending}
                                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer border border-emerald-500/20"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Leave Policies / Types */}
        {activeTab === 'types' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {types.map((type) => (
              <div
                key={type.id}
                className="border border-line rounded-2xl p-6 bg-bg flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold tracking-tight text-ink m-0">
                      {type.name}
                    </h3>
                    {type.isPaid ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Paid Leave
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-bg-raised text-ink-soft border border-line">
                        Unpaid Leave
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-ink-soft mt-3">
                    <div className="flex justify-between">
                      <span>Code:</span>
                      <span className="font-mono font-semibold text-ink">{type.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit of tracking:</span>
                      <span className="capitalize font-medium text-ink">{type.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requires allocation:</span>
                      <span className="font-medium text-ink">
                        {type.requiresAllocation ? 'Yes (Pre-allocated)' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval workflow:</span>
                      <span className="capitalize font-medium text-ink">
                        {type.approvalType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Request Modal */}
      <RequestTimeOffModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* Refuse Dialog */}
      {refusingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-bg border border-line rounded-2xl w-full max-w-sm p-6 space-y-4 font-sans shadow-xl">
            <h3 className="text-base font-bold text-ink m-0">Refuse Leave Request</h3>
            <p className="text-xs text-ink-soft m-0">
              Provide a reason for turning down this leave application.
            </p>
            <form onSubmit={handleRefuseRequest} className="space-y-4">
              <textarea
                rows={3}
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="e.g. Coverage shortfall during project sprint..."
                required
                className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-bg text-ink focus:outline-hidden focus:border-accent"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefusingRequestId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refuseRequestMutation.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {refuseRequestMutation.isPending ? 'Refusing...' : 'Confirm Refusal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TimeOffPage;
