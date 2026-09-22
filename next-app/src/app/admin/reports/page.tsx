'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Filter,
  DollarSign,
  FileText,
  Smile,
  Bot,
  Download,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'funnel' | 'forecast' | 'monthly' | 'satisfaction' | 'automation'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [surveysList, setSurveysList] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  // Generator form
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [reportMonth, setReportMonth] = useState('September');
  const [reportYear, setReportYear] = useState('2026');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchAllReportsData = async () => {
    setLoading(true);
    try {
      const [funnelRes, forecastRes, reportsRes, projRes] = await Promise.all([
        fetch('/api/admin/reports/funnel'),
        fetch('/api/admin/reports/forecast'),
        fetch('/api/reports/monthly'),
        fetch('/api/admin/projects'),
      ]);

      if (funnelRes.ok) setFunnelData(await funnelRes.json());
      if (forecastRes.ok) setForecastData(await forecastRes.json());
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReportsList(d.reports || []);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setProjectsList(d.projects || []);
        if (d.projects && d.projects.length > 0) {
          setSelectedProjectId(d.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching admin reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReportsData();
  }, []);

  const handleGeneratePdf = async () => {
    if (!selectedProjectId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/reports/monthly/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          month: reportMonth,
          year: reportYear,
          regenerate: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report-${selectedProjectId}-${reportMonth}-${reportYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setFeedback({ text: 'Report generated and downloaded successfully.', type: 'success' });
      fetchAllReportsData();
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailReport = async () => {
    if (!selectedProjectId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/reports/monthly/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          month: reportMonth,
          year: reportYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to email report');

      setFeedback({ text: data.message || 'Report emailed to client.', type: 'success' });
      fetchAllReportsData();
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      {/* Top Breadcrumb & Title */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/admin/dashboard" className="hover:text-slate-200">
                Admin
              </Link>
              <span>/</span>
              <span className="text-blue-400">Executive Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Reports & Business Intelligence
            </h1>
          </div>
          <button
            onClick={fetchAllReportsData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-medium text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 mt-6 pb-2">
          {[
            { id: 'overview', label: 'Business Overview', icon: TrendingUp },
            { id: 'funnel', label: 'Conversion Funnel', icon: Filter },
            { id: 'forecast', label: 'Revenue Forecast', icon: DollarSign },
            { id: 'monthly', label: 'Monthly Client Reports', icon: FileText },
            { id: 'satisfaction', label: 'Satisfaction Surveys', icon: Smile },
            { id: 'automation', label: 'Automation Monitoring', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-medium text-slate-400">Total Leads in Pipeline</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {funnelData?.summary?.totalLeads || 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Inquiries & Contact submissions</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-medium text-slate-400">Confirmed Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                  ₹{(forecastData?.confirmedRevenue || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-emerald-500/80 mt-1">From closed paid invoices</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-medium text-slate-400">Weighted Forecast</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-1">
                  ₹{(forecastData?.totalEstimatedForecast || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-blue-400/80 mt-1">Estimated forecast</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-medium text-slate-400">Conversion Rate</p>
                <h3 className="text-2xl font-bold text-indigo-400 mt-1">
                  {funnelData?.summary?.overallConversionRate || 0}%
                </h3>
                <p className="text-[11px] text-indigo-400/80 mt-1">Lead to paid client</p>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-semibold text-white">Generate Monthly Client Reports</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compile monthly progress, 7-stage visual timeline, and updates into real verified PDF reports.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('monthly')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                Report Generator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* CONVERSION FUNNEL TAB */}
        {activeTab === 'funnel' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Real Conversion Funnel</h3>
                <p className="text-xs text-slate-400">
                  Calculated from live Google Sheets inquiries, proposals, and invoices.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Overall Conversion:{' '}
                <strong className="text-emerald-400">
                  {funnelData?.summary?.overallConversionRate || 0}%
                </strong>
              </div>
            </div>

            {funnelData?.funnelSteps ? (
              <div className="space-y-4">
                {funnelData.funnelSteps.map((step: any, idx: number) => (
                  <div
                    key={step.stage}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{step.label}</h4>
                        <p className="text-xs text-slate-500">Stage: {step.stage}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-100">{step.count}</div>
                        <div className="text-[10px] text-slate-500">Records</div>
                      </div>
                      <div className="w-24 text-right">
                        <div className="text-sm font-semibold text-blue-400">
                          {step.percentageOfTotal}%
                        </div>
                        <div className="text-[10px] text-slate-500">Of Total</div>
                      </div>
                      {step.dropoffRate > 0 && (
                        <div className="w-20 text-right">
                          <div className="text-xs font-semibold text-rose-400">
                            -{step.dropoffRate}%
                          </div>
                          <div className="text-[10px] text-slate-500">Drop-off</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">Loading funnel data...</div>
            )}
          </div>
        )}

        {/* REVENUE FORECAST TAB */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Disclaimer:</strong> {forecastData?.disclaimer || 'Estimated forecast only. Not guaranteed revenue.'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-slate-400">Confirmed Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-2">
                  ₹{(forecastData?.confirmedRevenue || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Paid and collected revenue</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-slate-400">Pipeline Deal Value</p>
                <h3 className="text-2xl font-bold text-slate-200 mt-2">
                  ₹{(forecastData?.pipelineRevenue || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active proposals ({forecastData?.activeProposalsCount || 0} deals)
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-slate-400">Weighted Estimated Forecast</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-2">
                  ₹{(forecastData?.totalEstimatedForecast || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Next month outlook: ₹{(forecastData?.nextMonthForecast || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Configurable Stage Probabilities */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-3">Stage Weighted Probabilities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {forecastData?.probabilities &&
                  Object.entries(forecastData.probabilities).map(([stage, prob]: any) => (
                    <div key={stage} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">{stage}</div>
                      <div className="text-sm font-bold text-blue-300 mt-1">
                        {Math.round(prob * 100)}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY CLIENT REPORTS TAB */}
        {activeTab === 'monthly' && (
          <div className="space-y-6">
            {/* Generate New Report Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-1">Generate Monthly Client PDF</h3>
              <p className="text-xs text-slate-400 mb-6">
                Produces a real binary PDF report with starting/ending progress, 7-stage pipeline visual, work updates, and deliverables.
              </p>

              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium mb-4 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Report Month</label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Report Year</label>
                  <input
                    type="text"
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGeneratePdf}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Generate & Download PDF
                </button>
                <button
                  onClick={handleEmailReport}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Email to Client
                </button>
              </div>
            </div>

            {/* Generated Reports History */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Report Generation History</h4>
              {reportsList.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {reportsList.map((r) => (
                    <div key={r.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">
                          {r.projectName} — {r.month} {r.year}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Client: {r.clientName} ({r.clientEmail}) • Created: {new Date(r.generatedAt || Date.now()).toLocaleDateString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'Sent'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">{r.fileName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No monthly reports generated yet.</p>
              )}
            </div>
          </div>
        )}

        {/* SATISFACTION SURVEYS TAB */}
        {activeTab === 'satisfaction' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Client Satisfaction Telemetry</h3>
            <p className="text-xs text-slate-400 mb-6">
              Automated survey triggers executed when projects reach Launch/Completed status.
            </p>
            <div className="p-8 text-center text-xs text-slate-500">
              Surveys are automatically generated and logged to SatisfactionSurveys upon project completion.
            </div>
          </div>
        )}

        {/* AUTOMATION MONITORING TAB */}
        {activeTab === 'automation' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Scheduled Jobs & Automation Engine</h3>
            <p className="text-xs text-slate-400 mb-6">
              Idempotent background services executing invoice reminders, deadline alerts, lead follow-ups, and monthly reports.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Daily Automation Job</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Runs lead follow-ups (2d), invoice reminders (-3d, 0d, +3d), deadline alerts (7d), and abandoned contact recovery.
                </p>
                <div className="mt-3 text-[11px] text-slate-500 font-mono">
                  Endpoint: /api/cron/daily
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Monthly Report Automation</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300">
                    Scheduled
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Generates and emails PDF reports on 1st of month for active projects.
                </p>
                <div className="mt-3 text-[11px] text-slate-500 font-mono">
                  Endpoint: /api/cron/monthly
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
