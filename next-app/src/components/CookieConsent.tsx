'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-8 md:right-auto md:max-w-md z-50 p-5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl text-slate-300 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">We value your privacy</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            We use cookies to enhance your browsing experience, serve tailored content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-slate-500 hover:text-slate-300 p-1 -mr-2 -mt-2 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
