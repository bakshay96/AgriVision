'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, Sprout, Droplets, Sun, Leaf } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { cropEncyclopediaApi } from '@/lib/api';

// ─── Shared CropInfo interface (used by page.tsx and CropDetailView) ───────────
export interface CropInfo {
  _id?: string;
  name: string;
  scientificName: string;
  description: string;
  category: string;
  images?: string[];
  // Planting
  soilType: string;
  soilPH: string;
  sowingDepth: string;
  spacing: string;
  waterFrequency: string;
  sunlight: string;
  temperature: string;
  germinationTime: string;
  harvestTime: string;
  // Fertilizer
  fertilizers: { organic: string[]; chemical: string[]; npk: string };
  // Pests
  commonPests: {
    name: string;
    description: string;
    symptoms: string[];
    organicControl: string;
    chemicalControl: string;
  }[];
  // Stages
  stages: { name: string; duration: string; description: string; care: string[] }[];
  // Regional
  suitableStates: string[];
  bestSeason: string;
  waterRequirement: string;
  marketDemand: string;
  // Optional extras
  varieties?: string[];
  growingPeriod?: number;
  detailedDescription?: string;
  phRange?: string;
  temperatureRange?: string;
  growthStages?: unknown[];
  sowingMonths?: number[];
  growingMonths?: number[];
  harvestMonths?: number[];
  season?: string;
  pests?: unknown[];
  diseases?: unknown[];
  nutritionalValue?: { calories: number; protein: number; carbohydrates: number; fiber: number };
  yieldPerAcre?: string;
  marketInfo?: { demand: string; priceRange?: { min: number; max: number; unit: string }; exportPotential?: boolean };
}

interface AICropSearchProps {
  onCropFound: (crop: CropInfo) => void;
}

const POPULAR_CROPS = [
  'wheat', 'rice', 'cotton', 'sugarcane', 'maize',
  'soybean', 'groundnut', 'mustard', 'gram', 'tomato', 'onion',
];

const CATEGORIES = [
  { icon: Sprout,  label: { en: 'Cereals',   hi: 'अनाज',    mr: 'धान्य' },    crops: ['wheat', 'rice', 'maize'] },
  { icon: Droplets, label: { en: 'Oilseeds', hi: 'तिलहन',   mr: 'तेलबिया' }, crops: ['groundnut', 'soybean', 'mustard'] },
  { icon: Leaf,    label: { en: 'Pulses',    hi: 'दालें',   mr: 'कडधान्य' },  crops: ['gram', 'tur', 'moong'] },
  { icon: Sun,     label: { en: 'Cash Crops',hi: 'नकदी फसल', mr: 'नगदी पिके' }, crops: ['cotton', 'sugarcane'] },
];

