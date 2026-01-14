# Roadmap: Split

## Overview

Build a mobile-first real-time bill splitting web app from foundation through polish. Start with project setup, integrate OCR for receipt capture, establish real-time sync infrastructure, implement collaborative item claiming, build calculation logic for tax/tip distribution, and refine the mobile UX for seamless restaurant use.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project setup, build tooling, base architecture
- [x] **Phase 2: Receipt Processing** - Camera capture, file upload, OCR integration
- [x] **Phase 2.1: Receipt Fixes** - Bug fixes and improvements before session management (INSERTED)
- [x] **Phase 3: Session Management** - Code generation, QR codes, session creation/joining
- [ ] **Phase 4: Real-Time Sync** - WebSocket/real-time infrastructure for live updates
- [ ] **Phase 5: Item Management** - Claim/unclaim items, edit line items, split handling
- [ ] **Phase 6: Calculation Engine** - Tax distribution, tip calculation, per-person totals
- [ ] **Phase 7: Summary & Display** - Final totals screen, unclaimed warnings, receipt view
- [ ] **Phase 8: Polish & Optimization** - Mobile UX refinement, edge cases, performance

## Phase Details

### Phase 1: Foundation
**Goal**: Establish project structure, build tooling, and base architecture for a mobile-first web app
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established patterns)
**Plans**: TBD

Plans:
- [x] 01-01: Project initialization and tooling setup
- [x] 01-02: Base component architecture and routing
- [x] 01-03: Data models and state management foundation

### Phase 2: Receipt Processing
**Goal**: Enable receipt capture via camera/upload and extract line items using OCR
**Depends on**: Phase 1
**Research**: Likely (OCR service selection)
**Research topics**: OCR API options (Tesseract.js vs cloud services), cost/accuracy tradeoffs, receipt-specific parsing strategies
**Plans**: TBD

Plans:
- [x] 02-01: Camera capture and file upload UI
- [x] 02-02: OCR integration and line item extraction
- [x] 02-03: Receipt parsing and error correction UI

### Phase 2.1: Receipt Fixes (INSERTED)
**Goal**: Fix bugs and improvements discovered during Phase 2 before moving to session management
**Depends on**: Phase 2
**Research**: Unlikely (bug fixes)
**Plans**: TBD

Fixes included:
- Receipt upload should replace items, not append
- Format money inputs consistently ($4.8 → $4.80)
- Split quantity items into separate lines (2 Pilsner $13 → 2x Pilsner $6.50)

Deferred to later phases:
- Auto-gratuity detection → Phase 6 (Calculation Engine)
- Item count input UX → Phase 8 (Polish)

Plans:
- [x] 02.1-01: Receipt upload replace and money formatting
- [x] 02.1-02: Quantity item splitting in OCR

### Phase 3: Session Management
**Goal**: Generate shareable codes/QR, enable session creation and joining with display names
**Depends on**: Phase 2.1
**Research**: Unlikely (standard patterns)
**Plans**: TBD

Plans:
- [x] 03-01: Session creation and code generation
- [x] 03-02: Share code display with copy functionality
- [x] 03-03: Join session flow with display name entry

### Phase 4: Real-Time Sync
**Goal**: Enhance real-time UX with session persistence, join notifications, and connection status
**Depends on**: Phase 3
**Research**: No (Convex provides real-time sync; this phase adds UX polish)
**Plans**: 3

Plans:
- [ ] 04-01: Participant session persistence (localStorage auto-rejoin)
- [ ] 04-02: Join notifications and connection status indicator
- [ ] 04-03: Visual verification of real-time features

### Phase 5: Item Management
**Goal**: Enable claiming/unclaiming items with real-time updates, support shared item splitting
**Depends on**: Phase 4
**Research**: Unlikely (internal patterns from Phase 4)
**Plans**: TBD

Plans:
- [ ] 05-01: Item claiming and unclaiming
- [ ] 05-02: Shared item split handling
- [ ] 05-03: Line item editing by any participant

### Phase 6: Calculation Engine
**Goal**: Calculate per-person totals with proportional tax distribution and flexible tip options
**Depends on**: Phase 5
**Research**: Unlikely (internal logic)
**Plans**: TBD

Plans:
- [ ] 06-01: Proportional tax distribution logic
- [ ] 06-02: Tip calculation (% subtotal, % subtotal+tax, manual)
- [ ] 06-03: Per-person total aggregation

### Phase 7: Summary & Display
**Goal**: Show final totals screen, original receipt image, and unclaimed item warnings
**Depends on**: Phase 6
**Research**: Unlikely (internal UI)
**Plans**: TBD

Plans:
- [ ] 07-01: Summary screen with all participant totals
- [ ] 07-02: Original receipt image display
- [ ] 07-03: Unclaimed item warnings (non-blocking)

### Phase 8: Polish & Optimization
**Goal**: Refine mobile UX, handle edge cases, optimize performance for restaurant use
**Depends on**: Phase 7
**Research**: Unlikely (refinement of existing work)
**Plans**: TBD

Plans:
- [ ] 08-01: Mobile UX polish and responsiveness
- [ ] 08-02: Edge case handling and error states
- [ ] 08-03: Performance optimization

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-14 |
| 2. Receipt Processing | 3/3 | Complete | 2026-01-14 |
| 2.1 Receipt Fixes | 2/2 | Complete | 2026-01-14 |
| 3. Session Management | 3/3 | Complete | 2026-01-14 |
| 4. Real-Time Sync | 0/3 | Not started | - |
| 5. Item Management | 0/3 | Not started | - |
| 6. Calculation Engine | 0/3 | Not started | - |
| 7. Summary & Display | 0/3 | Not started | - |
| 8. Polish & Optimization | 0/3 | Not started | - |
