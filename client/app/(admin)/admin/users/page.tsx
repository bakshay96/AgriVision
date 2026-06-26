'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Trash2, X, UserPlus, Tractor,
  ShoppingBag, Shield, Users, Eye, EyeOff,
  RefreshCw, Pencil, Key, LayoutGrid, List
} from 'lucide-react';
import UserTable, { AdminUser } from '@/components/admin/UserTable';
import EditUserModal from '@/components/admin/EditUserModal';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

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

async function createUserApi(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/admin/users`, {
    method: 'POST', headers: buildHeaders(token), body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function updateUserApi(token: string, id: string, body: Partial<AdminUser>) {
  const res = await fetch(`${API}/admin/users/${id}`, {
    method: 'PUT', headers: buildHeaders(token), body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function changePasswordApi(token: string, id: string, password: string) {
  const res = await fetch(`${API}/admin/users/${id}/password`, {
    method: 'PUT', headers: buildHeaders(token), body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function deleteUserApi(token: string, id: string, hard = false) {
  const res = await fetch(`${API}/admin/users/${id}?hard=${hard}`, {
    method: 'DELETE', headers: buildHeaders(token),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { label: 'All Users', value: '', icon: Users, color: 'text-slate-600 dark:text-slate-300' },
  { label: 'Farmers', value: 'FARMER', icon: Tractor, color: 'text-green-600 dark:text-green-400' },
  { label: 'Buyers', value: 'BUYER', icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Admins', value: 'ADMIN', icon: Shield, color: 'text-amber-600 dark:text-amber-400' },
];

// ─── Create User Modal ────────────────────────────────────────────────────────
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu and Kashmir','Ladakh','Puducherry','Chandigarh',
];

function CreateUserModal({ isOpen, onClose, onSave }: CreateUserModalProps) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'FARMER',
    state: '', farmName: '', phoneNumber: '', isActive: true,
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setForm({ name: '', email: '', password: '', role: 'FARMER', state: '', farmName: '', phoneNumber: '', isActive: true });
    setError(''); setSaving(false); setShowPw(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ ...form, name: form.name.trim(), email: form.email.trim() });
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create user');
    } finally { setSaving(false); }
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-amber-200/60 bg-white shadow-2xl shadow-amber-500/10 dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Create New User</h3>
                    <p className="text-[10px] text-slate-400">Add a farmer, buyer, or admin account</p>
                  </div>
                </div>
                <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                {error && (
                  <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-800/50">
                    {error}
                  </div>
                )}

                {/* Role */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role</label>
                  <div className="flex gap-2">
                    {[{ v: 'FARMER', label: '🌾 Farmer' }, { v: 'BUYER', label: '💼 Buyer' }, { v: 'ADMIN', label: '🛡️ Admin' }].map(({ v, label }) => (
                      <button key={v} type="button" onClick={() => set('role', v)}
                        className={cn('flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all',
                          form.role === v
                            ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajesh Kumar"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Email *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Password * (min 6 chars)</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="Set a strong password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Phone + State row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Phone Number</label>
                    <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+91 XXXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">State</label>
                    <select value={form.state} onChange={e => set('state', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <option value="">Select state…</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Farm Name (only for farmers) */}
                {form.role === 'FARMER' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Farm Name</label>
                    <input value={form.farmName} onChange={e => set('farmName', e.target.value)} placeholder="Optional farm name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                )}

                {/* Active status */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Account Status</label>
                  <div className="flex gap-2">
                    {[{ v: true, label: '✅ Active' }, { v: false, label: '⛔ Inactive' }].map(({ v, label }) => (
                      <button key={String(v)} type="button" onClick={() => set('isActive', v)}
                        className={cn('flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all',
                          form.isActive === v
                            ? v ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'border-red-400 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <button onClick={handleClose} type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} type="button"
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors shadow-md shadow-amber-500/20">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Create User
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
interface ChangePasswordModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, password: string) => Promise<void>;
}

function ChangePasswordModal({ user, isOpen, onClose, onSave }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => { setPassword(''); setError(''); setSaving(false); onClose(); };

  const handleSave = async () => {
    if (!user) return;
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true); setError('');
    try {
      await onSave(user._id, password);
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && user && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Change Password</h3>
                  <p className="text-xs text-slate-400">{user.name} · {user.email}</p>
                </div>
              </div>

              {error && (
                <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="relative mb-4">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={handleClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { token, viewMode, toggleViewMode } = useAppStore();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pwUser, setPwUser] = useState<AdminUser | null>(null);

  const params = new URLSearchParams({
    page: String(page), limit: '20',
    ...(search && { search }),
    ...(activeTab && { role: activeTab }),
    ...(statusFilter && { isActive: statusFilter }),
    sortBy: sortField, sortOrder,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, activeTab, statusFilter, sortField, sortOrder],
    queryFn: () => fetchUsers(token!, params),
    enabled: !!token,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => createUserApi(token!, body),
    onSuccess: () => { toast.success('User created successfully! 🎉'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<AdminUser> }) => updateUserApi(token!, id, body),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const pwMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => changePasswordApi(token!, id, password),
    onSuccess: () => { toast.success('Password changed successfully'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, hard }: { id: string; hard: boolean }) => deleteUserApi(token!, id, hard),
    onSuccess: (_, { hard }) => {
      toast.success(hard ? 'User permanently deleted' : 'User deactivated');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSort = useCallback((field: string) => {
    if (field === sortField) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
    setPage(1);
  }, [sortField]);

  const handleTabChange = (tab: string) => { setActiveTab(tab); setPage(1); };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">View, create, edit and manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleViewMode}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors shadow-sm"
            title={`Switch to ${viewMode === 'table' ? 'Card' : 'Table'} view`}
            type="button"
          >
            {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/50 overflow-x-auto">
        {TABS.map(({ label, value, icon: Icon, color }) => {
          const count = value === ''
            ? data?.pagination?.total
            : value === 'FARMER' ? data?.farmerCount
            : value === 'BUYER' ? data?.buyerCount
            : data?.adminCount;
          return (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all flex-1 justify-center min-w-[80px]',
                activeTab === value
                  ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-800 dark:text-white border border-amber-200/50 dark:border-amber-800/30'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', activeTab === value ? color : '')} />
              {label}
              {activeTab === value && count !== undefined && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <UserTable
        users={data?.data || []}
        total={data?.pagination?.total || 0}
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        isLoading={isLoading}
        search={search}
        roleFilter={activeTab}
        statusFilter={statusFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onRoleChange={() => {}}
        onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
        onPageChange={setPage}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        onEdit={setEditUser}
        onDelete={setDeleteTarget}
        onChangePassword={setPwUser}
        viewMode={viewMode}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={async (body) => { await createMutation.mutateAsync(body); }}
      />

      <EditUserModal
        user={editUser}
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSave={async (id, body) => { await updateMutation.mutateAsync({ id, body }); }}
      />

      <ChangePasswordModal
        user={pwUser}
        isOpen={!!pwUser}
        onClose={() => setPwUser(null)}
        onSave={async (id, password) => { await pwMutation.mutateAsync({ id, password }); }}
      />

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)} className="fixed inset-0 z-[140] bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {deleteTarget.isActive ? 'Deactivate User?' : 'Delete User?'}
                    </h3>
                    <p className="text-xs text-slate-400">{deleteTarget.name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {deleteTarget.isActive
                    ? 'This will deactivate the account. The user will not be able to log in.'
                    : 'This will permanently delete the user and all associated data.'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 transition-colors">
                    Cancel
                  </button>
                  {deleteTarget.isActive ? (
                    <button onClick={() => deleteMutation.mutate({ id: deleteTarget._id, hard: false })}
                      disabled={deleteMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                      <X className="h-3.5 w-3.5" /> Deactivate
                    </button>
                  ) : (
                    <button onClick={() => deleteMutation.mutate({ id: deleteTarget._id, hard: true })}
                      disabled={deleteMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
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
