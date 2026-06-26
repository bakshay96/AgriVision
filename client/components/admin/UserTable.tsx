'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  UserCheck,
  UserX,
  MoreHorizontal,
  Pencil,
  Trash2,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  state?: string;
  createdAt: string;
  lastLogin?: string;
  farmName?: string;
  updatedBy?: { name: string; email: string } | null;
  updatedAt?: string;
}

interface UserTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  isLoading?: boolean;
  search: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onChangePassword?: (user: AdminUser) => void;
}

const roleStyles: Record<string, string> = {
  FARMER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  BUYER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/20',
};

function SortIcon({ field, current, order }: { field: string; current: string; order: 'asc' | 'desc' }) {
  if (field !== current) return <ChevronUp className="h-3 w-3 text-slate-300 dark:text-slate-600" />;
  return order === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-indigo-500" />
  ) : (
    <ChevronDown className="h-3 w-3 text-indigo-500" />
  );
}

export default function UserTable({
  users, total, page, totalPages, isLoading,
  search, statusFilter,
  onSearchChange, onStatusChange,
  onPageChange, onSort, sortField, sortOrder,
  onEdit, onDelete, onChangePassword,
}: UserTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const columns = [
    { key: 'name', label: 'User' },
    { key: 'role', label: 'Role' },
    { key: 'state', label: 'State' },
    { key: 'isActive', label: 'Status' },
    { key: 'lastLogin', label: 'Last Login' },
    { key: 'createdAt', label: 'Joined' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-6 text-sm text-slate-700 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400">{total.toLocaleString()} users</span>
      </div>

      {/* Mobile Card-based UI */}
      <div className="grid gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400 text-sm">
            No users found
          </div>
        ) : (
          users.map((u) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm hover:border-amber-400/50 transition-colors"
            >
              {/* Card Header: Avatar & Profile */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 text-white text-xs font-bold shadow-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800 dark:text-white text-sm">{u.name}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', roleStyles[u.role] || 'bg-slate-100 text-slate-600')}>
                    {u.role}
                  </span>
                  <span className={cn(
                    'flex items-center gap-1 text-[10px] font-bold',
                    u.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', u.isActive ? 'bg-indigo-500' : 'bg-red-500')} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Card details */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-50 dark:border-slate-800/60 pt-3 text-slate-500 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">State</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{u.state || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Farm Name</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{u.farmName || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Last Login</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Joined</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {u.updatedBy && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/5 rounded px-2 py-1 flex items-center gap-1">
                  <span>✎ Edited by {u.updatedBy.name}</span>
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-50 dark:border-slate-800/60 pt-3 justify-end">
                <button
                  onClick={() => onEdit(u)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                {onChangePassword && (
                  <button
                    onClick={() => onChangePassword(u)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Key className="h-3 w-3" /> Password
                  </button>
                )}
                <button
                  onClick={() => onDelete(u)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors',
                    u.isActive
                      ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-950/20 dark:border-red-900/30'
                      : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                  )}
                >
                  <Trash2 className="h-3 w-3" /> {u.isActive ? 'Deactivate' : 'Delete'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.key} current={sortField} order={sortOrder} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3.5 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <motion.tr
                  key={u._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 text-white text-xs font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800 dark:text-white text-sm">{u.name}</p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                        {u.updatedBy && (
                          <p className="truncate text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            ✎ Edited by {u.updatedBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', roleStyles[u.role] || 'bg-slate-100 text-slate-600')}>
                      {u.role}
                    </span>
                  </td>

                  {/* State */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {u.state || <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'flex items-center gap-1.5 text-xs font-medium',
                      u.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', u.isActive ? 'bg-indigo-500' : 'bg-red-500')} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy') : '—'}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === u._id ? null : u._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      <AnimatePresence>
                        {openMenu === u._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden"
                          >
                            <button
                              onClick={() => { onEdit(u); setOpenMenu(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit User
                            </button>
                            {onChangePassword && (
                              <button
                                onClick={() => { onChangePassword(u); setOpenMenu(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Key className="h-3.5 w-3.5" />
                                Change Password
                              </button>
                            )}
                            <div className="border-t border-slate-100 dark:border-slate-800" />
                            <button
                              onClick={() => { onDelete(u); setOpenMenu(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {u.isActive ? 'Deactivate' : 'Delete'}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'h-7 w-7 rounded-lg text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
