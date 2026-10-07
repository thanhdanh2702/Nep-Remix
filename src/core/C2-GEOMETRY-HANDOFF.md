# C2 — native layout applied; Frontend walker fixes still required

**Latest audit: FE `1692327`, see the revision audit below.** Spawn/arrival
adapter requests from the earlier b6bb71a report have been addressed in source;
visual floor/path acceptance is still open. Content radii are unchanged.

Baseline Core `b3f7246`, clean `agent/core` before work. Layout source read-only:
`git show b6bb71a:src/game/C2-LAYOUT-HANDOFF.md`. No Frontend merge. Manifest
`assets/areas/chapter-2/manifest.json`: version 4, background A, three backgrounds
1672×941. Verified visible overlay bounds, worldPlacements and viewed all three
runtime backgrounds. Full-canvas overlays remain at (0,0), never a hit rectangle.

## Applied content and deliberate corrections

`src/content/chapters/c2.json` now has measured pos/rect for all 11 actions,
spawns S1 `(0.25,0.75)`, S2 `(0.15,0.75)`, S3 `(0.12,0.75)`, and four exit
arrows. Side remains phai. Exits, full G1/G2/when, rewards, dialogues and all
five puzzles are unchanged. No new interactable/NPC action or schema.

Corrections to the supplied table (Core owns these content values):

- **S2 hall arrow:** `(x=.92,y=.76,w=.08,h=.14)` instead of
  `(.92,.35,.08,.45)`. Original overlaps the safe; new arrow is on the floor
  below/right of the safe. It still goes to S3 with full G2. This represents
  navigation, not an additional painted door. Expanded 44px touch targets stay
  separate from the safe at stage widths 300, 390, 768, 844, 1280 and 1440.
- **Safe rect:** `(.739,.37,.201,.28)` instead of `(.74,.37,.20,.28)`.
  Original left edge 1237.28 clips native visible left 1236. New left 1235.61.
- **Receipt/crowd rect:** `(.657,.44,.203,.39)` instead of
  `(.66,.44,.20,.38)`. Original left 1103.52/bottom 771.62 clips manifest bounds
  `[1100,414,1425,780]`; corrected left 1098.50/bottom 781.03 contains them.
- **Radii:** widened to reach the current walker stand points from both
  approaches. Uses conservative max of the existing Core 800×500 range metric
  and native 1672×941 metric, rounded upward with .005 margin. The range helper
  is unchanged. Radius is proximity only; no progress gate is weakened.

| Action | Applied radius | Current walker feet native, left/right approach |
| --- | --- | --- |
| drawing-desk / piece1 | .11 | (510,546) / (761,546) |
| fabric-basket / piece2 | .09 | (895,583) / (1145,583) |
| gas-lamp / piece3 | .12 | (276,546) both, edge flips approach |
| french-window / piece4 | .10 | (1162,546) / (1413,546) |
| drawing-easel / P1 | .15 | (226,546) / (510,546) |
| grandfather-clock / key | .14 | (276,546) / (560,546) |
| silk-shelves / optional dialogue | .22 | (627,546) / (1212,546) |
| iron-safe / P2 | .18 | (1160,612) both, edge flips approach |
| reporters-crowd / P3 | .21 | (1023,781) / (1513,781) |
| ong-le-shadow / P4 | .15 | (359,546) / (644,546) |
| exhibition-podium / P5 | .18 | (560,772) / (978,772) |

S1 piece4 rect `(.74,.46,.06,.09)` and window exit rect
`(.88,.20,.10,.55)` are disjoint even after 44 CSS px expansion at the specified
390/844/768/1280/1440 stage widths. Viewport width is not always stage width;
Tester must still inspect the actual contained stage at every target viewport.

## Reachability evidence and Frontend blockers

`c2-layout.test.ts` executes the actual `room-walker.ts` movement functions,
with C2 floor `[.58,.92]`, stand gap `.045 * width`, `standClear`, `tick`, both
approaches, and real Core interact guards at the **arrived feet** (not i.pos).
The walker source matches Frontend b6bb71a. Node harness strips only the unused
Vite assets import and transpiles with the existing esbuild dependency; no
movement implementation is copied. No UI/browser test is modified.

**PASS is engine reachability, not visual floor acceptance.** Inspection of A
shows the current floor rectangle includes furniture. C2 has no entries in
`room-walker.ts/OBSTACLES`; `standClear` therefore returns these points unchanged.
Frontend must fix this within its ownership before Tester acceptance:

