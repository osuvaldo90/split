# Pitfalls Research

**Domain:** Real-time collaborative web app testing (Convex + React bill splitting)
**Researched:** 2026-01-15
**Confidence:** MEDIUM (synthesized from official docs, community discussions, and general best practices)

## Critical Pitfalls

### Pitfall 1: Flaky Tests from Real-Time Sync Timing

**What goes wrong:**
Tests pass locally but fail randomly in CI. Multi-user collaboration tests see intermittent failures. Assertions fire before WebSocket data arrives, causing false negatives.

**Why it happens:**
- CI machines are slower than development machines, causing timing differences
- WebSocket message delivery is asynchronous with no guaranteed timing
- `useQuery` in Convex returns `undefined` during initial load, causing race conditions
- Network latency varies between test runs

**How to avoid:**
- Use Playwright's `waitForResponse` or `waitForEvent` to sync with WebSocket messages
- Avoid `waitForTimeout(5000)` — instead wait for specific UI state changes
- Use `expect` with automatic retries for fluctuating values
- Implement `useStableQuery` pattern to avoid intermediate `undefined` states
- Consider artificial delays when typing (`{ delay: 50 }`) to simulate real user behavior

**Warning signs:**
- Tests pass in debug mode (`--debug`) but fail in headless mode
- Tests pass when run individually but fail in parallel
- CI failure rate > 5% for specific tests

**Phase to address:** Test Foundation Phase 1 (Test Infrastructure Setup)

