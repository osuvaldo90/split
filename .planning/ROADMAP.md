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
- [x] **Phase 3.1: Inline Item Editing** - Remove confirm step, collaborative item editing (INSERTED)
- [x] **Phase 4: Real-Time Sync** - WebSocket/real-time infrastructure for live updates
- [x] **Phase 5: Item Management** - Claim/unclaim items, edit line items, split handling
- [x] **Phase 5.1: Fix New Item Broadcast** - Hide new items from others until saved (INSERTED)
- [x] **Phase 6: Calculation Engine** - Tax distribution, tip calculation, per-person totals
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

### Phase 3.1: Inline Item Editing (INSERTED)
**Goal**: Remove confirm step and enable collaborative inline item editing for all participants
**Depends on**: Phase 3
**Research**: Unlikely (UI refactoring)
**Plans**: TBD

Changes:
- Remove separate confirm step after receipt scan
- Items appear directly in session view after OCR
- Inline edit button for each item (name, price)
- "Add Item" button available for ALL users (not just host)
- Any participant can fix OCR mistakes

Plans:
- [x] 03.1-01: Remove confirm step and inline item editing

### Phase 4: Real-Time Sync
**Goal**: Enhance real-time UX with session persistence, join notifications, and connection status
**Depends on**: Phase 3.1
**Research**: No (Convex provides real-time sync; this phase adds UX polish)
**Plans**: 3

Plans:
- [x] 04-01: Participant session persistence (localStorage auto-rejoin)
- [x] 04-02: Join notifications and connection status indicator
- [x] 04-03: Visual verification of real-time features

### Phase 5: Item Management
**Goal**: Enable claiming/unclaiming items with real-time updates, support shared item splitting
**Depends on**: Phase 4
**Research**: Unlikely (internal patterns from Phase 4)
**Plans**: TBD

Plans:
- [x] 05-01: Item claiming and unclaiming
- [x] 05-02: Visual distinction and host powers

### Phase 5.1: Fix New Item Broadcast (INSERTED)
**Goal**: Hide new items from other users until saved with actual content
**Depends on**: Phase 5
**Research**: Unlikely (bug fix)
**Plans**: TBD

Problem:
- User A clicks "Add Item" → empty editable item appears
- Before User A saves, other users see the empty item in their view
- Confuses other users who see an empty item they didn't create

Solution approaches:
1. Don't create in DB until save (local-only draft)
2. Add "draft" status filtered from other users' views
3. Use optimistic UI for creator, delay mutation until save
4. Add creatorId check to only show unsaved items to creator

Plans:
- [x] 05.1-01: Fix new item broadcast

### Phase 6: Calculation Engine
**Goal**: Calculate per-person totals with proportional tax distribution and flexible tip options
**Depends on**: Phase 5.1
**Research**: Unlikely (internal logic)
**Plans**: TBD

Plans:
- [x] 06-01: Proportional tax distribution logic
- [x] 06-02: Tip calculation (% subtotal, % subtotal+tax, manual)
- [x] 06-03: Per-person total aggregation

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
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 3.1 → 4 → 5 → 5.1 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-14 |
| 2. Receipt Processing | 3/3 | Complete | 2026-01-14 |
| 2.1 Receipt Fixes | 2/2 | Complete | 2026-01-14 |
| 3. Session Management | 3/3 | Complete | 2026-01-14 |
| 3.1 Inline Item Editing | 1/1 | Complete | 2026-01-14 |
| 4. Real-Time Sync | 3/3 | Complete | 2026-01-14 |
| 5. Item Management | 2/2 | Complete | 2026-01-15 |
| 5.1 Fix New Item Broadcast | 1/1 | Complete | 2026-01-15 |
| 6. Calculation Engine | 3/3 | Complete | 2026-01-14 |
| 7. Summary & Display | 0/3 | Not started | - |
| 8. Polish & Optimization | 0/3 | Not started | - |
