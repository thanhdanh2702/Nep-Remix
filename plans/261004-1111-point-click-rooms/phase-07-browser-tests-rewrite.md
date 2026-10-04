# Phase 07 — browser-tests-rewrite

## Context Links
- Plan: ./plan.md · Scout report (mục [sửa] Tests)

## Overview
- Priority: high · Status: completed · Effort: 0.5–0.75 ngày · Depends on: 04, 05, 06

## Key Insights
- `tests/browser/game.spec.ts` dòng 8–66, 90–93, 130–135 đi trong phòng bằng `keyboard.down('d')`, `press('e')`, `data-position`. Phần này phải viết lại theo click.
- Phần hub (`data-position 440,340`, walk frames) vẫn hợp lệ vì hub giữ WASD.
- `journey-map.spec.ts:30` kiểm `data-position '140.0,380.0'` sau khi vào phòng → đổi sang `data-area='c0-s1-tiem-may-chieu'` + `data-ready='true'`.
- `ui-polish.spec.ts:68` kiểm `.touch-controls` hiện trên coarse pointer → giới hạn assert ở hub. Thêm assert phòng **không** có `.touch-controls`.

## Requirements
- game.spec.ts (phần phòng), chơi trọn Màn mở đầu bằng click:
  1. Click hotspot theo `getByRole('button',{name:<nhãn>})` trong `.room-hotspots`.
  2. Click mũi tên lên (stairs, đi qua hội thoại) → "Bước lên gác xép" → `data-area` = s2.
  3. Gỡ vải, lấy kim, mở tay tượng, mở rương → modal "Nếp ký ức đầu tiên" + Sen Ngọc +50.
- Test bàn phím: Tab tới hotspot đầu tiên → `data-hover` = id → Enter mở dialog.
- Test highlight: hover hotspot → `data-hover` đúng id. Bấm "Soi" → `aria-pressed=true`, sau ~1.6s về false.
- Test hội thoại: dialog có `.dialogue-stage`, có canvas tranh NPC với `clientHeight ≥ 288` ở viewport 1366×768.
- Test hub glow: giữ `d` cho tới khi `data-target='closet'` (hoặc điểm gần nhất) → `.area-sign.is-highlighted` count = 1.
- Test HUD: ở 1366×768 và 844×390, tổng diện tích bounding box của HUD trong phòng / diện tích `.scene-room` < 0.15.
- Chụp lại `artifacts/ui-polish/*` cho phòng và hội thoại để review bằng mắt.

## Related Code Files
**Modify:** `tests/browser/game.spec.ts`, `tests/browser/journey-map.spec.ts`, `tests/browser/ui-polish.spec.ts`

## Existing code audit
Giữ helper `enterGame`, `savedState`, `scene()` (đổi selector cho phòng). Không tạo helper file mới trừ khi ≥ 2 spec cần.

## Reuse strategy
REUSE-EXTEND các spec hiện có.

## Implementation Steps
1. Sửa journey-map.spec.ts và ui-polish.spec.ts (nhỏ).
2. Viết lại phần phòng trong game.spec.ts. Giữ test hub.
3. Thêm test highlight, Soi, hội thoại, hub glow, HUD ratio.
4. `npm run test:browser`. Sau đó build + `QA_BASE_URL` preview chạy lại.

## Todo List
- [x] journey-map + ui-polish
- [x] game.spec phòng (click)
- [x] test mới (highlight, Soi, dialogue, hub glow, HUD)
- [x] test:browser xanh trên dev + preview

## Success Criteria
- `npm run lint && npm run test:core && npm run test:browser && npm run build` đều xanh.
- Bản preview (`QA_BASE_URL`) chạy test:browser + test:assets xanh.

## Risk Assessment
Animation steps làm test chập chờn → dùng `expect(...).toHaveAttribute` (auto-wait). Chạy với `reducedMotion: 'reduce'` cho test luồng; riêng test Soi/pulse chạy với motion bật.

## Next Steps
`/simplify` → `/docs` (cập nhật README phần điều khiển: WASD chỉ ở hub, phòng dùng chuột/tap) → `/git`.
