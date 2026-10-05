# Phase 05 — museum-codex

## Context Links
- Plan: ../plan.md
- Reuse scout: ../../reports/reuse-scout-261005-2056-scale-walk-codex.md
- Stack skill: `/frontend-development`

## Overview
- Priority: medium · Status: completed · Effort: 3h

## Key Insights
- Hiện tại `state.museum` chỉ lưu thẻ văn hóa. Danh sách nhân vật đã gặp có thể suy ra từ `journey[ch].completedDialogueIds` cộng với `speaker` của các node trong `content.chapters`. Vật phẩm thì có `inventory.itemIds`, nhưng vật đã dùng có thể đã bị bỏ khỏi túi.
- Hàm `portraitFor(speaker)` đã lo phần emblem khi chưa có ảnh nhân vật.
- 29 vật phẩm đều có icon 48×48. Ảnh NPC hiện chưa có (đang chờ gen lại).

## Requirements
**Functional:**
- Bảo tàng thêm 2 mục, đặt cạnh kệ sách hiện có, dùng nút hoặc tab theo đúng style Museum đang có:
  - **"Nhân vật":** liệt kê mọi speaker có trong content (bỏ An và các mục kiểu "Băng ghi âm").
    - Đã gặp: hiện chân dung (nếu đã có ảnh, lấy `view-front`, ngược lại dùng emblem), tên và chương.
    - Chưa gặp: hiện bóng đen cùng "???".
  - **"Kỷ vật":** 29 vật phẩm.
    - Đã tìm thấy: icon, tên và mô tả lấy từ `items.json`.
    - Chưa tìm thấy: icon tô đen (silhouette) và "Chưa tìm thấy".
- **Thế nào là "đã gặp" / "đã tìm thấy":** ưu tiên suy ra từ state hiện có.
  - Nhân vật: speaker của các dialogue đã hoàn thành.
  - Vật phẩm: đang có trong `inventory.itemIds`, hoặc vật phẩm bị puzzle tiêu thụ và puzzle đó đã nằm trong `solvedPuzzleIds`. Đọc `items.json` và `puzzle-solution.ts` để xác định.
  - Nếu không suy ra chính xác được thì thêm `museum.foundItemIds`, ghi khi nhặt vật, có migration mặc định `[]` trong `invariants`/`serialize`. Phải ghi lý do vào báo cáo cook.
- Dùng được bằng bàn phím: các mục là `button`, có `aria-label`.

**Non-functional:**
- Màn hình điện thoại 390 px: lưới 3 cột. Màn 1366 px: 6 cột.
- Icon vật phẩm hiển thị theo bội số nguyên (48 → 96).

## Related Code Files
**Create:** `src/game/MuseumCodex.tsx`, `src/game/museum-codex.css`, `src/game/museum-codex-data.ts` (các hàm thuần suy ra danh sách đã gặp/đã tìm thấy)
**Modify:** `src/game/Museum.tsx` (mount, nút mở), `src/game/museum.css` (chỉ khi cần), `src/core/state.ts`, `src/core/invariants.ts`, `src/core/history/serialize.ts` (chỉ khi phải thêm `foundItemIds`)
**Test:** `tests/browser/museum.spec.ts` (thêm case)

## Existing code audit
`Museum.tsx` (layout kệ và modal sách), `portraitFor`, `itemAsset`, `content.itemsById`, `state.inventory`, `completedDialogueIds`.

## Reuse strategy
REUSE-EXTEND. Thêm một view mới vào Museum, không đổi cấu trúc state nếu có thể tránh.

## Implementation Steps
1. Viết `museum-codex-data.ts`: `metSpeakers(state, content)` và `foundItems(state, content)`. Kèm tự kiểm tra trong `scripts/check-core.ts` nếu file đó có chỗ cho check thuần.
2. Viết `MuseumCodex.tsx` cùng CSS.
3. Gắn vào `Museum.tsx`.
4. Thêm test browser: save mới thì toàn bộ là bóng đen; chơi xong phần mở đầu thì Mèo Nếp, Bóng mờ Ông Lệ và các kỷ vật mở đầu hiện ra.

## Todo List
- [x] data helpers
- [x] UI
- [x] mount
- [x] tests

## Success Criteria
- Mục Nhân vật liệt kê đủ mọi speaker của prologue và c1–c5. Mục Kỷ vật đủ 29 vật phẩm.
- Test museum pass. Lint pass.

## Risk Assessment
- **Tên speaker không thống nhất** (ví dụ "Cô Phương" và "Mẹ Phương"): gộp theo `sprite id` trong `npc-portraits`.

## Next Steps
Phase 06 chụp màn Sổ tay.
