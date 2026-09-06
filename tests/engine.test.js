/**
 * Comprehensive Unit Test & Benchmark Suite for Redactify V2 Engine
 */

import { detectEntities } from '../src/core/engine/detector.js';
import {
  validateLuhn,
  validateVerhoeff,
  validateIBAN,
  validateIndianPAN,
  validateUSRouting,
  validateGSTIN,
  validateNHS,
  validateCanadianSIN,
  validateUSSSN,
  validateUKNINO,
  validateSpanishDNI,
  validateFrenchNIR,
  validateItalianCodiceFiscale,
  validateAustralianTFN,
  validateAustralianMedicare,
  validateSingaporeNRIC,
  validateUSNPI
} from '../src/core/engine/algorithms.js';
import JSZip from 'jszip';
import { parseAndExtractDOCX } from '../src/core/parsers/docxParser.js';
import { exportRedactedDOCX } from '../src/core/parsers/docxExporter.js';
import { validateLicenseKey, generateValidLicenseKey } from '../src/core/license/validator.js';
import { exportRedactedPDF } from '../src/core/parsers/pdfExporter.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { execSync } from 'child_process';

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

// 6. Indian GSTIN Validation
assert(validateGSTIN('29ABCPE1234F1Z5') === true, 'Valid Indian GSTIN passes');
assert(validateGSTIN('99ABCPE1234F1Z5') === false, 'Invalid state code GSTIN fails');

// 7. UK NHS Number Mod-11 Checksum
assert(validateNHS('943 476 5919') === true, 'Valid UK NHS passes Mod-11');
assert(validateNHS('943 476 5918') === false, 'Invalid UK NHS fails Mod-11');

// 8. Canadian Social Insurance Number (SIN) Luhn Checksum
assert(validateCanadianSIN('046-454-286') === true, 'Valid Canadian SIN passes Luhn');
assert(validateCanadianSIN('046-454-287') === false, 'Invalid Canadian SIN fails Luhn');

// 9. US SSN Structure Tests
assert(validateUSSSN('123-45-6789') === true, 'Valid US SSN passes');
assert(validateUSSSN('000-45-6789') === false, 'US SSN with Area 000 fails');
assert(validateUSSSN('666-45-6789') === false, 'US SSN with Area 666 fails');
assert(validateUSSSN('912-45-6789') === false, 'US SSN with Area 900+ fails');

// 10. UK National Insurance Number (NINO) Tests
assert(validateUKNINO('AB123456C') === true, 'Valid UK NINO passes');
assert(validateUKNINO('BG123456C') === false, 'UK NINO starting with BG fails');

// 11. Spanish DNI / NIE Mod-23 Tests
assert(validateSpanishDNI('12345678Z') === true, 'Valid Spanish DNI passes Mod-23');
assert(validateSpanishDNI('12345678A') === false, 'Invalid Spanish DNI fails Mod-23');
assert(validateSpanishDNI('X1234567L') === true, 'Valid Spanish NIE passes Mod-23');

// 12. French NIR Mod-97 Tests
assert(validateFrenchNIR('1851234567890') === true, 'Valid French 13-digit NIR passes');

// 13. Italian Codice Fiscale Tests
assert(validateItalianCodiceFiscale('RSSMRA85M01H501Q') === true, 'Valid Italian Codice Fiscale passes check char');
assert(validateItalianCodiceFiscale('RSSMRA85M01H501Z') === false, 'Invalid Italian Codice Fiscale fails check char');

// 14. Australian TFN Mod-11 Tests
assert(validateAustralianTFN('100000001') === true, 'Valid Australian 9-digit TFN passes Mod-11');
assert(validateAustralianTFN('100000002') === false, 'Invalid Australian TFN fails Mod-11');

// 15. Australian Medicare Number Tests
assert(validateAustralianMedicare('2123456701') === true, 'Valid Australian Medicare passes check digit');
assert(validateAustralianMedicare('2123456791') === false, 'Invalid Australian Medicare fails check digit');

// 16. Singapore NRIC Mod-11 Tests
assert(validateSingaporeNRIC('S1234567D') === true, 'Valid Singapore NRIC passes Mod-11');
assert(validateSingaporeNRIC('S1234567A') === false, 'Invalid Singapore NRIC fails Mod-11');

