# Phase 01 — engine-16x9-prologue

## Context Links
- Plan: ./plan.md

## Overview
- Priority: high · Status: pending · Est. effort: 5–6 h

## Key Insights (khảo sát 05/10)
- Rect interactable / exitArrow chuẩn hóa 0..1 (`schema.ts:331-336`); `hitOf` nhân với stage box, tối thiểu 44 px (`RoomScene.tsx:15,28-32`); hotspot = button DOM trong suốt (`RoomScene.tsx:183-190`).
- Hard-code: `RoomScene.tsx:14,17` (glob cutout chỉ `prologue/`), `:48` (`areaId.includes('s1-')` khớp nhầm `c1-s1-…` → mèo + bụi shop), `:88-94` (stage `w=min(W,H*1.6)`, `h=w*.625`), `:108-110` (đường dẫn `assets/areas/prologue/`), `:154` (`k=surface.width/800`), `:181` (`data-world-width="800"`); `room-render.ts:7,69,73-75` (fit nền vào 800×500), `:24-28` (overlay theo puzzle prologue), `:53-56` (VFX foot px), `:82` (mèo tại 616,426); `assets.ts:36-38` `areaAsset()` → `assets/areas/prologue/${id}/${id}--phai.png`; `schema.ts:377-381` `aspect: z.literal('8:5')`, `logicalSize` literal 800/500 (6 file chapter dùng); `scripts/build-hotspot-cutouts.py:18,56-57` `WORLD=(800,500)`.
- `asset()` throw khi thiếu file; `loadImage` cần entry trong `data/runtime-assets.json`.

## Requirements
- World size theo phòng = kích thước ảnh nền của phòng (đọc từ registry/ảnh), stage aspect = world aspect; bỏ mọi hằng 800/500/1.6 trong engine phòng. `data-world-width/height` phản ánh giá trị thật.
- `areaAsset(chapterFolder, areaId)` tổng quát: đường dẫn theo chương (`prologue` | `chapter-1` …) suy từ chapter id; cutout glob mọi chương; phòng không có cutout → highlight bằng khung rect (đã có cơ chế Soi bracket — dùng lại).
- Sửa phát hiện `s1` thành so khớp id đầy đủ của phòng prologue (`c0-s1-…`).
- Schema: `aspect`/`logicalSize` không còn literal 8:5/800×500 (cho phép `16:9` và giá trị số); cập nhật 6 chapter JSON cho hợp lệ (prologue `890×500`, c1 `320×180`, c2–c5 giữ giá trị hợp lệ bất kỳ đang dùng).
- **Prologue 16:9 vẽ bằng code:** `scripts/pixel/extend-prologue-16x9.py` — với mỗi ảnh `assets/areas/prologue/**` 800×500 (nền `--phai/--trai`, overlay, CG): tạo 890×500, đặt ảnh gốc ở x=45, vẽ dải 45 px mỗi bên bằng code (kéo dài tường/sàn theo màu cột rìa đã lượng tử hóa vào palette của ảnh, thêm chi tiết pixel: cột gỗ, rèm/khung cửa, bóng đổ tối dần ra mép). Ghi đè file tại chỗ (bản cũ còn trong git). `hotspots.json` + `build-hotspot-cutouts.py`: `WORLD=(890,500)`, bbox x += 45.
- Migrate rect `prologue.json`: `x' = (45 + x·800)/890`, `w' = w·800/890` (y, h giữ); hằng world-px trong `room-render.ts` (mèo, VFX) x += 45.
- `npm run audit:assets` regenerate `data/runtime-assets.json`.

## Related Code Files
**Modify:** `src/game/RoomScene.tsx`, `src/game/room-render.ts`, `src/game/hotspot-highlight.ts` (nếu có hằng), `src/game/assets.ts`, `src/content/schema.ts`, `src/content/chapters/*.json` (chỉ trường aspect/logicalSize + rect prologue), `scripts/build-hotspot-cutouts.py`, `assets/areas/prologue/**`, `data/runtime-assets.json` (generated), `tests/browser/game.spec.ts` (chỉ assert `data-world-width`), `tests/browser/journey-map.spec.ts` (chỉ assert `data-world-width`)
**Create:** `scripts/pixel/extend-prologue-16x9.py`

## Reuse strategy
REUSE-EXTEND engine hiện có; script mở rộng ảnh là FORK-NEW (Pillow, như `process-ai-asset.py`).

## Implementation Steps
1. Engine tổng quát (world từ nền, path theo chương, glob cutout mọi chương, sửa s1).
2. Schema + chapter JSON aspect/logicalSize.
3. Script nới 16:9, chạy, xem preview ×2 của 2 nền `--phai` (crop vùng mép) — tối đa 3 vòng chỉnh.
4. Migrate rect + cutout + hằng px; chạy `build-hotspot-cutouts.py`; `audit:assets`.
5. lint, test:core (check-game rect 0..1), test:assets, `game.spec` + `journey-map.spec` + `ui-polish.spec`.

## Todo List
- [ ] engine theo phòng
- [ ] schema + JSON
- [ ] script nới 16:9 + art
- [ ] migrate rect/cutout/hằng
- [ ] audit:assets
- [ ] test pass

## Success Criteria
- Phòng prologue: `data-world-width="890"`, tỉ lệ canvas 1.78 ±0.01 ở 1920×1080; bấm hết prologue (`game.spec` point-and-click + full prologue) pass; Tab order vẫn bắt đầu `hitbox-table`.
- Không còn `800`/`500`/`1.6`/`'prologue/'` cứng trong `RoomScene.tsx`, `room-render.ts`, `assets.ts` (grep).

## Risk Assessment
- Overlay/CG cũng phải nới cùng offset, nếu không sẽ lệch → script xử lý mọi ảnh 800×500 trong `assets/areas/prologue/`.
- Ảnh doc 400×250 giữ nguyên (không phải nền).

## Next Steps
Phase 02 vẽ nền c1 vào engine đã tổng quát.
