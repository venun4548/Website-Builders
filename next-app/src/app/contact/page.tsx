'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Send, CheckCircle2, Shield, Loader2, Sparkles } from 'lucide-react';

function ContactFormInner() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('Web Development');
  const [budget, setBudget] = useState('₹25,000 - ₹50,000');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSubmissionId, setSuccessSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    if (planParam) {
      setService(`${planParam} Package Development`);
    }
  }, [planParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessSubmissionId(null);

    if (honeypot.length > 0) {
      setError('Bot activity detected.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service,
          budget,
          message,
          honeypot,
          turnstileToken: 'mock_turnstile_token',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many submissions. Please wait a few minutes before trying again.');
        } else {
          setError(data.error || 'Submission failed.');
        }
        setLoading(false);
        return;
      }

      setSuccessSubmissionId(data.submissionId);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setLoading(false);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-400 mb-2">Email Inquiries</h2>
          <a
            href="mailto:websitebuilders@gmail.com"
            className="text-blue-400 hover:underline text-sm font-medium"
          >
            websitebuilders@gmail.com
          </a>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-400 mb-2">Direct Phone / WhatsApp</h2>
          <p className="text-slate-300 text-sm font-medium">+91 7386204885</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-400 mb-2">Office Location</h2>
          <p className="text-slate-300 text-sm">
            Balaji Colony, Tirupathi<br />
            AP — 517502, India
          </p>
        </div>
      </div>

      <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {successSubmissionId && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-in zoom-in-95">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Message Received!
            </p>
            <p>Your inquiry has been converted into a CRM lead. Our engineers will reply within 24 hours.</p>
            <code className="mt-2 block p-2 bg-slate-950 rounded border border-emerald-500/20 text-xs font-mono text-emerald-300">
              Ref ID: {successSubmissionId}
            </code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden Honeypot Field */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="company_hp">Do not fill this</label>
            <input
              id="company_hp"
              type="text"
              name="company_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Estimated Budget
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition text-sm"
              >
                <option value="₹14,999 - ₹25,000">₹14,999 - ₹25,000 (Starter)</option>
                <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000 (Professional)</option>
                <option value="₹50,000+">₹50,000+ (Enterprise)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Service / Selected Package
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. Professional Package, Custom Web App"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Project Details & Requirements *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your design inspirations, desired features, or launch timeline..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/50 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Direct Lead Injection to Google Sheets Database
            </span>
            <span className="text-[10px] text-slate-500">Verified Origin</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? 'Submitting Inquiry...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Website Builders
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition">Home</Link>
            <Link href="/services" className="text-slate-400 hover:text-white transition">Services & Pricing</Link>
            <Link href="/user/login" className="text-slate-400 hover:text-white transition">Client Portal</Link>
            <Link href="/admin/access" className="text-slate-400 hover:text-blue-400 transition">Admin Gate</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Start Your Build
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Get in Touch</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Share your brief and architectural goals. Our engineering consultants respond within 24 hours.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading form...</div>}>
          <ContactFormInner />
        </Suspense>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} Website Builders Co. All rights reserved. • Contact: websitebuilders@gmail.com</p>
      </footer>
    </div>
  );
}
