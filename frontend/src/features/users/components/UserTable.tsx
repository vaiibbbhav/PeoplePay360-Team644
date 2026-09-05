import React from 'react';
import type { UserItem } from '../queries/useUsers';

interface UserTableProps {
  users: UserItem[];
  selectedUserId: string | null;
  onSelectUser: (user: UserItem) => void;
  onNewUser: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  isLoading: boolean;
}

const roleBadgeColors: Record<string, string> = {
  Admin:
    'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
  'HR Manager':
    'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
  'HR Payroll Manager':
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
  'HR Payroll User':
    'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
  Employee:
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  onNewUser,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  isLoading,
}) => {
  return (
    <div className="flex flex-col h-full bg-bg border border-line rounded-2xl overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="p-4 sm:p-5 border-b border-line bg-bg-raised/40 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 gap-2.5 items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft pointer-events-none"
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
              placeholder="Search by email, name or role..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-lg border border-line bg-bg text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent cursor-pointer transition-colors"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR Manager">HR Manager</option>
            <option value="HR Payroll Manager">HR Payroll Manager</option>
            <option value="HR Payroll User">HR Payroll User</option>
            <option value="Employee">Employee</option>
          </select>
        </div>

        {/* New User Button */}
        <button
          onClick={onNewUser}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New User
        </button>
      </div>

      {/* Directory Count Header */}
      <div className="px-5 py-2.5 bg-bg-raised/20 border-b border-line flex items-center justify-between text-xs text-ink-soft">
        <span>Directory Records ({users.length})</span>
        <span>Click any row to view or edit access</span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[360px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-ink-soft">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading accounts directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-ink-soft">
            <svg
              className="w-12 h-12 text-ink-soft/40 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-sm font-medium text-ink">No matching user accounts</p>
            <p className="text-xs text-ink-soft mt-1">
              Try adjusting your search criteria or create a new user.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg-raised/50 text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                <th className="py-3 px-4">User Account</th>
                <th className="py-3 px-4">Linked Employee</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-xs">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId;
                const initials = u.employee
                  ? `${u.employee.firstName?.[0] || ''}${u.employee.lastName?.[0] || ''}`.toUpperCase()
                  : u.email.substring(0, 2).toUpperCase();

                return (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent/10 hover:bg-accent/15' : 'hover:bg-bg-raised/60'
                    }`}
                  >
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate">{u.email}</div>
                          <div className="text-[11px] text-ink-soft truncate">
                            ID: {u.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Linked Employee */}
                    <td className="py-3 px-4">
                      {u.employee ? (
                        <div>
                          <div className="font-medium text-ink">
                            {u.employee.firstName} {u.employee.lastName}
                          </div>
                          <div className="text-[11px] text-ink-soft">
                            {u.employee.employeeNumber}
                            {u.employee.department && ` • ${u.employee.department.name}`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink-soft/70 italic text-[11px]">
                          Unlinked (System Admin)
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          roleBadgeColors[u.role] || roleBadgeColors.Employee
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(u);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
                      >
                        {isSelected ? 'Editing' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
