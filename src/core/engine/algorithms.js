/**
 * Mathematical Validation Algorithms for High-Precision Entity Verification
 * Eliminates false positives with zero external dependencies.
 */

// ─── 1. Luhn Mod-10 Checksum (Credit & Debit Cards) ───────────────────────────
// Validates: Visa, Mastercard, American Express, Discover, RuPay, JCB, Diners
export function validateLuhn(rawNumber) {
  if (!rawNumber) return false;
  const sanitized = String(rawNumber).replace(/[\s-]/g, '');
  if (!/^\d{2,20}$/.test(sanitized)) return false;

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

// ─── 6. Indian GSTIN (Goods and Services Tax ID Number) Validation ──────────────
// Format: 2-digit state code (01-37), 10-char PAN, 1 entity digit, 'Z', 1 check character
export function validateGSTIN(rawGSTIN) {
  if (!rawGSTIN) return false;
  const sanitized = String(rawGSTIN).trim().toUpperCase();
  if (!/^[0-3][0-9][A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(sanitized)) return false;
  return true;
}

// ─── 7. UK NHS Number Mod-11 Validation ─────────────────────────────────────────
// 10 digits formatted (e.g., 943 476 5919) validated via standard Mod-11 algorithm
export function validateNHS(rawNHS) {
  if (!rawNHS) return false;
  const sanitized = String(rawNHS).replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(sanitized)) return false;
  const digits = sanitized.split('').map(Number);
  const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  const remainder = sum % 11;
  const check = 11 - remainder;
  if (check === 11) return digits[9] === 0;
  if (check === 10) return false; // Invalid NHS number
  return digits[9] === check;
}

// ─── 8. Canadian Social Insurance Number (SIN) Luhn Validation ──────────────────
export function validateCanadianSIN(rawSIN) {
  if (!rawSIN) return false;
  const sanitized = String(rawSIN).replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(sanitized)) return false;
  return validateLuhn(sanitized);
}

// ─── 9. US Social Security Number (SSN) Integrity Validation ───────────────────
export function validateUSSSN(rawSSN) {
  if (!rawSSN) return false;
  const sanitized = String(rawSSN).replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(sanitized)) return false;

  const area = parseInt(sanitized.slice(0, 3), 10);
  const group = parseInt(sanitized.slice(3, 5), 10);
  const serial = parseInt(sanitized.slice(5, 9), 10);

  // Area number cannot be 000, 666, or 900-999
  if (area === 0 || area === 666 || area >= 900) return false;
  // Group number cannot be 00
  if (group === 0) return false;
  // Serial number cannot be 0000
  if (serial === 0) return false;

  return true;
}

// ─── 10. UK National Insurance Number (NINO) Validation ────────────────────────
export function validateUKNINO(rawNINO) {
  if (!rawNINO) return false;
  const sanitized = String(rawNINO).replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/.test(sanitized)) return false;

  // Cannot start with BG, GB, KN, NK, NT, TN, ZZ
  const disallowed = ['BG', 'GB', 'KN', 'NK', 'NT', 'TN', 'ZZ'];
  if (disallowed.includes(sanitized.slice(0, 2))) return false;

  return true;
}

// ─── 11. Spanish DNI / NIE Mod-23 Algorithm ────────────────────────────────────
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function validateSpanishDNI(rawDNI) {
  if (!rawDNI) return false;
  let sanitized = String(rawDNI).replace(/[\s-]/g, '').toUpperCase();

  // NIE starts with X (0), Y (1), or Z (2)
  if (/^[XYZ]\d{7}[A-Z]$/.test(sanitized)) {
    const prefixMap = { X: '0', Y: '1', Z: '2' };
    sanitized = prefixMap[sanitized[0]] + sanitized.slice(1);
  }

  if (!/^\d{8}[A-Z]$/.test(sanitized)) return false;

  const number = parseInt(sanitized.slice(0, 8), 10);
  return sanitized[8] === DNI_LETTERS[number % 23];
}

