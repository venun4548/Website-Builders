'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

interface OfflineIndicatorProps {
  onRefresh?: () => void;
}

export default function OfflineIndicator({ onRefresh }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncMessage('Project information updated.');
      if (onRefresh) {
        onRefresh();
      }
      setTimeout(() => {
        setSyncMessage(null);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncMessage(null);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRefresh]);

  return (
    <>
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-200 text-xs sm:text-sm flex items-center justify-center gap-2 font-medium"
        >
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            You are offline. Showing last successfully synchronized project information.
          </span>
        </div>
      )}

      {syncMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-3"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}
    </>
  );
}
