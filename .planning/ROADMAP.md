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
- [ ] **Phase 2: Receipt Processing** - Camera capture, file upload, OCR integration
- [ ] **Phase 3: Session Management** - Code generation, QR codes, session creation/joining
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
- [ ] 02-02: OCR integration and line item extraction
- [ ] 02-03: Receipt parsing and error correction UI

### Phase 3: Session Management
**Goal**: Generate shareable codes/QR, enable session creation and joining with display names
**Depends on**: Phase 1
**Research**: Unlikely (standard patterns)
**Plans**: TBD

Plans:
- [ ] 03-01: Session creation and code generation
- [ ] 03-02: QR code generation and sharing
- [ ] 03-03: Join session flow with display name entry

### Phase 4: Real-Time Sync
**Goal**: Implement real-time synchronization so all participants see instant updates
**Depends on**: Phase 3
**Research**: Likely (real-time architecture)
**Research topics**: WebSocket vs SSE vs managed services (Supabase Realtime, Pusher, Ably), hosting implications, connection handling
**Plans**: TBD

Plans:
- [ ] 04-01: Real-time infrastructure setup
- [ ] 04-02: Session state sync implementation
- [ ] 04-03: Conflict resolution and reconnection handling

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
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-14 |
| 2. Receipt Processing | 1/3 | In progress | - |
| 3. Session Management | 0/3 | Not started | - |
| 4. Real-Time Sync | 0/3 | Not started | - |
| 5. Item Management | 0/3 | Not started | - |
| 6. Calculation Engine | 0/3 | Not started | - |
| 7. Summary & Display | 0/3 | Not started | - |
| 8. Polish & Optimization | 0/3 | Not started | - |
