'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, ShoppingBag, ArrowRight, CheckCircle, MessageSquare, CloudSun,
  X, BarChart3, Bot, Compass, FileText, Send, Check, Shield, User,
  TrendingUp, Camera, HelpCircle, Activity, Globe, Info
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

// Mock bot conversation rules
const BOT_RESPONSES: Record<string, string> = {
  default: "I'm here to help! Try clicking one of the quick questions below to learn more about AgriVision Pro.",
  crop: "Our AI Crop Diagnostics allows you to take or upload a photo of a leaf. The AI detects diseases instantly, details the pathogen, recommends organic and chemical treatments, and links you to agronomy experts.",
  mandi: "AgriVision connects directly to official Indian mandi price APIs. You can search and filter by state, district, and commodity to get real-time price reports and price trend charts to optimize your sales.",
  marketplace: "The B2B Marketplace allows dairy farmers and commercial buyers to list milk supplies, enter negotiations, lock pricing contracts, and coordinate secure supply shipments with built-in route tracking.",
  admin: "The Master Admin dashboard provides platform operators with system logs, database health monitoring, user account control (CRUD), and notification broadcasting tools to manage the ecosystem.",
};

const LANDING_FEATURES = {
  farmer: [
    {
      title: 'Real-time Mandi Prices',
      desc: 'Track mandi arrival and commodity rates across India. Filter by division, state, and taluka to negotiate better.',
      icon: TrendingUp,
      badge: 'API-Synced',
    },
    {
      title: 'AI Crop Health Scan',
      desc: 'Upload crop photos to detect disease pathogens instantly and receive expert treatment plans.',
      icon: Camera,
      badge: 'Computer Vision',
    },
    {
      title: 'B2B Contract Negotiation',
      desc: 'Secure buyer matches for dairy output, propose prices, and lock bindings contracts directly.',
      icon: CheckCircle,
      badge: 'Secure Trade',
    },
    {
      title: 'WhatsApp-Style Coordination',
      desc: 'Chat with buyers instantly. Share voice notes, supply documents, and quality reports inside the app.',
      icon: MessageSquare,
      badge: 'Rich Chat',
    },
    {
      title: 'Localized Weather Planning',
      desc: 'Get highly accurate farm-level weather updates to forecast harvesting and milk delivery logistics.',
      icon: CloudSun,
      badge: 'Micro-Alerts',
    },
  ],
  buyer: [
    {
      title: 'Direct Farm Sourcing',
      desc: 'Skip intermediaries and source bulk dairy and crops directly from authenticated local farmers.',
      icon: ShoppingBag,
      badge: 'Verified Sellers',
    },
    {
      title: 'Supply Chain Analytics',
      desc: 'Monitor milk fat percentages, SNF quality levels, and logistics delivery timelines in one dashboard.',
      icon: BarChart3,
      badge: 'Enterprise Insights',
    },
    {
      title: 'Geographic Map Explorer',
      desc: 'Map seller locations and optimize pickup routes to minimize transport costs and milk spoilage.',
      icon: Globe,
      badge: 'GPS Routing',
    },
    {
      title: 'Automated Billing & Ledger',
      desc: 'Generate digital invoice ledgers on contract execution, with automated quality audits.',
      icon: FileText,
      badge: 'Automated Accounting',
    },
  ]
};

