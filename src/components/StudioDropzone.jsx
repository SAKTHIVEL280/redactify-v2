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
import { createSampleOfferLetterPdf } from '../core/parsers/samplePdfGenerator';

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

  const loadSampleOfferLetter = async () => {
    try {
      const file = await createSampleOfferLetterPdf();
      processFile(file);
    } catch (err) {
      console.error('Failed to load sample PDF:', err);
    }
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
    <div className="flex-1 flex flex-col items-center justify-center p-3.5 sm:p-8 md:p-12 overflow-y-auto bg-warm-bone">
      <div className="w-full max-w-2xl text-center mb-6 sm:mb-8">
        <div className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-bark-grey font-semibold mb-2 sm:mb-3">
          Air-Gapped Local Studio
        </div>
        <h1 className="text-2xl sm:text-4xl font-serif font-normal tracking-tight text-charcoal mb-2">
          Open a document to redact
        </h1>
        <p className="text-xs sm:text-sm text-bark-grey max-w-md mx-auto px-2">
          Files are parsed in local volatile memory. <span className="text-charcoal font-semibold">Zero telemetry, zero cloud uploads.</span>
        </p>
      </div>

      <div className="w-full max-w-2xl bg-paper-white rounded-card p-4 sm:p-8 md:p-10 border border-stone-mist shadow-card text-left">
        {/* Clean Studio Preset Dropdown */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-card bg-soft-cream border border-stone-mist">
          <div>
            <label htmlFor="studio-preset-select" className="text-xs font-semibold text-charcoal block">
              Compliance Detection Preset
            </label>
            <span className="text-[11px] text-bark-grey">
              Preconfigures algorithmic pattern filters
            </span>
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              id="studio-preset-select"
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-paper-white border border-stone-mist rounded-button px-3.5 py-2 pr-8 text-xs font-mono font-medium text-charcoal shadow-sm hover:border-charcoal focus:outline-none cursor-pointer truncate"
            >
              {Object.values(PRESETS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-bark-grey absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-full rounded-card border-2 border-dashed p-6 sm:p-12 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer text-center ${
            isDragging
              ? 'border-charcoal bg-soft-cream'
              : 'border-stone-mist hover:border-charcoal bg-warm-bone/40 hover:bg-warm-bone/80'
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
              <div className="w-8 h-8 rounded-full border-2 border-charcoal border-t-transparent animate-spin mb-3" />
              <div className="text-xs font-medium text-charcoal mb-1">
                {progress.message || 'Processing in browser memory...'}
              </div>
              <div className="text-[11px] text-bark-grey font-mono">
                {progress.total > 0 ? `${progress.current} / ${progress.total}` : 'Parsing client-side'}
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-paper-white border border-stone-mist flex items-center justify-center mb-3 text-charcoal shadow-sm">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-charcoal mb-1">
                Drop your PDF, Word, or image scan here
              </div>
              <p className="text-xs text-bark-grey mb-3 sm:mb-4">
                or <span className="text-charcoal underline underline-offset-4 font-medium">browse files</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] text-bark-grey font-mono">
                <span className="px-2 py-0.5 rounded-full bg-paper-white border border-stone-mist">PDF</span>
                <span className="px-2 py-0.5 rounded-full bg-paper-white border border-stone-mist">DOCX</span>
                <span className="px-2 py-0.5 rounded-full bg-paper-white border border-stone-mist">PNG / JPG</span>
                <span className="px-2 py-0.5 rounded-full bg-paper-white border border-stone-mist">TXT</span>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-button bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Testers */}
        <div className="mt-5 pt-4 border-t border-stone-mist/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-bark-grey font-mono text-[11px] sm:text-xs">Test with sample documents:</span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadSampleOfferLetter}
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal border border-stone-mist text-[11px] sm:text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-charcoal" />
              <span>Sample Offer Letter</span>
            </button>
            <button
              type="button"
              onClick={loadSampleMedicalRecord}
              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal border border-stone-mist text-[11px] sm:text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-charcoal" />
              <span>Sample Medical Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
