# Requirements: Split v1.3

**Defined:** 2026-01-16
**Core Value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser

## v1.3 Requirements

Requirements for Smart Receipt Scanning release. Each maps to roadmap phases.

### OCR Enhancement

- [ ] **OCR-01**: User sees handwritten tip amount detected from signed receipt and pre-filled in tip field
- [x] **OCR-02**: User sees multiple fees/taxes extracted and classified (sales tax, liquor tax, service fees)
- [x] **OCR-03**: User sees error with retry option when non-receipt image is uploaded
- [ ] **OCR-04**: User sees AI disclaimer after OCR scan completes

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Host Controls

- **HOST-01**: Host can remove users from session

### Sharing

- **SHARE-01**: Bill ID tap opens native share sheet

### Navigation

- **NAV-01**: Bottom tabs with route-based navigation

### Onboarding

- **ONBOARD-01**: First-time user getting started tutorial

### Upload Handling

- **UPLOAD-01**: Handle oversized receipt images

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Payment processing | Just show who owes what — v1 decision |
| User accounts | Anonymous sessions only — v1 decision |
| Offline functionality | Requires internet throughout |
| Receipt item auto-categorization | Focus on extraction accuracy first |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OCR-01 | Phase 22 | Pending |
| OCR-02 | Phase 21 | Complete |
| OCR-03 | Phase 20 | Complete |
| OCR-04 | Phase 23 | Pending |

**Coverage:**
- v1.3 requirements: 4 total
- Mapped to phases: 4 ✓
- Unmapped: 0

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-01-17 after Phase 21 completion*
