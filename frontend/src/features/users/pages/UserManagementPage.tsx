import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import {
  useUsersList,
  useEmployeeOptions,
  useCreateUser,
  useUpdateUser,
  type UserItem,
} from '../queries/useUsers';
import { UserTable } from '../components/UserTable';
import { UserFormPanel } from '../components/UserFormPanel';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isAuthLoading } = useCurrentUser();

  // Search and filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Queries
  const { data: users = [], isLoading: isUsersLoading } = useUsersList({
    search: search.trim() || undefined,
    role: roleFilter || undefined,
  });

  const { data: employees = [] } = useEmployeeOptions();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-ink-soft">Checking credentials...</span>
        </div>
      </div>
    );
  }

  // Enforce Admin only
  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-bg border border-line rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-ink">Admin Access Restricted</h1>
          <p className="text-xs text-ink-soft mt-2 leading-relaxed">
            User Management is strictly restricted to system administrators with the{' '}
            <code className="px-1.5 py-0.5 rounded bg-bg-raised border border-line text-accent font-mono text-[11px]">
              Admin
            </code>{' '}
            role.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-line bg-bg-raised/40 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors no-underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Dashboard
            </Link>
            <span className="text-line">/</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-ink">User Management</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                ADMIN ONLY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-ink">{currentUser.email}</div>
              <div className="text-[11px] text-accent font-medium">Administrator</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent text-accent-ink font-semibold flex items-center justify-center text-xs">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Intro banner */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Access Control & Provisioning
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 max-w-3xl">
            Grant role-based credentials across Employee, HR, Payroll, and Administrative scopes.
            Each account can be tied directly to an employee profile for attendance tracking and
            payslip delivery.
          </p>
        </div>

        {/* Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.95fr] gap-6 items-start">
          {/* Left Column: Directory Table */}
          <div className="h-[680px]">
            <UserTable
              users={users}
              selectedUserId={selectedUser?.id || null}
              onSelectUser={(user) => setSelectedUser(user)}
              onNewUser={() => setSelectedUser(null)}
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              isLoading={isUsersLoading}
            />
          </div>

          {/* Right Column: Form Panel */}
          <div className="h-[680px]">
            <UserFormPanel
              selectedUser={selectedUser}
              employees={employees}
              onSaveCreate={async (data) => {
                await createUserMutation.mutateAsync(data);
              }}
              onSaveUpdate={async (id, data) => {
                await updateUserMutation.mutateAsync({ id, input: data });
              }}
              onCancel={() => setSelectedUser(null)}
              isSaving={createUserMutation.isPending || updateUserMutation.isPending}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
