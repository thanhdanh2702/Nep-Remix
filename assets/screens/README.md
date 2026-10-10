# Tài Nguyên Màn Hình Giao Diện Ứng Dụng (assets/screens)

Thư mục này chứa asset đang dùng của **Tiệm May Nếp**, gom theo màn hình: Sảnh (`main-shop`), Phòng phối đồ (`studio`), Bảo tàng (`museum`), Tủ đồ (`wardrobe`), màn chờ (`welcome`) và bản đồ (`journey`). Xưởng may (`workshop`) hiện dùng HTML/CSS trong hộp thoại Tủ đồ và không có PNG riêng.

Asset sảnh chia thành `main-shop/backgrounds/` và `main-shop/ui/`. Ảnh mẫu, ảnh nguồn và prompt tạo ảnh nằm trong [`../references/`](../references/README.md), không được đưa vào bản build. README của từng màn liệt kê bộ hình hiện tại.

Mọi màn hình tuân thủ nguyên tắc thiết kế thích ứng hai hướng: **Bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

**Kích thước và cấu trúc:** Xem `assets/README.md` mục 5 (Bảng chuẩn hóa loại asset).

## Danh sách tệp cần bổ sung

| Tên tệp | Loại asset | Trạng thái | Mô tả |
| :--- | :--- | :---: | :--- |
| `common-hud-bar--3slice.png` | `ui-bar-3slice` | Chưa có | Thanh HUD trên đỉnh màn hình; 3-slice với 2 đầu cố định, thân giữa co giãn ngang; dùng chung cả hai hướng |
| `modal-frame-wood--9slice.png` | `ui-frame-9slice` | Chưa có | Khung cửa sổ modal viền gỗ; 9-slice với 4 góc cố định, 4 cạnh co giãn/lặp, tâm trong suốt; dùng chung cả hai hướng |

---

## Nguyên Tắc Bố Cục Chung Cho Màn Hình

### Bố cục ngang (Bố cục chính)
- Khung nhìn rộng, thường chia làm 2 khối chính (nửa trái là sân khấu nhân vật / kệ trưng bày / khung tương tác, nửa phải là bảng điều khiển danh mục tab hoặc khu vực thao tác).
- Thanh HUD ghim sát mép trên cùng màn hình, chứa logo Tiệm May Nếp góc trái, số dư Sen Ngọc và nút Cài đặt/Âm thanh góc phải.
- Cửa sổ bật lên (Modal / Popup) căn giữa màn hình, chia 2 cột nội dung để tận dụng độ rộng.

### Bố cục dọc (Bố cục phụ)
- Khung nhìn dọc, xếp tuần tự từ trên xuống dưới; nửa trên dành cho nhân vật hoặc bối cảnh chính, nửa dưới chuyển thành bảng thẻ vuốt mở dạng ngăn kéo đáy (bottom sheet) để tối ưu công thái học một tay.
- Thanh HUD sát mép trên màn hình, tự động co hẹp bề ngang theo chiều rộng thiết bị.
- Cửa sổ bật lên co giãn thành hộp thoại dạng thẻ nổi hoặc mở toàn màn hình, nội dung xếp dọc 1 cột.

---

Tài liệu đặc tả chi tiết giao diện và luồng màn hình xem tại `docs/03-features/` và `docs/06-design/design-system.md`.
