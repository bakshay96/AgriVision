'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Camera, Handshake, MessageCircle, CloudSun, ShoppingBag,
  BarChart3, Map, Truck, Shield, Users, Send, Sliders, DollarSign,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';
import { useLoader } from '@/hooks/useLoader';

interface FormMessage {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

function FormMessageDisplay({ message }: { message: FormMessage }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />,
    error: <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  };
  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
  };
  const textColors = {
    success: 'text-emerald-800 dark:text-emerald-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
  };
  const subTextColors = {
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${bgColors[message.type]} mb-4`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[message.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${textColors[message.type]}`}>{message.title}</p>
        <p className={`text-sm mt-0.5 ${subTextColors[message.type]}`}>{message.message}</p>
      </div>
    </motion.div>
  );
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const ROLE_FEATURES = {
  farmer: [
    { title: 'Market Price Insights', description: 'Real-time division & sub-division tracking across all Indian mandi markets.', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
    { title: 'AI Crop Health Detection', description: 'Instant AI disease detection, treatment suggestions, and agronomy advice.', icon: Camera, color: 'from-emerald-600 to-green-600' },
    { title: 'B2B Crop Supply Matching', description: 'Direct buyer negotiations, pricing agreements, and contract management.', icon: Handshake, color: 'from-teal-500 to-emerald-600' },
    { title: 'WhatsApp-Style Rich Chat', description: 'Send voice messages, documents, and product images in real time.', icon: MessageCircle, color: 'from-emerald-500 to-green-600' },
    { title: 'Micro-Weather Forecasts', description: 'Precise weather forecasts and notifications to schedule harvesting.', icon: CloudSun, color: 'from-amber-500 to-orange-500' },
  ],
  buyer: [
    { title: 'Direct Sourcing Hub', description: 'Connect directly with verified local growers to secure daily supply.', icon: ShoppingBag, color: 'from-blue-500 to-indigo-600' },
    { title: 'Supply Chain Analytics', description: 'Monitor crop collection volumes, quality grades, moisture levels, and billing details.', icon: BarChart3, color: 'from-indigo-500 to-violet-600' },
    { title: 'B2B Negotiator', description: 'Lock quantity commitments and pricing terms directly with individual farms.', icon: Handshake, color: 'from-indigo-600 to-blue-600' },
    { title: 'Geographic Map Explorer', description: 'Visualize farmer networks and optimize crop logistics routes.', icon: Map, color: 'from-cyan-500 to-blue-600' },
    { title: 'Delivery Management', description: 'Track dispatch logs, transit statuses, and generate digital receipt invoices.', icon: Truck, color: 'from-purple-500 to-pink-600' },
  ],
  admin: [
    { title: 'Global Control Center', description: 'Complete system observability, logs, database health, and active sessions.', icon: Shield, color: 'from-indigo-600 to-violet-700' },
    { title: 'User Management & Audit', description: 'CRUD operations, user activation status, and last activity logs.', icon: Users, color: 'from-purple-600 to-fuchsia-700' },
    { title: 'Notification Broadcasts', description: 'Dispatch targeted push alerts and email notifications across the platform.', icon: Send, color: 'from-pink-600 to-rose-700' },
    { title: 'System Configurations', description: 'Manage commission rates, transaction policies, and app settings.', icon: Sliders, color: 'from-indigo-500 to-blue-600' },
    { title: 'Unified Platform Revenue', description: 'Track platform transaction commissions, volume, and total growth.', icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
  ],
};

const GRADIENTS = {
  farmer: 'from-emerald-700 via-emerald-800 to-teal-950',
  buyer: 'from-blue-700 via-indigo-800 to-indigo-950',
  admin: 'from-indigo-900 via-purple-900 to-slate-950',
};

const GLOWS = {
  farmer: { top: 'bg-emerald-400/20', bottom: 'bg-amber-400/10' },
  buyer: { top: 'bg-blue-400/20', bottom: 'bg-purple-400/10' },
  admin: { top: 'bg-indigo-400/20', bottom: 'bg-fuchsia-400/10' },
};

const ROLE_HEADERS = {
  farmer: {
    title: 'Farmer Network',
    subtitle: 'AI-powered farming intelligence. Monitor crop health, detect diseases instantly, and trade on the B2B marketplace.',
    icon: Leaf,
    accent: 'text-emerald-300',
  },
  buyer: {
    title: 'Buyer Marketplace',
    subtitle: 'Global sourcing platform. Find verified agricultural products, negotiate deals, and track shipments.',
    icon: ShoppingBag,
    accent: 'text-blue-300',
  },
  admin: {
    title: 'Master Control Panel',
    subtitle: 'System administration console. Manage users, track configurations, inspect activity logs, and broadcast announcements.',
    icon: Shield,
    accent: 'text-purple-300',
  },
};

// Role link appearance config (for right-panel links)
const ROLE_LINK_CONFIG = {
  farmer: {
    label: '🌾 Farmer',
    active: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm',
    idle: 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
  },
  buyer: {
    label: '💼 Buyer',
    active: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-sm',
    idle: 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
  },
  admin: {
    label: '🛡️ Admin',
    active: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-sm',
    idle: 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20',
  },
};



// ─── Horizontal Feature Carousel ──────────────────────────────────────────
function FeatureCarousel({
  role, featureIdx, onPrev, onNext, onDotClick,
}: {
  role: 'farmer' | 'buyer' | 'admin';
  featureIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (i: number) => void;
}) {
  const features = ROLE_FEATURES[role];
  const feature = features[featureIdx];
  const FeatIcon = feature.icon;

  return (
    <div className="w-full rounded-2xl border border-white/15 bg-white/8 backdrop-blur-sm p-4">
      <div className="relative h-16 overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${featureIdx}`}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-start gap-3 text-left"
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-sm text-white`}>
              <FeatIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-xs leading-tight mb-1">{feature.title}</h4>
              <p className="text-[11px] text-white/65 leading-snug line-clamp-2">{feature.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-3">
        <button type="button" onClick={onPrev} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white" aria-label="Previous">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex gap-1.5">
          {features.map((_, idx) => (
            <button key={idx} type="button" onClick={() => onDotClick(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${featureIdx === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
              aria-label={`Feature ${idx + 1}`}
            />
          ))}
        </div>
        <button type="button" onClick={onNext} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white" aria-label="Next">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const { showLoader, hideLoader } = useLoader();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);
  const [activeRole, setActiveRole] = useState<'farmer' | 'buyer' | 'admin'>('farmer');
  const [featureIdx, setFeatureIdx] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Auto-advance carousel every 3.5 s
  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIdx((prev) => (prev + 1) % ROLE_FEATURES[activeRole].length);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeRole]);

  useEffect(() => { setFeatureIdx(0); }, [activeRole]);

  // When admin selected, force login tab (no admin self-registration)
  useEffect(() => {
    if (activeRole === 'admin') setTab('login');
  }, [activeRole]);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', role: 'farmer',
    farmName: '', farmLocation: '', farmSizeAcres: '',
  });

  useEffect(() => { setFormMessage(null); }, [tab]);

  const { mutate: login, isPending: loginPending } = useMutation({
    mutationFn: () => authApi.login({ email: loginForm.email, password: loginForm.password }),
    onMutate: () => { 
      showLoader({ 
        variant: 'auth', 
        message: 'Verifying Credentials', 
        subtitle: 'Authenticating your session with AgriVision server…' 
      }); 
      setFormMessage(null); 
    },
    onSuccess: (res) => {
      const { user, token } = res.data.data;
      setUser(user, token);
      
      showLoader({
        variant: 'auth',
        message: 'Please wait…',
        subtitle: 'Establishing secure session layer…'
      });

      setTimeout(() => {
        showLoader({
          variant: 'auth',
          message: 'Loading Workspace',
          subtitle: `Retrieving dashboard preferences for ${user.name}…`
        });
      }, 700);

      setTimeout(() => {
        showLoader({
          variant: 'auth',
          message: 'Almost completed',
          subtitle: 'Redirecting to your personalized home screen…'
        });
      }, 1400);

      setTimeout(() => {
        router.push(user.role?.toUpperCase() === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }, 2000);
    },
    onError: (err: unknown) => {
      hideLoader();
      const error = err as { response?: { data?: { message?: string } } };
      setFormMessage({ type: 'error', title: 'Login Failed', message: error?.response?.data?.message || 'Login failed. Please check your credentials.' });
      showErrorToast(err, 'Login Failed');
    },
  });

  const { mutate: register, isPending: registerPending } = useMutation({
    mutationFn: () => authApi.register({
      ...registerForm,
      farmLocation: registerForm.farmLocation ? { address: registerForm.farmLocation } : undefined,
      farmSizeAcres: registerForm.farmSizeAcres ? Number(registerForm.farmSizeAcres) : undefined,
    }),
    onMutate: () => { 
      showLoader({ 
        variant: 'auth', 
        message: 'Creating Account', 
        subtitle: 'Registering tenant credentials in security vault…' 
      }); 
      setFormMessage(null); 
    },
    onSuccess: (res) => {
      const { user, token } = res.data.data;
      setUser(user, token);

      showLoader({
        variant: 'auth',
        message: 'Provisioning Space',
        subtitle: 'Configuring custom AgriVision tenant storage…'
      });

      setTimeout(() => {
        showLoader({
          variant: 'auth',
          message: 'Initializing Dashboard',
          subtitle: 'Setting up agricultural tools and data hubs…'
        });
      }, 750);

      setTimeout(() => {
        showLoader({
          variant: 'auth',
          message: 'Almost completed',
          subtitle: 'Redirecting to your fresh dashboard…'
        });
      }, 1500);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2100);
    },
    onError: (err: unknown) => {
      hideLoader();
      const error = err as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } } };
      let msg = 'Registration failed. Please try again.';
      if (error?.response?.data?.errors) msg = error.response.data.errors.map((e) => e.msg).join(', ');
      else if (error?.response?.data?.message) msg = error.response.data.message;
      setFormMessage({ type: 'error', title: 'Registration Failed', message: msg });
      showErrorToast(err, 'Registration Failed');
    },
  });

  const isPending = loginPending || registerPending;

  const handleKeyDown = (e: React.KeyboardEvent, action: 'login' | 'register') => {
    if (e.key === 'Enter' && !isPending) {
      e.preventDefault();
      if (action === 'register' && !acceptTerms) {
        toast.error('Please accept the Terms of Service to register.');
        return;
      }
      action === 'login' ? login() : register();
    }
  };

  const totalFeatures = ROLE_FEATURES[activeRole].length;
  const handlePrev = () => setFeatureIdx((p) => (p - 1 + totalFeatures) % totalFeatures);
  const handleNext = () => setFeatureIdx((p) => (p + 1) % totalFeatures);

  const roleHeader = ROLE_HEADERS[activeRole];
  const HeroIcon = roleHeader.icon;

  const switchRole = (r: 'farmer' | 'buyer' | 'admin') => {
    setActiveRole(r);
    setFeatureIdx(0);
    if (r !== 'admin') {
      setRegisterForm((p) => ({ ...p, role: r }));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── LEFT PANEL – Hero + Carousel ─────────────────────── */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${GRADIENTS[activeRole]} flex-col items-center justify-between p-10 text-white relative overflow-hidden transition-all duration-500`}>
        {/* Blur orbs */}
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full ${GLOWS[activeRole].top} blur-[120px] transition-all duration-500 pointer-events-none`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full ${GLOWS[activeRole].bottom} blur-[100px] transition-all duration-500 pointer-events-none`} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm flex flex-col gap-6 relative z-10"
        >
          {/* Brand */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur border border-white/30">
              <HeroIcon className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">AgriVision Pro</h1>
            <p className={`text-sm leading-relaxed max-w-sm mx-auto font-medium ${roleHeader.accent} min-h-[2.8rem]`}>
              {roleHeader.subtitle}
            </p>
          </div>



          {/* Horizontal Feature Carousel */}
          <FeatureCarousel
            role={activeRole}
            featureIdx={featureIdx}
            onPrev={handlePrev}
            onNext={handleNext}
            onDotClick={setFeatureIdx}
          />
        </motion.div>

        {/* Bottom tagline */}
        <p className="text-[10px] text-white/40 tracking-widest uppercase relative z-10">
          AGRICULTURAL INTELLIGENCE PLATFORM
        </p>
      </div>

      {/* ── RIGHT PANEL – Form ────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-md">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">AgriVision Pro</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8 transition-colors duration-300">

            {/* ── Role Selector Links (visible only for non-admin modes) */}
            {activeRole !== 'admin' && (
              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                {(['farmer', 'buyer'] as const).map((r) => {
                  const cfg = ROLE_LINK_CONFIG[r];
                  const isActive = activeRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => switchRole(r)}
                      className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-200 ${
                        isActive ? cfg.active : cfg.idle
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Form messages */}
            <AnimatePresence mode="wait">
              {formMessage && <FormMessageDisplay message={formMessage} />}
            </AnimatePresence>

            {/* ── Sign In / Register tab toggle
                 Hide "Register" tab when Admin role is active — admins cannot self-register */}
            {activeRole !== 'admin' && (
              <div className="mb-6 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                {(['login', 'register'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      tab === t
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>
            )}

            {/* Admin: Sign In only label */}
            {activeRole === 'admin' && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-4 py-3">
                <Shield className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">System Administrator Login</p>
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400">Admin accounts are provisioned by the system. Self-registration is disabled.</p>
                </div>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {(tab === 'login' || activeRole === 'admin') && (
              <form
                onSubmit={(e) => { e.preventDefault(); login(); }}
                onKeyDown={(e) => handleKeyDown(e, 'login')}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder={activeRole === 'admin' ? 'admin@agrivision.com' : activeRole === 'farmer' ? 'farmer@example.com' : 'buyer@example.com'}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isPending}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 shadow-md active:scale-[0.98] transition-all ${
                    activeRole === 'admin'
                      ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/10'
                      : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/10'
                  }`}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {activeRole === 'admin' ? 'Access Admin Panel' : 'Sign In'}
                </button>

                {/* Quick-fill for admin */}
                {activeRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({ email: 'admin@agrivision.com', password: 'AdminPassword123' });
                      toast.info('Demo credentials loaded', { description: 'Click "Access Admin Panel" to continue.' });
                    }}
                    className="w-full text-center text-[11px] text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline transition-colors"
                  >
                    Use demo admin credentials
                  </button>
                )}
              </form>
            )}

            {/* ── REGISTER FORM (Farmer & Buyer only) ── */}
            {tab === 'register' && activeRole !== 'admin' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!acceptTerms) {
                    toast.error('Please accept the Terms of Service to register.');
                    return;
                  }
                  register();
                }}
                onKeyDown={(e) => handleKeyDown(e, 'register')}
                className="space-y-3"
              >
                {/* Role is pre-set by the active role link; show a read-only badge */}
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-3 py-2">
                  <span className="text-sm">{activeRole === 'farmer' ? '🌾' : '💼'}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    Registering as {registerForm.role}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400">
                    Switch using the tabs above
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      key: 'name',
                      label: registerForm.role === 'farmer' ? 'Farmer Name' : 'Buyer Name',
                      type: 'text',
                      placeholder: registerForm.role === 'farmer' ? 'John Farmer' : 'John Buyer',
                      span: 2,
                    },
                    { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', span: 2 },
                    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••', span: 2 },
                    {
                      key: 'farmName',
                      label: registerForm.role === 'farmer' ? 'Farm Name' : 'Company Name',
                      type: 'text',
                      placeholder: registerForm.role === 'farmer' ? 'Green Valley Farm' : 'ABC Trading Co.',
                      span: 1,
                    },
                    {
                      key: 'farmLocation',
                      label: registerForm.role === 'farmer' ? 'Farm Location' : 'Business Location',
                      type: 'text',
                      placeholder: registerForm.role === 'farmer' ? 'Pune, Maharashtra' : 'Mumbai, Maharashtra',
                      span: 1,
                    },
                  ].map(({ key, label, type, placeholder, span }) => (
                    <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                      <input
                        id={`register-${key}`}
                        type={type}
                        required={['name', 'email', 'password'].includes(key)}
                        placeholder={placeholder}
                        value={registerForm[key as keyof typeof registerForm]}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Terms and conditions acceptance checkbox */}
                <div className="flex items-start gap-2.5 py-1.5">
                  <input
                    id="accept-terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-350 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <label
                    htmlFor="accept-terms"
                    className="text-xs text-slate-500 dark:text-slate-400 select-none cursor-pointer"
                  >
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-600 hover:text-emerald-705 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                    >
                      Terms of Service
                    </a>{' '}
                    and Privacy Policy.
                  </label>
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  disabled={isPending || !acceptTerms}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-55 disabled:cursor-not-allowed mt-2 shadow-md hover:shadow-lg hover:shadow-emerald-600/10 active:scale-[0.98] transition-all"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Create Account
                </button>
              </form>
            )}

            {/* Tagline */}
            <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800/50 pt-4 space-y-3">
              <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 italic">
                &quot;Empowering India&apos;s Agricultural Supply Chain with Real-Time AI Diagnostics &amp; B2B Mandi Trade.&quot;
              </p>
              <div className="flex justify-center pt-1">
                {activeRole !== 'admin' ? (
                  <button
                    type="button"
                    onClick={() => switchRole('admin')}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors duration-200"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Master Admin Access
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchRole('farmer')}
                    className="text-[11px] font-semibold text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors duration-200"
                  >
                    <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                    Return to Farmer / Buyer Portal
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
