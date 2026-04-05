'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IndianRupee, TrendingUp, TrendingDown, Plus, Calendar,
  Filter, Download, PieChart, ArrowUpRight, ArrowDownRight,
  Wallet, Receipt, Sprout, Tractor, Package, X, ChevronDown,
  ChevronUp
} from 'lucide-react';
import { financialApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';

interface FinancialRecord {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  cropId?: { name: string };
  relatedOrderId?: { orderNumber: string };
}

interface MonthlyData {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  profit: number;
}

const expenseCategories = [
  { id: 'seeds', name: 'Seeds', icon: Sprout },
  { id: 'fertilizers', name: 'Fertilizers', icon: Package },
  { id: 'pesticides', name: 'Pesticides', icon: Package },
  { id: 'labor', name: 'Labor', icon: Tractor },
  { id: 'equipment', name: 'Equipment', icon: Tractor },
  { id: 'irrigation', name: 'Irrigation', icon: Package },
  { id: 'transport', name: 'Transport', icon: Package },
  { id: 'storage', name: 'Storage', icon: Package },
  { id: 'other', name: 'Other', icon: Receipt },
];

const incomeCategories = [
  { id: 'crop_sales', name: 'Crop Sales', icon: Sprout },
  { id: 'byproduct_sales', name: 'By-product Sales', icon: Package },
  { id: 'subsidies', name: 'Government Subsidies', icon: Receipt },
  { id: 'insurance', name: 'Insurance Claims', icon: Receipt },
  { id: 'other', name: 'Other', icon: Receipt },
];

export default function FinancialPage() {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<'income' | 'expense'>('expense');
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial', 'summary', selectedYear],
    queryFn: () => financialApi.getSummary({ year: selectedYear }).then(r => r.data.data),
  });

  // Fetch records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['financial', 'records'],
    queryFn: () => financialApi.getRecords({ limit: 100 }).then(r => r.data.data),
  });

  const summary = summaryData?.summary;
  const monthlyBreakdown: MonthlyData[] = summaryData?.monthlyBreakdown || [];
  const categoryBreakdown = summaryData?.categoryBreakdown || [];
  const records: FinancialRecord[] = recordsData?.records || [];

  // Calculate trends
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth > 0 ? currentMonth - 1 : 11;
  const currentMonthData = monthlyBreakdown[currentMonth];
  const lastMonthData = monthlyBreakdown[lastMonth];

  const incomeTrend = lastMonthData?.income > 0 
    ? ((currentMonthData?.income - lastMonthData.income) / lastMonthData.income) * 100 
    : 0;
  const expenseTrend = lastMonthData?.expense > 0 
    ? ((currentMonthData?.expense - lastMonthData.expense) / lastMonthData.expense) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Financial Management
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Track income, expenses, and profitability
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary?.totalIncome || 0)}
                </p>
                {incomeTrend !== 0 && (
                  <div className={cn("flex items-center gap-1 text-xs mt-1", incomeTrend > 0 ? "text-emerald-600" : "text-red-600")}>
                    {incomeTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(incomeTrend).toFixed(1)}% vs last month
                  </div>
                )}
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary?.totalExpense || 0)}
                </p>
                {expenseTrend !== 0 && (
                  <div className={cn("flex items-center gap-1 text-xs mt-1", expenseTrend > 0 ? "text-red-600" : "text-emerald-600")}>
                    {expenseTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(expenseTrend).toFixed(1)}% vs last month
                  </div>
                )}
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Net Profit</p>
                <p className={cn("text-2xl font-bold", (summary?.netProfit || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {formatCurrency(summary?.netProfit || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {summary?.profitMargin || 0}% margin
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Transactions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {records.length}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  This year
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Month</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Income</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Expense</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Profit</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthlyBreakdown.map((month) => (
                  <tr key={month.month} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{month.monthName}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(month.income)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                      {formatCurrency(month.expense)}
                    </td>
                    <td className={cn("px-4 py-3 text-right font-medium", month.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {formatCurrency(month.profit)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full max-w-[100px] h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full", month.profit >= 0 ? "bg-emerald-500" : "bg-red-500")}
                          style={{ width: `${Math.min(Math.abs(month.profit) / 10000 * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.slice(0, 10).map((record) => (
              <div key={record._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    record.type === 'income' ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                  )}>
                    {record.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white capitalize">{record.category.replace('_', ' ')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{record.description}</p>
                    {record.cropId && (
                      <p className="text-xs text-slate-400">Crop: {record.cropId.name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", record.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(record.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultType={recordType}
      />
    </motion.div>
  );
}

// Add Record Modal Component
function AddRecordModal({
  isOpen,
  onClose,
  defaultType,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultType: 'income' | 'expense';
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState(defaultType);
  const [formData, setFormData] = useState({
    type: defaultType,
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => financialApi.createRecord({
      ...data,
      amount: Number(data.amount),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Record added successfully');
      onClose();
    },
    onError: (error) => showErrorToast(error, 'Create Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      amount: Number(formData.amount),
    };
    createMutation.mutate(submissionData);
  };

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Add Financial Record
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('income');
                setFormData({ ...formData, type: 'income', category: '' });
              }}
              className={cn(
                "py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                type === 'income'
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setFormData({ ...formData, type: 'expense', category: '' });
              }}
              className={cn(
                "py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                type === 'expense'
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              Expense
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              placeholder="0.00"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
              placeholder="Add details about this transaction..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={cn(
                "px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors",
                type === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              )}
            >
              {createMutation.isPending ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
