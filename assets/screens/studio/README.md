# Giao Diện Bàn May Studio (assets/screens/studio)

Thư mục này chứa hình ảnh nền phòng phối đồ Studio cổ phong, khung điều khiển phối đồ, thanh màu truyền thống, dải chọn sự kiện và khung cửa sổ Lookbook AI.

Màn hình áp dụng hai bố cục: **bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

## Danh sách tệp

| Tên tệp | Loại asset | Trạng thái | Mô tả |
| :--- | :--- | :---: | :--- |
| `vietnamese-room--landscape.png` | screen-background | ✅ đã vào app | Nền phòng phối đồ ngang; không gian xưởng may ấm cúng với kệ cuộn vải lụa, giá treo thước gỗ |
| `workbench-ui--portrait.png` | screen-background | 🟨 nháp AI | Nền phòng phối đồ dọc; bục đứng trong vùng trên, chừa phần dưới cho bottom sheet |
| `lookbook-frame.png` | screen-component | ✅ đã vào app | Khung gỗ chạm hoa sen cho Lookbook 4 ảnh AI |
| `wardrobe-frame--landscape.png` | screen-component | ✅ đã vào app | Khung bảng điều khiển phối đồ ngang |
| `studio-panel-frame--9slice.png` | ui-frame-9slice | 🟨 nháp AI | Khung bảng điều khiển với nụ sen và nét dệt lụa |
| `color-palette-bar--3slice.png` | ui-bar-3slice | 🟨 nháp AI | Thanh chọn màu, hai đầu chạm sen; mẫu màu do UI dựng |
| `event-selector-strip--3slice.png` | ui-bar-3slice | 🟨 nháp AI | Dải chọn sự kiện, hai đầu nụ sen trên nền chàm |

## Bộ hình đã tạo và cách sử dụng

Bộ hình được tạo ngày 01/10/2026 bằng công cụ `image_gen` tích hợp. Nét Việt thể hiện qua khung nhà gỗ lim, mành tre, nền gạch đất nung, gốm men lam, hoa sen, kệ lụa màu chàm/đỏ điều/hoàng yến và dụng cụ may bằng gỗ, đồng. Hoa văn tập trung ở góc khung và hai đầu thanh để không méo khi co giãn. Không vẽ người, chữ hoặc nút điều khiển vào ảnh nền.

- PNG chuẩn hóa nằm ngay trong thư mục này. Ảnh gốc và các lần chỉnh bố cục nằm trong `_raw/`.
- Thông số tích hợp, slice, số màu và SHA-256 nằm trong `asset-manifest.json`.
- Nền giới hạn 32 màu; khung/thanh tối đa 16 màu RGBA, alpha chỉ 0 hoặc 255. Các cạnh lặp đã được làm phẳng, tâm hai khung để trong suốt.
- Khi render, dùng nearest-neighbor / `image-rendering: pixelated` và giữ góc/hai đầu nguyên kích thước. Màu mẫu, chữ, tab, ảnh Lookbook và thanh tiến độ được vẽ bằng UI phía trên.
- Bộ hình đã qua kiểm tra kỹ thuật và xem xét trực quan bằng AI. Trạng thái vẫn là **nháp AI**: chưa sửa pixel thủ công, chưa có duyệt văn hóa bởi người và chưa tích hợp vào app.

Chạy lại kiểm tra và dựng ảnh xem trước từ thư mục gốc dự án:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File assets/screens/studio/_raw/prepare.ps1 -VerifyOnly
```

Để chuẩn hóa lại từ ảnh gốc, bỏ `-VerifyOnly`; nếu PNG đích đã tồn tại, cần truyền `-Overwrite` rõ ràng. Script kiểm tra đủ nguồn trước khi ghi.

---

## Bố Cục Giao Diện

### Bố cục ngang (Bố cục chính)
- **Cảnh nền:** Nền `vietnamese-room--landscape.png` thể hiện không gian xưởng may ấm cúng với kệ cuộn vải lụa, giá treo thước gỗ và ánh sáng tự nhiên từ cửa sổ bên.
- **Nửa bên trái:** Sân khấu bục đứng của nhân vật An (ma-nơ-canh thử đồ).
  - Nhân vật đứng chính giữa bục gỗ tròn, dưới chân có bóng đổ mềm.
  - Vòng hào quang bụi sao lấp lánh xuất hiện khi thay trang phục hoặc phụ kiện.
  - Phía dưới bục có nút xoay góc nhìn hoặc lật mặt vải áo (khi bật tính năng).
- **Nửa bên phải:** Bảng điều khiển tab được bao bọc bởi khung `wardrobe-frame--landscape.png`:
  - Hàng trên cùng: Dải chọn sự kiện `event-selector-strip--3slice.png` giúp định hướng phong cách phối đồ.
  - Thanh tab điều hướng danh mục: "Dáng áo", "Màu sắc", "Phụ kiện", "Họa tiết".
  - Khu vực danh mục: Lưới các ô biểu tượng áo hoặc phụ kiện.
  - Khi chọn tab màu: Hiển thị thanh màu truyền thống `color-palette-bar--3slice.png` với các nút mẫu màu.
  - Dưới cùng của bảng: Cụm nút hành động chính gồm **"Lưu bộ phối"**, **"Tạo Lookbook AI"** và **"Mặc thử ngay"**.
- **Cửa sổ Lookbook AI:** Khi bấm tạo Lookbook, khung modal `lookbook-frame.png` mở nổi căn giữa màn hình, hiển thị lưới 4 ảnh AI chân thực kèm thanh tiến độ.

### Bố cục dọc (Bố cục phụ)
- **Nửa trên:** Bục đứng nhân vật An căn giữa khung nhìn trên nền `workbench-ui--portrait.png`.
- **Nửa dưới:** Bảng điều khiển tab hiển thị dưới dạng ngăn kéo vuốt mở (bottom sheet), chứa dải sự kiện, lưới chọn trang phục và thanh màu.
- **Cụm nút chính:** "Lưu bộ phối" và "Tạo Lookbook" ghim cố định ở đáy màn hình điện thoại.
- **Cửa sổ Lookbook:** Mở phủ toàn màn hình, 4 ảnh xếp lưới 2×2 cuộn dọc.

---

## Lịch Sử Gen (Không Còn Hiệu Lực)

### Mô Tả Chủ Thể Tạo Ảnh Nền Ngang

- **Mô tả chủ thể (EN) cho `vietnamese-room--landscape.png`:**
  ```text
  pixel art, spacious traditional Vietnamese tailor atelier and styling studio interior at warm morning light. Left half features an elegant raised circular wooden styling podium, leaving central podium space clear for character display. Right half features an organized atelier workspace with polished dark wooden textures and fabric bolts neatly arranged on side shelves. Soft ambient dust motes in sunbeams, subtle vintage tailoring tools. Pure environmental background without any characters, human figures, or baked text.
  ```

Prompt tạo ảnh chi tiết lưu trong thư mục _raw/.
