import React, { useState, useEffect } from 'react';
import { ShieldCheck, WifiOff, Wifi, Undo2, Redo2, Sparkles, KeyRound } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';

export function Header() {
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

    // Global keyboard shortcuts for Undo / Redo
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
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <button 
          onClick={clearDocument}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left"
          title="Return to home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 p-0.5 shadow-lg shadow-rose-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-lg text-rose-500 font-mono tracking-tighter">R</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">Redactify</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                V2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-none hidden sm:block">Zero-Trust Document Redactor</p>
          </div>
        </button>

        {/* Live Zero-Trust Security Indicator */}
        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-zinc-800/80 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Client-Side Memory</span>
          </div>
          
          {isOffline ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[11px]" title="Working completely offline">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode Active</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500">Zero bytes uploaded</span>
          )}
        </div>
      </div>

      {/* Center Actions (Undo / Redo & Drawing Tool) */}
      {file && (
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <button
            onClick={() => setDrawingMode(!isDrawingMode)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              isDrawingMode
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Draw manual redaction box over scans, signatures, or stamps"
          >
            <span className="font-mono text-sm">+</span>
            <span>Manual Box</span>
          </button>
        </div>
      )}

      {/* Right User Actions (Pro Upgrade / Key) */}
      <div className="flex items-center gap-3">
        {isPro ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PRO ACTIVE</span>
          </div>
        ) : (
          <button
            onClick={() => openProModal('header')}
            className="group relative px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-rose-950/50 hover:shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-rose-200" />
            <span>Upgrade to Pro</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full text-rose-100">$9 / ₹499</span>
          </button>
        )}

        <button
          onClick={() => openProModal('enter-license')}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
          title="Enter License Key"
        >
          <KeyRound className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
