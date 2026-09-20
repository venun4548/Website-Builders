import Link from 'next/link';
import { getActiveRows } from '@/lib/sheets';
import { PortfolioItem } from '@/types/schema';
import { ArrowRight, Sparkles, CheckCircle2, Shield, Zap, Globe, Layers } from 'lucide-react';

export default async function Home() {
  let portfolioItems: PortfolioItem[] = [];
  try {
    const items = await getActiveRows<PortfolioItem>('Portfolio');
    portfolioItems = items.filter((i) => i.featured === 'true').slice(0, 3);
  } catch {
    portfolioItems = [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Website Builders
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/services" className="text-slate-300 hover:text-white transition">
              Services & Pricing
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition">
              Contact
            </Link>
            <Link href="/user/login" className="text-slate-300 hover:text-white transition">
              Client Portal
            </Link>
            <Link
              href="/admin/access"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-950/50"
            >
              Admin Gate
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Enterprise Security Standard & Google Sheets API v4 Architecture
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Next-Gen Web Architecture With{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Serverless Simplicity
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Production-grade Next.js enterprise stack powered by Google Sheets as a headless database,
          server-side timing-safe PIN gates, real-time Pusher WebSockets, and Razorpay GST billing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/services"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-xl shadow-blue-950/60 flex items-center gap-2"
          >
            Explore Services & Pricing <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/user/register"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold transition border border-slate-800"
          >
            Create Client Account
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold transition border border-slate-800"
          >
            Project Enquiry
          </Link>
        </div>
      </header>

      {/* Stat Counters with real initial values */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center">
            <div className="text-4xl font-extrabold text-white" data-target="250">
              250
            </div>
            <div className="text-xs uppercase font-semibold text-slate-400 mt-2">Projects Launched</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center">
            <div className="text-4xl font-extrabold text-white" data-target="15">
              15
            </div>
            <div className="text-xs uppercase font-semibold text-slate-400 mt-2">Years Experience</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center">
            <div className="text-4xl font-extrabold text-white" data-target="99">
              99%
            </div>
            <div className="text-xs uppercase font-semibold text-slate-400 mt-2">Client Satisfaction</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center">
            <div className="text-4xl font-extrabold text-white" data-target="40">
              40+
            </div>
            <div className="text-xs uppercase font-semibold text-slate-400 mt-2">Design Awards</div>
          </div>
        </div>
      </section>

      {/* Featured Portfolio Case Studies from Google Sheets */}
      {portfolioItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Featured Work</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Engineered Case Studies</h2>
            </div>
            <Link
              href="/services"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Packages <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-lg group hover:border-slate-700 transition-all"
              >
                <div className="h-48 w-full bg-slate-950 overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-900/80 text-blue-200 border border-blue-500/30 backdrop-blur-md">
                    {item.category}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-blue-400 font-bold text-lg">Website Builders</span>
            <p className="text-xs text-slate-500 mt-1">
              Contact: <a href="mailto:websitebuilders@gmail.com" className="text-slate-400 hover:underline">websitebuilders@gmail.com</a>
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <Link href="/services" className="hover:text-blue-400 transition text-xs">
              Services
            </Link>
            <Link href="/contact" className="hover:text-blue-400 transition text-xs">
              Contact
            </Link>
            <Link href="/user/login" className="hover:text-blue-400 transition text-xs">
              Client Portal
            </Link>
            <Link href="/admin/access" className="hover:text-blue-400 transition text-xs">
              Admin PIN Gate
            </Link>
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Website Builders Co. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
