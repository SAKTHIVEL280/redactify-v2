import React, { useState, useEffect } from 'react';
import { ShieldCheck, WifiOff, Wifi, Undo2, Redo2, Sparkles, KeyRound, ArrowRight, FileText } from 'lucide-react';
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
    <header className="h-[60px] border-b border-[#00000014] bg-[#edede8]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Brand & Identity */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setActivePage('overview')}
          className="flex items-center gap-2.5 text-left group"
          title="Return to Overview"
        >
          <div className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center font-mono font-medium text-xs shadow-sm">
            R
          </div>
          <div className="flex items-center gap-2">
            <span className="font-normal text-base tracking-[-0.02em] text-[#141414]">
              Redactify
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dbdbd2] text-[#292929] border border-[#00000014]">
              v2.0
            </span>
          </div>
        </button>

        {/* Navigation Tabs (Gleap style) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#dbdbd2]/60 p-1 rounded-full border border-[#0000000f]">
          <button
            onClick={() => setActivePage('overview')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
              activePage === 'overview'
                ? 'bg-[#ffffff] text-[#141414] shadow-sm'
                : 'text-[#353535] hover:text-[#141414]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActivePage('studio')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              activePage === 'studio'
                ? 'bg-[#ffffff] text-[#141414] shadow-sm'
                : 'text-[#353535] hover:text-[#141414]'
            }`}
          >
            <span>Studio</span>
            {file && <span className="w-1.5 h-1.5 rounded-full bg-[#4cc02b]" />}
          </button>
          <button
            onClick={() => setActivePage('pricing')}
            className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
              activePage === 'pricing'
                ? 'bg-[#ffffff] text-[#141414] shadow-sm'
                : 'text-[#353535] hover:text-[#141414]'
            }`}
          >
            Pricing & Trust
          </button>
        </nav>
      </div>

      {/* Studio Document Controls (Visible in studio mode when file loaded) */}
      {activePage === 'studio' && file && (
        <div className="hidden lg:flex items-center gap-1.5 bg-[#ffffff] border border-[#00000014] rounded-full px-2 py-1 shadow-sm">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-1 rounded-full hover:bg-[#dbdbd2] disabled:opacity-25 text-[#292929] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1 rounded-full hover:bg-[#dbdbd2] disabled:opacity-25 text-[#292929] transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-[#00000014] mx-1" />

          <button
            onClick={() => setDrawingMode(!isDrawingMode)}
            className={`px-3 py-0.5 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all ${
              isDrawingMode
                ? 'bg-[#141414] text-white shadow-sm'
                : 'text-[#292929] hover:bg-[#dbdbd2]'
            }`}
            title="Draw manual redaction box over scans, signatures, or stamps"
          >
            <span className="font-mono text-sm leading-none">+</span>
            <span>Manual Box</span>
          </button>
        </div>
      )}

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Sovereign Security Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#6f6f6e]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffffff] border border-[#00000014]">
            <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
            <span className="text-[#292929] font-medium text-[11px]">
              {isOffline ? 'Air-Gapped Offline' : '100% In-Memory WASM'}
            </span>
          </div>
        </div>

        {/* Pro Status or CTA */}
        {isPro ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffffff] border border-[#4cc02b]/40 text-[#292929] text-xs font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Pro Active</span>
          </div>
        ) : (
          <button
            onClick={() => setActivePage('pricing')}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dbdbd2] hover:bg-[#d0d0c8] text-[#292929] border border-[#00000014] text-xs font-medium transition-all"
          >
            <span>Upgrade</span>
            <span className="text-[10px] text-[#6f6f6e]">$9 / mo</span>
          </button>
        )}

        {/* Enter License Key Modal trigger */}
        <button
          onClick={() => openProModal('enter-license')}
          className="p-1.5 rounded-full text-[#6f6f6e] hover:text-[#141414] hover:bg-[#dbdbd2]/60 transition-colors"
          title="Activate License Key"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* Primary Action Button (Gleap dark capsule) */}
        {activePage !== 'studio' ? (
          <button
            onClick={() => setActivePage('studio')}
            className="h-9 px-4 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          file && (
            <button
              onClick={clearDocument}
              className="h-9 px-3.5 rounded-full bg-[#ffffff] hover:bg-[#dbdbd2] text-[#292929] border border-[#00000014] text-xs font-medium transition-all"
              title="Close current document"
            >
              New File
            </button>
          )
        )}
      </div>
    </header>
  );
}
