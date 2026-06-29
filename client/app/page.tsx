'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import {
  Leaf, ShoppingBag, ArrowRight, CheckCircle, MessageSquare, CloudSun,
  X, BarChart3, Bot, Compass, FileText, Send, Check, Shield, User,
  TrendingUp, Camera, HelpCircle, Activity, Globe, Info, Wheat, Sprout, Sun,
  Sliders, Plus, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

/* ─── Floating Particle System ────────────────────────────────────────── */
interface FloatingParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  type: 'wheat' | 'leaf' | 'dot';
}

const FloatingParticles = () => {
  const particles = useMemo<FloatingParticle[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 8,
      size: 12 + Math.random() * 12,
      opacity: 0.08 + Math.random() * 0.1,
      type: (['wheat', 'leaf', 'dot'] as const)[i % 3],
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-emerald-500/20 dark:text-emerald-400/15"
          style={{ left: `${p.x}%`, bottom: '-30px' }}
          animate={{
            y: [0, -900],
            rotate: [0, p.type === 'dot' ? 0 : 360],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {p.type === 'wheat' ? (
            <Wheat style={{ width: p.size, height: p.size }} />
          ) : p.type === 'leaf' ? (
            <Leaf style={{ width: p.size * 0.85, height: p.size * 0.85 }} />
          ) : (
            <div
              className="rounded-full bg-emerald-400/30 dark:bg-emerald-500/20"
              style={{ width: p.size * 0.35, height: p.size * 0.35 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

/* ─── Animated Stat Counter ───────────────────────────────────────────── */
const AnimatedStatCounter = ({ value, label }: { value: string; label: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const el = ref.current;
          if (!el) return;

          const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
          if (!match) { el.textContent = value; return; }

          const [, prefix, numStr, suffix] = match;
          const target = parseFloat(numStr.replace(/,/g, ''));
          const hasComma = numStr.includes(',');
          const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;

          let start = 0;
          const duration = 1500;
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = target * eased;

            let formatted = decimals > 0 ? start.toFixed(decimals) : Math.round(start).toString();
            if (hasComma) {
              const parts = formatted.split('.');
              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              formatted = parts.join('.');
            }

            el.textContent = `${prefix}${formatted}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div>
      <p ref={ref} className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
        0
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
        {label}
      </p>
    </div>
  );
};

/* ─── Interactive Tilt Card ───────────────────────────────────────────── */
const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    rotateX.set((y - centerY) / centerY * -5);
    rotateY.set((x - centerX) / centerX * 5);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Scroll-triggered Section Reveal ─────────────────────────────────── */
const ScrollReveal = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 35 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, delay, ease: [0.215, 0.61, 0.355, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] } },
};

// Features mapping
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
      desc: 'Secure buyer matches for farm output, propose prices, and lock binding contracts directly.',
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
      desc: 'Get highly accurate farm-level weather updates to forecast harvesting and crop delivery logistics.',
      icon: CloudSun,
      badge: 'Micro-Alerts',
    },
  ],
  buyer: [
    {
      title: 'Direct Farm Sourcing',
      desc: 'Skip intermediaries and source bulk agricultural crops directly from authenticated local growers.',
      icon: ShoppingBag,
      badge: 'Verified Sellers',
    },
    {
      title: 'Supply Chain Analytics',
      desc: 'Monitor crop quality grades, moisture parameters, and logistics delivery timelines in one dashboard.',
      icon: BarChart3,
      badge: 'Enterprise Insights',
    },
    {
      title: 'Geographic Map Explorer',
      desc: 'Map seller locations and optimize pickup routes to minimize transport costs and crop freshness spoilage.',
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

// Mock Mandi Dataset
const MOCK_MANDI_ITEMS = [
  { commodity: 'Wheat', state: 'Punjab', market: 'Khanna', rate: '₹2,275 / Qtl', status: 'Stable' },
  { commodity: 'Wheat', state: 'Haryana', market: 'Karnal', rate: '₹2,310 / Qtl', status: 'Up' },
  { commodity: 'Mirchi (Chili - Teja)', state: 'Maharashtra', market: 'Kolhapur', rate: '₹140.00 / kg', status: 'Up' },
  { commodity: 'Methi (Fenugreek)', state: 'Maharashtra', market: 'Pune', rate: '₹42.00 / kg', status: 'Down' },
  { commodity: 'Potato', state: 'Gujarat', market: 'Deesa', rate: '₹1,450 / Qtl', status: 'Up' },
  { commodity: 'Potato', state: 'Uttar Pradesh', market: 'Agra', rate: '₹1,280 / Qtl', status: 'Stable' },
];

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

  // Core Service Simulator State
  const [activeService, setActiveService] = useState<'crop' | 'mandi' | 'contract' | 'ledger'>('crop');
  
  // Crop Scanner Mock State
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  // Mandi Mock State
  const [mandiFilter, setMandiFilter] = useState<'all' | 'Chili' | 'Wheat' | 'Potato' | 'Methi'>('all');

  // B2B Contract Simulator State
  const [moistureVal, setMoistureVal] = useState(6.5);
  const [impurityVal, setImpurityVal] = useState(8.5);
  const [contractVolume, setContractVolume] = useState(500); // Kgs
  const [negotiationStep, setNegotiationStep] = useState<'proposed' | 'accepted' | 'finalized'>('proposed');

  // Scroll dynamics
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);
  const orbY1 = useTransform(scrollY, [0, 800], [0, -100]);
  const orbY2 = useTransform(scrollY, [0, 800], [0, -60]);

  // Precision crop price calculation (MERN global rule compatibility)
  const simulatedRate = useMemo(() => {
    // Base price ₹120/kg, subtract moisture impact and impurity impact
    const calculated = 120 - (moistureVal * 1.80) - (impurityVal * 2.50);
    return parseFloat(calculated.toFixed(2));
  }, [moistureVal, impurityVal]);

  const contractTotal = useMemo(() => {
    return parseFloat((simulatedRate * contractVolume).toFixed(2));
  }, [simulatedRate, contractVolume]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Run crop diagnosis simulator
  const handleStartScan = () => {
    setScanStatus('scanning');
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanStatus('done');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleResetScan = () => {
    setScanStatus('idle');
    setScanProgress(0);
  };

  const handleSendMessage = (text: string, customKey?: string) => {
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setUserInput('');

    setTimeout(() => {
      let botAnswer = "I am here to help! Try clicking one of the quick questions below to learn more about AgriVision Pro.";
      const lower = text.toLowerCase();

      const cropRes = "Our AI Crop Diagnostics allows you to upload a leaf photograph. The neural network detects pathogens instantly, recommends organic/chemical treatments, and connects you to field agronomists.";
      const mandiRes = "We sync directly with national mandi rate endpoints. You can search by commodity, taluka, and state to query daily rates and view moving average trends.";
      const contractRes = "The B2B Marketplace allows sellers to list agricultural crop lines, specify moisture and quality specifications, propose rates, sign digital contracts, and configure pickup tracking.";
      const adminRes = "The Master Admin dashboard provides platforms controls, database log feeds, multi-tenant parameters editing, and warning alert broadcast toolsets.";

      if (customKey === 'crop' || lower.includes('crop') || lower.includes('disease')) {
        botAnswer = cropRes;
      } else if (customKey === 'mandi' || lower.includes('mandi') || lower.includes('price')) {
        botAnswer = mandiRes;
      } else if (customKey === 'marketplace' || lower.includes('market') || lower.includes('contract')) {
        botAnswer = contractRes;
      } else if (customKey === 'admin' || lower.includes('admin') || lower.includes('system')) {
        botAnswer = adminRes;
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: botAnswer }]);
    }, 500);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative font-sans overflow-x-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <motion.div
        style={{ y: orbY1 }}
        className="absolute top-10 left-[10%] w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none"
      />
      <motion.div
        style={{ y: orbY2 }}
        className="absolute top-[30%] right-[10%] w-[450px] h-[450px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none"
      />

      <FloatingParticles />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/70 transition-all">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo (Restored Leaf design, with interactive hover rotate effect) */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md transition-shadow group-hover:shadow-emerald-500/20"
            >
              <Leaf className="h-5 w-5 text-white" />
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              AgriVision <span className="text-emerald-600 dark:text-emerald-400">Pro</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-350">
            <a href="#services-preview" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Services</a>
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#ad-banner" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Platform Impact</a>
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
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent animate-gradient-shift">
                Modern Agriculture
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Empowering agricultural growers and commercial buyers with real-time mandi prices, instant crop health diagnostics via computer vision, secure contract negotiations, and seamless B2B marketplace trading.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => router.push('/auth/login')}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98]"
              >
                Start Sourcing Crops
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
              <AnimatedStatCounter value="12,000+" label="Farmers Onboard" />
              <AnimatedStatCounter value="4,800+" label="AI Crop Scans" />
              <AnimatedStatCounter value="₹2.1M+" label="Weekly Trades" />
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
                    <div className="h-3 w-3 rounded-full bg-red-400 animate-pulse" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Market Monitor</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">KG</div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold">Kolhapur Veg Mandi</h4>
                        <p className="text-[10px] text-slate-400">Mirchi (Grade A)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">₹142.50 / kg</p>
                      <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-bold">+1.2%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs">PN</div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold">Pune Mandi</h4>
                        <p className="text-[10px] text-slate-400">Tomato (Grade A)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">₹2,400 / Qtl</p>
                      <span className="text-[8px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1 py-0.5 rounded font-bold">-0.8%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-indigo-200/50 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/20 text-left">
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

      {/* ── Trust Band (scrolling logos) ────────────────────────────────── */}
      <ScrollReveal>
        <div className="border-y border-slate-200/60 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm py-5 overflow-hidden">
          <div className="flex items-center justify-center gap-8 flex-wrap px-4 max-w-5xl mx-auto">
            {[
              { icon: Shield, label: 'End-to-End Encrypted' },
              { icon: Wheat, label: 'Agriculture-First Design' },
              { icon: Globe, label: 'Multi-Region Support' },
              { icon: Activity, label: 'Real-Time Analytics' },
              { icon: Bot, label: 'AI-Powered Insights' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 text-slate-400 dark:text-slate-500"
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ── NEW: Core Services Simulator Showcase Section ────────────────── */}
      <section id="services-preview" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ScrollReveal className="space-y-3 mb-10">
          <div className="flex justify-center mb-2">
            <div className="h-1.5 w-16 bg-emerald-500 rounded-full" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore Core Platform Services
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm">
            Click on any module below to test how our live computer vision, mandi index charts, and B2B pricing negotiation contract engines calculate and operate in real-time.
          </p>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-12 items-start mt-8">
          
          {/* Services selector tabs */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {[
              {
                id: 'crop',
                title: 'AI Crop Diagnostics',
                description: 'Detect pathogens via computer leaf scans and receive instant organic recipes.',
                icon: Camera,
                color: 'emerald'
              },
              {
                id: 'mandi',
                title: 'Live Mandi Price Feed',
                description: 'Browse market arrivals synced dynamically with Indian state agriculture records.',
                icon: TrendingUp,
                color: 'teal'
              },
              {
                id: 'contract',
                title: 'B2B Contract Negotiator',
                description: 'Calculate crop prices based on moisture levels and impurity parameters.',
                icon: Sliders,
                color: 'indigo'
              },
              {
                id: 'ledger',
                title: 'Digital Invoicing Ledger',
                description: 'Record trades with audit timestamps, ledger lists, and financial statistics.',
                icon: FileSpreadsheet,
                color: 'amber'
              }
            ].map((srv) => {
              const Icon = srv.icon;
              const isSelected = activeService === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => setActiveService(srv.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 shadow-lg border-emerald-500 dark:border-emerald-400/60 ring-2 ring-emerald-500/10'
                      : 'bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{srv.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{srv.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Simulator */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 shadow-xl backdrop-blur relative overflow-hidden min-h-[380px] flex flex-col justify-between">
              
              {/* Simulator Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 text-xs font-bold text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE SERVICE MOCKUP DIALOG</span>
                </div>
                <span>AGRIVISION PROTOCOL V2.4</span>
              </div>

              {/* Live Preview Modes */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {/* AI Crop scan interface */}
                  {activeService === 'crop' && (
                    <motion.div
                      key="crop"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4 py-2"
                    >
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 relative overflow-hidden min-h-[220px]">
                        {scanStatus === 'idle' && (
                          <div className="space-y-3 text-center">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                              <Camera className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Simulate Crop Leaf Analysis</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Click standard scan to trigger diagnostic scan algorithms</p>
                            </div>
                            <button
                              onClick={handleStartScan}
                              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow shadow-emerald-600/20"
                            >
                              Run Diagnostics Scan
                            </button>
                          </div>
                        )}

                        {scanStatus === 'scanning' && (
                          <div className="space-y-4 w-full max-w-xs text-center">
                            <div className="relative h-24 w-24 mx-auto rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                              <Leaf className="h-10 w-10 text-emerald-600/35" />
                              <motion.div
                                className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-md shadow-emerald-400"
                                animate={{ top: ['0%', '98%', '0%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Scanning leaf metrics...</p>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${scanProgress}%` }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {scanStatus === 'done' && (
                          <div className="space-y-3 w-full text-left max-w-md">
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20 flex gap-3 items-start">
                              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Pathogen Diagnostic Complete</h4>
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Identified: <span className="font-bold">Late Blight (Phytophthora infestans)</span></p>
                                <p className="text-[10px] text-slate-500 mt-1">Confidence rating: <span className="font-bold text-slate-700 dark:text-slate-350">97.82% accuracy</span></p>
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 dark:border-amber-900/20 dark:bg-amber-950/10 text-xs">
                              <p className="font-bold text-amber-800 dark:text-amber-300">Recommended Treatment:</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                                <li>Organic: Neem oil extract spray + copper-based biological sprays</li>
                                <li>Cure: Prune heavily infected low branches to maximize leaf aeration</li>
                              </ul>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={handleResetScan}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" /> Scan another leaf
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Mandi pricing list interface */}
                  {activeService === 'mandi' && (
                    <motion.div
                      key="mandi"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4 text-left"
                    >
                      <div className="flex gap-1.5 flex-wrap">
                        {(['all', 'Chili', 'Wheat', 'Potato', 'Methi'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setMandiFilter(filter)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              mandiFilter === filter
                                ? 'bg-emerald-600 text-white shadow'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {filter === 'all' ? '🔍 All Mandis' : filter}
                          </button>
                        ))}
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                        <table className="w-full text-[11px] text-slate-600 dark:text-slate-400">
                          <thead className="bg-slate-50 dark:bg-slate-900 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-2.5 text-left">Commodity</th>
                              <th className="p-2.5 text-left">Market</th>
                              <th className="p-2.5 text-right">Daily Rate</th>
                              <th className="p-2.5 text-center">Trend</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MOCK_MANDI_ITEMS
                              .filter((item) => mandiFilter === 'all' || item.commodity.includes(mandiFilter))
                              .map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                  <td className="p-2.5 font-semibold text-slate-850 dark:text-slate-300">{row.commodity}</td>
                                  <td className="p-2.5 text-slate-500">{row.market} ({row.state})</td>
                                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{row.rate}</td>
                                  <td className="p-2.5 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                      row.status === 'Up'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                        : row.status === 'Down'
                                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {/* B2B Contract Rate calculator */}
                  {activeService === 'contract' && (
                    <motion.div
                      key="contract"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4 text-left"
                    >
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Moisture Level: {moistureVal.toFixed(1)}%</label>
                          <input
                            type="range"
                            min="4.0"
                            max="9.0"
                            step="0.1"
                            value={moistureVal}
                            onChange={(e) => setMoistureVal(parseFloat(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                          <p className="text-[9px] text-slate-400">Affects pricing directly (standard crop moisture quality index)</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Impurity Level: {impurityVal.toFixed(1)}%</label>
                          <input
                            type="range"
                            min="8.0"
                            max="10.0"
                            step="0.1"
                            value={impurityVal}
                            onChange={(e) => setImpurityVal(parseFloat(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                          <p className="text-[9px] text-slate-400">Impurity levels and foreign matter parameter checks</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Simulated Rate / kg</p>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{simulatedRate.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Trade Volume</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="number"
                              value={contractVolume}
                              onChange={(e) => setContractVolume(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-16 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400">Kgs</span>
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                          <p className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Estimated Contract Sum</p>
                          <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">₹{contractTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 dark:border-indigo-900/30 dark:bg-indigo-950/20 text-xs">
                        <div>
                          <p className="font-bold text-indigo-900 dark:text-indigo-300">B2B Contract Negotiation Simulator</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Change sliders to see the precision rate recalculate instantly.</p>
                        </div>
                        {negotiationStep === 'proposed' ? (
                          <button
                            onClick={() => {
                              setNegotiationStep('accepted');
                              toast.success('Simulated Proposal Rate Sent!');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-750 transition-all text-[10px]"
                          >
                            Propose Rate
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded">✓ Rate Accepted</span>
                            <button
                              onClick={() => setNegotiationStep('proposed')}
                              className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Digital ledger / statistics transaction feed */}
                  {activeService === 'ledger' && (
                    <motion.div
                      key="ledger"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4 text-left"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        
                        {/* Transaction history list */}
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Simulated Trade Invoices</h4>
                          {[
                            { tid: 'TR-8942-A', desc: '500 kg Mirchi (Nashik)', sum: '₹23,900.00', date: '27 June', audit: true },
                            { tid: 'TR-7612-C', desc: '1,200 kg Methi (Pune)', sum: '₹42,480.00', date: '25 June', audit: true },
                            { tid: 'TR-3410-X', desc: '15 Qtl Potato (Agra)', sum: '₹19,200.00', date: '21 June', audit: false }
                          ].map((t, index) => (
                            <div key={index} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-emerald-300 dark:hover:border-emerald-700/30 transition-all">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-350">{t.tid}</span>
                                  {t.audit && <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-400 font-bold px-1 rounded uppercase">AUDITED</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">{t.desc} • {t.date}</p>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white">{t.sum}</span>
                            </div>
                          ))}
                        </div>

                        {/* Financial Mini Analytics */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Simulated Net Revenue Margin</h4>
                            <div className="space-y-2 mt-1">
                              <div>
                                <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                                  <span>Total Farmer Earnings</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">₹85,580.00</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                                  <span>Logistic Transport Cost</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">₹12,400.00</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 leading-relaxed font-semibold">
                            ⚠️ Platform audit logs statement: [AUDIT] trade invoices locked on transaction triggers securely using precision floating-point storage logic.
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>
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
                  <p>Farmers agree to post accurate crop photos and yield listings. Buyers agree to respect locked contract pricing. Master Administrators hold global permission to configure parameters and audit transactions.</p>
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
                  <div className="text-left">
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
                          : 'bg-white border border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 rounded-tl-none text-left'
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
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-700 transition-all border border-emerald-500/20"
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
