/**
 * High-Performance Client-Side PDF Parser & Coordinate Mapper
 * Uses normalized coordinates (0.0 to 1.0) to eliminate screen drift.
 */

import { detectEntities } from '../engine/detector.js';

let pdfjsLib = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (typeof window !== 'undefined') {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } else {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

/**
 * Parse a PDF file and map all detected PII to normalized bounding boxes (0.0 to 1.0).
 */
export async function parseAndScanPDF(file, presetId = 'all', customRules = [], onProgress = () => {}) {
  const lib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  const pages = [];
  const allRedactions = [];
  let totalTextLength = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress(pageNum, numPages, `Scanning page ${pageNum} of ${numPages}...`);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // Sort items top-to-bottom, left-to-right for consistent reading order
    const items = [...textContent.items].sort((a, b) => {
      const aY = a.transform[5];
      const bY = b.transform[5];
      const aX = a.transform[4];
      const bX = b.transform[4];
      if (Math.abs(bY - aY) <= 5) return aX - bX;
      return bY - aY;
    });

    // Build page text and item offset index
    let pageText = '';
    const itemPositions = [];

    items.forEach((item, index) => {
      const start = pageText.length;
      pageText += item.str;
      itemPositions.push({
        item,
        start,
        end: pageText.length
      });

      if (index < items.length - 1) {
        pageText += ' ';
      }
    });

    totalTextLength += pageText.trim().length;

    // Scan page text with our fast detection engine (<5ms)
    const detections = detectEntities(pageText, presetId, customRules);

    // Map each detection to normalized bounding coordinates (0.0 to 1.0)
    for (const det of detections) {
      // Find matching items that overlap with detection span [det.start, det.end]
      const matchingItems = itemPositions.filter(
        ip => ip.start < det.end && ip.end > det.start
      );

      for (const match of matchingItems) {
        const item = match.item;
        const strLen = Math.max(1, item.str.length);
        const subStart = Math.max(0, det.start - match.start);
        const subEnd = Math.min(strLen, det.end - match.start);

        if (subEnd <= subStart) continue;

        const charRatioStart = subStart / strLen;
        const charRatioEnd = subEnd / strLen;

        const itemPdfX = item.transform[4];
        const itemPdfY = item.transform[5];
        const itemWidth = item.width || (strLen * (item.transform[0] || 12) * 0.6);
        const itemHeight = item.height || Math.abs(item.transform[0] || 12);

        // Calculate PDF point coordinates
        const boxPdfX = itemPdfX + (itemWidth * charRatioStart);
        const boxPdfW = Math.max(8, itemWidth * (charRatioEnd - charRatioStart));
        const boxPdfY = itemPdfY; // PDF bottom-left Y
        const boxPdfH = Math.max(10, itemHeight);

        // Convert to normalized coordinates (0.0 to 1.0) with origin at TOP-LEFT
        const normX = Math.max(0, Math.min(1, boxPdfX / pageWidth));
        const normY = Math.max(0, Math.min(1, (pageHeight - boxPdfY - boxPdfH) / pageHeight));
        const normW = Math.max(0.01, Math.min(1 - normX, boxPdfW / pageWidth));
        const normH = Math.max(0.01, Math.min(1 - normY, boxPdfH / pageHeight));

        allRedactions.push({
          id: `box_${pageNum}_${det.id}_${match.start}`,
          pageIndex: pageNum - 1,
          x: normX,
          y: normY,
          width: normW,
          height: normH,
          type: 'auto',
          category: det.category,
          entityType: det.type,
          value: det.value,
          suggested: det.suggested,
          confidence: det.confidence,
          redact: true
        });
      }
    }

    pages.push({
      pageNumber: pageNum,
      width: pageWidth,
      height: pageHeight,
      isScan: items.length === 0
    });

    if (page.cleanup) page.cleanup();
  }

  if (pdf.destroy) pdf.destroy();

  const isScannedDocument = totalTextLength < 20 && numPages > 0;

  return {
    numPages,
    pages,
    redactions: allRedactions,
    isScannedDocument
  };
}
