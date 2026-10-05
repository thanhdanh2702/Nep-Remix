# Phase 02 — pixel-art-highlight-lib

## Context Links
- Plan: ./plan.md · Brainstorm §4.1, §5

## Overview
- Priority: high · Status: completed · Effort: 0.75 ngày

## Key Insights
- Asset UI nhỏ vẽ bằng code (ma trận pixel) nên khớp lưới và không cần AI ảnh, đúng thể lệ Gemini-only.
- `PixelIcon.tsx` đã dùng SVG `crispEdges`. Theo đúng pattern đó nhưng xuất ra canvas hoặc data URL để dùng làm `cursor:` CSS và vẽ lên canvas.
- Outline cần **bake 1 lần** cho mỗi cutout. Mỗi frame chỉ vẽ ảnh đã bake với alpha thay đổi.

## Requirements
**`src/ui/pixel-art.ts`** (thuần, không phụ thuộc React):
- `type PixelGrid = string[]` (mỗi ký tự là một màu theo palette key, `.` là trong suốt) và `palette: Record<string,string>` (lấy UI_PALETTE: kem `FFF8EE`, vàng `E9B66B`, plum `2B2035`, hồng `A72D60`).
- `gridToCanvas(grid, palette, scale=1): HTMLCanvasElement` và `gridToDataUrl(...)`.
- Sprite định sẵn:
  - `ARROW_UP` 16×16, các hướng còn lại xoay từ ARROW_UP.
  - `CURSOR_DEFAULT`, `CURSOR_HAND`, `CURSOR_LOOK` (kính lúp), `CURSOR_EXIT`, mỗi cái 16×16.
  - `CORNER` 6×6.
  - `SPARKLE` 3 frame 7×7.
- `cursorCss(grid, hotspot): string` trả `url(data:...) x y, auto`, dùng scale ×2.

**`src/game/hotspot-highlight.ts`**:
- `bakeOutline(cutout: CanvasImageSource, w, h, color, px=1): HTMLCanvasElement`. Alpha dilation 8 hướng: vẽ cutout lệch ±px lên offscreen, `globalCompositeOperation='source-in'`, tô màu, rồi `destination-out` cutout gốc để chỉ còn viền. Viền 1 art-pixel, màu vàng `E9B66B`, thêm lớp kem 1px bên ngoài cho nổi trên nền tối.
- `drawBrackets(ctx, rect: {x,y,w,h} /*device px*/, t: number, n: number)`. Vẽ 4 góc từ `CORNER` ở scale nguyên `n`, nhịp thở 2 frame theo `t` (`steps`).
- `drawSparkle(ctx, x, y, frame, n)`.
- Không đọc DOM; toàn bộ là toán học và canvas.

**`src/ui/motion.css`**: thêm keyframe `px-pulse` (opacity 1 → .55, `steps(2)`) và `px-bob` (translateY 0 → -2px → 0, `steps(2)`), cả hai đều nằm trong nhánh reduced-motion đã có.

## Related Code Files
**Create:** `src/ui/pixel-art.ts`, `src/game/hotspot-highlight.ts`
**Modify:** `src/ui/motion.css`

## Existing code audit
`pixel-scale.ts` (`integerScale`, `snapToDevice`) và `scene-view.ts` `drawPixelSprite` dùng nguyên. `PixelIcon.tsx` chỉ là pattern tham khảo, không import.

## Reuse strategy
FORK-NEW cho 2 module thuần (chưa có module nào vẽ ma trận pixel ra canvas). REUSE-EXTEND cho motion.css.

## Implementation Steps
1. Viết `pixel-art.ts` với các grid ở trên. Mỗi grid kèm comment ASCII.
2. Viết `hotspot-highlight.ts`.
3. Thêm smoke test vào `scripts/check-core.ts`? **Không**: file đó thuộc core. Thay vào đó, phase 07 kiểm trên trình duyệt.
4. `npm run lint`.

## Todo List
- [x] pixel-art.ts + sprite
- [x] hotspot-highlight.ts
- [x] keyframes motion.css
- [x] lint xanh

## Success Criteria
- `npm run lint` xanh. Mỗi file < 200 LOC.
- Grid là hình chữ nhật đều cạnh (mọi hàng cùng độ dài): thêm assert trong `gridToCanvas`, throw khi lệch.

## Risk Assessment
Cursor data URL lớn hơn 128×128 thì một số trình duyệt bỏ qua → giữ ≤ 32×32.

## Next Steps
Mở khoá 04 và 06.