// 17. US NPI Luhn Checksum Tests
assert(validateUSNPI('1234567893') === true, 'Valid US NPI passes Luhn checksum');
assert(validateUSNPI('1234567894') === false, 'Invalid US NPI fails Luhn checksum');

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

// Test Salary & Education & Locations & Global Enterprise PII
const salaryEduText = `Stipend is INR 21,500 / per month. Fixed package: ₹18,50,000. Studied at K.S. Rangasamy College of Technology with CGPA: 8.66 / 10.0. Contact: 080- 41940000. Office at Bengaluru. Reference: HR\\F\\JD46253. Graduated: 2023 – 2027. Father's Name: Elango. Voter ID: ZBC3989613. GSTIN: 29ABCPE1234F1Z5. UAN: 100987654321. A/c: 012345678912. Plate: TN-37-AB-1234. NHS: 943 476 5919. MRN: 8934521. Policy Number: POL-987654. AWS: AKIAIOSFODNN7EXAMPLE. Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz. Crypto: 0x71C634C2632530e79715dc423b0bAF9e26569742. SIN: 046-454-286.`;
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
assert(salaryTypes.has('gstin'), 'Detected GSTIN with checksum check');
assert(salaryTypes.has('epfo_uan'), 'Detected EPFO Universal Account Number');
assert(salaryTypes.has('bank_account'), 'Detected Bank Account Number');
assert(salaryTypes.has('vehicle_registration'), 'Detected Vehicle Registration');
assert(salaryTypes.has('nhs'), 'Detected UK NHS with Mod-11 check');
assert(salaryTypes.has('medical_record'), 'Detected Medical Record Number');
assert(salaryTypes.has('health_insurance'), 'Detected Health Insurance Policy ID');
assert(salaryTypes.has('secret_key'), 'Detected AWS Key and GitHub Token');
assert(salaryTypes.has('crypto_wallet'), 'Detected Crypto Ethereum Wallet');
assert(salaryTypes.has('sin'), 'Detected Canadian SIN with Luhn check');

// Check Aadhaar masking format
const aadhaarEntity = allDetections.find(d => d.type === 'aadhaar');
assert(aadhaarEntity && aadhaarEntity.suggested === 'XXXX-XXXX-8716', 'Aadhaar masked first 8 digits as per UIDAI rule');

// Test Global Enterprise & Regional Jurisdiction IDs
const globalText = `
US Person: ITIN 921-50-1234, EIN: 12-3456789, NPI: 1234567893, DEA: AB1234567.
UK Citizen: NINO AB123456C, Sort Code: 12-34-56, UTR: 1234567890.
EU Citizen: VAT DE123456789, Spanish DNI: 12345678Z, French NIR: 1851234567890, Italian Codice Fiscale: RSSMRA85M01H501Q, German IdNr: 12 345 678 901.
APAC Citizen: Australia Medicare: 2123 45670 1, Singapore NRIC: S1234567D.
Developer Secrets: Stripe pk_test_51Abcdefghijklmnopqrstuv, Slack xoxb-1234567890-abcdef123456, Google API AIzaSyD-1234567890abcdef1234567890ab, OpenAI sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890ab, JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c.
`;
const globalDets = detectEntities(globalText, 'all');
const globalTypes = new Set(globalDets.map(d => d.type));
assert(globalTypes.has('itin'), 'Detected US ITIN');
assert(globalTypes.has('ein'), 'Detected US EIN');
assert(globalTypes.has('npi'), 'Detected US NPI with Luhn check');
assert(globalTypes.has('dea'), 'Detected US DEA Registration');
assert(globalTypes.has('nino'), 'Detected UK NINO');
assert(globalTypes.has('sort_code'), 'Detected UK Sort Code');
assert(globalTypes.has('utr'), 'Detected UK UTR');
assert(globalTypes.has('eu_vat'), 'Detected EU VAT');
assert(globalTypes.has('dni'), 'Detected Spanish DNI with Mod-23');
assert(globalTypes.has('nir'), 'Detected French NIR with Mod-97');
assert(globalTypes.has('codice_fiscale'), 'Detected Italian Codice Fiscale');
assert(globalTypes.has('idnr'), 'Detected German Tax IdNr');
assert(globalTypes.has('medicare'), 'Detected Australian Medicare with check digit');
assert(globalTypes.has('nric'), 'Detected Singapore NRIC with Mod-11');
assert(globalTypes.has('api_token'), 'Detected API Tokens (Stripe, Slack, Google, OpenAI, JWT)');

