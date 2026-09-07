import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle, X, ShieldAlert, Sparkles, Loader2, RotateCw, RotateCcw } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { scanImageWithOCR } from '../core/parsers/ocrScanner';

let pdfjsLib = null;
async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  return pdfjsLib;
}

export function DocumentViewer() {
  const file = useDocumentStore((s) => s.file);
  const fileType = useDocumentStore((s) => s.fileType);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const rawText = useDocumentStore((s) => s.rawText);
  const isScannedDocument = useDocumentStore((s) => s.isScannedDocument);
  const rotation = useDocumentStore((s) => s.rotation);
  const setRotation = useDocumentStore((s) => s.setRotation);
  const rotateClockwise = useDocumentStore((s) => s.rotateClockwise);
  const rotateCounterClockwise = useDocumentStore((s) => s.rotateCounterClockwise);

  const redactions = useRedactionStore((s) => s.redactions);
  const toggleRedaction = useRedactionStore((s) => s.toggleRedaction);
  const removeRedaction = useRedactionStore((s) => s.removeRedaction);
  const addRedaction = useRedactionStore((s) => s.addRedaction);
  const setRedactions = useRedactionStore((s) => s.setRedactions);
  const isDrawingMode = useRedactionStore((s) => s.isDrawingMode);
  const toggleInspector = useRedactionStore((s) => s.toggleInspector);
  const style = useRedactionStore((s) => s.style);
  const activePreset = useRedactionStore((s) => s.activePreset);
  const customRules = useRedactionStore((s) => s.customRules);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const pdfFileRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);

  // Keyboard Navigation for Multi-Page Documents
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (currentPage < pageCount) {
          e.preventDefault();
          setCurrentPage(currentPage + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 1) {
          e.preventDefault();
          setCurrentPage(currentPage - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pageCount, setCurrentPage]);
  const [drawingStart, setDrawingStart] = useState(null);
  const [drawingBox, setDrawingBox] = useState(null);
  const [renderedDimensions, setRenderedDimensions] = useState({ width: 0, height: 0 });

  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ pct: 0, msg: '' });
  const [ocrStatusMessage, setOcrStatusMessage] = useState(null);

  const handleRunOcr = async () => {
    if (!canvasRef.current && !file) return;
    setIsOcrScanning(true);
    setOcrStatusMessage(null);
    try {
      const target = canvasRef.current || file;
      const result = await scanImageWithOCR(
        target,
        activePreset,
        customRules,
        currentPage - 1,
        (pct, total, msg) => {
          setOcrProgress({ pct, msg });
        }
      );

      if (result.redactions && result.redactions.length > 0) {
        const existing = redactions.filter(r => r.pageIndex !== (currentPage - 1) || r.type === 'manual');
        setRedactions([...existing, ...result.redactions]);
        setOcrStatusMessage(`Found ${result.redactions.length} PII entities!`);
      } else {
        setOcrStatusMessage('No PII entities detected in this image.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrStatusMessage(`OCR failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsOcrScanning(false);
    }
  };

  const handleRotateCw = useCallback(() => {
    rotateClockwise();
    if (redactions.length > 0) {
      setRedactions(redactions.map(r => ({
        ...r,
        x: Math.max(0, Math.min(1, 1 - r.y - r.height)),
        y: Math.max(0, Math.min(1, r.x)),
        width: r.height,
        height: r.width
      })));
    }
  }, [rotateClockwise, redactions, setRedactions]);

  const handleRotateCcw = useCallback(() => {
    rotateCounterClockwise();
    if (redactions.length > 0) {
      setRedactions(redactions.map(r => ({
        ...r,
        x: Math.max(0, Math.min(1, r.y)),
        y: Math.max(0, Math.min(1, 1 - r.x - r.width)),
        width: r.height,
        height: r.width
      })));
    }
  }, [rotateCounterClockwise, redactions, setRedactions]);

  // Render PDF or Image page to canvas
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    let renderTask = null;
    let pageObj = null;

    if (fileType === 'pdf') {
      const renderPdfPage = async () => {
        try {
          const lib = await getPdfJs();

          // Reuse cached PDF document if file hasn't changed
          if (pdfFileRef.current !== file || !pdfDocRef.current) {
            if (pdfDocRef.current && typeof pdfDocRef.current.destroy === 'function') {
              try { await pdfDocRef.current.destroy(); } catch (e) {}
            }
            const arrayBuffer = await file.arrayBuffer();
            pdfDocRef.current = await lib.getDocument({ data: arrayBuffer }).promise;
            pdfFileRef.current = file;
          }

          const pdf = pdfDocRef.current;
          pageObj = await pdf.getPage(currentPage);

          if (!isMounted) {
            if (pageObj.cleanup) pageObj.cleanup();
            return;
          }

          // Render at crisp scale with rotation
          const rot = ((rotation % 360) + 360) % 360;
          const scale = 1.5 * zoom;
          const viewport = pageObj.getViewport({ scale, rotation: (pageObj.rotate + rot) % 360 });
          const canvas = canvasRef.current;
          if (!canvas) {
            if (pageObj.cleanup) pageObj.cleanup();
            return;
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          renderTask = pageObj.render({ canvasContext: ctx, viewport });
          await renderTask.promise;

          if (isMounted) {
            setRenderedDimensions({ width: viewport.width, height: viewport.height });
          }
        } catch (err) {
          if (err.name !== 'RenderingCancelledException') {
            console.error('PDF render error:', err);
          }
        }
      };

      renderPdfPage();
    } else if (fileType === 'image') {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        if (!isMounted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rot = ((rotation % 360) + 360) % 360;
        const isSideways = rot === 90 || rot === 270;
        const naturalW = img.naturalWidth || img.width || 800;
        const naturalH = img.naturalHeight || img.height || 600;

        const baseWidth = Math.min(naturalW, 850);
        const scale = baseWidth / naturalW;
        const baseHeight = Math.round(naturalH * scale);

        const displayWidth = Math.round((isSideways ? baseHeight : baseWidth) * zoom);
        const displayHeight = Math.round((isSideways ? baseWidth : baseHeight) * zoom);

        canvas.width = displayWidth;
        canvas.height = displayHeight;
        const ctx = canvas.getContext('2d');

        ctx.save();
        if (rot === 90) {
          ctx.translate(displayWidth, 0);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, 0, 0, Math.round(baseWidth * zoom), Math.round(baseHeight * zoom));
        } else if (rot === 180) {
          ctx.translate(displayWidth, displayHeight);
          ctx.rotate((180 * Math.PI) / 180);
          ctx.drawImage(img, 0, 0, Math.round(baseWidth * zoom), Math.round(baseHeight * zoom));
        } else if (rot === 270) {
          ctx.translate(0, displayHeight);
          ctx.rotate((270 * Math.PI) / 180);
          ctx.drawImage(img, 0, 0, Math.round(baseWidth * zoom), Math.round(baseHeight * zoom));
        } else {
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        }
        ctx.restore();

        if (isMounted) {
          setRenderedDimensions({ width: displayWidth, height: displayHeight });
        }
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    }

    return () => {
      isMounted = false;
      if (renderTask && renderTask.cancel) renderTask.cancel();
      if (pageObj && pageObj.cleanup) pageObj.cleanup();
    };
  }, [file, fileType, currentPage, zoom, rotation]);

  // Clean up PDF document proxy when unmounting or clearing document
  useEffect(() => {
    return () => {
      if (pdfDocRef.current && typeof pdfDocRef.current.destroy === 'function') {
        try { pdfDocRef.current.destroy(); } catch (e) {}
        pdfDocRef.current = null;
        pdfFileRef.current = null;
      }
    };
  }, []);

  // Current page normalized redactions
  const pageRedactions = redactions.filter(
    (r) => r.pageIndex === (currentPage - 1)
  );

  // Text selection state for Word DOCX and Plain Text files
  const [selectedTextSnippet, setSelectedTextSnippet] = useState(null);
  const [selectionCoords, setSelectionCoords] = useState(null);

  const handleTextMouseUp = () => {
    if (fileType === 'pdf' || fileType === 'image') return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text && text.length >= 2) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setSelectedTextSnippet(text);
          setSelectionCoords({
            top: Math.max(10, rect.top - containerRect.top - 45),
            left: Math.max(10, rect.left - containerRect.left + (rect.width / 2) - 60)
          });
        }
      } catch (e) {}
    } else {
      setSelectedTextSnippet(null);
      setSelectionCoords(null);
    }
  };

  const handleAddTextRedaction = (e) => {
    e.stopPropagation();
    if (!selectedTextSnippet) return;
    addRedaction({
      id: `manual_txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pageIndex: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      type: 'manual',
      category: 'manual',
      value: selectedTextSnippet,
      suggested: style.label || '[REDACTED]',
      confidence: 1.0,
      redact: true
    });
    setSelectedTextSnippet(null);
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  // Memoized interactive text segments for DOCX and TXT files
  const interactiveTextElements = useMemo(() => {
    if (!rawText || (fileType !== 'docx' && fileType !== 'text')) return null;

    // Get all redactions that have a non-empty string value
    const activeValues = redactions
      .filter((r) => r.value && typeof r.value === 'string' && r.value.trim().length > 0)
      .sort((a, b) => b.value.length - a.value.length);

    if (activeValues.length === 0) {
      return <span>{rawText}</span>;
    }

    // Map all occurrences in rawText
    const spans = [];
    for (const item of activeValues) {
      let searchIndex = 0;
      while (true) {
        const idx = rawText.indexOf(item.value, searchIndex);
        if (idx === -1) break;
        const end = idx + item.value.length;
        const overlaps = spans.some((s) => s.start < end && s.end > idx);
        if (!overlaps) {
          spans.push({ start: idx, end, redaction: item });
        }
        searchIndex = idx + 1;
      }
    }

    spans.sort((a, b) => a.start - b.start);

    const elements = [];
    let lastIdx = 0;

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      if (span.start > lastIdx) {
        elements.push(rawText.slice(lastIdx, span.start));
      }

      const r = span.redaction;
      const key = `txt_span_${i}_${span.start}`;

      if (r.redact) {
        elements.push(
          <mark
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              toggleRedaction(r.id);
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold cursor-pointer transition-all mx-0.5 shadow-sm select-none"
            style={{
              backgroundColor: style.color || '#09090b',
              color: style.textColor || '#ffffff'
            }}
            title={`${r.category.toUpperCase()}: "${r.value}". Click to unmask.`}
          >
            <span>{style.showLabel ? (r.suggested || style.label) : (r.suggested || '[REDACTED]')}</span>
            <span className="text-[9px] opacity-75 hover:opacity-100">✕</span>
          </mark>
        );
      } else {
        elements.push(
          <mark
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              toggleRedaction(r.id);
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-medium bg-amber-500/10 text-amber-900 border border-dashed border-amber-500/50 hover:bg-amber-500/20 cursor-pointer transition-all mx-0.5 select-none"
            title={`${r.category.toUpperCase()}: "${r.value}". Click to redact.`}
          >
            <span>{r.value}</span>
            <span className="text-[9px] font-bold text-amber-600">+</span>
          </mark>
        );
      }

      lastIdx = span.end;
    }

    if (lastIdx < rawText.length) {
      elements.push(rawText.slice(lastIdx));
    }

    return elements;
  }, [rawText, fileType, redactions, style, toggleRedaction]);

  // Manual Crosshair Drawing Handlers (Active only for PDF and Image canvas modes)
  const handleMouseDown = (e) => {
    if (!isDrawingMode || !containerRef.current || (fileType !== 'pdf' && fileType !== 'image')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawingStart({ x, y });
    setDrawingBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!drawingStart || !containerRef.current || (fileType !== 'pdf' && fileType !== 'image')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const currentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const x = Math.min(drawingStart.x, currentX);
    const y = Math.min(drawingStart.y, currentY);
    const width = Math.abs(currentX - drawingStart.x);
    const height = Math.abs(currentY - drawingStart.y);

    setDrawingBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (fileType !== 'pdf' && fileType !== 'image') return;
    if (drawingBox && drawingBox.width > 0.01 && drawingBox.height > 0.01) {
      addRedaction({
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        pageIndex: currentPage - 1,
        x: drawingBox.x,
        y: drawingBox.y,
        width: drawingBox.width,
        height: drawingBox.height,
        type: 'manual',
        category: 'manual',
        value: 'Manual Area',
        suggested: style.label || '[CONFIDENTIAL]',
        confidence: 1.0,
        redact: true
      });
    }
    setDrawingStart(null);
    setDrawingBox(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-warm-bone overflow-hidden select-none">
      {/* Viewer Top Toolbar (Pagination & Zoom) */}
      <div className="h-12 border-b border-stone-mist bg-paper-white px-4 flex items-center justify-between text-xs text-charcoal shrink-0">
        {/* Pagination */}
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-button hover:bg-stone-mist/30 disabled:opacity-25 text-charcoal transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-bark-grey">
              Page <strong className="text-charcoal font-semibold">{currentPage}</strong> of {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage >= pageCount}
              className="p-1 rounded-button hover:bg-stone-mist/30 disabled:opacity-25 text-charcoal transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-bark-grey">
            {fileType === 'image' ? 'Image Mode: Drag crosshair to blackout areas' : 'Single Page Document'}
          </div>
        )}

        {/* Toolbar Controls: Rotation & Zoom */}
        <div className="flex items-center gap-3">
          {/* Rotation Controls */}
          <div className="flex items-center gap-1 border-r border-stone-mist pr-2.5">
            <button
              onClick={handleRotateCcw}
              className="p-1.5 rounded-button hover:bg-stone-mist/30 text-bark-grey hover:text-charcoal transition-colors"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRotateCw}
              className="p-1.5 rounded-button hover:bg-stone-mist/30 text-bark-grey hover:text-charcoal transition-colors"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {rotation !== 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-soft-cream border border-stone-mist text-charcoal font-medium">
                {rotation}°
              </span>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
              className="p-1.5 rounded-button hover:bg-stone-mist/30 text-bark-grey hover:text-charcoal transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-bark-grey w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
              className="p-1.5 rounded-button hover:bg-stone-mist/30 text-bark-grey hover:text-charcoal transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Mobile Entities Drawer Toggle */}
            <button
              onClick={toggleInspector}
              className="md:hidden ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-button bg-soft-cream border border-stone-mist text-xs font-mono font-medium text-charcoal hover:bg-stone-mist/40 transition-colors"
              title="Toggle Entity Inspector"
            >
              <span>Entities ({redactions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scanned Document / Image Helper Banner */}
      {(isScannedDocument || fileType === 'image') && (
        <div className="bg-soft-cream border-b border-stone-mist px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-charcoal shrink-0" />
            <span>
              <strong>Scanned / Image Document:</strong> Drag crosshair to redact areas, or run in-browser OCR.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Rotate Controls in Banner */}
            <div className="flex items-center gap-1 bg-paper-white px-2 py-0.5 rounded-button border border-stone-mist shadow-sm">
              <span className="text-[10px] text-bark-grey mr-0.5 font-mono">Rotate:</span>
              <button
                onClick={handleRotateCcw}
                className="p-1 rounded hover:bg-stone-mist/30 text-charcoal transition-colors"
                title="Rotate 90° CCW"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={handleRotateCw}
                className="p-1 rounded hover:bg-stone-mist/30 text-charcoal transition-colors"
                title="Rotate 90° CW"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              {rotation !== 0 && (
                <span className="text-[10px] font-mono text-charcoal font-medium">
                  {rotation}°
                </span>
              )}
            </div>

            {ocrStatusMessage && (
              <span className="text-[11px] font-mono text-charcoal flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {ocrStatusMessage}
              </span>
            )}

            <button
              onClick={handleRunOcr}
              disabled={isOcrScanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-electric-indigo hover:bg-deep-violet text-white text-xs font-mono font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {isOcrScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{ocrProgress.msg || `${ocrProgress.pct}%`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Local OCR Scan</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-mono text-bark-grey hidden lg:inline">
              Click box to toggle • Hover to delete
            </span>
          </div>
        </div>
      )}

      {/* Canvas & Overlay Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center bg-warm-bone relative">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`my-auto relative shadow-card-hover rounded-card border border-stone-mist overflow-hidden bg-white max-w-full transition-transform ${
            isDrawingMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ width: renderedDimensions.width ? `${renderedDimensions.width}px` : 'auto' }}
        >
          {(fileType === 'pdf' || fileType === 'image') ? (
            <canvas ref={canvasRef} className="block max-w-full" />
          ) : (
            <div
              onMouseUp={handleTextMouseUp}
              className="p-8 text-charcoal bg-white min-h-[500px] w-[650px] max-w-full font-mono text-xs whitespace-pre-wrap leading-relaxed select-text"
            >
              <div className="mb-4 pb-3 border-b border-stone-mist/60 text-[11px] font-mono text-bark-grey flex items-center justify-between">
                <span>Word / Text Document View</span>
                <span className="text-electric-indigo font-medium">Click any tag to toggle • Select text to redact</span>
              </div>
              <div className="leading-relaxed">{interactiveTextElements}</div>
            </div>
          )}

          {/* Floating Text Selection Redact Tooltip */}
          {selectedTextSnippet && selectionCoords && (
            <div
              className="absolute z-30 bg-charcoal text-white rounded-lg shadow-xl px-3 py-1.5 flex items-center gap-2 text-xs font-mono animate-in fade-in zoom-in-95 duration-150"
              style={{
                top: `${selectionCoords.top}px`,
                left: `${selectionCoords.left}px`
              }}
            >
              <span className="max-w-[150px] truncate text-[11px] text-stone-300">
                "{selectedTextSnippet}"
              </span>
              <button
                onClick={handleAddTextRedaction}
                className="px-2 py-0.5 rounded bg-electric-indigo hover:bg-deep-violet text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>+ Redact</span>
              </button>
            </div>
          )}

          {/* Normalized Bounding Box Overlays */}
          {pageRedactions.map((box) => (
            <div
              key={box.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleRedaction(box.id);
              }}
              className={`absolute transition-all rounded-sm flex items-center justify-center text-[9px] font-mono font-bold select-none group cursor-pointer ${
                box.redact
                  ? 'border border-black shadow-sm'
                  : 'bg-zinc-400/20 border-2 border-dashed border-zinc-500/60 hover:bg-zinc-400/30'
              }`}
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
                backgroundColor: box.redact ? (style.color || '#09090b') : 'transparent',
                color: style.textColor || '#ffffff'
              }}
              title={`${box.category.toUpperCase()}: ${box.value} (Click to toggle)`}
            >
              {/* Show label if active */}
              {box.redact && style.showLabel && (
                <span className="truncate px-0.5 text-[8px] tracking-tight">
                  {box.suggested || style.label}
                </span>
              )}

              {/* Manual delete button on hover */}
              {box.type === 'manual' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRedaction(box.id);
                  }}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md"
                  title="Delete box"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}

          {/* Active Drawing Preview Box */}
          {drawingBox && (
            <div
              className="absolute border-2 border-rose-500 bg-rose-500/20 pointer-events-none rounded-sm"
              style={{
                left: `${drawingBox.x * 100}%`,
                top: `${drawingBox.y * 100}%`,
                width: `${drawingBox.width * 100}%`,
                height: `${drawingBox.height * 100}%`
              }}
            />
          )}
        </div>

        {/* Floating Bottom Page Navigator for Multi-Page Documents */}
        {pageCount > 1 && (
          <div className="sticky bottom-4 z-20 mt-4 flex items-center gap-2 bg-charcoal/95 text-white backdrop-blur-md px-4 py-1.5 rounded-full shadow-2xl border border-white/10 text-xs font-mono select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              title="Previous Page (ArrowLeft / PageUp)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-medium tracking-wide">
              Page <strong className="text-white font-semibold">{currentPage}</strong> of {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage >= pageCount}
              className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              title="Next Page (ArrowRight / PageDown)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