**Sources:**
- [Playwright WebSocket Testing](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs) — MEDIUM confidence
- [Convex Help My App Is Overreacting](https://stack.convex.dev/help-my-app-is-overreacting) — HIGH confidence
- [Phoenix LiveView Race Condition Issue](https://github.com/phoenixframework/phoenix_live_view/issues/2497) — MEDIUM confidence

---

### Pitfall 2: localStorage-Based Identity Leaking Between Tests

**What goes wrong:**
Tests interfere with each other because localStorage persists session identity. Parallel tests on same domain share localStorage state. One test's "host" becomes another test's participant unexpectedly.

**Why it happens:**
- localStorage is shared across all tabs/windows on same origin
- sessionStorage clears on tab close but is copied when opening new tabs
- Playwright's `storageState` captures localStorage but doesn't handle all edge cases
- Test isolation is not automatic — it requires explicit cleanup

**How to avoid:**
- Use separate browser contexts for each parallel test worker
- Clear localStorage explicitly at test setup: `page.evaluate(() => localStorage.clear())`
- Generate unique session IDs per test using timestamps or UUIDs
- Use Playwright's `storageState` to save/restore known states
- Consider unique URL paths per test (e.g., `/bill/test-${Date.now()}`)

**Warning signs:**
- Tests pass individually but fail when run in parallel
- "Already joined" errors appearing unexpectedly
- Wrong participant showing as host

**Phase to address:** Test Foundation Phase 2 (E2E Test Patterns)

**Sources:**
- [Playwright Browser Contexts Isolation](https://playwright.dev/docs/browser-contexts) — HIGH confidence
- [TestCafe Parallel localStorage Issue](https://github.com/DevExpress/testcafe/issues/2782) — MEDIUM confidence
- [Playwright Storage State Guide](https://www.browserstack.com/guide/playwright-storage-state) — HIGH confidence

---

### Pitfall 3: Multi-Client E2E Tests Racing Each Other

**What goes wrong:**
Two simulated users try to claim the same item simultaneously. One browser's action doesn't reflect in the other browser's view before assertion. Tests pass locally but fail when both browsers are on slower CI.

**Why it happens:**
- Real collaboration requires two browsers to interact with shared state
- Cypress doesn't support multiple browser instances natively
- Database writes and WebSocket broadcasts have propagation delay
- Tests don't wait for real-time sync to complete before asserting

**How to avoid:**
- Use Playwright (supports multi-tab, multi-browser natively)
- For Cypress, run separate test files in parallel processes
- Wait for UI confirmation in BOTH browsers before next action
- Use room-specific URLs with unique identifiers: `Date.now()` or `uuid`
- Consider Liveblocks' approach: Puppeteer with Jest for multi-browser coordination

**Warning signs:**
- "Element not found" only in multi-user scenarios
- State inconsistency between two test browsers
- Tests requiring "retry" annotations to pass

**Phase to address:** Test Foundation Phase 2 (E2E Test Patterns)

**Sources:**
- [Liveblocks E2E Testing with Puppeteer](https://liveblocks.io/blog/e2e-tests-with-puppeteer-and-jest-for-multiplayer-apps) — HIGH confidence
- [Cypress Multi-Browser Workaround](https://github.com/cypress-io/cypress-example-recipes/issues/213) — MEDIUM confidence
- [Playwright Multi-User Testing](https://playwright.dev/) — HIGH confidence

---

### Pitfall 4: convex-test Mock Doesn't Match Production Behavior

**What goes wrong:**
Tests pass with convex-test but fail in production. Code relies on error message content that differs between mock and real backend. Size/time limits not enforced in tests.

**Why it happens:**
- convex-test is a JavaScript mock, not the real Convex runtime
- Mock uses Vercel Edge Runtime, production uses Convex runtime
- No enforcement of size limits, time limits, or document ID formats
- Text search returns all matches without relevance sorting
- Vector search uses basic cosine similarity without efficient indexing

**How to avoid:**
- Always manually test new code against real backend before merge
- Don't rely on specific error message content in product logic
- Don't assume document/storage ID formats are stable
- Use local open-source backend for integration tests when mock isn't sufficient
- Test scheduled functions with Vitest fake timers + `t.finishInProgressScheduledFunctions`

**Warning signs:**
- Tests pass but manual testing reveals issues
- Error handling code works in tests, breaks in production
- Performance acceptable in tests, slow in production

**Phase to address:** Test Foundation Phase 1 (Test Infrastructure Setup)

**Sources:**
- [Convex Test Documentation](https://docs.convex.dev/testing/convex-test) — HIGH confidence
- [Convex Testing Patterns](https://stack.convex.dev/testing-patterns) — HIGH confidence
- [Convex Local Backend Testing](https://stack.convex.dev/testing-with-local-oss-backend) — HIGH confidence

---

### Pitfall 5: React Component Tests Fail Without Convex Provider

**What goes wrong:**
Tests crash immediately with "Could not find Convex client! useQuery must be used in the React component tree under ConvexProvider."

**Why it happens:**
- Components using `useQuery`/`useMutation` require ConvexProvider context
- Test setup doesn't wrap components in required providers
- Mocking internal hooks (`useQueryGeneric`) is error-prone

**How to avoid:**
- Method 1: Mock `useQuery`/`useMutation` at module level with Vitest
- Method 2: Wrap components in ConvexProvider with fake client (cleaner)
- Note: `useQuery` internally calls `useQueryGeneric` — mock the right name
- Configure Vitest environments: `edge-runtime` for Convex, `jsdom` for React

**Warning signs:**
- "ConvexProvider not found" errors in test output
- Mocked functions not being called
- `undefined` values when expecting data

**Phase to address:** Test Foundation Phase 3 (Component Testing)

**Sources:**
- [Testing React Components with Convex](https://stack.convex.dev/testing-react-components-with-convex) — HIGH confidence
- [Convex Discord Discussion](https://discord-questions.convex.dev/m/1312238594672300133) — MEDIUM confidence

---

### Pitfall 6: Testing Auth Without Testing Authorization Boundaries

**What goes wrong:**
Tests verify "happy path" login works but don't verify unauthorized access is blocked. Security vulnerabilities ship because tests only check "can authorized user do X" not "can UNauthorized user NOT do X".

**Why it happens:**
- E2E auth tests focus on login flow, not access control
- Mutation tests don't verify rejection for wrong participants
- Host-only actions aren't tested with non-host users

**How to avoid:**
- For each mutation, test: authorized success AND unauthorized rejection
- Test session participant checks: user not in session should fail
- Test host-only actions: non-host participant should fail
- Use separate browser contexts for different user roles
- Integration tests for guards: one E2E happy path + one negative scenario

**Warning signs:**
- No tests for 403/401 responses
- Security review finds authorization gaps
- Tests only cover success cases

**Phase to address:** Test Foundation Phase 2 (E2E Test Patterns)

**Sources:**
- [NestJS Guard Testing](https://dev.to/thiagomini/how-to-test-nestjs-guards-55ma) — MEDIUM confidence
- [Playwright Auth Testing](https://dev.to/a-dev/testing-with-playwright-how-to-make-authorization-less-painful-and-more-readable-3344) — MEDIUM confidence

---

### Pitfall 7: Optimistic Updates Masking Real Failures

**What goes wrong:**
UI shows success immediately (optimistic update) but backend mutation fails. Tests check UI state, not actual database state. User sees item claimed, refreshes, item is unclaimed.

**Why it happens:**
- Optimistic updates update UI before server confirms
- Tests assert on UI state, assuming backend succeeded
- Rollback logic not tested for failure scenarios
- Network errors during tests go unnoticed

**How to avoid:**
- Assert on both UI state AND query data after mutations
- Test failure scenarios: what happens when mutation fails?
- Verify rollback: optimistically updated UI should revert on failure
- Don't use optimistic updates for high-stakes operations (financial)
- Ensure tests wait for backend confirmation, not just UI update

**Warning signs:**
- UI tests pass but manual testing shows data inconsistency
- "Works on refresh" complaints from users
- No tests for mutation failure scenarios

**Phase to address:** Test Foundation Phase 2 (E2E Test Patterns)

**Sources:**
- [Solving Eventual Consistency in Frontend](https://blog.logrocket.com/solving-eventual-consistency-frontend/) — MEDIUM confidence
- [SWR Update Conflicts Discussion](https://github.com/vercel/swr/discussions/479) — MEDIUM confidence

---

### Pitfall 8: File Upload Tests Hitting Real Services

**What goes wrong:**
E2E tests upload real images to production storage. Tests are slow waiting for actual file processing. API rate limits hit during test runs. Test files accumulate in storage.

**Why it happens:**
- File upload tests use `setInputFiles` with real files
- No mocking of storage upload URLs or OCR API
- Receipt processing calls real Claude Vision API
- Storage cleanup not implemented in test teardown

**How to avoid:**
- Mock the upload URL endpoint with `page.route()`
- Use pre-processed receipt data in fixtures instead of real OCR
- Create files from buffers for small test payloads
- Implement storage cleanup in test teardown
- Mock external services (Claude API) at network level

**Warning signs:**
- Tests slow (> 10s for upload tests)
- API rate limit errors in CI
- Storage costs increasing from test files
- Flaky tests due to external service availability

**Phase to address:** Test Foundation Phase 2 (E2E Test Patterns)

**Sources:**
- [Playwright File Upload Guide](https://www.checklyhq.com/docs/learn/playwright/testing-file-uploads/) — HIGH confidence
- [Playwright API Mocking](https://dev.to/playwright/api-mocking-for-your-playwright-tests-47ah) — HIGH confidence

---

### Pitfall 9: Cron Jobs and Scheduled Functions Not Testable

**What goes wrong:**
Tests can't verify scheduled cleanup jobs work. Cron behavior in local backend differs from production. No way to "fast forward time" to test scheduled mutations.

**Why it happens:**
- convex-test has no cron support — must trigger manually
- Local backend runs crons in real-time (can't skip ahead)
- Scheduled functions require fake timers + explicit completion

**How to avoid:**
- Use Vitest fake timers: `vi.useFakeTimers()` + `vi.advanceTimersByTime()`
- Call `t.finishInProgressScheduledFunctions()` to complete scheduled work
- For crons, trigger the underlying function directly in tests
- Set `IS_TEST` environment variable to disable crons in local backend
- Extract cron logic to testable functions, test those directly

**Warning signs:**
- No tests for cleanup/maintenance jobs
- Scheduled notifications not tested
- Time-based logic untested

**Phase to address:** Test Foundation Phase 1 (Test Infrastructure Setup)

**Sources:**
- [Convex Test Scheduled Functions](https://docs.convex.dev/testing/convex-test) — HIGH confidence
- [Convex Local Backend Testing](https://stack.convex.dev/testing-with-local-oss-backend) — HIGH confidence

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `waitForTimeout(5000)` | Quick fix for timing | Slow, flaky tests | Never — use proper waits |
| Skipping auth tests | Faster test writing | Security vulnerabilities | Never for mutations |
| Testing only happy path | 50% less test code | Bugs in error handling | MVP only, add negative cases before v1.0 |
| No test isolation | Simpler setup | Parallel tests fail | Single-threaded CI only |
| Real API calls in tests | No mocking work | Slow, rate-limited, expensive | Local dev, not CI |
| Shared test users | Less fixture code | Parallel conflicts | When tests truly independent |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Convex useQuery | Asserting before data loads | Wait for truthy value or use loading state |
| Convex mutations | Not testing rejection cases | Test both success AND auth failure |
| localStorage sessions | Not isolating between tests | Clear storage in test setup |
| File upload | Using real storage | Mock upload URL response |
| Claude Vision OCR | Calling real API | Mock with fixture data |
| WebSocket sync | Asserting before broadcast | Wait for UI update in both browsers |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Real API calls | Tests > 10s each | Mock external services | Immediately in CI |
| No parallel tests | CI takes 30+ min | Proper test isolation | 50+ test cases |
| Redundant login flows | 5s per test for auth | Use storageState | 20+ authenticated tests |
| Full page reloads | Tests slow, flaky | Navigate only when needed | Complex test suites |
| No test cleanup | Tests accumulate data | Teardown handlers | After 100+ runs |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Only testing "user can do X" | Unauthorized access ships | Test "user CANNOT do Y" too |
| Trusting client session identity | Session impersonation | Verify server-side in mutation |
| Not testing cross-session access | User A accesses User B's bill | Test with wrong session token |
| Skipping host-only enforcement | Any participant can modify tax | Test non-host rejection |
| Assuming localStorage is secure | Session hijacking | Use httpOnly cookies for sensitive data |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Testing only fast networks | Real users see loading states | Test with throttled network |
| Ignoring reconnection flows | Users lose sync after brief disconnect | Test WebSocket reconnection |
| Not testing mobile viewports | UI broken on phones | Run tests in mobile viewport |
| Skipping error states | Users see blank screens on failure | Test error boundaries |
| Testing single user only | Multi-user conflicts | Test concurrent user actions |

## "Looks Done But Isn't" Checklist

- [ ] **Multi-user sync:** Tests show data in both browsers — but did you wait for real-time sync?
- [ ] **Auth tests:** Login works — but can unauthorized users access protected routes?
- [ ] **File upload:** Upload succeeds — but what if file is corrupt? Too large? Wrong type?
- [ ] **Offline handling:** App works — but what happens when WebSocket disconnects?
- [ ] **Session persistence:** localStorage saves — but does it survive browser restart?
- [ ] **Error recovery:** Mutation fails — does UI rollback correctly?
- [ ] **Concurrent edits:** Two users edit — does last-write-wins or conflict resolution work?
- [ ] **Mobile gestures:** Click works — but what about touch, swipe, long-press?

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Flaky tests | MEDIUM | Add retry annotations temporarily, then fix root cause with proper waits |
| Missing auth tests | MEDIUM | Add authorization boundary tests, review for shipped vulnerabilities |
| Shared test state | HIGH | Refactor all tests for isolation, may require test rewrite |
| Real API dependencies | MEDIUM | Add mocking layer, create fixtures from real responses |
| No multi-user tests | HIGH | Add Playwright multi-context tests, may find real bugs |
| convex-test gaps | LOW | Add integration tests against local backend for critical paths |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Real-time sync timing | Phase 1: Test Infrastructure | Tests don't use `waitForTimeout` |
| localStorage isolation | Phase 2: E2E Patterns | Parallel tests pass consistently |
| Multi-client races | Phase 2: E2E Patterns | Two-browser tests exist and pass |
| convex-test limitations | Phase 1: Test Infrastructure | Integration tests supplement mocks |
| Missing ConvexProvider | Phase 3: Component Testing | Component tests run without errors |
| Auth boundary gaps | Phase 2: E2E Patterns | Negative auth tests exist |
| Optimistic update masking | Phase 2: E2E Patterns | Tests verify database state |
| Real file uploads | Phase 2: E2E Patterns | Upload endpoints are mocked |
| Untestable scheduled functions | Phase 1: Test Infrastructure | Fake timers configured |

## Sources

**Official Documentation:**
- [Convex Testing Overview](https://docs.convex.dev/testing) — HIGH confidence
- [convex-test Documentation](https://docs.convex.dev/testing/convex-test) — HIGH confidence
- [Playwright Authentication](https://playwright.dev/docs/auth) — HIGH confidence
- [Playwright Browser Contexts](https://playwright.dev/docs/browser-contexts) — HIGH confidence

**Community Discussions & Blog Posts:**
- [Testing React Components with Convex](https://stack.convex.dev/testing-react-components-with-convex) — HIGH confidence
- [Convex Testing Patterns](https://stack.convex.dev/testing-patterns) — HIGH confidence
- [Liveblocks E2E Testing](https://liveblocks.io/blog/e2e-tests-with-puppeteer-and-jest-for-multiplayer-apps) — HIGH confidence
- [Convex Discord Testing Discussion](https://discord-questions.convex.dev/m/1312238594672300133) — MEDIUM confidence

**Best Practice Guides:**
- [WebSocket Testing Essentials](https://www.thegreenreport.blog/articles/websocket-testing-essentials-strategies-and-code-for-real-time-apps/websocket-testing-essentials-strategies-and-code-for-real-time-apps.html) — MEDIUM confidence
- [Playwright WebSocket Testing](https://dzone.com/articles/playwright-for-real-time-applications-testing-webs) — MEDIUM confidence
- [Testing Auth with Playwright](https://dev.to/a-dev/testing-with-playwright-how-to-make-authorization-less-painful-and-more-readable-3344) — MEDIUM confidence

**Experienced Developer Warnings:**
- [Convex Help My App Is Overreacting](https://stack.convex.dev/help-my-app-is-overreacting) — HIGH confidence (useQuery undefined states)
- [Phoenix LiveView Race Conditions](https://github.com/phoenixframework/phoenix_live_view/issues/2497) — MEDIUM confidence (timing issues pattern)
- [Solving Eventual Consistency](https://blog.logrocket.com/solving-eventual-consistency-frontend/) — MEDIUM confidence (optimistic updates)

---
*Pitfalls research for: Real-time collaborative web app testing*
*Researched: 2026-01-15*
