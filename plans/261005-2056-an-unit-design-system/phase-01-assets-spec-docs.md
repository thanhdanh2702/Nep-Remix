# Phase 01 — assets-spec-docs

## Context Links
- Plan: ../plan.md (mục "Đơn vị An")
- Inventory: ../research/researcher-01-spec-doc-inventory.md (dòng và số dòng cụ thể cho từng file)
- Brainstorm: ../../reports/brainstorm-261005-2041-an-anchored-asset-spec.md

## Overview
- Priority: critical · Status: pending · Effort: 3h · Owner: docs-manager

## Key Insights
- `assets/README.md` là nơi **duy nhất** được ghi thông số (§1). Các README con chỉ được mô tả bằng lời. Hiện có 6 README trong `screens`, README của `paperdoll`, garments, accessories và chapter-1 đang vi phạm luật này.
- Các docs đang tham chiếu tới file đã xóa:
  - `paperdoll/README.md` (18 file);
  - 20 README của garments và accessories (mỗi cái một file `<id>.png`);
  - `index.md` (L76-89);
  - `data/asset-manifest.json` (207 / 241 đường dẫn không còn tồn tại).
- Kích thước thật của 9 ảnh raw vừa khôi phục chỉ có ở plan.md và báo cáo inventory, chưa có trong README nào.
- Mâu thuẫn ảnh dọc: docs ghi 270×480 ở một chỗ, 320×480 ở chỗ khác. File thật là 320×480, phải ghi theo file thật.

## Requirements
**Viết lại `assets/README.md`** (bằng tiếng Việt, giữ nguyên cấu trúc mục):
- **§4 Technical prefix:** bỏ câu "pixel grid, every pixel a crisp square block, no anti-aliasing" khỏi prompt nhân vật. Thay bằng prompt nhân vật theo đơn vị An: "chibi pixel-art style matching the reference, 1:1 detail, soft anti-aliased edges, 176x416 frame, feet at y=400". Nền và screen không cần prefix resize.
- **§5 Bảng loại asset:**
  - `character-sprite`: 176×416 mỗi hướng.
  - `cat-sprite`: 128×128.
  - `garment-layer` và `accessory-layer`: dải 528×416, 3 ô front, side, back. Áo vẽ thang xám theo độ sáng.
  - `paperdoll-layer`: **bãi bỏ**; lớp cơ sở chính là 13 layer của An.
  - `portrait`: dùng ô front của nhân vật, crop phần ngực trở lên.
  - Background, CG, doc, screen: **ghi kích thước thật** — 890×500 cho mở đầu, 640×360 cho chương 1, 320×480 cho ảnh dọc, và kích thước raw của từng file screen. Bỏ cột "crop về 800×500".
  - Icon (item 48, accessory icon 48, garment thumb 96, motif 32, ui-pixel 16): giữ nguyên. Ghi rõ đây là icon UI, hiển thị theo bội số nguyên, độc lập với đơn vị An.
  - Bỏ giới hạn số màu cho asset nhân vật; giữ giới hạn này cho icon.
- **§6:**
  - Thay "8 lớp paperdoll" bằng 13 lớp của An (theo thứ tự trong `AN.layers` ở `src/game/assets.ts`) và cách đắp áo, phụ kiện lên.
  - Thay mục palette-swap 8 mã xám bằng gradient-map 4 màu.
  - Giữ quy tắc "no trim".
- **Mục mới "Đơn vị An & humanHeight":**
  - Khung 176×416, điểm chân (88,400), dáng cao 380–392 px, tỉ lệ đầu khoảng 1/3.
  - Bảng `humanHeight` theo cảnh. Số khởi điểm lấy từ plan.md; phase 06 cập nhật số cuối cùng.
  - Quy tắc "không làm tròn hệ số, chỉ làm tròn px màn hình".
- **Mục mới "Danh sách cần gen lại":**
  - 4 NPC × 4 hướng: `cat-nep`, `ong-le` (dạng bóng mờ), `cu-cam`, `truong-toc-bui`.
  - 3 NPC chỉ mặt trước: `cu-loan`, `ba-mai`, `me-phuong`.
  - 10 áo, 10 phụ kiện.
  - NPC chương 2–5 (`ca-nghi`, `vinh`, `chu-suu`, `hoang-lam`, `ba-lon`, `thay-ba-can`) để sau.
  - Mỗi mục ghi tên file đích. Trạng thái: "Chờ gen lại".
