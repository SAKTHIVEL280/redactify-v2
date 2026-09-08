import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowRight } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';

export function Header({ activePage, setActivePage }) {
  const file = useDocumentStore((s) => s.file);
  const clearDocument = useDocumentStore((s) => s.clearDocument);
  const { undo, redo } = useRedactionStore();
  const { isPro, openProModal } = useLicenseStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-warm-bone/90 border-b border-stone-mist/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button 
            onClick={() => setActivePage('overview')}
            className="flex items-center gap-2 text-left group"
            title="Return to Home"
          >
            {/* Minimalist Document Redaction Emblem */}
            <div className="w-7 h-7 rounded-md bg-charcoal text-white flex items-center justify-center shadow-xs group-hover:bg-electric-indigo transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" strokeWidth="3" />
                <line x1="8" y1="17" x2="13" y2="17" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="font-mono text-sm font-bold tracking-tight text-charcoal uppercase">
              Redactify
            </span>
          </button>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActivePage('overview')}
              className={`font-mono uppercase text-xs font-semibold px-3 py-1.5 rounded-button transition-all ${
                activePage === 'overview'
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'text-bark-grey hover:text-charcoal hover:bg-stone-mist/40'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActivePage('studio')}
              className={`font-mono uppercase text-xs font-semibold px-3 py-1.5 rounded-button transition-all flex items-center gap-1.5 ${
                activePage === 'studio'
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'text-bark-grey hover:text-charcoal hover:bg-stone-mist/40'
              }`}
            >
              <span>Studio</span>
              {file && (
                <span className={`w-1.5 h-1.5 rounded-full ${activePage === 'studio' ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
              )}
            </button>
            <button
              onClick={() => setActivePage('pricing')}
              className={`font-mono uppercase text-xs font-semibold px-3 py-1.5 rounded-button transition-all ${
                activePage === 'pricing'
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'text-bark-grey hover:text-charcoal hover:bg-stone-mist/40'
              }`}
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Subtle Privacy Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-soft-cream border border-stone-mist text-[11px] font-mono text-bark-grey">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isOffline ? 'Air-Gapped' : '100% In-Memory'}</span>
          </div>

          {/* Pro Status or License Trigger */}
          {isPro ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-semibold">
              PRO ACTIVE
            </span>
          ) : (
            <button
              onClick={() => openProModal('enter-license')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-button text-xs font-mono text-bark-grey hover:text-charcoal hover:bg-stone-mist/40 transition-colors"
              title="Activate License Key"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>License</span>
            </button>
          )}

          {/* Action CTA */}
          {activePage === 'studio' && file ? (
            <button
              onClick={clearDocument}
              className="font-mono uppercase text-xs font-semibold px-3.5 py-1.5 rounded-button bg-paper-white border border-stone-mist hover:bg-warm-bone text-charcoal transition-all shadow-xs"
              title="Close current document and start new"
            >
              New File
            </button>
          ) : activePage !== 'studio' ? (
            <button
              onClick={() => setActivePage('studio')}
              className="font-mono uppercase text-xs font-semibold px-3.5 py-1.5 rounded-button bg-electric-indigo hover:bg-deep-violet text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
