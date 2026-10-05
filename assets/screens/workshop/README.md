# Giao Diện Xưởng May Số Hóa (assets/screens/workshop)

Thư mục này chứa đặc tả hình ảnh giao diện bàn máy may số hóa, khung thả ảnh chụp áo thật ngoài đời, hiệu ứng quét bóc tách nếp áo và popup đối chiếu cổ phục trong phân khu Xưởng may.

Màn hình áp dụng hai bố cục: **bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

## Danh sách tệp

| Tên tệp | Loại asset | Trạng thái | Mô tả |
| :--- | :--- | :---: | :--- |
| `sewing-machine--landscape.png` | screen-background | Đã gen, chưa dùng trong game | Nền xưởng may số hóa ngang toàn cảnh; không người, không chữ |
| `sewing-machine--portrait.png` | screen-background | ✅ đã vào app | Nền bàn máy may dọc; không người, không chữ |

---

## Bố Cục Giao Diện

### Bố cục ngang (Bố cục chính)
- **Cảnh nền:** Nền tái hiện bàn máy may gang cổ điển thời kỳ công nghiệp kết hợp các thiết bị quang học số hóa hiện đại.
- **Nửa bên trái:** Khung thả ảnh và cơ chế quét.
  - Vùng kéo thả hoặc tải ảnh chụp áo thật.
  - Khi tải ảnh lên, hiệu ứng quét chạy dọc bề mặt ảnh cùng thanh tiến độ.
- **Nửa bên phải:** Bảng kết quả phân tích AI và công cụ văn hóa:
  - Thông tin nhận diện: Tên dáng áo, thời kỳ lịch sử, độ tương đồng đặc trưng.
  - Phân tích chi tiết: Cổ áo, hàng khuy cài, cấu trúc xẻ tà, chất liệu vải.
  - Nút **"Phân biệt với sườn xám / hanbok"**: Mở cửa sổ popup giải thích cặn kẽ 4 điểm khác biệt cốt lõi.
  - Nút chính dưới cùng: **"May áo vào Tủ đồ"**.

### Bố cục dọc (Bố cục phụ)
- **Nửa trên:** Vùng thả ảnh chụp áo thật và chạy hoạt ảnh tia quét laser trên nền.
- **Nửa dưới:** Thẻ hiển thị kết quả phân tích AI dạng bottom sheet cuộn dọc; nút phân biệt đối chiếu mở thành lớp phủ toàn màn hình.

---

## Lịch Sử Gen (Không Còn Hiệu Lực)

### Mô Tả Chủ Thể Tạo Ảnh Nền Ngang

- **Mô tả chủ thể (EN) cho `sewing-machine--landscape.png`:**
  ```text
  pixel art, 800x500 pixel grid, every pixel a crisp square block, limited palette, hard edges, no anti-aliasing, dithering, panoramic workshop interior blending traditional Vietnamese tailoring craft with modern digital atelier aesthetics. Left side features a wide polished wooden workbench with an antique cast-iron sewing machine and cutting mat, leaving a clear open area for the image upload dropzone. Right side features digital drafting monitors, blueprint scrolls, and neatly labeled fabric drawers, leaving ample open space for AI analysis result panels. Warm amber ambient workshop light with subtle cyan digital accents. Pure environmental background without any characters, human figures, or baked text.
  ```

Prompt hệ thống và schema bóc tách ảnh áo ngoài đời xem tại `docs/03-features/closet-and-workshop.md`.
Hướng dẫn đối chiếu sườn xám và hanbok xem tại `docs/04-culture/differentiation-guide.md`.
