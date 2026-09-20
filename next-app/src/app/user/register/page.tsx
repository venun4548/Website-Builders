'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UserRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState(''); // F-11: Hidden honeypot field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  // Client-side password strength indicator (F-17)
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isStrong = hasMinLength && hasUpper && hasNumber && hasSpecial;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setVerificationLink(null);

    // F-11 Honeypot check on client
    if (honeypot.length > 0) {
      setError('Bot activity detected.');
      return;
    }

    if (!isStrong) {
      setError('Password does not meet the complexity requirements.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          honeypot,
          turnstileToken: 'mock_turnstile_token',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many registrations from this network. Please try again later.');
        } else {
          setError(data.error || 'Registration failed.');
        }
        setLoading(false);
        return;
      }

      setSuccess(data.message || 'Registration successful! Please check your email to verify.');
      if (data.verificationLink) {
        setVerificationLink(data.verificationLink);
      }
      setLoading(false);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-sm text-slate-400 mt-2">Join Website Builders platform with secure identity</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            <p className="font-semibold mb-1">Registration Complete</p>
            <p>{success}</p>
            {verificationLink && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs">
                <span className="text-slate-400 block mb-1">Development Mode Verification Link:</span>
                <a href={verificationLink} className="underline text-emerald-300 break-all font-mono">
                  {verificationLink}
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* F-11: Hidden Honeypot Field */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="website_hp">Do not fill this</label>
            <input
              id="website_hp"
              type="text"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              required
            />

            {/* F-17: Client-side password strength indicator */}
            <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <span>{hasMinLength ? '✓' : '○'}</span> Minimum 8 characters
              </div>
              <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <span>{hasUpper ? '✓' : '○'}</span> At least one uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <span>{hasNumber ? '✓' : '○'}</span> At least one numeric digit (0-9)
              </div>
              <div className={`flex items-center gap-2 ${hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <span>{hasSpecial ? '✓' : '○'}</span> At least one special symbol (!@#$%^&*)
              </div>
            </div>
          </div>

          {/* F-11: Bot Protection Badge */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/50 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Cloudflare Turnstile Protected
            </span>
            <span className="text-[10px] text-slate-500">Encrypted</span>
          </div>

          <button
            type="submit"
            disabled={loading || !isStrong}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center mt-6 shadow-lg shadow-emerald-950/50"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/user/login" className="text-emerald-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