console.log('\n─── Testing Preset Filtering ─────────────────────────────────────');
const kycOnly = detectEntities(sampleText, 'kyc');
const kycTypes = new Set(kycOnly.map(d => d.type));
assert(kycTypes.has('aadhaar') && kycTypes.has('pan'), 'KYC preset includes Aadhaar and PAN');
assert(!kycTypes.has('credit_card') && !kycTypes.has('iban'), 'KYC preset excludes unrelated credit card & IBAN');

const usPresetDets = detectEntities(globalText, 'us_compliance');
const usPresetTypes = new Set(usPresetDets.map(d => d.type));
assert(usPresetTypes.has('itin') && usPresetTypes.has('npi'), 'US Compliance preset includes ITIN and NPI');
assert(!usPresetTypes.has('nino') && !usPresetTypes.has('dni'), 'US Compliance preset excludes UK/EU IDs');

const euPresetDets = detectEntities(globalText, 'eu_uk_gdpr');
const euPresetTypes = new Set(euPresetDets.map(d => d.type));
assert(euPresetTypes.has('nino') && euPresetTypes.has('dni') && euPresetTypes.has('codice_fiscale'), 'EU & UK GDPR preset includes NINO, DNI, and Codice Fiscale');

const apacPresetDets = detectEntities(globalText, 'apac_compliance');
const apacPresetTypes = new Set(apacPresetDets.map(d => d.type));
assert(apacPresetTypes.has('nric') && apacPresetTypes.has('medicare'), 'APAC preset includes Singapore NRIC and AU Medicare');

const secretsPresetDets = detectEntities(globalText, 'secrets_dev');
const secretsPresetTypes = new Set(secretsPresetDets.map(d => d.type));
assert(secretsPresetTypes.has('api_token'), 'Secrets preset includes developer API tokens');

console.log('\n─── Testing In-Memory DOCX Parser & Exporter ─────────────────────');
const zip = new JSZip();
const sampleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Confidential Employee Offer</w:t></w:r></w:p>
    <w:p><w:r><w:t>Candidate: Sakthivel E</w:t></w:r></w:p>
    <w:p><w:r><w:t>Contact: +91 94872 92520</w:t></w:r></w:p>
    <w:p><w:r><w:t>Fixed Stipend: INR 21,500 / per month</w:t></w:r></w:p>
  </w:body>
</w:document>`;
zip.file('word/document.xml', sampleXml);
const docxBuf = await zip.generateAsync({ type: 'nodebuffer' });
const dummyDocx = { arrayBuffer: async () => docxBuf.buffer.slice(docxBuf.byteOffset, docxBuf.byteOffset + docxBuf.byteLength) };
const parsedDocx = await parseAndExtractDOCX(dummyDocx);
assert(parsedDocx.rawText.includes('Sakthivel E'), 'DOCX Parser extracts candidate name');
assert(parsedDocx.rawText.includes('+91 94872 92520'), 'DOCX Parser extracts phone number');

const docxRedactions = [
  { redact: true, value: 'Sakthivel E', suggested: '[NAME REDACTED]' },
  { redact: true, value: '+91 94872 92520', suggested: '[PHONE REDACTED]' }
];
const redactedBlob = await exportRedactedDOCX({
  fileArrayBuffer: docxBuf.buffer.slice(docxBuf.byteOffset, docxBuf.byteOffset + docxBuf.byteLength),
  redactions: docxRedactions,
  isPro: true
});
const redactedZip = await JSZip.loadAsync(await redactedBlob.arrayBuffer());
const outXml = await redactedZip.file('word/document.xml').async('string');
assert(!outXml.includes('Sakthivel E') && outXml.includes('[NAME REDACTED]'), 'DOCX Exporter redacts name');
assert(!outXml.includes('+91 94872 92520') && outXml.includes('[PHONE REDACTED]'), 'DOCX Exporter redacts phone');

// Test DOCX Multi-Run Splitting across runs (<w:t>Sakthi</w:t><w:t>vel E</w:t>)
const splitZip = new JSZip();
const splitXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Employee: </w:t></w:r>
      <w:r><w:t>Sakthi</w:t></w:r>
      <w:r><w:t>vel E</w:t></w:r>
      <w:r><w:t> is confirmed.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>UID: 2184</w:t></w:r>
      <w:r><w:t> 4289 </w:t></w:r>
      <w:r><w:t>8716</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
splitZip.file('word/document.xml', splitXml);
const splitBuf = await splitZip.generateAsync({ type: 'nodebuffer' });
const splitRedactedBlob = await exportRedactedDOCX({
  fileArrayBuffer: splitBuf.buffer.slice(splitBuf.byteOffset, splitBuf.byteOffset + splitBuf.byteLength),
  redactions: [
    { redact: true, value: 'Sakthivel E', suggested: '[NAME REDACTED]' },
    { redact: true, value: '2184 4289 8716', suggested: 'XXXX-XXXX-8716' }
  ],
  isPro: true
});
const splitRedactedZip = await JSZip.loadAsync(await splitRedactedBlob.arrayBuffer());
const splitOutXml = await splitRedactedZip.file('word/document.xml').async('string');
assert(!splitOutXml.includes('Sakthivel E') && splitOutXml.includes('[NAME REDACTED]'), 'DOCX Multi-Run: Successfully redacts name split across <w:t> tags');
assert(!splitOutXml.includes('2184 4289 8716') && splitOutXml.includes('XXXX-XXXX-8716'), 'DOCX Multi-Run: Successfully redacts Aadhaar split across 3 <w:t> tags');

// Test DOCX Auxiliary Headers & Footers & Metadata Sanitization
const auxZip = new JSZip();
auxZip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Body content here</w:t></w:r></w:p></w:body></w:document>`);
auxZip.file('word/header1.xml', `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>CONFIDENTIAL HEADER: SSN 123-45-6789</w:t></w:r></w:p></w:hdr>`);
auxZip.file('word/footer1.xml', `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Internal use only - Author: alex.vance@acmetech.io</w:t></w:r></w:p></w:ftr>`);
auxZip.file('docProps/core.xml', `<?xml version="1.0"?><cp:coreProperties xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/coreProperties"><dc:creator>Alexander Vance</dc:creator><cp:lastModifiedBy>Secret Admin</cp:lastModifiedBy></cp:coreProperties>`);

