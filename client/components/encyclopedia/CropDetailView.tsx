'use client';

import { motion } from 'framer-motion';
import { 
  Sprout, Droplets, Sun, Thermometer, Calendar, Bug, Leaf, 
  Beaker, Tractor, MapPin, TrendingUp, Clock, CheckCircle,
  AlertCircle, FlaskConical, Shovel, CloudRain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageStore } from '@/store/useLanguageStore';

interface CropInfo {
  name: string;
  scientificName: string;
  description: string;
  category: string;
  soilType: string;
  soilPH: string;
  sowingDepth: string;
  spacing: string;
  waterFrequency: string;
  sunlight: string;
  temperature: string;
  germinationTime: string;
  harvestTime: string;
  fertilizers: {
    organic: string[];
    chemical: string[];
    npk: string;
  };
  commonPests: {
    name: string;
    description: string;
    symptoms: string[];
    organicControl: string;
    chemicalControl: string;
  }[];
  stages: {
    name: string;
    duration: string;
    description: string;
    care: string[];
  }[];
  suitableStates: string[];
  bestSeason: string;
  waterRequirement: string;
  marketDemand: string;
}

interface CropDetailViewProps {
  crop: CropInfo;
  onBack: () => void;
}

export default function CropDetailView({ crop, onBack }: CropDetailViewProps) {
  const { t, language } = useLanguageStore();

  const getCategoryIcon = () => {
    switch (crop.category) {
      case 'cereal': return <Sprout className="h-6 w-6" />;
      case 'pulse': return <Leaf className="h-6 w-6" />;
      case 'oilseed': return <Droplets className="h-6 w-6" />;
      case 'fiber': return <Sun className="h-6 w-6" />;
      default: return <Sprout className="h-6 w-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
      >
        <span className="text-lg">←</span>
        {language === 'mr' ? 'मागे जा' : language === 'hi' ? 'वापस जाएं' : 'Back to Search'}
      </button>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white/20 rounded-2xl">
              {getCategoryIcon()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold">{crop.name}</h1>
              <p className="text-lg italic text-emerald-100 mt-1">{crop.scientificName}</p>
              <p className="mt-4 text-emerald-50 leading-relaxed">{crop.description}</p>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {crop.bestSeason}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {crop.harvestTime}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {crop.marketDemand} {language === 'mr' ? 'मागणी' : language === 'hi' ? 'मांग' : 'Demand'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Thermometer, label: language === 'mr' ? 'तापमान' : language === 'hi' ? 'तापमान' : 'Temperature', value: crop.temperature },
          { icon: Clock, label: language === 'mr' ? 'पिक कालावधी' : language === 'hi' ? 'फसल अवधि' : 'Duration', value: crop.harvestTime },
          { icon: CloudRain, label: language === 'mr' ? 'पाणी' : language === 'hi' ? 'पानी' : 'Water', value: crop.waterRequirement },
          { icon: Sun, label: language === 'mr' ? 'सूर्यप्रकाश' : language === 'hi' ? 'धूप' : 'Sunlight', value: crop.sunlight },
        ].map((stat, idx) => (
          <Card key={idx} className="dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-4 text-center">
              <stat.icon className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Planting Guide */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Shovel className="h-5 w-5 text-emerald-500" />
              {language === 'mr' ? 'लागवड मार्गदर्शक' : language === 'hi' ? 'बुआई मार्गदर्शिका' : 'Planting Guide'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: language === 'mr' ? 'माती प्रकार' : language === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type', value: crop.soilType },
              { label: language === 'mr' ? 'pH स्तर' : language === 'hi' ? 'pH स्तर' : 'Soil pH', value: crop.soilPH },
              { label: language === 'mr' ? 'पेरणी खोली' : language === 'hi' ? 'बुआई की गहराई' : 'Sowing Depth', value: crop.sowingDepth },
              { label: language === 'mr' ? 'अंतर' : language === 'hi' ? 'दूरी' : 'Spacing', value: crop.spacing },
              { label: language === 'mr' ? 'अंकुरण काल' : language === 'hi' ? 'अंकुरण समय' : 'Germination', value: crop.germinationTime },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                <span className="font-medium text-slate-900 dark:text-white text-right">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fertilizer Guide */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <FlaskConical className="h-5 w-5 text-blue-500" />
              {language === 'mr' ? 'खत मार्गदर्शक' : language === 'hi' ? 'उर्वरक मार्गदर्शिका' : 'Fertilizer Guide'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">NPK Ratio</p>
              <p className="font-bold text-blue-700 dark:text-blue-400 text-lg">{crop.fertilizers.npk}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {language === 'mr' ? 'सेंद्रिय खते' : language === 'hi' ? 'जैविक उर्वरक' : 'Organic Fertilizers'}
              </p>
              <div className="flex flex-wrap gap-2">
                {crop.fertilizers.organic.map((fert, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                    {fert}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {language === 'mr' ? 'रासायनिक खते' : language === 'hi' ? 'रासायनिक उर्वरक' : 'Chemical Fertilizers'}
              </p>
              <div className="flex flex-wrap gap-2">
                {crop.fertilizers.chemical.map((fert, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs">
                    {fert}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growing Stages */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Calendar className="h-5 w-5 text-purple-500" />
            {language === 'mr' ? 'वाढीच्या टप्पे' : language === 'hi' ? 'विकास चरण' : 'Growing Stages'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {crop.stages.map((stage, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{stage.name}</h4>
                    <span className="text-xs text-slate-500">({stage.duration})</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stage.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stage.care.map((care, careIdx) => (
                      <span key={careIdx} className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        {care}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pest Management */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Bug className="h-5 w-5 text-red-500" />
            {language === 'mr' ? 'कीट व्यवस्थापन' : language === 'hi' ? 'कीट प्रबंधन' : 'Pest Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {crop.commonPests.map((pest, idx) => (
              <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  {pest.name}
                </h4>
                <p className="text-sm text-slate-500 mt-1">{pest.description}</p>
                
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === 'mr' ? 'लक्षणे' : language === 'hi' ? 'लक्षण' : 'Symptoms'}:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {pest.symptoms.map((symptom, sIdx) => (
                      <li key={sIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span className="w-1 h-1 bg-slate-400 rounded-full" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {language === 'mr' ? 'सेंद्रिय उपाय: ' : language === 'hi' ? 'जैविक समाधान: ' : 'Organic: '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{pest.organicControl}</span>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {language === 'mr' ? 'रासायनिक उपाय: ' : language === 'hi' ? 'रासायनिक समाधान: ' : 'Chemical: '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{pest.chemicalControl}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suitable Regions */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <MapPin className="h-5 w-5 text-blue-500" />
            {language === 'mr' ? 'योग्य प्रदेश' : language === 'hi' ? 'उपयुक्त क्षेत्र' : 'Suitable Regions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {crop.suitableStates.map((state, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                {state}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
