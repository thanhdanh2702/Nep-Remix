# Phase 04 — c1-gameplay-ui

## Context Links
- Plan: ./plan.md · Stack: `/frontend-development`

## Overview
- Priority: high · Status: pending · Est. effort: 4–5 h · Depends on: 03

## Key Insights (khảo sát 05/10)
- `Game.tsx:115-121` `selectChapter` đưa mọi chương ≠ prologue vào modal "đang được chuẩn bị" (`:118`, modal `:190`). c1 mở khi prologue `chapter/complete` (`chapter-commands.ts:194-203`); `chapter/enter` cần status ≠ `locked`.
- Không có UI `item/combine`. Modal puzzle chỉ hiện picker item cho puzzle `use` (`Game.tsx:186`) → puzzle `present` luôn gửi rỗng. Puzzle `styling` (`hasSession`) mở `activeSession` (`interact-command.ts:221`) không có UI đóng.
- Hằng prologue trong Game.tsx: `:107-110` auto-complete theo `d-c0-ba-dan-do`, `:134` `d-c0-stairs`, `:186` nhãn "Gỡ tấm vải phủ", `:191` CG kết prologue.
- `game.spec.ts:67-72` mong modal "Cụ Nguyễn Thị Cầm" + "Trở về bản đồ" khi bấm c1 → phải đổi.

## Requirements
- Mở c1 khi đã mở khóa; chương 2–5 vẫn modal "đang chuẩn bị".
- Túi đồ: chọn 2 vật → "Ghép" (`item/combine`), toast kết quả.
- Modal puzzle: picker item cho cả `use` và `present`; `styling` → mở Phòng phối đồ ở chế độ thử thách (dùng `Studio` với `initial` draft + nút "Trình diện" gửi `puzzle/submit`), hủy → đóng session.
- Hằng prologue trong Game.tsx tổng quát theo chương (nhãn puzzle lấy từ content; auto-complete theo dialogue kết chương khai báo trong content; CG kết: c1 dùng thẻ kết chương bằng CSS/pixel art có sẵn — không cần ảnh mới).
- Màn kết c1: tóm tắt clue + phần thưởng Sen Ngọc (theo content), "Trở về bản đồ".
- Nếu `Game.tsx` > 200 LOC → tách phần puzzle/inventory ra `src/game/PuzzleModal.tsx` / `InventoryCombine.tsx`.

## Related Code Files
**Modify:** `src/game/Game.tsx`, `src/game/Studio.tsx` (chỉ thêm prop chế độ thử thách nếu cần), `tests/browser/game.spec.ts` (chỉ case c1 dòng 67-72)
**Create:** `src/game/PuzzleModal.tsx`, `src/game/InventoryCombine.tsx`, `tests/browser/chapter1.spec.ts`

## Reuse strategy
REUSE-EXTEND Game/Studio/Modal; tách component mới khi vượt 200 LOC.

## Implementation Steps
1. selectChapter mở c1.
2. PuzzleModal (use/present/styling) + InventoryCombine.
3. Tổng quát hằng prologue; màn kết c1.
4. `chapter1.spec.ts`: hoàn thành prologue nhanh (seed save hợp lệ qua localStorage hoặc chơi nhanh) → vào c1 → chơi hết bằng click → màn kết; mobile 844×390 nút ≥ 44 px.
5. Sửa `game.spec.ts:67-72` theo hành vi mới.
6. lint, build, test:core, toàn bộ test:browser, test:assets.

## Todo List
- [ ] mở c1
- [ ] PuzzleModal + InventoryCombine
- [ ] tổng quát hằng + màn kết
- [ ] chapter1.spec
- [ ] game.spec c1 case
- [ ] full test pass

## Success Criteria
- `chapter1.spec` chơi hết c1 bằng UI; full `test:browser` pass; `Game.tsx` ≤ 200 LOC.

## Risk Assessment
- Session styling treo → luôn có nút hủy; corrupt-save test hiện có vẫn pass.

## Next Steps
Plan pixel UI kit (dialog frame, icon HUD, chuẩn hóa 9 ảnh hi-res).
