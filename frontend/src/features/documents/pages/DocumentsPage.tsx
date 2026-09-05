import React, { useState, useMemo } from 'react';
import { EmployeeLayout } from '@/features/employee/components/EmployeeLayout';
import {
  useUserDocuments,
  useAcceptDocument,
  useAcceptAllDocuments,
  type Policy,
} from '../queries/useDocuments';
import { ComplianceHeader } from '../components/ComplianceHeader';
import { PolicyFilterBar } from '../components/PolicyFilterBar';
import { PolicyCard } from '../components/PolicyCard';
import { PolicyViewerModal } from '../components/PolicyViewerModal';
import { AcceptAllModal } from '../components/AcceptAllModal';

export const DocumentsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useUserDocuments();
  const acceptMutation = useAcceptDocument();
  const acceptAllMutation = useAcceptAllDocuments();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [showAcceptAllModal, setShowAcceptAllModal] = useState(false);

  const policies = data?.policies;

  // Filter policies based on search, category, and status
  const filteredPolicies = useMemo(() => {
    if (!policies) return [];

    return policies.filter((policy) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = policy.title.toLowerCase().includes(q);
        const matchesCode = policy.code.toLowerCase().includes(q);
        const matchesSummary = policy.summary.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesSummary) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && policy.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pending' && policy.isAccepted) return false;
      if (statusFilter === 'accepted' && !policy.isAccepted) return false;

      return true;
    });
  }, [policies, search, selectedCategory, statusFilter]);

  const pendingPolicies = useMemo(() => {
    return policies?.filter((p) => !p.isAccepted) || [];
  }, [policies]);

  const handleAcceptSingle = async (policy: Policy) => {
    await acceptMutation.mutateAsync({ id: policy.id, version: policy.version });
    if (viewingPolicy?.id === policy.id) {
      setViewingPolicy((prev) =>
        prev ? { ...prev, isAccepted: true, acceptedAt: new Date().toISOString() } : null,
      );
    }
  };

  const handleConfirmAcceptAll = async () => {
    await acceptAllMutation.mutateAsync();
    setShowAcceptAllModal(false);
  };

  return (
    <EmployeeLayout title="Policies & Documents">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-ink-soft">Loading compliance documents...</p>
          </div>
        )}

        {isError && (
          <div className="p-8 text-center bg-bg-raised border border-line rounded-2xl">
            <p className="text-xs text-red-500 font-medium mb-3">
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
                    isAccepting={
                      acceptMutation.isPending && acceptMutation.variables?.id === policy.id
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-bg-raised border border-line rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-bg-sunken border border-line flex items-center justify-center mx-auto mb-3 text-ink-faint">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-sm font-serif font-medium text-ink">No policies found</h4>
                <p className="text-xs text-ink-soft mt-1">
                  Try adjusting your search query or switching filters.
                </p>
              </div>
            )}

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
          </>
        )}
      </div>
    </EmployeeLayout>
  );
};
