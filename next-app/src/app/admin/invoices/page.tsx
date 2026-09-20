'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Send,
  Download,
  Loader2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // New Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Phase 1 Architecture & UI Design', quantity: 1, rate: 15000, amount: 15000 },
  ]);
  const [creating, setCreating] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSendInvoice = async (id: string) => {
    try {
      setSendingId(id);
      const res = await fetch(`/api/admin/invoices/${id}/send`, {
        method: 'POST',
      });

      if (res.ok) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: 'Sent' } : i))
        );
      }
    } catch (err) {
      console.error('Failed to send invoice:', err);
    } finally {
      setSendingId(null);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      }
      updated[index] = item;
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: 'Engineering Development Sprint', quantity: 1, rate: 10000, amount: 10000 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const grandTotal = subtotal + gst;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !clientEmail || items.length === 0) return;

    try {
      setCreating(true);
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: `proj_${Date.now()}`,
          projectName,
          clientName: clientName || 'Client',
          clientEmail,
          clientId: `client_${Date.now()}`,
          dueDate: dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
          items,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvoices((prev) => [data.invoice, ...prev]);
        setShowCreateModal(false);
        setProjectName('');
        setClientName('');
        setClientEmail('');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
    } finally {
      setCreating(false);
    }
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
              <a href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/admin/projects" className="text-slate-400 hover:text-white transition-colors">
                Projects
              </a>
              <a href="/admin/invoices" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Invoice Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Issue GST-compliant invoices and track Razorpay settlement telemetry
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
            <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No invoices issued yet</p>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Invoice #</th>
                    <th className="py-4 px-6">Project & Client</th>
                    <th className="py-4 px-6">Subtotal</th>
                    <th className="py-4 px-6">GST (18%)</th>
                    <th className="py-4 px-6">Total (INR)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Due Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-blue-400">{inv.id}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-white block">{inv.projectName}</span>
                        <span className="text-[11px] text-slate-400">
                          {inv.clientName} ({inv.clientEmail})
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        ₹{Number(inv.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        ₹{Number(inv.gstAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-white">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : inv.status === 'Sent'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-[11px]">{inv.dueDate}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                        {inv.status === 'Draft' && (
                          <button
                            onClick={() => handleSendInvoice(inv.id)}
                            disabled={sendingId === inv.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
                          >
                            {sendingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Send
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Create Tax Invoice</h3>
            <p className="text-xs text-slate-400 mb-6">
              Generate an Indian GST-compliant invoice with automatic 18% calculation.
            </p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Nexus SaaS Platform"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Line Items</span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-16 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                        className="w-24 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs text-right font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Calculation Summary */}
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs text-right">
                  <div>
                    <span className="text-slate-400">Subtotal:</span>{' '}
                    <span className="font-mono text-white font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">CGST (9%) + SGST (9%):</span>{' '}
                    <span className="font-mono text-slate-300">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-sm font-bold">
                    <span className="text-white">Grand Total:</span>{' '}
                    <span className="font-mono text-blue-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