export default function LandingHomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'farmer' | 'buyer'>('farmer');
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: 'Hello! I am AgriBot. How can I help you explore AgriVision Pro today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = (text: string, customKey?: string) => {
    if (!text.trim()) return;

    // Add user message
    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setUserInput('');

    // Simulate bot thinking
    setTimeout(() => {
      let botAnswer = BOT_RESPONSES.default;
      const lower = text.toLowerCase();

      if (customKey && BOT_RESPONSES[customKey]) {
        botAnswer = BOT_RESPONSES[customKey];
      } else if (lower.includes('crop') || lower.includes('disease') || lower.includes('health')) {
        botAnswer = BOT_RESPONSES.crop;
      } else if (lower.includes('price') || lower.includes('mandi') || lower.includes('market')) {
        botAnswer = BOT_RESPONSES.mandi;
      } else if (lower.includes('marketplace') || lower.includes('negotiat') || lower.includes('milk')) {
        botAnswer = BOT_RESPONSES.marketplace;
      } else if (lower.includes('admin') || lower.includes('system') || lower.includes('master')) {
        botAnswer = BOT_RESPONSES.admin;
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: botAnswer }]);
    }, 600);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative font-sans">
      {/* Grid background decorative accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/70 transition-all">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              AgriVision <span className="text-emerald-600 dark:text-emerald-400">Pro</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-350">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#ad-banner" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Impact</a>
            <a
              href="/terms"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Terms of Service
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98]"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('agrivision_tab_focus', 'register');
                    router.push('/auth/login');
                  }}
                  className="rounded-xl bg-emerald-600 px-4.5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24 relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
              <Compass className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Multi-Tenant Agricultural SaaS
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl leading-[1.1]">
              The Smart AI Ecosystem for <br />
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent">
                Modern Agriculture
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Empowering dairy farmers and commercial buyers with real-time mandi prices, instant crop health diagnostics via computer vision, secure contract negotiations, and seamless B2B marketplace trading.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => router.push('/auth/login')}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98]"
              >
                Start Trading Today
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur px-6 py-3.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <Bot className="h-4.5 w-4.5 text-emerald-500" />
                Ask AgriBot Assistant
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/40">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">12,000+</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">Farmers Onboard</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">4.8K+</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">AI Crop Scans</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">₹2.1M+</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">Weekly Trades</p>
              </div>
            </div>
          </div>

          {/* Right side graphic mockup */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-3 shadow-2xl relative overflow-hidden"
            >
              {/* Inner card mockup */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-inner">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/50 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Market Monitor</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">KG</div>
                      <div>
                        <h4 className="text-xs font-bold">Kolhapur Milk Mandi</h4>
                        <p className="text-[10px] text-slate-400">Buffalo Milk (Fat 6.5%)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">₹48.50 / L</p>
                      <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-bold">+1.2%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs">PN</div>
                      <div>
                        <h4 className="text-xs font-bold">Pune Mandi</h4>
                        <p className="text-[10px] text-slate-400">Tomato (Grade A)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">₹2,400 / Qtl</p>
                      <span className="text-[8px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1 py-0.5 rounded font-bold">-0.8%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-indigo-200/50 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Bot className="h-4 w-4 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">AI Crop Alert</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      Pathogen identified: <span className="font-bold text-indigo-600 dark:text-indigo-400">Early Blight</span> (94% confidence). Recommended treatment: Copper-based fungicide.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Showcase Tab Module ────────────────────────────────── */}
      <section id="features" className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Everything You Need to Scale Trades</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm">
              AgriVision Pro provides specialized systems mapped to both farmers and commodity buyers.
            </p>

            <div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/50 mt-4">
              <button
                onClick={() => setActiveTab('farmer')}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'farmer'
                    ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                For Farmers
              </button>
              <button
                onClick={() => setActiveTab('buyer')}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'buyer'
                    ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                For Buyers
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {LANDING_FEATURES[activeTab].map((f) => {
                const IconComp = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-slate-200/70 bg-white p-5 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-950 transition-all flex flex-col justify-between text-left group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500">
                          {f.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">{f.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Advertisement Banner Section ────────────────────────────────── */}
      <section id="ad-banner" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-950 p-8 sm:p-12 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_30px] pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
          
          <div className="relative max-w-2xl text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 border border-indigo-500/30">
              <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Enterprise Platform</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Looking for System Configurations & Platform Audit Logs?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed font-medium">
              AgriVision Pro includes a robust **Master Admin Portal** enabling complete control of system configurations, user validation management (CRUD), real-time logs inspection, feedback processing, and platform-wide push announcements.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('agrivision_tab_focus', 'login');
                  router.push('/auth/login');
                  setTimeout(() => {
                    toast.message('Admin Mode', {
                      description: 'Use the "System Administrator Access" link at the bottom of the card.',
                    });
                  }, 300);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
              >
                Access Admin Portal
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-950 transition-colors py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex justify-center items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">AgriVision Pro</span>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
            Cultivating next-generation technology pipelines to empower growers, dairies, and traders. Built with precision, security, and multi-tenant isolation.
          </p>

          <div className="flex justify-center gap-6 text-xs text-slate-500">
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <a href="/terms" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Documentation</a>
            <a href="#" className="hover:underline">API Support</a>
          </div>

          <p className="text-[10px] text-slate-400">&copy; {new Date().getFullYear()} AgriVision Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* ── Terms & Conditions Slide-up Modal ────────────────────────────── */}
      <AnimatePresence>
        {isTermsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-4 top-10 bottom-10 md:inset-x-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[80vh] text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Terms of Service</h3>
                </div>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-400 pr-1 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Acceptance of Terms</h4>
                  <p>By registering or using the AgriVision Pro application, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not access the platform.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. User Role Commitments</h4>
                  <p>Farmers agree to post accurate crop photos and milk yield listings. Buyers agree to respect locked contract pricing. Master Administrators hold global permission to configure parameters and audit transactions.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Privacy and Data Security</h4>
                  <p>We process geolocation data to map logistics routes and crop analyses to optimize mandi distribution. Your details are secured under strict industry-standard multi-tenant isolation patterns.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">4. Payment Policy & Transaction Fees</h4>
                  <p>All platform commissions, transaction terms, and rate limits are managed dynamically by Master Administrators. Any violation of contract locking results in temporary profile deactivation.</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  Close & Accept
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating Interactive AI Chatbot Widget (AgriBot) ───────────── */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        {/* Chat window */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col h-[400px] text-left"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-none">AgriBot</h3>
                    <p className="text-[9px] text-emerald-100 mt-0.5 leading-none">AI Support Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="rounded-lg p-1 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/20">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Action Suggestion Tags */}
              <div className="p-2 border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 flex flex-wrap gap-1.5">
                {[
                  { tag: 'AI Crop Check', key: 'crop' },
                  { tag: 'Mandi Prices', key: 'mandi' },
                  { tag: 'B2B Marketplace', key: 'marketplace' },
                  { tag: 'Master Admin Access', key: 'admin' },
                ].map(({ tag, key }) => (
                  <button
                    key={tag}
                    onClick={() => handleSendMessage(tag, key)}
                    className="text-[10px] font-semibold bg-white border border-slate-200 rounded-full px-2.5 py-1 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <div className="p-3 border-t border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(userInput);
                  }}
                  placeholder="Ask a question about AgriVision…"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  onClick={() => handleSendMessage(userInput)}
                  disabled={!userInput.trim()}
                  className="rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Bubble */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-700 transition-all border border-emerald-500/20"
        >
          {isChatOpen ? (
            <X className="h-5.5 w-5.5" />
          ) : (
            <MessageSquare className="h-5.5 w-5.5" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
