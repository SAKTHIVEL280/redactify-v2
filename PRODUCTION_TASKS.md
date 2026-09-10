# REDACTIFY V2: AUTHORITATIVE PRODUCTION SPECIFICATION & BATCH DIRECTIVE
> **Document Status**: Production Standard  
> **Repository**: `/home/fl3xy/Projects/Redactify`  
> **Target Production URL**: `https://redactify.daeq.in`  
> **Payment Infrastructure**: Razorpay (Domestic INR) + Dodo Payments (Global USD MoR)  
> **Target Audience**: AI Pair-Programmers & Senior Forward Deployed Engineers (FDE)  

---

## 1. Concrete Reality Check: Why Redactify Isn't Production-Ready Yet

This is not a generic checklist. Below is the exact, unvarnished state of Redactify's codebase today:

### What Actually Works (The Strong Foundation)
1. **Mathematical Checksums (`src/core/engine/algorithms.js`)**:
   - `validateVerhoeff()` accurately validates Indian Aadhaar numbers.
   - `validateLuhn()` validates Visa/MasterCard/Amex, Canadian SIN, and US NPI.
   - `validateIBAN()` validates ISO 7064 Mod-97-10 for 70+ countries.
   - `validateNHS()`, `validateSingaporeNRIC()`, `validateAustralianTFN()` calculate scalar weighted Mod-11.
   - `validateSpanishDNI()` calculates Mod-23 letter mapping.
   - `validateFrenchNIR()` calculates Mod-97 INSEE key.
   - All 158 tests in `tests/engine.test.js` pass in ~700ms.
2. **True Vector Text Stream Scrubbing (`src/core/parsers/pdfExporter.js`)**:
   - `scrubPageTextStreams()` decompresses PDF streams via browser `DecompressionStream`, scrubs matching literal tokens and hexadecimal codes, and re-compresses via `CompressionStream`.
   - Redacted pages are flattened to 2.5x canvas bitmaps to destroy ghost text completely.
3. **Word DOCX Multi-Run XML Parser & Exporter (`src/core/parsers/docxExporter.js`)**:
   - `redactNodesInParagraph()` reconstructs cumulative text across split `<w:r><w:t>` tags, performs span-based replacements, and sanitizes headers (`header*.xml`), footers (`footer*.xml`), and document properties (`docProps/core.xml`).
4. **Zero-CDN Offline OCR Assets (`public/tessdata/`)**:
   - `eng.traineddata` (5.2MB), WASM cores (`tesseract-core-lstm.wasm.js`, `tesseract-core-simd-lstm.wasm.js`), and `worker.min.js` reside locally in `public/tessdata/`. No external network requests are made when running OCR.

---

