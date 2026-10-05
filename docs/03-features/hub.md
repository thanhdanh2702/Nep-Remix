# Đặc Tả Tính Năng Sảnh Tiệm May (Hub)

## 1. Mục đích của khu vực

Sảnh tiệm may là không gian trung tâm của ứng dụng, đóng vai trò như bản đồ điều hướng trực quan mang phong cách pixel art ấm cúng. Tại đây, bối cảnh mở ra là khoảng sân nhà ngoài trời lúc hoàng hôn rực rỡ, giúp người dùng nắm bắt số tài nguyên (Sen Ngọc) mình sở hữu, theo dõi tiến độ câu chuyện và dễ dàng chuyển đổi qua lại giữa bốn khu vực chức năng chính thông qua các biển gỗ điều hướng trực quan thay cho các thanh menu dạng chữ khô khan.

## 2. Bố cục trực quan và các thành phần trên giao diện

### Bố cục ngang (chính)
- **Tỷ lệ hiển thị:** Nền gốc `garden-user--landscape.png` kích thước 1586×992, hiển thị theo kích thước thật với smoothing (`image-rendering: auto`) để fit/cover viewport. Thế giới logic 1000×625 px (tỷ lệ ~8:5).
- **Cảnh nền sân nhà:** Khung cảnh sân gạch đỏ cổ truyền lúc hoàng hôn vàng ấm:
  - Bên trái: Dãy nhà ngói cổ dẫn vào **"Phòng phối đồ"** (`studio`).
  - Bên phải: Dãy nhà ngói cổ đối xứng dẫn vào **"Tủ đồ"** (`closet`).
  - Ở giữa phía sau: Cổng vòm gạch cổ dẫn vào **"Cốt truyện"** (`journey`) kèm hiệu ứng vầng sáng `door-entrance-glow.png`.
  - Bên trái cổng vòm sát tường vôi trắng: Kệ sách gỗ dẫn vào **"Bảo tàng"** (`museum`).
  - Góc sân: Bậc thềm gạch cạnh ao sen là nơi chú mèo Nếp nằm sưởi nắng.
- **Thanh HUD:** Thanh `ui-hud--3slice.png` ghim cố định mép trên cùng (cách mép 8px, rộng 760–784 px, cao 40 px), hiển thị logo tiệm bên trái, số dư Sen Ngọc và nút Cài đặt bên phải.
- **Thẻ hành động:** Khung thẻ `action-card-frame--9slice.png` hiển thị nổi ở góc dưới bên trái hoặc trung tâm sân gạch với hai nút: "Tạo nhân vật từ ảnh" và "Dạo quanh sân nhà".

### Bố cục dọc (phụ)
Khung cảnh được thiết kế theo tỉ lệ ngang 16:9 chuẩn (với bố cục chuyên biệt cho màn hình dọc), mô phỏng khoảng sân gạch đỏ truyền thống dưới ánh chiều hoàng hôn, bao gồm đầy đủ các thành phần trực quan:

- **Góc trên bên trái:** Logo "Tiệm May Nếp" với dòng phụ "Việt phục Remix", được lồng trong khung hoa văn pixel cách điệu cánh hoa sen hồng nở rộ.
- **Phía trên ở giữa:** Dải lụa khẩu hiệu mềm mại mang thông điệp chính thức của tiệm: *"Một tà áo. Muôn câu chuyện."*
- **Cụm HUD góc trên bên phải:** Đặt trên nền tím mận (`plum-900`), hiển thị số Sen Ngọc tích lũy (kèm biểu tượng ngọc hoa sen hồng lấp lánh, ví dụ: `1.250`), nút bật/tắt âm thanh nền pixel art, và khung tròn chân dung avatar thu nhỏ của người chơi.
- **Không gian sân nhà trung tâm:**
  - Nền sân lát gạch đỏ ấm áp, chính giữa sân là vòng tròn hoa văn đá cổ kính.
  - Phía bên trái là hồ sen nở rộ với các tán lá xanh mướt, đài sen hồng và đèn đá cổ soi bóng nước.
  - Phía sau là bức tường hoa leo, ở chính giữa là cổng vòm gạch cổ dẫn lối vào khu vườn hoa rực rỡ nắng chiều.
  - Hai bên sân là hai dãy nhà ngói cổ truyền mái cong ấm cúng với đèn lồng đỏ treo cao, bên trong trưng bày bàn ghế may, gương soi, sào treo y phục và vải vóc rực rỡ.
