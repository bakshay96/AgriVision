'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, Sprout, Droplets, Sun, Thermometer, Calendar, Bug, Leaf, Beaker, Tractor } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

export interface CropInfo {
  _id?: string;
  name: string;
  scientificName: string;
  description: string;
  category: string;
  images?: string[];
  // Planting Guide
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
  fertilizers: {
    organic: string[];
    chemical: string[];
    npk: string;
  };
  // Pest Management
  commonPests: {
    name: string;
    description: string;
    symptoms: string[];
    organicControl: string;
    chemicalControl: string;
  }[];
  // Growing Stages
  stages: {
    name: string;
    duration: string;
    description: string;
    care: string[];
  }[];
  // Regional Info
  suitableStates: string[];
  bestSeason: string;
  waterRequirement: string;
  marketDemand: string;
  // UI Display Extras from older mock models
  varieties?: string[];
  growingPeriod?: number;
  detailedDescription?: string;
  phRange?: string;
  temperatureRange?: string;
  growthStages?: any[];
  sowingMonths?: number[];
  growingMonths?: number[];
  harvestMonths?: number[];
  season?: string;
  pests?: any[];
  diseases?: any[];
}

// Comprehensive crop database with full details
export const cropDatabase: Record<string, CropInfo> = {
  'wheat': {
    name: 'Wheat', // Default EN
    scientificName: 'Triticum aestivum',
    description: 'Wheat is a major rabi crop in India. It grows well in cool climates and is renowned for its nutritional value.',
    category: 'cereal',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=800&auto=format&fit=crop'],
    soilType: 'Well-drained loamy soil',
    soilPH: '6.0 - 7.5',
    sowingDepth: '4-6 cm',
    spacing: '15-20 cm between rows',
    waterFrequency: 'Every 15-20 days',
    sunlight: 'Full sun (8-10 hours)',
    temperature: '15-25°C',
    germinationTime: '7-10 days',
    harvestTime: '110-140 days',
    fertilizers: {
      organic: ['Farm Yard Manure', 'Vermicompost', 'Green Manure'],
      chemical: ['Urea', 'DAP', 'MOP'],
      npk: '120:60:40 kg/ha'
    },
    commonPests: [
      {
        name: 'Yellow Rust',
        description: 'Fungal disease affecting leaves',
        symptoms: ['Yellow stripes on leaves', 'Reduced photosynthesis', 'Stunted growth'],
        organicControl: 'Neem oil spray @ 5ml/liter',
        chemicalControl: 'Propiconazole 25% EC @ 1ml/liter'
      },
      {
        name: 'Karnal Bunt',
        description: 'Seed-borne fungal disease',
        symptoms: ['Blackened grains', 'Fishy odor', 'Reduced yield'],
        organicControl: 'Seed treatment with Trichoderma',
        chemicalControl: 'Carbendazim 50% WP @ 2g/kg seed'
      }
    ],
    stages: [
      { name: 'Germination', duration: '7-10 days', description: 'Seed sprouts and roots emerge', care: ['Maintain soil moisture', 'Protect from birds'] },
      { name: 'Seedling', duration: '20-25 days', description: 'First leaves appear', care: ['Light irrigation', 'Weed control'] },
      { name: 'Tillering', duration: '30-40 days', description: 'Multiple stems develop', care: ['Nitrogen fertilizer', 'Adequate water'] },
      { name: 'Booting', duration: '15-20 days', description: 'Grain head develops', care: ['Critical water stage', 'Pest monitoring'] },
      { name: 'Grain Filling', duration: '30-35 days', description: 'Grains develop and mature', care: ['Reduce irrigation', 'Disease control'] }
    ],
    suitableStates: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'],
    bestSeason: 'Rabi (Nov-Dec)',
    waterRequirement: '450-650 mm',
    marketDemand: 'High'
  },
  'rice': {
    name: 'Rice',
    scientificName: 'Oryza sativa',
    description: 'Rice is India\'s most important food crop. It grows abundantly in water-rich conditions.',
    category: 'cereal',
    images: ['https://images.unsplash.com/photo-1530982011887-3cc11cc85693?q=80&w=800&auto=format&fit=crop'],
    soilType: 'Clay loam that retains water',
    soilPH: '5.5 - 6.5',
    sowingDepth: '2-3 cm',
    spacing: '15 cm x 15 cm',
    waterFrequency: 'Keep continuously flooded',
    sunlight: 'Full sun',
    temperature: '20-35°C',
    germinationTime: '5-10 days',
    harvestTime: '90-150 days',
    fertilizers: {
      organic: ['Compost', 'Green Manure', 'Biofertilizers'],
      chemical: ['Urea', 'DAP', 'Zinc Sulphate'],
      npk: '100:50:50 kg/ha'
    },
    commonPests: [
      {
        name: 'Stem Borer',
        description: 'Larvae bore into stems',
        symptoms: ['Dead hearts', 'Empty panicles', 'Bored stems'],
        organicControl: 'Pheromone traps @ 10/ha',
        chemicalControl: 'Chlorpyriphos 20% EC @ 2.5ml/liter'
      },
      {
        name: 'Leaf Folder',
        description: 'Larvae fold leaves and feed inside',
        symptoms: ['Folded leaves', 'White patches', 'Reduced yield'],
        organicControl: 'Release Trichogramma @ 5 cards/ha',
        chemicalControl: 'Cartap Hydrochloride 4% G @ 25 kg/ha'
      }
    ],
    stages: [
      { name: 'Germination', duration: '5-10 days', description: 'Seed sprouts in nursery', care: ['Maintain water level', 'Protect from pests'] },
      { name: 'Transplanting', duration: '20-30 days', description: 'Seedlings moved to field', care: ['Proper spacing', 'Adequate water'] },
      { name: 'Tillering', duration: '30-40 days', description: 'Multiple shoots develop', care: ['Nitrogen application', 'Weed control'] },
      { name: 'Flowering', duration: '20-25 days', description: 'Panicle emergence', care: ['Maintain water', 'Disease spray'] },
      { name: 'Grain Filling', duration: '30-40 days', description: 'Grains mature', care: ['Drain water before harvest', 'Bird control'] }
    ],
    suitableStates: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Andhra Pradesh', 'Tamil Nadu'],
    bestSeason: 'Kharif (Jun-Jul)',
    waterRequirement: '1500-2500 mm',
    marketDemand: 'Very High'
  },
  'cotton': {
    name: 'Cotton',
    scientificName: 'Gossypium hirsutum',
    description: 'Cotton is a major cash crop in India. It thrives in warm climates.',
    category: 'fiber',
    images: [], // Fixed invalid image link for cotton
    soilType: 'Black soil or loamy soil',
    soilPH: '6.5 - 7.5',
    sowingDepth: '2.5-4 cm',
    spacing: '75-90 cm x 15-30 cm',
    waterFrequency: 'Every 8-12 days',
    sunlight: 'Full sun (10-12 hours)',
    temperature: '25-35°C',
    germinationTime: '5-10 days',
    harvestTime: '150-180 days',
    fertilizers: {
      organic: ['Compost', 'Castor Cake', 'Neem Cake'],
      chemical: ['Urea', 'SSP', 'MOP'],
      npk: '100:50:50 kg/ha'
    },
    commonPests: [
      {
        name: 'Whitefly',
        description: 'Sap-sucking insect, virus vector',
        symptoms: ['Yellowing leaves', 'Sooty mold', 'Curling leaves'],
        organicControl: 'Yellow sticky traps @ 10/ha',
        chemicalControl: 'Imidacloprid 17.8% SL @ 0.3ml/liter'
      },
      {
        name: 'Pink Bollworm',
        description: 'Larvae damage cotton bolls',
        symptoms: ['Damaged bolls', 'Premature opening', 'Lint damage'],
        organicControl: 'Pheromone traps @ 15/ha',
        chemicalControl: 'Spinosad 45% SC @ 0.2ml/liter'
      }
    ],
    stages: [
      { name: 'Germination', duration: '5-10 days', description: 'Seeds sprout', care: ['Light irrigation', 'Weed control'] },
      { name: 'Seedling', duration: '25-35 days', description: 'True leaves develop', care: ['Thinning', 'First irrigation'] },
      { name: 'Vegetative', duration: '40-50 days', description: 'Rapid plant growth', care: ['Fertilizer top-dress', 'Pest control'] },
      { name: 'Flowering', duration: '50-60 days', description: 'Flowers and bolls form', care: ['Regular irrigation', 'Bollworm monitoring'] },
      { name: 'Boll Development', duration: '40-50 days', description: 'Bolls mature', care: ['Reduce irrigation', 'Defoliation if needed'] }
    ],
    suitableStates: ['Maharashtra', 'Gujarat', 'Telangana', 'Andhra Pradesh', 'Punjab'],
    bestSeason: 'Kharif (May-Jun)',
    waterRequirement: '700-1300 mm',
    marketDemand: 'High'
  }
};

