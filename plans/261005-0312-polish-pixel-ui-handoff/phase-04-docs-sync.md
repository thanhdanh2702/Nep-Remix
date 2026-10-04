# Phase 04 — docs-sync

## Overview
Priority: medium · Status: pending · Est. 1–2 h · Depends on: 01, 03

## Requirements
Đồng bộ docs với code hiện tại (chỉ sửa chỗ sai/lỗi thời, giữ cấu trúc):
- `README.md`: Bắt đầu nhanh = `npm install` → `npm run setup` → `npm run dev`; mô tả point-and-click trong phòng (bỏ WASD/E trong phòng); Chương 1 chơi được; Xưởng may, selfie, Stylist, Lookbook AI cần key; mọi art mới vẽ bằng code (`scripts/pixel/`).
- `docs/03-features/onboarding.md:18`, `docs/05-tech/game-implementation.md` (luồng phòng point-and-click, world size theo phòng 16:9, c1 playable, Xưởng may/selfie đã có UI, pipeline pixel), `docs/03-features/feature-list.md` (trạng thái F02 selfie, F12/F13 Xưởng may, F16–F19 chương 1).
- Ghi changelog nếu repo có file changelog.
- `docs/05-tech/deploy-cloud-run.md`: thêm mục "Chỉ có API key" — bước tối thiểu (AI Studio Deploy button hoặc 1 lệnh gcloud).

## Related Code Files
Modify: các file docs trên + `README.md`.

## Success Criteria
Mọi lệnh/đường dẫn/biến môi trường được nhắc tồn tại (docs-manager kiểm); không còn câu "WASD/E" mô tả phòng cốt truyện.
