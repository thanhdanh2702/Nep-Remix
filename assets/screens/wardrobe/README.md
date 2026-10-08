# Giao Diện Tủ Đồ Và Cửa Hàng Phụ Kiện (assets/screens/wardrobe)

Thư mục này chứa hình ảnh ngăn kéo tủ gỗ hiển thị danh mục trang phục đã mở khóa, bục thử đồ trực quan và cửa hàng mua sắm phụ kiện bằng Sen Ngọc trong phân khu Tủ đồ.

Màn hình áp dụng hai bố cục: **bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

## Danh sách tệp

| Tên tệp | Loại asset | Trạng thái | Mô tả |
| :--- | :--- | :---: | :--- |
| `closet-shelf--landscape.png` | screen-background | ✅ đã vào app | Nền phòng thay đồ tủ gỗ ngang toàn cảnh; không người, không chữ |
| `closet-shelf--portrait.png` | screen-background | ✅ đã vào app | Nền tủ đồ ngăn kéo dọc; không người, không chữ |

---

## Bố Cục Giao Diện

### Bố cục ngang (Bố cục chính)
- **Cảnh nền:** Nền `closet-shelf--landscape.png` thể hiện không gian phòng phục trang bằng gỗ lim ấm áp, ánh đèn lồng dịu nhẹ và gương soi toàn thân.
- **Nửa bên trái:** Bục đứng nhân vật An mặc thử.
  - Hiển thị ngay diện mạo nhân vật khi người chơi bấm chọn bất kỳ áo dài hoặc phụ kiện nào trong tủ.
  - Phía dưới có nút **"Mặc bộ này ra sảnh"** và nút **"Chuyển sang Studio tạo dáng"**.
- **Nửa bên phải:** Bảng tủ đồ:
  - Hàng trên: Thanh chuyển tab gồm "Áo dài đã có", "Bộ phối đã lưu", "Cửa hàng phụ kiện".
  - Khu vực trung tâm: Lưới các ô đồ.
  - Khi mở tab Cửa hàng: Hiển thị danh sách phụ kiện truyền thống (khăn vấn, nón quai thao, kiềng bạc, guốc mộc) kèm giá mua bằng Sen Ngọc và số dư hiện có.

### Bố cục dọc (Bố cục phụ)
- **Nửa trên:** Nhân vật đứng mặc thử trên nền tủ gỗ `closet-shelf--portrait.png`.
- **Nửa dưới:** Ngăn kéo tủ đồ dạng lưới cuộn dọc, chứa các ô đồ đã mở khóa; thanh chuyển tab đặt ngang giữa hai nửa màn hình.
- **Cửa hàng phụ kiện:** Mở dưới dạng bottom sheet vuốt từ đáy màn hình lên.

---

## Lịch Sử Gen (Không Còn Hiệu Lực)

### Mô Tả Chủ Thể Tạo Ảnh Nền Ngang

- **Mô tả chủ thể (EN) cho `closet-shelf--landscape.png`:**
  ```text
  pixel art, 800x500 pixel grid, every pixel a crisp square block, limited palette, hard edges, no anti-aliasing, dithering, panoramic interior of an elegant heritage Vietnamese dressing room and wardrobe chamber. Left area features a polished teakwood dressing space with a full-length wooden mirror frame and soft warm lantern glow, leaving central space clear for player mannequin. Right area features beautifully carved wooden cabinet shelves and textile drawers, leaving a broad open zone for inventory grid UI panels. Rich lacquer wood, silk fabric rolls on upper shelves. Pure environmental background without any characters, human figures, or baked text.
  ```

Prompt tạo ảnh chi tiết lưu trong thư mục _raw/.
