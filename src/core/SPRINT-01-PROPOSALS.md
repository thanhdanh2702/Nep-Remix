# Core → Leader: remaining Sprint 01 contracts, 07/10/2026

Status: proposals for review, **not approved runtime/content APIs**, except the implemented reread fix documented in SPRINT-01-CONTRACT.md. Consumers must wait for Leader agreement and, where required by team-sprint-01.md, decisions.md approval. No changes to UI, Tester files or C2–C5 content are included.

## Source reconciliation

Merged main 9521d19 by fast-forward from bb28282; initial worktree was clean. Read team-sprint-01.md, team-sprint-01-integration.md, SPRINT-01-CONTRACT.md and decisions.md. decisions.md still ends at #32 and contains no approval of the new C1 gates/dialogue/loan/replay/reset UX. Merge alone is not design approval.

The old Core handoff about check-game failing is superseded: main has Tester queue/clue updates and Vietnamese solved feedback. Leader has connected persistent styling drafts (including color0..color3, eventContextId, motifId) and protected inverse snapshot claim markers. Preserve these changes. Current styling selection still checks permanent ownership; loan display props do not authorize equipment. Current restart UI creates a fresh tree before calling saveGame, which refuses corrupt overwrite. Current dialogue enqueue drops completed IDs for both clicks and automatic triggers.

Implemented reread repair: same public interact/advance/choose payloads, internal enqueue source trigger/interaction, optional activeDialogue.mode='reread'. Automatic triggers ignore completed IDs; explicit completed-hotspot clicks open an idle reread. The active copy resumes rather than restarts; an active different dialogue prevents reread with a rejected command. Rereads never grant clues/completion/rewards, including when the clue is absent. Changed-node migration retains reread mode. No journal API is added.

## Proposed challenge loan wardrobe — awaiting approval

Suggested additive content field **on a styling puzzle**, never inferred from reward:

```ts
loanWardrobe?: { garmentIds: GarmentId[]; accessoryIds: AccessoryId[] }
```

C1 candidate: garmentIds=['ao-ngu-than-tay-chen']; accessoryIds=['khan-van-den','guoc-moc']. Tay thụng remains a reward, not an alternative solution. Leader/project owner must approve the brief, IDs and loan availability first.

Suggested read-only selector:

```ts
getChallengeWardrobe(state, puzzleId, content):
  | { ok: true; puzzleId; ownedGarmentIds; ownedAccessoryIds;
      loanGarmentIds; loanAccessoryIds; selectableGarmentIds; selectableAccessoryIds }
  | { ok: false; reason }
```

The selector validates current chapter, room, side, puzzle gate and unsolved styling challenge. Selectable IDs are catalog-validated unions; loan IDs are separate from owned IDs. No state/wallet mutation occurs. UI labels only selected IDs not permanently owned as borrowed.

Suggested `studio/open { initialGarmentId?, challengePuzzleId? }` binds challenge context to the active Studio session. studio/equip and studio/applyPreset must resolve allowed IDs through that context and revalidate it on every operation, including resume. Presets cannot change or invent challenge context. Merely accepting a client-provided list of allowed IDs is insufficient. Current Studio uses a local scoped session; Frontend and Core must agree how the bound context is retained alongside the persistent puzzle draft before consumer changes.

Drafts may retain borrowed ID choices across close/reload; resolving availability again is mandatory. Successful challenge commit uses puzzle/submit, not closet/saveOutfit. Saving an outfit to Closet continues to require permanent ownership. Shop purchase guards and prices read only permanent ownership; a borrowed item can still be bought normally. reward/claim continues to grant its full catalog union once, irrespective of borrowed selections. Switching chapter/room, completing or exiting the challenge invalidates loan permission; it never adds/removes permanent closet IDs.

Acceptance fixture after approval: remove all three answer pieces from permanent ownership, solve using loans without purchase, cancel/reload/resume, verify wallet/closet unchanged before claim, reject borrowed Closet save and ordinary Studio use, then claim and verify only actual reward IDs become permanent. Existing starter wardrobe makes the current C1 walkthrough insufficient evidence for loans.

## Replay helper audit and Frontend handoff — current API

```ts
createChapterReplayTree(main: HistoryTree, chapterId: ChapterId, content):
  | { ok: true; tree: HistoryTree }
  | { ok: false; reason: string }
```

In this sprint, Frontend only offers prologue/c1. The generic type remains backward compatible; no later chapters are enabled by this work. Requires main chapter status completed; pending reward claim remains claimable on the retained main tree. Creates a fresh isolated state with starter tools/wardrobe and replayOfChapter tag, no shared mutable snapshot references. The target reward.id is placed in the practice ledger; practice completion cannot claim that chapter reward. Old chapter/replay command rejects and must not be used as a reset.

Frontend retains `mainTree` and a separate `practiceTree`; commands and rendering during replay target practiceTree only. Exit restores the retained main tree, not a merge of practice inventory, currency, draft or progress. `saveGame(practiceTree)` returns false immediately without storage writes; this is intentional, not a storage-error toast. Autosave only mainTree. prune and JSON round-trip retain the replayOfChapter tag. Do not pass practice JSON through a main-save import flow or strip its tag.

