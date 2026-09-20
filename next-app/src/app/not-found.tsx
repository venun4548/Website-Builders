import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-bold">
        404
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Page Not Found</h1>
      <p className="text-slate-400 max-w-md mb-8">
        The page you are looking for does not exist or has been moved to another location.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-lg shadow-emerald-950/50"
      >
        Return to Home
      </Link>
    </div>
  );
}
