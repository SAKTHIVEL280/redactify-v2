/**
 * Master Redactify Detection Engine
 * Integrates mathematical checksums, international regex, and contextual heuristics.
 * Runs in <15ms with 0MB external download.
 */

import { PATTERNS } from './patterns.js';
import {
  validateLuhn,
  validateVerhoeff,
  validateIBAN,
  validateUSRouting,
  validateIndianPAN
} from './algorithms.js';
import { detectContextualEntities } from './heuristics.js';
import { PRESETS } from './presets.js';

let entityCounter = 0;
function nextId() {
  entityCounter++;
  return `pii_${Date.now().toString(36)}_${entityCounter}`;
}

export function detectEntities(text, presetId = 'all', customRules = []) {
  if (!text || typeof text !== 'string') return [];

  const preset = Object.values(PRESETS).find(p => p.id === presetId) || PRESETS.ALL;
  const allowedTypes = new Set(preset.types);
  const rawEntities = [];

  // ─── 1. Emails ─────────────────────────────────────────────────────────────
  if (allowedTypes.has('email')) {
    let match;
    const regex = new RegExp(PATTERNS.EMAIL);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'email',
        category: 'contact',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.99,
        suggested: '[EMAIL REDACTED]',
        redact: true
      });
    }
  }

  // ─── 2. Credit Cards (Luhn Verified) ───────────────────────────────────────
  if (allowedTypes.has('credit_card')) {
    let match;
    const regex = new RegExp(PATTERNS.CREDIT_CARD);
    while ((match = regex.exec(text)) !== null) {
      if (validateLuhn(match[0])) {
        rawEntities.push({
          id: nextId(),
          type: 'credit_card',
          category: 'financial',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.99,
          suggested: '[CARD REDACTED]',
          redact: true
        });
      }
    }
  }

  // ─── 3. Indian Aadhaar (Verhoeff Verified) ──────────────────────────────────
  if (allowedTypes.has('aadhaar')) {
    let match;
    const regex = new RegExp(PATTERNS.AADHAAR);
    while ((match = regex.exec(text)) !== null) {
      if (validateVerhoeff(match[0])) {
        const clean = match[0].replace(/[\s-]/g, '');
        // UIDAI compliant mask: First 8 digits masked, last 4 visible (XXXX-XXXX-1234)
        const masked = `XXXX-XXXX-${clean.slice(8)}`;
        rawEntities.push({
          id: nextId(),
          type: 'aadhaar',
          category: 'identity',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 1.0,
          suggested: masked,
          redact: true
        });
      }
    }
  }

  // ─── 4. Indian PAN ─────────────────────────────────────────────────────────
  if (allowedTypes.has('pan')) {
    let match;
    const regex = new RegExp(PATTERNS.PAN);
    while ((match = regex.exec(text)) !== null) {
      if (validateIndianPAN(match[0])) {
        rawEntities.push({
          id: nextId(),
          type: 'pan',
          category: 'identity',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.99,
          suggested: '[PAN REDACTED]',
          redact: true
        });
      }
    }
  }

  // ─── 5. Indian Voter ID & Passports ────────────────────────────────────────
  if (allowedTypes.has('voter_id')) {
    let match;
    const regex = new RegExp(PATTERNS.VOTER_ID);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'voter_id',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.92,
        suggested: '[VOTER ID REDACTED]',
        redact: true
      });
    }
  }

  if (allowedTypes.has('passport')) {
    let match;
    const regex = new RegExp(PATTERNS.INDIAN_PASSPORT);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'passport',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.90,
        suggested: '[PASSPORT REDACTED]',
        redact: true
      });
    }
  }

  // ─── 6. International IBAN (Mod-97 Verified) ───────────────────────────────
  if (allowedTypes.has('iban')) {
    let match;
    const regex = new RegExp(PATTERNS.IBAN);
    while ((match = regex.exec(text)) !== null) {
      if (validateIBAN(match[0])) {
        rawEntities.push({
          id: nextId(),
          type: 'iban',
          category: 'financial',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.99,
          suggested: '[IBAN REDACTED]',
          redact: true
        });
      }
    }
  }

  // ─── 7. SWIFT / BIC & US Routing ───────────────────────────────────────────
  if (allowedTypes.has('swift')) {
    let match;
    const regex = new RegExp(PATTERNS.SWIFT_BIC);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'swift',
        category: 'financial',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.90,
        suggested: '[SWIFT REDACTED]',
        redact: true
      });
    }
  }

  if (allowedTypes.has('routing')) {
    let match;
    const regex = new RegExp(PATTERNS.US_ROUTING);
    while ((match = regex.exec(text)) !== null) {
      if (validateUSRouting(match[0])) {
        rawEntities.push({
          id: nextId(),
          type: 'routing',
          category: 'financial',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.95,
          suggested: '[ROUTING REDACTED]',
          redact: true
        });
      }
    }
  }

  // ─── 8. US SSN, EIN, UK NINO, Canada SIN, Australia TFN ────────────────────
  if (allowedTypes.has('ssn')) {
    let match;
    const regex = new RegExp(PATTERNS.US_SSN);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'ssn',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
        suggested: '[SSN REDACTED]',
        redact: true
      });
    }
  }

  if (allowedTypes.has('nino')) {
    let match;
    const regex = new RegExp(PATTERNS.UK_NINO);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'nino',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
        suggested: '[NINO REDACTED]',
        redact: true
      });
    }
  }

  if (allowedTypes.has('sin')) {
    let match;
    const regex = new RegExp(PATTERNS.CA_SIN);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'sin',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.92,
        suggested: '[SIN REDACTED]',
        redact: true
      });
    }
  }

  if (allowedTypes.has('tfn')) {
    let match;
    const regex = new RegExp(PATTERNS.AU_TFN);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'tfn',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.90,
        suggested: '[TFN REDACTED]',
        redact: true
      });
    }
  }

  // ─── 9. International & Domestic Phone Numbers ──────────────────────────────
  if (allowedTypes.has('phone')) {
    const phoneRegexes = [PATTERNS.PHONE_INTERNATIONAL, PATTERNS.PHONE_DOMESTIC];
    for (const pRegex of phoneRegexes) {
      let match;
      const regex = new RegExp(pRegex);
      while ((match = regex.exec(text)) !== null) {
        // Strip out non-digits to ensure it has at least 7 digits (avoid false positives like page numbers)
        const digitsOnly = match[0].replace(/\D/g, '');
        if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
          rawEntities.push({
            id: nextId(),
            type: 'phone',
            category: 'contact',
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.93,
            suggested: '[PHONE REDACTED]',
            redact: true
          });
        }
      }
    }
  }

  // ─── 10. IP Addresses ───────────────────────────────────────────────────────
  if (allowedTypes.has('ip')) {
    let match;
    const regex = new RegExp(PATTERNS.IPV4);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'ip',
        category: 'system',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
        suggested: '[IP REDACTED]',
        redact: true
      });
    }
  }

  // ─── 11. Social Handles & URLs ──────────────────────────────────────────────
  if (allowedTypes.has('url')) {
    let match;
    const regex = new RegExp(PATTERNS.SOCIAL_URL);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'url',
        category: 'contact',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.96,
        suggested: '[URL REDACTED]',
        redact: true
      });
    }
  }

  // ─── 12. Indian Pincodes ────────────────────────────────────────────────────
  if (allowedTypes.has('pincode')) {
    let match;
    const regex = new RegExp(PATTERNS.INDIAN_PINCODE);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'pincode',
        category: 'location',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.90,
        suggested: '[PINCODE REDACTED]',
        redact: true
      });
    }
  }

  // ─── 13. Physical Addresses ────────────────────────────────────────────────
  if (allowedTypes.has('address')) {
    let match;
    const regex = new RegExp(PATTERNS.ADDRESS);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'address',
        category: 'location',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.88,
        suggested: '[ADDRESS REDACTED]',
        redact: true
      });
    }
  }

  // ─── 14. Formal Document Dates ──────────────────────────────────────────────
  if (allowedTypes.has('date')) {
    let match;
    const regex = new RegExp(PATTERNS.DOCUMENT_DATE);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'date',
        category: 'date',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.85,
        suggested: '[DATE REDACTED]',
        redact: true
      });
    }
  }

  // ─── 11. Contextual Names & Organizations ──────────────────────────────────
  if (allowedTypes.has('name') || allowedTypes.has('organization')) {
    const contextual = detectContextualEntities(text);
    for (const item of contextual) {
      if (allowedTypes.has(item.type)) {
        rawEntities.push({
          id: nextId(),
          ...item,
          redact: true
        });
      }
    }
  }

  // ─── 12. Custom User Rules & Dictionaries ──────────────────────────────────
  if (Array.isArray(customRules)) {
    for (const rule of customRules) {
      if (!rule || !rule.pattern || rule.enabled === false) continue;
      try {
        const customRegex = rule.isRegex
          ? new RegExp(rule.pattern, rule.caseSensitive ? 'g' : 'gi')
          : new RegExp(rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), rule.caseSensitive ? 'g' : 'gi');

        let match;
        while ((match = customRegex.exec(text)) !== null) {
          rawEntities.push({
            id: nextId(),
            type: 'custom',
            category: 'custom',
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
            confidence: 1.0,
            suggested: rule.replacement || '[CONFIDENTIAL]',
            redact: true
          });
        }
      } catch (err) {
        console.warn(`Custom rule error for pattern ${rule.pattern}:`, err.message);
      }
    }
  }

  // ─── 13. Deduplication & Conflict Resolution ────────────────────────────────
  // Sort entities by start position, then by longer length
  rawEntities.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const finalEntities = [];
  let lastEnd = -1;

  for (const entity of rawEntities) {
    // If entity starts after the previous entity ended, keep it
    if (entity.start >= lastEnd) {
      finalEntities.push(entity);
      lastEnd = entity.end;
    } else {
      // Overlap detected: If current has higher confidence, replace previous
      const prev = finalEntities[finalEntities.length - 1];
      if (prev && entity.confidence > prev.confidence && (entity.end - entity.start) >= (prev.end - prev.start)) {
        finalEntities[finalEntities.length - 1] = entity;
        lastEnd = entity.end;
      }
    }
  }

  return finalEntities;
}