export default function AICropSearch({ onCropFound }: AICropSearchProps) {
  const { language } = useLanguageStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const placeholder =
    language === 'mr' ? 'पीक शोधा (उदा. गहू, तांदूळ, कापूस)...' :
    language === 'hi' ? 'फसल खोजें (जैसे गेहूं, चावल, कपास)...' :
    'Search any crop (e.g., wheat, rice, cotton)...';

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setIsSearching(true);
    setSuggestions([]);
    setError(null);

    try {
      // 1. Try exact name match from server DB first (fast)
      try {
        const nameRes = await cropEncyclopediaApi.getByName(searchQuery.trim());
        const serverCrop = nameRes.data?.data?.crop;
        if (serverCrop) {
          // Normalise server schema → CropInfo interface
          onCropFound(normaliseServerCrop(serverCrop));
          setIsSearching(false);
          return;
        }
      } catch {
        // Not in DB — fall through to AI search
      }

      // 2. Server-side AI search (Gemini key is on the server, not exposed)
      const aiRes = await cropEncyclopediaApi.aiSearch(searchQuery.trim(), language);
      const aiCrop = aiRes.data?.data?.crop;
      if (aiCrop) {
        onCropFound(aiCrop as CropInfo);
      } else {
        setError(
          language === 'mr' ? 'पीक माहिती मिळाली नाही. पुन्हा प्रयत्न करा.' :
          language === 'hi' ? 'फसल की जानकारी नहीं मिली। फिर प्रयास करें।' :
          'No crop data found. Please try a different name.'
        );
      }
    } catch (err) {
      console.error('[AICropSearch] Error:', err);
      setError(
        language === 'mr' ? 'शोध अयशस्वी. इंटरनेट तपासा.' :
        language === 'hi' ? 'खोज विफल। कनेक्शन जांचें।' :
        'Search failed. Please check your connection and try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
        className="relative"
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Sparkles className="h-5 w-5 text-emerald-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setError(null);
            if (val.length >= 2) {
              setSuggestions(
                POPULAR_CROPS.filter((c) => c.includes(val.toLowerCase())).slice(0, 5)
              );
            } else {
              setSuggestions([]);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white shadow-lg transition-all"
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-4 flex items-center"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400 hover:text-emerald-500 cursor-pointer transition-colors" />
          )}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-10 relative"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); handleSearch(s); setSuggestions([]); }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
              >
                <Sprout className="h-4 w-4 text-emerald-500" />
                <span className="capitalize text-slate-700 dark:text-slate-300">{s}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Category Buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((cat) => {
          const label = cat.label[language as keyof typeof cat.label] ?? cat.label.en;
          return (
            <button
              key={label}
              onClick={() => {
                const randomCrop = cat.crops[Math.floor(Math.random() * cat.crops.length)];
                setQuery(randomCrop);
                handleSearch(randomCrop);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <cat.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper: normalise MongoDB schema → flat CropInfo interface ──────────────
export function normaliseServerCrop(serverCrop: Record<string, unknown>): CropInfo {
  const pg = (serverCrop.plantingGuide as Record<string, unknown>) || {};
  const cg = (serverCrop.careGuide as Record<string, unknown>) || {};
  const hi = (serverCrop.harvestInfo as Record<string, unknown>) || {};
  const mi = (serverCrop.marketInfo as Record<string, unknown>) || {};
  const nv = (serverCrop.nutritionalValue as Record<string, unknown>) || {};
  const pestsAndDiseases = (serverCrop.pestsAndDiseases as Record<string, unknown>[]) || [];
  const varieties = (serverCrop.varieties as Record<string, unknown>[]) || [];

  const soilPH = pg.soilPH as { min?: number; max?: number } | undefined;
  const temp   = pg.temperature as { min?: number; max?: number; optimal?: number } | undefined;

  return {
    _id: String(serverCrop._id || serverCrop.id || ''),
    name: String(serverCrop.name || ''),
    scientificName: String(serverCrop.scientificName || ''),
    description: String(serverCrop.description || ''),
    category: String(serverCrop.category || 'cereal'),
    images: (serverCrop.images as string[]) || [],
    soilType: Array.isArray(pg.soilType)
      ? (pg.soilType as string[]).join(', ')
      : String(pg.soilType || 'Well-drained loamy soil'),
    soilPH: soilPH ? `${soilPH.min} - ${soilPH.max}` : '6.0 - 7.0',
    sowingDepth: String(pg.seedDepth || '3-5 cm'),
    spacing: String(pg.spacing || '20-30 cm'),
    waterFrequency: String(cg.watering || 'As needed'),
    sunlight: 'Full sun (6-8 hours)',
    temperature: temp ? `${temp.min}-${temp.max}°C (optimal ${temp.optimal}°C)` : '20-30°C',
    germinationTime: pg.germinationDays ? `${pg.germinationDays} days` : '7-14 days',
    harvestTime: hi.daysToMaturity ? `${hi.daysToMaturity} days` : '90-120 days',
    fertilizers: {
      organic: Array.isArray(cg.pestControl) ? [] : [],
      chemical: Array.isArray(cg.fertilization) ? (cg.fertilization as string[]).slice(0, 3) : [],
      npk: Array.isArray(cg.fertilization) && (cg.fertilization as string[]).length > 0
        ? String((cg.fertilization as string[])[0]) : 'N/A',
    },
    commonPests: pestsAndDiseases.slice(0, 3).map((p) => ({
      name: String(p.name || ''),
      description: Array.isArray(p.causes) ? (p.causes as string[]).join(', ') : '',
      symptoms: (p.symptoms as string[]) || [],
      organicControl: Array.isArray(p.organicRemedies) ? (p.organicRemedies as string[]).join('; ') : '',
      chemicalControl: Array.isArray(p.chemicalTreatments) ? (p.chemicalTreatments as string[]).join('; ') : '',
    })),
    stages: [
      { name: 'Germination', duration: `${pg.germinationDays || 10} days`, description: 'Seed sprouts', care: ['Keep soil moist'] },
      { name: 'Vegetative', duration: '30-45 days', description: 'Plant develops', care: ['Apply fertilizer'] },
      { name: 'Flowering', duration: '15-25 days', description: 'Flowers develop', care: ['Ensure pollination'] },
      { name: 'Harvest', duration: `Day ${hi.daysToMaturity || 90}`, description: String(hi.harvestingMethod || 'Manual harvest'), care: ['Check maturity indicators'] },
    ],
    suitableStates: ['Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh'],
    bestSeason: String(pg.season || 'Kharif'),
    waterRequirement: pg.rainfall
      ? `${(pg.rainfall as { min?: number; max?: number }).min}-${(pg.rainfall as { min?: number; max?: number }).max} mm`
      : 'Moderate',
    marketDemand: String((mi as { demand?: string }).demand || 'High'),
    varieties: varieties.map((v) => String(v.name || '')).filter(Boolean),
    nutritionalValue: {
      calories: Number(nv.calories || 0),
      protein: Number(nv.protein || 0),
      carbohydrates: Number(nv.carbohydrates || 0),
      fiber: Number(nv.fiber || 0),
    },
    marketInfo: {
      demand: String((mi as { demand?: string }).demand || 'high'),
      priceRange: (mi as { priceRange?: { min: number; max: number; unit: string } }).priceRange,
      exportPotential: Boolean((mi as { exportPotential?: boolean }).exportPotential),
    },
  };
}
