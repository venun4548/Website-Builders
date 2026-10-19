'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import LiquidOtpVerification from '@/components/LiquidOtpVerification';

export default function AdminAccessPage() {
  const router = useRouter();

  const handleVerifyPin = async (pin: string) => {
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After') || '1800';
          const waitMins = Math.ceil(Number(retryAfter) / 60);
          return {
            success: false,
            error: `Rate limit exceeded. Account locked for ${waitMins} minutes.`,
          };
        }
        return {
          success: false,
          error: data.error || 'Invalid 4-digit PIN. Please recheck your code.',
        };
      }

      // Successful verification: redirect to admin staff login
      setTimeout(() => {
        router.push('/admin/login');
      }, 700);

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Network error connecting to security server.',
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#060b09] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Ambient background cyber emerald glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top security tag */}
      <div className="mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-emerald-950/40">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Restricted Security Clearance</span>
      </div>

      {/* Liquid OTP V2 Component for 4-Digit Admin Access Gate */}
      <div className="w-full max-w-md relative z-10">
        <LiquidOtpVerification
          length={4}
          theme="emerald"
          title="Admin Access PIN Gate"
          subtitle="Enter your 4-digit authorized security PIN to unlock credentials."
          targetEmailOrPhone="Staff Terminal Level-3"
          onVerify={handleVerifyPin}
          autoFocus={true}
        />
      </div>

      {/* Return Navigation */}
      <div className="mt-8 text-center relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Homepage</span>
        </Link>
      </div>
    </div>
  );
}
