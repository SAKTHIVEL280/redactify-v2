import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Scroll listener for glassy elevation
    const handleScroll = () => {
      const scroller = document.getElementById('landing-scroll-container') || window;
      const top = scroller === window ? window.scrollY : scroller.scrollTop;
      setIsScrolled(top > 12);
    };

    const scrollContainer = document.getElementById('landing-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

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
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [undo, redo]);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'studio', label: 'Studio', hasFile: Boolean(file) },
    { id: 'pricing', label: 'Pricing' }
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-warm-bone/90 backdrop-blur-xl border-b border-stone-mist shadow-xs'
          : 'bg-warm-bone/80 backdrop-blur-md border-b border-stone-mist/60'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 min-w-0">
          <button 
            onClick={() => setActivePage('overview')}
            className="flex items-center gap-1.5 sm:gap-2 text-left group shrink-0 focus:outline-none"
            title="Return to Home"
          >
            {/* Minimalist Document Redaction Emblem in Black */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-black group-hover:opacity-75 transition-opacity shrink-0"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="8" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-black uppercase">
              Redactify
            </span>
          </button>

          {/* Segmented Floating Navigation Dock */}
          <nav className="inline-flex items-center p-1 rounded-full bg-soft-cream border border-stone-mist shadow-xs">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider transition-colors duration-150 flex items-center gap-1.5 focus:outline-none select-none ${
                    isActive ? 'text-white' : 'text-bark-grey hover:text-charcoal'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="header-active-capsule"
                      className="absolute inset-0 bg-charcoal rounded-full shadow-xs"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.hasFile && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-amber-600'}`} />
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Pro Status or License Trigger */}
          {isPro ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-tag bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-mono font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
              <span>PRO ACTIVE</span>
            </span>
          ) : (
            <button
              onClick={() => openProModal('enter-license')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-mono font-medium text-bark-grey hover:text-charcoal hover:bg-stone-mist/40 transition-colors focus:outline-none"
              title="Activate Commercial License"
            >
              <KeyRound className="w-3.5 h-3.5 opacity-70" />
              <span>License</span>
            </button>
          )}

          {/* Action CTA */}
          {activePage === 'studio' && file ? (
            <button
              onClick={clearDocument}
              className="h-9 px-3.5 sm:px-4 rounded-button bg-paper-white border border-stone-mist hover:bg-warm-bone text-charcoal text-xs font-mono font-medium transition-all shadow-xs flex items-center gap-1.5 shrink-0 focus:outline-none"
              title="Close current document and open new file"
            >
              <span className="hidden sm:inline">New File</span>
              <span className="sm:hidden">New</span>
            </button>
          ) : activePage !== 'studio' ? (
            <button
              onClick={() => setActivePage('studio')}
              className="group hidden md:flex h-9 px-4 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-xs items-center gap-2 focus:outline-none"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
