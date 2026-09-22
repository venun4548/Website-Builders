'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';

export default function AdminMaintenancePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteValue, setQuoteValue] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdate = async (id: string, updates: any) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to update maintenance request:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveQuote = (id: string) => {
    handleUpdate(id, {
      estimatedCost: Number(quoteValue),
      status: 'Quoted',
      clientApproval: 'Pending',
    });
    setEditingQuoteId(null);
    setQuoteValue('');
  };

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
              <Wrench className="w-6 h-6 text-blue-400" /> Post-Launch Maintenance Control
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review client enhancement requests, quote engineering costs, assign staff, and verify completion.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
            Loading maintenance requests...
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{req.id}</span>
                    <span className="text-xs font-semibold text-white">{req.clientName}</span>
                    {req.clientEmail && (
                      <span className="text-[11px] text-slate-400 font-normal">({req.clientEmail})</span>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{req.category}</span>
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

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={req.status}
                      disabled={updatingId === req.id}
                      onChange={(e) => handleUpdate(req.id, { status: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Quoted">Quoted</option>
                      <option value="Awaiting Approval">Awaiting Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100">{req.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {/* Quoting and Assignment Row */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400">Estimated Cost:</span>{' '}
                      {editingQuoteId === req.id ? (
                        <div className="inline-flex items-center gap-1.5 ml-2">
                          <input
                            type="number"
                            value={quoteValue}
                            onChange={(e) => setQuoteValue(e.target.value)}
                            placeholder="Amount in ₹"
                            className="w-24 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs text-white"
                          />
                          <button
                            onClick={() => handleSaveQuote(req.id)}
                            className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-white ml-1">
                          {req.estimatedCost ? `₹${Number(req.estimatedCost).toLocaleString('en-IN')}` : 'Unquoted'}
                          <button
                            onClick={() => {
                              setEditingQuoteId(req.id);
                              setQuoteValue(req.estimatedCost || '');
                            }}
                            className="ml-2 text-blue-400 hover:text-blue-300 text-[11px]"
                          >
                            [Edit Quote]
                          </button>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400">Client Approval:</span>{' '}
                      <span
                        className={`font-semibold ml-1 ${
                          req.clientApproval === 'Approved'
                            ? 'text-emerald-400'
                            : req.clientApproval === 'Rejected'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {req.clientApproval || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Assigned Staff:</span>
                    <input
                      type="text"
                      defaultValue={req.assignedStaffName || ''}
                      onBlur={(e) => handleUpdate(req.id, { assignedStaffName: e.target.value })}
                      placeholder="Assign staff member..."
                      className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Project ID: {req.projectId}</span>
                  <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
            No maintenance requests found.
          </div>
        )}
      </div>
    </div>
  );
}
