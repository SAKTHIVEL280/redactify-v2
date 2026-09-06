/**
 * Comprehensive Unit Test & Benchmark Suite for Redactify V2 Engine
 */

import { detectEntities } from '../src/core/engine/detector.js';
import {
  validateLuhn,
  validateVerhoeff,
  validateIBAN,
  validateIndianPAN,
  validateUSRouting
} from '../src/core/engine/algorithms.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('─── Testing Mathematical Algorithms ──────────────────────────────');

// 1. Luhn Tests
assert(validateLuhn('4532015112830366') === true, 'Valid Visa passes Luhn');
assert(validateLuhn('4532-0151-1283-0366') === true, 'Formatted Visa passes Luhn');
assert(validateLuhn('4532015112830367') === false, 'Invalid Visa fails Luhn');

// 2. Verhoeff Aadhaar Tests (Valid UIDAI 12-digit number)
assert(validateVerhoeff('218442898716') === true, 'Valid Aadhaar passes Verhoeff');
assert(validateVerhoeff('2184 4289 8716') === true, 'Formatted Aadhaar passes Verhoeff');
assert(validateVerhoeff('218442898712') === false, 'Invalid Aadhaar fails Verhoeff');
assert(validateVerhoeff('018442898716') === false, 'Aadhaar starting with 0 is rejected');

// 3. Indian PAN Tests
assert(validateIndianPAN('ABCPE1234F') === true, 'Valid Person PAN passes');
assert(validateIndianPAN('ABCPK5678Z') === true, 'Valid Individual PAN passes');
assert(validateIndianPAN('ABCDE1234F') === false, 'Invalid 4th character entity fails');
assert(validateIndianPAN('12345ABCDE') === false, 'Invalid PAN format fails');

// 4. IBAN Tests
assert(validateIBAN('GB82WEST12345698765432') === true, 'Valid UK IBAN passes');
assert(validateIBAN('GB82WEST12345698765433') === false, 'Invalid UK IBAN fails');

// 5. US Routing Checksum
assert(validateUSRouting('011000015') === true, 'Valid Federal Reserve Routing passes');
assert(validateUSRouting('011000016') === false, 'Invalid Federal Reserve Routing fails');

console.log('\n─── Testing Master Entity Detector ───────────────────────────────');

const sampleText = `
CONFIDENTIAL SETTLEMENT AGREEMENT
Date: 14/08/2026

Parties Involved:
Mr. Alexander Vance (Client) and Acme Global Technologies Ltd.
Email: alex.vance@acmetech.io
Direct Phone: +1-555-349-2041 or +91-9876543210
Office IP: 192.168.1.105

Payment & Banking Details:
Credit Card: 4532-0151-1283-0366
Bank Account IBAN: GB82WEST12345698765432
US Routing Number: 011000015

Identity Verification:
Indian Aadhaar UID: 2184 4289 8716
PAN Number: ABCPK5678Z
US SSN: 123-45-6789
`;

const startTime = performance.now();
const allDetections = detectEntities(sampleText, 'all');
const duration = performance.now() - startTime;

console.log(`Detection executed in ${duration.toFixed(2)} ms`);
assert(duration < 20, `Execution speed must be <20ms (Actual: ${duration.toFixed(2)}ms)`);

const typesFound = new Set(allDetections.map(d => d.type));

assert(typesFound.has('email'), 'Detected Email');
assert(typesFound.has('credit_card'), 'Detected Credit Card (Luhn checked)');
assert(typesFound.has('aadhaar'), 'Detected Aadhaar (Verhoeff checked)');
assert(typesFound.has('pan'), 'Detected PAN');
assert(typesFound.has('iban'), 'Detected IBAN');
assert(typesFound.has('ssn'), 'Detected US SSN');
assert(typesFound.has('phone'), 'Detected Phone numbers');
assert(typesFound.has('ip'), 'Detected IP address');
assert(typesFound.has('name'), 'Detected Person Name via honorific heuristic');
assert(typesFound.has('organization'), 'Detected Organization via corporate suffix');
assert(typesFound.has('date'), 'Detected Numeric Date');

// Test Salary & Education & Locations
const salaryEduText = `Stipend is INR 21,500 / per month. Fixed package: ₹18,50,000. Studied at K.S. Rangasamy College of Technology with CGPA: 8.66 / 10.0. Contact: 080- 41940000. Office at Bengaluru. Reference: HR\\F\\JD46253. Graduated: 2023 – 2027. Father's Name: Elango. Voter ID: ZBC3989613.`;
const salaryDets = detectEntities(salaryEduText, 'all');
const salaryTypes = new Set(salaryDets.map(d => d.type));
assert(salaryTypes.has('salary'), 'Detected Financial Compensation & Salary');
assert(salaryTypes.has('education'), 'Detected Educational Institution');
assert(salaryTypes.has('gpa'), 'Detected CGPA/Academic Performance');
assert(salaryTypes.has('phone'), 'Detected Landline STD Phone');
assert(salaryTypes.has('location'), 'Detected Metro City Location');
assert(salaryTypes.has('reference_id'), 'Detected Document Reference ID');
assert(salaryTypes.has('date'), 'Detected Date Range (2023 – 2027)');
assert(salaryTypes.has('name'), 'Detected Relative Name via contextual label');
assert(salaryTypes.has('voter_id'), 'Detected Indian Voter ID (EPIC)');

// Check Aadhaar masking format
const aadhaarEntity = allDetections.find(d => d.type === 'aadhaar');
assert(aadhaarEntity && aadhaarEntity.suggested === 'XXXX-XXXX-8716', 'Aadhaar masked first 8 digits as per UIDAI rule');

console.log('\n─── Testing Preset Filtering ─────────────────────────────────────');
const kycOnly = detectEntities(sampleText, 'kyc');
const kycTypes = new Set(kycOnly.map(d => d.type));
assert(kycTypes.has('aadhaar') && kycTypes.has('pan'), 'KYC preset includes Aadhaar and PAN');
assert(!kycTypes.has('credit_card') && !kycTypes.has('iban'), 'KYC preset excludes unrelated credit card & IBAN');

console.log(`\n──────────────────────────────────────────────────────────────────`);
console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🌟 ALL UNIT TESTS PASSED WITH 100% ACCURACY!');
}
