# Phase 06 — hub-sign-glow-and-scene-cleanup

## Context Links
- Plan: ./plan.md · Brainstorm §4.1 (Hub DOM) · Scout report

## Overview
- Priority: high · Status: completed · Effort: 0.5 ngày
- Depends on: 02 (keyframe `px-pulse`), 04 (phòng đã chuyển sang RoomScene)

## Key Insights
- Scene.tsx đã tính `near` cho hub (bán kính 64) và lưu vào state `target`. Chỉ cần truyền `highlighted` xuống AreaSign.
- Biển là `<button class="area-sign">` chứa ảnh hi-res. Viền sáng làm bằng CSS `filter: drop-shadow` 4 hướng, blur 0 (MDN: drop-shadow không có spread). Chưa kiểm phần tử có `rotate` → kiểm bằng mắt.
- Sau phase 04, nhánh phòng trong Scene.tsx thành dead code do plan này tạo ra, nên phải xoá. `scripts/check-game.ts:30,50` đang dùng `worlds[area.id]` của phòng nên phải sửa cùng.

## Requirements
- `AreaSign`: prop `highlighted?: boolean` → class `is-highlighted` + `aria-describedby`? Không cần: giữ đơn giản, chỉ class.
- `hub.css`:
  ```css
  .screen-hub .area-sign.is-highlighted img{
    filter: drop-shadow(2px 0 0 var(--c-warm-gold)) drop-shadow(-2px 0 0 var(--c-warm-gold))
            drop-shadow(0 2px 0 var(--c-warm-gold)) drop-shadow(0 -2px 0 var(--c-warm-gold))
            drop-shadow(0 0 0 #fff8ee);
    animation: px-pulse .8s steps(2) infinite;
  }
  ```
  Thêm sparkle nhỏ ở góc biển bằng `::after` + `SPARKLE` data URL (tuỳ chọn). Bỏ animation khi reduced-motion (nhánh có sẵn trong motion.css).
- Prompt hub: giữ nút `.interaction-prompt` hiện tại (E · tên khu).
- **Dọn Scene.tsx** về chỉ còn hub:
  - Bỏ tải nền phòng, overlay, mèo, vfx, `nearestInteractable`, nhánh `onInteract`.
  - Giữ chữ ký props (`hub`, `onInteract`) để Game.tsx không phải sửa. Ghi comment "story rooms render in RoomScene".
- `physics.ts`: xoá `worlds` của 2 phòng prologue.
- `scripts/check-game.ts`:
  - Thay kiểm reachability phòng bằng: mọi `interactable.rect` nằm trong [0,1], mọi `exitArrows` tham chiếu hợp lệ.
  - Giữ kiểm hub (dòng 47).

## Related Code Files
**Modify:** `src/game/Scene.tsx`, `src/game/physics.ts`, `src/game/AreaSign.tsx`, `src/game/hub.css`, `scripts/check-game.ts`

## Existing code audit
REUSE-EXTEND `AreaSign`, `Scene` (`near`). REUSE-AS-IS `px-pulse` (phase 02).

## Reuse strategy
REUSE-EXTEND. Không tạo file mới.

## Implementation Steps
1. AreaSign prop + class. Scene truyền `highlighted={target===d.id}`.
2. CSS glow + pulse. Kiểm bằng mắt ở 1366 và 1920 (biển xoay −18°…24°).
3. Xoá nhánh phòng trong Scene.tsx và worlds phòng. Sửa check-game.ts.
4. `npm run lint`, `npm run test:core`.

## Todo List
- [x] AreaSign highlighted
- [x] hub.css glow
- [x] Scene.tsx chỉ còn hub
- [x] physics.ts + check-game.ts
- [x] lint + test:core

## Success Criteria
- Đi An tới gần "Tủ đồ" thì biển đó có class `is-highlighted`; đi ra xa thì mất.
- Scene.tsx ngắn hơn rõ (mục tiêu < 200 LOC). `grep -n "areaAsset\|nearestInteractable" src/game/Scene.tsx` không còn kết quả.
- `test:core` xanh.

## Risk Assessment
drop-shadow trên ảnh 2048px thu nhỏ có thể tốn GPU khi pulse → chỉ áp cho biển đang highlight (tối đa 1).

## Next Steps
Phase 07.