- **Bốn biển gỗ điều hướng tương tác (Navigation Signboards):**
  - **Biển "Phòng phối đồ"** (`id: studio`): Treo trước dãy nhà ngói bên trái; dẫn vào không gian phối đồ, chọn màu sắc vải áo, hoa văn và phụ kiện.
  - **Biển "Tủ đồ"** (`id: closet`): Treo trước dãy nhà ngói bên phải; dẫn vào phân khu tích hợp Tủ đồ cá nhân, Cửa hàng phụ kiện và Xưởng may số hóa.
  - **Biển "Cốt truyện"** (`id: journey`): Đặt ngay trên vòm cổng hoa ở giữa sân; dẫn vào game giải đố Hành trình ký ức và khám phá chiếc rương cũ trên gác xép.
  - **Biển "Bảo tàng"** (`id: museum`): Kệ sách gỗ gắn biển đặt sát bức tường trắng bên trái cổng vòm; dẫn vào kho thẻ tư liệu văn hóa và lịch sử y phục người Kinh.
- **Nhân vật đại diện:** Đứng trang nhã ngay trên tâm vòng hoa văn tròn giữa sân, mặc định diện chiếc áo dài trắng truyền thống điểm xuyết hoa sen thanh lịch.
- **Mèo Nếp:** Chú mèo mướp lông vàng trắng nằm ngủ cuộn tròn lười biếng trên bậc thềm gạch bên dãy nhà phải, cạnh giá treo áo dài và khóm hoa hồng.
- **Thẻ "Bắt đầu câu chuyện của bạn" (ở giữa phía dưới):** Khung viền pixel ba lớp viền hoa sen, hiển thị ảnh đại diện nhân vật, tiêu đề *"Bắt đầu câu chuyện của bạn"*, phụ đề *"Từ ảnh của bạn đến nhân vật pixel và lookbook 4 góc."*, nút hành động chính màu hồng sen *"Tạo nhân vật từ ảnh ▶"* và liên kết văn bản phụ bên dưới *"Dạo quanh sân nhà ▶"*.
- **Thẻ chương cốt truyện (góc dưới bên phải):** Bảng thẻ giấy lụa cuộn viền hoa sen hiển thị phân đoạn đang chơi dở (với người dùng mới, thẻ hiển thị: *"CHƯƠNG 01 - Mở đầu: Căn gác thu 2026"*, kèm biểu tượng hoa cài ngọc và mức thưởng `+50 Sen Ngọc`; các chương tiếp theo hiển thị mức thưởng `+100 Sen Ngọc`).

## 3. Các bước người dùng thao tác

- **Bước 1:** Khi mở ứng dụng, người dùng vào thẳng không gian Sân nhà hoàng hôn mà không bị chặn bởi màn hình giới thiệu độc lập.
- **Bước 2:** Người dùng quan sát toàn cảnh sân tiệm và có thể tương tác với các điểm chạm:
  - Bấm vào biển gỗ **"Phòng phối đồ"** (hoặc gian nhà bên trái): Mở phòng thử đồ và sáng tạo trang phục.
  - Bấm vào biển gỗ **"Tủ đồ"** (hoặc gian nhà bên phải): Mở ngăn tủ cá nhân, cửa hàng phụ kiện và xưởng may số hóa.
  - Bấm vào biển gỗ **"Cốt truyện"** (hoặc cổng vòm ở giữa): Vào game giải đố hành trình tìm hiểu quá khứ chiếc rương cũ.
  - Bấm vào biển gỗ **"Bảo tàng"** (hoặc kệ sách gỗ bên tường): Mở kho thẻ bài văn hóa y phục.
- **Bước 3:** Tại thẻ "Bắt đầu câu chuyện của bạn" ở cạnh dưới:
  - Chọn nút *"Tạo nhân vật từ ảnh"* để mở giao diện tải ảnh selfie hoặc chọn mẫu nhân vật theo ý muốn.
  - Chọn *"Dạo quanh sân nhà"* để lập tức tự do khám phá sảnh với nhân vật mẫu áo dài trắng mặc định.
- **Bước 4:** Chạm vào thẻ chương góc dưới phải để tiếp tục ngay màn chơi dang dở và thu thập Sen Ngọc thưởng.
- **Bước 5:** Chạm vào chú mèo Nếp trên bậc thềm để lắng nghe câu thoại chào vui vẻ hoặc lời gợi ý thời tiết trong ngày.

## 4. Các trạng thái màn hình

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
