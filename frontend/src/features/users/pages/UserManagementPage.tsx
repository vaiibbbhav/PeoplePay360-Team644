import React, { useState } from 'react';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import {
  useUsersList,
  useEmployeeOptions,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type UserItem,
} from '../queries/useUsers';
import { UserAddModal } from '../components/UserAddModal';
import { UserEditModal } from '../components/UserEditModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useNavigate } from 'react-router-dom';

// ── Helper ─────────────────────────────────────────────────────────────────
const roleBadge: Record<string, string> = {
  Admin: 'bg-accent text-white border border-accent',
  'HR Manager': 'bg-black text-white border border-black dark:bg-neutral-950 dark:border-neutral-700',
  'HR Payroll Manager':
    'bg-black text-white border border-black dark:bg-neutral-950 dark:border-neutral-700',
  'HR Payroll User':
    'bg-black text-white border border-black dark:bg-neutral-950 dark:border-neutral-700',
  Employee: 'bg-bg text-ink-soft border border-line',
};

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isAuthLoading } = useCurrentUser();

  // ─ Search / filter state ─
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // ─ Modal states ─
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // ─ Queries ─
  const { data: users = [], isLoading: isUsersLoading } = useUsersList({
    search: search.trim() || undefined,
    role: roleFilter || undefined,
  });
  const { data: employees = [] } = useEmployeeOptions();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // ─ Auth guard ─
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-ink-soft">Checking credentials...</span>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center py-24 px-6">
        <div className="max-w-md w-full border border-line rounded-xl p-8 text-center bg-bg-raised">
          <div className="w-10 h-10 rounded-full bg-over-red/10 text-over-red mx-auto flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-ink">Admin Access Restricted</h2>
          <p className="text-xs text-ink-soft mt-2 leading-relaxed">
            User Management is restricted to system administrators only.
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

  // ─ Handlers ─
  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleteError('');
    try {
      await deleteMutation.mutateAsync(deleteUserId);
      setDeleteUserId(null);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to delete user';
      setDeleteError(msg);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
    return (
      u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || name.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto w-full px-6 sm:px-8 py-8">
      {/* ── Page heading ── */}
      <div className="mb-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          User Management
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Manage users and their assigned roles within the organization.
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-line my-6" />

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-5">
        {/* Search */}
        <div className="relative w-full sm:w-1/3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Right: role filter + add button */}
        <div className="flex items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR Manager">HR Manager</option>
            <option value="HR Payroll Manager">HR Payroll Manager</option>
            <option value="HR Payroll User">HR Payroll User</option>
            <option value="Employee">Employee</option>
          </select>

          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-bg-raised border-b border-line text-xs font-semibold text-ink-soft uppercase tracking-wider">
              <th className="py-3 px-4 w-14">S.No.</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isUsersLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-soft">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <p className="text-sm text-ink-soft">
                    {search ? 'No users found matching your search' : 'No users found'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—';
                return (
                  <tr key={u.id} className="bg-bg hover:bg-bg-raised/50 transition-colors">
                    {/* S.No. */}
                    <td className="py-3 px-4 text-ink-soft text-xs">{idx + 1}.</td>

                    {/* Name */}
                    <td className="py-3 px-4 font-medium text-ink">{displayName}</td>

                    {/* Email */}
                    <td className="py-3 px-4 text-ink-soft">{u.email}</td>

                    {/* Role badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          roleBadge[u.role] ?? 'bg-bg text-ink-soft border border-line'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-ink bg-bg-raised border border-line">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-ink-soft bg-bg border border-line">
                          <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/40" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions dropdown */}
                    <td className="py-3 px-4 text-right">
                      <ActionsMenu
                        onEdit={() => setEditUser(u)}
                        onDelete={() => {
                          setDeleteError('');
                          setDeleteUserId(u.id);
                        }}
                        canDelete={u.id !== currentUser?.id}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}
      <UserAddModal
        isOpen={addOpen}
        employees={employees}
        isPending={createMutation.isPending}
        onClose={() => setAddOpen(false)}
        onSave={async (data) => {
          await createMutation.mutateAsync(data);
          setAddOpen(false);
        }}
      />

      <UserEditModal
        isOpen={Boolean(editUser)}
        user={editUser}
        employees={employees}
        isPending={updateMutation.isPending}
        onClose={() => setEditUser(null)}
        onSave={async (id, data) => {
          await updateMutation.mutateAsync({ id, input: data });
          setEditUser(null);
        }}
      />

      <DeleteConfirmDialog
        isOpen={Boolean(deleteUserId)}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteUserId(null);
          setDeleteError('');
        }}
      />
    </div>
  );
};

// ── Actions dropdown (self-contained) ──────────────────────────────────────
type ActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  canDelete?: boolean;
};

const ActionsMenu: React.FC<ActionsMenuProps> = ({ onEdit, onDelete, canDelete = true }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 rounded-md border border-line bg-bg hover:bg-bg-raised text-ink-soft transition-colors cursor-pointer"
      >
        {/* MoreHorizontal icon */}
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Menu */}
          <div className="absolute right-0 mt-1 z-20 w-36 rounded-lg border border-line bg-bg shadow-sm py-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              {/* Pencil icon */}
              <svg
                className="w-3.5 h-3.5 text-ink-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-over-red hover:bg-bg-raised transition-colors cursor-pointer"
              >
                {/* Trash icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remove
              </button>
            ) : (
              <div
                title="Cannot delete active logged-in account"
                className="w-full flex items-center gap-2 px-3 py-2 text-ink-soft/40 cursor-not-allowed select-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remove
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