// Simulated AI Generation for any unknown crop
export const getEnhancedCropData = (cropName: string, language: string = 'en'): CropInfo => {
  const normalized = cropName.toLowerCase().trim();
  
  // 1. Check strict static DB match
  const match = Object.keys(cropDatabase).find(key => key.includes(normalized) || cropDatabase[key].name.toLowerCase().includes(normalized));
  if (match) {
    const crop = { ...cropDatabase[match], _id: match };
    // Apply translations if language is not EN
    if (language === 'mr') {
      if (match === 'wheat') { crop.name = 'गहू'; crop.description = 'गहू हे भारतातील एक प्रमुख रबी पीक आहे. हे पीक थंड हवामानात चांगले वाढते.'; }
      else if (match === 'rice') { crop.name = 'तांदूळ'; crop.description = 'तांदूळ हे भारतातील सर्वात महत्त्वाचे खाद्यपीक आहे. हे पीक पाण्याच्या भरपूर प्रमाणात वाढते.'; }
      else if (match === 'cotton') { crop.name = 'कापूस'; crop.description = 'कापूस हे भारतातील एक प्रमुख नगदी पीक आहे. हे पीक उष्ण हवामानात चांगले वाढते.'; }
    } else if (language === 'hi') {
      if (match === 'wheat') { crop.name = 'गेहूं'; crop.description = 'गेहूं भारत की एक प्रमुख रबी फसल है। यह ठंडी जलवायु में अच्छी तरह उगती है।'; }
      else if (match === 'rice') { crop.name = 'चावल'; crop.description = 'चावल भारत की सबसे महत्वपूर्ण खाद्य फसल है।'; }
      else if (match === 'cotton') { crop.name = 'कपास'; crop.description = 'कपास भारत की एक प्रमुख नकदी फसल है।'; }
    }
    return crop;
  }

  // 2. AI Procedural Generation for UNKNOWN crop
  const nameBase = cropName.charAt(0).toUpperCase() + cropName.slice(1);
  return {
    _id: normalized.replace(/\s+/g, '-'),
    name: nameBase,
    scientificName: `${nameBase} specia`,
    description: language === 'mr' 
      ? `हे ${nameBase} पिकाचे AI जनरेटेड माहितीपत्रक आहे. याला योग्य काळजी, पाणी आणि हवामानाची आवश्यकता असते.`
      : language === 'hi'
      ? `${nameBase} फसल के लिए एआई (AI) द्वारा उत्पन्न जानकारी। इसे उचित देखभाल और पानी की आवश्यकता होती है।`
      : `An AI-generated detailed profile for ${nameBase}. This crop requires specific care, optimal temperatures, and balanced fertilizers to yield high quality produce.`,
    category: normalized.includes('bean') || normalized.includes('pulse') ? 'pulse' : normalized.includes('seed') ? 'oilseed' : 'vegetable',
    soilType: language === 'mr' ? 'चांगला निचरा होणारी माती' : language === 'hi' ? 'अच्छी जल निकासी वाली मिट्टी' : 'Well-draining loamy soil',
    soilPH: '6.0 - 7.0',
    sowingDepth: '2-4 cm',
    spacing: '30-45 cm',
    waterFrequency: language === 'mr' ? '५-७ दिवसांनी' : language === 'hi' ? '५-७ दिनों में' : 'Every 5-7 days',
    sunlight: language === 'mr' ? 'पूर्ण सूर्यप्रकाश' : language === 'hi' ? 'पूर्ण धूप' : 'Full sun (6-8 hours)',
    temperature: '20-30°C',
    germinationTime: '7-14 days',
    harvestTime: '60-120 days',
    fertilizers: {
      organic: ['Compost', 'Vermicompost', 'Neem Cake'],
      chemical: ['Urea', 'DAP', 'Potash'],
      npk: '100:50:50 kg/ha'
    },
    commonPests: [
      {
        name: language === 'mr' ? 'मावा' : language === 'hi' ? 'एफिड्स' : 'Aphids',
        description: 'Small sap-sucking insects',
        symptoms: ['Yellowing', 'Stunted growth', 'Curled leaves'],
        organicControl: 'Neem oil spray (5ml/L)',
        chemicalControl: 'Imidacloprid (0.3ml/L)'
      },
      {
        name: language === 'mr' ? 'अळी' : language === 'hi' ? 'सुंडी' : 'Caterpillar/Borer',
        description: 'Leaf and fruit eating insects',
        symptoms: ['Holes in leaves', 'Damaged fruits'],
        organicControl: 'Bacillus thuringiensis (Bt)',
        chemicalControl: 'Chlorpyriphos (2ml/L)'
      }
    ],
    stages: [
      { name: language === 'mr' ? 'लागवड' : language === 'hi' ? 'बुवाई' : 'Planting', duration: '1-2 weeks', description: 'Sowing and germination', care: ['Keep soil moist'] },
      { name: language === 'mr' ? 'वाढ' : language === 'hi' ? 'विकास' : 'Vegetative Growth', duration: '4-6 weeks', description: 'Development of leaves/stems', care: ['Apply nitrogen'] },
      { name: language === 'mr' ? 'फुलोरा' : language === 'hi' ? 'फूल' : 'Flowering', duration: '2-3 weeks', description: 'Buds and flowers appear', care: ['Ensure pollination'] },
      { name: language === 'mr' ? 'काढणी' : language === 'hi' ? 'कटाई' : 'Harvesting', duration: '1-2 weeks', description: 'Maturation phase', care: ['Stop irrigation'] },
    ],
    suitableStates: ['Maharashtra', 'Karnataka', 'Gujarat', 'Madhya Pradesh'],
    bestSeason: 'Kharif / Rabi',
    waterRequirement: 'Moderate',
    marketDemand: 'High'
  };
};

