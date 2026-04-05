'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Minus, MapPin, Search,
  Store, ChevronUp, ChevronDown, BarChart3, RefreshCw,
} from 'lucide-react';
import { marketPricesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';
import PriceTicker from '@/components/market/PriceTicker';
import SmartSuggestion from '@/components/market/SmartSuggestion';
import SmartSuggestionAnalytics from '@/components/market/SmartSuggestionAnalytics';

// ────────────────────────────────────────────────────────────────
// Complete list of all Indian states & UTs
// ────────────────────────────────────────────────────────────────
const ALL_INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli',
  'Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const STATE_DISTRICTS: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur', 'Ahmednagar', 'Kolhapur', 'Sangli', 'Satara', 'Thane', 'Raigad', 'Amravati', 'Akola', 'Latur', 'Nanded', 'Buldhana', 'Jalna', 'Osmanabad', 'Beed', 'Parbhani', 'Hingoli'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Ferozepur', 'Hoshiarpur', 'Moga', 'Sangrur', 'Gurdaspur', 'Rupnagar', 'Fatehgarh Sahib', 'Mohali'],
  'Haryana': ['Hisar', 'Karnal', 'Panipat', 'Rohtak', 'Sirsa', 'Fatehabad', 'Jind', 'Bhiwani', 'Kurukshetra', 'Ambala', 'Sonipat', 'Yamunanagar', 'Kaithal'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Gorakhpur', 'Bareilly', 'Moradabad', 'Aligarh', 'Mathura', 'Firozabad', 'Muzaffarnagar'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam', 'Dewas', 'Satna', 'Katni', 'Hoshangabad', 'Chhindwara', 'Vidisha'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Mehsana', 'Nadiad', 'Navsari', 'Bharuch'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Sikar', 'Pali', 'Nagaur', 'Barmer', 'Jaisalmer', 'Hanumangarh', 'Sri Ganganagar'],
  'Karnataka': ['Bengaluru', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Shimoga', 'Tumkur', 'Bidar', 'Dharwad', 'Hassan', 'Chikkamagaluru'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Cuddalore'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Anantapur', 'Kadapa', 'Srikakulam'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Rangareddy', 'Medak'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Samastipur', 'Sitamarhi'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Kharagpur', 'Haldia', 'Burdwan', 'Nadia', 'Murshidabad', 'Bankura'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Jharsuguda', 'Angul'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh', 'Chaibasa', 'Dumka'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Karimganj', 'Goalpara', 'Bongaigaon'],
  'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
};

const DISTRICT_TALUKAS: Record<string, string[]> = {
  'Pune': ['Haveli', 'Pune City', 'Mulshi', 'Maval', 'Khed', 'Junnar', 'Ambegaon', 'Shirur', 'Bhor', 'Velhe', 'Baramati', 'Indapur', 'Daund', 'Purandar'],
  'Nashik': ['Nashik', 'Niphad', 'Sinnar', 'Dindori', 'Igatpuri', 'Baglan', 'Malegaon', 'Chandwad', 'Nandgaon', 'Satana', 'Yeola'],
  'Nagpur': ['Nagpur City', 'Nagpur Rural', 'Kamptee', 'Hingna', 'Umred', 'Bhiwapur', 'Katol', 'Savner', 'Narkhed', 'Ramtek', 'Parseoni'],
  'Ludhiana': ['Ludhiana I', 'Ludhiana II', 'Khanna', 'Raikot', 'Jagraon', 'Samrala'],
  'Amritsar': ['Amritsar I', 'Amritsar II', 'Ajnala', 'Baba Bakala', 'Patti'],
  'Jaipur': ['Jaipur', 'Sanganer', 'Bassi', 'Chomu', 'Phagi', 'Amer', 'Kotputli', 'Viratnagar', 'Shahpura'],
  'Ahmedabad': ['Ahmedabad City', 'Daskroi', 'Dhandhuka', 'Viramgam', 'Bavla', 'Mandal', 'Sanand', 'Detroj'],
  'Lucknow': ['Lucknow', 'Malihabad', 'Bakshi Ka Talab', 'Gosainganj', 'Kakori', 'Mohanlalganj'],
  'Indore': ['Indore', 'Depalpur', 'Sanwer', 'Mhow'],
  'Hyderabad': ['Hyderabad', 'Secunderabad', 'Bandlaguda Jagir', 'Rajendranagar', 'Serilingampally'],
};

const trendIcons: Record<string, any> = {
  'up': TrendingUp,
  'down': TrendingDown,
  'stable': Minus,
};

const trendColors: Record<string, string> = {
  'up': 'text-green-600 dark:text-green-400',
  'down': 'text-red-600 dark:text-red-400',
  'stable': 'text-slate-500 dark:text-slate-400',
};

type SortField = 'cropName' | 'variety' | 'priceMin' | 'priceMax' | 'priceModal' | 'marketName';
type SortDirection = 'asc' | 'desc';
interface SortConfig { field: SortField; direction: SortDirection; }

const mockROIPredictions = [
  { cropName: 'Wheat', variety: 'HD-2967', currentPrice: 2250, predictedPrice: 2450, roi: 8.9, confidence: 'high' as const, reason: 'Strong export demand' },
  { cropName: 'Rice', variety: 'Basmati', currentPrice: 3800, predictedPrice: 4200, roi: 10.5, confidence: 'medium' as const, reason: 'Festival season demand' },
  { cropName: 'Soybean', variety: 'JS-335', currentPrice: 4200, predictedPrice: 4650, roi: 10.7, confidence: 'high' as const, reason: 'Oil industry expansion' },
];

export default function MarketPricesPage() {
  const { t, language } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'priceModal', direction: 'desc' });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['market-prices', debouncedSearch, selectedState, selectedDistrict, selectedTaluka, selectedCrop],
    queryFn: () => marketPricesApi.getAll({
      crop: selectedCrop || undefined,
      state: selectedState || undefined,
      district: selectedDistrict || undefined,
      taluka: selectedTaluka || undefined,
      search: debouncedSearch || undefined,
      limit: 100,
    }).then(r => r.data.data),
  });

  const { prices = [], crops = [] } = data || {};

  const availableDistricts = useMemo(() => {
    if (!selectedState) return [];
    const staticList = STATE_DISTRICTS[selectedState] || [];
    const apiList = prices
      .filter((p: any) => p.marketLocation?.state === selectedState)
      .map((p: any) => p.marketLocation?.district)
      .filter(Boolean);
    return Array.from(new Set([...staticList, ...apiList])).sort() as string[];
  }, [selectedState, prices]);

  const availableTalukas = useMemo(() => {
    if (!selectedDistrict) return [];
    const staticList = DISTRICT_TALUKAS[selectedDistrict] || [];
    const apiList = prices
      .filter((p: any) => p.marketLocation?.district === selectedDistrict)
      .map((p: any) => p.marketLocation?.taluka)
      .filter(Boolean);
    return Array.from(new Set([...staticList, ...apiList])).sort() as string[];
  }, [selectedDistrict, prices]);

  const availableCrops = useMemo(() => {
    const apiCrops = crops as string[];
    const fallback = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean', 'Sugarcane', 'Groundnut', 'Mustard', 'Gram', 'Tur', 'Onion', 'Potato', 'Tomato', 'Chilli'];
    return apiCrops.length > 0 ? apiCrops : fallback;
  }, [crops]);

  const filteredAndSortedPrices = useMemo(() => {
    let filtered = [...prices];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.cropName?.toLowerCase().includes(q) ||
        p.variety?.toLowerCase().includes(q) ||
        p.marketName?.toLowerCase().includes(q)
      );
    }
    if (selectedState) filtered = filtered.filter((p: any) => p.marketLocation?.state === selectedState);
    if (selectedDistrict) filtered = filtered.filter((p: any) => p.marketLocation?.district === selectedDistrict);
    if (selectedTaluka) filtered = filtered.filter((p: any) => p.marketLocation?.taluka === selectedTaluka);
    if (selectedCrop) filtered = filtered.filter((p: any) => p.cropName === selectedCrop);

    filtered.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortConfig.field) {
        case 'cropName': aVal = a.cropName; bVal = b.cropName; break;
        case 'variety': aVal = a.variety; bVal = b.variety; break;
        case 'priceMin': aVal = a.price?.min; bVal = b.price?.min; break;
        case 'priceMax': aVal = a.price?.max; bVal = b.price?.max; break;
        case 'priceModal': aVal = a.price?.modal; bVal = b.price?.modal; break;
        case 'marketName': aVal = a.marketName; bVal = b.marketName; break;
        default: return 0;
      }
      if (typeof aVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return filtered;
  }, [prices, debouncedSearch, selectedState, selectedDistrict, selectedTaluka, selectedCrop, sortConfig]);

  const groupedByCrop = useMemo(() => {
    return prices.reduce((acc: any, price: any) => {
      if (!acc[price.cropName]) acc[price.cropName] = [];
      acc[price.cropName].push(price);
      return acc;
    }, {});
  }, [prices]);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ChevronUp className="h-3 w-3 text-slate-300" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 text-emerald-600" />
      : <ChevronDown className="h-3 w-3 text-emerald-600" />;
  };

  const openAnalytics = (cropName: string, cropPrices: any[]) => {
    const avgPrice = cropPrices.reduce((s: number, p: any) => s + (p.price?.modal || 0), 0) / (cropPrices.length || 1);
    setAnalyticsData({
      crop: cropName,
      currentPrice: Math.round(avgPrice),
      predictedPrice: Math.round(avgPrice * 1.08),
      confidence: 82,
      season: 'Kharif / Rabi',
      demand: 'high' as const,
      supply: 'medium' as const,
      historicalData: [
        { month: 'Oct', price: Math.round(avgPrice * 0.88) },
        { month: 'Nov', price: Math.round(avgPrice * 0.92) },
        { month: 'Dec', price: Math.round(avgPrice * 0.95) },
        { month: 'Jan', price: Math.round(avgPrice * 0.98) },
        { month: 'Feb', price: Math.round(avgPrice) },
        { month: 'Mar', price: Math.round(avgPrice * 1.04) },
      ],
      factors: [
        { factor: 'MSP Policy', impact: 'positive', description: 'Government MSP increased as per inflation' },
        { factor: 'Weather', impact: 'positive', description: 'Good monsoon forecast for current season' },
        { factor: 'Export Demand', impact: 'positive', description: 'Rising international demand' },
        { factor: 'Input Costs', impact: 'negative', description: 'Fertilizer prices up by 10%' },
      ],
    });
    setShowAnalytics(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('market.title')}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t('market.subtitle')}</p>
      </div>

      {/* Price Ticker */}
      {prices.length > 0 && (
        <PriceTicker prices={prices.slice(0, 10).map((p: any) => ({
          cropName: p.cropName,
          variety: p.variety,
          price: p.price?.modal,
          trend: p.priceTrend,
          changePercent: p.priceChangePercent,
          marketName: p.marketName,
        }))} />
      )}

      {/* Overview: Smart Suggestion + Crop Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SmartSuggestion predictions={mockROIPredictions} />
        </div>
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(groupedByCrop).slice(0, 4).map(([cropName, cropPrices]: [string, any]) => {
            const avgPrice = cropPrices.reduce((s: number, p: any) => s + (p.price?.modal || 0), 0) / (cropPrices.length || 1);
            const trend = cropPrices[0]?.priceTrend || 'stable';
            const TrendIcon = trendIcons[trend] || Minus;
            return (
              <Card
                key={cropName}
                className="hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800 cursor-pointer hover:-translate-y-1"
                onClick={() => openAnalytics(cropName, cropPrices)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{cropName}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(avgPrice)}</p>
                      <p className="text-xs text-slate-400">{t('market.avgPrice')}</p>
                    </div>
                    <div className={`rounded-full p-2 ${trendColors[trend]}`}>
                      <TrendIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className={trendColors[trend]}>
                      {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{cropPrices[0]?.priceChangePercent || 0}%
                    </span>
                    <span className="text-slate-400">{t('market.vsLastWeek')}</span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {language === 'mr' ? 'विश्लेषण पहा →' : language === 'hi' ? 'विश्लेषण देखें →' : 'View Analytics →'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('market.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); setSelectedTaluka(''); }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
            >
              <option value="">{language === 'mr' ? 'सर्व राज्ये' : language === 'hi' ? 'सभी राज्य' : 'All States'}</option>
              {ALL_INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedTaluka(''); }}
              disabled={!selectedState}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:opacity-50"
            >
              <option value="">{language === 'mr' ? 'सर्व जिल्हे' : language === 'hi' ? 'सभी जिले' : 'All Districts'}</option>
              {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={selectedTaluka}
              onChange={(e) => setSelectedTaluka(e.target.value)}
              disabled={!selectedDistrict}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white disabled:opacity-50"
            >
              <option value="">{language === 'mr' ? 'सर्व तालुके' : language === 'hi' ? 'सभी तालुका' : 'All Talukas'}</option>
              {availableTalukas.map((tk) => <option key={tk} value={tk}>{tk}</option>)}
            </select>

            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
            >
              <option value="">{language === 'mr' ? 'सर्व पिके' : language === 'hi' ? 'सभी फसल' : 'All Crops'}</option>
              {availableCrops.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'mr' ? 'ताजे करा' : language === 'hi' ? 'रिफ्रेश' : 'Refresh'}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Price Table */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Store className="h-5 w-5 text-emerald-600" />
            {t('market.mandiPrices')}
            <span className="ml-auto text-sm font-normal text-slate-500">
              {filteredAndSortedPrices.length} {language === 'mr' ? 'निकाल' : language === 'hi' ? 'परिणाम' : 'results'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-sm">
                  {([
                    { label: t('market.crop'), field: 'cropName' as SortField },
                    { label: t('market.variety'), field: 'variety' as SortField },
                    { label: t('market.market'), field: 'marketName' as SortField },
                    { label: t('market.minPrice'), field: 'priceMin' as SortField },
                    { label: t('market.maxPrice'), field: 'priceMax' as SortField },
                    { label: t('market.modalPrice'), field: 'priceModal' as SortField },
                  ] as { label: string; field: SortField }[]).map(({ label, field }) => (
                    <th
                      key={field}
                      className="px-3 py-3 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-emerald-600 whitespace-nowrap"
                      onClick={() => handleSort(field)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon field={field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('market.trend')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedPrices.map((price: any, idx: number) => {
                  const TrendIcon = trendIcons[price.priceTrend] || Minus;
                  return (
                    <tr key={price._id || idx} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">{price.cropName}</td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{price.variety}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{price.marketName}</span>
                          {price.marketLocation?.district && (
                            <span className="text-xs text-slate-400">({price.marketLocation.district})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(price.price?.min)}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(price.price?.max)}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(price.price?.modal)}</td>
                      <td className="px-3 py-3">
                        <div className={`flex items-center gap-1 ${trendColors[price.priceTrend] || ''}`}>
                          <TrendIcon className="h-4 w-4" />
                          <span className="text-xs">
                            {(price.priceChangePercent || 0) > 0 ? '+' : ''}{price.priceChangePercent || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedPrices.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-slate-500 dark:text-slate-400">
                {language === 'mr' ? 'कोणतेही निकाल आढळले नाहीत' : language === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No matching results found'}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {language === 'mr' ? 'फिल्टर बदलून पहा' : language === 'hi' ? 'फ़िल्टर बदलकर देखें' : 'Try adjusting your filters'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Modal — opens with crop-specific data */}
      <SmartSuggestionAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        data={analyticsData}
      />
    </motion.div>
  );
}
