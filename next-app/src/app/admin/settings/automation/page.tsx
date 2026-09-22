'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Sliders,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function AdminAutomationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Settings states
  const [invoiceDaysBefore, setInvoiceDaysBefore] = useState('3');
  const [invoiceDaysAfter, setInvoiceDaysAfter] = useState('3');
  const [deadlineDaysBefore, setDeadlineDaysBefore] = useState('7');
  const [leadFollowUpDays, setLeadFollowUpDays] = useState('2');
  const [abandonedDelayHours, setAbandonedDelayHours] = useState('24');
  const [monthlyReportDay, setMonthlyReportDay] = useState('1');

  // Stage Probabilities
  const [probNew, setProbNew] = useState('10');
  const [probContacted, setProbContacted] = useState('25');
  const [probQualified, setProbQualified] = useState('40');
  const [probProposal, setProbProposal] = useState('60');
  const [probNegotiation, setProbNegotiation] = useState('80');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        if (s.invoice_days_before) setInvoiceDaysBefore(s.invoice_days_before);
        if (s.invoice_days_after) setInvoiceDaysAfter(s.invoice_days_after);
        if (s.deadline_days_before) setDeadlineDaysBefore(s.deadline_days_before);
        if (s.lead_followup_days) setLeadFollowUpDays(s.lead_followup_days);
        if (s.abandoned_delay_hours) setAbandonedDelayHours(s.abandoned_delay_hours);
        if (s.monthly_report_day) setMonthlyReportDay(s.monthly_report_day);

        if (s.forecast_probabilities) {
          try {
            const p = JSON.parse(s.forecast_probabilities);
            if (p.New !== undefined) setProbNew(String(p.New * 100));
            if (p.Contacted !== undefined) setProbContacted(String(p.Contacted * 100));
            if (p.Qualified !== undefined) setProbQualified(String(p.Qualified * 100));
            if (p.Proposal !== undefined) setProbProposal(String(p.Proposal * 100));
            if (p.Negotiation !== undefined) setProbNegotiation(String(p.Negotiation * 100));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to load automation settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const probabilitiesObj = {
      New: Number(probNew) / 100,
      Contacted: Number(probContacted) / 100,
      Qualified: Number(probQualified) / 100,
      Proposal: Number(probProposal) / 100,
      Negotiation: Number(probNegotiation) / 100,
      Won: 1.0,
      Accepted: 1.0,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            invoice_days_before: invoiceDaysBefore,
            invoice_days_after: invoiceDaysAfter,
            deadline_days_before: deadlineDaysBefore,
            lead_followup_days: leadFollowUpDays,
            abandoned_delay_hours: abandonedDelayHours,
            monthly_report_day: monthlyReportDay,
            forecast_probabilities: JSON.stringify(probabilitiesObj),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setMessage({ text: 'Automation settings saved successfully to Google Sheets.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-blue-400" /> Automation Engine Settings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure scheduled job intervals, email triggers, and weighted revenue forecasting probabilities.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Reminder Delays */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Automation Timing & Delays
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invoice Due Reminder (Days Before)
                </label>
                <input
                  type="number"
                  value={invoiceDaysBefore}
                  onChange={(e) => setInvoiceDaysBefore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invoice Overdue Reminder (Days After)
                </label>
                <input
                  type="number"
                  value={invoiceDaysAfter}
                  onChange={(e) => setInvoiceDaysAfter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Deadline Alert (Days Before)
                </label>
                <input
                  type="number"
                  value={deadlineDaysBefore}
                  onChange={(e) => setDeadlineDaysBefore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lead Inactivity Follow-Up Delay (Days)
                </label>
                <input
                  type="number"
                  value={leadFollowUpDays}
                  onChange={(e) => setLeadFollowUpDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Abandoned Contact Form Recovery (Hours Delay)
                </label>
                <input
                  type="number"
                  value={abandonedDelayHours}
                  onChange={(e) => setAbandonedDelayHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monthly Report Generation Day of Month
                </label>
                <input
                  type="number"
                  value={monthlyReportDay}
                  onChange={(e) => setMonthlyReportDay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Forecast Stage Probabilities */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Revenue Forecast Stage Probabilities (%)
            </h3>
            <p className="text-xs text-slate-400">
              Configure weighted percentages used by the Revenue Forecast algorithm:
              <br />
              <code className="text-blue-300">Forecast = Confirmed Revenue + Σ(Proposal Amount × Stage Probability)</code>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">New (%)</label>
                <input
                  type="number"
                  value={probNew}
                  onChange={(e) => setProbNew(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Contacted (%)</label>
                <input
                  type="number"
                  value={probContacted}
                  onChange={(e) => setProbContacted(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Qualified (%)</label>
                <input
                  type="number"
                  value={probQualified}
                  onChange={(e) => setProbQualified(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Proposal (%)</label>
                <input
                  type="number"
                  value={probProposal}
                  onChange={(e) => setProbProposal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Negotiation (%)</label>
                <input
                  type="number"
                  value={probNegotiation}
                  onChange={(e) => setProbNegotiation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold"
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Automation Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
