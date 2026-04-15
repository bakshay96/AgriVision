'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSelectedCrops } from '@/hooks/useUser';
import {
  BookOpen, Leaf, Bug, Sprout,
  Sun, Droplets, Thermometer, Calendar,
  ChevronRight
} from 'lucide-react';
import { cropEncyclopediaApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useDebounce } from '@/hooks/useDebounce';
import PlantingGuide from '@/components/encyclopedia/PlantingGuide';
import SeasonCalendar from '@/components/encyclopedia/SeasonCalendar';
import PestManagement from '@/components/encyclopedia/PestManagement';
import AICropSearch, { getEnhancedCropData, CropInfo } from '@/components/encyclopedia/AICropSearch';
import CropDetailView from '@/components/encyclopedia/CropDetailView';

// Category configuration for crops
const getCategoryIcon = (cat: string) => {
  if (!cat) return Leaf;
  const c = cat.toLowerCase();
  if (c.includes('cereal')) return Sprout;
  if (c.includes('vegetable')) return Leaf;
  if (c.includes('fruit')) return Sun;
  if (c.includes('pulse')) return Sprout;
  if (c.includes('oilseed')) return Droplets;
  if (c.includes('spice') || c.includes('cash')) return Thermometer;
  return Leaf;
};

const getCategoryColor = (cat: string) => {
  if (!cat) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  const c = cat.toLowerCase();
  if (c.includes('cereal')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (c.includes('vegetable')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (c.includes('fruit')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if (c.includes('pulse')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (c.includes('oilseed')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (c.includes('spice') || c.includes('cash')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
};

export default function CropEncyclopediaPage() {
  const { t, language } = useLanguageStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null);
  const [aiCrop, setAiCrop] = useState<CropInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'planting' | 'season' | 'pests'>('overview');
  
  const debouncedSearch = useDebounce(search, 300);

  const { data: cropsData, isLoading } = useSelectedCrops();

  const rawCrops = useMemo(() => {
    const selected = cropsData?.selectedCrops || [];
    const listToShow = selected.length > 0 ? selected : ['wheat', 'rice', 'cotton', 'soybean'];
    
    return listToShow.map((crop: any) => {
      const cropName = typeof crop === 'string' ? crop : crop.name;
      return getEnhancedCropData(cropName || 'wheat', language);
    });
  }, [cropsData, language]);

  const categories = useMemo(() => {
    return Array.from(new Set(rawCrops.map((c: CropInfo) => c.category))) as string[];
  }, [rawCrops]);

  // Ensure category filtering works even if backend fails to filter
  const crops = selectedCategory 
    ? rawCrops.filter((c: CropInfo) => 
        c.category === selectedCategory || 
        (c.category && c.category.toLowerCase() === selectedCategory.toLowerCase())
      )
    : rawCrops;

  // If AI crop is found, show AI detail view
  if (aiCrop) {
    return (
      <CropDetailView 
        crop={aiCrop} 
        onBack={() => setAiCrop(null)} 
      />
    );
  }

  // If a crop is selected, show detailed view
  if (selectedCrop) {
    const CategoryIcon = getCategoryIcon(selectedCrop.category);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back button */}
        <button
          onClick={() => setSelectedCrop(null)}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Encyclopedia
        </button>

        {/* Crop Header */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="w-full md:w-1/3">
            <div className="relative h-64 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/20">
              {selectedCrop.images?.[0] ? (
                <>
                  <img
                    src={selectedCrop.images[0]}
                    alt={selectedCrop.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                    }}
                  />
                  <div className="hidden absolute inset-0 w-full h-full items-center justify-center">
                    <Leaf className="h-20 w-20 text-emerald-200 dark:text-emerald-800" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="h-20 w-20 text-emerald-200 dark:text-emerald-800" />
                </div>
              )}
              <div className={`absolute top-4 left-4 rounded-full p-2 ${getCategoryColor(selectedCrop.category)}`}>
                <CategoryIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedCrop.name}</h1>
            <p className="text-lg italic text-slate-500 dark:text-slate-400">{selectedCrop.scientificName}</p>
            <p className="mt-4 text-slate-600 dark:text-slate-300">{selectedCrop.description}</p>
            
            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <span className="text-sm text-slate-500 dark:text-slate-400">Category</span>
                <p className="font-medium text-emerald-700 dark:text-emerald-400 capitalize">{selectedCrop.category}</p>
              </div>
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-slate-500 dark:text-slate-400">Varieties</span>
                <p className="font-medium text-blue-700 dark:text-blue-400">{selectedCrop.varieties?.length || 0}</p>
              </div>
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-sm text-slate-500 dark:text-slate-400">Growing Period</span>
                <p className="font-medium text-amber-700 dark:text-amber-400">{selectedCrop.growingPeriod || 'N/A'} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'planting', label: t('encyclo.plantingGuide'), icon: Sprout },
              { id: 'season', label: t('encyclo.seasonCalendar'), icon: Calendar },
              { id: 'pests', label: t('encyclo.pestDisease'), icon: Bug },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card className="dark:bg-slate-900 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">{selectedCrop.detailedDescription || selectedCrop.description}</p>
                </CardContent>
              </Card>

              {selectedCrop.varieties && selectedCrop.varieties.length > 0 && (
                <Card className="dark:bg-slate-900 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Popular Varieties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedCrop.varieties.map((variety: string) => (
                        <span
                          key={variety}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                        >
                          {variety}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'planting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('encyclo.plantingGuide')}
              </h2>
              <PlantingGuide 
                soilType={selectedCrop.soilType || 'Well-drained loamy soil with good organic matter'}
                phRange={selectedCrop.phRange || '6.0 - 7.5'}
                sowingDepth={selectedCrop.sowingDepth || '3-5 cm'}
                spacing={selectedCrop.spacing || '20-25 cm between rows'}
                waterFrequency={selectedCrop.waterFrequency || 'Every 7-10 days depending on soil moisture'}
                sunlight={selectedCrop.sunlight || 'Full sun (6-8 hours daily)'}
                temperature={selectedCrop.temperatureRange || '20-30°C'}
                fertilizers={
                  selectedCrop.fertilizers && 'organic' in selectedCrop.fertilizers
                  ? [
                      { name: 'NPK', timing: 'Basal Dose', amount: (selectedCrop.fertilizers as any).npk },
                      ...(selectedCrop.fertilizers as any).organic.map((f: string) => ({ name: f, timing: 'Organic', amount: 'As needed' })),
                      ...(selectedCrop.fertilizers as any).chemical.map((f: string) => ({ name: f, timing: 'Top dressing', amount: 'As needed' }))
                    ]
                  : selectedCrop.fertilizers || [
                    { name: 'NPK 10-26-26', timing: 'At sowing', amount: '50 kg/ha' },
                    { name: 'Urea', timing: '30 days after sowing', amount: '25 kg/ha' },
                    { name: 'DAP', timing: 'At flowering', amount: '30 kg/ha' }
                  ]
                }
                growthStages={selectedCrop.growthStages || [
                  { stage: 'Germination', duration: '7-10 days', description: 'Seeds sprout and first leaves appear' },
                  { stage: 'Vegetative', duration: '30-45 days', description: 'Plant develops leaves and stems' },
                  { stage: 'Flowering', duration: '15-20 days', description: 'Flowers bloom and pollination occurs' },
                  { stage: 'Maturity', duration: '20-30 days', description: 'Seeds/grains develop and ripen' }
                ]}
              />
            </motion.div>
          )}

          {activeTab === 'season' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('encyclo.seasonCalendar')}
              </h2>
              <SeasonCalendar 
                sowingMonths={selectedCrop.sowingMonths || [5, 6]}
                growingMonths={selectedCrop.growingMonths || [6, 7, 8, 9]}
                harvestMonths={selectedCrop.harvestMonths || [10, 11]}
                bestVarieties={selectedCrop.varieties || ['Local Variety', 'High Yield Variety']}
                season={selectedCrop.season || 'Kharif'}
              />
            </motion.div>
          )}

          {activeTab === 'pests' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('encyclo.pestDisease')}
              </h2>
              <PestManagement 
                pests={selectedCrop.pests || [
                  {
                    id: '1',
                    name: 'Aphids',
                    scientificName: 'Aphidoidea',
                    description: 'Small sap-sucking insects that cause yellowing leaves and stunted growth.',
                    symptoms: ['Yellowing leaves', 'Stunted growth', 'Sticky honeydew on leaves', 'Sooty mold development'],
                    organicSolution: 'Neem oil spray (5ml per liter) or introduce ladybugs as natural predators.',
                    chemicalSolution: 'Imidacloprid 17.8% SL @ 0.3ml per liter of water.',
                    severity: 'medium' as const,
                  },
                  {
                    id: '2',
                    name: 'Stem Borer',
                    scientificName: 'Scirpophaga excerptalis',
                    description: 'Larvae bore into stems causing dead hearts and yield loss.',
                    symptoms: ['Dead heart in young plants', 'Bored stems with excreta', 'Wilting of central shoot'],
                    organicSolution: 'Release Trichogramma parasitoids @ 50,000/ha or use pheromone traps.',
                    chemicalSolution: 'Chlorpyriphos 20% EC @ 2ml per liter of water.',
                    severity: 'high' as const,
                  },
                ]}
                diseases={selectedCrop.diseases || [
                  {
                    id: '1',
                    name: 'Leaf Blight',
                    scientificName: 'Helminthosporium oryzae',
                    description: 'Fungal disease causing brown spots on leaves.',
                    symptoms: ['Brown oval spots', 'Yellowing of leaves', 'Premature drying'],
                    organicSolution: 'Remove infected plant debris, ensure proper drainage.',
                    chemicalSolution: 'Mancozeb 75% WP @ 2g per liter of water.',
                    severity: 'medium' as const,
                  }
                ]}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Main encyclopedia list view
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

      {/* AI Search - Single Search Bar */}
      <AICropSearch onCropFound={setAiCrop} />

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
          {categories.map((category: string) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {category.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Crops Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {crops.map((crop: any) => {
          const CategoryIcon = getCategoryIcon(crop.category);
          return (
            <motion.button
              key={crop._id}
              onClick={() => setSelectedCrop(crop)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-left group"
            >
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
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {crop.name}
                  </h3>
                  <p className="text-sm italic text-slate-500 dark:text-slate-400">{crop.scientificName}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {crop.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <Sprout className="h-3 w-3" />
                    <span>{crop.varieties?.length || 0} {t('encyclo.varietyCount')}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <BookOpen className="h-8 w-8 text-emerald-100" />
            <h3 className="mt-3 text-lg font-semibold">{t('encyclo.plantingGuide')}</h3>
            <p className="mt-1 text-sm text-emerald-100">
              Step-by-step cultivation instructions for every crop
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <Bug className="h-8 w-8 text-amber-100" />
            <h3 className="mt-3 text-lg font-semibold">{t('encyclo.pestDisease')}</h3>
            <p className="mt-1 text-sm text-amber-100">
              Identify and treat common crop problems
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <Calendar className="h-8 w-8 text-blue-100" />
            <h3 className="mt-3 text-lg font-semibold">{t('encyclo.seasonCalendar')}</h3>
            <p className="mt-1 text-sm text-blue-100">
              Best times to plant and harvest each crop
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
