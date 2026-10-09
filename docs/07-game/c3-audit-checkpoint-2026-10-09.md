# C3 audit remediation checkpoint — 2026-10-09

Status: demo candidate checkpoint; visual/Safari acceptance remains pending.
User authorized committing the reviewed audit fixes into main. No push or worktree synchronization.

## Scope and provenance

Baseline: `56eeb3bafdbcb4a63529196be73f10ba08341ab0`.
Frontend source: existing `agent/frontend` worktree at that baseline, reviewed dirty audit slice.
Integrated DocumentViewer, RoomScene, room-walker, puzzle CSS, adjacent document/layout tests,
and C3-GEOMETRY-AUDIT-HANDOFF.md. Removed one trailing empty line from the document test.
The original Frontend worktree and unrelated main changes were preserved.

Keyboard reading now focuses the document region and supports arrows, page keys, Home/End,
reduced motion and key repeat without implicit acknowledgement. C3 hotspot labels describe
actual actions. Side-door entries and obstacle clearance place initial/resumed An at about
795 px in S2 and 820 px in S3; sprite scales remain unchanged.

Leader adapted the Core layout test to the reviewed movement fingerprints and imported
entryPoint, retaining actual walker/Core guards and the 22 approach-route checks.
The existing natural-journey E2E selector was scoped to its modal because the corrected
hotspot and submit button both legitimately say “Trình chứng cứ”. No assertion was relaxed.

Content JSON, Core progression implementation, gates, reward ledger and wardrobe ownership
were not changed. Core content spawn proposals remain unapplied; runtime obstacle clearance
and doorway placement supply the candidate positions.

## Verification before commit

| Gate | Result | Evidence/log in local /tmp |
| --- | --- | --- |
| C3 Core + FE + availability | PASS 198, 0 skipped | c3-audit-integration-tests.log |
| C2 regression | PASS 158 | c3-audit-integration-c2.log |
| Core/C1 | PASS | c3-audit-integration-core.log |
| Typecheck | PASS | c3-audit-integration-lint.log |
| Content validation | PASS, no errors/warnings | c3-audit-integration-content.log |
| Build | PASS | c3-audit-integration-build.log |
| npm audit | PASS, 0 vulnerabilities | c3-audit-integration-audit.log |
| Registry/handoff | PASS | c3-audit-integration-assets.log |
| Production assets | PASS 235 registered PNGs, dimensions/browser decode | c3-audit-integration-built-assets.log |
| Mounted reader probe | PASS | c3-audit-integration-reader.log |
| Keyboard component probe | PASS 48 combinations | c3-audit-integration-keyboard.log |
| Natural Prologue → C1 → C2 → C3 browser journey | PASS | c3-audit-integration-e2e.log |
| Docs references | FAIL, 65 problems across 158 docs before this report | c3-audit-integration-docs.log |

Keyboard probe uses the actual component and styles for four documents, active/read-only,
desktop/mobile/landscape and both motion preferences. It checks DOM scroll, focus trapping,
outer-page stability and explicit acknowledgement; fixture checks do not substitute for
full gameplay acceptance. Natural journey starts with empty storage and checks menu access,
reload between papers, challenge wardrobe isolation and one-time +100 Sen.

## Remaining acceptance

- Painted-floor bounds at rear/depth interaction arrivals and occlusion require visual signoff.
  The handoff's full-width S3 foreground strip still needs reconciliation with its left obstacle.
- Independent audit suite RED→GREEN on the integrated candidate is not yet signed off by Tester.
- Physical touch devices, Safari/WebKit and full mobile gameplay acceptance: NOT RUN.
- Existing documentation reference failures remain unresolved. Coverage was not remeasured in
  this integration; no whole-app coverage claim is made.

This checkpoint is suitable for continued local demo/QA, not a declaration of full release acceptance.
