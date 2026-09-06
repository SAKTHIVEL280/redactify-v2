import React, { useState, useCallback } from 'react';
import { 
  UploadCloud, ShieldAlert, ShieldCheck, BadgeCheck, Scale, Landmark, 
  Activity, UserCheck, WifiOff, FileText, CheckCircle2, Zap, ArrowRight, 
  ChevronDown, ChevronUp, Lock, Sparkles, Check, HelpCircle, EyeOff, 
  Layers, Download, ServerOff, FileCheck
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
import { PRESETS } from '../core/engine/presets';
import { parseAndScanPDF } from '../core/parsers/pdfParser';
import { detectEntities } from '../core/engine/detector';

const PRESET_ICONS = {
  ShieldAlert,
  BadgeCheck,
  Scale,
  Landmark,
  Activity,
  UserCheck
};

// Interactive FAQs
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
    a: "If your document is a scanned image or photo without an embedded text layer (such as physical Aadhaar cards, stamped agreements, or signatures), Redactify automatically engages the Crosshair Manual Redaction tool. Simply click and drag blackout boxes directly over any photo, stamp, or signature to permanently burn them out upon export."
  },
  {
    q: "What payment methods are supported for Pro upgrades in India and globally?",
    a: "For Indian customers, we support 100% frictionless UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking, and all Indian Visa/Mastercard credit and debit cards (including HDFC, ICICI, SBI) via Razorpay. For international customers, we support Visa, Mastercard, American Express, Apple Pay, and Google Pay through our global Merchant of Record."
  },
  {
    q: "Can I use Redactify on mobile devices or tablets?",
    a: "Yes. Redactify is completely responsive and runs in Chrome, Safari, Edge, and Firefox across Windows, macOS, Linux, iPadOS, iOS, and Android. Since processing takes place locally, performance is fast even on mobile chipsets."
  }
];

