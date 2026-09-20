import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';
import Link from 'next/link';

export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const user = sessionToken ? await verifyJWT(sessionToken) : null;

  if (!user) {
    redirect('/user/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-emerald-400 font-bold text-lg">
            Website Builders
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Welcome, <strong className="text-white">{user.email}</strong>
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Client Portal Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your website builds, submissions, and service requests.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-xs font-semibold uppercase text-slate-400">Account Status</div>
            <div className="text-2xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Verified Client
            </div>
            <p className="text-xs text-slate-500 mt-2">Email verified and RBAC authorized</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-xs font-semibold uppercase text-slate-400">Active Builds</div>
            <div className="text-2xl font-bold text-white mt-2">1 Project</div>
            <p className="text-xs text-slate-500 mt-2">Corporate Redesign in progress</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-xs font-semibold uppercase text-slate-400">Support Enquiries</div>
            <div className="text-2xl font-bold text-white mt-2">0 Open</div>
            <p className="text-xs text-slate-500 mt-2">All tickets resolved</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
            >
              Submit New Project Enquiry
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
