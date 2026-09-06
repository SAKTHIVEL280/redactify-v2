/**
 * High-Precision International Regex Definitions
 * Categorized for global compliance (DPDP, GDPR, HIPAA, PCI-DSS).
 */

export const PATTERNS = {
  // ─── 1. Email Addresses (RFC 5322 Compliant) ───────────────────────────────
  EMAIL: /\b[a-zA-Z0-9][a-zA-Z0-9._%+-]{0,63}@[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}\.[a-zA-Z]{2,}\b/gi,

  // ─── 2. Credit & Debit Cards (13 to 19 digits formatted or raw, validated via Luhn) ──
  CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{1,4}\b|\b\d{13,19}\b/g,

  // ─── 3. Indian Identity & KYC (Aadhaar & PAN) ───────────────────────────────
  // Aadhaar: 12 digits (with optional space/dash, starting with 2-9)
  AADHAAR: /\b[2-9]\d{3}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // PAN: 5 letters, 4 digits, 1 letter
  PAN: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  // Indian Voter ID (EPIC): 3 letters followed by 7 digits
  VOTER_ID: /\b[A-Z]{3}\d{7}\b/g,
  // Indian Passport: 1 letter followed by 7 digits
  INDIAN_PASSPORT: /\b[A-Z][1-9]\d{6}\b/g,
  // Indian IFSC Code: 4 letters, '0', 6 alphanumeric
  IFSC: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  // Indian Pincode: 6 digits (optionally prefixed by state or dash)
  INDIAN_PINCODE: /\b[1-9][0-9]{2}\s?[0-9]{3}\b/g,

  // ─── 4. Social Handles & URLs (LinkedIn, GitHub, Portfolios) ────────────────
  SOCIAL_URL: /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+|github\.com\/[a-zA-Z0-9_-]+|(?:[a-zA-Z0-9-]+\.)*daeq\.in(?:\/[a-zA-Z0-9_.~!*';:@&=+$,/?%#[\]-]*)?|[a-zA-Z0-9-]+\.(?:com|in|org|io|dev|app|net)\/[a-zA-Z0-9_.~!*';:@&=+$,/?%#[\]-]+)/gi,

  // ─── 5. Physical Addresses & Street Patterns ────────────────────────────────
  ADDRESS: /\b(?:C\d+\/\d+|[A-Z0-9/-]+,\s*)?(?:[A-Z][a-zA-Z0-9/,-]+\s+){1,6}(?:Road|Rd|Street|St|Lane|Ln|Avenue|Ave|Nagar|Colony|HUDCO|Layout|Extension|Sector|Phase|Bypass|Highway|Cross|Main)\b/gi,

  // ─── 6. International National IDs & Tax Numbers ────────────────────────────
  // US Social Security Number (SSN)
  US_SSN: /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g,
  // US Employer Identification Number (EIN)
  US_EIN: /\b\d{2}-\d{7}\b/g,
  // UK National Insurance Number (NINO)
  UK_NINO: /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi,
  // Canadian Social Insurance Number (SIN)
  CA_SIN: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
  // Australian Tax File Number (TFN)
  AU_TFN: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,

  // ─── 7. International Banking ───────────────────────────────────────────────
  // IBAN (Pre-filtered, validated via ISO 7064 Mod-97)
  IBAN: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
  // SWIFT / BIC: 8 or 11 characters
  SWIFT_BIC: /\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
  // US ABA 9-Digit Routing
  US_ROUTING: /\b(?:0[1-9]|[1-2][0-9]|3[0-2]|6[1-9]|7[0-2]|80)\d{7}\b/g,

  // ─── 8. International Phone Numbers ─────────────────────────────────────────
  // E.164 and international formats (+1, +44, +91, +49, +33, +61, +81, etc.)
  PHONE_INTERNATIONAL: /(?:\+|00)[1-9]\d{0,2}[-\s.]?(?:\(?\d{1,4}\)?[-\s.]?)?\d{2,4}[-\s.]?\d{3,4}(?:[-\s.]?\d{2,4})?\b/g,
  // Domestic 10-digit formats with standard delimiters (US, India, UK)
  PHONE_DOMESTIC: /(?:\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)|(?:\b[6-9]\d{4}[\s-]?\d{5}\b)|(?:\b[6-9]\d{9}\b)/g,

  // ─── 9. IP Addresses (IPv4 & IPv6) ──────────────────────────────────────────
  IPV4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  IPV6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,

  // ─── 10. Dates of Birth & Formal Document Dates ─────────────────────────────
  DATE_OF_BIRTH: /\b(?:DOB|Date of Birth|Born|Birth Date)[\s:]+\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi,
  DOCUMENT_DATE: /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi
};
