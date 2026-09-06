import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import {
  useTimeOffMeta,
  useLeaveBalances,
  useTimeOffRequests,
  useTeamLeaveRequests,
} from '../queries/useTimeOff';
import { TimeOffSummaryCards } from '../components/TimeOffSummaryCards';
import { LeaveBalanceCards } from '../components/LeaveBalanceCards';
import { ApplyLeaveModal } from '../components/ApplyLeaveModal';
import { LeaveRequestsTable } from '../components/LeaveRequestsTable';
import { TeamApprovalsSection } from '../components/TeamApprovalsSection';
import { AllocationsTable } from '../components/AllocationsTable';
import { LeaveTypesTable } from '../components/LeaveTypesTable';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  ShieldCheck,
  Settings,
  AlertCircle,
} from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: meta } = useTimeOffMeta();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = user?.role || 'Employee';
  const isHrOrAdmin = [
    'Admin',
    'HR Manager',
    'HR Payroll Manager',
    'HR Payroll User',
  ].includes(role);
  const isManager = meta?.isManager ?? false;

  // Active Tab: Default to 'company_requests' for HR/Admin, 'my_leave' for standard employees
  type TabKey = 'company_requests' | 'team_approvals' | 'my_leave' | 'allocations' | 'policies';
  
  const getInitialTab = (): TabKey => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests' || tabParam === 'company_requests') return 'company_requests';
    if (tabParam === 'team' || tabParam === 'team_approvals') return 'team_approvals';
    if (tabParam === 'allocations') return 'allocations';
    if (tabParam === 'policies') return 'policies';
    if (tabParam === 'my_leave') return 'my_leave';
    return isHrOrAdmin ? 'company_requests' : 'my_leave';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

  // Sync tab with URL search params if changed externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'requests' || tabParam === 'company_requests') setActiveTab('company_requests');
      else if (tabParam === 'team' || tabParam === 'team_approvals') setActiveTab('team_approvals');
      else if (tabParam === 'allocations') setActiveTab('allocations');
      else if (tabParam === 'policies') setActiveTab('policies');
      else if (tabParam === 'my_leave') setActiveTab('my_leave');
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab === 'company_requests' ? 'requests' : tab);
      return next;
    });
  };

  // Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [prefilledTypeId, setPrefilledTypeId] = useState<string | undefined>(undefined);

  // Filter state for company requests
  const initialStatus = searchParams.get('status') || 'all';
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('employeeId') || '');

  const employeeId = user?.employeeId || undefined;

  // Queries
  const { data: balances = [], isLoading: isBalancesLoading } = useLeaveBalances(employeeId);

  // Own requests
  const { data: myRequests = [], isLoading: isMyRequestsLoading } = useTimeOffRequests({
    employeeId,
  });

  // Team requests (if manager)
  const { data: teamRequests = [], isLoading: isTeamRequestsLoading } = useTeamLeaveRequests();

  // All company requests (if HR/Admin)
  const { data: allRequests = [], isLoading: isAllRequestsLoading } = useTimeOffRequests(
    isHrOrAdmin ? undefined : { employeeId },
  );

  const pendingCompanyCount = useMemo(
    () => allRequests.filter((r) => r.status?.toLowerCase() === 'pending').length,
    [allRequests],
  );
  const approvedCompanyCount = useMemo(
    () => allRequests.filter((r) => r.status?.toLowerCase() === 'approved').length,
    [allRequests],
  );
  const refusedCompanyCount = useMemo(
    () => allRequests.filter((r) => r.status?.toLowerCase() === 'refused').length,
    [allRequests],
  );

  const pendingTeamCount = useMemo(
    () => teamRequests.filter((r) => r.status?.toLowerCase() === 'pending').length,
    [teamRequests],
  );

  const handleOpenApply = (typeId?: string) => {
    setPrefilledTypeId(typeId);
    setIsApplyModalOpen(true);
  };

  // Filtered Company Requests
  const filteredCompanyRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.employee_name || '').toLowerCase();
        const dept = (r.department_name || '').toLowerCase();
        const type = (r.type_name || '').toLowerCase();
        const empId = (r.employee_id || '').toLowerCase();
        if (!name.includes(q) && !dept.includes(q) && !type.includes(q) && !empId.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allRequests, statusFilter, searchQuery]);

  return (
    <AppLayout title="Time Off & Leaves">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10 font-sans">
        {/* Sleek Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5 sm:pb-6">
          <div>
            <div className="mb-1">
              <span className="text-xs font-mono text-accent font-medium">
                Time &amp; Attendance
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
              {isHrOrAdmin ? 'Time Off & Leave Management' : 'My Time Off & Leaves'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
              {isHrOrAdmin
                ? 'Review employee absence requests, govern leave allocations, and manage corporate time-off policies.'
                : 'Track personal leave quotas, review team requests, and submit absence requests.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenApply()}
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-accent text-accent-ink text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* Editorial Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-bg-raised border border-line overflow-x-auto no-scrollbar">
          {/* Tab 1 (for HR): Company Requests & Approvals */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => handleTabChange('company_requests')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'company_requests'
                  ? 'bg-bg text-ink border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Leave Requests &amp; Approvals</span>
              {pendingCompanyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-accent text-accent-ink">
                  {pendingCompanyCount}
                </span>
              )}
            </button>
          )}

          {/* Tab 2 (for HR): Allocations Ledger */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => handleTabChange('allocations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'allocations'
                  ? 'bg-bg text-ink border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Allocations Ledger</span>
            </button>
          )}

          {/* Tab 3 (for HR): Leave Policies */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => handleTabChange('policies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'policies'
                  ? 'bg-bg text-ink border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-accent" />
              <span>Leave Policies</span>
            </button>
          )}

          {/* Tab 4: Direct Team Approvals (if Manager) */}
          {(isManager || isHrOrAdmin) && (
            <button
              type="button"
              onClick={() => handleTabChange('team_approvals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'team_approvals'
                  ? 'bg-bg text-ink border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>Direct Team Approvals</span>
              {pendingTeamCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                  {pendingTeamCount}
                </span>
              )}
            </button>
          )}

          {/* Tab 5: My Leave & Balances */}
          <button
            type="button"
            onClick={() => handleTabChange('my_leave')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my_leave'
                ? 'bg-bg text-ink border border-line font-semibold'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>My Personal Leave</span>
          </button>
        </div>

        {/* ─── Tab Content: Company Requests & Approvals (HR Core Hub) ─── */}
        {activeTab === 'company_requests' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Operational Metrics Cards */}
            <TimeOffSummaryCards requests={allRequests} isLoading={isAllRequestsLoading} />

            {/* Prominent Actionable Approval Queue Alert */}
            {pendingCompanyCount > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink">
                      {pendingCompanyCount} Leave Request{pendingCompanyCount === 1 ? '' : 's'} Awaiting Your Decision
                    </h4>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Approving requests immediately updates allocation balances and links to payroll calculations.
                    </p>
                  </div>
                </div>
                {statusFilter !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    View Pending Queue ({pendingCompanyCount})
                  </button>
                )}
              </div>
            )}

            {/* Filter Toolbar with Quick Pills */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-bg space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <SearchInput
                  placeholder="Filter by employee name, department, or leave type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="w-full sm:w-auto">
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val)}
                  >
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="All Requests" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="all">All Requests ({allRequests.length})</SelectItem>
                      <SelectItem value="pending">Pending Review ({pendingCompanyCount})</SelectItem>
                      <SelectItem value="approved">Approved ({approvedCompanyCount})</SelectItem>
                      <SelectItem value="refused">Refused ({refusedCompanyCount})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Status Pill Bar */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-line/60 text-xs">
                <span className="text-[11px] font-medium text-ink-soft uppercase tracking-wider mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'border-accent bg-accent-soft text-accent font-semibold'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  All ({allRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  Pending Review ({pendingCompanyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('approved')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'approved'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  Approved ({approvedCompanyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('refused')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'refused'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                      : 'border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  Refused ({refusedCompanyCount})
                </button>

                {(statusFilter !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="ml-auto text-xs text-accent hover:underline font-medium cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Leave Requests Master Table */}
            <LeaveRequestsTable
              requests={filteredCompanyRequests}
              isLoading={isAllRequestsLoading}
              canManage={isHrOrAdmin}
            />
          </div>
        )}

        {/* ─── Tab Content: Direct Team Approvals ─── */}
        {activeTab === 'team_approvals' && (
          <div className="space-y-6 sm:space-y-8">
            <TeamApprovalsSection requests={teamRequests} isLoading={isTeamRequestsLoading} />

            <div className="space-y-3 pt-4 border-t border-line">
              <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Historical Team Requests
              </h4>
              <LeaveRequestsTable
                requests={teamRequests.filter((r) => r.status?.toLowerCase() !== 'pending')}
                isLoading={isTeamRequestsLoading}
                canManage={false}
              />
            </div>
          </div>
        )}

        {/* ─── Tab Content: Allocations Ledger ─── */}
        {activeTab === 'allocations' && (
          <AllocationsTable canManage={isHrOrAdmin} />
        )}

        {/* ─── Tab Content: Leave Policies ─── */}
        {activeTab === 'policies' && (
          <LeaveTypesTable canManage={isHrOrAdmin} />
        )}

        {/* ─── Tab Content: My Personal Leave & Balances ─── */}
        {activeTab === 'my_leave' && (
          <div className="space-y-6 sm:space-y-8">
            <LeaveBalanceCards
              balances={balances}
              onApplyLeave={handleOpenApply}
              isLoading={isBalancesLoading}
            />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                My Leave History &amp; Status
              </h3>
              <LeaveRequestsTable
                requests={myRequests}
                isLoading={isMyRequestsLoading}
                canManage={false}
              />
            </div>
          </div>
        )}

        {/* Apply Leave Modal */}
        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setPrefilledTypeId(undefined);
          }}
          initialTypeId={prefilledTypeId}
        />
      </div>
    </AppLayout>
  );
};
