'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import UserTable, { AdminUser } from '@/components/admin/UserTable';
import EditUserModal from '@/components/admin/EditUserModal';
import { useAppStore } from '@/store/useAppStore';

const API = process.env.NEXT_PUBLIC_API_URL;

function buildHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function fetchUsers(token: string, params: URLSearchParams) {
  const res = await fetch(`${API}/admin/users?${params}`, { headers: buildHeaders(token) });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function updateUserApi(token: string, id: string, body: Partial<AdminUser>) {
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function deleteUserApi(token: string, id: string, hard = false) {
  const res = await fetch(`${API}/admin/users/${id}?hard=${hard}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export default function AdminUsersPage() {
  const { token } = useAppStore();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { isActive: statusFilter }),
    sortBy: sortField,
    sortOrder,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter, sortField, sortOrder],
    queryFn: () => fetchUsers(token!, params),
    enabled: !!token,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<AdminUser> }) =>
      updateUserApi(token!, id, body),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, hard }: { id: string; hard: boolean }) =>
      deleteUserApi(token!, id, hard),
    onSuccess: (_, { hard }) => {
      toast.success(hard ? 'User deleted' : 'User deactivated');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  }, [sortField]);

  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleRoleChange = useCallback((v: string) => { setRoleFilter(v); setPage(1); }, []);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all farmers, buyers, and admins</p>
        </div>
      </div>

      {/* Table */}
      <UserTable
        users={data?.data || []}
        total={data?.pagination?.total || 0}
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        isLoading={isLoading}
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        onPageChange={setPage}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        onEdit={setEditUser}
        onDelete={setDeleteTarget}
      />

      {/* Edit Modal */}
      <EditUserModal
        user={editUser}
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSave={async (id, body) => {
          await updateMutation.mutateAsync({ id, body });
        }}
      />

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {deleteTarget.isActive ? 'Deactivate User?' : 'Delete User?'}
                    </h3>
                    <p className="text-xs text-slate-400">{deleteTarget.name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {deleteTarget.isActive
                    ? 'This will deactivate the user account. They will not be able to log in.'
                    : 'This will permanently delete the user and all associated data. This cannot be undone.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  {deleteTarget.isActive ? (
                    <button
                      onClick={() => deleteMutation.mutate({ id: deleteTarget._id, hard: false })}
                      disabled={deleteMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" /> Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteMutation.mutate({ id: deleteTarget._id, hard: true })}
                      disabled={deleteMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
