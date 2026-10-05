# Spec-doc inventory (Nep-Remix) - 2026-10-05

Method: ripgrep over scope, then line-level read. Line numbers verified by tool output unless marked UNVERIFIED. Counts = lines carrying a spec claim (approx).
Tags: CHAR / BG / SCREEN / ICON / DEL (references deleted file) / PROMPT / CODE.

## A. Source of truth (heavy)

### assets/README.md (~48) CHAR+ICON+BG+PROMPT
- L3,L5 the rule itself: "NOI DUY NHAT ... thong so"; sub READMEs must not restate specs
- L44 aspect ratios 1:1, 4:3, 16:9, 3:4, 9:16; L48 body-base reference for garment/accessory layers
- L60 prefix size examples 64x96, 32x32, 128x128, 800x500 (PROMPT)
- L79-97 table (17 rows): area-bg/overlay/cg 800x500, gen 16:9, crop 8:5, nearest-neighbor, 32/16 colours (L81-83); doc 400x250 (L84); character-sprite 64x96 16c (L85); cat-sprite 32x32 12c (L86); portrait 128x128 + 64x64 (L87); paperdoll-layer 64x96 8-12c (L88); garment-layer 64x96 "4 cap xam" (L89); garment-thumb 96x96 (L90); accessory-layer 64x96 (L91); accessory-icon 48x48 (L92); item-icon 48x48 (L93); motif 32x32 4-8c (L94); vfx 32x32/64x96/800x500 (L95); screen-bg-landscape 800x500 (L96); screen-bg-portrait 270x480 9:16 (L97)
- L101 icon UI 24x24
- L105-117 section 6.1: grid 64x96, 8 layers layer-0-shadow .. layer-7-accessories (L110-117)
- L120 section 6.2 No-Trim 64x96; L123-135 section 6.3 eight gray keys (#E0E0E0 #9E9E9E #616161 #212121 / #FFFFFF #D0C8B8 #8C8275 #3A342C)
- L208 colour cap "4, 12, 16, 32"; L210 canvas "64x96, 48x48, 800x500"; L231 example `ao-tu-than.png` (DEL)
- Tags: CHAR (L85-89,91,108-135), BG (L81-84,96-97), ICON (L90,92-94,101), PROMPT (L60)

### docs/06-design/design-system.md (~29) CHAR+BG+ICON
- L10 chibi head:body 1:2.5-1:3; L78 artboard 1600x1000, 8:5, 800x500 x2 integer; L92 touch 44x44/48; L97 "Nhan vat 64x96, Meo Nep 48x48, Chan dung 128x128, Icon 48x48 ... nearest-neighbor 2x-4x"
- L137-144 section 5 table (declared source of truth): landscape 800x500 8:5 (L137); portrait 270x480 9:16 (L138); area 800x500 (L139); player/NPC 64x96 (L140); Meo Nep 48x48 (L141); portrait 128x128 (L142); item/accessory icon 48x48 (L143); UI icon 24x24 (L144)
- L165 icon button 44x44; L169, L239 NPC portrait 128x128; L177 swatch 36x36; L180 thumbnail 96x96; L186 clue icon 48x48; L252-262 image-rendering pixelated / crisp-edges, ctx smoothing off (CODE-style CSS)
- Tags: CHAR (L10,97,140-142,169,180,186,239), BG (L78,137-139), ICON (L143-144,165,177)

### docs/01-overview/decisions.md (~9) CHAR+BG
- L31 landscape 16:9; L104 area 8:5, 800x500 x2 = 1600x1000; L112 "sprite nguoi choi va NPC 64x96 moi frame, portrait 128x128 (clue 64x64), thumbnail ao 96x96, icon 48x48, UI 24x24" (CHAR rewrite); L135-137 Decision 28 landscape 8:5 (BG)

### docs/05-tech/game-implementation.md (~17) MIXED, partly An-aware already
- L11 prologue 890x500, c1 640x360 (BG keep); L13 normalize-ui-images + assets/src/pixel/ui (SCREEN/CODE, stale after raw swap); L17 garden-user copy; L41 garden--landscape 1585x992
- L31 max 1600x1000; L43 world 800x500; L57 registry "207 PNG"; L61 canvas 800x500, hub 320x480, pixelated; L65 An 1408x4576, 8x11, 176x416; L76 anchor (88,400), scale 0.25 -> 44x104 (already new spec)
- L85 CONFLICT: "Paperdoll ... 64x96, order shadow/hair_back/body/pants/garment/face/hair_front/accessory; gray [224,158,97,33]; do not use An frames" (CHAR + DEL: paperdoll layers deleted)
- L104 mobile prologue 800x500 (BG)

### docs/06-design/ai-studio/gemini-ui-asset-prompts.md (~21) PROMPT+CHAR
- L9-11 An 176x416 views, NPC portrait 128x128, bg 270x480; L19 chibi 1:2.5-1:3; L44, L48 NEAREST resize 704x1664 / 512x768; L46 reads assets/characters/ba-mai/view-front.png (DEL); L51 An sheet 1408x4576, 8x11, 176x416, anchor (88,400), outfit_main 250 tall, hem y=377; L68-71 paperdoll-aligned garment prompt; L89 portrait 128x128; L102 "crop tu sprite 64x96" (stale); L104-116 bg 9:16 270x480; L123-132 CLI 176x416 / 128x128 / 540x960; L144 colours <=32 default 24

## B. Sub-READMEs (screens / areas / characters / garments / accessories)

### assets/paperdoll/README.md (~4 spec + 18 DEL rows) CHAR, DEL
- L9 "canvas chuan khong xen ... goc toa do" (spec-ish); L17-34 rows list deleted files (layer-0-shadow, body-female/male, pants-* x4, hair-short/shoulder/long-female front/back, hair-male front/back, face-neutral/smile/blink); L35 avatar-female-default.png (only survivor on disk)
- Rule violation: mild (L3 type paperdoll-layer, L7-9 palette/canvas rules)

### assets/screens/README.md (6) SCREEN - VIOLATES rule
- L5 8:5, 800x500 x2; L11 3slice 120x40; L12 9slice 64x64 (16px corners); L19 800x500/1600x1000; L22 modal 480x360..640x420; L25 portrait 9:16 270x480

### assets/screens/main-shop/ SCREEN/ICON - VIOLATES rule
- README.md (9): L5 8:5 + 9:16 (320x480); L11 800x500 (gen 16:9, crop 8:5); L12 320x480; L13 120x40; L14 64x64; L15 vfx 64x96; L22 800x500; L28/L32 HUD 40 px; L42 PROMPT "800x500 pixel grid"; L58 nearest-neighbor. L53-55 refer to `_raw/`. The 4 replaced raws (area-sign-frame, currency-hud, garden-user--landscape, settings-button) are NOT in the table (unlisted).
- garden-user.md (1): L5 1000x625 in-scene. garden-overview.md (2): L11, L37 "landscape 8:5" PROMPT.
- asset-manifest.json: L5 rendering nearest-neighbor; width/height blocks L10-11 (800x500), L18-19 (320x480), L26-27 (120x40), L39-40 (64x64), L55-56 (64x96); no entry for the 4 replaced files.
- _raw/generation.json (6): L10 portrait decision 320 vs 270; L16,21,26,31,36 prompts with 800x500 / 320x480 / 120x40 / 64x64 / 64x96 (PROMPT). Deleted: _raw/area-sign-frame-hires, currency-hud-hires, garden-user--landscape-hires, settings-button-hires (DEL).

### assets/screens/museum/ SCREEN - VIOLATES rule
- README.md (11): L5 8:5 + 2:3 (320x480); L11 800x500; L12 320x480; L13 64x64; L14 120x40; L15 citation-seal 32x32; L24 colour caps; L25 nearest-neighbor; L44 800x500; L50 128x128; L66 PROMPT 800x500. bookshelf-pink--landscape (raw 1586x992) not in table.
- bookshelf-pink.md (L8, L11 8:5) PROMPT; asset-manifest.json (L7, L9-10 notes; sizes 800x500, 320x480, 64x64, 120x40, 32x32); _raw/generation.json (L12-13, L19-23 prompts 64x64/120x40/32x32) PROMPT. Deleted _raw/bookshelf-pink--landscape-hires.png (DEL).

### assets/screens/studio/ SCREEN - VIOLATES rule
- README.md (15): L5 8:5 + 2:3 320x480; L11-16 table 800x500, 320x480, 64x64, 48x48, 120x48, 120x40; L25 colour caps; L26 nearest-neighbor / pixelated; L42 800x500; L50 icon 48x48; L53 modal 560x420; L67 PROMPT 800x500
- wardrobe-frame.md L14 "exact original 5:1" PROMPT; vietnamese-room.md L13 PROMPT; asset-manifest.json (L6-7 notes; 800x500, 320x480, 64x64, 48x48, 120x48, 120x40); _raw/generation.json (7: L11-36 prompts); _raw/portrait-layout-edit.json L5, portrait-layout-edit-v3.json L5 PROMPT. Deleted: _raw/lookbook-frame-hires, vietnamese-room--landscape-hires, wardrobe-frame--landscape-hires (DEL). The 3 replaced raws (1144x1375, 1585x992, 2172x724) are not in the README table.

### assets/screens/wardrobe/README.md (11) SCREEN/ICON - VIOLATES rule
- L5 8:5 + 9:16; L11-16 800x500, 320x480, 64x64, 48x48, 120x40, item-slot 48x48; L24 ~350 px; L29 icon 48x48 / thumb 96x96; L43 PROMPT 800x500
### assets/screens/workshop/README.md (9) SCREEN - VIOLATES rule
- L5; L11-16 800x500, 320x480, 64x64, 48x48, 120x32, vfx 240x240; L23 800x500; L43 PROMPT
### assets/screens/welcome/README.md
- L9-12 prompt text ("wide landscape approximately 2:1") PROMPT; no pixel size stated for welcome-courtyard (raw 1774x887). Deleted _raw/welcome-courtyard-hires.png (DEL).

### assets/areas/chapter-1/README.md (10) BG
- L7 640x360 16:9 <=32 colours (draw-c1-rooms.py); L17-19 640x360 x3; L32-35 prop grids 18x11, 20x16, 10x16, 12x15 (ICON); L41-42 icons 24x24 (ICON)
- c1-s1-buong-det-khoa-kin/README.md L9 and c1-s2-ban-tho-nha-tho-ho/README.md L9: 640x360 (16:9) BG
- assets/areas/prologue/** READMEs: no size numbers (grep clean). 5 deleted PNGs under prologue (c0-s1 ban-cat-sau-nhat-phan; c0-s2 ruong-he-mo, ruong-mo-toang, tuong-go-mo-tay, vai-phu-roi); whether READMEs name them is UNVERIFIED.

### assets/characters/README.md + 13 NPC READMEs CHAR
(ba-lon, ba-mai, ca-nghi, cat-nep, chu-suu, cu-cam, cu-loan, hoang-lam, me-phuong, ong-le, thay-ba-can, truong-toc-bui, vinh; assets/characters/an has no README)
- No pixel numbers. L3 type character-sprite in all 14 (cat-nep: cat-sprite); "Ghi chu tao hinh ... anh sprite toan than lam tham chieu" (ba-lon L11, ba-mai L12, ca-nghi L10, cat-nep L12, cu-cam L10, cu-loan L10, chu-suu L10, hoang-lam L10, me-phuong L10, vinh L10); scene-* rows typed character-sprite (e.g. ba-mai L18-22). Deleted view-front/left/right/back.png: git shows 4 per folder in all 13 NPC folders (52 total). No README lists view-* (0 hits).

### assets/garments/*/README.md x10 CHAR, DEL
(ao-tu-than, ao-ngu-than-tay-chen, ao-ngu-than-tay-thung, ao-ngu-than-remix-2026, ao-dai-lemur, ao-dai-tan-thoi-vang-mo-ga, ao-dai-raglan, ao-dai-co-thuyen, ao-dai-cuoi-phin, ao-dai-popolin)
- ~3 hits each: L7 EN "Grayscale garment layer ..." (tu-than also "calibrated tonal gray keys ready for palette swapping"); L14 (L15 tan-thoi-vang-mo-ga) row `<id>.png | garment-layer | thang xam can chuan canvas`. Deleted `<id>.png` x10.
### assets/accessories/*/README.md x10 CHAR, DEL
(khan-van-den, khan-van-hoang-yen, khan-mo-qua, non-quai-thao, non-la, guoc-moc, hai-theu, kieng-bac, kinh-mat-meo, quat-lua)
- ~2 hits each: L5 sentence "Sprite lop deo tren nguoi duoc can dung vi tri tren canvas chuan" (confirmed in non-la; others UNVERIFIED individually); L13 row "can chuan canvas (loai accessory-layer)". Deleted `<id>.png` x10.
### Other asset READMEs
- items/**, motifs/**, fonts, audio: no numeric specs found (prose only). ICON keep. items/README type line UNVERIFIED.
- assets/ui-pixel, assets/branding, assets/palettes: no README (ls verified); palettes/ui.json and garment.json hold colours only.

## C. Indexes / data
- assets/index.md (0 pixel sizes; 129 typed rows L7-L129): types character-sprite / cat-sprite / paperdoll-layer / garment-layer / garment-thumb / accessory-layer / accessory-icon; L76-89 paperdoll rows (body-female-base, body-shadow, hair-front/back-bob/ponytail/bouffant/long, face-*, avatar-base) do not match files named in paperdoll/README.md (already stale); garment --icon rows (L91, L93, L95 ...). CHAR, DEL.
- assets/_migration.md L46 paperdoll mapping (name only). DEL-lite.
- data/asset-manifest.json: 241 entries, no size fields; spec-bearing field is `kind` (portrait 34, area-background 34, character-sprite 32, item-icon 29, vfx 19, area-overlay 16, paperdoll-layer 13, doc 11, garment-layer 10, garment-thumb 10, accessory-layer 10, accessory-icon 10, cg 6, cat-sprite 4, motif 3). 207 of 241 paths do not exist on disk (69 characters, 14 paperdoll, 10 garments, 10 accessories among them). Generated by scripts/audit_and_generate_manifest.py.
- data/asset-gaps.json: missingManifestPaths, no sizes; L4+ an/scene-*.png, L72-101 paperdoll/garments/accessories paths; notes near end (8:5, no portrait background for prologue). DEL.

## D. Other docs (light)
- docs/03-features/studio.md L30 800x500 8:5 x2; L31 ~380 px; L35 icon 48x48; L38 modal 560x420
- docs/03-features/closet-and-workshop.md L33 800x500 x2; L34 ~350 px; L37 800x500
- docs/03-features/museum.md L29 800x500 x2; hub.md L10 8:5 800x500 x2, L21 16:9, L74 hitbox 48x48
- docs/03-features/onboarding.md L12, L27 (not asset specs); docs/05-tech/core-api-for-ui.md L324 logical canvas 800x500 8:5 (L109/L208 nearestInteractable = false positive)
- docs/01-overview/summary.md L3, L15 16:9; docs/02-plan/roadmap.md L16 16:9; docs/06-design/README.md L7 summary-only; docs/02-plan/README.md L8 and deploy-cloud-run.md L126 false positives
- README.md (root): L29 "Sprite pixel that (NPC 64x96, ao, icon, khung 9-slice) dung pixel-native ... boi so nguyen", plus art-hires class (CHAR rewrite); L17 prose. metadata.json: no spec (grep clean).

## E. Scripts
- scripts/process-ai-asset.py (23): L6 kinds garment-an 176x416 anchor y=400, portrait 128x128, icon 48x48; L20 KINDS dict incl background (540,960); L132 colours <=32 default 24; L135-136 target-h 400, anchor-y 400. Already An-based. CODE keep.
- scripts/build_paperdoll_studio.py (14): L7 type paperdoll-layer, L10 EN "paperdoll sprite base", L57-67 garment-layer template (thang xam), L92-102 accessory-layer template (can chuan canvas). Regenerates the stale paperdoll/garment/accessory README text if re-run. CODE+CHAR.
- scripts/audit_and_generate_manifest.py (4): L20 comment "64x96, 800x500"; L73 kind list; L106-116 paperdoll/garments/accessories parse. CODE.
- scripts/audit-assets.py (4): L19-21 kind mapping (character-layer for /an/), L37-46 An layers + 176x416 crop + resize 88x208 NEAREST, L51 "An grid: 8x11, 176x416" (already new). CODE.
- scripts/build_characters.py L163 strips "64x96 pixels" from EN desc (stale ref). CODE.
- scripts/build-hotspot-cutouts.py L4, L18-19, L74: 800x500, 890x500, NEAREST x2 (BG keep). build_all_areas.py: false positive.
- scripts/pixel/normalize-ui-images.py (11): L3 backs up to _raw/STEM-hires.png; L27-35 TARGETS (512,171), (384,128), (128,128), (793,496), (572,688), (793,496), (724,241), (793,496), (887,443) = exactly the 9 files now replaced by raws, so re-running would downscale them again; L8, L74 colours 2..32. SCREEN/CODE, DEL.
- scripts/pixel/extend-prologue-16x9.py L1 800x500 -> 890x500, band 45 (L23), 400x250 doc skip (L9). BG keep.
- scripts/pixel/pixel-grid.py (36): L3 grid JSON w/h/palette; L114 --max-colors 8; NEAREST preview. ICON/CODE.
- scripts/pixel/draw-c1-rooms.py (17): L5, L25 MAX_COLORS 32; room size W,H=640x360 (definition line UNVERIFIED). BG.
- Out of stated scope, found by regex: assets/src/pixel/{ui,c1}/*.grid.json (16 files, 1 hit each, icon/prop grids, ICON keep); src/content/*.json (studio.json 10, c1-c5 3-6 each) content UNVERIFIED.

## F. Rule violations (sub-README with specs, assets/README.md section 1)
- assets/screens/{README, main-shop, museum, studio, wardrobe, workshop}/README.md: sizes, slices, colour caps, render rule, prompts with grid (all 6)
- assets/areas/chapter-1/README.md + 2 room READMEs: sizes (all BG, real)
- assets/paperdoll/README.md (mild); garments/* L14 and accessories/* L13 "can chuan canvas" (mild); characters/* clean
- Also bake sizes: screens/*.md prompt files, _raw/generation.json x3, layout-edit json x2

## Totals
- Files with real spec claims: ~72 in scope (97 matched the loose regex; ~25 false positives or prose). ~66 md, 6 json (+16 grid.json, src/content out of scope), 11 py.
- Spec-claim lines (approx): assets/README 48, design-system 29, screens READMEs ~62, game-implementation 17, gemini prompts 21, decisions 9, chapter-1 10, scripts ~80, paperdoll 4 (+18 DEL rows).
- Files referencing deleted assets: paperdoll README, 10 garments, 10 accessories, index.md, 2 data json, gemini prompts L46, normalize-ui-images.py, 4 screens READMEs/_raw refs.

## Suggested edit batches (non-overlapping)
1. Core spec: assets/README.md, docs/06-design/design-system.md, docs/01-overview/decisions.md, root README.md, docs/05-tech/game-implementation.md (L13, L85), assets/_migration.md.
2. Character tree: assets/paperdoll/README.md, assets/characters/README.md + 13 NPC READMEs, assets/index.md, data/asset-manifest.json, data/asset-gaps.json, docs/06-design/ai-studio/gemini-ui-asset-prompts.md (L46, L102), scripts/build_paperdoll_studio.py, build_characters.py, audit_and_generate_manifest.py, audit-assets.py.
3. Garments/accessories + features: 10 garments + 10 accessories READMEs (templated, 1-3 lines each), docs/03-features/{studio,closet-and-workshop,museum,hub}.md.
4. Screens/BG/scripts: assets/screens/** (6 READMEs, 3 prompt .md, 3 asset-manifest.json, 3 generation.json, 2 layout-edit json, welcome README), assets/areas/chapter-1 (3 READMEs), scripts/pixel/normalize-ui-images.py.

## Unresolved
- Manifests and README tables have no entries for the 9 replaced raws; sizes only from caller.
- Portrait background conflict: design-system 270x480 vs screens READMEs 320x480 (main-shop generation.json L10 acknowledges).
- Unverified: individual accessory README L5 wording; items README type; prologue README mentions of deleted PNGs; src/content/*.json hits.
