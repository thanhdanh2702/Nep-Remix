# Đặc Tả Tính Năng Sảnh Tiệm May (Hub)

## 1. Mục đích của khu vực

Sảnh tiệm may là không gian trung tâm của ứng dụng, đóng vai trò như bản đồ điều hướng trực quan mang phong cách pixel art ấm cúng. Tại đây, bối cảnh mở ra là khoảng sân nhà ngoài trời lúc hoàng hôn rực rỡ, giúp người dùng nắm bắt số tài nguyên (Sen Ngọc) mình sở hữu, theo dõi tiến độ câu chuyện và dễ dàng chuyển đổi qua lại giữa bốn khu vực chức năng chính thông qua các biển gỗ điều hướng trực quan thay cho các thanh menu dạng chữ khô khan.

## 2. Bố cục trực quan và các thành phần trên giao diện

### Bố cục ngang (chính)
- **Tỷ lệ hiển thị:** Nền gốc `garden-user--landscape.png` kích thước 1586×992, hiển thị theo kích thước thật với smoothing (`image-rendering: auto`) để fit/cover viewport. Thế giới logic 1000×625 px (tỷ lệ ~8:5).
- **Cảnh nền sân nhà:** Sân gạch đỏ nhìn từ trên cao lúc hoàng hôn, vòng hoa sen giữa sân, ao sen góc trái, các dãy nhà ngói phủ hoa (mèo Nếp đã vẽ sẵn trong ảnh). Bốn biển khu vực (`area-sign-frame.png`) gắn trên mái, đi theo cùng phép biến đổi camera với nền:
  - Nhà bên trái: **"Phòng phối đồ"** (`studio`).
  - Cổng giữa phía sau: **"Cốt truyện"** (`journey`).
  - Nhà bên phải: **"Tủ đồ"** (`closet`).
  - Nhà góc phải phía trước: **"Bảo tàng"** (`museum`).
- **An:** đứng giữa vòng hoa sen, cao khoảng 15% chiều cao nền (`HUMAN_HEIGHT.hub`), đi lại bằng WASD/phím mũi tên; đến gần biển thì bấm E hoặc nút "Tương tác".
- **HUD:** thanh tiêu đề trên cùng (logo, Màn chờ, Về Nếp, Cách chơi); ví Sen Ngọc (`currency-hud.png`) và nút Cài đặt (`settings-button.png`) ở góc phải trên. Các ảnh này là bản vẽ hi-res, hiển thị mượt (`art-hires`).
- **Thẻ chào lần đầu:** khung `action-card-frame--9slice.png` với tiêu đề "Bắt đầu câu chuyện của bạn" và hai nút "Chọn diện mạo", "Dạo quanh sân nhà".
- Các ảnh `background--landscape/portrait` và `door-entrance-glow` đã gen nhưng **chưa dùng**.

### Bố cục dọc (phụ)
Màn điện thoại dùng cùng nền `garden-user--landscape.png`, camera bám theo An và cắt bớt hai bên:
- **Trên cùng:** thanh tiêu đề (logo, nút menu ☰); bên dưới là ví Sen Ngọc và nút cài đặt.
- **Bốn nút khu vực:** "Phòng phối đồ", "Tủ đồ", "Bảo tàng", "Cốt truyện" xếp lưới 2×2 ở đầu vùng chơi (khung `area-sign-frame.png`), không gắn trên mái như màn ngang.
- **Giữa:** sân gạch và An (cao khoảng 15% chiều cao nền).
- **Đáy màn hình:** bàn phím ảo Lên/Trái/Xuống/Phải và nút "E · Tương tác".

### Trạng thái bình thường
Toàn bộ khung cảnh sân nhà hoàng hôn hiển thị chi tiết theo phong cách pixel art sắc nét. Nhân vật đại diện đứng giữa sân, mèo Nếp khẽ vẫy đuôi, ánh đèn lồng tỏa sáng nhẹ. Thanh HUD phía trên hiển thị đầy đủ số Sen Ngọc tích lũy, nút âm thanh và ảnh avatar.

### Trạng thái đang tải (Loading)
Chỉ xuất hiện trong tích tắc (dưới 0.5 giây) khi tải dữ liệu ban đầu. Hiển thị hoạt ảnh tấm liếp tre/rèm lụa khép nhẹ kèm dòng thông báo pixel: *"Đang mở cửa sân nhà..."*.

### Trạng thái trống (Empty)
Không áp dụng cho cảnh nền sảnh vì tài nguyên luôn cố định. Nếu người dùng mới chưa có dữ liệu tài sản, hệ thống tự động khởi tạo giá trị ban đầu là `100 Sen Ngọc` (quà mừng vào tiệm). Thẻ chương tự động đặt mặc định là *"Mở đầu: Căn gác thu 2026"* (+50 Sen Ngọc).

### Trạng thái lỗi (Error)
Xảy ra khi hình ảnh nền hoặc sprite nhân vật không tải được do lỗi đường truyền mạng. Sảnh tiệm chuyển sang hiển thị nền tối giản theo bảng màu giao diện (`plum-900` kết hợp viền `gold-500`), bốn khu vực hiển thị dưới dạng các thẻ khối chữ nhật rõ ràng để người dùng không bị gián đoạn thao tác.

### Trạng thái dự phòng khi AI lỗi (Fallback)
Sảnh tiệm may hoạt động hoàn toàn bằng mã nguồn phía máy khách (Client-side), không phụ thuộc vào bất kỳ lệnh gọi API bên ngoài nào. Khi các dịch vụ AI tạm gián đoạn, việc điều hướng giữa 4 khu vực, kiểm tra số Sen Ngọc và đọc cốt truyện có sẵn vẫn hoạt động trơn tru 100%.

## 5. Tiêu chí để coi là làm xong (Acceptance Criteria)

- Bốn biển gỗ điều hướng ("Phòng phối đồ", "Tủ đồ", "Cốt truyện", "Bảo tàng") có vùng bấm (hitbox) chuẩn xác, tối thiểu 48×48 pixel trên màn hình cảm ứng, có hiệu ứng phản hồi khi rê chuột hoặc chạm tay.
- Hiển thị đầy đủ và sắc nét logo, dải khẩu hiệu, cụm HUD (Sen Ngọc, âm thanh, avatar), mèo Nếp trên thềm gạch, thẻ "Bắt đầu câu chuyện của bạn" và thẻ chương.
- Thẻ chương hiển thị chuẩn xác chương đang chơi dở (đối với tài khoản mới: *"Mở đầu: Căn gác thu 2026"* và mức thưởng `+50 Sen Ngọc`).
- Chuyển phân khu mượt mà dưới 300ms, không nháy trắng màn hình.
- Giá trị Sen Ngọc được đồng bộ và lưu trữ tức thời vào `localStorage`.
- Chạm vào mèo Nếp hiển thị được ít nhất 3 lời thoại ngẫu nhiên trong khung thoại pixel art.
