'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  LayoutGrid,
  List,
  Search,
  Plus,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  X,
  Loader2,
  Sparkles,
  Phone,
  Mail,
  DollarSign,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface LeadNote {
  id: string;
  authorEmail: string;
  note: string;
  timestamp: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  budget?: string;
  message?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  assignedTo?: string;
  convertedProjectId?: string;
  createdAt: string;
  notes?: LeadNote[];
}

const STAGES: ('New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost')[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');

  // Slide-over drawer
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertTier, setConvertTier] = useState('Professional');
  const [convertProjectName, setConvertProjectName] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage }),
      });

      if (res.ok) {
        const data = await res.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: data.lead.status } : l))
        );
        if (activeLead && activeLead.id === leadId) {
          setActiveLead((prev) => (prev ? { ...prev, status: data.lead.status } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !newNote.trim()) return;

    try {
      setSavingNote(true);
      const res = await fetch(`/api/admin/leads/${activeLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedNotes = [...(activeLead.notes || []), data.note];
        setActiveLead({ ...activeLead, notes: updatedNotes });
        setLeads((prev) =>
          prev.map((l) => (l.id === activeLead.id ? { ...l, notes: updatedNotes } : l))
        );
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;

    try {
      setConverting(true);
      const res = await fetch(`/api/admin/leads/${activeLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: convertTier,
          projectName: convertProjectName.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert('Lead successfully converted to Project!');
        setLeads((prev) =>
          prev.map((l) =>
            l.id === activeLead.id ? { ...l, status: 'Won', convertedProjectId: data.projectId } : l
          )
        );
        setShowConvertModal(false);
        setActiveLead(null);
      }
    } catch (err) {
      console.error('Convert lead error:', err);
    } finally {
      setConverting(false);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.service?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              WB ADMIN CONSOLE
            </span>
            <div className="hidden lg:flex items-center gap-4 text-xs font-semibold">
              <a href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/admin/projects" className="text-slate-400 hover:text-white transition-colors">
                Projects
              </a>
              <a href="/admin/invoices" className="text-slate-400 hover:text-white transition-colors">
                Invoices
              </a>
              <a href="/admin/leads" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
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

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex flex-col">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">CRM Lead Pipeline</h1>
            <p className="text-xs text-slate-400 mt-1">
              Capture inbound inquiries from website contact submissions into Google Sheets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, or service..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div className="flex-1 overflow-x-auto pb-6">
            <div className="flex gap-4 min-w-[1400px]">
              {STAGES.map((stage) => {
                const stageLeads = filteredLeads.filter((l) => l.status === stage);

                return (
                  <div
                    key={stage}
                    className="w-64 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col max-h-[750px] shadow-sm"
                  >
                    <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
                      <span className="text-xs font-bold text-slate-200">{stage}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="flex-1 p-3 overflow-y-auto space-y-3">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => {
                            setActiveLead(lead);
                            setConvertProjectName(`${lead.name} Platform`);
                          }}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/60 transition-all cursor-pointer shadow-sm group hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                              {lead.name}
                            </span>
                            {lead.budget && (
                              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                                {lead.budget}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">{lead.email}</span>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                            <span className="bg-slate-900 px-2 py-0.5 rounded-md text-slate-300">
                              {lead.service || 'General'}
                            </span>
                            <span>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Lead Name</th>
                    <th className="py-4 px-6">Email & Phone</th>
                    <th className="py-4 px-6">Service</th>
                    <th className="py-4 px-6">Budget</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => {
                        setActiveLead(lead);
                        setConvertProjectName(`${lead.name} Platform`);
                      }}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-bold text-white">{lead.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-slate-200 block">{lead.email}</span>
                        <span className="text-[10px] text-slate-400">{lead.phone || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{lead.service || 'General'}</td>
                      <td className="py-4 px-6 font-mono text-emerald-400 font-semibold">
                        {lead.budget || 'Not specified'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Slide-Over Drawer */}
      {activeLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeLead.name}</h3>
                  <span className="text-xs text-slate-400">Created: {new Date(activeLead.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => setActiveLead(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Selector & Convert Button */}
              <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={activeLead.status}
                    onChange={(e) => handleStageChange(activeLead.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {activeLead.status !== 'Won' && (
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Convert to Active Project
                  </button>
                )}
              </div>

              {/* Lead Information */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <a href={`mailto:${activeLead.email}`} className="hover:underline">
                    {activeLead.email}
                  </a>
                </div>
                {activeLead.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>{activeLead.phone}</span>
                  </div>
                )}
                {activeLead.budget && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Budget: {activeLead.budget}</span>
                  </div>
                )}
                {activeLead.message && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Inquiry Message
                    </span>
                    <p className="text-slate-300 whitespace-pre-wrap">{activeLead.message}</p>
                  </div>
                )}
              </div>

              {/* Notes Timeline */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Internal Notes
                </h4>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {(!activeLead.notes || activeLead.notes.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No notes added yet.</p>
                  ) : (
                    activeLead.notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <span className="font-semibold text-slate-400">{note.authorEmail}</span>
                          <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal engineering or sales note..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Save Note'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Project Modal */}
      {showConvertModal && activeLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">Convert Lead to Project</h3>
            <p className="text-xs text-slate-400 mb-6">
              Create an active project and client portal account for <strong>{activeLead.name}</strong>.
            </p>

            <form onSubmit={handleConvertLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={convertProjectName}
                  onChange={(e) => setConvertProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Package Tier</label>
                <select
                  value={convertTier}
                  onChange={(e) => setConvertTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Starter">Starter (₹14,999)</option>
                  <option value="Professional">Professional (₹29,999)</option>
                  <option value="Enterprise">Enterprise (₹59,999)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {converting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm & Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