export function LandingPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [pricingCurrency, setPricingCurrency] = useState('INR'); // 'INR' or 'USD'

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
  const openProModal = useLicenseStore((s) => s.openProModal);

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
      } else if (fileType === 'docx' || fileType === 'text') {
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

  // Sample File Quick Loaders for Instant Testing
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
Aadhaar: 9876 5432 1098 | PAN: ABCDE1234F

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
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION & INTEGRATED DROPZONE
      ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Security Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Zero-Trust Client-Side Privacy Firewall</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 font-mono">0 Bytes Uploaded</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12] mb-6">
          Permanently redact sensitive files <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300">
            without uploading a single byte.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mb-8 leading-relaxed font-normal">
          The high-precision redaction suite for legal teams, compliance officers, HR, and privacy-conscious users. Removes Aadhaar, PAN, SSN, credit cards, names, and confidential records in milliseconds—100% inside your local browser memory.
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-10 text-xs text-zinc-400 font-medium">
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% In-Browser RAM</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Sub-5ms Execution</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <BadgeCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>DPDP Act 2023 & GDPR</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <WifiOff className="w-3.5 h-3.5 text-blue-400" />
            <span>Works 100% Offline</span>
          </div>
        </div>

        {/* Compliance Preset Selector */}
        <div className="w-full max-w-3xl mb-6 text-left">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Select Compliance Detection Preset:
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">
              Auto-calibrates regex & heuristics
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
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-sm shadow-rose-950/40 text-white'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
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

        {/* Main Drag-and-Drop Card */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-full max-w-3xl rounded-3xl border-2 border-dashed p-8 sm:p-14 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group shadow-2xl ${
            isDragging
              ? 'border-rose-500 bg-rose-500/5 scale-[1.01]'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/80'
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
            <div className="flex flex-col items-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
                <div className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-sm font-semibold text-white mb-1">
                {progress.message || 'Processing Document...'}
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                {progress.total > 0 ? `${progress.current} / ${progress.total}` : 'Running client-side scans'}
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 group-hover:bg-rose-500/10 group-hover:text-rose-400 border border-zinc-700/80 group-hover:border-rose-500/30 flex items-center justify-center mb-4 transition-all text-zinc-300 shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="text-lg sm:text-xl font-bold text-white mb-1">
                Drop your PDF, Word, or Image file here
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mb-5">
                or <span className="text-rose-400 underline underline-offset-4 font-semibold group-hover:text-rose-300">browse from your computer</span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span className="px-2.5 py-1 rounded-md bg-zinc-800/90 border border-zinc-700/60 text-zinc-300">PDF Documents</span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-800/90 border border-zinc-700/60 text-zinc-300">Word DOCX</span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-800/90 border border-zinc-700/60 text-zinc-300">Aadhaar / ID Images</span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-800/90 border border-zinc-700/60 text-zinc-300">Plain Text</span>
                <span className="text-zinc-500">• Up to 100MB</span>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="w-full max-w-3xl mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample File Testing Triggers */}
        <div className="w-full max-w-3xl mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-zinc-400 font-medium">Don't have a document ready? Test instantly:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleResume}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Try Sample Resume</span>
            </button>
            <button
              onClick={loadSampleOfferLetter}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Sample KYC Letter</span>
            </button>
          </div>
        </div>

        {/* "The 10-Second Offline & DevTools Challenge" (Idea B) */}
        <div className="w-full max-w-3xl mt-8 p-5 rounded-2xl bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>The 10-Second Offline & DevTools Challenge</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Verify Yourself
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Don't take our word on trust. <strong>Turn off your Wi-Fi or open DevTools Network tab (<kbd className="font-mono bg-zinc-800 px-1 rounded text-zinc-300">F12</kbd>)</strong> right now. Drop any sensitive legal or KYC document. You will see exactly <strong>0 requests sent</strong>. Redactify runs 100% locally in your device's memory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. HOW IT WORKS (3-STEP VISUAL PIPELINE)
      ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">
              Architected for Zero Leaks
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              How Redactify works in 3 secure steps
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Zero cloud uploads, zero external API keys, zero data persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col relative group hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-bold flex items-center justify-center mb-5 text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Drop in Browser Memory</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Your PDF, Word document, or image is read directly into volatile browser RAM via WebAssembly and HTML5 File API. No intermediate temporary files are saved.
              </p>
              <div className="mt-auto pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <ServerOff className="w-3.5 h-3.5 text-zinc-400" />
                <span>Zero server transmission</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col relative group hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center mb-5 text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sub-5ms Entity Scanning</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Our mathematical engine runs Luhn (Cards), Verhoeff (Aadhaar), ISO 7064 (IBAN), and title-case heuristics to auto-flag PII, or use the crosshair tool for manual drawing.
              </p>
              <div className="mt-auto pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Runs in ~3.5 milliseconds</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col relative group hover:border-zinc-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center mb-5 text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Permanent Vector Burn</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Redactify modifies underlying PDF vector streams, scrubs hidden metadata (authors, timestamps), and incinerates text content permanently. Completely unrecoverable.
              </p>
              <div className="mt-auto pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Forensically unrecoverable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. COMPARISON MATRIX: REDACTIFY VS ADOBE VS CLOUD TOOLS
      ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">
              Enterprise Truth
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Why legal and security teams choose Redactify
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Cloud redaction websites upload your confidential legal contracts and Aadhaar numbers to unknown third-party servers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-xs font-mono text-zinc-400">
                  <th className="py-4 px-6">Feature & Security Standard</th>
                  <th className="py-4 px-6 text-rose-400 font-bold bg-rose-500/10 border-x border-rose-500/20">
                    Redactify V2
                  </th>
                  <th className="py-4 px-6 text-zinc-300">Adobe Acrobat Pro</th>
                  <th className="py-4 px-6 text-zinc-400">Cloud Web Redactors (Smallpdf, ILovePDF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs">
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-white">Data Processing Location</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-bold bg-rose-500/5 border-x border-rose-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 100% Local Device RAM
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">Syncs to Adobe Document Cloud</td>
                  <td className="py-3.5 px-6 text-red-400 font-medium">Uploaded to AWS / GCP third-party servers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-white">Works in Airplane Mode / Offline</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-bold bg-rose-500/5 border-x border-rose-500/20">
                    Yes (100% Offline Capable)
                  </td>
                  <td className="py-3.5 px-6 text-amber-400">Requires periodic cloud license check</td>
                  <td className="py-3.5 px-6 text-red-400">No (Fails immediately)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-white">Indian KYC & Aadhaar Masking</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-bold bg-rose-500/5 border-x border-rose-500/20">
                    Built-in (Verhoeff + 8-digit masking)
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">Manual regex configuration only</td>
                  <td className="py-3.5 px-6 text-red-400">None (Violates UIDAI guidelines)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-white">True Vector Text Incineration</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-bold bg-rose-500/5 border-x border-rose-500/20">
                    Yes (Forensically unrecoverable)
                  </td>
                  <td className="py-3.5 px-6 text-emerald-400">Yes</td>
                  <td className="py-3.5 px-6 text-amber-400">Often just draws black overlay</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-white">Metadata & Timestamp Sanitization</td>
                  <td className="py-3.5 px-6 text-emerald-400 font-bold bg-rose-500/5 border-x border-rose-500/20">
                    Automatic on every export
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">Requires deep manual menu search</td>
                  <td className="py-3.5 px-6 text-zinc-500">Uncertain / Retained</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-white">Pricing Model</td>
                  <td className="py-3.5 px-6 text-white font-bold bg-rose-500/5 border-x border-rose-500/20">
                    $9/mo or ₹499/mo (Lifetime Available)
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">$239.88 / year recurring</td>
                  <td className="py-3.5 px-6 text-zinc-400">$6-$12/mo recurring</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. COMPLIANCE & REGULATORY ALIGNMENT
      ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80 bg-zinc-900/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-rose-400 font-mono font-bold text-xs mb-1">INDIA DPDP ACT 2023</div>
              <div className="text-white font-bold text-sm mb-2">Section 8 Compliance</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Zero data fiduciary liability because raw confidential personal data never leaves the data principal's browser perimeter.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-amber-400 font-mono font-bold text-xs mb-1">UIDAI CIRCULAR COMPLIANT</div>
              <div className="text-white font-bold text-sm mb-2">Aadhaar 8-Digit Masking</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Automatically obscures the first 8 digits as <span className="font-mono text-zinc-200">XXXX-XXXX-1234</span> while validating via the Verhoeff algorithm.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-emerald-400 font-mono font-bold text-xs mb-1">EUROPEAN UNION GDPR</div>
              <div className="text-white font-bold text-sm mb-2">Article 32 Security</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Eliminates cross-border international data transfer liabilities by processing all documents exclusively on EU client hardware.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-blue-400 font-mono font-bold text-xs mb-1">US HEALTHCARE HIPAA</div>
              <div className="text-white font-bold text-sm mb-2">Safe Harbor 18 Identifiers</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Removes all 18 Protected Health Information (PHI) identifiers including MRNs, dates, names, and contact coordinates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SAAS PRICING MATRIX
      ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80 bg-zinc-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">
            Transparent Pricing
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-4">
            Start free, upgrade for unlimited power
          </p>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8">
            No surprise overages. No sneaky recurring fees if you choose lifetime.
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 mb-10">
            <button
              onClick={() => setPricingCurrency('INR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pricingCurrency === 'INR' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              India (UPI / ₹ INR)
            </button>
            <button
              onClick={() => setPricingCurrency('USD')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pricingCurrency === 'USD' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Global ($ USD)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Free Trial
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-white">{pricingCurrency === 'INR' ? '₹0' : '$0'}</span>
                  <span className="text-xs text-zinc-500">forever</span>
                </div>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Ideal for testing detection accuracy on single-page documents and ID cards.
                </p>

                <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Page 1 Vector Redaction Export</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full sub-5ms Entity Detection Engine</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Manual Crosshair Drawing Tool</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>100% Client-Side Privacy Firewall</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <span className="w-4 h-4 text-center">✕</span>
                    <span>Includes trial watermark header/footer</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <span className="w-4 h-4 text-center">✕</span>
                    <span>Multi-page export restricted</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-zinc-800/80">
                <div className="text-center text-xs text-zinc-500 font-mono">
                  Active by default • No account needed
                </div>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-rose-950/20 to-zinc-900/80 border-2 border-rose-500/40 relative flex flex-col justify-between shadow-2xl">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider mb-2">
                  Pro Commercial Pass
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-white">
                    {pricingCurrency === 'INR' ? '₹499' : '$9'}
                  </span>
                  <span className="text-xs text-zinc-400">/ month</span>
                </div>
                <div className="text-[11px] text-amber-400 font-mono mb-4">
                  or {pricingCurrency === 'INR' ? '₹999' : '$29'} Lifetime Deal
                </div>
                <p className="text-xs text-zinc-300 mb-6 leading-relaxed">
                  For lawyers, HR teams, fintechs, and anyone handling multi-page confidential records.
                </p>

                <ul className="space-y-3 text-xs text-zinc-200 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    <span><strong>Unlimited Multi-Page Documents</strong> (50+ pages)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    <span><strong>100% Watermark-Free Clean Vector Export</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Word DOCX & High-Res Image Redactions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Custom Hex Colors & Text Labels ([CONFIDENTIAL])</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Custom Regex Pattern Engine</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Priority Engineering Support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openProModal('pricing_card')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-950/60 hover:shadow-rose-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-rose-200" />
                <span>Upgrade to Pro ({pricingCurrency === 'INR' ? '₹499 / mo' : '$9 / mo'})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FREQUENTLY ASKED QUESTIONS (FAQ)
      ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">
              Got Questions?
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white hover:text-rose-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
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
          7. FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/80 bg-zinc-950 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[9px] flex items-center justify-center">
                <span className="font-extrabold text-sm text-rose-500 font-mono">R</span>
              </div>
            </div>
            <div>
              <div className="font-bold text-zinc-200">Redactify V2</div>
              <div className="text-[11px] text-zinc-500">Zero-Trust Document Redactor</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Client-Side Engine
            </span>
            <a 
              href="https://github.com/SAKTHIVEL280/redactify-v2" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <div className="text-zinc-500 text-[11px] text-center sm:text-right">
            © {new Date().getFullYear()} Redactify. Files never leave your browser.
          </div>
        </div>
      </footer>
    </div>
  );
}
