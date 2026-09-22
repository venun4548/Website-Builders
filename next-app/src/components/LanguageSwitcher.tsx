'use client';

import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className="inline-flex items-center bg-slate-900/80 border border-slate-700/60 rounded-lg p-1 text-xs backdrop-blur-sm"
    >
      <div className="flex items-center px-1.5 text-slate-400" aria-hidden="true">
        <Globe className="w-3.5 h-3.5 mr-1" />
      </div>
      <div className="flex items-center gap-1">
        {options.map((opt, idx) => (
          <React.Fragment key={opt.code}>
            <button
              onClick={() => setLanguage(opt.code)}
              aria-pressed={language === opt.code}
              className={`px-2 py-1 rounded transition-all font-medium focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
                language === opt.code
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
            {idx < options.length - 1 && (
              <span className="text-slate-700 select-none" aria-hidden="true">
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
