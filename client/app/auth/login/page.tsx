'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

// Form Message Display Component
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const { showLoader, hideLoader } = useLoader();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', role: 'farmer',
    farmName: '', farmLocation: '', farmSizeAcres: '',
  });

  // Clear message when tab changes
  useEffect(() => {
    setFormMessage(null);
  }, [tab]);

  const { mutate: login, isPending: loginPending } = useMutation({
    mutationFn: () => authApi.login({ email: loginForm.email, password: loginForm.password }),
    onMutate: () => {
      showLoader({ variant: 'auth', message: 'Signing In' });
      setFormMessage(null);
    },
    onSuccess: (res) => {
      console.log('[Login] Login successful:', res.data);
      const { user, token } = res.data.data;
      setFormMessage({
        type: 'success',
        title: 'Login Successful!',
        message: `Welcome back, ${user.name}! Redirecting to dashboard...`,
      });
      setUser(user, token);
      toast.success(`Welcome back, ${user.name}!`, {
        description: 'Redirecting to dashboard...',
      });
      // Hide loader before redirect
      hideLoader();
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    },
    onError: (err: unknown) => {
      hideLoader();
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error?.response?.data?.message || 'Login failed. Please check your credentials.';
      setFormMessage({
        type: 'error',
        title: 'Login Failed',
        message: errorMessage,
      });
      showErrorToast(err, 'Login Failed');
    },
  });

  const { mutate: register, isPending: registerPending } = useMutation({
    mutationFn: () =>
      authApi.register({
        ...registerForm,
        farmLocation: registerForm.farmLocation ? { address: registerForm.farmLocation } : undefined,
        farmSizeAcres: registerForm.farmSizeAcres ? Number(registerForm.farmSizeAcres) : undefined,
      }),
    onMutate: () => {
      showLoader({ variant: 'auth', message: 'Creating Account' });
      setFormMessage(null);
    },
    onSuccess: (res) => {
      console.log('[Register] Registration successful:', res.data);
      const { user, token } = res.data.data;
      setFormMessage({
        type: 'success',
        title: 'Account Created!',
        message: `Welcome to AgriVision Pro, ${user.name}! Setting up your dashboard...`,
      });
      setUser(user, token);
      toast.success('Account Created Successfully!', {
        description: `Welcome to AgriVision Pro, ${user.name}!`,
      });
      // Hide loader before redirect
      hideLoader();
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    },
    onError: (err: unknown) => {
      hideLoader();
      const error = err as { response?: { data?: { message?: string; errors?: Array<{ msg: string }> } } };
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error?.response?.data?.errors) {
        errorMessage = error.response.data.errors.map((e) => e.msg).join(', ');
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setFormMessage({
        type: 'error',
        title: 'Registration Failed',
        message: errorMessage,
      });
      showErrorToast(err, 'Registration Failed');
    },
  });

  const isPending = loginPending || registerPending;

  // Handle Enter key for form submission
  const handleKeyDown = (e: React.KeyboardEvent, action: 'login' | 'register') => {
    if (e.key === 'Enter' && !isPending) {
      e.preventDefault();
      if (action === 'login') {
        login();
      } else {
        register();
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 agri-gradient flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Soft decorative visual blur gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center relative z-10"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur border border-white/30 animate-pulse-grow">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">AgriVision Pro</h1>
          <p className="text-emerald-100 text-lg leading-relaxed font-medium">
            AI-powered farming intelligence. Monitor crop health, detect diseases instantly,
            and trade on the B2B marketplace.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Farmers Joined', value: '12K+' },
              { label: 'Health Scans', value: '4.8K' },
              { label: 'Market Deals', value: '$2.1M' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3 shadow-lg hover:bg-white/20 transition-all duration-300">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-emerald-200 uppercase font-black tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-md">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">AgriVision Pro</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8 transition-colors duration-300">
            {/* Form Message Display */}
            <AnimatePresence mode="wait">
              {formMessage && <FormMessageDisplay message={formMessage} />}
            </AnimatePresence>

            {/* Tab Toggle */}
            <div className="mb-6 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                    tab === t
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              <form
                onSubmit={(e) => { e.preventDefault(); login(); }}
                onKeyDown={(e) => handleKeyDown(e, 'login')}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="farmer@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg hover:shadow-emerald-600/10 active:scale-[0.98] transition-all"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Sign In
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); register(); }}
                onKeyDown={(e) => handleKeyDown(e, 'register')}
                className="space-y-3"
              >
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">I am a</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none bg-white dark:bg-slate-800"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="buyer">Buyer</option>
                  </select>
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
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">{label}</label>
                      <input
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

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors mt-2 shadow-md hover:shadow-lg hover:shadow-emerald-600/10 active:scale-[0.98] transition-all"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Create Account
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
