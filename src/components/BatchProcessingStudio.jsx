import React, { useState } from 'react';
import { 
  ArrowLeft, Play, Download, Archive, AlertCircle, 
  ShieldCheck, ChevronDown, Check, Loader2 
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
import { PRESETS } from '../core/engine/presets';
import { processBatchItem, createBatchZip } from '../core/parsers/batchExporter';

export function BatchProcessingStudio() {
  const batchQueue = useDocumentStore((s) => s.batchQueue);
  const updateBatchItem = useDocumentStore((s) => s.updateBatchItem);
  const clearBatch = useDocumentStore((s) => s.clearBatch);

  const activePreset = useRedactionStore((s) => s.activePreset);
  const setActivePreset = useRedactionStore((s) => s.setActivePreset);
  const customRules = useRedactionStore((s) => s.customRules);
  const style = useRedactionStore((s) => s.style);

  const isPro = useLicenseStore((s) => s.isPro);
  const openProModal = useLicenseStore((s) => s.openProModal);

  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const totalSize = batchQueue.reduce((sum, item) => sum + (item.file?.size || 0), 0);
  const totalSizeMb = (totalSize / (1024 * 1024)).toFixed(1);
  const completedItems = batchQueue.filter((item) => item.status === 'ready');
  const allComplete = batchQueue.length > 0 && completedItems.length === batchQueue.length;

  const handleStartBatch = async () => {
    if (!isPro) {
      openProModal('batch');
      return;
    }

    setIsProcessingBatch(true);

    for (const item of batchQueue) {
      if (item.status === 'ready') continue;

      updateBatchItem(item.id, { status: 'scanning', progress: 25 });
      try {
        updateBatchItem(item.id, { status: 'redacting', progress: 65 });
        const result = await processBatchItem(item, activePreset, customRules, style, isPro);
        updateBatchItem(item.id, {
          status: 'ready',
          progress: 100,
          outputBlob: result.outputBlob,
          redactionsCount: result.redactionsCount,
          ext: result.ext
        });
      } catch (err) {
        console.error(`Batch processing error on ${item.file.name}:`, err);
        updateBatchItem(item.id, {
          status: 'error',
          progress: 100,
          error: err.message || 'Processing failed'
        });
      }
    }

    setIsProcessingBatch(false);
  };

  const handleDownloadSingle = (item) => {
    if (!item.outputBlob) return;
    const baseName = item.file.name.replace(/\.[^/.]+$/, '');
    const ext = item.ext || item.fileType;
    const url = URL.createObjectURL(item.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_redacted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    if (completedItems.length === 0) return;
    setIsZipping(true);
    try {
      const presetName = PRESETS[activePreset]?.name || 'Standard Compliance';
      const zipBlob = await createBatchZip(completedItems, presetName);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Redactify_Batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert(`Failed to create ZIP package: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-warm-bone text-charcoal py-6 px-3 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-mist pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={clearBatch}
              className="p-2 rounded-button bg-soft-cream hover:bg-stone-mist/40 border border-stone-mist text-charcoal transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-normal text-charcoal">
                  Batch Multi-File Redaction Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-100 text-amber-900 border border-amber-300">
                  PRO
                </span>
              </div>
              <p className="text-xs text-bark-grey font-mono mt-0.5">
                {batchQueue.length} files queued ({totalSizeMb} MB) • 100% Client-Side In-Memory Execution
              </p>
            </div>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-bark-grey">
              Preset:
            </span>
            <div className="relative">
              <select
                value={activePreset}
                onChange={(e) => setActivePreset(e.target.value)}
                className="appearance-none bg-paper-white border border-stone-mist rounded-button px-3 py-1.5 pr-8 text-xs font-mono font-medium text-charcoal shadow-xs focus:outline-none focus:border-charcoal cursor-pointer"
              >
                {Object.values(PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-bark-grey absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Batch Queue Table Card */}
        <div className="bg-paper-white border border-stone-mist rounded-card shadow-card overflow-hidden">
          <div className="p-4 border-b border-stone-mist bg-soft-cream/60 flex items-center justify-between">
            <div className="text-xs font-mono font-semibold text-charcoal uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Queue Status ({completedItems.length}/{batchQueue.length} Ready)</span>
            </div>
            {isProcessingBatch && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-900">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing in browser memory...</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-mist/60 bg-warm-bone/40 text-[11px] font-mono uppercase tracking-wider text-bark-grey">
                  <th className="py-2.5 px-4">File Name</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Entities Redacted</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-mist/40 text-xs font-mono">
                {batchQueue.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-soft-cream/30 transition-colors">
                    <td className="py-3 px-4 max-w-[240px] truncate text-charcoal font-medium">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-bark-grey text-[10px]">{idx + 1}.</span>
                        <span className="truncate">{item.file?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-paper-white border border-stone-mist text-charcoal">
                        {item.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-bark-grey">
                      {((item.file?.size || 0) / 1024).toFixed(0)} KB
                    </td>
                    <td className="py-3 px-3">
                      {item.status === 'ready' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                          <Check className="w-3 h-3" />
                          <span>Ready</span>
                        </span>
                      )}
                      {item.status === 'scanning' && (
                        <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full text-[10px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Scanning</span>
                        </span>
                      )}
                      {item.status === 'redacting' && (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Sanitizing</span>
                        </span>
                      )}
                      {item.status === 'queued' && (
                        <span className="text-bark-grey bg-stone-mist/40 px-2 py-0.5 rounded-full text-[10px]">
                          Queued
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]" title={item.error}>
                          <AlertCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.status === 'ready' ? (
                        <span className="font-semibold text-charcoal">{item.redactionsCount || 0}</span>
                      ) : (
                        <span className="text-bark-grey">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'ready' ? (
                        <button
                          onClick={() => handleDownloadSingle(item)}
                          className="px-2.5 py-1 rounded-button bg-soft-cream hover:bg-stone-mist/40 border border-stone-mist text-charcoal text-[11px] font-mono transition-all inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <span className="text-bark-grey text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Floating Action Bar */}
      <div className="max-w-5xl mx-auto w-full pt-6">
        <div className="p-4 rounded-card bg-paper-white border border-stone-mist shadow-card-hover flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-bark-grey">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cryptographic audit log included in ZIP package upon export.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={clearBatch}
              disabled={isProcessingBatch}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-button bg-soft-cream hover:bg-stone-mist/40 border border-stone-mist text-bark-grey hover:text-charcoal text-xs font-mono transition-all disabled:opacity-50"
            >
              Cancel Batch
            </button>

            {!allComplete ? (
              <button
                onClick={handleStartBatch}
                disabled={isProcessingBatch}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingBatch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Redacting Batch...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Batch Redaction</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-button bg-amber-800 hover:bg-amber-900 text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All as ZIP ({completedItems.length} Files)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
