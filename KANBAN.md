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
  - Created and pushed to clean repository: [`SAKTHIVEL280/redactify-v2`](https://github.com/SAKTHIVEL280/redactify-v2).
- [x] **Milestone 1: Core Foundation & High-Performance Engine**
  - Scaffolding complete with Vite + React 18 + Tailwind CSS + Lucide + Zustand.
  - Mathematical Checksum Validation (Luhn for Cards, Verhoeff for Indian Aadhaar, ISO 7064 Mod-97 for IBAN, US ABA Routing, Indian PAN).
  - High-precision international patterns (E.164 Phones, US SSN, UK NINO, Canada SIN, Australia TFN, IPv4/v6).
  - Contextual heuristic name & organization deduction (<4ms execution, 0MB download).
  - Verified with 29 automated unit tests in `tests/engine.test.js` (100% pass rate).
- [x] **Milestone 2: Multi-Modal Viewer & True Vector Redaction**
  - Normalized Bounding Coordinate System (0.0 to 1.0) for zero drift across screens and zoom factors.
  - True Vector PDF Redaction Engine (`pdf-lib`) with metadata stripping and memory-safe export.
  - Format-preserving DOCX OOXML engine (`jszip`).
  - Image canvas redaction engine (JPG/PNG/WebP).
  - Interactive Crosshair Manual Drawing Tool (+ Manual Box for scans, signatures, stamps).
- [x] **Milestone 3: Presentation Studio & Presets**
  - Modern, responsive Dark Studio UI (`Header.jsx`, `Dropzone.jsx`, `DocumentViewer.jsx`, `EntityInspector.jsx`, `StyleToolbar.jsx`).
  - Live "Zero-Trust" Security Indicator & "Try It Offline" challenge card.
  - Compliance Presets: Indian KYC/DPDP (Aadhaar `XXXX-XXXX-1234` masking), Legal/Court, Banking, Medical, Resume, Universal.
  - Customizable Redaction Styles (Solid Black, Charcoal, White-out, Navy, Audit Red, plus custom text labels like `[CONFIDENTIAL]`).
  - Full Undo / Redo engine (`Ctrl+Z` / `Ctrl+Y`).
- [x] **Milestone 4: Frictionless Monetization & Gating Engine**
  - Pro Upgrade Modal with dual pricing: Global ($9/mo) + India (₹499/mo, ₹999 early-bird lifetime pass).
  - Free trial hook: Page 1 export with watermark to prove value while requiring Pro for full multi-page export.
  - License store with persistence and offline activation.
  - User feedback & missed-entity reporting modal.
- [x] **Milestone 5: SaaS Transformation & Real Document Verification**
  - High-converting SaaS landing page with Hero Dropzone, instant sample document testers ("Try Sample Resume", "Try Sample KYC Letter"), 3-step pipeline, enterprise comparison matrix (vs Adobe Acrobat & Cloud Uploaders), regulatory badges (DPDP Act 2023, UIDAI, GDPR, HIPAA), dual-currency pricing (₹499 / $9), and FAQ accordions.
  - End-to-end image rendering & manual crosshair blackout drawing on canvas for Aadhaar cards, photos, signatures, and stamps.
  - Rigorously tested against real confidential documents (`RESUME_3_6_26.pdf`, `cgi_offerletter.pdf`, and `sakthivel-aadhaar-card.png`) with 100% precision.
  - Verified with automated headless Chromium CDP screenshot capture and visual analysis.

---

### 🟡 [IN PROGRESS] Current Milestone: Cloudflare Pages Deployment & Verification
- [ ] Connect custom domain / subdomain (`redactify.daeq.in`).
- [ ] Setup Cloudflare Pages automated deployment.
- [ ] Live end-to-end payment gateway setup (Razorpay for domestic UPI/Cards + Dodo Payments for international MoR).

---

### 🔵 [BACKLOG] Upcoming Enhancements
- [ ] Dual Payment Gateway Webhooks (Dodo Payments for global USD + Razorpay for domestic INR).
- [ ] Batch folder multi-file queue runner (Pro feature).
- [ ] Cloudflare Worker Edge license verification handler.
