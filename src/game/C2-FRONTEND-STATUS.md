# Frontend C2 — dependency gate / baseline RED

Date: 2026-10-07. Branch: `agent/frontend`.
Runtime tested: `9b2488d26755b8f63ff12555935586541532445c`.

## BLOCKED — shared Core checkpoint

`1ccf21a` exists locally on `agent/core` but is not an ancestor of Frontend
HEAD (`git merge-base --is-ancestor 1ccf21a HEAD` exits 1). The working tree
does not export `getChallengeWardrobe`, `createChallengeStudioDraft` or
`validateChallengeStudioDraft`. Their implementations and both handoffs were
inspected read-only with `git show 1ccf21a:<path>`:

- `src/core/C2-HANDOFF.md`
- `src/core/C2-GEOMETRY-HANDOFF.md`

No merge, cherry-pick, worktree, agent, Core/content change or release flag
change was performed. Leader must supply the integrated checkpoint before
Frontend imports these APIs and verifies loan/geometry/M2–M4 against them.
No runtime fix is claimed by this report. The five WIP files remain as committed
in `9b2488d`; this documentation checkpoint changes only this report.

## DONE — current baseline verification

| Command actually run | Result | Limit |
| --- | --- | --- |
| `npm run lint` | FAIL, 3 errors | Undefined `challengePuzzle` at Studio.tsx:83/86; invalid silhouette at c2-m1.test.ts:618 |
| `npm run test:core` | PASS | 15 checks plus existing prologue/C1 walkthrough; old Core baseline |
| `node --import tsx --test src/game/c2-m1.test.ts` | PASS 14/14 | WIP tests are insufficient for runtime spawn/feet/loan acceptance; tsx does not typecheck |
| `npm run build` | PASS | Vite/esbuild transpile despite type errors; JS chunk warning >500 kB; does not prove working Studio |
| `npm audit` | PASS | 0 vulnerabilities, includes dev dependencies |

## DONE — production browser reproducer (RED)

Built this checkout with `npm run build`, then served it with
`NODE_ENV=production PORT=3057 npm start` at `http://127.0.0.1:3057`.
Chrome headless via installed Playwright; new context/save per viewport;
`reducedMotion: reduce`. Entered through Vào game → Phòng phối đồ, without
seeded progress, debug grants or AI requests. Assertions waited for UI state;
no fixed sleeps or increased timeouts. Server stopped after evidence capture.

All five viewports reproduce `ReferenceError: challengePuzzle is not defined`,
show the error boundary and have zero `#paperdoll` elements. This is failure
evidence, not a passing regression suite. No HTTP >=400 responses or AI
requests were observed in these five runs. Console errors are present as expected
for the reproduced crash.

Build: `dist/assets/index-BUvVMTld.js`.
SHA-256: `ee104f14d919fbf771457ef6f298ee2a14d61d8f89894f42b2fd5d7f310c4d62`.

Evidence directory, relative to repo root:
`artifacts/c2-frontend-baseline-9b2488d/` (local ignored QA artifacts).

| Viewport | Screenshot |
| --- | --- |
| 1440×900 | `studio-error-1440x900.png` |
| 1280×720 | `studio-error-1280x720.png` |
| 390×844 | `studio-error-390x844.png` |
| 844×390 | `studio-error-844x390.png` |
| 768×1024 | `studio-error-768x1024.png` |

`browser.json` contains URL, full source SHA, viewport, exceptions, network
errors and screenshot paths. Mobile 390×844 screenshot visually inspected.
An initial browser harness attempt used an immediate visibility check and
incorrectly tried a mobile menu before navigation settled; it timed out and
was discarded. The completed run uses an awaited visibility assertion.

## NOT RUN / NOT DONE

- GREEN fix cycle, API-based challenge adapter, runtime history validation,
  persistence/reload/loan/ending/reward acceptance.
- Integrated C1/Studio regression suite and C2 happy-path walkthrough.
- Geometry corrections and real Core radius acceptance after furniture fixes.
- Normal-motion/keyboard/focus/44px matrix; browser coverage of M2–M4.
- Frontend coverage threshold measurement.

C2 remains excluded from `PLAYABLE`; no candidate/menu PASS is claimed.
Missing layer `ao-dai-tan-thoi-vang-mo-ga` remains an Art blocker. No art or
reward replacement was made. Frontend C2 is **not ready for integration**.

## Delta for Leader / Core / Tester

1. Leader: provide an integrated checkpoint containing Core `1ccf21a`, its
   content changes and handoffs on this branch, preserving Frontend WIP.
2. Frontend after checkpoint: replace globalThis/hardcoded loan fallback and
   manual resume with the three real APIs; use catalog silhouette; validate
   local history and submit; persist string answers without dispatch loops.
3. Frontend geometry: verify current spawn/arrival changes rather than rewriting
   them; add furniture-safe feet; route arrow.via and Game.exitArea through real
   walker arrival. Current exit paths still pass target.pos/opener.pos.
4. Core: recheck radii using new measured feet. Handoff reproducers currently
   place feet at S1 drawing desk `(510,546)`, S2 shelves `(627,546)` and S3 P4
   `(359,546)` on furniture. Frontend must not widen radii or bypass guards.
5. Leader: enable candidate QA only after M4 is implemented; release remains
   unchanged. Tester: run independent suite on the integrated candidate; do
   not infer browser acceptance from the 14 WIP unit tests.
