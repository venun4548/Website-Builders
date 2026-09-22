import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  EyeOff,
  UserCheck,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const metadata = {
  title: 'Trust & Security | Website Builders',
  description:
    'Our commitment to security, data privacy, payment encryption, and platform integrity at Website Builders.',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Website Builders
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            Platform Integrity & Trust
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
            Security, Privacy & <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Compliance</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            At Website Builders, enterprise security and transparency are engineered directly into every digital product, portal, and transaction we manage.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* 1. SSL / Secure Connection */}
        <section aria-labelledby="ssl-heading" className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 id="ssl-heading" className="text-xl sm:text-2xl font-bold text-white">
                SSL / End-to-End Encrypted Transport
              </h2>
              <p className="text-sm text-slate-400">Strict Transport Security across all web applications</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            All communications with the Website Builders portals, APIs, and client dashboards are encrypted using modern Transport Layer Security (TLS 1.3/HTTPS). Unencrypted HTTP traffic is rejected and automatically redirected to HTTPS.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-bit TLS encryption in transit</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>HSTS (HTTP Strict Transport Security)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated certificate renewals</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Modern cipher suite enforcement</span>
            </li>
          </ul>
        </section>

        {/* 2. Payment Security */}
        <section aria-labelledby="payment-heading" className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 id="payment-heading" className="text-xl sm:text-2xl font-bold text-white">
                Payment Security & Tokenization
              </h2>
              <p className="text-sm text-slate-400">Zero sensitive card data stored on our servers</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Website Builders integrates directly with Razorpay, a PCI-DSS Level 1 certified payment gateway. We never store, capture, or have access to your credit card numbers, debit card PINs, CVV codes, or net banking passwords.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tokenized client-side checkout</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cryptographic HMAC-SHA256 signature verification</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant tax invoice generation with GST compliance</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated payment confirmations</span>
            </li>
          </ul>
        </section>

        {/* 3. Data Privacy & Storage */}
        <section aria-labelledby="privacy-heading" className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <h2 id="privacy-heading" className="text-xl sm:text-2xl font-bold text-white">
                Data Privacy & Cloud Architecture
              </h2>
              <p className="text-sm text-slate-400">Strict client data isolation and transparent handling</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Your business project specifications, design assets, and private communications belong solely to your organization. Client accounts only have access to their own projects and verified deliverables. Internal staff and administrator remarks are strictly shielded from public view.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-Based Access Control (RBAC) enforced server-side</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Encrypted server-to-server Google API service accounts</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No sale or marketing syndication of client data</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Right to data deletion upon formal request</span>
            </li>
          </ul>
        </section>

        {/* 4. Account Security */}
        <section aria-labelledby="account-heading" className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="account-heading" className="text-xl sm:text-2xl font-bold text-white">
                Account Protection & Two-Factor Authentication
              </h2>
              <p className="text-sm text-slate-400">State-of-the-art authentication defenses</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            All user credentials are encrypted using salted bcrypt password hashing with work factor 12. Administrative accounts are protected by mandatory session validation and optional RFC 6238 Time-based One-Time Passwords (TOTP).
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Standard Google Authenticator / TOTP 2FA</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>HttpOnly, SameSite=Strict secure session cookies</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Brute-force protection & automatic lockout</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Comprehensive audit logs for sensitive operations</span>
            </li>
          </ul>
        </section>

        {/* 5. Contact Section */}
        <section aria-labelledby="contact-heading" className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/20 rounded-3xl p-8 sm:p-10 shadow-xl text-center">
          <h2 id="contact-heading" className="text-2xl font-bold text-white mb-3">
            Questions Regarding Platform Security?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
            For security inquiries, vulnerability reporting, or enterprise data protection requests, please contact our security team directly:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
            <a
              href="mailto:websitebuildeers@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              websitebuildeers@gmail.com
            </a>
            <a
              href="tel:+917386204885"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              +91 7386204885
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Website Builders Co. All rights reserved. Zero fake certification badges displayed.</p>
      </footer>
    </div>
  );
}
