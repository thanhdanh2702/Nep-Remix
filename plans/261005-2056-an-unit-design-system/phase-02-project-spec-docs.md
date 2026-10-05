# Phase 02 — project-spec-docs

## Context Links
- Plan: ../plan.md (mục "Đơn vị An")
- Inventory: ../research/researcher-01-spec-doc-inventory.md
- Phase 01 (`assets/README.md` là nguồn spec; docs ở phase này **trỏ về** đó, không chép lại các con số)

## Overview
- Priority: critical · Status: pending · Effort: 2.5h · Owner: docs-manager

## Key Insights
- `docs/06-design/design-system.md` L137-144 ghi spec cũ: 64×96, 32×32, 800×500, 270×480.
- `docs/01-overview/decisions.md` L112 và `README.md` L29 nhắc lại 64×96.
- `docs/05-tech/game-implementation.md` tự mâu thuẫn: L65 và L76 đã theo An, còn L85 vẫn ghi paperdoll 64×96, mã xám [224,158,97,33] và "không dùng frame An"; L13 cũng cần sửa.
- `docs/06-design/ai-studio/gemini-ui-asset-prompts.md` L46 dùng `ba-mai/view-front.png` (đã xóa); L102 ghi "sprite 64×96".
- Có 4 file `docs/03-features/*` nhắc tới kích thước hoặc paperdoll (xem inventory batch 3).

## Requirements
- **`design-system.md`:** thay bảng asset bằng phần tóm tắt đơn vị An (khung 176×416, điểm chân, `humanHeight`, nhóm icon UI) kèm liên kết tới `assets/README.md`. Mục mật độ pixel ghi rõ:
  - Nhân vật vẽ chi tiết 1:1 và được thu nhỏ có smoothing.
  - Nền và screen giữ ảnh gen gốc, vẽ có smoothing.
  - Icon, 9-slice, 3-slice và ui-pixel là pixel art, phóng theo bội số nguyên với `pixelated`.
  - Ghi 320×480 cho ảnh dọc, đúng với file thật.
- **`decisions.md`:** thêm quyết định mới "05/10: Đơn vị An thay lưới 64×96". Nêu lý do (lệch khoảng 4,3 lần, khác kiểu dáng), nêu hệ quả (xóa 90 asset, gen lại khoảng 79 ảnh, screens dùng bản gốc, background giữ nguyên). Đánh dấu quyết định 20–22 cũ là "Thay thế bởi #<mới>"; không xóa lịch sử.
- **`README.md` gốc** (L29): sửa câu về spec, trỏ tới `assets/README.md`.
- **`game-implementation.md`:** sửa L13 và L85 cho khớp với L65/L76 (An là lớp cơ sở; áo và phụ kiện là dải 528×416; tô màu bằng gradient-map). Thêm phần mô tả `character-scale.ts`/`humanHeight` và cách An đi trong phòng. Đây là docs mô tả hành vi mà phase 03/04 sẽ làm; tên hàm phải khớp plan.
- **`docs/03-features/*`:** `studio.md`, `closet-and-workshop.md`, `journey.md`, `museum.md` và các file khác mà inventory chỉ ra:
  - Bỏ con số cũ.
  - `journey.md`: thêm "An đi tới vật được bấm; NPC quay mặt về phía An".
  - `museum.md`: thêm mục Sổ tay "Nhân vật" và "Kỷ vật".
  - `studio.md`: ghi chú về fallback ("áo chưa có layer spec An thì hiện icon; An mặc outfit gốc").
- **`docs/06-design/ai-studio/`:**
  - Sửa `gemini-ui-asset-prompts.md` L46 và L102.
  - Tạo `gemini-an-unit-regen-prompts.md`: bộ prompt gen lại cho khoảng 79 ảnh trong danh sách ở `assets/README.md`.
    - Mỗi mục gồm: file đích, ảnh tham chiếu (`assets/characters/an/` frame front, side, back đã ghép), mô tả nhân vật hoặc áo lấy từ README con, ràng buộc (khung 176×416, chân y=400, nền `#FF00FF`, dáng 380–392 px, chibi giống An).
    - Kèm các bước hậu kỳ: tách nền, căn chân, `python scripts/audit-assets.py`.
  - Kiểm tra các file prompt khác trong thư mục này có nhắc 64×96 / 800×500 không, có thì sửa.
- **`docs/02-plan/*`:** nếu có thông số thì sửa, ghi mốc 05/10 vào roadmap.

## Related Code Files
**Modify:** `docs/06-design/design-system.md`, `docs/06-design/README.md` (nếu có thông số), `docs/01-overview/decisions.md`, `docs/01-overview/summary.md` (nếu có), `README.md`, `docs/05-tech/game-implementation.md`, `docs/05-tech/core-api-for-ui.md` (nếu có), `docs/03-features/*.md`, `docs/02-plan/*.md`, `docs/06-design/ai-studio/*.md`
**Create:** `docs/06-design/ai-studio/gemini-an-unit-regen-prompts.md`
**Không đụng:** `assets/**` (phase 01)

## Implementation Steps
1. Sửa theo danh sách trong inventory (batch 1 và batch 3, phần thuộc `docs/`).
2. Viết `gemini-an-unit-regen-prompts.md`.
3. Kiểm tra:
   ```
   rg -n "64 ?[×x] ?96|800 ?[×x] ?500|270 ?[×x] ?480|paperdoll|view-front" docs README.md
   ```
   Kết quả chỉ được còn các dòng có chủ đích (lịch sử quyết định, liên kết tới mục bãi bỏ).

## Success Criteria
- Lệnh grep sạch, chỉ còn các dòng có chú thích lịch sử.
- Mọi liên kết tới `assets/README.md#...` đều trỏ đúng anchor.
- Bộ prompt gen lại phủ đủ các mục trong "Danh sách cần gen lại".

## Risk Assessment
- **Docs mô tả trước tính năng chưa code xong:** phase 06 đối chiếu lại tên hàm và hành vi trước khi commit.
