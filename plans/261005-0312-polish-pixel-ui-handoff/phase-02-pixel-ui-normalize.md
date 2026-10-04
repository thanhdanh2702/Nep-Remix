# Phase 02 — pixel-ui-normalize

## Overview
Priority: high · Status: completed · Est. 2–3 h

## Key Insights
9 ảnh "final" là ảnh hi-res chưa về lưới pixel (explore 04/10): `assets/screens/main-shop/area-sign-frame.png` 2048×683, `currency-hud.png` 2048×683, `settings-button.png` 1254², `garden*--landscape.png` 1586×992; `assets/screens/studio/lookbook-frame.png` 1144×1375, `vietnamese-room--landscape.png` 1585×992, `wardrobe-frame--landscape.png` 2172×724; `assets/screens/museum/bookshelf-pink--landscape.png` 1586×992; `assets/screens/welcome/welcome-courtyard.png` 1774×887. Có pipeline `scripts/process-ai-asset.py` (median-cell downscale + quantize palette) và `_raw/normalize.ps1` theo màn.

## Requirements
- Với mỗi ảnh **đang được src tham chiếu** (grep trước; ảnh không dùng thì bỏ qua và liệt kê): chuyển về lưới pixel bằng code — median-cell downscale theo cell nguyên (chọn cell để cạnh dài ≈ 400–800 px), quantize về palette dự án (`assets/palettes/ui.json` + màu riêng của ảnh tối đa 32 màu), alpha cứng. Giữ bản gốc ở `_raw/` cùng thư mục màn (tạo nếu chưa có, `_raw` không bị bundle).
- Kích thước hiển thị trong CSS không đổi (ảnh nhỏ hơn được scale bằng `image-rendering: pixelated`); kiểm `aspect-ratio` CSS phụ thuộc kích thước gốc (vd `hub.css:57` `2048/683`) — giữ đúng tỉ lệ.
- Script: `scripts/pixel/normalize-ui-images.py` (tái dùng hàm của `process-ai-asset.py` bằng import, không copy).

## Related Code Files
Create: `scripts/pixel/normalize-ui-images.py`. Modify: các PNG liệt kê + `_raw/` copies, `data/runtime-assets.json` (generated), CSS chỉ khi cần `image-rendering: pixelated` cho các ảnh này.

## Todo
- [x] grep tham chiếu, chốt danh sách
- [x] script + chạy
- [x] xem preview mỗi ảnh (≤ 960 px) — tối đa 2 vòng
- [x] audit:assets, build, test:assets, ui-polish/studio/museum/welcome spec

## Success Criteria
Không ảnh UI đang dùng nào > 1024 px cạnh dài; mỗi ảnh ≤ 32 màu; test pass; screenshot hub/studio/museum/welcome 1920×1080 nhìn sắc nét, không mờ.
