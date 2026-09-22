'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, Filter, CheckCircle2 } from 'lucide-react';

export default function ConversionFunnelPage() {
  const [funnelData, setFunnelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchFunnel = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/reports/funnel';
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        setFunnelData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load funnel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel();
  }, []);

  const exportCsv = () => {
    if (!funnelData || !funnelData.funnelSteps) return;
    const headers = ['Stage', 'Label', 'Count', 'PercentageOfTotal', 'DropoffRate'];
    const rows = funnelData.funnelSteps.map((s: any) => [
      s.stage,
      `"${s.label}"`,
      s.count,
      `${s.percentageOfTotal}%`,
      `${s.dropoffRate}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `conversion-funnel-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Executive Reports
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Lead-to-Client Conversion Funnel
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real telemetry calculated from Google Sheets inquiries, proposals, and invoices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={loading || !funnelData}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold rounded-xl text-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={fetchFunnel}
              disabled={loading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter by Date:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchFunnel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Funnel Visual Stack */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="space-y-4">
            {funnelData?.funnelSteps?.map((step: any, idx: number) => {
              const widthPct = Math.max(15, step.percentageOfTotal);
              return (
                <div key={step.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-blue-400">
                        {idx + 1}
                      </span>
                      {step.label}
                    </div>
                    <div className="text-slate-400 flex items-center gap-3">
                      <span className="font-mono text-white font-bold">{step.count} records</span>
                      <span className="text-blue-400 font-semibold">{step.percentageOfTotal}%</span>
                      {step.dropoffRate > 0 && (
                        <span className="text-rose-400 text-[11px]">(-{step.dropoffRate}%)</span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-7 rounded-lg overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-md transition-all duration-500 flex items-center px-2 text-[10px] font-bold text-white shadow-sm"
                    >
                      {step.stage}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Overall Conversion (Lead → Paid Client):</span>
            <span className="text-base font-bold text-emerald-400">
              {funnelData?.summary?.overallConversionRate || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
