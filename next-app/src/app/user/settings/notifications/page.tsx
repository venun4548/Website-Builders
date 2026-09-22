'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  Save,
  Loader2,
  Lock,
} from 'lucide-react';
import { usePushNotifications } from '@/lib/usePushNotifications';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ClientNotificationPreferencesPage() {
  const { isSupported, isSubscribed, subscribe, unsubscribe, loading: pushLoading } = usePushNotifications();

  // Email toggles
  const [emailProjectUpdates, setEmailProjectUpdates] = useState(true);
  const [emailInvoiceReminders, setEmailInvoiceReminders] = useState(true);
  const [emailPaymentConfirmations, setEmailPaymentConfirmations] = useState(true);
  const [emailMaintenanceUpdates, setEmailMaintenanceUpdates] = useState(true);
  const [emailRevisionUpdates, setEmailRevisionUpdates] = useState(true);
  const [emailSurveys, setEmailSurveys] = useState(true);

  // Push toggles
  const [pushProjectUpdates, setPushProjectUpdates] = useState(true);
  const [pushMessages, setPushMessages] = useState(true);
  const [pushInvoiceAlerts, setPushInvoiceAlerts] = useState(true);
  const [pushMaintenance, setPushMaintenance] = useState(true);
  const [pushRevisions, setPushRevisions] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wb_client_notif_prefs');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.emailProjectUpdates !== undefined) setEmailProjectUpdates(p.emailProjectUpdates);
        if (p.emailInvoiceReminders !== undefined) setEmailInvoiceReminders(p.emailInvoiceReminders);
        if (p.emailPaymentConfirmations !== undefined) setEmailPaymentConfirmations(p.emailPaymentConfirmations);
        if (p.emailMaintenanceUpdates !== undefined) setEmailMaintenanceUpdates(p.emailMaintenanceUpdates);
        if (p.emailRevisionUpdates !== undefined) setEmailRevisionUpdates(p.emailRevisionUpdates);
        if (p.emailSurveys !== undefined) setEmailSurveys(p.emailSurveys);

        if (p.pushProjectUpdates !== undefined) setPushProjectUpdates(p.pushProjectUpdates);
        if (p.pushMessages !== undefined) setPushMessages(p.pushMessages);
        if (p.pushInvoiceAlerts !== undefined) setPushInvoiceAlerts(p.pushInvoiceAlerts);
        if (p.pushMaintenance !== undefined) setPushMaintenance(p.pushMaintenance);
        if (p.pushRevisions !== undefined) setPushRevisions(p.pushRevisions);
      } catch (e) {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const prefs = {
      emailProjectUpdates,
      emailInvoiceReminders,
      emailPaymentConfirmations,
      emailMaintenanceUpdates,
      emailRevisionUpdates,
      emailSurveys,
      pushProjectUpdates,
      pushMessages,
      pushInvoiceAlerts,
      pushMaintenance,
      pushRevisions,
    };
    localStorage.setItem('wb_client_notif_prefs', JSON.stringify(prefs));
    setSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" /> Notification Preferences
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Notification & Alert Channels
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose what project milestones, invoices, and updates are delivered via Email and Web Push.
          </p>
        </div>

        {savedMessage && (
          <div
            role="status"
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Notification preferences updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Web Push Master Toggle */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    Browser Web Push Notifications
                  </h3>
                  <p className="text-xs text-slate-400">
                    Receive real-time alerts even when the portal is closed.
                  </p>
                </div>
              </div>

              {isSupported ? (
                <button
                  type="button"
                  disabled={pushLoading}
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    isSubscribed
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-rose-600/20 hover:text-rose-300 hover:border-rose-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  }`}
                >
                  {pushLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubscribed ? 'Notifications Enabled (Unsubscribe)' : 'Enable Browser Push'}
                </button>
              ) : (
                <span className="text-xs text-slate-500">Not supported on this browser</span>
              )}
            </div>
          </div>

          {/* Email Notification Channels */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" /> Email Notifications
            </h3>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Project Stage & Progress Updates</div>
                  <div className="text-slate-500">Receive an email when new milestones are completed</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailProjectUpdates}
                  onChange={(e) => setEmailProjectUpdates(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Invoice Due Date Reminders</div>
                  <div className="text-slate-500">Alerts sent 3 days before and on due date</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailInvoiceReminders}
                  onChange={(e) => setEmailInvoiceReminders(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    Payment Receipts & Tax Invoices
                    <Lock className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-slate-500">Mandatory transactional payment confirmations</div>
                </div>
                <input type="checkbox" checked={true} disabled className="w-4 h-4 accent-slate-600 opacity-60" />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Maintenance Request Updates</div>
                  <div className="text-slate-500">Quotes, engineering assignments, and completions</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailMaintenanceUpdates}
                  onChange={(e) => setEmailMaintenanceUpdates(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Visual Revision Status Alerts</div>
                  <div className="text-slate-500">Feedback resolutions awaiting your approval</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailRevisionUpdates}
                  onChange={(e) => setEmailRevisionUpdates(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Client Satisfaction Surveys</div>
                  <div className="text-slate-500">Invitations to review completed projects</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailSurveys}
                  onChange={(e) => setEmailSurveys(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
