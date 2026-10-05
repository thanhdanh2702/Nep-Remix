# Phase 03 — character-scale-and-layers

## Context Links
- Plan: ../plan.md
- Brainstorm: ../../reports/brainstorm-261005-2041-an-anchored-asset-spec.md
- Reuse scout: ../../reports/reuse-scout-261005-2056-scale-walk-codex.md
- Stack skills: `/frontend-development`, `/react-best-practices`

## Overview
- Priority: critical · Status: completed · Effort: 4h

## Key Insights
- Kích thước nhân vật đang được quyết định ở nhiều nơi rời rạc:
  - `Scene.tsx:128` `spriteScale=.30`.
  - `assets.ts` `AN.scale 0.25`, hằng số này không còn ai dùng.
  - `room-render.ts:34` `NPC_W/H 64×96`.
  - `DialogueBox.tsx:9-16` dùng `pixelScale` ép sprite 96·n.
  - `journey-map.css` `--char-h: 96px`.
  - `StudioCharacter.tsx:14-20` kéo dải áo ×3 ngang ×4 dọc.
- Toàn bộ file 64×96 đã bị xóa. Code cho dải áo 64×96 giờ chỉ là nhánh fallback, phải viết lại theo spec An.

## Requirements
**Functional:**
- Tạo `src/game/character-scale.ts` (file mới, thuần hàm, không đụng DOM):
  - `AN_FIGURE_H = 389`.
  - `HUMAN_HEIGHT`: bảng cảnh → `{ back, front, floorTop, floorBottom }`, giá trị là tỉ lệ so với chiều cao nền. Các khóa: `c0`, `c1`, `hub`, `studio`, `closet`, `workshop`.
  - `characterScale(scene, bgH, footY?)` trả về số px world trên mỗi px art của An. Nếu có `footY` thì nội suy tuyến tính từ `back` đến `front` theo vị trí trong dải sàn.
  - `spriteScaleFor(img)`: NPC theo spec An (`naturalHeight` 416) dùng chung scale với An. Sprite 32/96 cũ (nếu có) thì quy về cùng chiều cao dáng người.
- `Scene.tsx` (Sảnh): bỏ `spriteScale`, gọi `characterScale('hub', 625)`.
- `assets.ts`: xóa `AN.scale`.
- `DialogueBox.tsx`: An và NPC theo spec An vẽ cùng một chiều cao khung; bỏ quy tắc 96·n.
- `JourneyMap.tsx` và `journey-map.css`: chân dung NPC và An cùng cao `--char-h` theo dáng 389. NPC theo spec An vẽ có làm mịn (smoothing), bỏ `pixel-native`.
- `StudioCharacter.tsx`:
  - Áo và phụ kiện theo spec An (dải 528×416, ô 0 front, 1 side, 2 back; `right` thì lật ô side) vẽ thẳng lên khung An, không nhân hệ số.
  - Xóa `GARMENT_BAND`, `FRONT_X`, `SIDE_X`, `FACTOR_Y`, `ANCHOR_X`, `ACCESSORY_TOP`, vì không còn file 64×96 nào dùng chúng.
  - `recolorLayer` chuyển sang gradient-map: lấy độ sáng của điểm ảnh, ánh xạ qua 4 màu palette từ tối đến sáng, giữ alpha.
- `StudioWardrobe.tsx` `GarmentLayerPreview`: lấy ô front 176×416, cắt theo `bounds`, rồi vẽ thu nhỏ.
- `MannequinStage.tsx`: giữ `footRatio`. Chỉ sửa nếu chiều cao mặc định cần lấy từ `characterScale('studio')`.

**Non-functional:**
- Không làm tròn hệ số scale. Chỉ làm tròn tọa độ cuối cùng về px màn hình.
- Các fallback hiện có vẫn hoạt động khi asset chưa về: emblem cho NPC, icon cho áo, An mặc outfit gốc.

## Related Code Files
**Create:** `src/game/character-scale.ts`
**Modify:** `src/game/assets.ts`, `src/game/Scene.tsx`, `src/game/DialogueBox.tsx`, `src/game/JourneyMap.tsx`, `src/game/journey-map.css`, `src/game/StudioCharacter.tsx`, `src/game/StudioWardrobe.tsx`, `src/game/MannequinStage.tsx`, `src/game/stage-embed.css` (nếu có `--char-h` hoặc chiều cao cứng)
**Không đụng:** `room-render.ts`, `RoomScene.tsx` (thuộc phase 04)

## Existing code audit
`pixel-scale.ts` `drawPixelSprite` (dùng lại), `scene-view.ts` `computeCamera` (dùng lại, `reach` lấy từ scale mới), `DialogueBox` `pixelScale` (thay thế), `StudioCharacter` `outfitLayer` (giữ, dùng cho outfit gốc của An).

## Reuse strategy
REUSE-EXTEND. Hàm vẽ sprite và camera giữ nguyên. Chỉ thay các nguồn số scale bằng `characterScale`.

## Implementation Steps
1. Viết `character-scale.ts` với bảng `HUMAN_HEIGHT` dùng số khởi điểm trong plan.md. Các cảnh `studio`, `closet`, `workshop` tạm để 0,55 (An là trung tâm màn).
2. Đổi Sảnh sang dùng helper. Kiểm tra camera `reach`.
3. Sửa DialogueBox và JourneyMap.
4. Viết lại phần vẽ layer áo và phụ kiện ở Studio cùng `recolorLayer` gradient-map; xóa các hằng số không còn dùng.
5. Chạy `npm run lint`, `npm run test:core`, và `npx playwright test tests/browser/studio.spec.ts tests/browser/journey-map.spec.ts tests/browser/game.spec.ts`.

## Todo List
- [x] character-scale.ts
- [x] Sảnh
- [x] DialogueBox
- [x] JourneyMap
- [x] Studio layers + gradient-map
- [x] lint/test

## Success Criteria
- `grep -rn "spriteScale\|AN.scale\|NPC_H\|FACTOR_Y\|GARMENT_BAND" src` không còn kết quả, trừ trong `room-render.ts` (phase 04 dọn).
- Ở Sảnh, An cao 15% ±1% chiều cao world (đo bằng Playwright từ `data-*` hoặc pixel bbox).
- Lint pass; các test browser liên quan pass. Test chỉ được sửa khi nó khẳng định spec cũ.

## Risk Assessment
- Gradient-map đổi màu của outfit hiện có. Rủi ro thấp vì `outfitLayer` gốc của An vẫn dùng đường tô màu cũ; chỉ layer áo mới dùng gradient-map.

## Next Steps
Mở khóa phase 04 (phòng truyện dùng `characterScale`) và phase 06.
