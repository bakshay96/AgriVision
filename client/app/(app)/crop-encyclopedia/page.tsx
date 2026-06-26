'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Leaf, Bug, Sprout, Sun, Droplets, Thermometer,
  Calendar, ChevronRight, Loader2, AlertCircle, Scale,
  Calculator, TrendingUp, Bell, Heart, ArrowRight, Star,
  MapPin, Package, Microscope, StickyNote, Bookmark, BookmarkCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cropEncyclopediaApi, marketPricesApi, inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import AICropSearch, { CropInfo, normaliseServerCrop } from '@/components/encyclopedia/AICropSearch';
import CropDetailView from '@/components/encyclopedia/CropDetailView';
import Link from 'next/link';

// ─── Category helpers ──────────────────────────────────────────────────────────
const getCategoryIcon = (cat: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('cereal'))   return Sprout;
  if (c.includes('vegetable')) return Leaf;
  if (c.includes('fruit'))    return Sun;
  if (c.includes('pulse'))    return Sprout;
  if (c.includes('oilseed'))  return Droplets;
  if (c.includes('spice') || c.includes('cash')) return Thermometer;
  return Leaf;
};

const getCategoryColor = (cat: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('cereal'))   return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (c.includes('vegetable')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (c.includes('fruit'))    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if (c.includes('pulse'))    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (c.includes('oilseed'))  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (c.includes('cash') || c.includes('fiber')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
};

// ─── Seasonal Alert Banner ─────────────────────────────────────────────────────
const MONTH_CROPS: Record<number, { crop: string; action: string; season: string }[]> = {
  0:  [{ crop: 'Wheat',    action: 'harvest',  season: 'Rabi' }],
  1:  [{ crop: 'Mustard',  action: 'harvest',  season: 'Rabi' }],
  2:  [{ crop: 'Sugarcane', action: 'sow',     season: 'Kharif' }],
  3:  [{ crop: 'Cotton',   action: 'sow',      season: 'Kharif' }],
  4:  [{ crop: 'Cotton',   action: 'sow',      season: 'Kharif' }],
  5:  [{ crop: 'Rice',     action: 'sow',      season: 'Kharif' }, { crop: 'Maize', action: 'sow', season: 'Kharif' }],
  6:  [{ crop: 'Soybean',  action: 'sow',      season: 'Kharif' }, { crop: 'Groundnut', action: 'sow', season: 'Kharif' }],
  7:  [{ crop: 'Onion',    action: 'prepare',  season: 'Rabi nursery' }],
  8:  [{ crop: 'Tomato',   action: 'sow',      season: 'Rabi' }, { crop: 'Onion', action: 'transplant', season: 'Rabi' }],
  9:  [{ crop: 'Wheat',    action: 'sow',      season: 'Rabi' }, { crop: 'Chickpea', action: 'sow', season: 'Rabi' }],
  10: [{ crop: 'Wheat',    action: 'sow',      season: 'Rabi' }, { crop: 'Rice', action: 'harvest', season: 'Kharif' }],
  11: [{ crop: 'Mustard',  action: 'sow',      season: 'Rabi' }],
};

function SeasonalAlert({ onSearchCrop }: { onSearchCrop: (name: string) => void }) {
  const month = new Date().getMonth();
  const alerts = MONTH_CROPS[month] || [];
  if (!alerts.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">🌾 Seasonal Tip for {new Date().toLocaleString('default', { month: 'long' })}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {alerts.map((a, i) => (
              <button
                key={i}
                onClick={() => onSearchCrop(a.crop)}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1 text-xs font-medium"
              >
                <span>
                  {a.action === 'sow' ? '🌱' : a.action === 'harvest' ? '🌾' : '📅'}
                  {' '}{a.action.charAt(0).toUpperCase() + a.action.slice(1)} {a.crop}
                </span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Yield Calculator ──────────────────────────────────────────────────────────
function YieldCalculator({ cropName }: { cropName: string }) {
  const [area, setArea] = useState(1);
  const [unit, setUnit] = useState<'acres' | 'hectares'>('acres');
  const { data: marketData } = useQuery({
    queryKey: ['market-trends', cropName],
    queryFn: () => marketPricesApi.getTrends(cropName).then(r => r.data?.data),
    enabled: !!cropName,
    staleTime: 5 * 60 * 1000,
  });

  // Rough yield estimates per acre (quintals)
  const YIELD_MAP: Record<string, { min: number; max: number }> = {
    wheat: { min: 40, max: 55 }, rice: { min: 30, max: 45 }, cotton: { min: 12, max: 20 },
    soybean: { min: 18, max: 25 }, sugarcane: { min: 300, max: 400 }, maize: { min: 30, max: 40 },
    groundnut: { min: 12, max: 18 }, tomato: { min: 200, max: 300 }, onion: { min: 180, max: 250 },
    chickpea: { min: 12, max: 18 },
  };

  const key = cropName.toLowerCase().replace(/\s/g, '');
  const yieldRange = YIELD_MAP[key] || { min: 15, max: 30 };
  const areaInAcres = unit === 'hectares' ? area * 2.47105 : area;
  const minYield = parseFloat((areaInAcres * yieldRange.min).toFixed(2));
  const maxYield = parseFloat((areaInAcres * yieldRange.max).toFixed(2));

  const pricePerQt = marketData?.recentPrices?.[0]?.modalPrice
    || marketData?.avgPrice || null;
  const minRevenue = pricePerQt ? Math.round(minYield * pricePerQt) : null;
  const maxRevenue = pricePerQt ? Math.round(maxYield * pricePerQt) : null;

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white text-sm">
          <Calculator className="h-4 w-4 text-emerald-500" />
          Yield & Revenue Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Farm Area</label>
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={area}
              onChange={(e) => setArea(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'acres' | 'hectares')}
              className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Yield</p>
            <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-1">
              {minYield}–{maxYield} qt
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Est. Revenue</p>
            <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-1">
              {minRevenue && maxRevenue
                ? `₹${minRevenue.toLocaleString()}–₹${maxRevenue.toLocaleString()}`
                : 'N/A (no live price)'}
            </p>
          </div>
        </div>

        {pricePerQt && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Based on live price ₹{pricePerQt}/qt · Actual yield may vary by variety & practices
          </p>
        )}

        <Link
          href="/market-prices"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          View Live Market Prices
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Crop Comparison ───────────────────────────────────────────────────────────
function CropComparisonModal({
  cropA,
  onClose,
}: {
  cropA: CropInfo;
  onClose: () => void;
}) {
  const [searchB, setSearchB] = useState('');
  const [cropB, setCropB] = useState<CropInfo | null>(null);
  const [loadingB, setLoadingB] = useState(false);
  const { language } = useLanguageStore();

  const fetchCropB = async (name: string) => {
    if (!name.trim()) return;
    setLoadingB(true);
    try {
      const res = await cropEncyclopediaApi.aiSearch(name.trim(), language);
      setCropB(res.data?.data?.crop || null);
    } catch {
      setCropB(null);
    }
    setLoadingB(false);
  };

  const rows = [
    { label: 'Season',         a: cropA.bestSeason,        b: cropB?.bestSeason },
    { label: 'Harvest Time',   a: cropA.harvestTime,       b: cropB?.harvestTime },
    { label: 'Water Need',     a: cropA.waterRequirement,  b: cropB?.waterRequirement },
    { label: 'Temperature',    a: cropA.temperature,       b: cropB?.temperature },
    { label: 'Market Demand',  a: cropA.marketDemand,      b: cropB?.marketDemand },
    { label: 'Soil pH',        a: cropA.soilPH,            b: cropB?.soilPH },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-500" />
            Crop Comparison
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search for Crop B */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchB}
              onChange={(e) => setSearchB(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCropB(searchB)}
              placeholder="Compare with crop (e.g. tomato, onion)..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => fetchCropB(searchB)}
              disabled={loadingB}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
            >
              {loadingB ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compare'}
            </button>
          </div>

          {/* Comparison Table */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-3 bg-emerald-600 text-white text-sm font-semibold">
              <div className="p-3">Attribute</div>
              <div className="p-3 text-center">{cropA.name}</div>
              <div className="p-3 text-center">{cropB ? cropB.name : '—'}</div>
            </div>
            {rows.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}`}>
                <div className="p-3 text-slate-500 dark:text-slate-400 font-medium">{row.label}</div>
                <div className="p-3 text-center text-slate-700 dark:text-slate-300">{row.a || '—'}</div>
                <div className="p-3 text-center text-slate-700 dark:text-slate-300">{row.b || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Encyclopedia Page ────────────────────────────────────────────────────
export default function CropEncyclopediaPage() {
  const { t, language } = useLanguageStore();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null);
  const [aiCrop, setAiCrop] = useState<CropInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'planting' | 'pests' | 'calculator'>('overview');
  const [showComparison, setShowComparison] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('encyclo_bookmarks') || '[]'); } catch { return []; }
  });
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Fetch crops from real server API
  const { data: cropsData, isLoading, error: cropsError } = useQuery({
    queryKey: ['crop-encyclopedia', 'all', selectedCategory],
    queryFn: () =>
      cropEncyclopediaApi.getAll({
        category: selectedCategory || undefined,
        limit: 20,
      }).then(r => r.data?.data),
    staleTime: 10 * 60 * 1000,
  });

  const crops: CropInfo[] = useMemo(() => {
    const raw = (cropsData?.crops || []) as Record<string, unknown>[];
    return raw.map(normaliseServerCrop);
  }, [cropsData]);

  const categories: string[] = useMemo(() => cropsData?.categories || [], [cropsData]);

  // Toggle bookmark
  const toggleBookmark = (name: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name];
      localStorage.setItem('encyclo_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  // Save note
  const saveNote = (cropName: string) => {
    const key = `encyclo_note_${cropName.toLowerCase().replace(/\s/g, '_')}`;
    localStorage.setItem(key, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const loadNote = (cropName: string) => {
    const key = `encyclo_note_${cropName.toLowerCase().replace(/\s/g, '_')}`;
    setNote(localStorage.getItem(key) || '');
  };

  // When AI search finds a crop
  const handleAICropFound = (crop: CropInfo) => {
    setAiCrop(crop);
    setActiveTab('overview');
  };

  // When user clicks a crop card
  const handleSelectCrop = (crop: CropInfo) => {
    setSelectedCrop(crop);
    setActiveTab('overview');
    loadNote(crop.name);
  };

  // Compute displayCrop first so the hook below can use it
  const displayCrop = aiCrop || selectedCrop;

  // Always call this hook at top-level (React rules)
  const invQuery = useInventoryForCrop(displayCrop?.name || '');

  // ── If AI crop detail or DB crop selected, show detail view ──────────────────
  if (displayCrop) {
    const isBookmarked = bookmarks.includes(displayCrop.name);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => { setAiCrop(null); setSelectedCrop(null); }}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Encyclopedia
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleBookmark(displayCrop.name)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isBookmarked
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isBookmarked ? 'Saved' : 'Bookmark'}
            </button>
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <Scale className="h-4 w-4" />
              Compare
            </button>
          </div>
        </div>

        {/* Quick links to other features */}
        <div className="flex flex-wrap gap-2">
          <Link href="/health-monitor" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium hover:opacity-80 transition-opacity">
            <Microscope className="h-3 w-3" />
            Scan this crop's health
          </Link>
          <Link href="/market-prices" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium hover:opacity-80 transition-opacity">
            <TrendingUp className="h-3 w-3" />
            View market prices
          </Link>
          {invQuery.inventoryQty !== null && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              <Package className="h-3 w-3" />
              You have {invQuery.inventoryQty} kg in inventory
            </span>
          )}
        </div>

        {/* Main detail view */}
        <CropDetailView crop={displayCrop} onBack={() => { setAiCrop(null); setSelectedCrop(null); }} />

        {/* Tabs for extra features */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'calculator', label: 'Yield Calculator', icon: Calculator },
              { id: 'notes', label: 'My Notes', icon: StickyNote },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'calculator' && <YieldCalculator cropName={displayCrop.name} />}

        {(activeTab as string) === 'notes' && (
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white text-sm">
                <StickyNote className="h-4 w-4 text-amber-500" />
                My Personal Notes — {displayCrop.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder={`Add personal notes about ${displayCrop.name} (yield from last season, observations, etc.)...`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
              <button
                onClick={() => saveNote(displayCrop.name)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Star className="h-4 w-4" />
                {noteSaved ? '✓ Saved!' : 'Save Note'}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Comparison Modal */}
        <AnimatePresence>
          {showComparison && (
            <CropComparisonModal cropA={displayCrop} onClose={() => setShowComparison(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('encyclo.title')}
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {t('encyclo.subtitle')}
        </p>
      </div>

      {/* Seasonal Alert */}
      <SeasonalAlert onSearchCrop={(name) => {
        // Trigger actual AI search via AICropSearch ref-less approach:
        // Set query on the AICropSearch by triggering the API directly
        cropEncyclopediaApi.aiSearch(name, language)
          .then(r => r.data?.data?.crop && setAiCrop(r.data.data.crop))
          .catch(console.error);
      }} />

      {/* AI Search */}
      <AICropSearch onCropFound={handleAICropFound} />

      {/* Bookmarks shortcut */}
      {bookmarks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Bookmark className="h-3 w-3" /> Saved:
          </span>
          {bookmarks.map((b) => (
            <button
              key={b}
              onClick={() => {
                cropEncyclopediaApi.aiSearch(b, language)
                  .then(r => r.data?.data?.crop && setAiCrop(r.data.data.crop))
                  .catch(() => {});
              }}
              className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {/* Category Filters */}
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {cropsError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            Could not load crops from server. Please check your connection.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-200 dark:bg-slate-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crop Grid */}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {crops.map((crop, idx) => {
            const CategoryIcon = getCategoryIcon(crop.category);
            const isBookmarked = bookmarks.includes(crop.name);
            return (
              <motion.div
                key={crop._id || idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-left group relative"
              >
                {/* Bookmark button overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(crop.name); }}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm"
                >
                  {isBookmarked
                    ? <BookmarkCheck className="h-4 w-4 text-amber-500" />
                    : <Bookmark className="h-4 w-4 text-slate-400" />}
                </button>

                <button onClick={() => handleSelectCrop(crop)} className="w-full text-left">
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg dark:bg-slate-900 dark:border-slate-800 flex flex-col">
                    <div className="relative h-40 overflow-hidden bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
                      {crop.images?.[0] ? (
                        <>
                          <img
                            src={crop.images[0]}
                            alt={crop.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                            }}
                          />
                          <div className="hidden absolute inset-0 w-full h-full items-center justify-center">
                            <Leaf className="h-16 w-16 text-emerald-200 dark:text-emerald-800" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf className="h-16 w-16 text-emerald-200 dark:text-emerald-800" />
                        </div>
                      )}
                      <div className={`absolute left-3 top-3 rounded-full p-2 ${getCategoryColor(crop.category)}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{crop.name}</h3>
                      <p className="text-sm italic text-slate-500 dark:text-slate-400">{crop.scientificName}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {crop.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {crop.bestSeason}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {crop.marketDemand} demand
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </motion.div>
            );
          })}

          {/* Empty state */}
          {!isLoading && crops.length === 0 && !cropsError && (
            <div className="col-span-full text-center py-16">
              <Leaf className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No crops found in this category.</p>
              <button onClick={() => setSelectedCategory('')} className="mt-2 text-emerald-600 text-sm">Show all crops</button>
            </div>
          )}
        </div>
      )}

      {/* Quick Access Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <BookOpen className="h-8 w-8 text-emerald-100" />
            <h3 className="mt-3 text-lg font-semibold">{t('encyclo.plantingGuide')}</h3>
            <p className="mt-1 text-sm text-emerald-100">Step-by-step cultivation instructions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <Bug className="h-8 w-8 text-amber-100" />
            <h3 className="mt-3 text-lg font-semibold">{t('encyclo.pestDisease')}</h3>
            <p className="mt-1 text-sm text-amber-100">Identify and treat crop problems</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <Calculator className="h-8 w-8 text-blue-100" />
            <h3 className="mt-3 text-lg font-semibold">Yield Calculator</h3>
            <p className="mt-1 text-sm text-blue-100">Estimate yield & revenue per acre</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ─── Hook: get user's inventory qty for a given crop name ──────────────────────
function useInventoryForCrop(cropName: string) {
  const { data } = useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => inventoryApi.getAll().then(r => r.data?.data),
    staleTime: 5 * 60 * 1000,
  });

  const items = (data?.items || data || []) as Array<{ cropName?: string; quantity?: number; unit?: string }>;
  const match = items.find(i =>
    i.cropName?.toLowerCase().includes(cropName.toLowerCase())
  );

  return { inventoryQty: match ? match.quantity ?? null : null };
}
