'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, FileSpreadsheet, CloudLightning } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  // const [email, setEmail] = useState('adarsh.vinodhan.00@gmail.com');
  const [password, setPassword] = useState('');
  // const [password, setPassword] = useState('Dubai2026!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  // const handleFillCredentials = () => {
  //   setEmail('adarsh.vinodhan.00@gmail.com');
  //   setPassword('Dubai2026!');
  //   setError('');
  // };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          JobHunt<span className="text-brand-500">.CRM</span>
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Personal Job Search Management & Tracking Command Center for{' '}
          <span className="text-slate-200 font-semibold">Adarsh Vinothan</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleFillCredentials}
                className="text-brand-400 hover:text-brand-300 text-[11px] font-medium transition-colors"
              >
                Auto-fill Default Credentials
              </button>
              <span className="text-[11px] text-slate-500">Secure Session Auth</span>
            </div> */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg shadow-brand-500/25 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Integration Badges */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CloudLightning className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-200">Google Sheets</p>
              <p className="text-[10px] text-slate-500">Daily Sync Connected</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <FileSpreadsheet className="w-4 h-4 text-brand-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-200">Excel Tracker</p>
              <p className="text-[10px] text-slate-500">Import & Export Ready</p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Protected personal dashboard • Visit Visa Dubai • 3+ Years Full-Stack
          </p>
        </div>
      </div>
    </div>
  );
}
