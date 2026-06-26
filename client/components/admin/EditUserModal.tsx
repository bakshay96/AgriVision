'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminUser } from './UserTable';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<AdminUser>) => Promise<void>;
}

const ROLES = ['FARMER', 'BUYER', 'ADMIN'];
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

export default function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const [form, setForm] = useState<Partial<AdminUser>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        state: user.state || '',
        farmName: user.farmName || '',
        farmSizeAcres: user.farmSizeAcres || undefined,
        phoneNumber: user.phoneNumber || '',
        preferredLanguage: user.preferredLanguage || 'en',
        district: user.district || '',
        taluka: user.taluka || '',
        village: user.village || '',
        pincode: user.pincode || '',
        aadharNumber: user.aadharNumber || '',
        bankDetails: user.bankDetails ? {
          accountNumber: user.bankDetails.accountNumber || '',
          ifscCode: user.bankDetails.ifscCode || '',
          bankName: user.bankDetails.bankName || '',
        } : {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
        },
      });
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !form.name?.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email?.trim()) {
      setError('Email is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(user._id, form);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const setBank = (key: string, value: string) => {
    setForm((f) => ({
      ...f,
      bankDetails: {
        ...(f.bankDetails || {}),
        [key]: value,
      },
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && user && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Edit User Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 p-5">
                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-800/50">
                    {error}
                  </div>
                )}

                {/* Section 1: Core details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Account Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name *</label>
                      <input
                        value={form.name || ''}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Email *</label>
                      <input
                        value={form.email || ''}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Phone Number</label>
                      <input
                        value={form.phoneNumber || ''}
                        onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role</label>
                      <div className="flex gap-2">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, role: r }))}
                            className={cn(
                              'flex-1 rounded-xl border py-2 text-xs font-bold transition-all',
                              form.role === r
                                ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Account Status</label>
                    <div className="flex gap-2">
                      {[true, false].map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, isActive: v }))}
                          className={cn(
                            'flex-1 rounded-xl border py-2 text-xs font-bold transition-all',
                            form.isActive === v
                              ? v
                                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'border-red-405 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                          )}
                        >
                          {v ? 'Active' : 'Inactive'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Address */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Address & Location</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">State</label>
                      <select
                        value={form.state || ''}
                        onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Select state…</option>
                        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">District</label>
                      <input
                        value={form.district || ''}
                        onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                        placeholder="District name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Taluka</label>
                      <input
                        value={form.taluka || ''}
                        onChange={(e) => setForm((f) => ({ ...f, taluka: e.target.value }))}
                        placeholder="Taluka name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Village</label>
                      <input
                        value={form.village || ''}
                        onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
                        placeholder="Village name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Pincode</label>
                      <input
                        value={form.pincode || ''}
                        onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
                        placeholder="6-digit pincode"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Aadhar Number</label>
                      <input
                        value={form.aadharNumber || ''}
                        onChange={(e) => setForm((f) => ({ ...f, aadharNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 12) }))}
                        placeholder="12-digit Aadhar"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Farmer specific */}
                {form.role === 'FARMER' && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Agricultural Details</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Farm Name</label>
                        <input
                          value={form.farmName || ''}
                          onChange={(e) => setForm((f) => ({ ...f, farmName: e.target.value }))}
                          placeholder="Farm name"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Farm Size (Acres)</label>
                        <input
                          type="number"
                          value={form.farmSizeAcres !== undefined ? form.farmSizeAcres : ''}
                          onChange={(e) => setForm((f) => ({ ...f, farmSizeAcres: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          placeholder="Acres"
                          min="0"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Preferred Language</label>
                      <select
                        value={form.preferredLanguage || 'en'}
                        onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value as 'en' | 'hi' | 'mr' }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="mr">Marathi</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Section 4: Bank details */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Bank Details</h4>
                  
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Bank Name</label>
                    <input
                      value={form.bankDetails?.bankName || ''}
                      onChange={(e) => setBank('bankName', e.target.value)}
                      placeholder="Bank name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Account Number</label>
                      <input
                        value={form.bankDetails?.accountNumber || ''}
                        onChange={(e) => setBank('accountNumber', e.target.value)}
                        placeholder="Account number"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">IFSC Code</label>
                      <input
                        value={form.bankDetails?.ifscCode || ''}
                        onChange={(e) => setBank('ifscCode', e.target.value.toUpperCase())}
                        placeholder="IFSC code"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900 z-10">
                <button
                  onClick={onClose}
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors shadow-md shadow-amber-500/20"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
