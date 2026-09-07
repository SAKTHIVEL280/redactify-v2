# Redactify 

> **Zero-Knowledge, Client-Side Document Redaction & PII Masking Platform** 
> Mathematically verified, compliance-grade redaction running 100% inside your browser via WebAssembly. 
> **Zero document uploads. Zero server logs. Zero data leakage.**

[![Unit Tests](https://img.shields.io/badge/tests-99%2F99%20passing-brightgreen.svg)](tests/engine.test.js)
[![Performance](https://img.shields.io/badge/detection-%3C15ms-blue.svg)](src/core/engine/detector.js)
[![Privacy](https://img.shields.io/badge/privacy-zero--cloud--upload-emerald.svg)](#zero-knowledge-privacy-guarantee)
[![Compliance](https://img.shields.io/badge/compliance-DPDP%20%7C%20GDPR%20%7C%20HIPAA%20%7C%20PCI--DSS-violet.svg)](#supported-global-jurisdictions)

---

## Executive Summary

Traditional document redaction platforms (such as Adobe Acrobat, Smallpdf, or iLovePDF) require users to upload sensitive files (contracts, tax filings, Aadhaar cards, medical histories, and employee resumes) to third-party cloud servers. This exposes organizations to devastating security breaches, regulatory penalties under GDPR, DPDP, HIPAA, and unauthorized AI training on confidential data.

**Redactify** eliminates cloud exposure entirely. Operating as a pure client-side application, Redactify executes document parsing, mathematical PII detection, OCR scanning, and vector burn-in directly inside browser memory (WASM + Web Workers). 

---

## Zero-Knowledge Privacy Guarantee

* **Zero Server Uploads**: Network requests containing document bytes are physically impossible. The entire lifecycle (from drag-and-drop to export) happens in local RAM.
* **Offline-First Resilience**: Once loaded, Redactify works seamlessly with no internet connection (airplane mode compatible).
* **True Vector & XML Burn-In**: Redactions are not merely visual masks or floating HTML overlays. Text tokens and coordinates are permanently stripped from the underlying PDF streams and DOCX XML trees before export.

---

## Mathematical Verification Engine

Redactify eliminates false positives through formal mathematical checksum algorithms rather than naive regex matching:

| Standard / Checksum | Algorithm | Validates Entities |
| :--- | :--- | :--- |
| **Verhoeff Dihedral (D5)** | Permutation table dihedral group checksum | Indian Aadhaar (12 digits, UIDAI compliant) |
| **Luhn Mod-10** | Doubling alternate digits modulo 10 | Visa, MasterCard, Amex, Discover, Canadian SIN, US NPI |
| **ISO 7064 Mod-97-10** | Polynomial remainder chunking | International Bank Account Numbers (IBAN across 70+ nations) |
| **Mod-11 Weights** | Dot-product scalar weighting | UK NHS Numbers, Australian TFN, Singapore NRIC / FIN |
| **Mod-23 Letters** | Modulo 23 mapping table (TRWAGMYFPDXBNJZSQVHLCKE) | Spanish DNI & Foreigner NIE Numbers |
| **Modulo 97 Check** | French National Insee control key formula | French NIR (Numéro de Sécurité Sociale) |
| **Italian CF Odd/Even** | Alphanumeric alternating parity substitution | Italian Codice Fiscale (16 characters) |
| **Federal Reserve 3-7-1** | Weighted Federal Reserve routing checksum | US ABA Banking Routing Numbers |

---

## Supported Global Jurisdictions

Redactify includes out-of-the-box support for international enterprise compliance:

### United States (HIPAA, GLBA, FERPA)
* **Social Security Numbers (SSN)**: Full Area/Group/Serial validation (rejects invalid 000, 666, 900+ series).
* **Tax Identifiers**: Individual Taxpayer ID (ITIN), Employer Identification Number (EIN).
* **Healthcare / HIPAA**: National Provider Identifier (NPI with Luhn check), DEA Registration Numbers, Medical Record Numbers (MRN), Health Insurance Member IDs.
* **Financial**: ABA 9-digit Routing Transit numbers, Credit/Debit cards.

### European Union & United Kingdom (GDPR)
* **National Identification**: UK National Insurance Number (NINO with HMRC prefix validation), Spanish DNI & NIE (Mod-23), French NIR (Mod-97), Italian Codice Fiscale, German Steuer-IdNr.
* **Banking & Tax**: International IBAN (Mod-97), UK Sort Codes (XX-XX-XX), UK Unique Taxpayer Reference (UTR), European VAT IDs.
* **Healthcare**: UK 10-digit NHS Numbers with Mod-11 validation.

### India & APAC (DPDP Act, UIDAI, Privacy Act)
* **Indian Identity**: Aadhaar UID (Verhoeff checksum + UIDAI masking: XXXX-XXXX-1234), PAN Cards (entity check 4th character), Voter ID (EPIC), Indian Passports, Driving Licenses.
* **Indian Tax & Employment**: GSTIN (15-character state + PAN + checksum), EPFO Universal Account Number (UAN), Bank Accounts, IFSC Codes.
* **Australia & APAC**: Australian Tax File Number (TFN Mod-11), Australian Medicare Number (check digit verified), Singapore NRIC / FIN (Mod-11).

### Cloud Secrets & Developer Credentials
* **Cloud & DevOps**: AWS Access Keys (AKIA...), GitHub Personal Access Tokens (ghp_..., github_pat_...), Google API Keys (AIza...), Slack Tokens (xoxb-...), Stripe Secret/Publishable Keys (sk_live_...), OpenAI Keys (sk-...), JSON Web Tokens (eyJ...), PEM Private Keys (RSA, EC, OPENSSH).
* **Cryptocurrency**: Bitcoin (P2PKH, P2SH, Bech32), Ethereum (0x... 40 hex), Solana wallets.

---

## In-Browser WASM OCR Scanner (~15MB)

Scanned receipts, photographed identity cards, or flat PDFs without an embedded font stream are recognized directly on the client:
* **WebAssembly Engine**: Built on tesseract.js@7.0.0 with WebAssembly worker threads.
* **Zero Cloud Calls**: The neural OCR model processes raw image pixel buffers inside browser WebAssembly memory.
* **Exact Coordinate Mapping**: Word and block bounding boxes are extracted directly from Tesseract layout blocks, matched against detected PII entities, and projected to normalized coordinate space (0.0 to 1.0) for automated masking.

---

## Quick Start

### Prerequisites
* Node.js >= 18.0.0
* npm >= 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/SAKTHIVEL280/redactify-v2.git
cd redactify-v2

# Install dependencies
npm install
```

### Development
```bash
# Start local development server with Hot Module Replacement
npm run dev
```

### Run Unit Tests
```bash
# Execute the complete 99-test benchmark suite (<90ms)
npm test
```

### Production Build
```bash
# Build optimized production bundle
npm run build
```

---

## Test Suite & Benchmarks

```
─── Testing Mathematical Algorithms ──────────────────────────────
 Valid Visa passes Luhn
 Valid Aadhaar passes Verhoeff
 Valid Person PAN passes
 Valid UK IBAN passes
 Valid Federal Reserve Routing passes
 Valid Indian GSTIN passes
 Valid UK NHS passes Mod-11
 Valid Canadian SIN passes Luhn
 Valid US SSN passes
 Valid UK NINO passes
 Valid Spanish DNI passes Mod-23
 Valid French 13-digit NIR passes
 Valid Italian Codice Fiscale passes check char
 Valid Australian 9-digit TFN passes Mod-11
 Valid Australian Medicare passes check digit
 Valid Singapore NRIC passes Mod-11
 Valid US NPI passes Luhn checksum

─── Testing Master Entity Detector ───────────────────────────────
Detection executed in 8.53 ms (<20ms benchmark target)
 All 40+ PII categories verified
 All 5 Regional Compliance Presets verified
 DOCX XML in-memory Parser & Exporter verified

Total Passed: 99 | Total Failed: 0
 ALL UNIT TESTS PASSED WITH 100% ACCURACY!
```

---

## License

Proprietary & Enterprise Licensed. All rights reserved. 
Built with enterprise Forward Deployed Engineering (FDE) rigor.