const auxBuf = await auxZip.generateAsync({ type: 'nodebuffer' });
const dummyAuxDocx = { arrayBuffer: async () => auxBuf.buffer.slice(auxBuf.byteOffset, auxBuf.byteOffset + auxBuf.byteLength) };
const parsedAux = await parseAndExtractDOCX(dummyAuxDocx);
assert(parsedAux.rawText.includes('123-45-6789'), 'DOCX Parser: Extracts SSN from header1.xml');
assert(parsedAux.rawText.includes('alex.vance@acmetech.io'), 'DOCX Parser: Extracts email from footer1.xml');

const auxRedactedBlob = await exportRedactedDOCX({
  fileArrayBuffer: auxBuf.buffer.slice(auxBuf.byteOffset, auxBuf.byteOffset + auxBuf.byteLength),
  redactions: [
    { redact: true, value: '123-45-6789', suggested: '[SSN REDACTED]' },
    { redact: true, value: 'alex.vance@acmetech.io', suggested: '[EMAIL REDACTED]' }
  ],
  isPro: true
});
const auxRedactedZip = await JSZip.loadAsync(await auxRedactedBlob.arrayBuffer());
const outHdrXml = await auxRedactedZip.file('word/header1.xml').async('string');
const outFtrXml = await auxRedactedZip.file('word/footer1.xml').async('string');
const outCoreXml = await auxRedactedZip.file('docProps/core.xml').async('string');

assert(!outHdrXml.includes('123-45-6789') && outHdrXml.includes('[SSN REDACTED]'), 'DOCX Exporter: Redacts sensitive text in header1.xml');
assert(!outFtrXml.includes('alex.vance@acmetech.io') && outFtrXml.includes('[EMAIL REDACTED]'), 'DOCX Exporter: Redacts sensitive text in footer1.xml');
assert(!outCoreXml.includes('Alexander Vance') && outCoreXml.includes('Redactify Zero-Trust Engine'), 'DOCX Metadata Sanitization: Strips author and replaces with Redactify Zero-Trust Engine');

console.log('\n─── Testing Cryptographic License Validator ───────────────────────');
const generatedKey = generateValidLicenseKey('PRO');
const validResult = validateLicenseKey(generatedKey);
assert(validResult.valid === true && validResult.tier === 'PRO', 'Valid generated PRO license key passes cryptographic check');