// ─── 12. French NIR (Social Security Number) Mod-97 Algorithm ──────────────────
export function validateFrenchNIR(rawNIR) {
  if (!rawNIR) return false;
  const sanitized = String(rawNIR).replace(/[\s-]/g, '').toUpperCase();
  if (!/^[12]\d{12}(\d{2})?$/.test(sanitized)) return false;

  if (sanitized.length === 15) {
    const numPart = BigInt(sanitized.slice(0, 13));
    const controlKey = parseInt(sanitized.slice(13, 15), 10);
    const expectedKey = Number(97n - (numPart % 97n));
    return controlKey === expectedKey;
  }
  return true;
}

// ─── 13. Italian Codice Fiscale Check Character Algorithm ──────────────────────
const CF_ODD = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};
const CF_EVEN = {};
for (let i = 0; i < 10; i++) CF_EVEN[String(i)] = i;
for (let i = 0; i < 26; i++) CF_EVEN[String.fromCharCode(65 + i)] = i;

export function validateItalianCodiceFiscale(rawCF) {
  if (!rawCF) return false;
  const sanitized = String(rawCF).replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]$/.test(sanitized)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = sanitized[i];
    sum += (i % 2 === 0) ? (CF_ODD[ch] || 0) : (CF_EVEN[ch] || 0);
  }

  const expectedChar = String.fromCharCode(65 + (sum % 26));
  return sanitized[15] === expectedChar;
}

// ─── 14. Australian Tax File Number (TFN) Mod-11 Algorithm ─────────────────────
export function validateAustralianTFN(rawTFN) {
  if (!rawTFN) return false;
  const sanitized = String(rawTFN).replace(/[\s-]/g, '');
  if (!/^\d{8,9}$/.test(sanitized)) return false;

  const digits = sanitized.split('').map(Number);
  if (digits.length === 9) {
    const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    return sum % 11 === 0;
  } else if (digits.length === 8) {
    const weights = [10, 7, 8, 4, 6, 3, 5, 1];
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    return sum % 11 === 0;
  }
  return false;
}

// ─── 15. Australian Medicare Number Validation ─────────────────────────────────
export function validateAustralianMedicare(rawMedicare) {
  if (!rawMedicare) return false;
  const sanitized = String(rawMedicare).replace(/[\s-]/g, '');
  if (!/^[2-6]\d{9}$/.test(sanitized)) return false;

  const weights = [1, 3, 7, 9, 1, 3, 7, 9];
  const digits = sanitized.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }
  return (sum % 10) === digits[8];
}

// ─── 16. Singapore NRIC / FIN Mod-11 Validation ────────────────────────────────
export function validateSingaporeNRIC(rawNRIC) {
  if (!rawNRIC) return false;
  const sanitized = String(rawNRIC).trim().toUpperCase();
  if (!/^[STFGM]\d{7}[A-Z]$/.test(sanitized)) return false;

  const firstChar = sanitized[0];
  const digits = sanitized.slice(1, 8).split('').map(Number);
  const lastChar = sanitized[8];

  const weights = [2, 7, 6, 5, 4, 3, 2];
  let sum = (firstChar === 'T' || firstChar === 'G') ? 4 : (firstChar === 'M' ? 3 : 0);
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 11;
  const stTable = ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  const fgTable = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];
  const mTable  = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'J', 'L', 'K'];

  let expectedChar = '';
  if (firstChar === 'S' || firstChar === 'T') {
    expectedChar = stTable[remainder];
  } else if (firstChar === 'F' || firstChar === 'G') {
    expectedChar = fgTable[remainder];
  } else if (firstChar === 'M') {
    expectedChar = mTable[remainder];
  }

  return lastChar === expectedChar;
}

// ─── 17. US National Provider Identifier (NPI - HIPAA) Luhn Algorithm ─────────
export function validateUSNPI(rawNPI) {
  if (!rawNPI) return false;
  const sanitized = String(rawNPI).replace(/[\s-]/g, '');
  if (!/^[12]\d{9}$/.test(sanitized)) return false;
  return validateLuhn('80840' + sanitized);
}


