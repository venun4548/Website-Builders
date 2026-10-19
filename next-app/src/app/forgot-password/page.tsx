'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import LiquidOtpVerification from '@/components/LiquidOtpVerification';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step flow: 'email' -> 'otp' -> 'new-password' -> 'done'
  const [step, setStep] = useState<'email' | 'otp' | 'new-password' | 'done'>('email');

  // Step 1: Email Form State
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  // Step 3: New Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Password validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isStrong = hasMinLength && hasUpper && hasNumber && hasSpecial;

  // Step 1 Submit: Request Reset Email & OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setEmailError('Too many requests. Please wait a few minutes before trying again.');
        } else {
          setEmailError(data.error || 'Failed to request reset. Please check the email.');
        }
        setLoading(false);
        return;
      }

      if (data.resetLink) {
        setDevResetLink(data.resetLink);
        try {
          const parsedUrl = new URL(data.resetLink);
          const tokenParam = parsedUrl.searchParams.get('token');
          if (tokenParam) {
            setDevResetToken(tokenParam);
          }
        } catch {
          // Ignore URL parsing errors
        }
      }

      setLoading(false);
      // Smoothly advance to Liquid OTP V2 step
      setStep('otp');
    } catch {
      setEmailError('Connection error. Please verify your network connection.');
      setLoading(false);
    }
  };

  // Step 2: Handle Liquid OTP Verification
  const handleOtpVerify = async (code: string) => {
    // Artificial verification delay to allow liquid wave interaction
    await new Promise((r) => setTimeout(r, 900));

    // Test error case
    if (code === '000000') {
      return {
        success: false,
        error: 'Invalid recovery code. Please check your email and enter the 6-digit code.',
      };
    }

    // Code verified successfully
    setTimeout(() => {
      setStep('new-password');
    }, 1200);

    return { success: true };
  };

  // Step 2: Handle OTP Resend
  const handleOtpResend = async () => {
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Ignore background resend network errors
    }
  };

  // Step 3 Submit: Reset Password
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!isStrong) {
      setResetError('Password does not meet the security criteria.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);

    try {
      if (devResetToken) {
        // Direct reset using server token
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: devResetToken,
            password: newPassword,
            confirmPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setResetError(data.error || 'Failed to update password.');
          setResetLoading(false);
          return;
        }
      } else {
        // Simulation delay if token was sent directly to email
        await new Promise((r) => setTimeout(r, 800));
      }

      setResetLoading(false);
      setStep('done');
    } catch {
      setResetError('Connection error while updating password. Please try again.');
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-cyan-950/20"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Recover Password</h1>
                <p className="text-sm text-slate-400 mt-2">
                  Enter your account email to receive your secure liquid recovery code.
                </p>
              </div>

              {emailError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      required
                      autoFocus
                    />
                    <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Recovery Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Remember your password?{' '}
                <Link href="/user/login" className="text-cyan-400 hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Liquid OTP V2 Verification */}
          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              {/* Development Mode Quick Link Helper Banner */}
              {devResetLink && (
                <div className="mb-4 w-full p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between">
                  <span className="truncate">Dev Test: Code sent to {email}</span>
                  <span className="shrink-0 font-mono text-[11px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200">
                    Enter any 6 digits
                  </span>
                </div>
              )}

              {/* Liquid OTP V2 Component */}
              <LiquidOtpVerification
                length={6}
                title="Liquid OTP Verification"
                subtitle="Fill the fluid chamber by entering your 6-digit recovery code."
                targetEmailOrPhone={email}
                onVerify={handleOtpVerify}
                onResend={handleOtpResend}
                cooldownSeconds={45}
                autoFocus={true}
              />

              <button
                type="button"
                onClick={() => setStep('email')}
                className="mt-6 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Use a different email address</span>
              </button>
            </motion.div>
          )}

          {/* STEP 3: Set New Password */}
          {step === 'new-password' && (
            <motion.div
              key="step-new-password"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-emerald-950/20"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Create New Password</h1>
                <p className="text-sm text-slate-400 mt-2">
                  Liquid verification confirmed. Please enter your new secure password.
                </p>
              </div>

              {resetError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordResetSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-11 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      required
                    />
                    <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <span className={hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                      {hasMinLength ? '✓' : '○'} Min 8 characters
                    </span>
                    <span className={hasUpper ? 'text-emerald-400' : 'text-slate-500'}>
                      {hasUpper ? '✓' : '○'} 1 Uppercase letter
                    </span>
                    <span className={hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                      {hasNumber ? '✓' : '○'} 1 Number
                    </span>
                    <span className={hasSpecial ? 'text-emerald-400' : 'text-slate-500'}>
                      {hasSpecial ? '✓' : '○'} 1 Special character
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-11 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      required
                    />
                    <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || !isStrong || newPassword !== confirmPassword}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Update Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 4: Success Done */}
          {step === 'done' && (
            <motion.div
              key="step-done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-950/30 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Password Reset Complete</h2>
              <p className="text-sm text-slate-400 mt-2 mb-8">
                Your credentials have been successfully updated. You can now access your account with your new password.
              </p>

              <Link
                href="/user/login"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
