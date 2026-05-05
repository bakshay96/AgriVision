'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import {
  Search, ChevronUp, ChevronDown, Download, MessageSquare, 
  Calendar as CalendarIcon, Filter, X, ArrowUpDown, Info, SlidersHorizontal, Store, BarChart3
} from 'lucide-react';
import { marketPricesApi, feedbackApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import GlobalLoader from '@/components/ui/GlobalLoader';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';
import PriceTicker from '@/components/market/PriceTicker';
import { toast } from 'sonner';

type SortField = 'cropName' | 'variety' | 'priceMin' | 'priceMax' | 'priceModal' | 'marketName' | 'arrivalDate';
type SortDirection = 'asc' | 'desc';
interface SortConfig { field: SortField; direction: SortDirection; }

export default function MarketPricesPage() {
  const { user } = useAppStore();
  const { t } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'priceModal', direction: 'desc' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [feedback, setFeedback] = useState({ subject: '', message: '', category: 'general' as const, rating: 5 });

  const headerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        setIsHeaderSticky(window.scrollY > headerRef.current.offsetTop + 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['market-prices', debouncedSearch, selectedState, selectedDistrict, selectedCrop, fromDate, toDate],
    queryFn: () => marketPricesApi.getAll({
      crop: selectedCrop || undefined,
      state: selectedState || undefined,
      district: selectedDistrict || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      search: debouncedSearch || undefined,
      limit: 500,
    }).then(r => r.data.data),
    placeholderData: keepPreviousData,
  });

  const { prices = [], crops = [], states = [], districts = [] } = data || {};

  const stats = useMemo(() => {
    if (!prices.length) return { avg: 0, total: 0, min: 0, max: 0 };
    const modalPrices = prices.map((p: any) => p.price?.modal || 0);
    return {
      avg: Math.round(modalPrices.reduce((a: number, b: number) => a + b, 0) / prices.length),
      total: prices.length,
      min: Math.min(...modalPrices),
      max: Math.max(...modalPrices),
    };
  }, [prices]);

  const filteredAndSortedPrices = useMemo(() => {
    let filtered = [...prices];
    filtered.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortConfig.field) {
        case 'cropName': aVal = a.cropName; bVal = b.cropName; break;
        case 'variety': aVal = a.variety; bVal = b.variety; break;
        case 'priceMin': aVal = a.price?.min; bVal = b.price?.min; break;
        case 'priceMax': aVal = a.price?.max; bVal = b.price?.max; break;
        case 'priceModal': aVal = a.price?.modal; bVal = b.price?.modal; break;
        case 'marketName': aVal = a.marketName; bVal = b.marketName; break;
        case 'arrivalDate': 
          const [d1, m1, y1] = a.arrivalDate.split('/').map(Number);
          const [d2, m2, y2] = b.arrivalDate.split('/').map(Number);
          aVal = new Date(y1, m1 - 1, d1).getTime();
          bVal = new Date(y2, m2 - 1, d2).getTime();
          break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return filtered;
  }, [prices, sortConfig]);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const downloadCSV = () => {
    const headers = ['Crop', 'Variety', 'Market', 'State', 'District', 'Min Price', 'Max Price', 'Modal Price', 'Date'];
    const rows = filteredAndSortedPrices.map((p: any) => [
      p.cropName, p.variety, p.marketName, p.marketLocation.state, p.marketLocation.district,
      p.price.min, p.price.max, p.price.modal, p.arrivalDate
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `market_prices_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const feedbackMutation = useMutation({
    mutationFn: (data: any) => feedbackApi.create(data),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      setShowFeedback(false);
      setFeedback({ subject: '', message: '', category: 'general', rating: 5 });
    },
    onError: () => toast.error('Failed to submit feedback.'),
  });

  if (isLoading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" ref={headerRef}>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="h-8 w-8 text-emerald-600" />
              {t('market.title')}
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">Real-time daily prices from Agmarknet OGD Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-semibold text-sm">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={() => setShowFeedback(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 font-semibold text-sm">
              <MessageSquare className="h-4 w-4" /> Feedback
            </button>
          </div>
        </div>

        {prices.length > 0 && (
          <PriceTicker prices={prices.slice(0, 12).map((p: any) => ({
            cropName: p.cropName,
            variety: p.variety,
            price: p.price?.modal,
            marketName: p.marketName,
            trend: 'stable',
            changePercent: 0
          }))} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Market Arrivals', value: stats.total, color: 'text-emerald-600', icon: Store },
            { label: 'Avg Modal Price', value: formatCurrency(stats.avg), color: 'text-blue-600', icon: BarChart3 },
            { label: 'Min Reported', value: formatCurrency(stats.min), color: 'text-amber-600', icon: ChevronDown },
            { label: 'Max Reported', value: formatCurrency(stats.max), color: 'text-rose-600', icon: ChevronUp },
          ].map((stat, i) => (
            <Card key={i} className="dark:bg-slate-900 border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:to-slate-800/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Filters UI (Visible by default) */}
        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input type="text" placeholder="Search market..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-slate-800 dark:text-white transition-all" />
              </div>

              <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-slate-800 dark:text-white cursor-pointer">
                <option value="">All States</option>
                {states.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedState} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-slate-800 dark:text-white disabled:opacity-50 cursor-pointer">
                <option value="">All Districts</option>
                {districts.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-slate-800 dark:text-white cursor-pointer">
                <option value="">All Commodities</option>
                {crops.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-slate-800 dark:text-white" />
              </div>

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <div className="relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-30 shadow-md">
                <tr>
                  {[
                    { label: 'Crop', field: 'cropName' as SortField },
                    { label: 'Variety', field: 'variety' as SortField },
                    { label: 'Market', field: 'marketName' as SortField },
                    { label: 'Min', field: 'priceMin' as SortField },
                    { label: 'Max', field: 'priceMax' as SortField },
                    { label: 'Modal', field: 'priceModal' as SortField },
                    { label: 'Arrival Date', field: 'arrivalDate' as SortField },
                  ].map((h) => (
                    <th key={h.field} className="px-3 py-3 font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 whitespace-nowrap text-xs uppercase tracking-wider" onClick={() => handleSort(h.field)}>
                      <div className="flex items-center gap-1">
                        {h.label}
                        <ArrowUpDown className={`h-3 w-3 ${sortConfig.field === h.field ? 'text-emerald-600' : 'text-slate-300'}`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedPrices.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium">No market data found for the selected filters.</td></tr>
                ) : (
                  filteredAndSortedPrices.map((price: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group/row text-xs">
                      <td className="px-3 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{price.cropName}</td>
                      <td className="px-3 py-3 text-slate-500 font-medium whitespace-nowrap max-w-[120px] truncate" title={price.variety}>{price.variety}</td>
                      <td className="px-3 py-3 min-w-[140px]">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={price.marketName}>{price.marketName}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate" title={`${price.marketLocation.district}, ${price.marketLocation.state}`}>{price.marketLocation.district}, {price.marketLocation.state}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{formatCurrency(price.price.min)}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{formatCurrency(price.price.max)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black shadow-sm">
                          {formatCurrency(price.price.modal)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-medium whitespace-nowrap">{price.arrivalDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Floating Sticky Sidebar Trigger (Visible when header is sticky) */}
      <AnimatePresence>
        {isHeaderSticky && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="fixed right-6 bottom-10 z-[100] flex flex-col gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-600/40 hover:bg-emerald-700 hover:scale-105 transition-all font-bold ring-4 ring-white dark:ring-slate-900">
              <SlidersHorizontal className="h-5 w-5" />
              Sort & Filter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-out Sidebar for Sorting & Filtering */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-screen w-full max-w-sm bg-white dark:bg-slate-900 z-[120] shadow-2xl p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black dark:text-white flex items-center gap-2">
                  <Filter className="h-6 w-6 text-emerald-600" />
                  Advanced Tools
                </h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="h-6 w-6 text-slate-500" /></button>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sorting Options</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Price (Modal)', field: 'priceModal' },
                      { label: 'Commodity Name', field: 'cropName' },
                      { label: 'Market Name', field: 'marketName' },
                      { label: 'Arrival Date', field: 'arrivalDate' },
                    ].map((opt) => (
                      <button key={opt.field} onClick={() => handleSort(opt.field as SortField)} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-bold ${sortConfig.field === opt.field ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'}`}>
                        {opt.label}
                        {sortConfig.field === opt.field && (sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick Filters</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 px-1">Search Keywords</label>
                      <input type="text" placeholder="Search Mandi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 px-1">Select State</label>
                      <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm dark:bg-slate-800 dark:text-white">
                        <option value="">All India</option>
                        {states.map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button onClick={() => { setSearch(''); setSelectedState(''); setSelectedCrop(''); setSelectedDistrict(''); setFromDate(''); setToDate(''); }} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition-colors">Reset All</button>
                  <button onClick={() => setIsSidebarOpen(false)} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all">Apply View</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black dark:text-white">Share your experience</h2>
                  <button onClick={() => setShowFeedback(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {['bug', 'feature', 'general', 'other'].map((cat) => (
                      <button key={cat} onClick={() => setFeedback({ ...feedback, category: cat as any })} className={`py-3 rounded-2xl border-2 text-sm font-bold capitalize transition-all ${feedback.category === cat ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-emerald-200'}`}>{cat}</button>
                    ))}
                  </div>
                  <input type="text" placeholder="Brief subject" value={feedback.subject} onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })} className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                  <textarea rows={5} placeholder="What can we improve? We're listening..." value={feedback.message} onChange={(e) => setFeedback({ ...feedback, message: e.target.value })} className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" />
                </div>
                <button onClick={() => feedbackMutation.mutate({ ...feedback, name: user?.name || 'Anonymous', email: user?.email || 'anonymous@agrivision.com' })} disabled={feedbackMutation.isPending || !feedback.message} className="w-full mt-8 py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100">{feedbackMutation.isPending ? 'Sending your feedback...' : 'Send Feedback'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
