'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { CreditCard, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutButtonProps {
  amount: number; // in Rupees (e.g. 500 = ₹500)
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  buttonText?: string;
  className?: string;
  onSuccess?: (verifyData: {
    payment_id: string;
    order_id: string;
    signature: string;
    serverResult: any;
  }) => void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
  disabled?: boolean;
}

export default function RazorpayCheckoutButton({
  amount,
  currency = 'INR',
  receipt,
  name = 'Website Builders',
  description = 'Web Development Services',
  prefill,
  notes,
  buttonText,
  className,
  onSuccess,
  onError,
  onDismiss,
  disabled = false,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setScriptLoaded(true);
    }
  }, []);

  const handleCheckout = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);

      // Amount in paise (1 Rupee = 100 paise)
      const amountInPaise = Math.round(amount * 100);

      if (amountInPaise < 100) {
        const errMsg = 'Amount must be at least ₹1 (100 paise).';
        onError?.(errMsg);
        alert(errMsg);
        setLoading(false);
        return;
      }

      // Step 1: Call Backend to Create Order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt,
          notes,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || orderData.details || 'Failed to create payment order');
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        'rzp_test_TeLDvQGnNmBcFN';

      // Step 2: Open Razorpay Modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        notes: {
          ...notes,
          order_id: orderData.order_id,
        },
        theme: {
          color: '#3b82f6', // Tailwind blue-500
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log('Payment modal dismissed by user');
            onDismiss?.();
          },
        },
        // Step 3: Handle Payment Success
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Verify signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }

            onSuccess?.({
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              serverResult: verifyData,
            });
          } catch (verifyErr: any) {
            console.error('Verification error:', verifyErr);
            const msg = verifyErr.message || 'Payment verification failed';
            onError?.(msg);
            alert(`Verification Error: ${msg}`);
          } finally {
            setLoading(false);
          }
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event (declined card, timeout, etc.)
      rzpInstance.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        const errorDesc = response.error?.description || 'Payment was declined or failed.';
        onError?.(errorDesc);
        alert(`Payment Failed: ${errorDesc}`);
        setLoading(false);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err.message || 'Payment initiation failed';
      onError?.(msg);
      alert(`Error: ${msg}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-blue-500/20'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>{buttonText || `Pay ₹${amount.toLocaleString('en-IN')}`}</span>
          </>
        )}
      </button>
    </>
  );
}
