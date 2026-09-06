import React, { useState, useCallback } from 'react';
import { 
  UploadCloud, ShieldAlert, FileText, FileCheck, ArrowRight, Sparkles, ChevronDown 
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { PRESETS } from '../core/engine/presets';
import { parseAndScanPDF } from '../core/parsers/pdfParser';
import { parseAndExtractDOCX } from '../core/parsers/docxParser';
import { detectEntities } from '../core/engine/detector';

export function StudioDropzone() {
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto bg-[#edede8]">
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffffff] border border-[#00000014] text-xs text-[#292929] mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
          <span>Studio Workbench • Local Client RAM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-[#141414] mb-2">
          Open a document to redact
        </h1>
        <p className="text-xs sm:text-sm text-[#6f6f6e] max-w-md mx-auto">
          Files are parsed in volatile browser memory. Zero telemetry, zero uploads.
        </p>
      </div>

      <div className="w-full max-w-2xl bg-[#ffffff] rounded-[12px] p-6 sm:p-10 border border-[#00000014] shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-left">
        {/* Clean Studio Preset Dropdown */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-[#fbfbfa] border border-[#00000014]">
          <div>
            <label htmlFor="studio-preset-select" className="text-xs font-semibold text-[#141414] block">
              Compliance Detection Preset
            </label>
            <span className="text-[11px] text-[#6f6f6e]">
              Preconfigures sovereign regex and algorithmic filters
            </span>
          </div>
          <div className="relative">
            <select
              id="studio-preset-select"
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="appearance-none bg-[#ffffff] border border-[#00000014] rounded-full px-4 py-2 pr-8 text-xs font-medium text-[#141414] shadow-sm hover:border-[#141414] focus:outline-none cursor-pointer"
            >
              {Object.values(PRESETS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6f6f6e] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Dropzone */}
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
                {progress.message || 'Processing in browser memory...'}
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
          <span className="text-[#6f6f6e]">Quick test with sample documents:</span>
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
    </div>
  );
}
