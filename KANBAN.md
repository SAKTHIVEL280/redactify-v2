# 📋 Redactify V2 — Engineering Kanban Board

> **Live Project Board**: Track milestones, features, and active tasks in real-time.  
> **Target**: High-converting, zero-cost, universal 100% client-side redaction SaaS.

---

## 📌 Columns Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     BACKLOG     │ ──> │   IN PROGRESS   │ ──> │      DONE       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🚀 Active Sprint Board

### 🟢 [DONE] Completed
- [x] **FDE Deep-Dive Research & Pre-Mortem Analysis**
  - Identified unit economics, competitor pricing ($9/mo vs $29/mo), and conversion strategy.
  - Formulated the zero-cost architecture (Cloudflare Pages + Turso + client-side processing).
- [x] **Identified V1 Failure Modes**
  - Eliminated the 100MB Hugging Face blocking model download.
  - Eliminated the buggy concurrency lock that locked out paying customers.
  - Eliminated canvas rasterization memory explosion for multi-page PDFs.
- [x] **Engineered Operational Safety Protocols**
  - Created [`AGENT.md`](./AGENT.md) for anti-hallucination, strict safety boundaries, and verification invariants.
- [x] **GitHub CLI Verification & Repository Initialization**
  - Authenticated `SAKTHIVEL280`.
  - Configured `.gitignore` to isolate legacy references.

---

### 🟡 [IN PROGRESS] Current Milestone: Milestone 1 (Core Foundation & Engine)
- [ ] **Create GitHub Repository (`redactify-v2`) and push initial baseline.**
- [ ] **Scaffold Modern Frontend Stack (Vite + React 19 + Tailwind CSS + Lucide + Zustand).**
- [ ] **Implement Core International Detection Engine (`/src/core/engine`)**:
  - Luhn algorithm for Credit Cards (Visa, MC, Amex, RuPay, JCB).
  - Verhoeff algorithm for Indian Aadhaar validation (12-digit checksum).
  - Indian PAN card regex & validation.
  - International Phone Numbers (E.164 standard + country formats).
  - International Bank Accounts (IBAN with ISO 7064 Mod-97 checksum, SWIFT/BIC, US Routing).
  - US SSN, UK NINO, Canada SIN, Australia TFN.
  - RFC Email validation & IP addresses (IPv4 / IPv6).
  - Contextual Heuristic Name & Organization extractor (5ms execution, 0MB download).

---

### 🔵 [BACKLOG] Upcoming Milestones

#### Milestone 2: Multi-Modal Viewer & True Vector Redaction
- [ ] **Normalized Bounding Box System (0.0 to 1.0)**:
  - Resolution-independent coordinate mapping for zero drift across devices/zoom levels.
- [ ] **Interactive Document Viewer**:
  - High-performance PDF renderer (`pdfjs-dist` lazy loaded).
  - Scanned PDF detection with graceful manual tool prompt.
  - Interactive Manual Crosshair Redaction Tool (draw boxes over signatures/stamps).
- [ ] **Customizable Redaction Style System**:
  - Solid blackout (`#000000`).
  - Custom color palette (Charcoal, White-out, Navy, Warning Red).
  - Custom embedded text labels (`[CONFIDENTIAL]`, `[REDACTED]`, custom text).
- [ ] **True Vector PDF Export Engine (`pdf-lib`)**:
  - Remove underlying character streams and draw native vector rectangles.
  - Fast <2s export for 50-page documents with zero canvas memory bloat.
  - Metadata sanitization (wipe author, creation software, hidden timestamps).
- [ ] **Format-Preserving DOCX OOXML Redaction Engine (`jszip`)**:
  - Search & replace in XML text runs preserving 100% styles, fonts, and tables.

#### Milestone 3: Professional SaaS UI, Presets & Conversion Design
- [ ] **Studio Layout**:
  - Top bar with "Try It Offline" challenge card & live zero-trust client sandbox indicator.
  - Preset Selector: Indian KYC/DPDP, Legal/Court, Financial/Banking, Resume/HR.
  - Undo / Redo engine (`Ctrl+Z` / `Ctrl+Y`).
- [ ] **Feedback & Missed-Entity Reporting Drawer**:
  - Direct user feedback loop to report missed text/patterns.

#### Milestone 4: Monetization & Aggressive Gating Engine
- [ ] **Free vs. Pro Gating**:
  - Free: Page 1 only + subtle watermark (*"Trial — Redacted with Redactify"*).
  - Pro: Unlimited pages, zero watermark, all presets, batch processing.
- [ ] **Dual Payment Gateway Integration**:
  - Razorpay (India UPI / domestic cards in INR ₹).
  - Dodo Payments (International cards / Apple Pay in USD $ with direct HDFC payouts).
- [ ] **Cryptographic License Engine**:
  - Asymmetric Ed25519 signed token verification with offline `expiresAt` support.
  - Zero locking bugs; frictionless multi-device activation.
