# Phase 04 — room-an-walk-npc-facing

## Context Links
- Plan: ../plan.md · Phase 03 (`character-scale.ts`)
- Reuse scout: ../../reports/reuse-scout-261005-2056-scale-walk-codex.md
- Stack skill: `/frontend-development`

## Overview
- Priority: high · Status: completed · Effort: 4h

## Key Insights
- Phòng truyện chỉ vẽ nền, NPC ×1, mèo 32 px, vfx và highlight. Không có An (`room-render.ts:80-136`).
- `RoomScene` đã có vòng lặp rAF với `t` và chữ ký vẽ lại `sig`. Có thể đưa vị trí An vào `live` ref, không cần thêm tween DOM.
- `physics.ts` chỉ phục vụ Sảnh (WASD), không dùng được cho phòng.

## Requirements
**Functional:**
- **Vẽ An trong phòng:**
  - Ghép 13 layer của An theo `anLayerPath` và preset của người chơi vào một canvas tạm 176×416 cho mỗi frame, có cache. Dùng cùng logic với `npc-portraits.ts`.
  - Kích thước theo `characterScale(chapter, bgH, footY)`.
  - Vẽ có smoothing; lớp vẽ nằm sau NPC phía trước nhưng trước nền. Đơn giản hóa thứ tự: sắp theo `footY`.
- **Vị trí bắt đầu:** điểm vào phòng (cạnh mũi tên thoát vừa đi qua, hoặc giữa mép dưới), kẹp trong dải sàn `floorTop..floorBottom`.
- **Bấm vật:**
  - Đích = điểm giữa đáy của rect vật, lệch sang một bên để An đứng cạnh chứ không đè lên vật. Kẹp vào dải sàn.
  - An đi tới đích với tốc độ khoảng 0,35 chiều rộng world mỗi giây, dùng frame đi bộ `AN.walk` và hướng theo `AN.directions`.
  - Đến nơi thì quay về hướng của vật rồi mới gọi lệnh tương tác hiện có.
  - Nếu `prefers-reduced-motion` thì dịch chuyển tức thì.
  - Bấm vật khác trong lúc đang đi thì đổi đích. Bấm lại đúng vật đang đi tới thì không gọi lệnh hai lần.
- **Bàn phím và trình đọc màn hình:** Tab hoặc Enter trên nút hotspot vẫn gọi lệnh như cũ (An đi tới bằng hiệu ứng, lệnh vẫn chạy). Không được chặn khả năng truy cập.
- **NPC:**
  - Bỏ `NPC_W/H/PITCH 64×96`. NPC vẽ theo `characterScale`.
  - Chọn `view-left`, `view-right` hoặc `view-back` dựa vào vị trí của An so với NPC. Khi An đứng cạnh để nói chuyện thì NPC quay mặt về phía An. Thiếu file thì dùng `view-front`; thiếu cả `view-front` thì không vẽ, như hiện nay.
- **Mèo:** khung 128×128 theo spec mới, cao bằng khoảng 26% chiều cao An. Chưa có file thì không vẽ, như hiện nay.

**Non-functional:**
- Không thêm lần vẽ lại thừa: chỉ vẽ lại khi An đang đi hoặc khi `sig` đổi.
- Hiệu năng: chỉ ghép layer An một lần cho mỗi preset và frame.

## Related Code Files
**Modify:** `src/game/room-render.ts`, `src/game/RoomScene.tsx`, `src/game/room-scene.css` (nếu cần con trỏ hoặc lớp phủ)
**Create:** `src/game/room-walker.ts` (logic thuần: đích, kẹp sàn, bước đi, chọn hướng; dưới 120 dòng)
**Không đụng:** `character-scale.ts` (phase 03; phase 06 mới chỉnh số)

## Existing code audit
- `npc-portraits.ts` `anLayerPath`: dùng lại.
- `DialogueBox` có sẵn cách ghép An thành canvas đứng. Nếu tách được hàm ghép mà không cần đổi DialogueBox thì dùng lại.
- `scene-view.ts` `drawPixelSprite`: dùng lại.
- `AN.walk`, `AN.idle`, `AN.directions`: dùng lại.

## Reuse strategy
FORK-NEW cho phần đi bộ trong phòng (`room-walker.ts`). REUSE-AS-IS cho phần ghép layer An và bảng frame của An.

## Implementation Steps
1. Viết `room-walker.ts`: `targetFor(rect, floor, side)`, `step(pos, target, dt, speed)` trả về `{pos, dir, arrived}`, `facing(from, to)`.
2. RoomScene: thêm `walker` vào `live` ref. Khi bấm hotspot thì đặt đích; lệnh tương tác chạy sau khi An tới nơi.
3. room-render: thêm `drawAn(ctx, comp, pos, scale, frame)`; sắp An và NPC theo `footY`; NPC chọn hướng.
4. Viết lại các test browser phụ thuộc thời điểm: chờ dialog xuất hiện, không giả định dialog mở ngay lập tức.
5. Chạy `npx playwright test tests/browser/game.spec.ts tests/browser/chapter1.spec.ts tests/browser/ui-polish.spec.ts` và `npm run test:core`.

## Todo List
- [x] room-walker.ts
- [x] RoomScene wiring
- [x] room-render drawAn + NPC facing + scale
- [x] tests

## Success Criteria
- Canvas phòng có thuộc tính `data-an-x`, `data-an-y`, `data-an-h`. Ở phòng mở đầu, sau khi bấm vật, `data-an-h` nằm trong khoảng 38–50% chiều cao world.
- Bấm vật thì An di chuyển rồi dialog mở. Với reduced motion, dialog mở ngay mà không có hoạt ảnh.
- `chapter1.spec` và `game.spec` pass. Không có lỗi console.

## Risk Assessment
- **Test không ổn định vì phải chờ An đi:** dùng `expect(...).toBeVisible()` có timeout và rút ngắn quãng đi khi chạy test (tốc độ cố định, quãng ngắn).
- **Dải sàn sai thì An đứng trên tường:** phase 06 chụp ảnh và chỉnh `floorTop/floorBottom`.

## Next Steps
Phase 06.
