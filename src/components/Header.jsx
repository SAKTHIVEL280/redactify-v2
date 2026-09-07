import React, { useState, useEffect } from 'react';
import { Undo2, Redo2, KeyRound, ArrowRight } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';

export function Header({ activePage, setActivePage }) {
  const file = useDocumentStore((s) => s.file);
  const clearDocument = useDocumentStore((s) => s.clearDocument);
  const { undo, redo, history, future, isDrawingMode, setDrawingMode } = useRedactionStore();
  const { isPro, openProModal } = useLicenseStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e) => {
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
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-warm-bone/90 border-b border-stone-mist transition-colors">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Brand & Identity (AutoSend flower logo glyph + uppercase brand) */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActivePage('overview')}
            className="flex items-center gap-2.5 text-left group"
            title="Return to Home"
          >
            {/* Bespoke Document Redaction Glyph */}
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-charcoal group-hover:text-electric-indigo transition-colors">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="7" y="12" width="10" height="2.5" rx="1" fill="currentColor" />
              <rect x="7" y="16.5" width="6" height="2" rx="0.8" fill="currentColor" opacity="0.6" />
            </svg>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold tracking-wider text-charcoal uppercase">
                Redactify
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-tag bg-stone-mist text-bark-grey">
                v2.0
              </span>
            </div>
          </button>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActivePage('overview')}
              className={`font-mono uppercase text-xs font-semibold px-3 py-1.5 rounded-button transition-colors ${
                activePage === 'overview'
                  ? 'text-electric-indigo bg-indigo-50 font-bold'
                  : 'text-charcoal hover:text-electric-indigo hover:bg-indigo-50/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActivePage('studio')}
              className={`font-mono uppercase text-xs font-semibold px-3 py-1.5 rounded-button transition-colors flex items-center gap-1.5 ${
                activePage === 'studio'
                  ? 'text-electric-indigo bg-indigo-50 font-bold'
                  : 'text-charcoal hover:text-electric-indigo hover:bg-indigo-50/50'
              }`}
            >
              <span>Studio</span>
              {file && <span className="w-1.5 h-1.5 rounded-full bg-lichen-green" />}
            </button>
            <button
              onClick={() => setActivePage('pricing')}
              className={`font-mono uppercase text-xs font-semibold px-3 py-1.5 rounded-button transition-colors ${
                activePage === 'pricing'
                  ? 'text-electric-indigo bg-indigo-50 font-bold'
                  : 'text-charcoal hover:text-electric-indigo hover:bg-indigo-50/50'
              }`}
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* Studio Document Controls (Visible in studio mode when file loaded) */}
        {activePage === 'studio' && file && (
          <div className="hidden lg:flex items-center gap-1.5 bg-paper-white border border-stone-mist rounded-xl px-2.5 py-1 shadow-card">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-1 rounded hover:bg-stone-mist/50 disabled:opacity-30 text-charcoal transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1 rounded hover:bg-stone-mist/50 disabled:opacity-30 text-charcoal transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3.5 bg-stone-mist mx-1" />

            <button
              onClick={() => setDrawingMode(!isDrawingMode)}
              className={`px-3 py-1 text-xs font-mono uppercase font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                isDrawingMode
                  ? 'bg-charcoal text-white shadow-sm'
                  : 'text-charcoal hover:bg-stone-mist/50'
              }`}
              title="Draw manual redaction box over scans, signatures, or stamps"
            >
              <span className="font-mono text-sm leading-none">+</span>
              <span>Manual Box</span>
            </button>
          </div>
        )}

        {/* Right User Actions (AutoSend style) */}
        <div className="flex items-center gap-3">
          {/* Security Status Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-paper-white border border-stone-mist text-xs">
              <span className="w-2 h-2 rounded-full bg-lichen-green animate-pulse" />
              <span className="text-charcoal font-mono text-[11px] font-medium">
                {isOffline ? 'Offline Air-Gapped' : '100% Client-Side'}
              </span>
            </div>
          </div>

          {/* Pro Status or Ghost Action Button */}
          {isPro ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-paper-white border border-lichen-green/50 text-charcoal text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-lichen-green" />
              <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">Pro Active</span>
            </div>
          ) : (
            <button
              onClick={() => setActivePage('pricing')}
              className="hidden sm:inline-flex items-center justify-center font-semibold font-mono uppercase border transition-all text-xs rounded-xl px-3.5 py-1.5 bg-paper-white border-stone-mist hover:bg-warm-bone hover:border-pebble text-charcoal"
            >
              <span>Pricing</span>
              <span className="ml-1.5 text-[10px] text-bark-grey lowercase">$9/mo</span>
            </button>
          )}

          {/* Enter License Key trigger */}
          <button
            onClick={() => openProModal('enter-license')}
            className="p-1.5 rounded-xl text-bark-grey hover:text-charcoal hover:bg-stone-mist/50 transition-colors"
            title="Activate License Key"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Primary Action Button (AutoSend Electric Indigo button) */}
          {activePage !== 'studio' ? (
            <button
              onClick={() => setActivePage('studio')}
              className="inline-flex items-center justify-center font-semibold font-mono uppercase border transition-all text-xs rounded-xl px-4 py-1.5 bg-electric-indigo border-deep-violet hover:bg-deep-violet text-white shadow-sm active:scale-95 gap-1.5 tracking-wider"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            file && (
              <button
                onClick={clearDocument}
                className="inline-flex items-center justify-center font-semibold font-mono uppercase border transition-all text-xs rounded-xl px-3.5 py-1.5 bg-paper-white border-stone-mist hover:bg-warm-bone text-charcoal"
                title="Close current document"
              >
                New File
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
