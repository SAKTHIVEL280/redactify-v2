import React, { useState, useCallback } from 'react';
import { 
  UploadCloud, ShieldAlert, ShieldCheck, BadgeCheck, Scale, Landmark, 
  Activity, UserCheck, WifiOff, FileText, CheckCircle2, Zap, ArrowRight, 
  ChevronDown, ChevronUp, Lock, Sparkles, Check, HelpCircle, EyeOff, 
  Layers, Download, ServerOff, FileCheck, ExternalLink, AlertCircle, RefreshCw,
  RotateCw, RotateCcw, Crosshair
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
import { PRESETS } from '../core/engine/presets';
import { parseAndScanPDF } from '../core/parsers/pdfParser';
import { parseAndExtractDOCX } from '../core/parsers/docxParser';
import { detectEntities } from '../core/engine/detector';
import { createSampleOfferLetterPdf } from '../core/parsers/samplePdfGenerator';

const FAQS = [
  {
    q: "How can I verify that my documents are never uploaded to any server?",
    a: "You can test this in 10 seconds. Open your browser Developer Tools (press F12 or right-click and choose Inspect), click the Network tab, and drop your document. You will see exactly 0 HTTP requests. You can also turn off your Wi-Fi or unplug your internet: Redactify will continue to redact and export your documents at full speed because the entire engine runs inside your browser."
  },
  {
    q: "Can someone remove the black boxes in exported PDFs to see the hidden text?",
    a: "No. Superficial tools only place a black visual shape over the text, which means anyone can copy the text underneath. Redactify completely deletes the underlying letters and words from the PDF vector file. In addition, all hidden file metadata (author name, revision history, and creation dates) is scrubbed clean."
  },
  {
    q: "Does Redactify comply with privacy laws like GDPR and HIPAA?",
    a: "Yes. Because your files never leave your computer, no sensitive data crosses international borders or gets stored on cloud servers. This complies with GDPR Article 32, HIPAA Safe Harbor de-identification rules, and strict corporate data retention policies."
  },
  {
    q: "How does Redactify handle phone photos and scanned IDs?",
    a: "If your document is a camera photo or scanned image without searchable text, Redactify includes built-in offline OCR that reads the text directly on your device. You can rotate sideways phone photos with one click and use the manual crosshair tool to black out signatures, stamps, and ID card photos."
  },
  {
    q: "Can I use Redactify offline without an internet connection?",
    a: "Yes. Once the page is loaded, Redactify is 100% self-contained. All text processing models and OCR files are stored locally in your browser. It runs seamlessly on air-gapped computers."
  }
];

export function LandingPage({ onNavigateToStudio, onNavigateToPricing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Interactive Live Hero Sandbox State
  const [activeToggles, setActiveToggles] = useState({
    name: true,
    ssn: true,
    phone: true,
    email: true,
    salary: true,
    routing: true,
    account: true
  });

  const toggleEntity = (key) => {
    setActiveToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setFilterMode = (mode) => {
    if (mode === 'all') {
      setActiveToggles({ name: true, ssn: true, phone: true, email: true, salary: true, routing: true, account: true });
    } else if (mode === 'ids') {
      setActiveToggles({ name: true, ssn: true, phone: false, email: false, salary: false, routing: false, account: false });
    } else if (mode === 'finance') {
      setActiveToggles({ name: false, ssn: false, phone: false, email: false, salary: true, routing: true, account: true });
    } else if (mode === 'contact') {
      setActiveToggles({ name: false, ssn: false, phone: true, email: true, salary: false, routing: false, account: false });
    } else if (mode === 'none') {
      setActiveToggles({ name: false, ssn: false, phone: false, email: false, salary: false, routing: false, account: false });
    }
  };

  const activeCount = Object.values(activeToggles).filter(Boolean).length;

  const setFile = useDocumentStore((s) => s.setFile);
  const setDocumentData = useDocumentStore((s) => s.setDocumentData);
  const setProgress = useDocumentStore((s) => s.setProgress);
  const isProcessing = useDocumentStore((s) => s.isProcessing);
  const progress = useDocumentStore((s) => s.progress);
  const error = useDocumentStore((s) => s.error);
  const setError = useDocumentStore((s) => s.setError);

  const activePreset = useRedactionStore((s) => s.activePreset);
  const setRedactions = useRedactionStore((s) => s.setRedactions);
  const customRules = useRedactionStore((s) => s.customRules);

  // Universal File Processor
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
    if (onNavigateToStudio) onNavigateToStudio();
    setProgress(0, 100, 'Reading document on your device...');

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
        setProgress(30, 100, 'Opening Word document in memory...');
        const { rawText } = await parseAndExtractDOCX(file);
        setProgress(60, 100, 'Scanning text for sensitive details...');
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
        setProgress(50, 100, 'Scanning text for sensitive details...');
        const detections = detectEntities(text, activePreset, customRules);
        
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
        setDocumentData({
          pageCount: 1,
          isScannedDocument: true
        });
        useRedactionStore.getState().setDrawingMode(true);
        setRedactions([]);
      }

      setProgress(100, 100, 'Ready');
    } catch (err) {
      console.error('File parsing error:', err);
      setError(`Failed to open document: ${err.message || 'Unknown format'}`);
    }
  }, [activePreset, customRules, onNavigateToStudio, setDocumentData, setError, setFile, setProgress, setRedactions]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const loadSampleOfferLetter = async () => {
    try {
      const file = await createSampleOfferLetterPdf();
      processFile(file);
    } catch (err) {
      console.error('Failed to load sample PDF:', err);
    }
  };

  const loadSampleMedicalRecord = () => {
    const sampleMedicalText = `PATIENT MEDICAL RECORD & DISCHARGE SUMMARY
FACILITY: Metro Health Center
CONFIDENTIAL - PROTECTED HEALTH INFORMATION

PATIENT DETAILS:
Patient Name: Sarah Jenkins
Date of Birth: 14-04-1988
Medical Record Number: MRN-8849201
National ID / SSN: 987-12-8941
Insurance Policy ID: BCBS-994820194
Primary Phone: +1 (415) 555-0182
Email: sarah.j.health@providermail.com

CLINICAL EVALUATION:
Attending Physician: Dr. Robert Harrison, MD (NPI: 1487295103)
Diagnostic Notes: Annual preventative exam completed. All indicators normal.
Prescription: Amoxicillin 500mg, oral daily for 7 days.`;

    const file = new File([sampleMedicalText], 'Sample_Patient_Record.txt', { type: 'text/plain' });
    processFile(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-warm-bone text-charcoal">
      
      {/* ─────────────────────────────────────────────────────────────
          1. AUTOSEND HERO SECTION
      ────────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 px-4 md:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        
        {/* Privacy Highlight Pill */}
        <div 
          onClick={onNavigateToStudio}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-soft-cream border border-stone-mist hover:border-pebble transition-all cursor-pointer mb-8 group shadow-xs"
          title="Launch Redactify Studio"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-mono font-semibold text-charcoal">
            Client-Side Redaction
          </span>
          <span className="text-stone-mist text-xs">•</span>
          <span className="text-xs font-sans text-bark-grey group-hover:text-charcoal transition-colors">
            Zero files ever leave your device
          </span>
          <span className="text-bark-grey group-hover:translate-x-0.5 transition-transform text-xs font-mono">→</span>
        </div>

        {/* Display Headline in Cooper LtBT serif */}
        <h1 className="font-serif text-[42px] sm:text-[68px] lg:text-[76px] leading-[1.1] text-charcoal font-normal max-w-4xl tracking-normal mb-6">
          Document redaction for <em>teams</em> who <br className="hidden md:inline" />
          care about <em>privacy</em>
        </h1>

        {/* Human, approachable subtext */}
        <p className="text-bark-grey text-base sm:text-xl max-w-2xl leading-relaxed font-sans mb-8">
          Permanently remove confidential names, IDs, credit cards, and banking numbers from PDFs, Word documents, and scans. Runs 100% locally on your computer.
        </p>

        {/* CTA Pair (AutoSend style) */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={loadSampleOfferLetter}
            className="cursor-pointer font-semibold font-mono uppercase border text-xs sm:text-sm rounded-xl px-5 py-2.5 bg-paper-white border-stone-mist hover:bg-stone-mist/40 text-charcoal shadow-sm active:scale-95 transition-all"
          >
            Try Sample File
          </button>
          <button
            onClick={onNavigateToStudio}
            className="cursor-pointer font-semibold font-mono uppercase border text-xs sm:text-sm rounded-xl px-6 py-2.5 text-white bg-electric-indigo border-deep-violet hover:bg-deep-violet shadow-sm active:scale-95 transition-all flex items-center gap-2 tracking-wider"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            UNIFIED HERO WORKSPACE: INTEGRATED DROPZONE + LIVE SANDBOX
        ────────────────────────────────────────────────────────────── */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative w-full max-w-4xl bg-paper-white rounded-card border transition-all duration-200 shadow-showcase mb-14 text-left overflow-hidden ${
            isDragging
              ? 'border-electric-indigo ring-4 ring-electric-indigo/20 bg-soft-cream'
              : 'border-stone-mist'
          }`}
        >
          {/* Active Drag-and-Drop High-Contrast Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-30 bg-paper-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-2xl bg-electric-indigo text-white flex items-center justify-center mb-4 shadow-lg animate-bounce">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif text-charcoal">Release to redact immediately</h3>
              <p className="text-xs font-mono text-bark-grey mt-1 max-w-sm">
                Processed 100% in local browser volatile memory. Zero network uploads.
              </p>
            </div>
          )}

          {/* Top Integrated Dropzone Area */}
          <div className="p-6 sm:p-8 bg-warm-bone/40 border-b border-stone-mist relative">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.csv,.log,.png,.jpg,.jpeg,.webp"
              onChange={handleFileInput}
              disabled={isProcessing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Click or drop a document to redact"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-8 h-8 rounded-full border-2 border-charcoal border-t-transparent animate-spin mb-3" />
                <div className="text-xs font-mono uppercase font-semibold text-charcoal mb-1">
                  {progress.message || 'Processing document on your device...'}
                </div>
                <div className="text-[11px] text-bark-grey font-mono">
                  {progress.total > 0 ? `${progress.current} / ${progress.total}` : 'Parsing client-side'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-paper-white border border-stone-mist flex items-center justify-center text-charcoal shadow-sm shrink-0 mt-0.5">
                    <UploadCloud className="w-6 h-6 text-charcoal" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-charcoal">
                      Drop your PDF, Word, or image file here
                    </h3>
                    <p className="text-xs text-bark-grey mt-0.5 font-sans">
                      Everything is processed directly inside your browser memory. <span className="text-electric-indigo font-semibold underline underline-offset-4">Browse files on device</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px] text-bark-grey font-mono uppercase">
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">PDF</span>
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">DOCX</span>
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">PNG / JPG</span>
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">TXT</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={loadSampleOfferLetter}
                    className="relative z-20 px-3.5 py-2 rounded-xl bg-paper-white hover:bg-stone-mist/50 text-charcoal border border-stone-mist text-xs font-mono font-medium shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-charcoal" />
                    <span>Try Sample PDF</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-tag bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Interactive Redaction Sandbox Header */}
          <div className="p-6 sm:p-8 bg-paper-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-mist">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lichen-green animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-charcoal">
                  Interactive Redaction Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-tag bg-warm-bone text-bark-grey border border-stone-mist">
                  Local RAM
                </span>
              </div>

              {/* Scrubber pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="px-2.5 py-1 rounded-tag text-[11px] font-mono uppercase font-semibold bg-charcoal text-white hover:bg-obsidian transition-colors"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('ids')}
                  className="px-2.5 py-1 rounded-tag text-[11px] font-mono uppercase font-semibold bg-warm-bone text-charcoal hover:bg-stone-mist border border-stone-mist transition-colors"
                >
                  IDs
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('finance')}
                  className="px-2.5 py-1 rounded-tag text-[11px] font-mono uppercase font-semibold bg-warm-bone text-charcoal hover:bg-stone-mist border border-stone-mist transition-colors"
                >
                  Salary
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('contact')}
                  className="px-2.5 py-1 rounded-tag text-[11px] font-mono uppercase font-semibold bg-warm-bone text-charcoal hover:bg-stone-mist border border-stone-mist transition-colors"
                >
                  Contacts
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('none')}
                  className="p-1 rounded-tag text-[11px] text-bark-grey hover:text-charcoal transition-colors"
                  title="Reset"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document body with interactive toggle pills */}
            <div className="p-4 sm:p-5 rounded-tag bg-warm-bone border border-stone-mist font-mono text-xs sm:text-sm leading-relaxed space-y-3 text-charcoal">
              <div className="text-[10px] font-mono uppercase font-semibold text-bark-grey border-b border-stone-mist pb-2 flex items-center justify-between">
                <span>EXECUTIVE EMPLOYMENT AGREEMENT • CONFIDENTIAL</span>
                <span className="text-[9px] text-bark-grey font-sans">Click any black box to unmask</span>
              </div>

              <div className="pt-1">
                Candidate:{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('name')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ${
                    activeToggles.name
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.name ? '[NAME REDACTED]' : 'David M. Sterling'}
                </button>
              </div>

              <div>
                Social Security Number:{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('ssn')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ${
                    activeToggles.ssn
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.ssn ? 'XXX-XX-4320' : '987-65-4320'}
                </button>
                <span className="text-[10px] text-bark-grey ml-2 font-sans">(Checksum Verified)</span>
              </div>

              <div>
                Contact Info:{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('phone')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium mr-1.5 ${
                    activeToggles.phone
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.phone ? '[PHONE REDACTED]' : '+1 (206) 555-0194'}
                </button>
                •{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('email')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ml-1.5 ${
                    activeToggles.email
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.email ? '[EMAIL REDACTED]' : 'd.sterling@apexglobal.io'}
                </button>
              </div>

              <div>
                Compensation:{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('salary')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ${
                    activeToggles.salary
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.salary ? '[SALARY CONFIDENTIAL]' : '$185,000 USD / year'}
                </button>
              </div>

              <div>
                Payroll Details:{' '}
                Routing:{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('routing')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium mr-1.5 ${
                    activeToggles.routing
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.routing ? '[ROUTING SCRUBBED]' : '021000021'}
                </button>
                Account:{' '}
                <button
                  type="button"
                  onClick={() => toggleEntity('account')}
                  className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ml-1.5 ${
                    activeToggles.account
                      ? 'bg-charcoal text-white shadow-sm hover:opacity-90'
                      : 'bg-stone-mist text-charcoal hover:bg-stone-mist/80'
                  }`}
                >
                  {activeToggles.account ? '••••••••9482' : '8492019482'}
                </button>
              </div>
            </div>

            {/* Bottom metrics & trigger row */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-stone-mist">
              <div className="flex items-center gap-2 text-xs text-bark-grey">
                <span className="w-2 h-2 rounded-full bg-lichen-green" />
                <span className="font-mono text-charcoal font-semibold">
                  {activeCount} of 7 Entities Protected
                </span>
                <span className="text-pebble">•</span>
                <span className="font-mono text-[11px] text-charcoal">0 bytes sent to servers</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSampleMedicalRecord}
                  className="px-3 py-1.5 rounded-xl bg-warm-bone hover:bg-stone-mist text-charcoal border border-stone-mist text-xs font-mono font-medium transition-colors"
                >
                  Sample Medical Record (.txt)
                </button>
                <button
                  onClick={onNavigateToStudio}
                  className="inline-flex items-center justify-center font-mono font-semibold uppercase text-xs rounded-xl px-4 py-1.5 bg-electric-indigo hover:bg-deep-violet text-white shadow-sm transition-all gap-1.5"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. AUTOSEND 3-COLUMN FEATURE CARDS GRID
      ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-16">
        <div className="border-x border-stone-mist">
          <ul className="grid grid-cols-1 sm:grid-cols-3 sm:border-b border-t border-stone-mist">
            {/* Card 1 */}
            <li className="flex flex-col border-b border-stone-mist sm:border-b-0 sm:border-r border-stone-mist">
              <div className="flex flex-col gap-2 p-6 flex-1 bg-paper-white">
                <p className="text-charcoal font-medium text-base font-mono">PDF Vector Scrubbing</p>
                <p className="text-bark-grey font-normal text-sm leading-relaxed">
                  Permanently deletes underlying text glyphs and metadata streams. Black boxes cannot be copied, selected, or inspected.
                </p>
              </div>
              <div className="border-t border-stone-mist px-6 py-3 bg-warm-bone flex items-center justify-between">
                <span className="text-charcoal font-medium text-xs font-mono uppercase">Zero Text Leaks</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal" />
              </div>
            </li>

            {/* Card 2 */}
            <li className="flex flex-col border-b border-stone-mist sm:border-b-0 sm:border-r border-stone-mist">
              <div className="flex flex-col gap-2 p-6 flex-1 bg-paper-white">
                <p className="text-charcoal font-medium text-base font-mono">Word Documents (.docx)</p>
                <p className="text-bark-grey font-normal text-sm leading-relaxed">
                  Cleans sensitive names and banking numbers across tables, paragraphs, and headers while keeping your exact layout intact.
                </p>
              </div>
              <div className="border-t border-stone-mist px-6 py-3 bg-warm-bone flex items-center justify-between">
                <span className="text-charcoal font-medium text-xs font-mono uppercase">Layout Preserved</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal" />
              </div>
            </li>

            {/* Card 3 */}
            <li className="flex flex-col border-stone-mist">
              <div className="flex flex-col gap-2 p-6 flex-1 bg-paper-white">
                <p className="text-charcoal font-medium text-base font-mono">ID Cards & Scans (OCR)</p>
                <p className="text-bark-grey font-normal text-sm leading-relaxed">
                  Built-in offline OCR detects text on photos. Easily rotate sideways phone photos 90° and draw manual blackout rectangles.
                </p>
              </div>
              <div className="border-t border-stone-mist px-6 py-3 bg-warm-bone flex items-center justify-between">
                <span className="text-charcoal font-medium text-xs font-mono uppercase">Rotate & Draw</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal" />
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. METRICS BAR
      ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-20">
        <div className="border-x border-stone-mist">
          <div className="border-t border-b border-stone-mist">
            {/* 4 Metric Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4">
              <div className="flex flex-col justify-center gap-1.5 p-6 border-stone-mist odd:border-r md:odd:border-r-0 md:border-r">
                <p className="text-charcoal font-normal text-3xl font-datatype text-center">0</p>
                <p className="text-bark-grey font-normal text-xs text-center">Bytes uploaded to any server</p>
              </div>
              <div className="flex flex-col justify-center gap-1.5 p-6 border-stone-mist md:border-r">
                <p className="text-charcoal font-normal text-3xl font-datatype text-center">&lt; 15ms</p>
                <p className="text-bark-grey font-normal text-xs text-center">Instant detection speed</p>
              </div>
              <div className="flex flex-col justify-center gap-1.5 p-6 border-stone-mist odd:border-r md:odd:border-r-0 md:border-r">
                <p className="text-charcoal font-normal text-3xl font-datatype text-center">100%</p>
                <p className="text-bark-grey font-normal text-xs text-center">Client-side offline processing</p>
              </div>
              <div className="flex flex-col justify-center gap-1.5 p-6 border-stone-mist">
                <p className="text-charcoal font-normal text-3xl font-datatype text-center">17+</p>
                <p className="text-bark-grey font-normal text-xs text-center">Standard PII types recognized</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. AUTOSEND NUMBERED DEEP-DIVE SECTIONS (#01, #02, #03)
      ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-20">
        <div className="flex flex-col border-x border-t border-stone-mist">
          
          {/* #01 - Zero Cloud Exposure */}
          <div className="border-b border-stone-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 items-center">
              <div className="flex flex-col gap-3">
                <p className="text-rose-600 font-mono text-xs font-semibold uppercase tracking-wider">
                  #01: Zero Cloud Exposure
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal leading-tight">
                  Your private files never leave your computer.
                </h2>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Most online redaction websites upload your contracts, tax returns, and client IDs to remote cloud servers. If their server is ever compromised, your sensitive files are exposed.
                </p>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Redactify works completely inside your web browser using WebAssembly. Disconnect your internet connection, turn off Wi-Fi, and see for yourself: Redactify continues to work flawlessly.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal">
                    <span className="w-2 h-2 rounded-full bg-lichen-green" />
                    <span>0 HTTP Network Requests Sent</span>
                  </span>
                </div>
              </div>

              {/* Visual Showcase Card */}
              <div className="relative rounded-card border border-stone-mist overflow-hidden bg-paper-white shadow-card p-6">
                <div className="font-mono text-xs text-bark-grey uppercase pb-3 border-b border-stone-mist flex items-center justify-between">
                  <span>Browser Network Inspector</span>
                  <span className="text-lichen-green font-semibold">100% Offline Ready</span>
                </div>
                <div className="py-4 space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-charcoal font-medium">Document Upload Request</span>
                    <span className="text-lichen-green font-semibold">BLOCKED (0 Bytes)</span>
                  </div>
                  <div className="p-3 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-charcoal font-medium">Telemetry & Analytics</span>
                    <span className="text-lichen-green font-semibold">NONE (Zero Tracking)</span>
                  </div>
                  <div className="p-3 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-charcoal font-medium">Processing Engine</span>
                    <span className="text-electric-indigo font-semibold">Local Browser RAM</span>
                  </div>
                </div>
                <p className="text-[11px] text-bark-grey font-sans pt-2 border-t border-stone-mist">
                  Safe for strictly confidential legal contracts, patient medical histories, and HR payroll filings.
                </p>
              </div>
            </div>
          </div>

          {/* #02 - Smart Automatic Detection */}
          <div className="border-b border-stone-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 items-center">
              {/* Visual Showcase Card */}
              <div className="order-2 md:order-1 rounded-card border border-stone-mist overflow-hidden bg-paper-white shadow-card p-6">
                <div className="font-mono text-xs text-bark-grey uppercase pb-3 border-b border-stone-mist flex items-center justify-between">
                  <span>Smart Pattern Checksums</span>
                  <span className="text-charcoal font-semibold">&lt; 15ms Speed</span>
                </div>
                <div className="py-4 space-y-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-bark-grey">Social Security / Tax ID</span>
                    <span className="font-semibold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded">XXX-XX-4320</span>
                  </div>
                  <div className="p-2.5 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-bark-grey">Credit Card & IBAN</span>
                    <span className="font-semibold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded">•••• •••• •••• 1092</span>
                  </div>
                  <div className="p-2.5 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-bark-grey">Executive Compensation</span>
                    <span className="font-semibold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded">[SALARY CONFIDENTIAL]</span>
                  </div>
                  <div className="p-2.5 rounded-tag bg-warm-bone border border-stone-mist flex items-center justify-between">
                    <span className="text-bark-grey">Direct Contact Info</span>
                    <span className="font-semibold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded">[CONTACT REDACTED]</span>
                  </div>
                </div>
                <p className="text-[11px] text-bark-grey font-sans pt-2 border-t border-stone-mist">
                  Mathematical validation algorithms eliminate false alarms and catch disguised numbers.
                </p>
              </div>

              <div className="order-1 md:order-2 flex flex-col gap-3">
                <p className="text-amber-600 font-mono text-xs font-semibold uppercase tracking-wider">
                  #02: Smart Pattern Detection
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal leading-tight">
                  Automatically spots sensitive data before you hit send.
                </h2>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Forget searching through dozens of pages by hand. Redactify automatically detects Social Security Numbers, Tax IDs, IBANs, bank accounts, emails, phone numbers, and compensation details.
                </p>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Built-in mathematical checksums verify digits instantly, ensuring actual sensitive numbers are scrubbed without flagging harmless order IDs or dates.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal">
                    US & Global IDs
                  </span>
                  <span className="px-2.5 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal">
                    Healthcare HIPAA
                  </span>
                  <span className="px-2.5 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal">
                    Banking & Payroll
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* #03 - Scanned Documents & Photos */}
          <div className="border-b border-stone-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 items-center">
              <div className="flex flex-col gap-3">
                <p className="text-electric-indigo font-mono text-xs font-semibold uppercase tracking-wider">
                  #03: Scans & Phone Photos
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal leading-tight">
                  Fix sideways phone photos and black out signatures.
                </h2>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Took a photo of an ID card, contract, or receipt on your mobile phone that saved vertically instead of horizontally? Rotate it 90 degrees with one click.
                </p>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Use the manual crosshair tool to draw custom blackout rectangles over handwritten signatures, official rubber stamps, or ID portrait photos. Everything burns directly into the image upon download.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button 
                    onClick={onNavigateToStudio}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-paper-white border border-stone-mist text-xs font-mono uppercase font-semibold text-charcoal hover:bg-stone-mist/40 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-charcoal" />
                    <span>Rotate 90° Controls</span>
                  </button>
                  <button 
                    onClick={onNavigateToStudio}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-paper-white border border-stone-mist text-xs font-mono uppercase font-semibold text-charcoal hover:bg-stone-mist/40 transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-charcoal" />
                    <span>Manual Crosshair</span>
                  </button>
                </div>
              </div>

              {/* Visual Showcase Card */}
              <div className="rounded-card border border-stone-mist overflow-hidden bg-paper-white shadow-card p-6">
                <div className="font-mono text-xs text-bark-grey uppercase pb-3 border-b border-stone-mist flex items-center justify-between">
                  <span>Scanned ID Orientation & Blackout</span>
                  <span className="text-electric-indigo font-semibold">Tesseract WASM</span>
                </div>
                <div className="py-6 flex flex-col items-center justify-center gap-4 bg-warm-bone/60 rounded-tag border border-stone-mist my-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-tag bg-paper-white border border-stone-mist font-mono text-xs text-charcoal flex items-center gap-1.5 shadow-sm">
                      <RotateCcw className="w-3 h-3" />
                      <span>Rotate CCW</span>
                    </div>
                    <div className="px-3 py-1 rounded-tag bg-paper-white border border-stone-mist font-mono text-xs text-charcoal flex items-center gap-1.5 shadow-sm">
                      <RotateCw className="w-3 h-3" />
                      <span>Rotate CW</span>
                    </div>
                  </div>
                  <div className="w-48 h-28 bg-paper-white border border-stone-mist rounded-tag shadow-sm relative p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2 bg-stone-mist rounded" />
                      <div className="w-6 h-6 rounded-full bg-stone-mist" />
                    </div>
                    <div className="h-6 w-full bg-charcoal text-white rounded flex items-center justify-center font-mono text-[9px]">
                      [SIGNATURE BLACKOUT]
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-2 bg-stone-mist rounded" />
                      <div className="w-8 h-2 bg-stone-mist rounded" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-bark-grey font-sans pt-2 border-t border-stone-mist">
                  Permanent image canvas flattening: text cannot be extracted or uncovered.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. AUTOSEND COMPARISON TABLE
      ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.10em] text-bark-grey mb-2">
            Comparison
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal">
            Why teams choose Redactify
          </h2>
          <p className="mt-2 text-sm text-bark-grey font-sans">
            How client-side redaction compares to Adobe Acrobat and typical web tools.
          </p>
        </div>

        <div className="border border-stone-mist rounded-card overflow-hidden bg-paper-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-mist bg-warm-bone text-xs font-mono text-charcoal">
                  <th className="py-3.5 px-6 font-semibold">Feature / Security Standard</th>
                  <th className="py-3.5 px-6 font-semibold text-charcoal bg-paper-white border-x border-stone-mist">
                    Redactify V2
                  </th>
                  <th className="py-3.5 px-6 text-bark-grey font-medium">Adobe Acrobat Pro</th>
                  <th className="py-3.5 px-6 text-bark-grey font-medium">Common Web Editors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-mist text-xs sm:text-sm font-sans text-charcoal">
                <tr>
                  <td className="py-4 px-6 font-medium">Where files are processed</td>
                  <td className="py-4 px-6 font-semibold bg-paper-white border-x border-stone-mist text-lichen-green flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-lichen-green" /> 100% On Your Device (RAM)
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Adobe Document Cloud</td>
                  <td className="py-4 px-6 text-rose-600">Third-Party Cloud Servers</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Offline and air-gapped support</td>
                  <td className="py-4 px-6 font-semibold bg-paper-white border-x border-stone-mist">
                    Yes (Fully offline capable)
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Requires cloud license checks</td>
                  <td className="py-4 px-6 text-rose-600">No (Fails without internet)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Permanent vector text deletion</td>
                  <td className="py-4 px-6 font-semibold bg-paper-white border-x border-stone-mist">
                    Yes (Glyphs fully destroyed)
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Yes (Sanitize document)</td>
                  <td className="py-4 px-6 text-rose-600">Often superficial black boxes</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Sideways photo 90° rotation</td>
                  <td className="py-4 px-6 font-semibold bg-paper-white border-x border-stone-mist">
                    Yes (One-click CW & CCW)
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Requires page organize tool</td>
                  <td className="py-4 px-6 text-rose-600">Not supported</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Pricing model</td>
                  <td className="py-4 px-6 font-semibold bg-paper-white border-x border-stone-mist text-charcoal">
                    $9 / mo or $29 Early-Bird Lifetime
                  </td>
                  <td className="py-4 px-6 text-bark-grey">$240+ / year subscription</td>
                  <td className="py-4 px-6 text-bark-grey">$60 - $120 / year subscription</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. AUTOSEND CLEAN FAQ ACCORDION
      ────────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto w-full px-4 md:px-6 mb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.10em] text-bark-grey mb-2">
            Clear Answers
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-stone-mist bg-paper-white overflow-hidden transition-colors shadow-sm"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-sans font-medium text-sm sm:text-base text-charcoal hover:text-black transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-bark-grey shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-bark-grey shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-bark-grey leading-relaxed border-t border-stone-mist pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. AUTOSEND 4-COLUMN FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-mist bg-paper-white py-12 px-4 md:px-6 text-xs text-bark-grey">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="flex items-center gap-2">
              {/* Bespoke Document Redaction Glyph */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-charcoal">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="7" y="12" width="10" height="2.5" rx="1" fill="currentColor" />
                <rect x="7" y="16.5" width="6" height="2" rx="0.8" fill="currentColor" opacity="0.6" />
              </svg>
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-charcoal">Redactify</span>
            </div>
            <p className="text-xs text-bark-grey leading-relaxed">
              Zero-knowledge, client-side document redaction running 100% inside your browser. No files uploaded.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-16">
            <div className="flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-charcoal text-xs">Product</span>
              <button onClick={onNavigateToStudio} className="text-left text-bark-grey hover:text-charcoal transition-colors">
                Studio
              </button>
              <button onClick={loadSampleOfferLetter} className="text-left text-bark-grey hover:text-charcoal transition-colors">
                Sample Document
              </button>
              <button onClick={onNavigateToPricing} className="text-left text-bark-grey hover:text-charcoal transition-colors">
                Pricing
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-charcoal text-xs">Privacy</span>
              <span className="text-bark-grey">GDPR Article 32</span>
              <span className="text-bark-grey">HIPAA Safe Harbor</span>
              <span className="text-bark-grey">Zero Server Logs</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-charcoal text-xs">Security</span>
              <span className="text-bark-grey">Air-Gapped Operation</span>
              <span className="text-bark-grey">Client-Side WASM</span>
              <span className="text-bark-grey">Zero Network Egress</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-stone-mist flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-bark-grey">
          <span>© {new Date().getFullYear()} Redactify. Documents are processed exclusively on your device.</span>
          <span className="font-mono">v2.0 • 100% Client-Side Privacy</span>
        </div>
      </footer>
    </div>
  );
}
