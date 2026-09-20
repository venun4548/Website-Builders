'use client';

import React, { useState } from 'react';
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutDemoPage() {
  const [amount, setAmount] = useState<number>(499);
  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [paymentResult, setPaymentResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Razorpay Standard</span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Razorpay Checkout Demo</h1>
          <p className="text-xs text-slate-400 mt-1">
            Test standard web checkout with order creation & signature verification.
          </p>
        </div>

        {paymentResult && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-300 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Payment Verified Successfully!</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <p><span className="text-slate-400">Order ID:</span> {paymentResult.order_id}</p>
              <p><span className="text-slate-400">Payment ID:</span> {paymentResult.payment_id}</p>
              <p className="truncate"><span className="text-slate-400">Signature:</span> {paymentResult.signature}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-rose-300 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount (INR ₹)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[99, 499, 1499].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                    amount === val
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <RazorpayCheckoutButton
            amount={amount}
            name="Website Builders Co"
            description="Service Deposit / Test Checkout"
            prefill={{
              name,
              email,
              contact: phone,
            }}
            buttonText={`Pay ₹${amount.toLocaleString('en-IN')}`}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            onSuccess={(data) => {
              setPaymentResult(data);
              setErrorMsg(null);
            }}
            onError={(msg) => {
              setErrorMsg(msg);
            }}
            onDismiss={() => {
              console.log('User closed modal');
            }}
          />
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-500">
            Powered by Razorpay Standard Checkout • Test Mode Active
          </span>
        </div>
      </div>
    </div>
  );
}
