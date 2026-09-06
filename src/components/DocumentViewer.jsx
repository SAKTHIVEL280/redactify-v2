import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const style = useRedactionStore((s) => s.style);
  const activePreset = useRedactionStore((s) => s.activePreset);
  const customRules = useRedactionStore((s) => s.customRules);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const pdfFileRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
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

  // Manual Crosshair Drawing Handlers
  const handleMouseDown = (e) => {
    if (!isDrawingMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawingStart({ x, y });
    setDrawingBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!drawingStart || !containerRef.current) return;
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
    <div className="flex-1 flex flex-col h-full bg-[#edede8] overflow-hidden select-none">
      {/* Viewer Top Toolbar (Pagination & Zoom) */}
      <div className="h-11 border-b border-[#00000014] bg-[#ffffff] px-4 flex items-center justify-between text-xs text-[#292929] shrink-0">
        {/* Pagination */}
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-full hover:bg-[#dbdbd2] disabled:opacity-25 text-[#292929] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[#6f6f6e]">
              Page <strong className="text-[#141414] font-semibold">{currentPage}</strong> of {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage >= pageCount}
              className="p-1 rounded-full hover:bg-[#dbdbd2] disabled:opacity-25 text-[#292929] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-[#6f6f6e]">
            {fileType === 'image' ? 'Image Mode — Drag crosshair to blackout areas' : 'Single Page Document'}
          </div>
        )}

        {/* Toolbar Controls: Rotation & Zoom */}
        <div className="flex items-center gap-3">
          {/* Rotation Controls */}
          <div className="flex items-center gap-1 border-r border-[#00000014] pr-2.5">
            <button
              onClick={handleRotateCcw}
              className="p-1.5 rounded-full hover:bg-[#dbdbd2] text-[#6f6f6e] hover:text-[#141414] transition-colors"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRotateCw}
              className="p-1.5 rounded-full hover:bg-[#dbdbd2] text-[#6f6f6e] hover:text-[#141414] transition-colors"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {rotation !== 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#dbdbd2] text-[#141414] font-medium">
                {rotation}°
              </span>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
              className="p-1.5 rounded-full hover:bg-[#dbdbd2] text-[#6f6f6e] hover:text-[#141414] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[#6f6f6e] w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
              className="p-1.5 rounded-full hover:bg-[#dbdbd2] text-[#6f6f6e] hover:text-[#141414] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scanned Document / Image Helper Banner */}
      {(isScannedDocument || fileType === 'image') && (
        <div className="bg-[#dbdbd2]/80 border-b border-[#00000014] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#292929]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#141414] shrink-0" />
            <span>
              <strong>Scanned / Image Document:</strong> Drag crosshair to redact areas, or run in-browser OCR.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Rotate Controls in Banner */}
            <div className="flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-full border border-[#00000014]">
              <span className="text-[10px] text-[#6f6f6e] mr-0.5">Rotate:</span>
              <button
                onClick={handleRotateCcw}
                className="p-1 rounded hover:bg-[#dbdbd2] text-[#141414] transition-colors"
                title="Rotate 90° CCW"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={handleRotateCw}
                className="p-1 rounded hover:bg-[#dbdbd2] text-[#141414] transition-colors"
                title="Rotate 90° CW"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              {rotation !== 0 && (
                <span className="text-[10px] font-mono text-[#141414] font-medium">
                  {rotation}°
                </span>
              )}
            </div>

            {ocrStatusMessage && (
              <span className="text-[11px] font-mono text-[#141414] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cc02b]" />
                {ocrStatusMessage}
              </span>
            )}

            <button
              onClick={handleRunOcr}
              disabled={isOcrScanning}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {isOcrScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{ocrProgress.msg || `${ocrProgress.pct}%`}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#4cc02b]" />
                  <span>Run AI Auto-OCR Scan (~15MB WASM)</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-mono text-[#6f6f6e] hidden lg:inline">
              Click box to toggle • Hover to delete
            </span>
          </div>
        </div>
      )}

      {/* Canvas & Overlay Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-[#edede8] relative">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`my-auto relative shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-[12px] border border-[#00000014] overflow-hidden bg-white max-w-full transition-transform ${
            isDrawingMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ width: renderedDimensions.width ? `${renderedDimensions.width}px` : 'auto' }}
        >
          {(fileType === 'pdf' || fileType === 'image') ? (
            <canvas ref={canvasRef} className="block max-w-full" />
          ) : (
            <div className="p-8 text-[#141414] bg-white min-h-[500px] w-[600px] font-mono text-xs whitespace-pre-wrap">
              {rawText}
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
              className={`absolute transition-all rounded-sm flex items-center justify-center text-[9px] font-bold select-none group cursor-pointer ${
                box.redact
                  ? 'border border-zinc-900 shadow-sm'
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
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md"
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
      </div>
    </div>
  );
}
