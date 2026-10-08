# C3 local demo integration — 2026-10-08

Scope: integrate Core 284e95c1d5ba75e7b82e909823f82aa7f708dbf1 and Frontend 9d507978264a9d965c94a85c684c8f11b982864e into main. Preserve unrelated README edits, review drafts, worktrees, scratch and caches. No push.

## Behavior and TDD evidence

- C3 becomes selectable after C2 completion through the normal journey menu. Core chapter status, evidence gates and reward ledger remain authoritative. C4/C5 remain unavailable. `chapter-availability.test.ts` first failed at C3 availability after completed C2, then passed; helper coverage 100% lines/branches/functions.
- Mounted reader test `node scripts/check-c3-demo-ui.mjs` first failed because two dialogs were simultaneously active. Journal now suspends its modal while the reader is open, retains selection and restores focus to the document trigger. Escape closes only the reread viewer; Tab/Shift+Tab stay in the viewer. Active reading has no generic dismiss action; only the explicit acknowledgement button advances Core. Test GREEN.
- Natural browser journey first failed because the unread receipt dialogue hotspot intercepted receipt pickup. C3 scene hotspots now respect the existing Core `isGateSatisfied` predicate. This is a display filter, not a new or weaker Core guard. C1/C2 keep their prior display behavior. The reviewed RoomScene fingerprint in Core geometry tests is updated for this isolated filter and its memo dependency; walker/geometry/entry adapter bytes are otherwise preserved. Completed C3 reread regions sort below pending actions when their art anchors overlap; the natural browser test also reproduced and covers the S3 revision/presentation overlap.
- The former C2 preview assertion that C3 must always be unavailable was updated to the approved demo behavior. It still verifies C2 availability, the locked-status check and C4/C5 exclusion, and now verifies C3 requires completed C2.

## Verification

Commands and logs are recorded in /tmp/c3-demo-*.log. Integrated Core/FE/entry: 196 PASS, zero skips. C2: 158 PASS. Core/C1 checks, lint, content validation (valid, zero errors/warnings), runtime registry checks, production build and npm audit (zero vulnerabilities) PASS. Built asset checks: 235 registered PNGs preserved, emitted and decoded at original dimensions.

Natural UI test: `QA_BASE_URL=http://127.0.0.1:3075 npx playwright test tests/browser/c3-demo.spec.ts`. Starts with empty browser storage, plays Prologue/C1/C2, enters C3 from menu, investigates, reloads between the two S2 papers, styles with loan wardrobe, finishes and checks +100 and no extra reward after reload. PASS: 1/1 on Chromium desktop (9.9s). Earlier test-selector corrections used the real street dialogue hotspot, the actual garment name, and wardrobe pagination; no force clicks or state grants. Browser screenshot: artifacts/c3-demo-natural-complete.png. The final committed SHA is rerun using the same command before handoff.

Scope limitations: demo candidate, not full release acceptance. Safari/WebKit, C3 mobile/touch/occlusion and formal cultural signoff NOT RUN in this integration. Proposed S2/S3 fallback spawns remain unapplied; arrow entries retain reviewed positions. No new assets/audio/animation.

Run from /Users/thanhdanh/Nep-Remix: `PORT=3075 NODE_ENV=production npm run start`. Open http://127.0.0.1:3075 . Save storage is origin-specific; a save from another port does not automatically transfer. No debug grants or pre-completed C3 save are supplied.
