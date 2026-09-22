'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import OfflineIndicator from '@/components/OfflineIndicator';
import DesignRevisionCanvas from '@/components/DesignRevisionCanvas';

export default function ClientRevisionsPage() {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, projRes] = await Promise.all([
        fetch('/api/revisions'),
        fetch('/api/projects'),
      ]);

      if (revRes.ok) {
        const d = await revRes.json();
        setRevisions(d.revisions || []);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
        if (d.projects && d.projects.length > 0) {
          setSelectedProjectId(d.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load revisions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveRevision = async (id: string) => {
    try {
      const res = await fetch(`/api/revisions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to approve revision:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <OfflineIndicator onRefresh={fetchData} />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Visual Design Revisions
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationBell />
            <button
              onClick={() => setShowCanvas(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Request Revision
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Design Feedback & Markup
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review design deliverables and submit visual annotations directly to our creative team.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
            Loading design revisions...
          </div>
        ) : revisions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{rev.id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-medium text-slate-300">{rev.designName}</span>
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
                      {rev.priority} Priority
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold self-start sm:self-auto ${
                      rev.status === 'Resolved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : rev.status === 'Awaiting Client'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : rev.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {rev.description}
                </p>

                {rev.annotations && rev.annotations.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono">
                      {rev.annotations.length} visual coordinate pins
                    </span>
                  </div>
                )}

                {/* Awaiting Client Approval Action */}
                {rev.status === 'Awaiting Client' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-200">
                      Our design team marked this revision as completed for your verification.
                    </span>
                    <button
                      onClick={() => handleApproveRevision(rev.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Resolution
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Project ID: {rev.projectId}</span>
                  <span>Requested: {new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Revisions Requested</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Want to adjust colors, layouts, or copy? Click &ldquo;Request Revision&rdquo; to pinpoint exact changes.
            </p>
          </div>
        )}
      </main>

      {/* Revision Canvas Modal */}
      {showCanvas && (
        <DesignRevisionCanvas
          projectId={selectedProjectId}
          designName="Deliverable Review"
          onClose={() => setShowCanvas(false)}
          onRevisionSubmitted={() => {
            setShowCanvas(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