interface AICropSearchProps {
  onCropFound: (crop: CropInfo) => void;
}

export default function AICropSearch({ onCropFound }: AICropSearchProps) {
  const { t, language } = useLanguageStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const popularCrops = ['wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'soybean', 'groundnut', 'mustard', 'gram', 'tur'];

  const getLiveGeminiCrop = async (cropName: string, lang: string): Promise<CropInfo | null> => {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDVuyWGLmUkmlExGpkcDq7st8dJcQFsaPU';
    const prompt = `Provide a detailed agricultural guide for the crop "${cropName}" in the "${lang === 'mr' ? 'Marathi' : lang === 'hi' ? 'Hindi' : 'English'}" language.
Respond STRICTLY with a raw JSON object string (do not include markdown wrapping like \`\`\`json) that EXACTLY matches this TypeScript structure. DO NOT invent fields outside this structure. Provide accurate, highly informative farming details:
{
  "name": "string",
  "scientificName": "string",
  "description": "string",
  "category": "string (e.g. cereal, vegetable, fruit, pulse, oilseed)",
  "soilType": "string",
  "soilPH": "string",
  "sowingDepth": "string",
  "spacing": "string",
  "waterFrequency": "string",
  "sunlight": "string",
  "temperature": "string",
  "germinationTime": "string",
  "harvestTime": "string",
  "fertilizers": { "organic": ["string", "string"], "chemical": ["string", "string"], "npk": "string" },
  "commonPests": [
    { "name": "string", "description": "string", "symptoms": ["string"], "organicControl": "string", "chemicalControl": "string" }
  ],
  "stages": [
    { "name": "string", "duration": "string", "description": "string", "care": ["string"] }
  ],
  "suitableStates": ["string"],
  "bestSeason": "string",
  "waterRequirement": "string",
  "marketDemand": "string"
}
Ensure pest data covers exactly 2 common pests and stages covers 4-5 distinct phases. Organic/chemical fertilizers MUST be arrays of strings.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(text) as CropInfo;
      result._id = cropName.replace(/\s+/g, '-').toLowerCase() + '-ai';
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return null;
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setIsSearching(true);
    setSuggestions([]);
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // 1. Exact local match
    const matchedCrop = Object.keys(cropDatabase).find(key => 
      key.includes(normalizedQuery) || cropDatabase[key].name.toLowerCase().includes(normalizedQuery)
    );
    
    if (matchedCrop) {
      onCropFound(getEnhancedCropData(matchedCrop, language));
      setIsSearching(false);
      return;
    }

    // 2. Fetch Live AI Generated Response
    const liveCrop = await getLiveGeminiCrop(searchQuery, language);
    if (liveCrop) {
      onCropFound(liveCrop);
    } else {
      // 3. Fallback to procedural text if API fails
      onCropFound(getEnhancedCropData(searchQuery, language));
    }
    
    setIsSearching(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* AI Search Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
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
            if (val.length >= 2) {
              const newSuggestions = popularCrops.filter(crop => 
                crop.includes(val.toLowerCase())
              ).slice(0, 5);
              setSuggestions(newSuggestions);
            } else {
              setSuggestions([]);
            }
          }}
          placeholder={language === 'mr' ? 'पीक शोधा (उदा. गहू, तांदूळ, कापूस)...' : language === 'hi' ? 'फसल खोजें (जैसे गेहूं, चावल, कपास)...' : 'Search any crop (e.g., wheat, rice, cotton)...'}
          className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white shadow-lg transition-shadow"
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

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                  setSuggestions([]);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
              >
                <Sprout className="h-4 w-4 text-emerald-500" />
                <span className="capitalize text-slate-700 dark:text-slate-300">{suggestion}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Categories */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {[
          { icon: Sprout, label: language === 'mr' ? 'धान्य' : language === 'hi' ? 'अनाज' : 'Cereals', crops: ['wheat', 'rice', 'maize'] },
          { icon: Droplets, label: language === 'mr' ? 'तेलबिया' : language === 'hi' ? 'तिलहन' : 'Oilseeds', crops: ['groundnut', 'soybean', 'mustard'] },
          { icon: Leaf, label: language === 'mr' ? 'कडधान्य' : language === 'hi' ? 'दालें' : 'Pulses', crops: ['gram', 'tur', 'moong'] },
          { icon: Sun, label: language === 'mr' ? 'नगदी पिके' : language === 'hi' ? 'नकदी फसल' : 'Cash Crops', crops: ['cotton', 'sugarcane'] },
        ].map((category) => (
          <button
            key={category.label}
            onClick={() => {
              const randomCrop = category.crops[Math.floor(Math.random() * category.crops.length)];
              setQuery(randomCrop);
              handleSearch(randomCrop);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <category.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
