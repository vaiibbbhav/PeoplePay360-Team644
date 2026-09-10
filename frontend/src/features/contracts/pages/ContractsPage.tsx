import React, { useState } from 'react';
import {
  useContractsList,
  useCreateContract,
  useUpdateContract,
  type ContractItem,
  type CreateContractPayload,
  type ContractStatus,
} from '../queries/useContracts';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatGrid } from '@/components/ui/StatCard';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';
import { ContractTable } from '../components/ContractTable';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { ContractFormDrawer } from '../components/ContractFormDrawer';
import { useCurrentUser } from '@/features/auth/queries/useAuth';

export const ContractsPage: React.FC = () => {
  const { data: contracts = [], isLoading, error } = useContractsList();
  const createContractMutation = useCreateContract();
  const updateContractMutation = useUpdateContract();
  const { data: user } = useCurrentUser();
  const canWrite = user?.role !== 'Employee';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter logic
  const filtered = contracts.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(term) ||
      (c.employee_name && c.employee_name.toLowerCase().includes(term)) ||
      (c.job_position_title && c.job_position_title.toLowerCase().includes(term)) ||
      (c.department_name && c.department_name.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalCount = contracts.length;
  const activeCount = contracts.filter((c) => c.status === 'active').length;
  const draftCount = contracts.filter((c) => c.status === 'draft').length;

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoonCount = contracts.filter((c) => {
    if (c.status !== 'active' || !c.end_date) return false;
    const end = new Date(c.end_date);
    return end >= now && end <= thirtyDaysLater;
  }).length;

  const handleOpenCreate = () => {
    setEditingContract(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (contract: ContractItem) => {
    setEditingContract(contract);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (payload: CreateContractPayload) => {
    if (editingContract) {
      await updateContractMutation.mutateAsync({
        id: editingContract.id,
        data: payload,
      });
    } else {
      await createContractMutation.mutateAsync(payload);
    }
  };

  return (
    <AppLayout title="Contracts">
      <main className="max-w-6xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5 sm:pb-6">
          <div>
            <div className="mb-1">
              <span className="text-xs font-mono text-accent font-medium">Core HR</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
              Contracts
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
              Employee employment contracts, salary structures, wage terms, and active period
              status.
            </p>
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <span>+</span>
              <span>New Contract</span>
            </button>
          )}
        </div>

        {/* Stat Cards */}
        <StatGrid
          columns={4}
          items={[
            {
              label: 'Total Agreements',
              value: totalCount,
              subtext: 'Historical & active contracts',
            },
            {
              label: 'Active Contracts',
              value: activeCount,
              subtext: 'Governing ongoing payrolls',
            },
            {
              label: 'Draft Agreements',
              value: draftCount,
              subtext: 'Pending activation & execution',
            },
            {
              label: 'Expiring in <30 Days',
              value: expiringSoonCount,
              subtext: 'Requires extension or renewal',
            },
          ]}
          isLoading={isLoading}
          skeletonCount={4}
        />

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-line bg-bg">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, title, position, or department..."
          />

          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as ContractStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table / Content */}
        {isLoading ? (
          <div className="border border-line rounded-2xl p-16 flex flex-col items-center justify-center gap-3 bg-bg">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-ink-soft">Loading employment agreements...</span>
          </div>
        ) : error ? (
          <div className="border border-line rounded-2xl p-12 text-center bg-bg">
            <p className="text-over-red text-xs m-0">Failed to load contracts.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line rounded-2xl p-16 text-center bg-bg">
            <h3 className="font-sans text-lg font-bold text-ink mb-1">No contracts found</h3>
            <p className="text-xs text-ink-soft mb-4">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Execute your first contract to establish compensation baseline'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>+</span> New Contract
            </button>
          </div>
        ) : (
          <ContractTable
            contracts={filtered}
            onSelect={(c) => setSelectedContract(c)}
            onEdit={handleOpenEdit}
          />
        )}
      </main>

      {/* Contract Detail Modal */}
      <ContractDetailModal
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
        onEdit={(c) => {
          setSelectedContract(null);
          handleOpenEdit(c);
        }}
      />

      {/* Contract Form Drawer */}
      <ContractFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingContract}
        isSubmitting={createContractMutation.isPending || updateContractMutation.isPending}
      />
    </AppLayout>
  );
};