const entKey = generateValidLicenseKey('ENT');
const entResult = validateLicenseKey(entKey);
assert(entResult.valid === true && entResult.tier === 'ENT', 'Valid generated ENT license key passes cryptographic check');

const fakeBypass = validateLicenseKey('RDCT-FREE-PASS');
assert(fakeBypass.valid === false, 'Trivial bypass attempt RDCT-FREE-PASS is strictly rejected');

const tamperedKey = generatedKey.slice(0, -2) + '00';
const tamperedResult = validateLicenseKey(tamperedKey);
assert(tamperedResult.valid === false, 'Tampered license checksum is strictly rejected');

console.log('\n─── Testing PDF Forensic Text Stream Sanitization ────────────────');
const testDoc = await PDFDocument.create();
const testPage = testDoc.addPage([600, 400]);
const testFont = await testDoc.embedFont(StandardFonts.Helvetica);
testPage.drawText('CONFIDENTIAL_AADHAAR_218442898716', { x: 50, y: 350, size: 18, font: testFont });
testPage.drawText('Public Report Title: Annual Statement', { x: 50, y: 300, size: 14, font: testFont });

const testPdfBytes = await testDoc.save();
const redactedPdfBlob = await exportRedactedPDF({
  fileArrayBuffer: testPdfBytes.buffer.slice(testPdfBytes.byteOffset, testPdfBytes.byteOffset + testPdfBytes.byteLength),
  redactions: [
    {
      pageIndex: 0,
      x: 0.08,
      y: 0.1,
      width: 0.6,
      height: 0.1,
      value: '218442898716',
      redact: true
    },
    {
      pageIndex: 0,
      x: 0.08,
      y: 0.1,
      width: 0.6,
      height: 0.1,
      value: 'CONFIDENTIAL_AADHAAR',
      redact: true
    }
  ],
  isPro: true
});

const redactedPdfBytes = new Uint8Array(await redactedPdfBlob.arrayBuffer());

// Verify with pdftotext to guarantee zero ghost text extraction
let extractedPdfText = '';
try {
  const fs = await import('fs');
  const tmpPath = `/tmp/test_redacted_${Date.now()}.pdf`;
  fs.writeFileSync(tmpPath, redactedPdfBytes);
  extractedPdfText = execSync(`pdftotext ${tmpPath} -`).toString();
  fs.unlinkSync(tmpPath);
} catch (e) {
  // If pdftotext isn't available or fails, fallback to raw buffer inspection
  extractedPdfText = Buffer.from(redactedPdfBytes).toString('latin1');
}

assert(!extractedPdfText.includes('218442898716'), 'PDF Ghost Text Eliminated: Aadhaar number cannot be extracted via pdftotext');
assert(!extractedPdfText.includes('CONFIDENTIAL_AADHAAR'), 'PDF Ghost Text Eliminated: Confidential prefix cannot be extracted via pdftotext');
assert(extractedPdfText.includes('Annual Statement'), 'PDF Selective Redaction: Non-redacted public content remains intact');

console.log('\n─── Testing Offline Zero-CDN OCR Invariant ───────────────────────');
const fs = await import('fs');
assert(fs.existsSync('public/tessdata/worker.min.js'), 'Offline OCR: worker.min.js bundled in public/tessdata/');
assert(fs.existsSync('public/tessdata/tesseract-core-simd-lstm.wasm.js'), 'Offline OCR: tesseract-core-simd-lstm.wasm.js bundled in public/tessdata/');
assert(fs.existsSync('public/tessdata/tesseract-core-lstm.wasm.js'), 'Offline OCR: tesseract-core-lstm.wasm.js bundled in public/tessdata/');
assert(fs.existsSync('public/tessdata/eng.traineddata'), 'Offline OCR: eng.traineddata bundled in public/tessdata/');
const ocrCode = fs.readFileSync('src/core/parsers/ocrScanner.js', 'utf8');
assert(ocrCode.includes("workerPath: '/tessdata/worker.min.js'"), 'Offline OCR: workerPath configured to local self-hosted asset');
assert(ocrCode.includes("corePath: '/tessdata'"), 'Offline OCR: corePath configured to local self-hosted asset');
assert(ocrCode.includes("workerBlobURL: false"), 'Offline OCR: workerBlobURL disabled for strict CSP compliance');

console.log(`\n──────────────────────────────────────────────────────────────────`);
console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🌟 ALL UNIT TESTS PASSED WITH 100% ACCURACY!');
}
