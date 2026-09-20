'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Globe,
} from 'lucide-react';

interface PricingTier {
  id: string;
  tier: string;
  price: number | string;
  billing: string;
  description: string;
  features: string[];
  highlighted: 'true' | 'false';
}

export default function ServicesPage() {
  const [pricing, setPricing] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch('/api/pricing');
        if (res.ok) {
          const data = await res.json();
          setPricing(data.pricing || []);
        }
      } catch (err) {
        console.error('Failed to load pricing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPricing();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              WEBSITE BUILDERS
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/services" className="text-blue-400">
              Services & Pricing
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/user/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
            >
              Client Login
            </Link>
            <Link
              href="/contact"
              className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/25 transition-all"
            >
              Start Project
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> High-Performance Digital Solutions
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Engineered for Scale, <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Built for Maximum Conversions.
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From rapid-turnaround starter web apps to high-throughput enterprise SaaS architectures, our engineering team handles end-to-end design, delivery, and scaling.
        </p>
      </section>

      {/* Capabilities Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Modern Web Architecture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Full-stack Next.js and serverless implementations with sub-second page loads, edge rendering, and flawless SEO indexing.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Enterprise Security Standards</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              HSTS, CSP strict policies, timing-safe authentication, CSRF origin verification, and Cloudflare bot mitigation built-in.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Google Sheets Cloud Database</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Zero SQL maintenance overhead with Google Sheets API v4 serverless storage, audit logs, and real-time Pusher WebSockets.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Packages */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white">Transparent Pricing</h2>
          <p className="text-sm text-slate-400 mt-2">
            Dynamic packages fetched directly from our Google Sheets CMS. All plans include 18% GST invoice generation.
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((tier) => {
              const isPopular = tier.highlighted === 'true';
              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all ${
                    isPopular
                      ? 'bg-gradient-to-b from-blue-900/40 via-slate-900 to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 md:-translate-y-2'
                      : 'bg-slate-900/60 border border-slate-800'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black bg-blue-600 text-white uppercase tracking-wider shadow-md">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-white">{tier.tier}</h3>
                    <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{tier.description}</p>

                    <div className="mt-6 pb-6 border-b border-slate-800">
                      <span className="text-4xl font-black text-white">
                        ₹{Number(tier.price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">/ {tier.billing}</span>
                    </div>

                    <div className="mt-6 space-y-3">
                      {Array.isArray(tier.features) &&
                        tier.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <Link
                    href={`/contact?plan=${encodeURIComponent(tier.tier)}`}
                    className={`mt-8 w-full py-3 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 transition-all ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    Select Plan <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Website Builders Co. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-400">Home</Link>
            <Link href="/services" className="hover:text-slate-400">Services</Link>
            <Link href="/contact" className="hover:text-slate-400">Contact</Link>
            <Link href="/admin/access" className="hover:text-slate-400">Admin Gate</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
