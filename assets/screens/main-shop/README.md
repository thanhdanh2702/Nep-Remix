# Giao Diện Sảnh Tiệm May (assets/screens/main-shop)

Thư mục này chứa hình ảnh nền sân nhà sảnh tiệm may cổ kính lúc hoàng hôn, thanh điều hướng HUD và các thành phần giao diện cho phân khu Sảnh chính (Hub).

Màn hình áp dụng hai bố cục: **bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

## Danh sách tệp cần bổ sung

| Tên tệp | Loại asset | Trạng thái | Mô tả |
| :--- | :--- | :---: | :--- |
| `garden-user--landscape.png` | screen-background | ✅ đã vào app | Nền sảnh sân nhà toàn cảnh ngang; sân gạch đỏ cổ truyền lúc hoàng hôn vàng ấm với cổng vòm, kệ sách, hai dãy nhà |
| `background--portrait.png` | screen-background | 🟨 Đã gen | Nền sảnh sân nhà bố cục dọc; điểm chạm 4 khu vực được xếp so le hoặc dạng danh sách |
| `ui-hud--3slice.png` | ui-bar-3slice | 🟨 Đã gen | Thanh điều hướng 3-slice; giữ nguyên hai đầu, thân giữa co giãn |
| `action-card-frame--9slice.png` | ui-frame-9slice | 🟨 Đã gen | Khung thẻ hành động nổi; 9-slice với góc và cạnh cố định |
| `door-entrance-glow.png` | vfx | 🟨 Đã gen | Hiệu ứng vầng sáng hào quang tại vòm cổng/lối vào |

---

## Bố Cục Giao Diện

### Bố cục ngang (Bố cục chính)
- **Cảnh nền:** Ảnh `garden-user--landscape.png` phủ kín không gian, thể hiện toàn cảnh sân nhà gạch đỏ cổ truyền lúc hoàng hôn vàng ấm:
  - Bên trái: Dãy nhà ngói cổ dẫn vào **"Phòng phối đồ"** (`studio`).
  - Bên phải: Dãy nhà ngói cổ đối xứng dẫn vào **"Tủ đồ"** (`closet`).
  - Ở giữa phía sau: Cổng vòm gạch rêu phong dẫn vào **"Cốt truyện"** (`journey`) kèm hiệu ứng vầng sáng `door-entrance-glow.png`.
  - Bên trái cổng vòm sát tường vôi trắng: Kệ sách gỗ dẫn vào **"Bảo tàng"** (`museum`).
  - Góc sân: Bậc thềm gạch cạnh ao sen là nơi chú mèo Nếp nằm sưởi nắng.
- **Thanh HUD:** Thanh `ui-hud--3slice.png` ghim cố định mép trên cùng, hiển thị logo tiệm bên trái, số dư Sen Ngọc và nút Cài đặt bên phải.
- **Thẻ hành động:** Khung thẻ `action-card-frame--9slice.png` hiển thị nổi ở góc dưới bên trái hoặc trung tâm sân gạch với hai nút: "Tạo nhân vật từ ảnh" và "Dạo quanh sân nhà".

### Bố cục dọc (Bố cục phụ)
- **Thanh HUD:** Thanh `ui-hud--3slice.png` ghim cố định mép trên màn hình.
- **Cảnh nền:** Nền `background--portrait.png` hiển thị ở khu vực trung tâm; 4 điểm chạm vào 4 khu vực được xếp so le hoặc dạng danh sách biển gỗ nổi bật.
- **Thẻ hành động:** Hiển thị ở góc đáy màn hình dưới dạng ngăn kéo vuốt mở (bottom sheet).

---

## Lịch Sử Gen (Không Còn Hiệu Lực)

### Mô Tả Chủ Thể Tạo Ảnh Nền Ngang

- **Mô tả chủ thể (EN) cho `background--landscape.png`:**
  ```text
  pixel art, 800x500 pixel grid, every pixel a crisp square block, limited palette, hard edges, no anti-aliasing, dithering, wide panoramic view of an ancient Northern Vietnamese courtyard at golden dusk, red terracotta tiled yard with a circular floral center pattern, tranquil lotus pond on the left flank, traditional tiled roof workshops on left and right flanks, grand mossy arched brick gateway in center background, rustic white plaster wall with wooden bookshelf niche beside the gate. Soft sunset golden hour glow, warm amber lantern illumination. Upper area clear for top HUD bar, lower central area clear for floating action card. Pure environmental background without any characters, human figures, or baked text.
  ```

Prompt bối cảnh chi tiết tham khảo tại `docs/07-game/prologue/setup.md` (phân cảnh `c0-s1-tiem-may-chieu`) và `docs/03-features/hub.md`.

---

## Kết quả tạo ảnh

Đã tạo năm PNG bằng công cụ `image_gen` tích hợp. Hai nền giữ sân nhà hoàng hôn, ao sen bên trái, hai gian nhà, cổng vòm và kệ sách; không có nhân vật hay chữ. Nội dung HUD, nhãn điều hướng, mèo Nếp và thẻ hành động được giao diện phủ riêng lên cảnh.

- Ảnh gốc và phiên bản chỉnh bố cục nằm trong [`_raw/`](./_raw/).
- Toàn bộ prompt, nguồn tài liệu được lưu trong [`_raw/generation.json`](./_raw/generation.json).
- [`asset-manifest.json`](./asset-manifest.json) ghi kích thước, bảng màu, kênh alpha và vùng cắt của từng ảnh.
