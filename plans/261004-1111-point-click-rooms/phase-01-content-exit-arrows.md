# Phase 01 — content-exit-arrows

## Context Links
- Plan: ./plan.md
- Scout: ../reports/reuse-scout-261004-1111-point-click.md

## Overview
- Priority: high · Status: completed · Effort: 2h

## Key Insights
- `AreaSchema.exits` (`src/content/schema.ts:380`) là `record<string,string>`, đang dùng `exits.stairs` (Game.tsx `advance`) và `exits.back`. Không đổi shape này để core và `area/goTo` giữ nguyên.
- Cầu thang s1 → s2 hiện đi qua hội thoại `d-c0-stairs`, sau đó Game.tsx gọi `area/goTo`. Phải giữ đoạn hội thoại này.

## Requirements
- Thêm field optional `exitArrows` vào `AreaSchema`:
  ```ts
  exitArrows: z.array(z.object({
    exit: z.string(),                 // key trong exits
    rect: NormalizedRectSchema,       // vùng click, toạ độ 0..1 theo nền 800×500
    dir: z.enum(['left','right','up','down']),
    via: InteractableIdSchema.optional() // nếu có: click = interact hotspot này (đi qua hội thoại)
  })).optional()
  ```
- Refine: mỗi `exit` phải có trong `exits`, mỗi `via` phải có trong `interactables`.
- prologue.json:
  - s1 `{exit:'stairs', dir:'up', via:'hitbox-stairs', rect:<vùng cầu thang>}`
  - s2 `{exit:'back', dir:'down', rect:<dải mép dưới hoặc lối cầu thang>}`

## Related Code Files
**Modify:** `src/content/schema.ts`, `src/content/chapters/prologue.json`

## Existing code audit
Xem scout report. `NormalizedRectSchema` và `InteractableIdSchema` đã có.

## Reuse strategy
REUSE-EXTEND. Thêm field optional, không đổi `exits`.

## Implementation Steps
1. Thêm `ExitArrowSchema` và field `exitArrows` vào `AreaSchema`. Thêm refine kiểm tham chiếu (theo style `superRefine` nếu file đang dùng).
2. Lấy rect cầu thang s1 từ `hitbox-stairs.rect` (0.875, 0.86, 0.085, 0.10), nới lên trên cho phủ cả bậc. Rect "back" của s2 đo trên `c0-s2-…--phai.png`.
3. Chạy `npm run lint` và `npm run test:core`.

## Todo List
- [x] Schema + refine
- [x] Dữ liệu prologue (exitArrows)
- [x] lint + test:core xanh
- [x] Canh lại `rect` của hotspot prologue theo bbox của phase 03 (rect cũ canh theo chân avatar, không khớp hình vật)

## Success Criteria
- `npm run test:core` xanh. Chương c1–c5 không có `exitArrows` vẫn parse được.
- Sửa `exit` thành key không tồn tại thì validate báo lỗi.

## Risk Assessment
Thấp: field optional. Rollback bằng revert commit.

## Next Steps
Mở khoá phase 04.
