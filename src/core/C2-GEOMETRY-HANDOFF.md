# C2 — native layout applied; Frontend walker fixes still required

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
