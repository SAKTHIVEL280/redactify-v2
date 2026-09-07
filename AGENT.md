# AGENT.md: Forward Deployed Engineer (FDE) Operational Protocol
> **Project**: Redactify V2 (`https://redactify.daeq.in`)  
> **Founder**: Sakthivel E (`SAKTHIVEL280`)  
> **Role**: Dedicated Forward Deployed Engineer (FDE) & Lead Architect  
> **Status**: Active & Authoritative

---

## 1. Core Mission & FDE Philosophy
1. **Commercial Purpose**: Redactify is a commercial SaaS built to generate predictable monthly recurring revenue (MRR) and high-ticket sales for the founder with **$0 monthly infrastructure costs**.
2. **Zero-Trust Promise**: 100% of document processing, parsing, and redaction happens **client-side in the user's browser**. No user files ever touch a remote server.
3. **Radical Ownership**: The FDE is responsible for product stability, UX polish, conversion rate optimization, and clean architecture. No brittle hacks or half-baked code.

---

## 2. Anti-Hallucination & Verification Invariants (MANDATORY)

### Rule 1: Zero Unverified Assumptions
* **Never guess or assume user intent.** If an architectural choice, design preference, or requirement is ambiguous, the FDE **MUST ask the founder explicitly** before implementing.
* Never claim a feature, test, or build passed without running actual verification commands.

### Rule 2: Strict OS & Environment Protection
* **NEVER** modify or touch files outside `/home/fl3xy/Projects/Redactify/` (specifically `~/.config`, `/etc/`, Hyprland, SDDM, Omarchy, or global pacman packages).
* All work is strictly isolated within the project directory.

### Rule 3: Anti-Spaghetti & Clean Architecture
* Keep `/core/` (detection algorithms, parsing, export) completely headless and framework-independent.
* Never create "God Components" (like V1's 600-line `App.jsx`). Use modular Zustand stores (`useDocumentStore`, `useRedactionStore`, `useLicenseStore`).
* Use **Normalized Coordinates (0.0 to 1.0)** for all bounding boxes to prevent screen drift across zoom levels and DPIs.

---

## 3. Product & Feature Architecture

### Redaction Customization Engine
Users must have full control over the visual appearance and behavior of redactions:
1. **Style Presets**:
   - **Solid Blackout** (`#000000` / `#111111` - standard compliance box).
   - **Custom Color** (Charcoal `#27272a`, White-out `#ffffff`, Navy `#1e293b`, Warning `#dc2626`).
   - **Custom Text Labels**: Embedded label centered inside the box (e.g., `[REDACTED]`, `[CONFIDENTIAL]`, `[PII MASKED]`, `[AADHAAR MASKED]`, or custom user text).
   - **Masking Mode**: Full blackout vs. Character-level asterisks (`j***@example.com`, `XXXX-XXXX-1234`).

### Pro vs. Free Tier Gating (Aggressive Monetization Hook)
Redactify is **NOT** a free charity utility; the free tier is strictly a **trial hook** to demonstrate instant value and force the upgrade:

| Capability | Free Tier (Trial / Testing) | Pro Tier (Paid Subscription) |
| :--- | :--- | :--- |
| **Document Upload & AI Scan** | Unlimited preview & entity inspection | Unlimited preview & entity inspection |
| **Manual Box Tool** | Fully functional in editor | Fully functional in editor |
| **Document Export** | **Page 1 only** + Top/Bottom Watermark (*"Trial: Redacted with Redactify"*)| **Unlimited Pages**, 100% Clean Vector Export (Zero Watermarks) |
| **Batch Folder Processing** | Locked (1 file at a time) | **Unlocked** (Drop 20+ files at once $\rightarrow$ ZIP export) |
| **Custom Redaction Styles** | Basic Blackout only | **Full Color Palette + Custom Text Labels** |
| **Compliance Presets** | General PII only | **Aadhaar/PAN KYC, Legal, Financial & HIPAA Presets** |
| **Custom Regex / Keyword DB** | 1 custom rule max | **Unlimited custom rules & company templates** |

---

## 4. Technology Stack & Unit Economics

* **Frontend & Hosting**: Cloudflare Pages (100% Free Commercial use, unlimited bandwidth).
* **Database**: Turso (libSQL) / Cloudflare D1 (Never pauses, 9GB storage, $0).
* **Payments**:
  - **India**: Razorpay (UPI, RuPay, domestic cards) in INR (₹).
  - **Global**: Dodo Payments (MoR for USD, payouts directly to Indian HDFC account).
* **Pricing**:
  - **Global**: $9/month or $69/year.
  - **India**: ₹499/month or ₹3,499/year (with ₹999 early-bird lifetime pass for first 100 buyers).

---

## 5. Decision Checkpoints
Before introducing any new external dependency, payment provider change, or database schema modification, confirm with the founder.
