/**
 * Client-Side In-Browser OCR Scanner using Tesseract.js (WASM)
 * Dynamically loaded on-demand (~15-20MB worker + traineddata).
 * Zero bytes uploaded: extracts word coordinates directly in browser memory.
 */

import { detectEntities } from '../engine/detector.js';

let tesseractLib = null;

async function getTesseract() {
  if (tesseractLib) return tesseractLib;
  tesseractLib = await import('tesseract.js');
  return tesseractLib;
}

function matchTokens(wordText, detValue) {
  const cw = wordText.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
  if (cw.length < 2) return false;
  const detTokens = detValue
    .split(/[\s,/:;()\-]+/)
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9]/gi, ''))
    .filter(t => t.length >= 2);

  return detTokens.some(tok => {
    if (cw === tok) return true;
    if (tok.length >= 4 && cw.includes(tok)) return true;
    if (cw.length >= 4 && tok.includes(cw)) return true;
    return false;
  });
}

function clusterWordsByLine(words) {
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => {
    const dy = (a.bbox?.y0 || 0) - (b.bbox?.y0 || 0);
    if (Math.abs(dy) > 12) return dy;
    return (a.bbox?.x0 || 0) - (b.bbox?.x0 || 0);
  });

  const clusters = [];
  let currentCluster = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevY = prev.bbox?.y0 || 0;
    const currY = curr.bbox?.y0 || 0;
    const prevH = (prev.bbox?.y1 || 0) - prevY;
    const threshold = Math.max(16, prevH * 1.5);

    if (Math.abs(currY - prevY) <= threshold) {
      currentCluster.push(curr);
    } else {
      clusters.push(currentCluster);
      currentCluster = [curr];
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }
  return clusters;
}

/**
 * Scan an image file or canvas using pure client-side Tesseract.js WASM.
 * Maps detected PII entities to normalized bounding boxes (0.0 to 1.0).
 */
export async function scanImageWithOCR(imageFileOrCanvas, presetId = 'all', customRules = [], pageIndex = 0, onProgress = () => {}) {
  const Tesseract = await getTesseract();
  onProgress(10, 100, 'Initializing WebAssembly OCR engine...');

  const worker = await Tesseract.createWorker('eng', 1, {
    langPath: '/tessdata',
    cachePath: '/tessdata',
    logger: (m) => {
      if (m.status === 'recognizing text' && m.progress) {
        const pct = Math.round(20 + m.progress * 70);
        onProgress(pct, 100, `Reading text in image memory (${Math.round(m.progress * 100)}%)...`);
      }
    }
  });

  try {
    onProgress(30, 100, 'Scanning text and bounding boxes...');
    const ret = await worker.recognize(imageFileOrCanvas, {}, { blocks: true });
    const fullText = ret.data.text || '';
    
    // Extract words with bounding boxes from blocks hierarchy
    const words = [];
    if (ret.data.blocks) {
      for (const b of ret.data.blocks) {
        for (const p of (b.paragraphs || [])) {
          for (const l of (p.lines || [])) {
            for (const w of (l.words || [])) {
              if (w.text && w.bbox) {
                words.push(w);
              }
            }
          }
        }
      }
    } else if (ret.data.words) {
      words.push(...ret.data.words);
    }

    // Determine dimensions accurately
    let imgWidth = ret.data.image_width || (imageFileOrCanvas.naturalWidth || imageFileOrCanvas.width || 0);
    let imgHeight = ret.data.image_height || (imageFileOrCanvas.naturalHeight || imageFileOrCanvas.height || 0);
    if (!imgWidth || !imgHeight) {
      let maxX = 800, maxY = 600;
      for (const w of words) {
        if (w.bbox) {
          maxX = Math.max(maxX, w.bbox.x1);
          maxY = Math.max(maxY, w.bbox.y1);
        }
      }
      imgWidth = imgWidth || maxX;
      imgHeight = imgHeight || maxY;
    }

    onProgress(90, 100, 'Matching PII entities on image canvas...');
    const detections = detectEntities(fullText, presetId, customRules);

    // Heuristic: Check for ID Cardholder name directly preceding DOB
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      if (/DOB|Birth|Date of Birth|Male|Female/i.test(lines[i])) {
        for (let j = Math.max(0, i - 2); j < i; j++) {
          const nameMatch = /(?:^|[^a-zA-Z])([A-Z][a-zA-Z]{2,}(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z]+)?)(?:$|[^a-zA-Z])/.exec(lines[j]);
          if (nameMatch && !detections.some(d => d.value.includes(nameMatch[1]))) {
            detections.push({
              id: `id_name_${j}`,
              type: 'name',
              category: 'identity',
              value: nameMatch[1],
              start: 0,
              end: nameMatch[1].length,
              confidence: 0.90,
              suggested: '[NAME REDACTED]',
              redact: true
            });
          }
        }
      }
    }

    const redactionBoxes = [];

    // Map detected entities to word bounding boxes (clustered by line to prevent full-page blackout)
    for (const det of detections) {
      const targetWords = words.filter(w => matchTokens(w.text, det.value));

      if (targetWords.length > 0) {
        const clusters = clusterWordsByLine(targetWords);

        for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
          const cluster = clusters[cIdx];
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          for (const w of cluster) {
            if (w.bbox) {
              minX = Math.min(minX, w.bbox.x0);
              minY = Math.min(minY, w.bbox.y0);
              maxX = Math.max(maxX, w.bbox.x1);
              maxY = Math.max(maxY, w.bbox.y1);
            }
          }

          if (minX !== Infinity && maxX > minX) {
            // Add small 2px padding for complete visual masking
            const padX = 2;
            const padY = 2;
            const boxX = Math.max(0, (minX - padX) / imgWidth);
            const boxY = Math.max(0, (minY - padY) / imgHeight);
            const boxW = Math.min(1 - boxX, (maxX - minX + padX * 2) / imgWidth);
            const boxH = Math.min(1 - boxY, (maxY - minY + padY * 2) / imgHeight);

            redactionBoxes.push({
              id: `box_ocr_${det.id}_${cIdx}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              pageIndex,
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
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
      }
    }

    onProgress(100, 100, 'OCR Scan complete!');
    await worker.terminate();

    return {
      rawText: fullText,
      redactions: redactionBoxes,
      wordsCount: words.length
    };
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}
