'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import LiquidOtpVerification from '@/components/LiquidOtpVerification';

export default function AdminLoginPage() {
  const router = useRouter();

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA Verification State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many login attempts. Please try again later.');
        } else {
          setError(data.error || 'Invalid credentials.');
        }
        setLoading(false);
        return;
      }

      // Check if Admin 2FA is required
      if (data.requires2FA && data.tempToken) {
        setTempToken(data.tempToken);
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  // Verify 2FA with Liquid OTP V2
  const handleVerify2FA = async (code: string) => {
    if (!tempToken) {
      return { success: false, error: 'Session expired. Please sign in again.' };
    }

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Invalid authenticator code. Please check your app.',
        };
      }

      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 700);

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Network connection failed while verifying 2FA.',
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#090614] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting - Royal Purple & Indigo Aurora */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/12 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {!requires2FA ? (
            <motion.div
              key="admin-credentials-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-8 shadow-2xl shadow-purple-950/20"
            >
              <div className="text-center mb-8">
                <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/25 rounded-full text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  Admin Portal
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Staff Sign In</h1>
                <p className="text-sm text-slate-400 mt-2">
                  PIN Gate Verified. Enter your administrator credentials.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@websitebuilders.com"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center mt-6 shadow-lg shadow-purple-950/50 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In as Administrator'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500">
                <Link href="/admin/access" className="hover:text-purple-400 transition">
                  ← Return to PIN Verification
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin-2fa-liquid-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <LiquidOtpVerification
                length={6}
                theme="violet"
                title="Admin 2FA Authorization"
                subtitle="Enter the 6-digit TOTP code from your Google Authenticator or 2FA app."
                targetEmailOrPhone={email}
                onVerify={handleVerify2FA}
                autoFocus={true}
              />

              <button
                type="button"
                onClick={() => setRequires2FA(false)}
                className="mt-6 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-purple-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to password login</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