- **§9–10:** cập nhật quy trình sản xuất. Bỏ bước downscale/normalize cho screens. Ghi chú `_raw/` là bản gốc; file đặt ở đầu thư mục chính là bản gốc đã được khôi phục.

**README con:**
- Xóa mọi thông số khỏi các README con. Chỉ giữ mô tả bằng lời, tên màu, vai trò và màn sử dụng. Áp dụng cho:
  - `assets/screens/README.md` và 5 README màn;
  - `paperdoll/README.md`;
  - `garments/*/README.md`, `accessories/*/README.md`;
  - `areas/chapter-1/**/README.md`;
  - `characters/*/README.md` (nếu có).
- Bảng "Danh sách tệp" trong README con:
  - File đã xóa: đánh dấu "Chờ gen lại (spec An)", không ghi kích thước.
  - `paperdoll/README.md`: ghi rõ là đã bãi bỏ, chỉ còn `avatar-female-default.png`.

**Index, manifest, prompt:**
- `assets/index.md`: bỏ các dòng của file đã xóa (hoặc đánh dấu "Chờ gen lại" cho file nằm trong danh sách gen lại); sửa các cột kích thước theo spec mới.
- `assets/_migration.md`: thêm một mục "05/10: chuyển sang đơn vị An" (ngắn).
- `assets/screens/*/asset-manifest.json`:
  - Cập nhật `width`/`height` cho 9 ảnh đã khôi phục bản raw.
  - `rendering`: ảnh hi-res thì ghi "smooth"; 9-slice và 3-slice giữ "pixelated".
  - **Không đổi** `slice` insets: code đang đọc giá trị này và các file slice không đổi.
- `assets/screens/**/_raw/generation.json`, `portrait-layout-edit*.json` và các file prompt `.md` trong screens: đây là lịch sử gen, giữ nguyên nội dung. Chỉ thêm một dòng chú thích ở đầu các file `.md` prompt: "Lịch sử gen; spec hiện hành ở assets/README.md".

**Data và script:**
- `data/asset-manifest.json`: tạo lại từ các file thật đang có, hoặc bỏ các đường dẫn không tồn tại. `data/asset-gaps.json` sinh lại bằng `python scripts/audit-assets.py`.
- `scripts/normalize-ui-images.py`: thêm guard ở đầu file, thoát với thông báo "đã bãi bỏ ngày 05/10, screens dùng bản gen gốc", để không ai chạy lại và thu nhỏ ảnh raw lần nữa.
- `scripts/build_paperdoll_studio.py`, `scripts/audit_and_generate_manifest.py`: thêm guard tương tự nếu script ghi đè các README paperdoll, garment hoặc accessory.

## Related Code Files
**Modify:** `assets/README.md`, `assets/index.md`, `assets/_migration.md`, `assets/screens/**/*.md`, `assets/screens/*/asset-manifest.json`, `assets/paperdoll/README.md`, `assets/garments/*/README.md`, `assets/accessories/*/README.md`, `assets/characters/*/README.md`, `assets/areas/**/README.md`, `assets/items/README.md` (nếu có thông số), `data/asset-manifest.json`, `data/asset-gaps.json`, `scripts/normalize-ui-images.py`, `scripts/build_paperdoll_studio.py`, `scripts/audit_and_generate_manifest.py`
**Không đụng:** bất kỳ file PNG nào; `docs/**` (phase 02)

## Implementation Steps
1. Đọc báo cáo inventory và sửa theo thứ tự: `assets/README.md` → README con → index/_migration → manifest/data → script.
2. Kiểm tra bằng grep:
   ```
   rg -n "64 ?[×x] ?96|800 ?[×x] ?500|270 ?[×x] ?480|crisp square|no anti-alias|layer-[0-7]-|8 lớp" assets data scripts
   ```
   Kết quả chỉ được còn các dòng có chủ đích: mục lịch sử, file `_raw/` generation, hoặc dòng ghi "bãi bỏ".
3. Chạy `python scripts/audit-assets.py` rồi `npm run lint`. `asset-manifest.json` trong screens được `assets.ts` import, nên JSON phải hợp lệ.

## Success Criteria
- Lệnh grep ở bước 2 sạch, trừ các dòng có chú thích lịch sử.
- README con không còn chứa số px.
- Mọi đường dẫn trong `assets/index.md` và `data/asset-manifest.json` đều tồn tại, hoặc được đánh dấu "Chờ gen lại".
- Lint pass.

## Risk Assessment
- **Sửa nhầm `slice` insets làm hỏng UI:** không đụng tới khóa `slice`; chạy `tests/browser/ui-polish.spec.ts` sau khi sửa.
