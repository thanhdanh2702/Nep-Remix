# Remaining Sprint 01 — Core report, 07/10/2026

## Outcome and source baseline

Initial git status was clean. Fast-forward merged main 9521d19 before edits. Source reconciliation and Leader proposals are in [SPRINT-01-PROPOSALS.md](./SPRINT-01-PROPOSALS.md); consumer contract is in [SPRINT-01-CONTRACT.md](./SPRINT-01-CONTRACT.md).

Explicit clicks now reopen completed dialogue for reread, while automatic triggers remain deduplicated. Reread mode persists through nodes, choices and reload, never grants clues/completion/rewards and never replaces a different active unread dialogue. Existing active copies resume. Migration of removed nodes retains mode; old save-v1 pending paper queues reconstruct without prereading clues.

Replay audit confirms isolated main/practice snapshots, pending main claim preservation, practice target reward denial and no practice autosave after completion/prune/reload. Frontend API/lifecycle and the scope of ephemeral practice side modes are documented for Leader review. No replay UX or reward system redesign was added.

Loan wardrobe and reset-save APIs are proposals only. C1 gate/content checklist is prepared but not attached: decisions.md contains no corresponding approval. No change to schema/content JSON, UI, store runtime, Tester tests/scripts, user config or C2–C5.

## TDD evidence and commit groups

| Checkpoint | Evidence |
| --- | --- |
| 24a8a30 | RED: 4/5 reread tests failed on main 9521d19; active-node resume control passed. Contract recorded before runtime changes. |
| bb8bb12 | GREEN: 21/21 Core/integration tests and typecheck passed after distinguishing interaction vs trigger. |
| ab27df0 | RED: changed-node migration lost reread mode; replay audit 2/2 passed without runtime changes. |
| 8e464f2 | GREEN: mode preservation fix; 24/24 regressions, typecheck and test:core passed. |
| Final handoff commit | Add legacy paper migration/broken-link guard audit tests, Leader proposals and this report; final 26/26 and browser reread PASS. |

## Actual checks

- `node --import tsx --test src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts`: PASS 24/24 before final two audit tests. The coverage command below ran all final 26 tests, PASS 26/26.
- `npm run test:core`: PASS all 15 self-checks and check-game walkthrough/guards/reward/queue/save checks. Earlier report of obsolete assertion failure is superseded by main integration.
- `npm run lint`: PASS after all runtime and test changes.
- `node --import tsx scripts/validate-content.ts`: PASS valid=true; all six existing chapter schemas parse. No later chapter was implemented or enabled.
- `npm run build`: PASS after sandbox retry (Vite dependency cache write); existing chunk >500 kB warning remains.
- `npm audit --offline`: 0 vulnerabilities in locally available advisory/cache data; not an online advisory verification.
- `QA_BASE_URL=http://127.0.0.1:3017 ./node_modules/.bin/playwright test tests/browser/game.spec.ts -g 'with motion An walks'`: PASS 1/1. Ran Chrome against this worktree's production build using `PORT=3017 NODE_ENV=production node server.mjs`, not reuseExistingServer on Leader's port. This existing browser case closes the mirror dialogue and clicks it again. No test/UI source modified.
- `git diff --check`: PASS.

Coverage command actually run:

```sh
node --import tsx --experimental-test-coverage \
  --test-coverage-include='src/core/commands/journey/dialogue-*.ts' \
  --test-coverage-include='src/core/commands/journey/interact-command.ts' \
  --test-coverage-include='src/core/history/chapter-replay.ts' \
  --test-coverage-include='src/core/history/serialize.ts' \
  --test src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts \
  src/core/sprint-01.test.ts tests/leader-core-integration.test.ts
```

PASS 26/26. Selected file totals: lines 85.65%, branches 80.69%, functions 83.33%. Dialogue queue and serialize each 100% lines; dialogue commands 97.14%; replay helper 100%; existing interact-command 74.25%. This measures the selected changed/audited runtime files, not global application coverage.

No full browser suite, Safari/device matrix, new W1 gates, loan wardrobe fixture or approved reset implementation was tested. No asset changes, no new asset acceptance claim. Proposal implementation awaits review, not a failing runtime test.

## Files changed from integrated baseline

- src/core/SPRINT-01-CONTRACT.md — additive implemented reread contract and proposal link.
- src/core/SPRINT-01-PROPOSALS.md — source differences, loan contract, replay lifecycle, reset/backup proposal, C1 gate/content checklist and approval points.
- src/core/SPRINT-01-FOLLOWUP-REPORT.md — this evidence report.
- src/core/state.ts — optional reread mode, compatible with old snapshots.
- src/core/commands/journey/dialogue-queue.ts — distinguish automatic triggers and explicit interaction.
- src/core/commands/journey/interact-command.ts — request explicit reread and reject interruption of another active dialogue.
- src/core/commands/journey/dialogue-commands.ts — nonprogressing reread acknowledgement/choices.
- src/core/history/serialize.ts — retain mode when migrating a changed node.
- src/core/dialogue-reread.test.ts — 8 regression/audit cases.
- src/core/replay-audit.test.ts — 2 practice isolation/walkthrough audits.

## Leader handoff before consumer changes

Review the proposals and reconcile with Frontend/Tester before they implement loan/reset/context changes. Record project-owner approval of C1 gates, speech, brief/loan, box/culture wording and legacy-save treatment in decisions.md before Core attaches them. Review replay UX and side-mode restriction policy; Frontend must keep main/practice trees separate and avoid treating practice save refusal as storage failure. Existing interact payloads need no consumer change for the reread fix.
