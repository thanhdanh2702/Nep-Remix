# Phase 03 — workshop-tab

## Context Links
- Plan: ./plan.md · Stack: `/frontend-development`

## Overview
- Priority: high · Status: pending · Est. effort: 3 h · Depends on: 01 (song song 02)

## Key Insights
- `Closet` (`src/game/Rooms.tsx`, 23 dòng dài) có tabs `garments|saved|shop` và prop `onStudio(draft)` mở Phòng phối đồ với draft.
- Server `analyze-garment` body `{ imageBase64, mimeType? }` → `isVietnameseAoDai`; nếu true: `identifiedSilhouette`, `garmentId`, `collarType`, `patternType`, `dominantColorHex`, `secondaryColorHex`; nếu false: `garmentCategory` (`qipao_cheongsam|hanbok|khac`), `differentiationTitle`, `differentiationExplanation`, `differentiationCardId`. Fallback `{reason, manualTailoring, message, defaultGarmentId}`. Xác minh lại tên field trong `src/server/ai/analyze-garment.ts` trước khi code.
- `makeDraft(garment)` (`Studio.tsx`) tạo draft; palette 4 màu.

## Requirements
**Functional:**
- Tab mới **"Xưởng may"** trong Tủ đồ → component `Workshop`:
  - Vùng tải ảnh (chọn/thả) + preview + nút **"Nhờ Gemini xem áo"**; ghi chú "Ảnh chỉ dùng để nhận diện, không được lưu."
  - Đang chạy: "Máy may đang soi từng đường chỉ…"; `AiStatusBadge` sau khi có kết quả.
  - Áo dài: tên dáng (`content.garmentsById.get(garmentId)?.name`), cổ + hoa văn (nhãn tiếng Việt), 2 ô màu; nút **"Phối thử trong Phòng phối đồ"** → `onStudio(draft)`; garment = `garmentId` nếu đã mở khóa, nếu không → garment mở khóa cùng silhouette, rồi `unlockedGarmentIds[0]`, kèm ghi chú "Dáng này chưa có trong tủ"; palette = `[dominant, secondary, darken(dominant), darken(secondary)]`, chỉ nhận hex hợp lệ, không hợp lệ → palette mặc định của garment.
  - Áo nước khác: thẻ "Đây là <title>" + explanation.
  - Fallback: badge offline + message + nút **"Tự chọn trong Phòng phối đồ"** → `onStudio(makeDraft(garment mở khóa đầu tiên))`.
- Rời tab / chọn ảnh khác → xóa preview + kết quả, abort request.

## Related Code Files
**Modify:** `src/game/Rooms.tsx` (thêm tab + render `<Workshop>`)
**Create:** `src/game/Workshop.tsx`, `src/game/workshop.css`, `tests/browser/workshop.spec.ts`

## Existing code audit
| File:line | Fit | Verdict |
|---|---|---|
| Rooms.tsx Closet tabs + onStudio | 100% | REUSE-EXTEND |
| Studio.tsx makeDraft | 100% | REUSE-AS-IS |
| ai-client.ts, AiStatusBadge.tsx | 100% | REUSE-AS-IS |
| src/ui/image-upload.ts (phase 01) | 100% | REUSE-AS-IS |
| server types analyze-garment.ts | 100% | chỉ `import type` |

## Reuse strategy
REUSE-EXTEND Closet; FORK-NEW `Workshop.tsx` (≤ 150 LOC).

## Implementation Steps
1. Workshop.tsx + workshop.css (token, class pixel có sẵn).
2. Rooms.tsx thêm tab `{id:'workshop',name:'Xưởng may'}`.
3. `workshop.spec.ts` (mock): (a) mở tab, chọn ảnh → 0 request AI cho tới khi bấm; (b) áo dài ok → thẻ + "Phối thử" mở Studio với garment đúng; (c) hanbok → thẻ phân biệt; (d) HTTP 500 → fallback + "Tự chọn" mở Studio; (e) body JPEG, cạnh dài ≤ 768.
4. lint, build, test:core, `workshop.spec` + `game.spec`.

## Todo List
- [x] Workshop.tsx + workshop.css
- [x] tab trong Rooms.tsx
- [x] workshop.spec.ts 5 case
- [x] lint/build/test pass

## Success Criteria
- 5 case pass; `game.spec.ts` (shop/closet) vẫn pass; `dist/` không chứa SDK Gemini.

## Test Spec
Integration như bước 3.

## Risk Assessment
- Tab thứ 4 tràn hàng trên mobile 390 px → kiểm 390×844 và 844×390.
- `garmentId` không có trong content → coi như chưa mở khóa.

## Security Considerations
- Chỉ render text từ AI (không HTML); hex validate trước khi dùng làm style.
