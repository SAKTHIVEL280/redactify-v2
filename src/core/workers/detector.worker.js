/**
 * Dedicated Background Web Worker for Sovereign PII Entity Detection
 * Offloads compute-heavy regular expressions and mathematical checksum evaluations
 * from the main UI thread to maintain a constant 60fps render loop on large documents.
 */

import { detectEntities } from '../engine/detector.js';

if (typeof self !== 'undefined') {
  self.onmessage = (e) => {
    const { id, text, presetId, customRules } = e.data || {};
    try {
      const detections = detectEntities(text, presetId, customRules);
      self.postMessage({ id, success: true, detections });
    } catch (err) {
      self.postMessage({ id, success: false, error: err.message, detections: [] });
    }
  };
}