1. **Feet on furniture / incomplete floor mapping.** With S1 spawn
   `(418,706)`, click drawing-desk: `targetFor` gives `(510,546)`, on the desk
   region rather than open floor. S2 shelves approach from left gives
   `(627,546)`, inside the cabinet. S3 P4 approach from left gives `(359,546)`,
   on the raised podium/desk region. These are reproducible using the walker
   math above and visible in A. Set appropriate C2 floor/obstacles/stand points
   in Frontend and send the new measured feet back to Core for radius recheck.
   The tests do not model unregistered furniture as collision-free real floor.
2. **Spawn ignored.** At b6bb71a `RoomScene` first entry falls back to
   `{x:world.w/2,y:world.h}`, clamped to `(836,866)`, despite content spawns.
   Reproduce first entry S1: expected `(418,706)` from content, actual fallback
   bottom-centre. Use area.spawn on first entry while keeping return-arrow entry.
3. **Interaction position spoofed by adapter.** `RoomScene/go` defines
   `fire = () => interact.current(i.id,i.pos)`, even after walking. Pass actual
   normalized walker feet on arrival, including reduced-motion path. Current
   Core tests already verify guard acceptance at feet under the supplied floor;
   rerun them after any floor/obstacle change.

Core does not change RoomScene/walker/render and does not declare the supplied
placeholder floor visually accepted. No browser run on an integrated candidate
has been performed here. Leader must coordinate these dependencies with Frontend.

## NPC contract from Frontend layout report

Frontend b6bb71a implements render-only `c2RoomNpcs`; IDs need not exist in Core
interactables. This agrees with separating display placement from gameplay.
The old mappings hitbox-ca-nghi/cu-loan/cu-loan-storage must not be made real
hotspots just to render actors. No NPC schema or fake Core action is added.

| Area | Render-only actor ID | Native foot from supplied layout |
| --- | --- | --- |
| S1 | c2-s1-loan | (1137,706) |
| S2 | c2-s2-loan | (602,659) |
| S3 | c2-s3-ca-nghi | (1254,678) |
| S3 | c2-s3-loan | (368,678) |

Report scene-idle/worried/determined/relieved and Ca Nghi stern/shocked/retreat
paths exist in v4 manifest. Frontend owns scale/pose/occlusion; verify actors
stay clear of action hit targets and feet after its floor fix. S1 D0 remains
queued intro; it does not require another NPC action. Existing P4 hotspot keeps
its action, independently of display actors. Render integration/visual approval
remains Frontend/Tester responsibility.

## TDD and acceptance boundary

RED `8820dea`: 13 executed cases fail on old pos/rect/spawn/missing exits.
RED `5f52de7`: hall/safe expanded-target overlap fails. RED `58a8f23` adds native
bounds containment: safe clips first; receipt also fails after correcting safe.
GREEN: 15/15 layout cases, unchanged assertions for reach/range/touch/bounds;
expected placement tuples updated to the documented corrected design.

All 107 C2 cases and 26 legacy regressions pass; see C2-HANDOFF.md for full
commands and coverage. These do not replace browser, visual floor or integrated
acceptance. Reward layer `ao-dai-tan-thoi-vang-mo-ga` remains **BLOCKED** for full
reward art QA. Keep both reward garment IDs; no replacement layer or art made.

## Revision audit: Frontend 1692327, Core baseline 1ccf21a

Read-only source revision: `1692327c4a80d5b0b9e709db73668504c28a7f7e`.
No Frontend merge or checkout fallback. Movement blob:
`f84ba714ce3ebf6adfd2d51024f2a554e4be8a90`; RoomScene blob:
`9df674b97e0225e4d10b0a6a620e0309edf02f3e`.
The preceding b354417 still used the old movement blob and had no new obstacle
map. 1692327 adds three C2 obstacles and walking to exits; floor remains .58–.92.
Its C2-LAYOUT-HANDOFF.md is unchanged and does not yet include the new feet table.

Explicit revision command (missing revision/source boundaries fail, no fallback):

```sh
C2_MOVEMENT_REVISION=1692327c4a80d5b0b9e709db73668504c28a7f7e node --import tsx --test --test-reporter=tap src/core/c2-layout.test.ts
```

PASS 18/18: existing 15 layout tests run the committed FE walker via `git show`;
three new area tests execute source blocks from that same RoomScene for entry
and interaction. These test 94 adapter calls across every hotspot, spawn,
all reverse-arrow entries, left/right approaches and normal/reduced arrival.
Normal arrival advances actual `tick`; reduced arrival executes actual
`arriveNow` through RoomScene/go. Each callback passes the actual normalized
walker feet into the Core interact guard, exactly once. rAF/DOM paint is not
executed: the test advances ticks and delivers the pending callback itself.
Movement/entry/arrival formulas are not copied into tests. Only unused rendering
imports are omitted for Node; RoomScene closures receive explicit test refs and
callbacks. Gap and entry functions come from source; the audited floor is
checked against the FE catalog. No browser or rendered occlusion claim.

