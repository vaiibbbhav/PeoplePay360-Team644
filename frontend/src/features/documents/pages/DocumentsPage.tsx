import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import {
  useUserDocuments,
  useAcceptDocument,
  useAcceptAllDocuments,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  type Policy,
  type CreatePolicyPayload,
} from '../queries/useDocuments';
import { ComplianceHeader } from '../components/ComplianceHeader';
import { PolicyFilterBar } from '../components/PolicyFilterBar';
import { PolicyCard } from '../components/PolicyCard';
import { PolicyViewerModal } from '../components/PolicyViewerModal';
import { AcceptAllModal } from '../components/AcceptAllModal';
import { PolicyFormDrawer } from '../components/PolicyFormDrawer';
import { CompanyComplianceTable } from '../components/CompanyComplianceTable';

export const DocumentsPage: React.FC = () => {
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useUserDocuments();
  const acceptMutation = useAcceptDocument();
  const acceptAllMutation = useAcceptAllDocuments();
  const createPolicyMutation = useCreatePolicy();
  const updatePolicyMutation = useUpdatePolicy();
  const deletePolicyMutation = useDeletePolicy();

  const isHrAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Payroll Manager';

  const [activeTab, setActiveTab] = useState<'catalog' | 'audit'>('catalog');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [showAcceptAllModal, setShowAcceptAllModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<{ id: string; title: string } | null>(null);

  const policies = data?.policies;

  // Filter policies based on search, category, and status
  const filteredPolicies = useMemo(() => {
    if (!policies) return [];

    return policies.filter((policy) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = policy.title.toLowerCase().includes(q);
        const matchesCode = policy.code.toLowerCase().includes(q);
        const matchesSummary = policy.summary.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesSummary) return false;
      }

      if (selectedCategory !== 'all' && policy.category !== selectedCategory) {
        return false;
      }

      if (statusFilter === 'pending' && policy.isAccepted) return false;
      if (statusFilter === 'accepted' && !policy.isAccepted) return false;

      return true;
    });
  }, [policies, search, selectedCategory, statusFilter]);

  const pendingPolicies = useMemo(() => {
    return policies?.filter((p) => !p.isAccepted) || [];
  }, [policies]);

  const handleAcceptSingle = async (policy: Policy) => {
    try {
      await acceptMutation.mutateAsync({ id: policy.id, version: policy.version });
      if (viewingPolicy?.id === policy.id) {
        setViewingPolicy(null);
      }
    } catch {
      alert(`Failed to submit acknowledgment for ${policy.title}. Please check server connection.`);
    }
  };

  const handleConfirmAcceptAll = async () => {
    await acceptAllMutation.mutateAsync();
    setShowAcceptAllModal(false);
  };

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (payload: CreatePolicyPayload) => {
    if (editingPolicy) {
      await updatePolicyMutation.mutateAsync({
        id: editingPolicy.id,
        data: payload,
      });
    } else {
      await createPolicyMutation.mutateAsync(payload);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPolicy) return;
    await deletePolicyMutation.mutateAsync(deletingPolicy.id);
    setDeletingPolicy(null);
  };

  return (
    <AppLayout title="Policies & Documents">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
        {/* Page Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h1 className="text-2xl font-sans font-bold text-ink">Policies & Documents</h1>
            <p className="text-xs text-ink-soft mt-0.5">Compliance, Regulations & Employee Acknowledgment</p>
          </div>
          {isHrAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>+</span> New Policy
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-ink-soft">Loading compliance documents...</p>
          </div>
        )}

        {/* If Admin/HR Manager, show sub-tabs between catalog and company audit */}
        {isHrAdmin && (
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                activeTab === 'catalog'
                  ? 'border-accent bg-accent-soft text-accent font-semibold'
                  : 'border-line bg-bg text-ink-soft hover:text-ink'
              }`}
            >
              Documents Catalog & Sign-off
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                activeTab === 'audit'
                  ? 'border-accent bg-accent-soft text-accent font-semibold'
                  : 'border-line bg-bg text-ink-soft hover:text-ink'
              }`}
            >
              Company Compliance Audit Roster
            </button>
          </div>
        )}

        {activeTab === 'audit' && isHrAdmin ? (
          <CompanyComplianceTable
            onEditPolicy={(policyId) => {
              const matched = policies?.find((p) => p.id === policyId);
              if (matched) {
                handleOpenEdit(matched);
              }
            }}
            onDeletePolicy={(policyId, title) => setDeletingPolicy({ id: policyId, title })}
          />
        ) : (
          <>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-ink-soft">Loading compliance documents...</p>
              </div>
            )}

            {isError && (
              <div className="p-8 text-center bg-bg-raised border border-line rounded-2xl">
                <p className="text-xs text-over-red font-medium mb-3">
                  Failed to load company policies.
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 text-xs font-medium bg-accent text-accent-ink rounded-lg cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {data && (
              <>
                {/* Header with compliance tracker & Accept All trigger */}
                <ComplianceHeader
                  stats={data.stats}
                  onAcceptAllClick={() => setShowAcceptAllModal(true)}
                  isAcceptingAll={acceptAllMutation.isPending}
                />

                {/* Filter controls */}
                <PolicyFilterBar
                  search={search}
                  onSearchChange={setSearch}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />

                {/* Grid of Policies */}
                {filteredPolicies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPolicies.map((policy) => (
                      <PolicyCard
                        key={policy.id}
                        policy={policy}
                        onView={(p) => setViewingPolicy(p)}
                        onAccept={handleAcceptSingle}
                        onEdit={isHrAdmin ? handleOpenEdit : undefined}
                        isAccepting={
                          acceptMutation.isPending && acceptMutation.variables?.id === policy.id
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-bg-raised border border-line rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-bg border border-line flex items-center justify-center mx-auto mb-3 text-ink-soft">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-sans font-medium text-ink">No policies found</h4>
                    <p className="text-xs text-ink-soft mt-1">
                      Try adjusting your search query or switching filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {/* Full Document Reader Modal */}
      <PolicyViewerModal
        policy={viewingPolicy}
        isOpen={Boolean(viewingPolicy)}
        onClose={() => setViewingPolicy(null)}
        onAccept={handleAcceptSingle}
        isAccepting={acceptMutation.isPending}
      />

      {/* Bulk Acceptance Modal */}
      <AcceptAllModal
        isOpen={showAcceptAllModal}
        onClose={() => setShowAcceptAllModal(false)}
        pendingPolicies={pendingPolicies}
        onConfirm={handleConfirmAcceptAll}
        isAccepting={acceptAllMutation.isPending}
      />

      {/* Policy Form Drawer for Creating/Editing */}
      <PolicyFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingPolicy}
        isSubmitting={createPolicyMutation.isPending || updatePolicyMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-bg border border-line rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-sans text-lg font-bold text-ink m-0">Delete Policy Document?</h3>
            <p className="text-xs text-ink-soft leading-relaxed m-0">
              Are you sure you want to delete <b className="text-ink">{deletingPolicy.title}</b>?
              This will remove the policy and historical acceptance records.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPolicy(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletePolicyMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deletePolicyMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
