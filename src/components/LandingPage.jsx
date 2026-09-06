import React, { useState, useCallback } from 'react';
import { 
  UploadCloud, ShieldAlert, ShieldCheck, BadgeCheck, Scale, Landmark, 
  Activity, UserCheck, WifiOff, FileText, CheckCircle2, Zap, ArrowRight, 
  ChevronDown, ChevronUp, Lock, Sparkles, Check, HelpCircle, EyeOff, 
  Layers, Download, ServerOff, FileCheck, ExternalLink
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
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

const FAQS = [
  {
    q: "How can I mathematically verify that my documents are never uploaded to any server?",
    a: "You don't have to trust us — you can verify it in 10 seconds. Open your browser's Developer Tools (F12 or Ctrl+Shift+I), navigate to the 'Network' tab, and drop your document. You will see 0 HTTP requests. Alternatively, turn off your Wi-Fi or unplug your internet cable: Redactify will continue to parse, redact, and export at full speed because the entire engine runs locally in your browser's WebAssembly and JavaScript memory."
  },
  {
    q: "Can someone inspect or remove the black boxes in exported PDFs to read the original text?",
    a: "No. Unlike amateur redaction tools that draw a black CSS box or overlay on top of the text, Redactify permanently incinerates the underlying text stream in the PDF vector structure using pdf-lib. The sensitive characters are destroyed and replaced with solid vector coordinates. Furthermore, all hidden PDF metadata (author, creation software, revision history, and printer timestamps) are automatically scrubbed."
  },
  {
    q: "Does Redactify comply with the Indian DPDP Act 2023 and UIDAI Aadhaar masking circulars?",
    a: "Yes. Under UIDAI regulations, sharing raw Aadhaar numbers is restricted — only the last 4 digits may remain visible. Redactify automatically validates Aadhaar numbers using the Verhoeff checksum algorithm and masks the first 8 digits (e.g. XXXX-XXXX-1234). It also satisfies the strict 'data minimization' requirements of the Digital Personal Data Protection (DPDP) Act 2023 because data fiduciaries do not transfer files to external cloud processors."
  },
  {
    q: "How does Redactify handle scanned documents and ID photos?",
    a: "If your document is a scanned image or photo without an embedded text layer (such as physical Aadhaar cards, stamped agreements, or signatures), Redactify automatically engages the Crosshair Manual Redaction tool or local in-browser OCR. Simply click and drag blackout boxes directly over any photo, stamp, or signature to permanently burn them out upon export."
  },
  {
    q: "Can I use Redactify on air-gapped enterprise machines?",
    a: "Yes. All WebAssembly models, Tesseract OCR language weights, and cryptographic parsers are bundled directly into the application bundle. Once loaded, Redactify operates with zero network connectivity."
  }
];

export function LandingPage({ onNavigateToStudio, onNavigateToPricing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

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
          rawText: text,
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

  const loadSampleResume = () => {
    const sampleResumeText = `Sakthivel E
Phone: +91 94872 92520 | Email: sakthivel.hsr06@gmail.com
LinkedIn: linkedin.com/in/sakthivel-e- | GitHub: github.com/SAKTHIVEL280
Portfolio: sakthivel.daeq.in | Redactify: redactify.daeq.in

PROFESSIONAL SUMMARY
Senior Software Engineer with 4+ years specializing in zero-trust client-side document processing, WebAssembly, and privacy-first web systems.

EXPERIENCE
Lead Systems Engineer - Solutions LLP (2023 - Present)
- Designed zero-telemetry vector parser processing 50-page PDFs in <2s in-memory.
- Enforced strict client-side encryption and UIDAI Verhoeff-compliant Aadhaar sanitization.

EDUCATION
K.S. Rangasamy College of Technology - B.E. Computer Science (2020 - 2024)`;

    const file = new File([sampleResumeText], 'Sample_Resume_Sakthivel.txt', { type: 'text/plain' });
    processFile(file);
  };

  const loadSampleOfferLetter = () => {
    const sampleOfferText = `Personal and Confidential
19 August 2026

Sakthivel E
C28/9, TNHB, Bagalur HUDCO Bagalur Road, Near Sri Vijay Vidyalaya School, Tamil Nadu - 635109
Aadhaar: 2184 4289 8716 | PAN: ABCPE1234F

Dear Sakthivel,
We are delighted to offer you employment at Management Consultants Private Limited.
Your fixed compensation will be ₹18,50,000 per annum.
Please review our privacy terms at www.cgi.com/en/data-privacy-policy.

Yours sincerely,
For Management Consultants Pvt. Ltd.
____________________________
Sarika Pradhan
Vice President Corporate Services`;

    const file = new File([sampleOfferText], 'Sample_OfferLetter_CGI.txt', { type: 'text/plain' });
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
          Permanently incinerate Aadhaar, PAN, SSN, confidential clauses, and personal identifiers inside your local browser memory. No cloud roundtrips, no server logs, mathematically zero bytes transmitted.
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
            INTERACTIVE DROPZONE & PRESET SELECTOR (Level 1: Frosted White)
        ────────────────────────────────────────────────────────────── */}
        <div className="w-full max-w-3xl bg-[#ffffff] rounded-[12px] p-6 sm:p-10 border border-[#00000014] shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-left">
          
          {/* Preset Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium uppercase tracking-wider text-[#6f6f6e]">
                Compliance Detection Preset:
              </label>
              <span className="text-[11px] text-[#8f8f8e] font-mono">
                Auto-calibrates heuristics
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(PRESETS).map((p) => {
                const Icon = PRESET_ICONS[p.icon] || ShieldAlert;
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePreset(p.id)}
                    className={`p-2.5 rounded-[8px] text-left transition-all border flex items-start gap-2 ${
                      isSelected
                        ? 'bg-[#edede8] border-[#141414] text-[#141414]'
                        : 'bg-[#ffffff] border-[#00000014] text-[#6f6f6e] hover:border-[#8f8f8e] hover:text-[#292929]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#141414]" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-[#8f8f8e] line-clamp-1">{p.description}</div>
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
                <span>Sample Offer Letter</span>
              </button>
              <button
                type="button"
                onClick={loadSampleResume}
                className="px-3 py-1.5 rounded-full bg-[#edede8] hover:bg-[#dbdbd2] text-[#292929] border border-[#00000014] text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#141414]" />
                <span>Sample Resume</span>
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
                    <span className="text-[#495057] select-all">Aadhaar: 2184 4289 8716</span>
                    <div className="absolute inset-0 bg-[#000000]/70 flex items-center justify-center text-[9px] text-white">
                      [Visual Black Box - Text Still Selectable Underneath!]
                    </div>
                  </div>
                  <div className="text-[11px] text-[#c92a2a] pt-1">
                    ⚠ Anyone can press Ctrl+A / Ctrl+C to extract the hidden data.
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
                    <span className="text-[#8f8f8e]">Aadhaar:</span>
                    <span className="text-[#ffffff] font-bold">XXXX-XXXX-8716</span>
                    <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
                  </div>
                  <div className="text-[11px] text-[#292929] pt-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>Raw text incinerated • Metadata wiped • Verhoeff verified</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#0000000f] text-xs text-[#292929] flex items-center justify-between">
                <span>Certified Sovereign Export</span>
                <span className="text-[11px] font-mono text-[#6f6f6e]">pdf-lib WASM engine</span>
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
              Built for legal, HR, and compliance mandates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                India DPDP Act 2023
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Section 8 Compliance</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Zero data fiduciary risk because raw personal data never leaves the data principal's local perimeter.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                UIDAI Circulars
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Aadhaar 8-Digit Masking</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Obscures the first 8 digits as <span className="font-mono text-[#141414]">XXXX-XXXX-1234</span> after Verhoeff checksum validation.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                EU / UK GDPR
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Article 32 Security</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Eliminates international data transfer risk by running exclusively on client hardware.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#00000014]">
              <div className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider mb-1">
                US HIPAA
              </div>
              <div className="text-sm font-normal text-[#141414] mb-2">Safe Harbor Standard</div>
              <p className="text-xs text-[#6f6f6e] leading-relaxed">
                Removes all 18 PHI identifiers including Medical Record Numbers, dates, names, and contact coordinates.
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
                  <td className="py-3.5 px-5 font-medium text-[#141414]">Aadhaar Masking</td>
                  <td className="py-3.5 px-5 text-[#141414] font-semibold bg-[#ffffff] border-x border-[#00000014]">
                    Verhoeff + 8-digit masking
                  </td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">Manual regex setup</td>
                  <td className="py-3.5 px-5 text-[#c92a2a]">None (Violates UIDAI)</td>
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
                    ₹499/mo or ₹999 Lifetime
                  </td>
                  <td className="py-3.5 px-5 text-[#6f6f6e]">₹19,000+ / year recurring</td>
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
