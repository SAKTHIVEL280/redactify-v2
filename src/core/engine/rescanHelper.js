/**
 * Real-Time Document Re-Scan Engine
 * Re-evaluates open documents against newly added, modified, or toggled custom rules and presets
 * while strictly preserving all existing manual user annotations.
 */

import { detectEntities } from './detector.js';
import { parseAndScanPDF } from '../parsers/pdfParser.js';

export async function rescanActiveDocument({
  file,
  fileType,
  rawText,
  activePreset,
  customRules,
  existingRedactions = []
}) {
  const manualRedactions = existingRedactions.filter((r) => r.type === 'manual');

  if (fileType === 'pdf' && file) {
    const result = await parseAndScanPDF(file, activePreset, customRules);
    return [...result.redactions, ...manualRedactions];
  }

  if ((fileType === 'docx' || fileType === 'text') && rawText) {
    const detections = detectEntities(rawText, activePreset, customRules);
    const prefix = fileType === 'docx' ? 'box_docx' : 'box_txt';
    const autoRedactions = detections.map((det, i) => ({
      id: `${prefix}_${det.id}_${i}`,
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
    return [...autoRedactions, ...manualRedactions];
  }

  return existingRedactions;
}
