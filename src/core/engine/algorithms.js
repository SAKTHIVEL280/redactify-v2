/**
 * Mathematical Validation Algorithms for High-Precision Entity Verification
 * Eliminates false positives with zero external dependencies.
 */

// ─── 1. Luhn Mod-10 Checksum (Credit & Debit Cards) ───────────────────────────
// Validates: Visa, Mastercard, American Express, Discover, RuPay, JCB, Diners
export function validateLuhn(rawNumber) {
  if (!rawNumber) return false;
  const sanitized = String(rawNumber).replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(sanitized)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// ─── 2. Verhoeff Dihedral Checksum (Indian Aadhaar UIDAI) ─────────────────────
// The official mathematical algorithm mandated by UIDAI for 12-digit Aadhaar cards.
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export function validateVerhoeff(rawNumber) {
  if (!rawNumber) return false;
  const sanitized = String(rawNumber).replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(sanitized)) return false;
  // Aadhaar cannot start with 0 or 1
  if (sanitized[0] === '0' || sanitized[0] === '1') return false;

  let c = 0;
  const reversed = sanitized.split('').reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }

  return c === 0;
}

// ─── 3. ISO 7064 Mod-97-10 Checksum (International Bank Account Number - IBAN) ─
// Covers 70+ countries (UK, Germany, France, UAE, Saudi Arabia, etc.)
export function validateIBAN(rawIBAN) {
  if (!rawIBAN) return false;
  const sanitized = String(rawIBAN).replace(/[\s-]/g, '').toUpperCase();
  if (sanitized.length < 15 || sanitized.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(sanitized)) return false;

  // Move first 4 characters to the end
  const rearranged = sanitized.slice(4) + sanitized.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, ... Z=35)
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numericString += (code - 55).toString();
    } else {
      numericString += rearranged.charAt(i);
    }
  }

  // Mod-97 calculation on large integer string via chunking
  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const chunk = remainder.toString() + numericString.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

// ─── 4. US ABA Federal Reserve 9-Digit Routing Transit Checksum ─────────────────
export function validateUSRouting(rawRouting) {
  if (!rawRouting) return false;
  const sanitized = String(rawRouting).replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(sanitized)) return false;

  const d = sanitized.split('').map(Number);
  const checksum = (
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    1 * (d[2] + d[5] + d[8])
  ) % 10;

  return checksum === 0;
}

// ─── 5. Indian PAN (Permanent Account Number) Structure Validation ─────────────
// Format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., ABCDE1234F)
// 4th character must be one of the recognized entity types: P (Person), C (Company), H (HUF), F (Firm), etc.
export function validateIndianPAN(rawPAN) {
  if (!rawPAN) return false;
  const sanitized = String(rawPAN).trim().toUpperCase();
  if (!/^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/.test(sanitized)) return false;
  return true;
}
