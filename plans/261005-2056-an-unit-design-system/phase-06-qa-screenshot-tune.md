# Phase 06 — qa-screenshot-tune

## Context Links
- Plan: ../plan.md
- Script chụp: `artifacts/ui-baseline/shots.spec.ts` (đã dùng để chụp baseline 05/10)

## Overview
- Priority: critical · Status: completed · Effort: 2h

## Requirements
- Chụp mọi màn ở 4 viewport (1366×768, 1920×1080, 390×844, 844×390). Danh sách màn:
  - welcome, Sảnh, bản đồ;
  - phòng mở đầu s1 và s2, ba phòng chương 1, hội thoại;
  - Phòng phối đồ (4 hướng nhìn), Tủ đồ, Xưởng may;
  - Bảo tàng, cuốn sách, Sổ tay Nhân vật, Sổ tay Kỷ vật;
  - Cài đặt.
- Xem từng ảnh và căn lại:
  - `HUMAN_HEIGHT` (`back`, `front`, `floorTop`, `floorBottom`) trong `src/game/character-scale.ts`. Theo thứ tự phụ thuộc, phase 06 là phase duy nhất sau 03 được sửa file này.
  - Kích thước mặc định của An ở Phòng phối đồ, Tủ đồ và Xưởng may.
  - `--char-h` của bản đồ.
- **Căn theo vật tham chiếu:** khung cửa cao hơn đầu An; bàn may chạm khoảng hông An; An đứng trên sàn, không đứng trên tường; nhãn trên bản đồ không che nhân vật.
- Ghi các số cuối cùng vào bảng `humanHeight` trong `assets/README.md`. Chỉ sửa bảng đó; đây là ngoại lệ đã ghi trong plan.md.

## Related Code Files
**Modify:** `src/game/character-scale.ts` (chỉ sửa số), `src/game/studio.css` / `src/game/fullscreen.css` / `src/game/journey-map.css` (chỉ sửa biến kích thước), `assets/README.md` (chỉ bảng `humanHeight`)
**Create:** `artifacts/ui-an-unit/` (ảnh chụp, đã gitignore), `plans/reports/qa-261005-<HHmm>-an-unit-screens.md`

## Implementation Steps
1. Mở rộng script chụp: thêm màn, thêm viewport, thêm phòng chương 1 (dùng lại các bước chơi trong `chapter1.spec.ts`).
2. Chụp vòng 1 rồi xem từng ảnh. Lập bảng màn → lỗi tỉ lệ → số mới.
3. Sửa số, chụp vòng 2, xác nhận.
4. Chạy toàn bộ `npm run lint`, `npm run test:core`, `npm run test:browser`.

## Success Criteria
- Báo cáo QA có bảng trước/sau cho từng màn, đường dẫn ảnh, và các số `humanHeight` cuối cùng.
- Toàn bộ test pass. Không có lỗi console hay lỗi 4xx ở bất kỳ màn nào.

## Risk Assessment
- **Ảnh chụp không ổn định vì hoạt ảnh:** đợi `data-ready` và tắt chuyển động bằng `reducedMotion: 'reduce'` khi chụp.

## Kết quả
Xem `plans/reports/qa-261005-2150-an-unit-screens.md`. Đã thêm 3 sửa lỗi theo phản hồi user (gỡ vfx, vật cản trong phòng, chiều cao An ở Phòng phối đồ/Tủ đồ theo độ sâu).
