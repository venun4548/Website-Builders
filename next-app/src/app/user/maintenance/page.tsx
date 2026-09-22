'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  DollarSign,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import OfflineIndicator from '@/components/OfflineIndicator';

export default function ClientMaintenancePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Content Update');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, projRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/projects'),
      ]);

      if (reqRes.ok) {
        const d = await reqRes.json();
        setRequests(d.requests || []);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
        if (d.projects && d.projects.length > 0) {
          setProjectId(d.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !projectId) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title,
          category,
          priority,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuoteApproval = async (id: string, approval: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientApproval: approval }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to respond to quote:', err);
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
              <Wrench className="w-4 h-4 text-blue-400" /> Maintenance & Support
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationBell />
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Post-Launch Website Maintenance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Submit content changes, security audits, design adjustments, or technical upgrades.
          </p>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
            Loading maintenance requests...
          </div>
        ) : requests.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{req.id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-medium text-slate-400">{req.category}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.priority === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : req.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold self-start sm:self-auto ${
                      req.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : req.status === 'Quoted' || req.status === 'Awaiting Approval'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : req.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100">{req.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {/* Quote Action Box */}
                {req.estimatedCost && req.clientApproval === 'Pending' && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" /> Cost Estimate Provided
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Our engineering team estimated <strong>₹{Number(req.estimatedCost).toLocaleString('en-IN')}</strong> for this scope.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuoteApproval(req.id, 'Approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                      >
                        Approve Quote
                      </button>
                      <button
                        onClick={() => handleQuoteApproval(req.id, 'Rejected')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Project ID: {req.projectId}</span>
                  <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Maintenance Requests Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Need updates, technical changes, or enhancements after launching? Create your first request above.
            </p>
          </div>
        )}
      </main>

      {/* New Request Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="modal-title" className="text-base font-bold text-white mb-1">
              New Maintenance Request
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Our engineering team will review your specifications and provide a schedule or quote.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Content Update">Content Update (Text, banners, media)</option>
                  <option value="Design Change">Design Change (UI styling, layouts)</option>
                  <option value="Bug Fix">Bug Fix (Defect, broken element)</option>
                  <option value="Technical Support">Technical Support (Integrations, APIs)</option>
                  <option value="Website Update">Website Update (New pages, modules)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Update pricing table"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Description & Scope
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the exact changes, URLs, and expected outcome..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
