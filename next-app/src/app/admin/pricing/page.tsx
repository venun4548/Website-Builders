'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  MoveUp,
  MoveDown,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface PricingTier {
  id: string;
  tier: string;
  price: number | string;
  billing: string;
  description: string;
  features: string[];
  highlighted: 'true' | 'false';
  displayOrder: number;
}

export default function AdminPricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [tierName, setTierName] = useState('Professional');
  const [price, setPrice] = useState('29999');
  const [billing, setBilling] = useState('one-time');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [highlighted, setHighlighted] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/admin/pricing');
      if (res.ok) {
        const data = await res.json();
        setTiers(data.pricing || []);
      }
    } catch (err) {
      console.error('Failed to load pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const openCreateModal = () => {
    setEditingTier(null);
    setTierName('Professional');
    setPrice('29999');
    setBilling('one-time');
    setDescription('');
    setFeaturesText('Custom UI/UX Design System\nFull CMS Integration\nSEO & Analytics Setup\n3 Months Priority Support');
    setHighlighted(false);
    setShowModal(true);
  };

  const openEditModal = (tier: PricingTier) => {
    setEditingTier(tier);
    setTierName(tier.tier);
    setPrice(String(tier.price));
    setBilling(tier.billing || 'one-time');
    setDescription(tier.description || '');
    setFeaturesText(Array.isArray(tier.features) ? tier.features.join('\n') : '');
    setHighlighted(tier.highlighted === 'true');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;
    try {
      const res = await fetch(`/api/admin/pricing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTiers((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Delete pricing error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName || !price || !description) return;

    const featuresArray = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    try {
      setSaving(true);
      if (editingTier) {
        const res = await fetch(`/api/admin/pricing/${editingTier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: tierName,
            price: Number(price),
            billing,
            description,
            features: featuresArray,
            highlighted: highlighted ? 'true' : 'false',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTiers((prev) =>
            prev.map((t) =>
              t.id === editingTier.id ? { ...data.tier, features: featuresArray } : t
            )
          );
          setShowModal(false);
        }
      } else {
        const res = await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: tierName,
            price: Number(price),
            billing,
            description,
            features: featuresArray,
            highlighted,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTiers((prev) => [...prev, { ...data.tier, features: featuresArray }]);
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error('Save pricing error:', err);
    } finally {
      setSaving(false);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tiers.length) return;

    const updated = [...tiers];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const orderPayload = updated.map((tier, idx) => ({
      id: tier.id,
      displayOrder: idx + 1,
    }));

    setTiers(updated.map((tier, idx) => ({ ...tier, displayOrder: idx + 1 })));

    try {
      await fetch('/api/admin/pricing/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderPayload }),
      });
    } catch (err) {
      console.error('Reorder error:', err);
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
              <a href="/admin/pricing" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Dynamic Pricing CMS</h1>
            <p className="text-xs text-slate-400 mt-1">
              Live service tiers and engineering packages stored in Google Sheets
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Package
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((t, idx) => (
              <div
                key={t.id}
                className={`bg-slate-900/70 border rounded-3xl p-6 shadow-xl flex flex-col justify-between relative ${
                  t.highlighted === 'true'
                    ? 'border-blue-500/80 shadow-blue-500/10'
                    : 'border-slate-800'
                }`}
              >
                {t.highlighted === 'true' && (
                  <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">{t.tier}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveOrder(idx, 'down')}
                        disabled={idx === tiers.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{t.description}</p>

                  <div className="mt-4 pb-4 border-b border-slate-800">
                    <span className="text-3xl font-black text-white">
                      ₹{Number(t.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ {t.billing}</span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {Array.isArray(t.features) &&
                      t.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingTier ? 'Edit Pricing Package' : 'New Pricing Package'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">Changes update the public pricing tables instantly.</p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="e.g. Starter"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Price in INR</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29999"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Billing Frequency</label>
                <select
                  value={billing}
                  onChange={(e) => setBilling(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="one-time">one-time</option>
                  <option value="monthly">monthly</option>
                  <option value="quarterly">quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Brief Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Perfect for established businesses needing dynamic features."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Features (one per line)
                </label>
                <textarea
                  rows={5}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="highlightCheck"
                  checked={highlighted}
                  onChange={(e) => setHighlighted(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800"
                />
                <label htmlFor="highlightCheck" className="text-xs text-slate-300 font-medium">
                  Highlight as &quot;Most Popular&quot; Tier
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
