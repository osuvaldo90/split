# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** Phase 13 - Documentation

## Current Position

Phase: 13 of 13 (Documentation)
Plan: 1 of 1 (13-01 complete)
Status: COMPLETE
Last activity: 2026-01-15 — Completed 13-01-PLAN.md (Documentation)

Progress: █████████████████████ 100% (13/13 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 27
- Average duration: 3.2 min
- Total execution time: 1.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | 6 min |
| 02-receipt-processing | 3 | 8 min | 3 min |
| 02.1-receipt-fixes | 2 | 3 min | 1.5 min |
| 03-session-management | 3 | 3 min | 1 min |
| 03.1-inline-item-editing | 1 + FIX | 4 min | 2 min |
| 04-real-time-sync | 3 | 10 min | 3 min |
| 05-item-management | 2 + FIX | 8 min | 2.7 min |
| 05.1-fix-new-item-broadcast | 1 | 3 min | 3 min |
| 06-calculation-engine | 3 | 20 min | 7 min |
| 07-summary-display | 1 | 3 min | 3 min |
| 08-polish-optimization | 3 | 10 min | 3 min |
| 09-ui-ux-improvements | 1 + FIX | 5 min | 2.5 min |
| 10.2-join-bill-ui-simplification | 1 | 2 min | 2 min |
| 11-security-review | 1 | 3 min | 3 min |
| 12-security-hardening | 4 | 11 min | 3 min |
| 13-documentation | 1 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 2 min, 3 min, 2 min, 4 min, 2 min
- Trend: steady

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | TailwindCSS v4 with Vite plugin | v4 uses Vite plugin instead of PostCSS config |
| 01-02 | max-w-md (448px) container width | Mobile-first design with clean desktop view |
| 01-02 | TailwindCSS @utility for safe-area | v4 syntax for custom utility classes |
| 01-03 | Prices in cents | Avoid floating point issues |
| 01-03 | Denormalized sessionId in claims | Efficient session-scoped queries |
| 01-03 | Separate claims table | Support multiple people claiming same item |
| 02-01 | Native file input for camera | Simpler than react-webcam for basic capture |
| 02-01 | Separate camera/upload buttons | Clear user intent for each action |
| 02-02 | claude-sonnet-4-5-20250514 for OCR | Best balance of cost and accuracy |
| 02-02 | Return parse errors with raw response | Allow UI to handle gracefully, aids debugging |
| 02.1-02 | Extra cent to first item for odd price division | Consistent rounding strategy for split items |
| 03-03 | Case-insensitive name comparison | Prevent "Alice" and "alice" as duplicates |
| 03.1-01 | Remove confirm step - items save directly to DB after OCR | Eliminates host bottleneck, enables collaborative editing |
| 03.1-01 | InlineItem uses mutations directly | No callback props, component calls mutations directly |
| 03.1-FIX | Detect new items by empty name for auto-edit | Simpler than prop drilling, no API changes |
| 04-01 | Store only participantId in localStorage | Minimal footprint, verify via query |
| 04-01 | Verify stored participant before redirect | Ensure data freshness and session match |
| 04-02 | Show join toasts only for post-mount participants | Use joinedAt timestamp vs mountTime comparison |
| 04-02 | Connection lost threshold: retries > 2 | Distinguish temporary reconnect from lost connection |
| 05-01 | Blue border for claimed items, faded for unclaimed | Visual distinction for claim status |
| 05-01 | stopPropagation on edit button | Prevent edit tap from triggering claim toggle |
| 05-02 | Blue left border accent for my claims | Visual hierarchy for claim ownership |
| 05-02 | Host x buttons on claimer pills | Allow host to fix claim mistakes |
| 05-FIX | Return hostParticipantId from create mutation | Enables host claiming without separate query |
| 05.1-01 | Draft items use local React state | Prevents empty items from broadcasting to other users |
| 05.1-01 | One draft at a time | Add Item disabled when draft exists to prevent confusion |
| 06-01 | Math.floor + remainder distribution | First N claimants get extra cent for exact totals |
| 06-01 | distributeWithRemainder helper | Generic proportional distribution with exact sum |
| 06-02 | Save tax/tip on blur | Simpler than debounce for input persistence |
| 06-02 | Group total preview in settings | Immediate feedback on tax/tip changes |
| 06-03 | Preserve tip percent between percent types | Same unit (%), only reset when switching to/from manual |
| 06-03 | Expandable participant cards in Summary | Reduce visual clutter, tap to see details |
| 08-02 | Stacked vertical layout for edit mode | Consistent layout on mobile/desktop, prevents overflow |
| 08-02 | Ring animation for update flash | Ring-2 ring-blue-400 avoids bg color conflicts |
| 08-02 | Auto-decimal on blur for price input | Format $5 -> $5.00 for consistent display |
| 08-03 | User-friendly error language | Use "Bill" instead of "Session" in user-facing text |
| 08-03 | Error recovery with navigation | Provide link to home when session not found |
| 09-01 | Single "Add Receipt" button using native picker | OS handles camera vs file selection |
| 09-01 | Consistent 3-row stacked layout for edit modes | Predictable behavior across all devices |
| 09-01 | ~25% reduction in vertical spacing | Compact mobile UI while maintaining 44px touch targets |
| 09-FIX | Two explicit buttons (Take Photo / Choose Image) | Android needs capture="environment" for camera |
| 09-FIX | Grouped $ prefix inside input border | Visual cohesion in edit mode price input |
| 10-02 | Max 10 bill history entries | Keep localStorage size reasonable |
| 10-02 | Dedupe by code when adding to history | Update existing entry rather than duplicate |
| 10-01 | Gratuity stored in cents | Consistent with all other money fields |
| 10-01 | Always-visible gratuity section | Shows $0.00 by default for transparency |
| 10-01 | Gratuity distributed proportionally | Same distributeWithRemainder helper as tax |
| 10.1-01 | Phantom entry for unclaimed in distribution | Keep distributeWithRemainder generic, localize fix |
| 10.1-01 | Calculate billSubtotal separately | groupSubtotal only has claimed items |
| 10.1-02 | Expandable section for join flow on home | One-screen simplicity, reduce navigation |
| 10.1-02 | Reuse localStorage auto-rejoin logic | Preserve existing behavior from Join.tsx |
| 10.2-01 | Single name state instead of hostName/joinName | Unified form for create/join |
| 10.2-01 | Code field always visible but optional | No expandable section, reduced friction |
| 10.2-01 | Button color: blue-600 Start, blue-500 Join | Subtle visual distinction between modes |
| 11-01 | Categorized issues as intentional design vs security gaps | Helps prioritize which to fix |
| 11-01 | localStorage trust model acceptable for use case | Low-stakes bill splitting doesn't need auth |
| 11-01 | Prioritized updateName and unclaim fixes as immediate | Highest impact authorization gaps |
| 12-03 | Name limit 100 chars, item name 200 chars | Reasonable limits for user names vs menu items |
| 12-03 | Money max $100k, quantity max 999 | Practical bounds preventing DoS |
| 12-03 | Centralized validation in validation.ts | Reusable helpers for all mutations |
| 12-04 | Require sessionId for receipt URL access | Verify storageId belongs to session to prevent cross-session access |
| 12-02 | Keep updateTotals open for all participants | Any participant can upload receipt per design |
| 12-02 | Keep items.add/update open for all | Collaborative editing is intentional design |
| 12-02 | Host verification pattern | Query participant, check isHost, verify sessionId match |
| 12-01 | Keep unclaim and unclaimByHost separate | API clarity for self-unclaim vs host override |
| 12-01 | Add duplicate name check to updateName | Consistent with join mutation behavior |
| 13-01 | Concise README focused on quick start | 86 lines, no fluff |
| 13-01 | Architecture doc explains 'why' not 'what' | Patterns unique to Split, not generic concepts |

### Deferred Issues

None - auto-gratuity detection implemented in Phase 10-01.

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Receipt Fixes (URGENT) — 3 bugs moved from deferred to fix now
- Phase 3.1 inserted after Phase 3: Inline Item Editing (URGENT) — remove confirm step, collaborative editing
- Phase 5.1 inserted after Phase 5: Fix New Item Broadcast (URGENT) — hide new items from others until saved
- Phase 9 added: UI/UX Improvements — receipt upload consolidation, edit layout refinements
- Phase 10 added: Feature Enhancements — session-to-bill rename, auto-gratuity, multi-item UX, bill history
- Phase 10.1 inserted after Phase 10: Bug Fixes and UX (URGENT) — tax calculation fix, combine join bill into home
- Phase 10.2 inserted after Phase 10.1: Join Bill UI Simplification (URGENT) — single name field with auto-fill
- Phase 11 added: Security Review — comprehensive security audit
- Phase 12 added: Security Hardening — fix authorization and input validation issues from audit
- Phase 13 added: Documentation — add documentation to the project

### Pending Todos

4 todos in `.planning/todos/pending/`:
- **Allow host to remove users from session** (api)
- **Bill ID tap opens native share sheet** (ui)
- **Bottom tabs with route-based navigation** (ui)
- **First-time user getting started tutorial** (ui)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-15
Stopped at: v1.0 MVP COMPLETE
Resume file: None

## Milestone Summary

**v1.0 - Bill Splitting MVP - COMPLETE**

All 13 phases completed:
- Foundation → Receipt Processing → Session Management → Real-Time Sync
- Item Management → Calculation Engine → Summary & Display → Polish
- UI/UX Improvements → Feature Enhancements → Security Review → Security Hardening
- Documentation

**Total Plans Executed:** 31
**Total Execution Time:** ~2 hours

## Documentation

- `README.md` - Quick start guide for local development
- `docs/architecture.md` - Key patterns and design decisions
