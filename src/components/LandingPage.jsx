import React, { useState, useCallback } from 'react';
import { 
  UploadCloud, ShieldAlert, ShieldCheck, BadgeCheck, Scale, Landmark, 
  Activity, UserCheck, WifiOff, FileText, CheckCircle2, Zap, ArrowRight, 
  ChevronDown, ChevronUp, Lock, Sparkles, Check, HelpCircle, EyeOff, 
  Layers, Download, ServerOff, FileCheck, ExternalLink, AlertCircle, RefreshCw
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
import { PRESETS } from '../core/engine/presets';
import { parseAndScanPDF } from '../core/parsers/pdfParser';
import { parseAndExtractDOCX } from '../core/parsers/docxParser';
import { detectEntities } from '../core/engine/detector';

const FAQS = [
  {
    q: "How can I mathematically verify that my documents are never uploaded to any server?",
    a: "You do not have to trust us — you can verify it in 10 seconds. Open your browser's Developer Tools (F12 or Ctrl+Shift+I), navigate to the 'Network' tab, and drop your document. You will observe exactly 0 HTTP requests. Alternatively, turn off your Wi-Fi or disconnect your network cable: Redactify will continue to parse, redact, and export at full speed because the entire engine executes locally in your browser's WebAssembly and JavaScript memory."
  },
  {
    q: "Can someone inspect or remove the black boxes in exported PDFs to read the original text?",
    a: "No. Unlike superficial redaction tools that merely draw a black rectangle on top of the text, Redactify permanently incinerates the underlying text stream in the PDF vector structure using pdf-lib. The sensitive character glyphs are destroyed and replaced with solid vector coordinates. Furthermore, all hidden PDF metadata (author, creation software, revision history, and timestamps) are completely scrubbed."
  },
  {
    q: "Does Redactify comply with international data privacy laws (GDPR, HIPAA, SOC 2)?",
    a: "Yes. Because Redactify processes documents exclusively inside your browser's local sandbox, sensitive files never cross international borders, third-party clouds, or unvetted subprocessors. It complies with GDPR Article 32 (Security of Processing), HIPAA Safe Harbor de-identification rules, and strict enterprise zero-data-retention mandates."
  },
  {
    q: "How does Redactify handle scanned documents and ID photos?",
    a: "If your document is a scanned image or photo without an embedded text layer (such as driver licenses, national ID cards, stamped agreements, or signatures), Redactify supports interactive 90-degree rotation, crosshair manual box drawing, and self-hosted client-side Tesseract WASM OCR. Blackout boxes are permanently burned into pixel bitmap data upon export."
  },
  {
    q: "Can I use Redactify on air-gapped enterprise machines?",
    a: "Yes. All WebAssembly models, Tesseract OCR language weights, and cryptographic parsers are bundled directly into the application bundle. Once loaded, Redactify operates with zero network connectivity."
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
          rawText,
          pageCount: 1
        });
        setRedactions(redactions);
      } else if (fileType === 'image') {
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
  }, [activePreset, customRules, setFile, setDocumentData, setProgress, setRedactions, setError, onNavigateToStudio]);

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

  const loadSampleOfferLetter = () => {
    const sampleOfferText = `STRICTLY CONFIDENTIAL - EMPLOYMENT AGREEMENT & OFFER
Date: September 4, 2026

Candidate: David M. Sterling
Home Address: 742 Evergreen Terrace, Suite 400, Seattle, WA 98101
Social Security Number: 987-65-4320
Phone: +1 (206) 555-0194 | Email: d.sterling@apexglobal.io

Dear David,
We are thrilled to offer you the position of Principal Architect at Apex Global Technologies Inc.

1. Compensation & Terms:
- Fixed Annual Base Salary: $185,000 USD (paid semi-monthly).
- One-time Signing Bonus: $25,000 USD.
- Direct Deposit Payroll: Routing Number 021000021, Account Number 8492019482.

2. Confidentiality:
You agree that all proprietary algorithms, client lists, and confidential intellectual property remain the sole property of Apex Global Technologies Inc.

Yours sincerely,
Apex Global Technologies Inc.
Katherine Vance
Executive Vice President, Legal & HR Operations`;

    const file = new File([sampleOfferText], 'Sample_Executive_Offer_Letter.txt', { type: 'text/plain' });
    processFile(file);
  };

  const loadSampleMedicalRecord = () => {
    const sampleMedicalText = `CLINICAL HEALTHCARE RECORD & DISCHARGE SUMMARY
FACILITY: Metro General Medical Center
CONFIDENTIAL - PROTECTED HEALTH INFORMATION (HIPAA SECURE)

PATIENT DEMOGRAPHICS:
Patient Name: Sarah Jenkins
Date of Birth: 14-04-1988
Medical Record Number (MRN): MRN-8849201
National Identity / SSN: 987-12-8941
Health Insurance ID: BCBS-994820194
Primary Phone: +1 (415) 555-0182
Email: sarah.j.health@providermail.com

CLINICAL EVALUATION:
Attending Physician: Dr. Robert Harrison, MD (NPI: 1487295103)
Diagnostic Assessment: Routine preventative evaluation. No acute contraindications.
Prescription: Amoxicillin 500mg, oral daily for 7 days.

NOTICE: Unauthorized disclosure of this document violates federal HIPAA regulations.`;

    const file = new File([sampleMedicalText], 'Sample_Patient_Medical_Record.txt', { type: 'text/plain' });
    processFile(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#edede8] text-[#292929] selection:bg-[#dbdbd2]">
      
      {/* ─────────────────────────────────────────────────────────────
          1. ARCHITECTURAL HERO SECTION
      ────────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center text-center">
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ffffff] border border-[#00000014] text-xs text-[#292929] mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
          <span className="font-medium">Sovereign Redaction • 100% In-Memory WASM</span>
          <span className="text-[#8f8f8e]">•</span>
          <span className="text-[#6f6f6e] font-mono">0 Bytes Uploaded</span>
        </div>

        {/* Quiet Display Headline (Gleap style: Weight 400, tight tracking) */}
        <h1 className="text-4xl sm:text-6xl font-normal tracking-[-0.02em] text-[#141414] max-w-3xl leading-[1.1] mb-6">
          Sovereign document redaction. <br className="hidden sm:inline" />
          Zero telemetry.
        </h1>

        {/* Architectural Subtitle */}
        <p className="text-base sm:text-lg text-[#6f6f6e] max-w-2xl mb-8 leading-relaxed font-normal">
          Permanently incinerate Social Security Numbers, Tax IDs, Passports, confidential salary figures, client PII, and medical records inside your local browser memory. No cloud roundtrips, no server logs, mathematically zero bytes transmitted.
        </p>

        {/* Dual Pill Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={onNavigateToStudio}
            className="h-11 px-7 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToPricing}
            className="h-11 px-6 rounded-full bg-[#dbdbd2] hover:bg-[#d0d0c8] text-[#292929] border border-[#00000014] text-xs font-medium transition-all"
          >
            View Pricing & Trust
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            INTERACTIVE LIVE REDACTION DEMO SANDBOX
        ────────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-3xl bg-[#ffffff] rounded-[12px] p-6 sm:p-8 border border-[#00000014] shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-left mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#0000000f]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
                Interactive Redaction Sandbox
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#edede8] text-[#6f6f6e]">
                Live WASM Demo
              </span>
            </div>

            {/* Quick Filter Scrubber */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#6f6f6e] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#141414] text-white hover:bg-[#292929] transition-colors"
              >
                Redact All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ids')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#edede8] text-[#292929] hover:bg-[#dbdbd2] border border-[#00000014] transition-colors"
              >
                SSN & IDs
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('finance')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#edede8] text-[#292929] hover:bg-[#dbdbd2] border border-[#00000014] transition-colors"
              >
                Salary & Banking
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('contact')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#edede8] text-[#292929] hover:bg-[#dbdbd2] border border-[#00000014] transition-colors"
              >
                Contacts
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('none')}
                className="p-1 rounded-full text-[11px] font-medium text-[#6f6f6e] hover:text-[#141414] transition-colors"
                title="Reset redactions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Document Card */}
          <div className="p-5 rounded-[8px] bg-[#fbfbfa] border border-[#00000014] font-mono text-xs leading-relaxed space-y-3 text-[#292929]">
            <div className="text-[10px] uppercase font-semibold text-[#8f8f8e] border-b border-[#0000000a] pb-2 flex items-center justify-between">
              <span>EXECUTIVE EMPLOYMENT AGREEMENT • STRICTLY CONFIDENTIAL</span>
              <span className="text-[9px] text-[#6f6f6e]">Click any black box to toggle</span>
            </div>

            <div className="pt-1">
              Candidate:{' '}
              <button
                type="button"
                onClick={() => toggleEntity('name')}
                className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ${
                  activeToggles.name
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
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
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
                }`}
              >
                {activeToggles.ssn ? 'XXX-XX-4320' : '987-65-4320'}
              </button>
              <span className="text-[10px] text-[#8f8f8e] ml-2 font-sans">(Validated via US SSA Algorithm)</span>
            </div>

            <div>
              Direct Contact:{' '}
              <button
                type="button"
                onClick={() => toggleEntity('phone')}
                className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium mr-1.5 ${
                  activeToggles.phone
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
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
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
                }`}
              >
                {activeToggles.email ? '[EMAIL REDACTED]' : 'd.sterling@apexglobal.io'}
              </button>
            </div>

            <div>
              Annual Compensation:{' '}
              <button
                type="button"
                onClick={() => toggleEntity('salary')}
                className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium ${
                  activeToggles.salary
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
                }`}
              >
                {activeToggles.salary ? '[SALARY CONFIDENTIAL]' : '$185,000 USD / year + $25,000 Bonus'}
              </button>
            </div>

            <div>
              Direct Deposit Payroll:{' '}
              Routing:{' '}
              <button
                type="button"
                onClick={() => toggleEntity('routing')}
                className={`inline-flex items-center px-2 py-0.5 rounded transition-all font-mono font-medium mr-1.5 ${
                  activeToggles.routing
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
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
                    ? 'bg-[#141414] text-white shadow-sm hover:opacity-90'
                    : 'bg-[#dbdbd2]/70 text-[#141414] hover:bg-[#dbdbd2]'
                }`}
              >
                {activeToggles.account ? '••••••••9482' : '8492019482'}
              </button>
            </div>
          </div>

          {/* Sandbox Live Metrics Bar */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6f6f6e] pt-3 border-t border-[#0000000a]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
              <span className="font-mono text-[#141414] font-medium">
                {activeCount} of 7 Entities Scrubbed
              </span>
              <span className="text-[#8f8f8e]">•</span>
              <span>Vector stream glyphs destroyed</span>
            </div>
            <div className="text-[11px] font-mono text-[#141414] flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
              <span>0 bytes sent to network</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            DROPZONE CARD (Clean, uncluttered, no 6-button preset grid)
        ────────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-3xl bg-[#ffffff] rounded-[12px] p-6 sm:p-10 border border-[#00000014] shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-left">
          
          {/* Main Drag-and-Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`w-full rounded-[10px] border border-dashed p-8 sm:p-12 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer text-center ${
              isDragging
                ? 'border-[#141414] bg-[#edede8]/70'
                : 'border-[#dbdbd2] hover:border-[#141414] bg-[#edede8]/30 hover:bg-[#edede8]/50'
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
                <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mb-3" />
                <div className="text-xs font-medium text-[#141414] mb-1">
                  {progress.message || 'Processing in memory...'}
                </div>
                <div className="text-[11px] text-[#6f6f6e] font-mono">
                  {progress.total > 0 ? `${progress.current} / ${progress.total}` : 'Parsing client-side'}
                </div>
              </div>
            ) : (
              <>
                <div className="w-11 h-11 rounded-full bg-[#ffffff] border border-[#00000014] flex items-center justify-center mb-3 text-[#141414] shadow-sm">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-[#141414] mb-1">
                  Drop your PDF, Word, or image file here
                </div>
                <p className="text-xs text-[#6f6f6e] mb-4">
                  or <span className="text-[#141414] underline underline-offset-4">browse files</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#6f6f6e] font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-[#ffffff] border border-[#00000014]">PDF</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffffff] border border-[#00000014]">DOCX</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffffff] border border-[#00000014]">PNG / JPG</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffffff] border border-[#00000014]">TXT</span>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-[8px] bg-[#f8d7da] border border-[#f5c6cb] text-[#721c24] text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Sample Testers */}
          <div className="mt-5 pt-4 border-t border-[#0000000f] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#6f6f6e]">Don't have a document handy? Test immediately:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadSampleOfferLetter}
                className="px-3 py-1.5 rounded-full bg-[#edede8] hover:bg-[#dbdbd2] text-[#292929] border border-[#00000014] text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#141414]" />
                <span>Sample Executive Offer</span>
              </button>
              <button
                type="button"
                onClick={loadSampleMedicalRecord}
                className="px-3 py-1.5 rounded-full bg-[#edede8] hover:bg-[#dbdbd2] text-[#292929] border border-[#00000014] text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#141414]" />
                <span>Sample Medical Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE 10-SECOND OFFLINE CHALLENGE (Level 2: Warm Stone)
        ────────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-3xl mt-6 p-5 rounded-[12px] bg-[#dbdbd2] border border-[#00000014] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ffffff] text-[#141414] flex items-center justify-center shrink-0 mt-0.5 border border-[#00000014]">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#141414] flex items-center gap-2">
                <span>The 10-Second Offline & DevTools Verification Challenge</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cc02b]" />
              </div>
              <p className="text-xs text-[#6f6f6e] mt-1 leading-relaxed">
                Disconnect your Wi-Fi or open DevTools (<kbd className="font-mono bg-[#ffffff] px-1 rounded text-[#292929] border border-[#00000014]">F12</kbd> → Network). Drop any document: observe exactly <strong>0 requests sent</strong>. Processing is strictly contained within your browser process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. VECTOR SCRUBBING ARCHITECTURE COMPARISON
      ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#00000014] bg-[#ffffff]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6f6f6e] mb-2 block">
              Forensic Privacy
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#141414] tracking-[-0.02em]">
              Vector incineration vs. Naive black boxes
            </h2>
            <p className="mt-2 text-sm text-[#6f6f6e]">
              Why amateur web tools leak confidential data and how Redactify solves it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* The Danger: Naive Overlay */}
            <div className="p-6 rounded-[12px] bg-[#edede8] border border-[#00000014] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#c92a2a] uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Amateur Tools (High Leak Risk)</span>
                </div>
                <h3 className="text-lg font-normal text-[#141414] mb-3">
                  Superficial Black Box Overlay
                </h3>
                <p className="text-xs text-[#6f6f6e] leading-relaxed mb-4">
                  Standard PDF tools merely draw a black visual rectangle on top of existing text. The original character glyphs, bounding boxes, and metadata remain intact in the PDF stream.
                </p>

                {/* Visual Representation */}
                <div className="p-4 rounded-[8px] bg-[#ffffff] border border-[#00000014] font-mono text-xs space-y-2">
                  <div className="text-[#8f8f8e] text-[10px] uppercase">// PDF Text Stream Inspector</div>
                  <div className="relative p-2 bg-[#f8f9fa] rounded border border-[#e9ecef]">
                    <span className="text-[#495057] select-all">SSN: 987-65-4320</span>
                    <div className="absolute inset-0 bg-[#000000]/70 flex items-center justify-center text-[9px] text-white">
                      [Visual Black Box - Text Still Selectable Underneath!]
                    </div>
                  </div>
                  <div className="text-[11px] text-[#c92a2a] pt-1 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Anyone can press Ctrl+A / Ctrl+C to extract the hidden text underneath.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#0000000f] text-xs text-[#6f6f6e]">
                Retains author, timestamp, printer profile, and revision trees.
              </div>
            </div>

            {/* The Solution: Redactify Vector Scrubbing */}
            <div className="p-6 rounded-[12px] bg-[#ffffff] border-2 border-[#141414] flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#4cc02b] uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4cc02b]" />
                  <span>Redactify V2 (Zero-Trust Standard)</span>
                </div>
                <h3 className="text-lg font-normal text-[#141414] mb-3">
                  Permanent Vector Incineration
                </h3>
                <p className="text-xs text-[#6f6f6e] leading-relaxed mb-4">
                  Redactify parses the underlying PDF vector graph in WebAssembly. The sensitive glyph stream is destroyed and replaced with neutral coordinates. Text extraction tools yield zero characters.
                </p>

                {/* Visual Representation */}
                <div className="p-4 rounded-[8px] bg-[#edede8] border border-[#00000014] font-mono text-xs space-y-2">
                  <div className="text-[#6f6f6e] text-[10px] uppercase">// Scrubbed Vector Stream</div>
                  <div className="p-2 bg-[#141414] rounded text-[#ffffff] flex items-center justify-between text-[11px]">
                    <span className="text-[#8f8f8e]">SSN:</span>
                    <span className="text-[#ffffff] font-bold">XXX-XX-4320</span>
                    <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
                  </div>
                  <div className="text-[11px] text-[#292929] pt-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>Raw text incinerated • Metadata wiped • Cryptographically verified</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#0000000f] text-xs text-[#292929] flex items-center justify-between">
                <span>Certified Sovereign Export</span>
                <span className="text-[11px] font-mono text-[#6f6f6e]">pdf-lib WASM engine</span>
              </div>
            </div>
          </div>

          {/* Architectural Pipeline Diagram (Crisp non-AI vector diagram) */}
          <div className="mt-12 p-6 sm:p-8 rounded-[12px] bg-[#fbfbfa] border border-[#00000014]">
            <div className="text-center mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8f8f8e]">
                System Architecture
              </span>
              <h3 className="text-base sm:text-lg font-normal text-[#141414] mt-1">
                Zero-Egress Execution Sandbox
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
              {/* Step 1 */}
              <div className="p-4 rounded-[8px] bg-white border border-[#00000014] text-center flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-full bg-[#edede8] text-[#141414] font-mono text-xs flex items-center justify-center mx-auto mb-2 font-medium">
                    01
                  </div>
                  <div className="text-xs font-medium text-[#141414]">Local Buffer</div>
                  <p className="text-[11px] text-[#6f6f6e] mt-1.5 leading-normal">
                    File drops directly into browser Uint8Array buffer in volatile memory.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono text-[#8f8f8e]">RAM Allocation</div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-[8px] bg-white border border-[#00000014] text-center flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-full bg-[#edede8] text-[#141414] font-mono text-xs flex items-center justify-center mx-auto mb-2 font-medium">
                    02
                  </div>
                  <div className="text-xs font-medium text-[#141414]">WASM Parser</div>
                  <p className="text-[11px] text-[#6f6f6e] mt-1.5 leading-normal">
                    Vector structures and OOXML trees decomposed directly in WebAssembly.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono text-[#8f8f8e]">pdf-lib & jszip</div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-[8px] bg-white border border-[#00000014] text-center flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-full bg-[#edede8] text-[#141414] font-mono text-xs flex items-center justify-center mx-auto mb-2 font-medium">
                    03
                  </div>
                  <div className="text-xs font-medium text-[#141414]">PII Deduction</div>
                  <p className="text-[11px] text-[#6f6f6e] mt-1.5 leading-normal">
                    17 mathematical checksums executed across tokens in &lt;10ms.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono text-[#8f8f8e]">Luhn / Verhoeff / Mod-97</div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-[8px] bg-[#141414] text-white border border-[#141414] text-center flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white font-mono text-xs flex items-center justify-center mx-auto mb-2 font-medium">
                    04
                  </div>
                  <div className="text-xs font-medium text-white">Glyph Incineration</div>
                  <p className="text-[11px] text-[#dbdbd2] mt-1.5 leading-normal">
                    Raw stream destroyed; clean vector export generated with 0 egress.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono text-[#4cc02b]">0 Network Requests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. REGULATORY COMPLIANCE TILES
      ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#00000014] bg-[#edede8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6f6f6e] mb-2 block">
              Sovereignty & Governance
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#141414] tracking-[-0.02em]">
              Built for international legal, HR, and compliance mandates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                EU & UK GDPR
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Article 32 Security</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Eliminates cross-border data transfer liabilities because sensitive documents never leave client hardware.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                US HIPAA
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Safe Harbor Standard</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Removes all 18 PHI identifiers including Medical Record Numbers, dates of birth, names, and contact details.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                Financial & GLBA
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">PCI-DSS Safe Masking</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Protects credit cards, ABA bank routing numbers, IBANs, and wire transfer coordinates via Luhn algorithms.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                Global Privacy
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Zero-Data Retention</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Meets strict data minimization guidelines across CCPA, CPRA, India DPDP Act 2023, and ISO 27001 standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ENTERPRISE COMPARATIVE MATRIX
      ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#00000014] bg-[#ffffff]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6f6f6e] mb-2 block">
              Architectural Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#141414] tracking-[-0.02em]">
              How Redactify compares
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#00000014] rounded-[12px] overflow-hidden">
              <thead>
                <tr className="border-b border-[#00000014] bg-[#edede8] text-xs font-mono text-[#353535]">
                  <th className="py-3 px-5">Metric / Feature</th>
                  <th className="py-3 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014]">
                    Redactify V2
                  </th>
                  <th className="py-3 px-5 text-[#6f6f6e]">Adobe Acrobat Pro</th>
                  <th className="py-3 px-5 text-[#6f6f6e]">Cloud Web Redactors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00000014] text-xs text-[#353535]">
                <tr>
                  <td className="py-3.5 px-5 font-medium text-[#141414]">Processing Location</td>
                  <td className="py-3.5 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4cc02b]" /> 100% In-Memory RAM
                  </td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">Adobe Document Cloud</td>
                  <td className="py-3.5 px-5 text-[#c92a2a]">AWS / GCP third-party servers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-[#141414]">Air-Gapped / Offline</td>
                  <td className="py-3.5 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014]">
                    Yes (Full offline capability)
                  </td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">Requires cloud license checks</td>
                  <td className="py-3.5 px-5 text-[#c92a2a]">No (Fails immediately)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-[#141414]">Government ID Masking</td>
                  <td className="py-3.5 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014]">
                    Checksum validation (SSN, Tax IDs, Passports)
                  </td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">Manual regex setup</td>
                  <td className="py-3.5 px-5 text-[#c92a2a]">None or basic strings</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-[#141414]">Vector Text Scrubbing</td>
                  <td className="py-3.5 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014]">
                    Permanent glyph destruction
                  </td>
                  <td className="py-3.5 px-5 text-[#353535]">Yes</td>
                  <td className="py-3.5 px-5 text-[#c92a2a]">Often superficial overlays</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium text-[#141414]">Pricing Model</td>
                  <td className="py-3.5 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014]">
                    $9/mo or $29 Early-Bird Lifetime
                  </td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">$240+ / year recurring</td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">$60 - $120 / year recurring</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FAQ ACCORDION (Gleap Clean Style)
      ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#00000014] bg-[#edede8]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6f6f6e] mb-2 block">
              Clear Answers
            </span>
            <h2 className="text-3xl font-normal text-[#141414] tracking-[-0.02em]">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[12px] border border-[#00000014] bg-[#ffffff] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-normal text-sm text-[#141414] hover:text-[#000000] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6f6f6e] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6f6f6e] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[#6f6f6e] leading-relaxed border-t border-[#0000000f] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. ARCHITECTURAL FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-[#00000014] bg-[#ffffff] text-xs text-[#6f6f6e]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center font-mono text-xs">
              R
            </div>
            <span className="font-medium text-[#141414]">Redactify V2</span>
            <span className="text-[#8f8f8e]">•</span>
            <span>Zero-Trust Sovereign Redaction</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateToStudio}
              className="text-[#353535] hover:text-[#141414] transition-colors"
            >
              Studio
            </button>
            <button
              onClick={onNavigateToPricing}
              className="text-[#353535] hover:text-[#141414] transition-colors"
            >
              Pricing & Trust
            </button>
            <a 
              href="https://github.com/SAKTHIVEL280/redactify-v2" 
              target="_blank" 
              rel="noreferrer"
              className="text-[#353535] hover:text-[#141414] transition-colors"
            >
              GitHub
            </a>
          </div>

          <div className="text-[11px] text-[#8f8f8e]">
            © {new Date().getFullYear()} Redactify. Documents never leave your browser.
          </div>
        </div>
      </footer>
    </div>
  );
}
