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

  // ─── 9. International, Domestic & Landline Phone Numbers ──────────────────
  if (allowedTypes.has('phone')) {
    const phoneRegexes = [PATTERNS.PHONE_INTERNATIONAL, PATTERNS.PHONE_DOMESTIC, PATTERNS.PHONE_LANDLINE_STD];
    for (const pRegex of phoneRegexes) {
      let match;
      const regex = new RegExp(pRegex);
      while ((match = regex.exec(text)) !== null) {
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

  // ─── 11. Social Handles, Portfolios & Tech Domains ──────────────────────────
  if (allowedTypes.has('url')) {
    const urlRegexes = [PATTERNS.SOCIAL_URL, PATTERNS.TECH_DOMAIN];
    for (const uRegex of urlRegexes) {
      let match;
      const regex = new RegExp(uRegex);
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

  // ─── 13. Physical Addresses & Landmarks ─────────────────────────────────────
  if (allowedTypes.has('address')) {
    const addrRegexes = [PATTERNS.ADDRESS, PATTERNS.ADDRESS_LANDMARK];
    for (const aRegex of addrRegexes) {
      let match;
      const regex = new RegExp(aRegex);
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
  }

  // ─── 14. Dates (Formal Document Dates, DOB, Numeric, Spans & Ranges) ────────
  if (allowedTypes.has('date') || allowedTypes.has('dob')) {
    const dateRegexes = [PATTERNS.DOCUMENT_DATE, PATTERNS.DATE_OF_BIRTH, PATTERNS.NUMERIC_DATE, PATTERNS.DATE_RANGE];
    for (const dRegex of dateRegexes) {
      let match;
      const regex = new RegExp(dRegex);
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
  }

  // ─── 15. Financial Compensation & Salary ────────────────────────────────────
  if (allowedTypes.has('salary')) {
    let match;
    const regex = new RegExp(PATTERNS.FINANCIAL_SALARY);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'salary',
        category: 'financial',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
        suggested: '[COMPENSATION REDACTED]',
        redact: true
      });
    }

    // Contextual salary search (e.g. "stipend ... 21,500" or "salary ... 50,000")
    const contextSalaryRegex = /(?:stipend|salary|compensation|remuneration|ctc|package|fee)[\s\S]{0,60}?\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{2})?)\b/gi;
    while ((match = contextSalaryRegex.exec(text)) !== null) {
      const amountVal = match[1];
      const amountIdx = match.index + match[0].lastIndexOf(amountVal);
      rawEntities.push({
        id: nextId(),
        type: 'salary',
        category: 'financial',
        value: amountVal,
        start: amountIdx,
        end: amountIdx + amountVal.length,
        confidence: 0.93,
        suggested: '[COMPENSATION REDACTED]',
        redact: true
      });
    }
  }

  // ─── 16. Geographic Locations (States, City-States & Metro Cities) ──────────
  if (allowedTypes.has('location')) {
    const locRegexes = [PATTERNS.CITY_STATE, PATTERNS.STATE_LOCATION, PATTERNS.METRO_CITY];
    for (const lRegex of locRegexes) {
      let match;
      const regex = new RegExp(lRegex);
      while ((match = regex.exec(text)) !== null) {
        rawEntities.push({
          id: nextId(),
          type: 'location',
          category: 'location',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.88,
          suggested: '[LOCATION REDACTED]',
          redact: true
        });
      }
    }
  }

  // ─── 17. Reference & Document Tracking IDs ──────────────────────────────────
  if (allowedTypes.has('reference_id') || allowedTypes.has('id')) {
    let match;
    const regex = new RegExp(PATTERNS.REFERENCE_ID);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'reference_id',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.90,
        suggested: '[REF REDACTED]',
        redact: true
      });
    }
  }

  // ─── 17. Educational Institutions & GPA ─────────────────────────────────────
  if (allowedTypes.has('education')) {
    let match;
    const regex = new RegExp(PATTERNS.EDUCATIONAL_INSTITUTION);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'education',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.90,
        suggested: '[COLLEGE REDACTED]',
        redact: true
      });
    }
  }

  if (allowedTypes.has('gpa')) {
    let match;
    const regex = new RegExp(PATTERNS.ACADEMIC_GPA);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'gpa',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.92,
        suggested: '[GPA REDACTED]',
        redact: true
      });
    }
  }

  // ─── 18. Driving License ────────────────────────────────────────────────────
  if (allowedTypes.has('driving_license')) {
    let match;
    const regex = new RegExp(PATTERNS.DRIVING_LICENSE);
    while ((match = regex.exec(text)) !== null) {
      rawEntities.push({
        id: nextId(),
        type: 'driving_license',
        category: 'identity',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.92,
        suggested: '[DL REDACTED]',
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
