'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAccessPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN.');
      return;
    }

    setLoading(true);

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
          setError(`Rate limit exceeded. Locked out for ${Math.ceil(Number(retryAfter) / 60)} minutes.`);
        } else {
          setError(data.error || 'Invalid PIN');
        }
        setLoading(false);
        return;
      }

      setSuccess('PIN verified successfully! Redirecting...');
      // Redirect to /admin/login only on valid response cookie
      setTimeout(() => {
        router.push('/admin/login');
      }, 800);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-emerald-950/20">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mx-auto flex items-center justify-center text-emerald-400 mb-4 text-xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Access Gate</h1>
          <p className="text-sm text-slate-400 mt-2">Enter your 4-digit authorized Admin Access PIN to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="adminPin" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              4-Digit Admin PIN
            </label>
            <input
              id="adminPin"
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoComplete="off"
              className="w-full tracking-widest text-center text-2xl font-mono px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center shadow-lg shadow-emerald-950/50"
          >
            {loading ? 'Verifying PIN...' : 'Verify Access PIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