Without C2_MOVEMENT_REVISION the original suite explicitly tests the local
Core checkout's movement and adds no FE adapter tests. It is not evidence for
a newer FE revision. Leader can run the opt-in command once that exact Git
object is available; do not substitute another checkout silently.

### Feet computed from the committed patch; radius delta: none

| Hotspot | Radius | Left approach native feet | Right approach native feet |
| --- | --- | --- | --- |
| drawing-desk | .11 | 509.96,545.78 | 760.76,545.78 |
| fabric-basket | .09 | 894.52,583.42 | 1145.32,583.42 |
| gas-lamp | .12 | 275.88,545.78 | 275.88,545.78 |
| french-window | .10 | 1162.04,545.78 | 1412.84,545.78 |
| drawing-easel | .15 | 225.72,545.78 | 509.96,545.78 |
| grandfather-clock | .14 | 275.88,545.78 | 560.12,545.78 |
| silk-shelves | .22 | 627.00,569.30 | 1212.20,545.78 |
| iron-safe | .18 | 1160.37,611.65 | 1160.37,611.65 |
| reporters-crowd | .21 | 1023.26,781.03 | 1513.16,781.03 |
| ong-le-shadow | .15 | 359.48,564.60 | 643.72,545.78 |
| exhibition-podium | .18 | 560.12,771.62 | 978.12,771.62 |

Only shelf left and P4 left move relative to the old table. All existing radii
pass real Core guards and native distance checks. No radius/content/gate change
is justified by this patch.

First entry consumes the content spawns. Executed return-entry source produces
normalized S1 from S2 `(.93,.58)`; S2 from S1 `(.05,.58)`, from S3 `(.95,.76)`;
S3 from S2 `(.05,.58)`. These are engine results, not approval of visible floor.

### Remaining Frontend reproducer / WAITING for corrected floor evidence

1. S1 obstacle y=.40,h=.173 ends at .573, below floorTop=.58. Neither drawing
   desk arrived foot at y=.58 can hit this obstacle. Spawn (418,705.75) → desk
   (509.96,545.78) remains the original furniture endpoint/path reproducer.
2. S2 shelf left moves from y=545.78 to 569.30 (.605), but remains in the
   painted cabinet region on background A; right stays y=545.78.
3. S3 P4 left moves to y=564.60 (.60), still on the podium/desk region; right
   (643.72,545.78) is outside the registered obstacle and remains unchanged.
4. `standClear` only changes endpoints; actual `tick` is straight-line movement
   without obstacle collision. Unit arrival PASS does not prove the walked
   segment stays on open floor or that return entries avoid furniture.

Frontend should supply a committed corrected floor/stand/path patch and native
feet/return-entry table, with evidence on A for both approaches and reduced
motion. Keep the established hotspot rects/gates. Core will then rerun the
explicit-revision suite and adjust radius only for verified clear-floor points.
Spawn/feet adapters are source-audited as fixed; floor/occlusion and browser
acceptance remain open. Missing secondary reward layer remains an Art blocker.

## Reproducer details requested after Core 2b274ce

Checked against FE `1692327c4a80d5b0b9e709db73668504c28a7f7e`; no newer
committed geometry or Leader integrated candidate was available at this audit.
The following fills the normalized coordinates/reproduction detail missing in
2b274ce. It does not change content, radii or the visual-acceptance conclusion.

Source of pos/radius is **current `src/content/chapters/c2.json`**, not the stale
Frontend layout table. The 11-row native feet/radius table above remains the
engine result for that JSON and that exact FE revision. No common 88px threshold
is used: Core distance uses 800×500 with radius×800 and its expanded-rect fallback;
the additional native check uses 1672×941 with radius×1672. Real interact guards
are authoritative. Distances under those two metrics must not be conflated.

### Concrete affected actions and furniture

Each point below is the final foot after **targetFor's clampToFloor → standClear
→ tick/arriveNow**, and is the normalized value delivered to interact. At this
revision go has no additional clamp after standClear. Normalized points below
come from unrounded engine values; native display is rounded to 3 decimals.
All listed interact guards PASS; the open issue is feet/path on visible furniture.

