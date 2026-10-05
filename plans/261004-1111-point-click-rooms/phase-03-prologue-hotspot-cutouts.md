# Phase 03 — prologue-hotspot-cutouts

## Context Links
- Plan: ./plan.md · Brainstorm §4.1 · `scripts/process-ai-asset.py`, `scripts/audit-assets.py`

## Overview
- Priority: medium (cắt đầu tiên nếu trễ, vì 04 đã có fallback khung góc) · Status: completed (test:assets chưa xanh: cần rebuild dist, xem report) · Effort: 0.75 ngày

## Key Insights
- Vật thể nằm sẵn trong nền opaque 800×500 (`c0-s1-tiem-may-chieu--phai.png`, `c0-s2-gac-xep-chiec-ruong--phai.png`), nên không có alpha để tách tự động.
- Cách an toàn thể lệ và tất định: vẽ tay polygon mask (toạ độ px của nền) vào JSON, script cắt theo đó. Không sinh ảnh mới nên không lệch style.
- Quy ước repo: **không sửa** file có sẵn trong `assets/`; được thêm file mới rồi chạy `audit:assets`.
- Prologue có 10 hotspot:
  - s1: cat, stairs, table, mirror
  - s2: chest-cloth, wall-key, sewing-basket, mannequin-hand, chest-lock, sewing-hoop

## Requirements
- `scripts/hotspot-masks.json`: `{ "<areaId>": { "<interactableId>": [[x,y],...] } }`, toạ độ theo nền 800×500.
- `scripts/build-hotspot-cutouts.py`:
  - Với mỗi polygon: crop bbox từ nền, áp mask polygon, alpha cứng 0/255.
  - Ghi ra `assets/areas/prologue/<areaId>/hotspot-<interactableId>.png`.
  - Ghi kèm offset `{x,y}` (góc trên trái theo px nền) vào `assets/areas/prologue/<areaId>/hotspots.json`.
- Kiểm: bbox polygon phải nằm trong `rect` của interactable nới 10%; lệch thì warn.
- Hotspot `cat` (NPC mèo vẽ bằng sprite riêng `cat-nep/view-front.png`) không cần cutout. Dùng sprite đó luôn.
- Chạy `npm run audit:assets` để cập nhật `data/runtime-assets.json`.

## Related Code Files
**Create:** `scripts/build-hotspot-cutouts.py`, `scripts/hotspot-masks.json`, `assets/areas/prologue/*/hotspot-*.png`, `assets/areas/prologue/*/hotspots.json`
**Modify (generated):** `data/runtime-assets.json`

## Existing code audit
`process-ai-asset.py` có các hàm Pillow tham khảo được (hard alpha, autocrop). Import lại các hàm đó nếu tách được, không thì viết mới (script nhỏ).

## Reuse strategy
REUSE-EXTEND nếu import được helper từ `process-ai-asset.py`, không thì FORK-NEW. Script < 120 dòng.

## Implementation Steps
1. Đo polygon cho 9 vật (trừ mèo) trên 2 nền: mở ảnh và ghi điểm. Mỗi vật 6–12 điểm là đủ.
2. Viết script, chạy, mở ảnh kết quả kiểm bằng mắt.
3. `npm run audit:assets` và `npm run test:assets`.

## Todo List
- [x] masks JSON (9 vật)
- [x] script
- [x] cutouts + hotspots.json
- [x] audit:assets

## Success Criteria
- 9 PNG RGBA, alpha chỉ có 0 hoặc 255. Bbox khớp `rect` (không có warn).
- `npm run test:assets` xanh.

## Risk Assessment
- Overlay theo trạng thái (`vai-phu-roi`, `tuong-go-mo-tay`, `ruong-mo-toang`) làm hình vật đổi sau khi giải. Phase 04 dùng khung góc cho hotspot đã giải, nên không cần cutout theo trạng thái.

## Next Steps
04 tự nhận cutout khi `hotspots.json` có mặt, không cần đổi code.
