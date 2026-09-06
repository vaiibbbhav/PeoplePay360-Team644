import React, { Suspense, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import {
  useSuspenseEmployeeHub,
  useEmployeeMeta,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../queries/useEmployees';
import { EmployeeHeaderCard } from '../components/EmployeeHeaderCard';
import { OverviewTab } from '../components/OverviewTab';
import { PersonalDetailsTab } from '../components/PersonalDetailsTab';
import { EmploymentDetailsTab } from '../components/EmploymentDetailsTab';
import { ContractsTab } from '../components/ContractsTab';
import { PayslipsTab } from '../components/PayslipsTab';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { InlineAlert } from '@/components/ui/InlineAlert';

import { AppLayout } from '@/components/layout/AppLayout';

type EmployeeProfileContentProps = {
  employeeId: string;
};

const EmployeeProfileContent: React.FC<EmployeeProfileContentProps> = ({ employeeId }) => {
  const navigate = useNavigate();
  const { data: employee } = useSuspenseEmployeeHub(employeeId);
  const { data: meta } = useEmployeeMeta();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'personal' | 'employment' | 'contracts' | 'payslips'
  >('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this employee record from the system?')) {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await deleteEmployeeMutation.mutateAsync(employeeId);
        navigate('/employees');
      } catch (err: any) {
        setDeleteError(err.response?.data?.error || err.message || 'Failed to delete employee');
        setIsDeleting(false);
      }
    }
  };

  return (
    <AppLayout
      title={`${employee.first_name} ${employee.last_name}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-bg border border-line text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-line bg-transparent text-over-red hover:bg-bg-raised transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      }
    >
      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 sm:py-8">
        {deleteError && <InlineAlert>{deleteError}</InlineAlert>}
        {/* Template Hero Banner */}
        <EmployeeHeaderCard employee={employee} onEdit={() => setIsEditModalOpen(true)} />

        {/* Primary Sub-Navigation Tabs matching template */}
        <div className="flex items-center gap-4 sm:gap-8 border-b border-line mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'overview'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'personal'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Personal Details
          </button>

          <button
            onClick={() => setActiveTab('employment')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'employment'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Employment Details
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'contracts'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Contracts
          </button>

          <button
            onClick={() => setActiveTab('payslips')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'payslips'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Payslips
          </button>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'overview' && <OverviewTab employee={employee} />}
        {activeTab === 'personal' && <PersonalDetailsTab employee={employee} />}
        {activeTab === 'employment' && <EmploymentDetailsTab employee={employee} />}
        {activeTab === 'contracts' && <ContractsTab employeeId={employee.id} />}
        {activeTab === 'payslips' && <PayslipsTab employeeId={employee.id} />}
      </div>

      {/* Edit Employee Modal */}
      {isEditModalOpen && meta && (
        <EmployeeFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={employee}
          meta={meta}
          onSave={async (data) => {
            await updateEmployeeMutation.mutateAsync({ id: employeeId, input: data });
          }}
          isSaving={updateEmployeeMutation.isPending}
        />
      )}
    </AppLayout>
  );
};

const ProfileLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-ink-soft">Loading employee operational profile...</span>
    </div>
  </div>
);

const ProfileErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => (
  <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-8 text-center">
    <div className="w-12 h-12 rounded-full bg-bg-raised text-over-red border border-line flex items-center justify-center mb-3">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    </div>
    <h2 className="font-sans text-2xl font-bold text-ink mb-2">Employee Record Not Found</h2>
    <p className="text-xs text-ink-soft max-w-sm mb-4">
      {error.message || 'The requested employee identifier could not be retrieved.'}
    </p>
    <div className="flex gap-3">
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-xs font-medium border border-line bg-bg-raised text-ink hover:border-ink-soft transition-colors cursor-pointer"
      >
        Retry Fetch
      </button>
      <Link
        to="/employees"
        className="px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-ink no-underline"
      >
        Return to Employee Directory
      </Link>
    </div>
  </div>
);

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useCurrentUser();

  const targetEmployeeId = id || user?.employeeId || user?.employee?.id;

  if (!targetEmployeeId) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="max-w-md p-6 rounded-2xl border border-line bg-bg-raised">
          <h2 className="font-sans text-xl font-bold text-ink mb-2">No Profile Linked</h2>
          <p className="text-xs text-ink-soft mb-4">
            Your user account is not linked to an employee profile record yet.
          </p>
          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-medium bg-accent text-accent-ink rounded-lg no-underline inline-block"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={(error, reset) => <ProfileErrorFallback error={error} reset={reset} />}
    >
      <Suspense fallback={<ProfileLoadingFallback />}>
        <EmployeeProfileContent employeeId={targetEmployeeId} />
      </Suspense>
    </ErrorBoundary>
  );
};