| Area / exact hotspot ID | Content pos / radius | Approach | Final native foot | Final normalized foot | Furniture to inspect on background A |
| --- | --- | --- | --- | --- | --- |
| S1 / hitbox-drawing-desk | (.380,.469) / .11 | from left | (509.960,545.780) | (.305,.580) | left side/leg of central drawing desk; path rises from open floor into desk region |
| S1 / hitbox-drawing-desk | (.380,.469) / .11 | from right | (760.760,545.780) | (.455,.580) | central drawing desk and stool region |
| S1 / hitbox-drawing-easel | (.219,.409) / .15 | from right | (509.960,545.780) | (.305,.580) | same desk edge as drawing-desk left; checking only the easel rect misses this |
| S2 / hitbox-silk-shelves | (.550,.400) / .22 | from left | (627.000,569.305) | (.375,.605) | lower cabinet beneath silk shelves; obstacle moves foot only 23.525 native px |
| S2 / hitbox-silk-shelves | (.550,.400) / .22 | from right | (1212.200,545.780) | (.725,.580) | right edge/gap of cabinet next to safe; confirm actual floor/occlusion in frame |
| S3 / hitbox-ong-le-shadow | (.294,.413) / .15 | from left | (359.480,564.600) | (.215,.600) | podium/desk on raised left platform; obstacle moves foot only 18.820 native px |
| S3 / hitbox-ong-le-shadow | (.294,.413) / .15 | from right | (643.720,545.780) | (.385,.580) | right edge of raised platform; outside the narrow registered obstacle |

These furniture descriptions are based on inspecting the native background A
at the computed coordinates. Exact visible overlap, leg occlusion and whether
the whole walked segment looks valid need a rendered browser frame/video. The
table does not turn a background inspection into browser acceptance evidence.

### Steps to reproduce independently

1. Use FE revision above with native world 1672×941, matching content from Core
   2b274ce, phai side and gap .045×width. Prepare a separate checkpoint **before**
   the listed action for each approach so a picked item/solved puzzle is not
   already hidden. Finish any active dialogue before clicking another action.
2. S1: enter C2 and finish D0 before piece1/P1. For S2 shelves complete G1; for
   S3 P4 complete G2 and P3. These are the normal progress requirements, not
   proposed bypasses. Browser happy-path acceptance must earn them normally.
3. Engine fixture starts: left `(83.600,705.750)` = `(.05,.75)`; right
   `(1588.400,705.750)` = `(.95,.75)`. Execute the actual go for the named
   hotspot. For first-entry cases the actual spawns are S1 `(418,705.750)`,
   S2 `(250.800,705.750)`, S3 `(200.640,705.750)`; return entries are listed above.
   Private before-action fixtures are for isolated negative/geometry diagnosis,
   not evidence of a full earned browser walkthrough.
4. Run normal motion to arrival and reduced motion separately. Read final
   walker.current and the interact payload after the callback; compare them
   with the row, not with i.pos or the pre-standClear aim. In a browser capture
   canvas data-an-x/data-an-y, screenshot with visible feet and furniture, and
   for normal motion a short path recording or intermediate frames.
5. Source-level result: S1 obstacle ends at .573 and cannot catch floor .580;
   S2 left becomes .605, S3 left .600. Inspect the final rendered feet against
   the named furniture. Do not widen a radius to make these points visually valid.

### Evidence boundary and next input

| Condition | Evidence available | Remaining verification |
| --- | --- | --- |
| 11 hotspots, both approaches, spawn/return, normal/reduced | committed source execution, final feet and real Core guards GREEN | run same revision mechanism on new FE SHA |
| Actual feet sent to interact | exact RoomScene/go callback plus tick/arriveNow GREEN | DOM/rAF cancellation and rendering on integrated browser candidate |
| Foot inside floor strip after final movement | numerical bounds GREEN | floor strip may include painted furniture |
| Feet and full path clear of furniture | native background inspection identifies open reproducers | FE/Tester screenshot/video with final/intermediate feet; not unit PASS |
| Integrated candidate | no new candidate supplied; main 6885ccb lacks the later FE geometry | Leader supplies candidate SHA; rerun on that checkout |
| Secondary reward garment | reward retained | Art supplies missing layer; full reward-art acceptance BLOCKED |

**WAITING:** a fixed FE commit SHA plus updated 11-hotspot table derived from
actual JSON (pos/radius/rect), exact floor/obstacles, before/after final feet in
both units, spawn/return entries and screenshots/path evidence on background A.
Then provide the Leader candidate SHA/checkout for integrated rerun. No content
change is warranted until a verified clear-floor point is rejected by a guard.
