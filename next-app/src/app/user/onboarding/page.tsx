'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Building2,
  Palette,
  Target,
  FolderArchive,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    brandName: '',
    tagline: '',
    industry: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#0f172a',
    fontFamily: 'Inter',
    targetAudience: '',
    brandValues: '',
    existingWebsite: '',
    assetsUrl: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.onboardingComplete === 'true') {
            router.push('/user/projects');
            return;
          }
          if (data.brandInfo) {
            setFormData((prev) => ({
              ...prev,
              ...data.brandInfo,
            }));
          } else if (data.user) {
            setFormData((prev) => ({
              ...prev,
              brandName: data.user.brandName || data.user.company || '',
              tagline: data.user.brandTagline || '',
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < 5) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      // 1. Save Brand Info
      await fetch('/api/user/brand-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // 2. Mark Onboarding as Complete
      const res = await fetch('/api/user/onboarding/complete', {
        method: 'PUT',
      });

      if (res.ok) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          router.push('/user/projects');
        }, 2000);
      }
    } catch (err) {
      console.error('Onboarding complete error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Brand Basics', icon: Building2 },
    { num: 2, title: 'Visual Identity', icon: Palette },
    { num: 3, title: 'Target Audience', icon: Target },
    { num: 4, title: 'Assets & Links', icon: FolderArchive },
    { num: 5, title: 'Review & Launch', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Client Onboarding Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Let&apos;s Build Your Digital Presence
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Complete the 5 quick steps below to align our engineering team with your brand.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between mb-10 px-2 sm:px-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40 scale-105'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 hidden sm:block ${
                      isCurrent ? 'text-blue-400' : isDone ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      step > idx + 1 ? 'bg-emerald-500/50' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Company & Brand Basics
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Brand / Company Name *
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Innovations"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tagline / One-line Mission
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Next-generation logistics engineered for speed"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g. Fintech, Healthcare, E-Commerce, SaaS"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-400" /> Visual Identity & Styling
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-12 rounded-xl bg-transparent cursor-pointer border border-slate-700"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Secondary / Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-12 rounded-xl bg-transparent cursor-pointer border border-slate-700"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Typography Preference
                </label>
                <select
                  name="fontFamily"
                  value={formData.fontFamily}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Inter">Inter (Clean, Modern, Silicon Valley Standard)</option>
                  <option value="Outfit">Outfit (Geometric, Tech, Premium)</option>
                  <option value="Roboto">Roboto (Crisp, High Legibility)</option>
                  <option value="Playfair Display">Playfair Display (Luxury, Editorial)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" /> Target Audience & Brand Values
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Customer Persona
                </label>
                <textarea
                  name="targetAudience"
                  rows={3}
                  value={formData.targetAudience}
                  onChange={handleChange}
                  placeholder="e.g. B2B enterprise executives, high-net-worth buyers, startup founders..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Core Values & Differentiators
                </label>
                <textarea
                  name="brandValues"
                  rows={3}
                  value={formData.brandValues}
                  onChange={handleChange}
                  placeholder="e.g. Speed, uncompromising security, modern minimalism..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-blue-400" /> Existing Assets & Links
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Current Website (if redesigning)
                </label>
                <input
                  type="url"
                  name="existingWebsite"
                  value={formData.existingWebsite}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Design Files / Drive / Asset Links
                </label>
                <input
                  type="url"
                  name="assetsUrl"
                  value={formData.assetsUrl}
                  onChange={handleChange}
                  placeholder="e.g. Google Drive, Figma, or Dropbox link"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Review & Confirm
              </h2>
              <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800/80 space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-slate-400">Brand Name:</span>
                  <span className="font-semibold text-white">{formData.brandName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-slate-400">Tagline:</span>
                  <span className="text-slate-200">{formData.tagline || 'None'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-slate-400">Palette:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <span className="font-mono text-xs text-slate-300">{formData.primaryColor}</span>
                  </div>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-slate-400">Font:</span>
                  <span className="text-slate-200">{formData.fontFamily}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Audience:</span>
                  <span className="text-slate-200 text-right max-w-xs truncate">
                    {formData.targetAudience || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleComplete}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Complete & Launch Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
