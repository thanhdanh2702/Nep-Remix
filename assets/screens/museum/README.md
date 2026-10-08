# Giao Diện Kệ Sách Bảo Tàng (assets/screens/museum)

Thư mục này chứa hình ảnh kệ sách gỗ cổ điển, gáy các cuốn sổ tay văn hóa qua năm thời kỳ lịch sử, khung thẻ đọc tư liệu và con dấu trích dẫn chính sử cho phân khu Bảo tàng.

Màn hình áp dụng hai bố cục: **bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

## Danh sách tệp

| Tên tệp | Loại asset | Trạng thái | Mô tả |
| :--- | :--- | :---: | :--- |
| `bookshelf-pink--landscape.png` | screen-background | ✅ đã vào app | Nền bảo tàng kệ sách ngang; kệ 12 sổ bên trái, khoảng trống cho thẻ đọc bên phải |
| `bookshelf-view--landscape.png` | screen-background | Đã gen, chưa dùng trong game | Nền bảo tàng kệ sách ngang (phiên bản 2) |
| `bookshelf-view--portrait.png` | screen-background | 🟨 nháp AI | Kệ 12 sổ bố cục dọc, vùng phía trên dành cho HUD/dải lọc |
| `card-modal--9slice.png` | ui-frame-9slice | 🟨 nháp AI | Viền gỗ lim, mép giấy dó và sen ở góc; nền giấy và nội dung do UI dựng |
| `museum-filter-bar--3slice.png` | ui-bar-3slice | 🟨 nháp AI | Dải lọc nền giấy dó, hai đầu nụ sen; thân lặp ngang |
| `citation-seal.png` | item-icon | 🟨 nháp AI | Dấu son vuông với biểu tượng sen không chữ; ký hiệu UI trang trí |

## Bộ hình đã tạo và cách sử dụng

Bộ hình được tạo ngày 01/10/2026 bằng công cụ `image_gen` tích hợp, tham chiếu phong cách của nền Studio. Nét Việt thể hiện qua khung nhà và kệ gỗ lim, mành tre, nền gạch đất nung, tường vôi, sổ đóng chỉ bọc lụa, giấy dó, gốm men lam và hoa sen. Ánh sáng ấm, bảng màu cổ kính giữ sự liên tục với các phân khu đã có.

- PNG chuẩn hóa nằm ngay trong thư mục này; ảnh gốc nằm trong [`_raw/`](./_raw/).
- Toàn bộ prompt và các quyết định xử lý đặc tả nằm trong thư mục `_raw/`.
- [`Ảnh xem trước`](./_raw/preview.png) hiển thị hai nền, khung đọc kéo giãn, thanh lọc kéo dài và dấu son phóng lớn.
- [`asset-manifest.json`](./asset-manifest.json) ghi nguồn ảnh, kích thước, số màu RGBA, alpha, vùng slice và SHA-256.
- Khi hiển thị, dùng nearest-neighbor / `image-rendering: pixelated`, giữ góc và hai đầu ở kích thước nguyên. Các dải giữa đã được làm liền mạch để lặp; tâm khung đọc trong suốt.
- 12 cuốn sổ trong nền là hình trang trí. Hitbox, tên thẻ, thời kỳ, trạng thái mở khóa/đã đọc, nội dung tư liệu, trích dẫn và nút hành động cần được UI dựng riêng. Dấu sen không thay thế việc kiểm chứng nguồn tài liệu.

Chạy kiểm tra lại từ thư mục gốc dự án:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File assets/screens/museum/_raw/prepare.ps1 -VerifyOnly
```

Bỏ `-VerifyOnly` để chuẩn hóa lại từ ảnh gốc. Nếu PNG đích đã có, cần truyền `-Overwrite` rõ ràng.

---

## Bố Cục Giao Diện

### Bố cục ngang (Bố cục chính)
- **Cảnh nền:** Nền thư phòng khảo cứu cổ điển trang nhã, tường vôi trắng, kệ gỗ tối màu và ánh sáng tự nhiên dịu nhẹ.
- **Nửa bên trái:** Kệ sách gỗ cổ kính trưng bày 12 cuốn sổ tay văn hóa.
  - Phía trên kệ sách: Dải chọn mốc thời gian `museum-filter-bar--3slice.png` (Tất cả, 1888, 1934, 1962, 1982, 2026).
  - Các cuốn sổ tay gáy da/vải lụa đặt ngay ngắn trên các ngăn kệ, có huy hiệu trạng thái (Đã đọc / Mới mở khóa).
- **Nửa bên phải:** Khung thẻ đọc tư liệu `card-modal--9slice.png` mở sẵn hoặc hiển thị chi tiết cuốn sổ tay đang chọn:
  - Tiêu đề tên cổ phục và niên đại.
  - Ảnh minh họa hiện vật phục chế.
  - Nội dung phân tích văn hóa và bối cảnh lịch sử xác thực.
  - Con dấu triện son `citation-seal.png` đính kèm trích dẫn sách tham khảo chính sử.
  - Nút hành động "Đã hiểu" ở góc dưới.

### Bố cục dọc (Bố cục phụ)
- **Kệ sách chính:** Toàn màn hình hiển thị kệ sách gỗ cổ điển theo trục dọc.
- **Dải lọc:** Thanh `museum-filter-bar--3slice.png` ghim cố định ngay dưới thanh HUD trên cùng.
- **Thẻ đọc tư liệu:** Khi chạm vào cuốn sổ tay, thẻ đọc tư liệu `card-modal--9slice.png` mở lên thành lớp phủ (modal/bottom sheet) chiếm phần lớn diện tích màn hình, cuộn dọc toàn bộ nội dung và trích dẫn nguồn.

---

## Lịch Sử Gen (Không Còn Hiệu Lực)

### Mô Tả Chủ Thể Tạo Ảnh Nền Ngang

- **Mô tả chủ thể (EN) cho `bookshelf-view--landscape.png`:**
  ```text
  pixel art, 800x500 pixel grid, every pixel a crisp square block, limited palette, hard edges, no anti-aliasing, dithering, wide interior view of a traditional Vietnamese archival study and heritage museum. Left half features a grand antique dark timber bookshelf with neatly partitioned compartments for vintage notebooks, scrolls, and ceramic scholarly ornaments. Right half features an open wooden scholar reading desk with soft ambient lantern light and warm sunbeams, leaving a large open area for the reading card UI panels. Muted heritage tones, aged wood grain texture, tranquil intellectual atmosphere. Pure environmental background without any characters, human figures, or baked text.
  ```

Nội dung 12 thẻ văn hóa bảo tàng và tài liệu tham khảo được tích hợp vào ứng dụng.
