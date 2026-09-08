import React, { useState } from 'react';
import { Download, Check, Sparkles, SlidersHorizontal, Eye, ShieldCheck } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore, REDACTION_COLORS, REDACTION_LABELS } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
import { exportRedactedPDF } from '../core/parsers/pdfExporter';
import { exportRedactedDOCX } from '../core/parsers/docxExporter';
import { exportRedactedImage } from '../core/parsers/imageExporter';

export function StyleToolbar() {
  const file = useDocumentStore((s) => s.file);
  const fileType = useDocumentStore((s) => s.fileType);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const rotation = useDocumentStore((s) => s.rotation);
  const redactions = useRedactionStore((s) => s.redactions);
  const style = useRedactionStore((s) => s.style);
  const setStyle = useRedactionStore((s) => s.setStyle);
  const toggleAllRedactions = useRedactionStore((s) => s.toggleAllRedactions);

  const isPro = useLicenseStore((s) => s.isPro);
  const openProModal = useLicenseStore((s) => s.openProModal);

  const [isExporting, setIsExporting] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState('');

  const activeCount = redactions.filter((r) => r.redact).length;

  const handleExport = async (forceTrial = false) => {
    if (!file) return;

    // Pro Gating Hook: If user has a multi-page document and is not Pro, prompt modal with option to continue trial
    if (!isPro && pageCount > 1 && !forceTrial) {
      openProModal('multi-page', () => handleExport(true));
      return;
    }

    setIsExporting(true);
    try {
      let outputBlob = null;
      const arrayBuffer = await file.arrayBuffer();

      if (fileType === 'pdf') {
        outputBlob = await exportRedactedPDF({
          fileArrayBuffer: arrayBuffer,
          redactions,
          style,
          isPro,
          rotation
        });
      } else if (fileType === 'docx') {
        outputBlob = await exportRedactedDOCX({
          fileArrayBuffer: arrayBuffer,
          redactions,
          style,
          isPro
        });
      } else if (fileType === 'image') {
        outputBlob = await exportRedactedImage({
          imageFile: file,
          redactions,
          style,
          isPro,
          rotation
        });
      } else {
        // Plain text
        let cleanText = await file.text();
        for (const r of redactions.filter(item => item.redact)) {
          if (r.value) cleanText = cleanText.replaceAll(r.value, style.label || '[REDACTED]');
        }
        if (!isPro) {
          cleanText = `[Trial Version: Redacted with Redactify (redactify.daeq.in). Upgrade to Pro for clean commercial exports]\n\n` + cleanText;
        }
        outputBlob = new Blob([cleanText], { type: 'text/plain' });
      }

      // Trigger instant browser download
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const ext = file.name.split('.').pop() || 'pdf';
      a.download = `${baseName}_redacted.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-[52px] sm:h-16 border-t border-stone-mist bg-paper-white/95 backdrop-blur-md px-2.5 sm:px-6 md:px-8 flex items-center justify-between gap-2 sm:gap-4 z-20">
      {/* Left: Style & Color Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-w-0">
        <span className="text-xs font-mono font-medium text-bark-grey hidden md:block uppercase tracking-wider shrink-0">
          Style:
        </span>

        {/* Color Palette */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-soft-cream border border-stone-mist rounded-full p-0.5 sm:p-1 shrink-0">
          {REDACTION_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setStyle({ color: c.hex, textColor: c.textHex })}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border transition-transform flex items-center justify-center ${
                style.color === c.hex ? 'scale-110 border-charcoal shadow-sm' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            >
              {style.color === c.hex && (
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: c.textHex }} />
              )}
            </button>
          ))}
        </div>

        {/* Label Mode Switcher */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-soft-cream border border-stone-mist rounded-full p-0.5 sm:p-1 font-mono shrink-0">
          <button
            onClick={() => setStyle({ showLabel: false, mode: 'blackout' })}
            className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full transition-all ${
              !style.showLabel ? 'bg-paper-white text-charcoal shadow-sm' : 'text-bark-grey hover:text-charcoal'
            }`}
          >
            <span className="hidden sm:inline">Blackout</span>
            <span className="sm:hidden">Solid</span>
          </button>
          <button
            onClick={() => setStyle({ showLabel: true, mode: 'label' })}
            className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full transition-all ${
              style.showLabel ? 'bg-paper-white text-charcoal shadow-sm' : 'text-bark-grey hover:text-charcoal'
            }`}
          >
            <span className="hidden sm:inline">Text Label</span>
            <span className="sm:hidden">Label</span>
          </button>
        </div>

        {/* Label Dropdown & Custom Input (if Text Label enabled) */}
        {style.showLabel && (
          <div className="flex items-center gap-1 sm:gap-1.5 animate-in fade-in duration-150 shrink-0">
            <select
              value={REDACTION_LABELS.includes(style.label) ? style.label : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setStyle({ label: e.target.value });
                }
              }}
              className="bg-soft-cream border border-stone-mist text-charcoal text-[11px] sm:text-xs rounded-button px-2 py-0.5 sm:px-2.5 sm:py-1 focus:outline-none focus:border-charcoal font-mono cursor-pointer"
            >
              {REDACTION_LABELS.map((lbl) => (
                <option key={lbl} value={lbl}>{lbl}</option>
              ))}
              {!REDACTION_LABELS.includes(style.label) && (
                <option value="custom">Custom Label...</option>
              )}
            </select>

            <input
              type="text"
              value={style.label}
              onChange={(e) => setStyle({ label: e.target.value })}
              placeholder="Custom label..."
              className="bg-paper-white border border-stone-mist text-charcoal text-[11px] sm:text-xs rounded-button px-2 py-0.5 sm:px-2.5 sm:py-1 w-20 sm:w-32 focus:outline-none focus:border-charcoal font-mono shadow-sm"
              title="Type any custom blackout label"
            />
          </div>
        )}
      </div>

      {/* Right: Counters & Export Trigger */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right hidden sm:block font-mono">
          <div className="text-xs font-medium text-charcoal">
            {activeCount} of {redactions.length} masked
          </div>
          <div className="text-[10px] text-bark-grey">
            {pageCount > 1 ? `${pageCount} pages detected` : '1 page'}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="h-8 sm:h-10 px-3 sm:px-6 rounded-button bg-charcoal hover:bg-black text-white font-mono font-medium text-[11px] sm:text-xs tracking-wide shadow-sm transition-all flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isExporting ? 'Exporting...' : <><span className="hidden sm:inline">Export Redacted Document</span><span className="sm:hidden">Export</span></>}</span>
        </button>
      </div>
    </div>
  );
}
