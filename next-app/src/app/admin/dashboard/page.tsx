'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Briefcase,
  Users,
  LifeBuoy,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import NotificationBell from '@/components/NotificationBell';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const { metrics, charts, recentActivity } = data || {
    metrics: {},
    charts: { revenueTimeline: [], projectDistribution: [], leadPipelineData: [] },
    recentActivity: [],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              WB ADMIN CONSOLE
            </span>
            <div className="hidden lg:flex items-center gap-4 text-xs font-semibold">
              <a href="/admin/dashboard" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                Dashboard
              </a>
              <a href="/admin/projects" className="text-slate-400 hover:text-white transition-colors">
                Projects
              </a>
              <a href="/admin/invoices" className="text-slate-400 hover:text-white transition-colors">
                Invoices
              </a>
              <a href="/admin/leads" className="text-slate-400 hover:text-white transition-colors">
                CRM Leads
              </a>
              <a href="/admin/tickets" className="text-slate-400 hover:text-white transition-colors">
                Tickets
              </a>
              <a href="/admin/portfolio" className="text-slate-400 hover:text-white transition-colors">
                Portfolio CMS
              </a>
              <a href="/admin/pricing" className="text-slate-400 hover:text-white transition-colors">
                Pricing CMS
              </a>
              <a href="/admin/audit-log" className="text-slate-400 hover:text-white transition-colors">
                Audit Log
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <a
              href="/api/auth/logout"
              onClick={async (e) => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/admin/access';
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Executive Analytics</h1>
            <p className="text-xs text-slate-400 mt-1">
              Google Sheets API v4 Real-Time Telemetry & Operations Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fiscal Year 2026
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Revenue */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-white">
                ₹{Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
                <TrendingUp className="w-3 h-3" /> ₹{Number(metrics.monthlyRevenue || 0).toLocaleString('en-IN')} this month
              </span>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Projects</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {metrics.activeProjects || 0}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {metrics.launchedProjects || 0} successfully launched
              </span>
            </div>
          </div>

          {/* Card 3: Lead Conversion */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CRM Conversion</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {metrics.conversionRate || 0}%
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {metrics.wonLeads || 0} won of {metrics.totalLeads || 0} total leads
              </span>
            </div>
          </div>

          {/* Card 4: Open Tickets */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <LifeBuoy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {metrics.openTickets || 0}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {metrics.resolvedTickets || 0} resolved to date
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Line Chart & Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue Trend Line Chart */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Revenue Trajectory</h3>
                <p className="text-xs text-slate-400">Monthly realized settlement values in INR</p>
              </div>
              <div className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                <Activity className="w-4 h-4" /> Real-Time
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.revenueTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#60a5fa', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Distribution Pie Chart */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Project Stages</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution across 6 development sprints</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.projectDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.projectDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
              {charts.projectDistribution.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-400 truncate">{item.name}:</span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Bar Chart & Recent Audit Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Lead Funnel Bar Chart */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">CRM Pipeline Funnel</h3>
            <p className="text-xs text-slate-400 mb-6">Lead count distribution from New to Won</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.leadPipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Audit Log */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">System Audit Stream</h3>
                <p className="text-xs text-slate-400">Live operational changes captured in Google Sheets</p>
              </div>
              <a
                href="/admin/audit-log"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="divide-y divide-slate-800/70 max-h-64 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No recent audit events.</p>
              ) : (
                recentActivity.map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className="text-slate-400 block text-[11px]">
                        {log.actorEmail} • {log.resourceName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
