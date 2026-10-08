# Core Sprint 01 handoff

Branch/worktree: agent/core, /Users/thanhdanh/Nep-Remix-core.
Contract was committed before runtime changes: c838ee1, see SPRINT-01-CONTRACT.md.

## Implemented

Shared room/side/prerequisite/ownership guard and exact-set evaluator for submit/use; inaccessible pickup/hints rejected; solve/skip rejected. Area transitions require adjacency and explicit unlock or exit gate. No automatic unlocking of every exit.

Ordered, deduplicated dialogue queue; acknowledgement grants current-node clues and promotes queued dialogue. Persistent typed puzzle drafts, close/reopen/reset and session close on successful solve. Ending acknowledgement required for chapter completion.

Atomic complete catalog reward grants with reward.id ledger; separate unlocked cards. Legacy save-v1 repairs gifts without adding Sen and preserves all history snapshots. Restore reports status/reason, saves retain original migration bytes in backup and refuse corrupt overwrite. Replay helper creates a separate practice tree; store refuses to autosave it. History travel cannot cross claimed chapter reward markers.

C1 hints now match the existing answer: tay chẽn + khăn đen + guốc; color not scored. No C2–C5 content edits.

## Pending decisions / integration

team-sprint-01.md explicitly requires approved decisions before dependent code. No answer to the approval question was received during this task. New C1 gates (read both papers before S3; contract → letter → Cầm speech → styling), revised narrative/box wording, and loan wardrobe remain pending. Generic Gate support is available, but these proposals are not attached to chapter content. Existing unlocked area IDs and current content remain compatible.

Frontend should consume the contract: updateDraft/resetDraft, dialogueQueue, unlockedCardIds, restore status and saveGame boolean. Acknowledge current nodes before expecting clues. Use createChapterReplayTree with a separately retained main tree; old chapter/replay now rejects. No event or animation should grant gifts. The replay helper and irreversible reward history behavior need Leader review alongside the pending UX decision.

Tester owns scripts/check-game.ts and must update its obsolete first-node clue assertion at line 24 (and subsequent expectations to the queue acknowledgement flow). Full test:core is currently FAIL at that assertion; this is not reported as a full-suite pass.

## Validation

- `./node_modules/.bin/tsx --test src/core/sprint-01.test.ts`: PASS 14/14. Includes fresh Mở đầu/C1 without injected items, exact 150 Sen (100 → 250), complete catalogs, one ruler, reload pending claim, queue reload, malformed payload, incorrect exact sets, drafts, migration, invalid save/blocked storage, isolated reward history, gate references/cycles and session closing.
- `./node_modules/.bin/tsx scripts/check-core.ts`: PASS 15/15 after updating Core-owned self-checks to submit actual answers and read endings.
- `npm run test:core`: FAIL in scripts/check-game.ts:24 (obsolete clue-before-read expectation), after 15/15 self-check PASS.
- `npm run lint`: PASS.
- `./node_modules/.bin/tsx scripts/validate-content.ts`: PASS, six chapters parse, report valid=true.
- `npm run build`: PASS; existing >500 kB chunk warning.
- `npm run test:assets`: PASS with local preview on 4173: 139 PNGs decoded at original dimensions; script reports mobile room overflow/console checks passing.
- `npm audit --offline`: 0 vulnerabilities in available local advisory/cache data; no online advisory verification.
- `git diff --check`: PASS.
- Browser story suite, Safari/device QA, and numerical coverage measurement were not run. Asset browser checks are not full W0/W1 UI acceptance.

RED evidence: c838ee1 reproduced five failures before implementation; d8ccda8 preserved draft/history RED; 9f48355 preserved remote pickup RED; 7668423 preserved gate/queue validation RED; 7cca0c3 preserved matching-session RED. Each was rerun GREEN before handoff.

## Changed files

- src/content/chapters/c1.json
- src/content/schema.ts
- src/core/SPRINT-01-CONTRACT.md
- src/core/SPRINT-01-REPORT.md
- src/core/commands/journey/area-commands.ts
- src/core/commands/journey/chapter-commands.ts
- src/core/commands/journey/dialogue-commands.ts
- src/core/commands/journey/dialogue-queue.ts
- src/core/commands/journey/draft-commands.ts
- src/core/commands/journey/gate.ts
- src/core/commands/journey/index.ts
- src/core/commands/journey/interact-command.ts
- src/core/commands/journey/item-commands.ts
- src/core/commands/journey/puzzle-commands.ts
- src/core/commands/journey/puzzle-solution.ts
- src/core/commands/journey/reward-commands.ts
- src/core/commands/museum/museum-commands.ts
- src/core/history/chapter-replay.ts
- src/core/history/history-tree.ts
- src/core/history/index.ts
- src/core/history/scoped-session.ts
- src/core/history/serialize.ts
- src/core/invariants.ts
- src/core/registry.ts
- src/core/self-check.ts
- src/core/sprint-01.test.ts
- src/core/state.ts
- src/game/store.ts
