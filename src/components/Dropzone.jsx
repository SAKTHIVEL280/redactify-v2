import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, ShieldAlert, BadgeCheck, Scale, Landmark, Activity, UserCheck, WifiOff, FileCheck, CheckCircle2 } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { PRESETS } from '../core/engine/presets';
import { parseAndScanPDF } from '../core/parsers/pdfParser';
import { parseAndExtractDOCX } from '../core/parsers/docxParser';
import { detectEntities } from '../core/engine/detector';

const PRESET_ICONS = {
  ShieldAlert,
  BadgeCheck,
  Scale,
  Landmark,
  Activity,
  UserCheck
};

export function Dropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const setFile = useDocumentStore((s) => s.setFile);
  const setDocumentData = useDocumentStore((s) => s.setDocumentData);
  const setProgress = useDocumentStore((s) => s.setProgress);
  const isProcessing = useDocumentStore((s) => s.isProcessing);
  const progress = useDocumentStore((s) => s.progress);
  const error = useDocumentStore((s) => s.error);
  const setError = useDocumentStore((s) => s.setError);

  const activePreset = useRedactionStore((s) => s.activePreset);
  const setActivePreset = useRedactionStore((s) => s.setActivePreset);
  const setRedactions = useRedactionStore((s) => s.setRedactions);
  const customRules = useRedactionStore((s) => s.customRules);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);

    const name = file.name.toLowerCase();
    let fileType = 'text';

    if (name.endsWith('.pdf')) fileType = 'pdf';
    else if (name.endsWith('.docx')) fileType = 'docx';
    else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) fileType = 'image';
    else if (name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.log')) fileType = 'text';
    else {
      setError('Unsupported file type. Please upload a PDF, DOCX, TXT, or Image file.');
      return;
    }

    setFile(file, fileType);
    setProgress(0, 100, 'Reading document in browser memory...');

    try {
      if (fileType === 'pdf') {
        const result = await parseAndScanPDF(file, activePreset, customRules, (curr, total, msg) => {
          setProgress(curr, total, msg);
        });

        setDocumentData({
          pageCount: result.numPages,
          isScannedDocument: result.isScannedDocument
        });

        setRedactions(result.redactions);
        if (result.isScannedDocument || result.redactions.length === 0) {
          useRedactionStore.getState().setDrawingMode(true);
        }
      } else if (fileType === 'docx') {
        setProgress(30, 100, 'Unzipping DOCX document in browser memory...');
        const { rawText } = await parseAndExtractDOCX(file);
        setProgress(60, 100, 'Scanning text for sensitive data...');
        const detections = detectEntities(rawText, activePreset, customRules);

        const redactions = detections.map((det, i) => ({
          id: `box_docx_${det.id}_${i}`,
          pageIndex: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          type: 'auto',
          category: det.category,
          entityType: det.type,
          value: det.value,
          suggested: det.suggested,
          confidence: det.confidence,
          redact: true
        }));

        setDocumentData({
          rawText,
          pageCount: 1
        });
        setRedactions(redactions);
      } else if (fileType === 'text') {
        const text = await file.text();
        setProgress(50, 100, 'Scanning text for sensitive data...');
        const detections = detectEntities(text, activePreset, customRules);
        
        // Map to normalized boxes
        const redactions = detections.map((det, i) => ({
          id: `box_txt_${det.id}_${i}`,
          pageIndex: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          type: 'auto',
          category: det.category,
          entityType: det.type,
          value: det.value,
          suggested: det.suggested,
          confidence: det.confidence,
          redact: true
        }));

        setDocumentData({
          rawText: text,
          pageCount: 1
        });
        setRedactions(redactions);
      } else if (fileType === 'image') {
        // Image document
        setDocumentData({
          pageCount: 1,
          isScannedDocument: true
        });
        setRedactions([]);
        useRedactionStore.getState().setDrawingMode(true);
      }

      setProgress(100, 100, 'Done');
    } catch (err) {
      console.error('File parsing error:', err);
      setError(`Failed to read document: ${err.message || 'Unknown error'}`);
    }
  }, [activePreset, customRules, setFile, setDocumentData, setProgress, setRedactions, setError]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-6 shadow-sm">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        <span>100% Client-Side Privacy Firewall</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl leading-[1.15] mb-4">
        Redact sensitive data with <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400">zero cloud risk</span>
      </h1>
      <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-8 leading-relaxed">
        Permanently remove PII, Aadhaar, PAN, credit cards, and confidential records from PDFs, Word docs, and images. Your files never leave your computer.
      </p>

      {/* Preset Selector Bar */}
      <div className="w-full max-w-3xl mb-8 text-left">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
          Select Compliance Preset:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.values(PRESETS).map((p) => {
            const Icon = PRESET_ICONS[p.icon] || ShieldAlert;
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePreset(p.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-sm shadow-rose-950/40 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{p.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full max-w-3xl rounded-3xl border-2 border-dashed p-8 sm:p-12 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group ${
          isDragging
            ? 'border-rose-500 bg-rose-500/5 scale-[1.01]'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,.csv,.log,.png,.jpg,.jpeg,.webp"
          onChange={handleFileInput}
          disabled={isProcessing}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
              <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              {progress.message || 'Processing Document...'}
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              {progress.total > 0 ? `${progress.current} / ${progress.total}` : 'Please wait'}
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 group-hover:bg-rose-500/10 group-hover:text-rose-400 border border-zinc-700/80 group-hover:border-rose-500/30 flex items-center justify-center mb-5 transition-all text-zinc-300 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="text-base sm:text-lg font-bold text-white mb-1">
              Drop your PDF, Word, or Image file here
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-4">
              or <span className="text-rose-400 underline underline-offset-4 font-semibold group-hover:text-rose-300">browse from your computer</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono">
              <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50">PDF</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50">DOCX</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50">PNG / JPG</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50">TXT</span>
              <span>• Up to 100MB</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="w-full max-w-3xl mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* "Try It Offline" Challenge Proof Card (Idea B) */}
      <div className="w-full max-w-3xl mt-8 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between gap-4 text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200">The Offline Verification Challenge</div>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              Don't trust our word? <strong className="text-zinc-200">Turn off your Wi-Fi or unplug your internet right now</strong>, then drop a document. Redactify operates 100% locally in browser memory without sending a single byte to any server.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Zero Telemetry</span>
        </div>
      </div>
    </div>
  );
}
