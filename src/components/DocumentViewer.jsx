import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';

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

  const redactions = useRedactionStore((s) => s.redactions);
  const toggleRedaction = useRedactionStore((s) => s.toggleRedaction);
  const removeRedaction = useRedactionStore((s) => s.removeRedaction);
  const addRedaction = useRedactionStore((s) => s.addRedaction);
  const isDrawingMode = useRedactionStore((s) => s.isDrawingMode);
  const style = useRedactionStore((s) => s.style);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [drawingStart, setDrawingStart] = useState(null);
  const [drawingBox, setDrawingBox] = useState(null);
  const [renderedDimensions, setRenderedDimensions] = useState({ width: 0, height: 0 });

  // Render PDF page to canvas
  useEffect(() => {
    if (!file || fileType !== 'pdf') return;

    let isMounted = true;
    let renderTask = null;

    const renderPage = async () => {
      try {
        const lib = await getPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(currentPage);

        if (!isMounted) return;

        // Render at crisp 2x scale
        const scale = 1.5 * zoom;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        renderTask = page.render({ canvasContext: ctx, viewport });
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

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask && renderTask.cancel) renderTask.cancel();
    };
  }, [file, fileType, currentPage, zoom]);

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
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden select-none">
      {/* Viewer Top Toolbar (Pagination & Zoom) */}
      <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/50 px-4 flex items-center justify-between">
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-zinc-300">
            Page <strong className="text-white">{currentPage}</strong> of {pageCount}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            className="p-1 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-zinc-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scanned Document Helper Banner */}
      {isScannedDocument && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Scanned document detected:</strong> This file has no selectable text layer. Use the <strong>+ Manual Box</strong> tool in the top bar to drag blackout boxes over signatures, stamps, and sensitive areas.
            </span>
          </div>
        </div>
      )}

      {/* Canvas & Overlay Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-zinc-950/60 relative">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative shadow-2xl rounded-lg border border-zinc-800 overflow-hidden bg-white max-w-full transition-transform ${
            isDrawingMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ width: renderedDimensions.width ? `${renderedDimensions.width}px` : 'auto' }}
        >
          {fileType === 'pdf' ? (
            <canvas ref={canvasRef} className="block max-w-full" />
          ) : (
            <div className="p-8 text-zinc-900 bg-white min-h-[500px] w-[600px] font-mono text-xs whitespace-pre-wrap">
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
