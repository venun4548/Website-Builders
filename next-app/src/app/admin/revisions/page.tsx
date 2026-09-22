'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';

export default function AdminRevisionsPage() {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/revisions');
      if (res.ok) {
        const d = await res.json();
        setRevisions(d.revisions || []);
      }
    } catch (err) {
      console.error('Failed to load revisions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/revisions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRevisions();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = revisions.filter((r) => {
    if (selectedPriority !== 'ALL' && r.priority !== selectedPriority) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-blue-400" /> Client Revision Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track client design deliverable markup, coordinate pins, and milestone resolutions.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Client">Awaiting Client</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <span className="text-slate-500 ml-auto">
            Showing {filtered.length} of {revisions.length} records
          </span>
        </div>

        {/* Revisions Table / Cards */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
            Loading revisions...
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{rev.id}</span>
                    <span className="text-xs font-semibold text-white">{rev.clientName}</span>
                    {rev.clientEmail && (
                      <span className="text-[11px] text-slate-400 font-normal">({rev.clientEmail})</span>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{rev.designName}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rev.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : rev.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {rev.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={rev.status}
                      disabled={updatingId === rev.id}
                      onChange={(e) => handleStatusChange(rev.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Review">In Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Client">Awaiting Client</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{rev.description}</p>

                {rev.annotations && rev.annotations.length > 0 && (
                  <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-wrap gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-blue-400">
                      {rev.annotations.length} Normalized Pins:
                    </span>
                    {rev.annotations.map((a: any, idx: number) => (
                      <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        #{idx + 1} {a.type} (x: {a.x}, y: {a.y})
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Project ID: {rev.projectId}</span>
                  <span>Submitted: {new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
            No revisions match your selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
