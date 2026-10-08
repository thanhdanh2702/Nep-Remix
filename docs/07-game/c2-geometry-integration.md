# C2 geometry — Leader integration, 2026-10-08

## Integration and review

Leader baseline `2038276`. Core `633a0c0` merged as `1e72498`; FE `aed945d`
merged as `e6ceac9`, preserving stable world identity, legacy C1 adapter and
registered-assets isolation. Tester C2-only changes through `f0ba800` received
as `4cecca7`/`8828d6f`, not the entire historical Tester branch.

The FE candidate shrank audited furniture and routed only selected pairs.
Independent regression `aedecec` reproduced feet inside furniture in all three
rooms and direct fallback into a blocked destination (4 RED). Fix `1ccdac5`
restores footprints and uses visibility-graph routing: full closed segments
are checked, shortest reachable route selected, unreachable returns null.
It scopes native target adjustments to C2, preserving old chapter behavior.

Further regression `b29a256` found a path through Loan feet in S2. Fix `524b3fc`
adds NPC ground-space, not full upright sprite canvases, to routing obstacles.
NPCs remain render-only. No Core radius/content/gate/save/reward changed.

Core probe injects actual findPath and initializes synthetic origins on clear
floor like RoomScene. Browser sampling now uses requestAnimationFrame, requires
real samples and waits for interaction completion instead of fixed sleeps.

## Actual native feet (left/right approaches)

World 1672×941; floor .58–.92. These implementation measurements supersede FE
handoff. Core proximity uses its existing **800×500** metric, not native world.

| Hotspot | Unchanged radius | Left | Right |
| --- | --- | --- | --- |
| drawing-desk | .17 | 510,663.4 | 760.8,663.4 |
| fabric-basket | .09 | 894.5,583.4 | 1145.3,583.4 |
| gas-lamp | .12 | 275.9,545.8 | 275.9,545.8 |
| french-window | .10 | 1282.4,545.8 | 1412.8,545.8 |
| drawing-easel | .21 | 225.7,545.8 | 510,663.4 |
| grandfather-clock | .14 | 275.9,545.8 | 560.1,545.8 |
| silk-shelves | .30 | 760,684.1 | 1212.2,734 |
| iron-safe | .18 | 1160.4,611.7 | 1160.4,611.7 |
| reporters-crowd | .21 | 1023.3,781 | 1513.2,781 |
| ong-le-shadow | .25 | 525,729.3 | 525,729.3 |
| exhibition-podium | .18 | 560.1,771.6 | 978.1,771.6 |

## Verification

- `npm run test:c2`: 158/158 PASS.
- `C2_MOVEMENT_REVISION=HEAD C2_CHECK_PATH_CLEARANCE=1 node --import tsx --test src/core/c2-layout.test.ts`:
  20/20 PASS against committed integrated source.
- `test:core`, lint, content validator, build, npm audit: PASS; 0 vulnerabilities.
- Old dialogue/reread/replay/integration regressions: 26/26 PASS.
- room-walker.ts coverage using c2-routing + c2-m1: **95.87% lines,
  93.62% branches, 91.67% functions**, not whole-app coverage.
- Final browser: **29/29 PASS (3.5m)** with
  `QA_BASE_URL=http://127.0.0.1:3062 npm run test:c2:acceptance -- --output=artifacts/c2-acceptance-final --max-failures=1`.
  Includes 8 geometry/navigation checks, 10 full C2 UI walkthroughs (5 viewports
  × normal/reduced motion), and 11 C1/save/queue regressions. No test retries.
  This is the scoped acceptance command, not the entire browser/Safari suite.
- Production: http://127.0.0.1:3062; runtime source `524b3fc`, bundle
  `index-CQejVare.js`. Artifact screenshots in `artifacts/c2-geometry-fixed-*.png`.
- Walkthrough fixtures complete C1 only, not C2 progress. Geometry cases test
  approaches separately from the full story walkthrough.
- Screenshots were manually reviewed: S2 shelves and S3 shadow are separated
  from Loan; S1 window exposes the additional visual floor defect listed below.
  The isolated shadow geometry fixture attempts P4 before P3, so its screenshot
  shows a prerequisite refusal; the full UI walkthrough tests the correct order.
- Historical bug-existence suite is preserved in `tests/repro/`, separate from
  acceptance. `npm run test:c2:repro` uses its own config on a buggy baseline;
  it is expected to fail on a fixed build. Correct-behavior regression remains
  in `tests/browser/c2-geometry.spec.ts`; no failure is hidden or expected changed.

## Limits and preservation

- **OPEN — C2-GEO-009 (visual floor, S1 window):** manual inspection of
  `artifacts/c2-geometry-fixed-s1-window.png` shows An's feet at native
  `(1282.4,545.8)` above the painted floor, although outside Loan's silhouette
  and inside the mathematical floor strip. This is not full visual acceptance.
  The current floor/approach model and proximity constraints must be reconciled
  with the background before calling C2 finished. No test expected value was
  changed to accept this visual defect. Other floor-strip-only checks likewise
  do not prove that every foot is on the painted floor.
- GEO-006/008 remain design observations, not new hotspot/easing requirements.
- Real wear layer for `ao-dai-tan-thoi-vang-mo-ga` is still missing: Art blocker
  for full reward-catalog acceptance. No reward substitution/generated art.
- Safari/full visual acceptance beyond these regression scenarios not claimed.
- Existing >500kB bundle warning. Unregistered C3 files can be emitted by Vite
  glob but remain excluded from runtime: local playtest, not clean release pack.
- No push/reset/new agents. Other worktrees, dirty overview README and
  untracked C3 assets/docs/scripts remain unchanged by this integration.