### The Critical Flaws, Placebos, & Broken Promises
1. **The "Placebo SaaS" Monetization Gap**:
   - In [`PricingPage.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/PricingPage.jsx), clicking "Upgrade to Pro" triggers `openProModal()`. In [`ProModal.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/ProModal.jsx), clicking "View Pricing Plan" triggers `onNavigateToPricing()`. They point at each other in a loop. **There is no checkout integration.** A user who wants to pay cannot give you money.
   - In [`ProModal.jsx:L43-55`](file:///home/fl3xy/Projects/Redactify/src/components/ProModal.jsx#L43-L55), there is an **Evaluator 1-Click Test Pass** button (`handleQuickTestActivation`) that unlocks Pro for anyone with one click.
   - In [`ProModal.jsx:L251-255`](file:///home/fl3xy/Projects/Redactify/src/components/ProModal.jsx#L251-L255), there is an **"Insert Demo Key"** button that automatically fills `RDCT-PRO-A1B2C3D4-6AB6`.
   - In [`validator.js:L7`](file:///home/fl3xy/Projects/Redactify/src/core/license/validator.js#L7), `LICENSE_SECRET = 0x5a3f18e9;` is a hardcoded 32-bit polynomial hash shipped in plaintext JavaScript. Anyone can generate unlimited Pro and Enterprise keys directly in the Chrome DevTools console by running `generateValidLicenseKey('PRO')`.
2. **Missing UI for Custom Keywords & Regex**:
   - [`AGENT.md`](file:///home/fl3xy/Projects/Redactify/AGENT.md) lists *"Custom Regex / Keyword DB: 1 custom rule max (Free) vs. Unlimited custom rules & company templates (Pro)"*.
   - [`redactionStore.js:L124-130`](file:///home/fl3xy/Projects/Redactify/src/store/redactionStore.js#L124-L130) has `addCustomRule()` and `removeCustomRule()`.
   - [`detector.js:L1051-1076`](file:///home/fl3xy/Projects/Redactify/src/core/engine/detector.js#L1051-L1076) has code to execute `customRules`.
   - **BUT there is ZERO user interface in [`EntityInspector.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/EntityInspector.jsx)** to view, add, or delete custom keywords or regexes. The feature is completely unreachable by users.
3. **The Multi-File Batch Processing Illusion**:
   - [`AGENT.md`](file:///home/fl3xy/Projects/Redactify/AGENT.md) advertises *"Batch Folder Processing (Drop 20+ files at once -> ZIP export)"*.
   - [`StudioDropzone.jsx:L135`](file:///home/fl3xy/Projects/Redactify/src/components/StudioDropzone.jsx#L135) strictly takes `e.dataTransfer.files?.[0]` and the `<input>` lacks the `multiple` attribute. Dropping multiple files simply ignores everything except the first file.
   - There is no queue manager, no batch progress component, and no ZIP bundling logic.
4. **Client-Side Feedback Black Hole**:
   - In [`FeedbackModal.jsx:L17-25`](file:///home/fl3xy/Projects/Redactify/src/components/FeedbackModal.jsx#L17-L25), `handleSubmit` writes to `localStorage.setItem('redactify_user_feedback', ...)`. No network request is ever dispatched. Bug reports and missed PII reports never reach the founder.
5. **PDF Export Destroys Searchable Text on Redacted Pages**:
   - In [`pdfExporter.js:L218-305`](file:///home/fl3xy/Projects/Redactify/src/core/parsers/pdfExporter.js#L218-L305), any page containing a redaction is rasterized to a 2.5x JPEG image and replaces the original page. While this eliminates ghost text, it turns all unredacted text on that page into non-selectable, non-searchable image pixels. Legal and corporate users who need searchable PDF archives find this unacceptable.
6. **No Service Worker / Cold-Start PWA Caching**:
   - While OCR assets are local, opening the site on an air-gapped machine without visiting it while online will fail because the browser has not cached the 5.2MB `eng.traineddata` or WASM binaries in the Cache API.

---

## 2. Payment Architecture: India + International for Indian Founders

### The Problem with Stripe for Indian Solopreneurs
Standard Stripe accounts in India have been heavily restricted since late 2023 due to strict Reserve Bank of India (RBI) e-mandate and purpose code regulations. Indian founders face invite-only onboarding, strict monthly export limits, and complex FIRC paperwork.

### The Recommended Dual-Gateway Stack

```mermaid
flowchart TD
    User["Customer on Redactify Pricing Page"] --> CurrencyChoice{"Selects Currency"}
    
    CurrencyChoice -->|INR (₹)| Razorpay["Razorpay Payment Links / Pages"]
    CurrencyChoice -->|USD ($)| DodoPayments["Dodo Payments (Merchant of Record)"]
    
    Razorpay -->|UPI / RuPay / Netbanking| DomesticBank["Founder Indian Bank (HDFC / ICICI) in INR"]
    DodoPayments -->|Global Visa / MC / Amex / Apple Pay| DodoMoR["Dodo MoR Handles Foreign Sales Tax / EU VAT"]
    DodoMoR -->|Automated INR Wire Payout + FIRA| DomesticBank
    
    DomesticBank -.->|Instant Key Generated on Success Screen| KeyDelivery["Cryptographic License Key (RDCT-PRO-...)"]
```

1. **Domestic India (INR ₹)**: **Razorpay Payment Pages / Payment Links**
   - Handles UPI (Google Pay, PhonePe, Paytm) at 0% transaction fee.
   - Handles RuPay, domestic credit/debit cards, and Netbanking.
   - Direct settlement to your Indian HDFC/ICICI account within 1-2 days.
2. **International (USD $)**: **Dodo Payments** (or Lemon Squeezy)
   - Operates as a **Merchant of Record (MoR)** specifically designed for Indian developers and companies.
   - Accepts global cards (Visa, Mastercard, American Express), Apple Pay, and Google Pay from 150+ countries.
   - **MoR Advantage**: Dodo is the legal merchant of record. They calculate, collect, and remit US State Sales Tax and EU VAT, shield you from foreign chargebacks, and remit net earnings directly into your Indian bank account in INR via wire, automatically generating your Foreign Inward Remittance Advice (FIRA/FIRC) for RBI/ED compliance.

---

## 3. Recommended Sequential Priority Order

We execute the batches in this strict priority order to maximize immediate business impact:

1. **Priority 1 (P0): Batch 1 - Monetization & Checkout Integration**
   *Why*: Eliminates the "placebo" loops, wires real Razorpay & Dodo checkout links, removes backdoors, and hardens the license validator.
2. **Priority 2 (P1): Batch 2 - Custom Keywords, Regex & Rule Management UI**
   *Why*: Closes the gap between marketing claims and actual capabilities. Allows users to redact project codenames and client names with instant re-scans.
3. **Priority 3 (P1): Batch 3 - Batch Multi-File Processing & ZIP Export**
   *Why*: Unlocks the primary feature hook that justifies the Pro upgrade ($9/mo or ₹499/mo).
4. **Priority 4 (P2): Batch 4 - Dual-Mode PDF Export & Memory Guard**
   *Why*: Fixes vector text destruction by offering users a choice ("Forensic Flattening" vs. "Crisp Vector Text") and prevents 50-page mobile memory crashes.
5. **Priority 5 (P2): Batch 5 - Real Feedback Telemetry & Bug Reporting**
   *Why*: Replaces the `localStorage` black hole with a functional, zero-data-leak serverless endpoint.
6. **Priority 6 (P3): Batch 6 - Service Worker, PWA & Cold-Start Offline Support**
   *Why*: Guarantees true air-gapped usability on cold-start via Service Worker pre-caching.
7. **Priority 7 (P3): Batch 7 - Web Worker Decoupling & 200+ Test Suite**
   *Why*: Decouples the UI thread for constant 60fps during 300-page document scans and expands forensic tests.

---

## 4. Batch-by-Batch Implementation Specifications

---

### BATCH 1: Commercial Monetization & Real Checkout Integration
**Priority**: P0 (Critical Blocker)  
**Estimated Time**: 1 Day  

#### Task 1.1: Create Centralized Checkout Configuration
- **Create File**: [`src/core/license/checkoutConfig.js`](file:///home/fl3xy/Projects/Redactify/src/core/license/checkoutConfig.js)
- **Code Requirements**:
  ```javascript
  export const CHECKOUT_URLS = {
    INR: {
      PRO_MONTHLY: import.meta.env.VITE_CHECKOUT_INR_MONTHLY || 'https://pages.razorpay.com/redactify-pro-monthly',
      LIFETIME: import.meta.env.VITE_CHECKOUT_INR_LIFETIME || 'https://pages.razorpay.com/redactify-pro-lifetime',
      ENTERPRISE: 'mailto:sakthivel@daeq.in?subject=Redactify%20Enterprise%20INR%20Inquiry'
    },
    USD: {
      PRO_MONTHLY: import.meta.env.VITE_CHECKOUT_USD_MONTHLY || 'https://checkout.dodopayments.com/buy/redactify-pro-monthly',
      LIFETIME: import.meta.env.VITE_CHECKOUT_USD_LIFETIME || 'https://checkout.dodopayments.com/buy/redactify-pro-lifetime',
      ENTERPRISE: 'mailto:sakthivel@daeq.in?subject=Redactify%20Enterprise%20USD%20Inquiry'
    }
  };
  ```

#### Task 1.2: Wire Real Checkout Redirection in UI
- **Modify File**: [`src/components/PricingPage.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/PricingPage.jsx)
  - Import `CHECKOUT_URLS`.
  - Replace `onClick={openProModal}` on the Pro Monthly card with a direct checkout launcher:
    ```javascript
    const handleBuyPro = (planType = 'PRO_MONTHLY') => {
      const url = CHECKOUT_URLS[currency][planType];
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    };
    ```
  - Add explicit helper text beneath the button: *"Instant cryptographic key displayed on receipt & emailed immediately."*
- **Modify File**: [`src/components/ProModal.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/ProModal.jsx)
  - Replace `onNavigateToPricing()` in the modal's pricing cards with direct checkout triggers using `handleBuyPro()`.

#### Task 1.3: Remove Test Backdoors from Production
- **Modify File**: [`src/components/ProModal.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/ProModal.jsx)
  - Delete lines 43–55 (`handleQuickTestActivation` and the evaluator pass banner).
  - Delete lines 249–256 ("Insert Demo Key" button).
  - Conditionally render demo key helpers **only** if `import.meta.env.DEV === true`.

#### Task 1.4: Asymmetric / Cryptographically Hardened License Validator
- **Modify File**: [`src/core/license/validator.js`](file:///home/fl3xy/Projects/Redactify/src/core/license/validator.js)
  - Replace the single polynomial secret with an asymmetric public key signature check (or an HMAC-SHA256 token format with base64-encoded metadata and an SHA256 signature).
  - License structure: `RDCT.<TIER>.<PAYLOAD_HEX>.<SIG_HEX>`.
  - The payload contains: `{ id, tier, email, issuedAt, expiresAt }`.
  - Validate that `Date.now() < expiresAt` (for monthly subscriptions).

#### Batch 1 Verification Checklist
- [ ] Run `npm run build` to ensure clean build.
- [ ] In browser, click "Upgrade to Pro" in INR mode $\rightarrow$ opens configured Razorpay URL in new tab.
- [ ] Switch to USD mode $\rightarrow$ click "Upgrade to Pro" $\rightarrow$ opens configured Dodo Payments URL in new tab.
- [ ] Verify that `ProModal` in production build contains no "1-Click Pass" or "Insert Demo Key" text.
- [ ] Run `npm test` and verify license tests pass.

---

### BATCH 2: Custom Keywords, Regex & Rule Management UI
**Priority**: P1 (High User Value)  
**Estimated Time**: 1 Day  

#### Task 2.1: Extend `useRedactionStore` for Custom Rules
- **Modify File**: [`src/store/redactionStore.js`](file:///home/fl3xy/Projects/Redactify/src/store/redactionStore.js)
  - Verify `customRules` schema:
    ```typescript
    interface CustomRule {
      id: string;
      name: string;           // e.g. "Project Titan"
      pattern: string;        // e.g. "Project Titan" or "TITAN-\d{4}"
      isRegex: boolean;       // false = literal text, true = regex
      caseSensitive: boolean; // default: false
      wholeWord: boolean;     // default: true (for literal text)
      replacement: string;    // default: "[CONFIDENTIAL]"
      enabled: boolean;       // default: true
    }
    ```
  - Add `updateCustomRule(id, updates)` and `toggleCustomRule(id)`.
  - Add persistence: sync `customRules` to `localStorage.getItem('redactify_custom_rules')`.

#### Task 2.2: Build the Custom Rules Tab in `EntityInspector.jsx`
- **Modify File**: [`src/components/EntityInspector.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/EntityInspector.jsx)
  - Add a segmented top tab bar:
    - **"Auto PII"** (shows count of auto-detected entities)
    - **"Custom Rules"** (shows count of user-defined rules)
  - When "Custom Rules" is active:
    - Display a list of user rules with green/gray toggle switches, match counts, and delete buttons.
    - Display an empty state: *"No custom keywords yet. Add client names, project codenames, or proprietary terms to redact."*
    - Display a prominent button: **"+ Add Custom Term or Regex"**.

#### Task 2.3: Create `CustomRuleModal.jsx`
- **Create File**: [`src/components/CustomRuleModal.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/CustomRuleModal.jsx)
  - Fields:
    - Rule Name (optional, e.g. "Acme Corp")
    - Text or Regex Pattern (required, input with monospaced font)
    - Mode Switcher: "Plain Keyword" vs. "Regular Expression (RegEx)"
    - Checkboxes: "Case Sensitive", "Match Whole Word"
    - Redaction Label: dropdown + custom text (e.g. `[CLIENT PRIVILEGED]`)
  - Real-time regex syntax validation: if `isRegex` is checked, test `new RegExp(pattern)` in a `try/catch` and show red error text if invalid.

#### Task 2.4: Real-Time Document Re-Scan Trigger
- When a rule is added, edited, toggled, or deleted:
  - If a PDF is active: re-run detection across cached page text extracted during `parseAndScanPDF()`.
  - If a Word DOCX or Text document is active: re-run `detectEntities(rawText, activePreset, customRules)`.
  - Update `redactions` in `useRedactionStore` dynamically without reloading the document.

#### Batch 2 Verification Checklist
- [ ] Add unit tests in `tests/engine.test.js`:
  - Test custom keyword `"Project Titan"` matching across a mock document.
  - Test custom regex `\b[A-Z]{3}-\d{5}\b` matching `XYZ-12345`.
  - Test invalid regex `[a-z(` fails gracefully without throwing an unhandled exception.
- [ ] Manual browser verification:
  - Open `Sample_Executive_Offer.pdf`.
  - Go to Entity Inspector $\rightarrow$ Custom Rules $\rightarrow$ Add `"OmniCorp"`.
  - Verify every instance of "OmniCorp" on the document canvas is immediately covered with a redaction box.
  - Export document $\rightarrow$ verify "OmniCorp" is redacted in the exported PDF.

---

### BATCH 3: Batch Multi-File Processing & ZIP Export Engine
**Priority**: P1 (Core Pro Feature)  
**Estimated Time**: 2 Days  

#### Task 3.1: Multi-File Ingestion & Queue State
- **Modify File**: [`src/store/documentStore.js`](file:///home/fl3xy/Projects/Redactify/src/store/documentStore.js)
  - Add batch state:
    ```javascript
    batchQueue: [], // Array of { id, file, fileType, name, size, status, progress, redactions, outputBlob, error }
    isBatchMode: false,
    setBatchQueue: (queue) => set({ batchQueue: queue, isBatchMode: queue.length > 1 }),
    updateBatchItem: (id, updates) => set((s) => ({
      batchQueue: s.batchQueue.map((item) => item.id === id ? { ...item, ...updates } : item)
    })),
    clearBatch: () => set({ batchQueue: [], isBatchMode: false })
    ```
- **Modify File**: [`src/components/StudioDropzone.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/StudioDropzone.jsx)
  - Add `multiple` attribute to `<input type="file" />`.
  - In `handleDrop` and `handleFileInput`, check `files.length`.
  - If `files.length > 1`:
    - If `!isPro`: open `ProModal('batch')` with message: *"Batch folder processing is a Pro feature. Upgrade to process multiple files at once."*
    - If `isPro`: populate `batchQueue` and activate `isBatchMode`.

#### Task 3.2: Create `BatchProcessingStudio.jsx`
- **Create File**: [`src/components/BatchProcessingStudio.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/BatchProcessingStudio.jsx)
  - Layout:
    - Top summary bar: Total files (e.g. 12 files, 45.2 MB), overall progress bar.
    - Global Preset Selector: Apply preset to entire batch (e.g. "Indian KYC: Aadhaar + PAN + Voter ID").
    - Queue Table:
      - File Name & Size
      - Detected File Type Badge (PDF, DOCX, IMG, TXT)
      - Status: `Queued` $\rightarrow$ `Scanning` $\rightarrow$ `Redacting` $\rightarrow$ `Ready` (or `Error`)
      - Entities Found Count
      - Individual Download Button (for single file retrieval)
    - Action Footer:
      - "Start Batch Redaction" primary button.
      - "Download All as ZIP" button (enabled once all files complete).
      - "Clear Batch & Return" button.

#### Task 3.3: Implement `batchExporter.js` with `JSZip`
- **Create File**: [`src/core/parsers/batchExporter.js`](file:///home/fl3xy/Projects/Redactify/src/core/parsers/batchExporter.js)
  - Sequential processing function:
    ```javascript
    export async function processBatchQueue(queue, presetId, customRules, style, isPro, onProgress) { ... }
    ```
  - For each file in the queue:
    1. Parse and scan (`parseAndScanPDF`, `parseAndExtractDOCX`, or plain text).
    2. Apply active preset and custom rules.
    3. Export redacted document (`exportRedactedPDF`, `exportRedactedDOCX`, `exportRedactedImage`).
    4. Store output `Blob`.
  - ZIP packaging function:
    ```javascript
    export async function createBatchZip(completedItems) {
      const zip = new JSZip();
      for (const item of completedItems) {
        zip.file(`${item.baseName}_redacted.${item.ext}`, item.outputBlob);
      }
      zip.file("REDACTION_AUDIT_LOG.txt", generateAuditReport(completedItems));
      return await zip.generateAsync({ type: "blob" });
    }
    ```

#### Task 3.4: Mount Batch Studio in `src/App.jsx`
- **Modify File**: [`src/App.jsx`](file:///home/fl3xy/Projects/Redactify/src/App.jsx)
  - Check `isBatchMode`: if true, render `<BatchProcessingStudio />` instead of `<DocumentViewer />`.

#### Batch 3 Verification Checklist
- [ ] Add unit test in `tests/engine.test.js` validating:
  - Batching 3 mock documents generates a valid `.zip` blob containing all 3 redacted files and the audit text log.
- [ ] Manual browser test:
  - Drag and drop 5 mixed documents (PDFs, DOCX, images).
  - Click "Start Batch Redaction".
  - Verify all 5 progress bars complete sequentially.
  - Click "Download All as ZIP" $\rightarrow$ uncompress and verify all 5 output files open cleanly and contain proper redactions.

---

### BATCH 4: Dual-Mode PDF Export & Memory Optimization
**Priority**: P2 (Quality & Stability)  
**Estimated Time**: 1 Day  

#### Task 4.1: Add Dual-Mode Toggle to StyleToolbar
- **Modify File**: [`src/store/redactionStore.js`](file:///home/fl3xy/Projects/Redactify/src/store/redactionStore.js)
  - Add `exportMode: 'raster'` (`'raster'` | `'vector'`) to `style`.
- **Modify File**: [`src/components/StyleToolbar.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/StyleToolbar.jsx)
  - Add an Export Mode selector:
    - **"Forensic Flattening (Max Security)"** (Default: converts redacted pages to high-res bitmap, zero ghost text guarantee).
    - **"Vector Blackout (Preserve Selectable Text)"** (Preserves crisp vector text, draws opaque vector boxes, scrubs literal stream strings).

#### Task 4.2: Implement Mode Switching in `pdfExporter.js`
- **Modify File**: [`src/core/parsers/pdfExporter.js`](file:///home/fl3xy/Projects/Redactify/src/core/parsers/pdfExporter.js)
  - If `style.exportMode === 'vector'`:
    - Skip canvas rasterization.
    - Run `scrubPageTextStreams(page, pdfDoc, boxes)`.
    - Draw vector rectangles using `page.drawRectangle()`.
    - Page text remains 100% vector and searchable via Ctrl+F.
  - If `style.exportMode === 'raster'`:
    - Run the canvas rasterization pipeline.

#### Task 4.3: Memory Throttling for Large PDFs
- In `pdfExporter.js`, add memory safeguards during rasterization:
  - Process pages sequentially.
  - Set `canvas.width = 0; canvas.height = 0;` immediately after each page is converted to image bytes.
  - Introduce `await new Promise(r => setTimeout(r, 25))` between pages to allow the browser V8 garbage collector to reclaim GPU texture buffers.

#### Batch 4 Verification Checklist
- [ ] Add unit test in `tests/engine.test.js`:
  - Verify Vector Mode exports retain selectable text outside redacted bounding boxes.
  - Verify Raster Mode exports have 0 extractable text characters via `pdftotext`.
- [ ] Test in browser: Export a 20-page document in both modes and verify file size differences (Vector is typically 100-300KB, Raster is 3-8MB).

---

### BATCH 5: Remote Feedback Pipeline & Telemetry Safety
**Priority**: P2 (User Intelligence)  
**Estimated Time**: 0.5 Day  

#### Task 5.1: Wire Serverless Feedback Ingestion
- **Modify File**: [`src/components/FeedbackModal.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/FeedbackModal.jsx)
  - Add configurable endpoint:
    ```javascript
    const FEEDBACK_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT || 'https://formspree.io/f/xanykgbv'; // or custom Cloudflare Worker
    ```
  - In `handleSubmit`:
    - Payload contains **strictly non-sensitive metadata**: `{ category, message, url, timestamp, userAgent, appVersion: '2.0.0' }`.
    - **Never** include document names, file bytes, or extracted PII values.
    - Send via `fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`.
    - If fetch fails (e.g. user is completely offline), save to `localStorage` and display: *"You appear to be offline. Your feedback has been saved locally."*

#### Batch 5 Verification Checklist
- [ ] Submit a test feedback entry in dev mode $\rightarrow$ verify HTTP request succeeds and payload contains 0 document bytes.

---

### BATCH 6: Service Worker, PWA & Cold-Start Offline Invariant
**Priority**: P3 (Reliability & Compliance)  
**Estimated Time**: 1 Day  

#### Task 6.1: Web App Manifest
- **Create File**: `public/manifest.webmanifest`
  ```json
  {
    "name": "Redactify - Sovereign Document Redaction",
    "short_name": "Redactify",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#fbf9f5",
    "theme_color": "#09090b",
    "icons": [
      { "src": "/logo.svg", "sizes": "any", "type": "image/svg+xml" }
    ]
  }
  ```
- **Modify File**: `index.html` to link `manifest.webmanifest`.

#### Task 6.2: Service Worker Pre-Caching
- **Create File**: `public/sw.js`
  - Pre-cache application shell (`/`, `/index.html`, `/src/index.css`).
  - Cache-First strategy for `/tessdata/*` (`eng.traineddata`, WASM cores, `worker.min.js`).
- **Modify File**: `src/main.jsx`
  - Register `sw.js` in production environment.
- **Modify File**: [`src/components/Header.jsx`](file:///home/fl3xy/Projects/Redactify/src/components/Header.jsx)
  - Add a subtle status dot indicating offline readiness:
    ```javascript
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-bark-grey">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="hidden sm:inline">Air-Gapped & Offline Ready</span>
    </div>
    ```

#### Batch 6 Verification Checklist
- [ ] Build and preview: `npm run build && npm run preview`.
- [ ] Open Chrome DevTools $\rightarrow$ Network $\rightarrow$ Check "Offline" $\rightarrow$ Reload page $\rightarrow$ App loads instantly and OCR initializes without errors.

---

### BATCH 7: Web Worker Decoupling & 200+ Test Suite
**Priority**: P3 (Scale & Enterprise Verification)  
**Estimated Time**: 1 Day  

#### Task 7.1: Offload Detection to a Dedicated Web Worker
- **Create File**: `src/core/workers/detector.worker.js`
  - Handles `detectEntities(text, presetId, customRules)` in a background thread.
- **Modify File**: [`src/core/parsers/pdfParser.js`](file:///home/fl3xy/Projects/Redactify/src/core/parsers/pdfParser.js)
  - Post page text to worker and await detections, keeping the main React render thread at a solid 60fps even on 200-page files.

#### Task 7.2: Expand Test Suite Past 200 Tests
- **Modify File**: [`tests/engine.test.js`](file:///home/fl3xy/Projects/Redactify/tests/engine.test.js)
  - Add tests for:
    - Custom regex boundary handling (10 tests)
    - Batch ZIP archive structure and audit report (5 tests)
    - Vector vs. Raster PDF stream verification (5 tests)
    - Asymmetric cryptographic signature validation (10 tests)
    - Extreme international PII edge cases (12 tests)
  - Target: **200+ tests passing in <1 second**.

#### Batch 7 Verification Checklist
- [ ] Run `npm test` $\rightarrow$ must output: `Total Passed: 200+ | Total Failed: 0`.
- [ ] Run `npm run build` $\rightarrow$ clean bundle output.

---

## 5. Master Progress Tracking Board

| Batch | Title | Primary Files Touched | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Batch 1** | Commercial Monetization & Real Checkout Integration | `checkoutConfig.js`, `PricingPage.jsx`, `ProModal.jsx`, `validator.js` | **P0** | `[PENDING]` |
| **Batch 2** | Custom Keywords, Regex & Rule Management UI | `redactionStore.js`, `EntityInspector.jsx`, `CustomRuleModal.jsx` | **P1** | `[PENDING]` |
| **Batch 3** | Batch Multi-File Processing & ZIP Export Engine | `documentStore.js`, `StudioDropzone.jsx`, `BatchProcessingStudio.jsx`, `batchExporter.js` | **P1** | `[PENDING]` |
| **Batch 4** | Dual-Mode PDF Export & Memory Optimization | `redactionStore.js`, `StyleToolbar.jsx`, `pdfExporter.js` | **P2** | `[PENDING]` |
| **Batch 5** | Remote Feedback Pipeline & Telemetry Safety | `FeedbackModal.jsx` | **P2** | `[PENDING]` |
| **Batch 6** | Service Worker, PWA & Offline Cold-Start Invariant | `sw.js`, `manifest.webmanifest`, `main.jsx`, `Header.jsx` | **P3** | `[PENDING]` |
| **Batch 7** | Web Worker Decoupling & 200+ Forensic Test Suite | `detector.worker.js`, `pdfParser.js`, `engine.test.js` | **P3** | `[PENDING]` |