Audit tests play all current C1 puzzles through the helper, finish the ending, reject reward/claim, prune/reload, and verify save refusal plus byte-for-byte main preservation. Ephemeral practice state is not a general reward-free sandbox: museum/readCard still has its normal 15-Sen behavior, and later chapter statuses may change inside that isolated tree. Frontend must restrict navigation to the selected prologue/c1 replay and never transfer practice balances. Whether practice museum/shop/other chapter navigation should be explicitly disabled requires Leader agreement; no command or reward design changes are silently introduced here. Replay UX approval remains pending under decisions #18/#23.

## Proposed explicit reset with backup — awaiting approval

No reset implementation or automatic corrupt-save replacement is added in this task. Keep existing restoreGame/status and saveGame(boolean) consumers compatible.

Proposed two-step store API:

```ts
prepareSaveReset():
  | { ok: true; confirmationToken: string; hasExistingSave: boolean; status: RestoreStatus }
  | { ok: false; reason: string }
resetSave({ confirmationToken, confirmed: true }):
  | { ok: true; tree: HistoryTree; backupKey?: string }
  | { ok: false; reason: string;
      code: 'confirmation-required' | 'save-changed' | 'backup-failed' | 'write-failed' | 'storage-unavailable' }
```

prepare reads current bytes and retains a single-use token tied to those exact bytes; it never writes. Frontend shows a confirmation describing reset and backup retention, with explicit reset/cancel buttons. reset requires the exact token, confirmed=true and unchanged existing bytes; elapsed time or an autosave failure never counts as confirmation. A changed save requires preparing/reconfirming again.

On confirmation: read storage, compare bytes, write original bytes to a unique backup key before touching SAVE_KEY, then setItem the new fresh-tree JSON. Never removeItem(SAVE_KEY) first. Unique reset backup keys must preserve earlier migration/reset backups instead of overwriting SAVE_BACKUP_KEY. Store the corrupt/future-version bytes exactly, without parsing/reserializing. If backup write fails, do not replace the save. If replacement fails, retain the original slot and backup, return an error, and do not switch UI to a successful fresh session. Only an ok:true result updates Frontend tree/ref/navigation and success message. Retry requires preparing again. Token validation is a UX/action boundary, not protection against same-origin scripts.

Pending policy decisions: backup retention/export/cleanup; UX confirmation wording; reset of valid saves as well as invalid saves; display/action after backup success but replacement failure. No credentials/user settings changes. Tests required after approval: cancel/no token/wrong token/stale token, exact corrupt bytes backed up, full storage at backup and replacement stages, blocked reads, multiple resets preserving earlier backups, and successful fresh save with 100 Sen.

## C1 content/gate change list — NOT applied

| Content location | Proposed change after decisions approval |
| --- | --- |
| S2 exitGates.yard | AND dialogueCompleted d-c1-thu-chong + d-c1-van-tu. Applies even to a legacy unlocked S3 ID. |
| p-c1-altar-cut-threads.solution | Keep both paper rewards and ordered triggers; remove immediate unlocksAreaId=S3 so reading drives forward availability. |
| p-c1-present-contract.when | Require both papers read; present ownership remains guarded in Core. Prevent bypass by legacy saves already in S3. |
| p-c1-present-letter.when | Require puzzleSolved p-c1-present-contract. |
| d-c1-giai-phong.when | Require puzzleSolved p-c1-present-letter. |
| p-c1-present-letter.solution | Proposed dialogueTriggerId=d-c1-giai-phong; first extend PresentPuzzleSchema (currently only presentedItemId). Keep existing speech hotspot for explicit reading/reread. |
| p-c1-styling-cam.when | Require dialogueCompleted d-c1-giai-phong. |
| d-c1-gate-exit.when | Require styling solved and speech completed. Core chapter/complete still checks every puzzle + ending. |
| C1 brief/loanWardrobe | Explicit tay chẽn + khăn đen + guốc; free color; add approved loan fields. No grading morality/color. |
| C1 text and related catalog descriptions/cards | Box beside column, no cutting altar objects; letter refutes impersonation rather than granting permission. Candidate speech: “Lá thư này bác lời các ông nói thay chồng tôi. Còn đi hay ở, tôi tự quyết.” Review warning/summary, hints, item/clue/card wording and provenance together. |

No ID renames, no reward amount changes, no C2–C5 edits. Legacy solved/completed/claimed markers and gifts must remain intact. Newly applied gates must not revoke earned rewards. Decide how to recover legacy in-progress players in S3 with unread papers: preserve queued evidence, provide a clear read route and backtracking. Decide whether chapter completion for legacy solved styling/ending but missing speech remains grandfathered or requires reading speech; do not silently reset progress. Test these fixtures before attaching gates. New W1 acceptance must include early/S3/reordered submission negatives, both papers, speech-before-styling, reload at every gate and unchanged claimed saves.

## Requested Leader decisions before consumers change

1. Confirm reread behavior/handoff (implemented fix, no new consumer payload).
2. Approve loan schema, bound Studio context and missing-wardrobe fixture with Frontend/Tester.
3. Approve replay UX and whether to restrict side modes in practice; keep main/practice trees separate.
4. Approve explicit reset/token/backup retention policy and assign Frontend confirmation integration.
5. Obtain project-owner decisions.md approval for C1 gates, speech, box wording/brief/culture and legacy-save behavior, then authorize Core to attach content.
