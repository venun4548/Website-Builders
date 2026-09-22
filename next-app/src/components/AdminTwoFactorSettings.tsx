'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, QrCode, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface AdminTwoFactorSettingsProps {
  initialEnabled?: boolean;
}

export default function AdminTwoFactorSettings({
  initialEnabled = false,
}: AdminTwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    manualKey: string;
    qrCodeUrl: string;
    setupSecret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startSetup = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start 2FA setup');
      setSetupData(data);
      setShowSetupModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !verificationCode) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData.setupSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify code');

      setIsEnabled(true);
      setShowSetupModal(false);
      setSetupData(null);
      setVerificationCode('');
      setSuccess('Two-Factor Authentication has been successfully enabled.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');

      setIsEnabled(false);
      setShowDisableModal(false);
      setDisablePassword('');
      setSuccess('Two-Factor Authentication has been disabled.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isEnabled ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Two-Factor Authentication (TOTP)
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Require a 6-digit code from Google Authenticator or Microsoft Authenticator when logging in.
            </p>
          </div>
        </div>

        <div>
          {isEnabled ? (
            <button
              onClick={() => {
                setError(null);
                setShowDisableModal(true);
              }}
              className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={startSetup}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {success && (
        <div
          role="status"
          className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
        >
          {success}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium"
        >
          {error}
        </div>
      )}

      {/* Setup 2FA Modal */}
      {showSetupModal && setupData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-2fa-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowSetupModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <QrCode className="w-5 h-5 text-blue-400" />
              <h4 id="setup-2fa-title" className="text-base font-semibold text-slate-100">
                Setup Authenticator App
              </h4>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Scan this QR code in Google Authenticator, Authy, or Microsoft Authenticator:
            </p>

            <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner mb-4">
              <img
                src={setupData.qrCodeUrl}
                alt="2FA QR Code"
                className="w-44 h-44 object-contain"
              />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-slate-400" />
                Manual Setup Key:
              </div>
              <code className="text-xs text-blue-300 select-all font-mono break-all">
                {setupData.manualKey}
              </code>
            </div>

            <form onSubmit={handleVerifyAndEnable}>
              <label
                htmlFor="verificationCodeInput"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Enter the 6-digit verification code:
              </label>
              <input
                id="verificationCodeInput"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Verify & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-2fa-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowDisableModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 id="disable-2fa-title" className="text-base font-semibold text-slate-100 mb-2">
              Disable Two-Factor Authentication
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Enter your current account password to confirm disabling two-factor authentication.
            </p>

            <form onSubmit={handleDisable2FA}>
              <label htmlFor="disablePasswordInput" className="block text-xs text-slate-300 mb-1">
                Account Password
              </label>
              <input
                id="disablePasswordInput"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !disablePassword}
                  className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Disable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
