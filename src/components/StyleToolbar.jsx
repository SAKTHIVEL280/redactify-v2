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
  const redactions = useRedactionStore((s) => s.redactions);
  const style = useRedactionStore((s) => s.style);
  const setStyle = useRedactionStore((s) => s.setStyle);
  const toggleAllRedactions = useRedactionStore((s) => s.toggleAllRedactions);

  const isPro = useLicenseStore((s) => s.isPro);
  const openProModal = useLicenseStore((s) => s.openProModal);

  const [isExporting, setIsExporting] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState('');

  const activeCount = redactions.filter((r) => r.redact).length;

  const handleExport = async () => {
    if (!file) return;

    // Aggressive Pro Gating Hook: If user has a multi-page document and is not Pro, give them a chance to upgrade first
    if (!isPro && pageCount > 1) {
      openProModal('multi-page');
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
          isPro
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
          style
        });
      } else {
        // Plain text
        let cleanText = await file.text();
        for (const r of redactions.filter(item => item.redact)) {
          if (r.value) cleanText = cleanText.replaceAll(r.value, style.label || '[REDACTED]');
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
    <div className="h-16 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
      {/* Left: Style & Color Controls */}
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <span className="text-xs font-bold text-zinc-400 hidden md:block uppercase tracking-wider">
          Style:
        </span>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {REDACTION_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setStyle({ color: c.hex, textColor: c.textHex })}
              className={`w-6 h-6 rounded-lg border transition-transform flex items-center justify-center ${
                style.color === c.hex ? 'scale-110 border-white shadow-sm' : 'border-zinc-700 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            >
              {style.color === c.hex && (
                <Check className="w-3.5 h-3.5" style={{ color: c.textHex }} />
              )}
            </button>
          ))}
        </div>

        {/* Label Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setStyle({ showLabel: false, mode: 'blackout' })}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              !style.showLabel ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Solid Blackout
          </button>
          <button
            onClick={() => setStyle({ showLabel: true, mode: 'label' })}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              style.showLabel ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Text Label
          </button>
        </div>

        {/* Label Dropdown (if Text Label enabled) */}
        {style.showLabel && (
          <select
            value={style.label}
            onChange={(e) => setStyle({ label: e.target.value })}
            className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-rose-500 font-mono"
          >
            {REDACTION_LABELS.map((lbl) => (
              <option key={lbl} value={lbl}>{lbl}</option>
            ))}
          </select>
        )}
      </div>

      {/* Right: Counters & Export Trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-white font-mono">
            {activeCount} of {redactions.length} masked
          </div>
          <div className="text-[10px] text-zinc-400">
            {pageCount > 1 ? `${pageCount} pages detected` : '1 page'}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-950/60 hover:shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isExporting ? 'Exporting...' : 'Export Document'}</span>
        </button>
      </div>
    </div>
  );
}
