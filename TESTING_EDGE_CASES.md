# Redactify V2: Comprehensive Edge-Case & Quality Assurance Matrix

This document tracks all critical edge cases, verification scenarios, and acceptance criteria required for true enterprise-grade document redaction.

---

## 1. Edge-Case Test Categories

### A. PDF Parsing & Export Geometry
- [x] **Rotation Synchronization:**
  - PDF rotated 90 degrees clockwise displays correctly and exports with redactions mapped to rotated text.
  - PDF rotated 180 and 270 degrees exports without coordinate skew.
  - Manual box drawn on rotated canvas exports to the exact visual location on the final document.
- [x] **Text Stream Scrubbing Integrity:**
  - Content streams containing multiple text operators (`Tj`, `TJ`) scrub target strings without destroying non-redacted text.
  - PDFs with single monolithic `BT...ET` text blocks do NOT have unaffected content blanked out.
  - Preserves vector text selection for unredacted words while guaranteeing ghost text elimination.
- [x] **Multi-Page Boundaries:**
  - Free tier exports page 1 cleanly with clear trial notice.
  - Pro tier exports multi-page documents without heap overflow or worker timeout.

### B. Optical Character Recognition (OCR) & Image Processing
- [x] **Multi-Word Phrase Matching:**
  - Full names (e.g. "Alexander Vance") only redact when the full phrase or sequence appears, avoiding isolated blackouts on unrelated words like "Alexander" or "Vance".
  - Multi-part numbers (e.g. Aadhaar "2184 4289 8716") only redact matching contiguous 12-digit clusters, never random 4-digit numbers.
- [x] **Image Orientation:**
  - Images photographed sideways (90° / 270°) rotate smoothly in the viewer.
  - Exported redacted image retains the user's chosen rotation angle and keeps blackout boxes perfectly aligned.
- [x] **Clean Offscreen Cleanup:**
  - Tesseract worker terminates cleanly after scan (`worker.terminate()`).
  - Canvas dimensions reset (`width=0, height=0`) to prevent V8 GPU buffer leaks.

### C. Microsoft Word (DOCX) & Plain Text
- [x] **Visual Preview in Studio:**
  - DOCX and TXT files render detected sensitive entities with clear, interactive highlight badges.
  - Users can click any highlighted word in the viewer to toggle redaction on or off.
- [x] **Text-Selection Redaction:**
  - Users can select any text phrase to add an instant custom redaction via the floating `+ Redact` tooltip.
- [x] **XML Entity Escaping:**
  - Text containing `&`, `<`, `>`, `"`, or `'` (e.g. `Smith & Jones`) matches and replaces properly in DOCX OOXML.
  - Multi-run splitting (`<w:t>Sakthi</w:t><w:t>vel E</w:t>`) remains format-preserving without corrupting the Word document package.
- [x] **Header, Footer & Metadata Scrubbing:**
  - Author, company, and email identifiers are sanitized from `docProps/core.xml` and `docProps/app.xml`.

### D. User Interface, Experience & Content Clarity
- [x] **Human-First Language:**
  - Zero dense academic jargon ("isomorphic stream scrubbing", "dihedral permutation table").
  - Clear, punchy explanations that any business user, lawyer, or accountant understands immediately.
  - **Zero em dashes (long dash character or double hyphens used as em dash)** across the entire application interface.
- [x] **Reactive Presets:**
  - Changing the preset dropdown in the Entity Inspector immediately filters or updates the document's active redactions without requiring a reload.
- [x] **Non-AI Aesthetic:**
  - Modern, bespoke typography and clean layout.
  - No generic corporate filler copy or robotic explanations.
- [x] **Honest Licensing & Demo Flow:**
  - No fake cryptographic claims.
  - Pro modal provides a direct "1-Click Test Pass" button for development/testing alongside straightforward upgrade instructions.
  - Saved licenses validate properly on application reload.

---

## 2. Execution Log & Verification Results

| # | Edge Case / Feature | Automated Test | Manual / Visual Test | Status |
|---|---|---|---|---|
| 1 | Em Dash Removal Across App | Grep & Unit test (`engine.test.js`) | Code & UI inspection | PASSED (0 found) |
| 2 | PDF Rotation Coordinate Symmetry | Unit test: 90°, 180°, 270° mapping | Canvas export check | PASSED (100% match) |
| 3 | Safe PDF Stream Scrubbing | Unit test (`pdftotext` stream check) | Multi-block PDF export | PASSED (Ghost text deleted) |
| 4 | OCR Phrase vs Token Collision | Unit test: contiguous word sequences | Alexander Vance / Aadhaar test | PASSED (Zero false matches) |
| 5 | DOCX Interactive Inline Preview | Unit test & React interactive elements | Word doc text click-to-toggle | PASSED (Active & tested) |
| 6 | DOCX XML Entity Handling (`&amp;`) | Unit test: `Smith & Jones`, `AT&T` | OOXML XML validation | PASSED (Preserved XML) |
| 7 | Reactive Preset Switching | Unit test: preset filter toggling | Inspector dropdown live update | PASSED (Instant update) |
| 8 | Licensing Key Persistence | Unit test: valid/tampered key check | Page reload validation | PASSED (Instant test key) |
