
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';
import { findRows, getActiveRows } from '@/lib/sheets';
import { Project, Invoice } from '@/types/schema';
import Link from 'next/link';
import InstallPwaBanner from '@/components/InstallPwaBanner';
import OfflineIndicator from '@/components/OfflineIndicator';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/NotificationBell';
import {
  FolderKanban,
  Layers,
  Wrench,
  FileText,
  Bell,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const user = sessionToken ? await verifyJWT(sessionToken) : null;

  if (!user) {
    redirect('/user/login');
  }

  // Fetch real projects for this client
  const [allProjects, allInvoices] = await Promise.all([
    getActiveRows<Project>('Projects'),
    getActiveRows<Invoice>('Invoices'),
  ]);

  const userProjects = allProjects.filter(
    (p) => p.clientId === user.userId || p.clientEmail?.toLowerCase() === user.email.toLowerCase()
  );

  const userInvoices = allInvoices.filter(
    (i) => i.clientId === user.userId || i.clientEmail?.toLowerCase() === user.email.toLowerCase()
  );

  const pendingInvoices = userInvoices.filter(
    (i) => !['paid', 'cancelled'].includes(String(i.status).toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-blue-600 selection:text-white">
      <OfflineIndicator />

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-extrabold text-lg tracking-tight">
            <img src="/images/logo.png" alt="Website Builders Logo" className="h-8 w-auto object-contain" />
            <div>
              <span className="text-white">Website </span>
              <span className="text-blue-400">Builders</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationBell userId={user.userId} />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">{user.name || 'Client'}</span>
              <span className="text-[11px] text-slate-400">{user.email}</span>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* PWA Install Banner */}
        <InstallPwaBanner />

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Client Portal Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time project tracking, deliverable visual revisions, invoices, and post-launch maintenance.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase text-slate-400">Account Status</div>
            <div className="text-xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Verified Client
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Full Portal & PWA Authorized</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase text-slate-400">Active Builds</div>
            <div className="text-xl font-bold text-white mt-2">
              {userProjects.length} {userProjects.length === 1 ? 'Project' : 'Projects'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Synchronized with Google Sheets</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase text-slate-400">Pending Invoices</div>
            <div className="text-xl font-bold text-amber-400 mt-2">
              {pendingInvoices.length} Due
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Secure Razorpay Checkout</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase text-slate-400">Notifications & PWA</div>
            <div className="text-xl font-bold text-blue-400 mt-2 flex items-center gap-1.5">
              <Bell className="w-5 h-5" /> Active
            </div>
            <Link
              href="/user/settings/notifications"
              className="text-[11px] text-blue-400 hover:text-blue-300 mt-1 block"
            >
              Configure Channels →
            </Link>
          </div>
        </div>

        {/* Feature Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/user/revisions"
            className="group bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center justify-between">
                Visual Revisions
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click or drag on design screenshots to place precision pins and request modifications.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-blue-400">
              Annotate Designs →
            </div>
          </Link>

          <Link
            href="/user/maintenance"
            className="group bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center justify-between">
                Post-Launch Maintenance
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Request content changes, technical fixes, and site updates with transparent quotation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-indigo-400">
              Submit Request →
            </div>
          </Link>

          <Link
            href="/user/settings/notifications"
            className="group bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center justify-between">
                Notification Channels
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage Email and Web Push subscription preferences for milestones and invoices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-purple-400">
              Manage Preferences →
            </div>
          </Link>
        </div>

        {/* Active Projects List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Your Projects</h3>
              <p className="text-xs text-slate-400">Live milestones synchronized from Google Sheets</p>
            </div>
            <Link
              href="/user/projects"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View Full Timeline →
            </Link>
          </div>

          {userProjects.length > 0 ? (
            <div className="space-y-4">
              {userProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-blue-400 font-bold">{p.id}</span>
                      <h4 className="text-base font-bold text-white mt-0.5">{p.name}</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Client: <strong className="text-slate-200">{p.clientName || user.name || 'Client'}</strong> ({p.clientEmail || user.email})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                        Stage: {p.stage}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Overall Progress</span>
                      <span className="font-bold text-white">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.progress}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      Expected Launch:{' '}
                      <strong className="text-slate-200">{p.estimatedLaunch || 'Scheduled'}</strong>
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/user/revisions`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Request Revision
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No active projects found for this account.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
