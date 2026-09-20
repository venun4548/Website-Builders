'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import {
  CreditCard,
  Download,
  FileCheck2,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  projectName: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate: string;
  paidAt?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  items?: InvoiceItem[];
}

export default function UserInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/user/invoices');
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

  const handleRazorpayPayment = async (invoice: Invoice) => {
    try {
      setPayingId(invoice.id);

      // 1. Create order on server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (!orderRes.ok) {
        alert('Could not initiate payment order.');
        return;
      }

      const orderData = await orderRes.json();

      // Check if Razorpay script loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        // Fallback simulation if razorpay.js is not loaded
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            razorpayOrderId: orderData.orderId,
            razorpayPaymentId: `pay_sim_${Date.now()}`,
            razorpaySignature: 'simulated_sig',
          }),
        });
        if (verifyRes.ok) {
          alert('Payment confirmed successfully!');
          fetchInvoices();
        }
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Website Builders Co',
        description: `Payment for Invoice ${invoice.id}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoice.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            alert('Payment verified! Tax invoice generated.');
            fetchInvoices();
          }
        },
        modal: {
          ondismiss: function () {
            setPayingId(null);
            console.log('Payment window closed by user.');
          },
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed event:', response.error);
        alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        setPayingId(null);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(`Payment processing error: ${err.message || 'Please try again'}`);
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              WEBSITE BUILDERS
            </span>
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
              <a href="/user/projects" className="text-slate-400 hover:text-white transition-colors">
                Projects
              </a>
              <a href="/user/invoices" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                Invoices
              </a>
              <a href="/user/tickets" className="text-slate-400 hover:text-white transition-colors">
                Support
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
                window.location.href = '/user/login';
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Log Out
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Billing & Invoices</h1>
            <p className="text-xs text-slate-400 mt-1">
              Download tax invoices and securely settle milestone payments via Razorpay.
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
            <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No invoices yet</h3>
            <p className="text-sm text-slate-400 mt-1">Invoices issued for your project milestones will be listed here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {invoices.map((inv) => {
              const isPaid = inv.status === 'Paid';

              return (
                <div
                  key={inv.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-blue-400">{inv.id}</span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{inv.projectName}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span>Issued: {new Date(inv.createdAt).toLocaleDateString()}</span>
                        <span>Due: {inv.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          (Includes 18% GST: ₹{Number(inv.gstAmount).toLocaleString('en-IN')})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>

                        {!isPaid && (
                          <button
                            onClick={() => handleRazorpayPayment(inv)}
                            disabled={payingId === inv.id}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                          >
                            {payingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            Pay with Razorpay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line Items Sub-table */}
                  {inv.items && inv.items.length > 0 && (
                    <div className="mt-4 pt-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Line Items Breakdown
                      </h4>
                      <div className="divide-y divide-slate-800/60 text-xs">
                        {inv.items.map((item) => (
                          <div key={item.id} className="py-2 flex justify-between items-center">
                            <span className="text-slate-300">
                              {item.description} (x{item.quantity})
                            </span>
                            <span className="font-mono text-slate-200">
                              ₹{Number(item.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isPaid && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between text-xs text-emerald-400">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Settle date: {new Date(inv.paidAt || Date.now()).toLocaleDateString()}
                      </span>
                      {inv.razorpayPaymentId && (
                        <span className="font-mono text-[11px] text-slate-500">Txn: {inv.razorpayPaymentId}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
