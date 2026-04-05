'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, Sprout, Droplets, Sun, Thermometer, Calendar, Bug, Leaf, Beaker, Tractor } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface CropInfo {
  name: string;
  scientificName: string;
  description: string;
  category: string;
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
}

interface AICropSearchProps {
  onCropFound: (crop: CropInfo) => void;
}

export default function AICropSearch({ onCropFound }: AICropSearchProps) {
  const { t, language } = useLanguageStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Comprehensive crop database with full details
  const cropDatabase: Record<string, CropInfo> = {
    'wheat': {
      name: language === 'mr' ? 'गहू' : language === 'hi' ? 'गेहूं' : 'Wheat',
      scientificName: 'Triticum aestivum',
      description: language === 'mr' 
        ? 'गहू हे भारतातील एक प्रमुख रबी पीक आहे. हे पीक थंड हवामानात चांगले वाढते आणि पौष्टिकतेसाठी प्रसिद्ध आहे.'
        : language === 'hi'
        ? 'गेहूं भारत की एक प्रमुख रबी फसल है। यह ठंडी जलवायु में अच्छी तरह उगती है और पोषण के लिए प्रसिद्ध है।'
        : 'Wheat is a major rabi crop in India. It grows well in cool climates and is renowned for its nutritional value.',
      category: 'cereal',
      soilType: language === 'mr' ? 'चांगले निचरा असलेली दोमट माती' : language === 'hi' ? 'अच्छी जल निकासी वाली दोमट मिट्टी' : 'Well-drained loamy soil',
      soilPH: '6.0 - 7.5',
      sowingDepth: '4-6 cm',
      spacing: '15-20 cm between rows',
      waterFrequency: language === 'mr' ? '15-20 दिवसांनी' : language === 'hi' ? '15-20 दिनों में' : 'Every 15-20 days',
      sunlight: language === 'mr' ? 'पूर्ण सूर्यप्रकाश (8-10 तास)' : language === 'hi' ? 'पूर्ण धूप (8-10 घंटे)' : 'Full sun (8-10 hours)',
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
          name: language === 'mr' ? 'तण' : language === 'hi' ? 'पीला रतुआ' : 'Yellow Rust',
          description: 'Fungal disease affecting leaves',
          symptoms: ['Yellow stripes on leaves', 'Reduced photosynthesis', 'Stunted growth'],
          organicControl: 'Neem oil spray @ 5ml/liter',
          chemicalControl: 'Propiconazole 25% EC @ 1ml/liter'
        },
        {
          name: language === 'mr' ? 'पाली' : language === 'hi' ? 'गेहूं का गलन रोग' : 'Karnal Bunt',
          description: 'Seed-borne fungal disease',
          symptoms: ['Blackened grains', 'Fishy odor', 'Reduced yield'],
          organicControl: 'Seed treatment with Trichoderma',
          chemicalControl: 'Carbendazim 50% WP @ 2g/kg seed'
        }
      ],
      stages: [
        { name: language === 'mr' ? 'बीजोत्पादन' : language === 'hi' ? 'अंकुरण' : 'Germination', duration: '7-10 days', description: 'Seed sprouts and roots emerge', care: ['Maintain soil moisture', 'Protect from birds'] },
        { name: language === 'mr' ? 'रोपटी' : language === 'hi' ? 'रोपण' : 'Seedling', duration: '20-25 days', description: 'First leaves appear', care: ['Light irrigation', 'Weed control'] },
        { name: language === 'mr' ? 'कलमीकरण' : language === 'hi' ? 'क्राउनिंग' : 'Tillering', duration: '30-40 days', description: 'Multiple stems develop', care: ['Nitrogen fertilizer', 'Adequate water'] },
        { name: language === 'mr' ? 'पातळीकरण' : language === 'hi' ? 'बूटिंग' : 'Booting', duration: '15-20 days', description: 'Grain head develops', care: ['Critical water stage', 'Pest monitoring'] },
        { name: language === 'mr' ? 'दाणे भरणे' : language === 'hi' ? 'दाना भरना' : 'Grain Filling', duration: '30-35 days', description: 'Grains develop and mature', care: ['Reduce irrigation', 'Disease control'] }
      ],
      suitableStates: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'],
      bestSeason: 'Rabi (Nov-Dec)',
      waterRequirement: '450-650 mm',
      marketDemand: 'High'
    },
    'rice': {
      name: language === 'mr' ? 'तांदूळ' : language === 'hi' ? 'चावल' : 'Rice',
      scientificName: 'Oryza sativa',
      description: language === 'mr'
        ? 'तांदूळ हे भारतातील सर्वात महत्त्वाचे खाद्यपीक आहे. हे पीक पाण्याच्या भरपूर प्रमाणात वाढते.'
        : language === 'hi'
        ? 'चावल भारत की सबसे महत्वपूर्ण खाद्य फसल है। यह फसल भरपूर पानी में उगती है।'
        : 'Rice is India\'s most important food crop. It grows abundantly in water-rich conditions.',
      category: 'cereal',
      soilType: language === 'mr' ? 'जलमग्न कादंबरी माती' : language === 'hi' ? 'चिकनी मिट्टी जो पानी रोक सके' : 'Clay loam that retains water',
      soilPH: '5.5 - 6.5',
      sowingDepth: '2-3 cm',
      spacing: '15 cm x 15 cm',
      waterFrequency: language === 'mr' ? 'नेहमी पाणी भरलेले ठेवा' : language === 'hi' ? 'हमेशा पानी बनाए रखें' : 'Keep continuously flooded',
      sunlight: language === 'mr' ? 'पूर्ण सूर्यप्रकाश' : language === 'hi' ? 'पूर्ण धूप' : 'Full sun',
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
          name: language === 'mr' ? 'तना भकुडी' : language === 'hi' ? 'तना छेदक' : 'Stem Borer',
          description: 'Larvae bore into stems',
          symptoms: ['Dead hearts', 'Empty panicles', 'Bored stems'],
          organicControl: 'Pheromone traps @ 10/ha',
          chemicalControl: 'Chlorpyriphos 20% EC @ 2.5ml/liter'
        },
        {
          name: language === 'mr' ? 'पान फडकी' : language === 'hi' ? 'पत्ती फोल्डर' : 'Leaf Folder',
          description: 'Larvae fold leaves and feed inside',
          symptoms: ['Folded leaves', 'White patches', 'Reduced yield'],
          organicControl: 'Release Trichogramma @ 5 cards/ha',
          chemicalControl: 'Cartap Hydrochloride 4% G @ 25 kg/ha'
        }
      ],
      stages: [
        { name: language === 'mr' ? 'बीजोत्पादन' : language === 'hi' ? 'अंकुरण' : 'Germination', duration: '5-10 days', description: 'Seed sprouts in nursery', care: ['Maintain water level', 'Protect from pests'] },
        { name: language === 'mr' ? 'रोपण' : language === 'hi' ? 'रोपाई' : 'Transplanting', duration: '20-30 days', description: 'Seedlings moved to field', care: ['Proper spacing', 'Adequate water'] },
        { name: language === 'mr' ? 'कलमीकरण' : language === 'hi' ? 'टिलरिंग' : 'Tillering', duration: '30-40 days', description: 'Multiple shoots develop', care: ['Nitrogen application', 'Weed control'] },
        { name: language === 'mr' ? 'पुष्पन' : language === 'hi' ? 'फूल आना' : 'Flowering', duration: '20-25 days', description: 'Panicle emergence', care: ['Maintain water', 'Disease spray'] },
        { name: language === 'mr' ? 'दाणे भरणे' : language === 'hi' ? 'दाना भरना' : 'Grain Filling', duration: '30-40 days', description: 'Grains mature', care: ['Drain water before harvest', 'Bird control'] }
      ],
      suitableStates: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Andhra Pradesh', 'Tamil Nadu'],
      bestSeason: 'Kharif (Jun-Jul)',
      waterRequirement: '1500-2500 mm',
      marketDemand: 'Very High'
    },
    'cotton': {
      name: language === 'mr' ? 'कापूस' : language === 'hi' ? 'कपास' : 'Cotton',
      scientificName: 'Gossypium hirsutum',
      description: language === 'mr'
        ? 'कापूस हे भारतातील एक प्रमुख नगदी पीक आहे. हे पीक उष्ण हवामानात चांगले वाढते.'
        : language === 'hi'
        ? 'कपास भारत की एक प्रमुख नकदी फसल है। यह गर्म जलवायु में अच्छी तरह उगती है।'
        : 'Cotton is a major cash crop in India. It thrives in warm climates.',
      category: 'fiber',
      soilType: language === 'mr' ? 'काळी जमीन किंवा दोमट माती' : language === 'hi' ? 'काली मिट्टी या दोमट मिट्टी' : 'Black soil or loamy soil',
      soilPH: '6.5 - 7.5',
      sowingDepth: '2.5-4 cm',
      spacing: '75-90 cm x 15-30 cm',
      waterFrequency: language === 'mr' ? '8-12 दिवसांनी' : language === 'hi' ? '8-12 दिनों में' : 'Every 8-12 days',
      sunlight: language === 'mr' ? 'पूर्ण सूर्यप्रकाश (10-12 तास)' : language === 'hi' ? 'पूर्ण धूप (10-12 घंटे)' : 'Full sun (10-12 hours)',
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
          name: language === 'mr' ? 'पांढरी माशी' : language === 'hi' ? 'सफेद मक्खी' : 'Whitefly',
          description: 'Sap-sucking insect, virus vector',
          symptoms: ['Yellowing leaves', 'Sooty mold', 'Curling leaves'],
          organicControl: 'Yellow sticky traps @ 10/ha',
          chemicalControl: 'Imidacloprid 17.8% SL @ 0.3ml/liter'
        },
        {
          name: language === 'mr' ? 'गुलाबी बोंडअळी' : language === 'hi' ? 'गुलाबी सुंडी' : 'Pink Bollworm',
          description: 'Larvae damage cotton bolls',
          symptoms: ['Damaged bolls', 'Premature opening', 'Lint damage'],
          organicControl: 'Pheromone traps @ 15/ha',
          chemicalControl: 'Spinosad 45% SC @ 0.2ml/liter'
        }
      ],
      stages: [
        { name: language === 'mr' ? 'बीजोत्पादन' : language === 'hi' ? 'अंकुरण' : 'Germination', duration: '5-10 days', description: 'Seeds sprout', care: ['Light irrigation', 'Weed control'] },
        { name: language === 'mr' ? 'रोपटी' : language === 'hi' ? 'सीडलिंग' : 'Seedling', duration: '25-35 days', description: 'True leaves develop', care: ['Thinning', 'First irrigation'] },
        { name: language === 'mr' ? 'वाढ' : language === 'hi' ? 'वgetative' : 'Vegetative', duration: '40-50 days', description: 'Rapid plant growth', care: ['Fertilizer top-dress', 'Pest control'] },
        { name: language === 'mr' ? 'फुलोरा' : language === 'hi' ? 'फूल आना' : 'Flowering', duration: '50-60 days', description: 'Flowers and bolls form', care: ['Regular irrigation', 'Bollworm monitoring'] },
        { name: language === 'mr' ? 'बोंडे भरणे' : language === 'hi' ? 'बोल भरना' : 'Boll Development', duration: '40-50 days', description: 'Bolls mature', care: ['Reduce irrigation', 'Defoliation if needed'] }
      ],
      suitableStates: ['Maharashtra', 'Gujarat', 'Telangana', 'Andhra Pradesh', 'Punjab'],
      bestSeason: 'Kharif (May-Jun)',
      waterRequirement: '700-1300 mm',
      marketDemand: 'High'
    }
  };

  const popularCrops = ['wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'soybean', 'groundnut', 'mustard', 'gram', 'tur'];

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    
    // Simulate AI search with delay
    setTimeout(() => {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchedCrop = Object.keys(cropDatabase).find(crop => 
        crop.includes(normalizedQuery) ||
        cropDatabase[crop].name.toLowerCase().includes(normalizedQuery) ||
        cropDatabase[crop].scientificName.toLowerCase().includes(normalizedQuery)
      );
      
      if (matchedCrop) {
        onCropFound(cropDatabase[matchedCrop]);
      }
      
      // Update suggestions
      const newSuggestions = popularCrops.filter(crop => 
        crop.includes(normalizedQuery) && crop !== normalizedQuery
      ).slice(0, 5);
      setSuggestions(newSuggestions);
      
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* AI Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Sparkles className="h-5 w-5 text-emerald-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) {
              handleSearch(e.target.value);
            }
          }}
          placeholder={language === 'mr' ? 'पीक शोधा (उदा. गहू, तांदूळ, कापूस)...' : language === 'hi' ? 'फसल खोजें (जैसे गेहूं, चावल, कपास)...' : 'Search any crop (e.g., wheat, rice, cotton)...'}
          className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:bg-slate-800 dark:text-white shadow-lg"
        />
        <div className="absolute inset-y-0 right-4 flex items-center">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

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
