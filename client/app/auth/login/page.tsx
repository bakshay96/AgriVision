'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', role: 'farmer',
    farmName: '', farmLocation: '', farmSizeAcres: '',
  });

  const { mutate: login, isPending: loginPending } = useMutation({
    mutationFn: () => authApi.login({ email: loginForm.email, password: loginForm.password }),
    onSuccess: (res) => {
      console.log('[Login] Login successful:', res.data);
      const { user, token } = res.data.data;
      setUser(user, token);
      toast.success(`Welcome back, ${user.name}!`, {
        description: 'Redirecting to dashboard...',
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    },
    onError: (err: unknown) => {
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
    onSuccess: (res) => {
      console.log('[Register] Registration successful:', res.data);
      const { user, token } = res.data.data;
      setUser(user, token);
      toast.success('Account Created Successfully!', {
        description: `Welcome to AgriVision Pro, ${user.name}!`,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    },
    onError: (err: unknown) => {
      showErrorToast(err, 'Registration Failed');
    },
  });

  const isPending = loginPending || registerPending;

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 agri-gradient flex-col items-center justify-center p-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AgriVision Pro</h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            AI-powered farming intelligence. Monitor crop health, detect diseases instantly,
            and trade on the B2B marketplace.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Farmers', value: '12K+' },
              { label: 'Scans Daily', value: '4.8K' },
              { label: 'Orders/Month', value: '$2.1M' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-emerald-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">AgriVision Pro</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
            {/* Tab Toggle */}
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                    tab === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              <form
                onSubmit={(e) => { e.preventDefault(); login(); }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="farmer@example.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Sign In
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); register(); }}
                className="space-y-3"
              >
                {/* Role Selection - Moved to top */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">I am a</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none bg-white"
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
                      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
                      <input
                        type={type}
                        required={['name', 'email', 'password'].includes(key)}
                        placeholder={placeholder}
                        value={registerForm[key as keyof typeof registerForm]}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors mt-2"
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
