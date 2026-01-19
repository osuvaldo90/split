# Roadmap: Split

## Overview

v1.3 enhances receipt scanning to handle real-world complexity: multiple fees/taxes, handwritten tips on signed receipts, invalid image detection, and AI transparency. These 4 phases build on the existing Claude Vision OCR infrastructure.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-13 (shipped 2026-01-13)
- ✅ **v1.1 Security** - Phases 14 (shipped 2026-01-14)
- ✅ **v1.2 Test Foundation** - Phases 15-19 (shipped 2026-01-15)
- 🚧 **v1.3 Smart Receipt Scanning** - Phases 20-23 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0-v1.2 (Phases 1-19) - SHIPPED</summary>

See archived milestone documentation for details.

</details>

### 🚧 v1.3 Smart Receipt Scanning (In Progress)

**Milestone Goal:** Improve receipt OCR to handle real-world complexity — multiple fees/taxes, handwritten tips, and invalid images.

- [x] **Phase 20: Image Validation** - Detect non-receipt images with retry
- [x] **Phase 21: Multiple Fees/Taxes** - LLM classification of tax types
- [ ] **Phase 22: Handwritten Tip Detection** - Pre-fill tip from signed receipts
- [ ] **Phase 23: AI Transparency** - Show disclaimer after OCR

## Phase Details

### Phase 20: Image Validation
**Goal**: Detect non-receipt images and allow retry
**Depends on**: Nothing (first v1.3 phase)
**Requirements**: OCR-03
**Success Criteria** (what must be TRUE):
  1. User uploading a non-receipt image sees an error message
  2. User can retry with a different image after error
  3. Valid receipt images continue to process normally
**Research**: Complete (20-RESEARCH.md)
**Plans**: 1 plan

Plans:
- [x] 20-01-PLAN.md — Add validation to parseReceipt with structured outputs and user-friendly error messages

### Phase 21: Multiple Fees/Taxes
**Goal**: Extract and classify multiple fees/taxes from receipts
**Depends on**: Phase 20
**Requirements**: OCR-02
**Success Criteria** (what must be TRUE):
  1. User sees multiple tax/fee line items extracted from receipt
  2. Tax types are labeled (sales tax, liquor tax, service fee, etc.)
  3. Each tax/fee is distributed proportionally to participants
  4. Totals calculate correctly with multiple fees
**Research**: Complete (21-RESEARCH.md)
**Plans**: 3 plans

Plans:
- [x] 21-01-PLAN.md — Add fees table and CRUD operations, update calculation engine
- [x] 21-02-PLAN.md — Update OCR to extract multiple fees, update UI for fees section
- [x] 21-03-PLAN.md — Fix legacy session backward compatibility for fees display (gap closure)

### Phase 22: Handwritten Tip Detection
**Goal**: Detect handwritten tip amounts and pre-fill tip field
**Depends on**: Phase 20
**Requirements**: OCR-01
**Success Criteria** (what must be TRUE):
  1. User uploading signed receipt with handwritten tip sees tip field pre-filled
  2. Pre-filled tip amount matches handwritten amount
  3. User can still manually adjust tip after pre-fill
  4. Receipts without handwritten tips work normally
**Research**: Complete (22-RESEARCH.md)
**Plans**: 1 plan

Plans:
- [ ] 22-01-PLAN.md — Extend parseReceipt for handwritten tip detection and add pre-fill logic

### Phase 23: AI Transparency
**Goal**: Show AI disclaimer after OCR processing
**Depends on**: Phase 20
**Requirements**: OCR-04
**Success Criteria** (what must be TRUE):
  1. User sees disclaimer after OCR scan completes
  2. Disclaimer indicates AI was used for extraction
  3. User can dismiss disclaimer and continue
**Research**: Unlikely (simple UI component)
**Plans**: TBD

Plans:
- [ ] 23-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 20 → 21 → 22 → 23

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 20. Image Validation | 1/1 | Complete | 2026-01-16 |
| 21. Multiple Fees/Taxes | 3/3 | Complete | 2026-01-19 |
| 22. Handwritten Tip Detection | 0/1 | Planned | - |
| 23. AI Transparency | 0/TBD | Not started | - |
