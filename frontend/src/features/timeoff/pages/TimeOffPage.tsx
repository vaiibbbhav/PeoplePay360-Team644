import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: meta } = useTimeOffMeta();

  const role = user?.role || 'Employee';
  const isHrOrAdmin = [
    'Admin',
    'HR Manager',
    'HR Payroll Manager',
    'HR Payroll User',
  ].includes(role);
  const isManager = meta?.isManager ?? false;

  // Active Tab
  type TabKey = 'my_leave' | 'team_approvals' | 'company_requests' | 'allocations' | 'policies';
  const [activeTab, setActiveTab] = useState<TabKey>('my_leave');

  // Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [prefilledTypeId, setPrefilledTypeId] = useState<string | undefined>(undefined);

  // Filter state for company requests
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const pendingTeamCount = teamRequests.filter((r) => r.status === 'pending').length;

  const handleOpenApply = (typeId?: string) => {
    setPrefilledTypeId(typeId);
    setIsApplyModalOpen(true);
  };

  // Filtered Company Requests
  const filteredCompanyRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.employee_name || '').toLowerCase();
        const dept = (r.department_name || '').toLowerCase();
        const type = (r.type_name || '').toLowerCase();
        if (!name.includes(q) && !dept.includes(q) && !type.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allRequests, statusFilter, searchQuery]);

  return (
    <AppLayout title="Time Off & Leaves">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
        {/* Sleek Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5 sm:pb-6">
          <div>
            <div className="mb-1">
              <span className="text-xs font-mono text-accent font-medium">
                Time & Attendance
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
              Time Off Requests
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
              Track personal leave quotas, review team requests, and govern organizational absence
              allocations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenApply()}
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* Editorial Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-bg-raised border border-line overflow-x-auto no-scrollbar">
          {/* Tab 1: My Leave & Balances */}
          <button
            type="button"
            onClick={() => setActiveTab('my_leave')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'my_leave'
                ? 'bg-bg text-ink shadow-xs border border-line font-semibold'
                : 'text-ink-soft hover:text-ink'
              }`}
          >
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>My Leave & Balances</span>
          </button>

          {/* Tab 2: Team Approvals (if Manager or HR) */}
          {(isManager || isHrOrAdmin) && (
            <button
              type="button"
              onClick={() => setActiveTab('team_approvals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'team_approvals'
                  ? 'bg-bg text-ink shadow-xs border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>Team Approvals</span>
              {pendingTeamCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingTeamCount}
                </span>
              )}
            </button>
          )}

          {/* Tab 3: Company Requests (HR / Admin) */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('company_requests')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'company_requests'
                  ? 'bg-bg text-ink shadow-xs border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Company Requests</span>
            </button>
          )}

          {/* Tab 4: Allocations Ledger (HR / Admin) */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('allocations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'allocations'
                  ? 'bg-bg text-ink shadow-xs border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Allocations Ledger</span>
            </button>
          )}

          {/* Tab 5: Leave Policies (HR / Admin) */}
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === 'policies'
                  ? 'bg-bg text-ink shadow-xs border border-line font-semibold'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <Settings className="w-3.5 h-3.5 text-accent" />
              <span>Leave Policies</span>
            </button>
          )}
        </div>

        {/* Tab 1 Content: My Leave & Balances */}
        {activeTab === 'my_leave' && (
          <div className="space-y-6 sm:space-y-8">
            <LeaveBalanceCards
              balances={balances}
              onApplyLeave={handleOpenApply}
              isLoading={isBalancesLoading}
            />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                My Leave History & Status
              </h3>
              <LeaveRequestsTable
                requests={myRequests}
                isLoading={isMyRequestsLoading}
                canManage={false}
              />
            </div>
          </div>
        )}

        {/* Tab 2 Content: Team Approvals */}
        {activeTab === 'team_approvals' && (
          <div className="space-y-6 sm:space-y-8">
            <TeamApprovalsSection requests={teamRequests} isLoading={isTeamRequestsLoading} />

            <div className="space-y-3 pt-4 border-t border-line">
              <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Historical Team Requests
              </h4>
              <LeaveRequestsTable
                requests={teamRequests.filter((r) => r.status !== 'pending')}
                isLoading={isTeamRequestsLoading}
                canManage={false}
              />
            </div>
          </div>
        )}

        {/* Tab 3 Content: Company Requests */}
        {activeTab === 'company_requests' && (
          <div className="space-y-6 sm:space-y-8">
            <TimeOffSummaryCards requests={allRequests} isLoading={isAllRequestsLoading} />

            {/* Filter Toolbar */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-line bg-bg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
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
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <LeaveRequestsTable
              requests={filteredCompanyRequests}
              isLoading={isAllRequestsLoading}
              canManage={isHrOrAdmin}
            />
          </div>
        )}

        {/* Tab 4 Content: Allocations Ledger */}
        {activeTab === 'allocations' && (
          <AllocationsTable canManage={isHrOrAdmin} />
        )}

        {/* Tab 5 Content: Leave Policies */}
        {activeTab === 'policies' && (
          <LeaveTypesTable canManage={isHrOrAdmin} />
        )}

        {/* Apply Leave Modal */}
        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          initialTypeId={prefilledTypeId}
        />
      </div>
    </AppLayout>
  );
};

export default TimeOffPage;
