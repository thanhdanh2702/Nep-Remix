# Đặc Tả Tính Năng Phòng Phối Đồ (Studio)

## 1. Mục đích của khu vực

Phòng phối đồ (Studio, nằm ở dãy nhà ngói bên trái sân nhà với hình ảnh bàn may ấm cúng) là phân khu cốt lõi phục vụ trực tiếp đề bài "Việt phục Remix". Nơi đây cho phép học sinh, sinh viên tự do thử nghiệm các kiểu phối áo truyền thống người Kinh (tứ thân, ngũ thân tay chẽn, ngũ thân tay thụng, áo dài tân thời), kết hợp màu sắc từ Bảng màu truyền thống cho vải áo và phụ kiện theo từng bối cảnh đời sống thực tế. Khu vực này tích hợp thước đo kiểm tra mức độ hài hòa màu sắc, các lưu ý văn hóa để người mặc tự tin không phạm quy tắc lễ nghi, và tính năng tạo ảnh Lookbook chân thực bằng Gemini.

## 2. Các bước người dùng thao tác

Bước 1: Chọn ngữ cảnh sự kiện. Người dùng bấm chọn một trong các thẻ sự kiện: Tết Nguyên đán, Lễ cưới, Bế giảng tốt nghiệp, Đi lễ chùa, Đi viếng tang, hoặc Tự do dạo phố.

Bước 2: Chọn phom dáng áo. Người dùng chọn 1 trong 4 phom dáng y phục: Áo tứ thân, Áo ngũ thân tay chẽn, Áo ngũ thân tay thụng (Áo tấc), hoặc Áo dài tân thời. Nhân vật trên bục đứng lập tức đổi dáng áo tương ứng.

Bước 3: Tùy biến màu sắc và họa tiết. Người dùng chọn màu tà áo, màu cổ áo và màu quần/váy từ Bảng màu truyền thống cho vải áo (màu củ nâu, chàm, điều, hoàng yến, men lam, giấy dó...).

Bước 4: Chọn phụ kiện đi kèm. Người dùng chọn thêm các món phụ kiện: Khăn vấn, Nón ba tầm/Nón lá, Guốc mộc, Quạt giấy hoặc Chuỗi hạt.

Bước 5: Xem đánh giá và gợi ý:
- Xem thanh điểm hài hòa màu sắc (thang điểm 100) và nhận xét ngắn về độ tương phản.
- Đọc thẻ lưu ý văn hóa nếu cách phối hiện tại có chi tiết dễ gây hiểu lầm hoặc vi phạm lễ nghi (ví dụ: mặc đồ quá sặc sỡ đi viếng tang).
- Bấm vào mèo Nếp để xem 3 bộ đồ mẫu do Nếp phối sẵn theo sự kiện đã chọn và thời tiết giả định (nắng ấm/mát mẻ/se lạnh).

Bước 6: Thao tác nâng cao:
- Bấm "So sánh" để ghim bộ đồ hiện tại và chuyển sang phối bộ thứ hai đặt song song.
- Bấm "Lưu bộ đồ" để đưa vào Tủ đồ cá nhân.
- Bấm "Tạo Lookbook" để gửi yêu cầu sinh 4 ảnh chân thực người mẫu do AI tạo theo 4 góc nhìn (chính diện, nghiêng, sau lưng, cận chi tiết; tuyệt đối không dùng khuôn mặt người dùng).

## 3. Các trạng thái màn hình

### Bố cục ngang (chính)
- **Cảnh nền:** Nền gốc `vietnamese-room--landscape.png` kích thước 1585×992, hiển thị theo kích thước thật với smoothing (`image-rendering: auto`) để fit/cover viewport, thể hiện không gian xưởng may Studio ấm cúng với kệ cuộn vải lụa, giá treo thước gỗ và ánh sáng tự nhiên từ cửa sổ bên.
- **Nửa bên trái (khoảng 380 px):** Sân khấu bục đứng An thử đồ đặt chính giữa (khung 176×416, điểm chân 88,400), hiển thị bóng chân và vòng hào quang lấp lánh khi đổi đồ, phía dưới có các nút xoay góc nhìn hoặc lật mặt vải áo. Áo được vẽ theo lớp garment spec An (dải 528×416: front | side-left | back) tô màu gradient-map từ xám calibrated sang màu palette. Nếu chưa có asset mới thì hiển thị icon hoặc fallback bản 64×96.
- **Nửa bên phải (khoảng 400 px):** Bảng điều khiển tab được bao bọc bởi khung `studio-panel-frame--9slice.png`:
  - Hàng trên: Dải chọn sự kiện `event-selector-strip--3slice.png` (Tết, Lễ cưới, Bế giảng, Đi lễ chùa, Tang lễ, Dạo phố).
  - Thanh tab chuyển danh mục: "Dáng áo", "Màu sắc", "Phụ kiện", "Họa tiết".
  - Khu vực danh mục: Lưới các ô biểu tượng áo hoặc phụ kiện (icon 48×48 px).
  - Khi chọn tab màu: Hiển thị thanh màu truyền thống `color-palette-bar--3slice.png` với các nút mẫu màu (củ nâu, chàm, điều, hoàng yến...).
  - Dưới cùng của bảng: Cụm nút hành động chính gồm "Lưu bộ phối", "Tạo Lookbook AI" và "Mặc thử ngay".
- **Cửa sổ Lookbook AI:** Khi bấm tạo Lookbook, khung modal `lookbook-modal--9slice.png` mở nổi căn giữa màn hình (kích thước khoảng 560×420 px), hiển thị lưới 4 ảnh AI chân thực theo 4 góc nhìn kèm thanh tiến độ 45 giây.

### Bố cục dọc (phụ)
Màn hình chia làm hai phần: nửa trên là bục đứng của nhân vật pixel phản hồi tức thì mỗi khi thay đổi trang phục, kèm chỉ số điểm màu sắc; nửa dưới là các thanh trượt theo tab (Dáng áo, Màu sắc, Phụ kiện, Sự kiện).

### Trạng thái đang tải (Loading)
Xuất hiện khi người dùng bấm nút "Tạo Lookbook". Màn hình hiển thị thanh tiến độ trực quan để người dùng theo dõi, người mẫu do AI tạo hoàn toàn hư cấu (không dùng mặt người dùng). Cơ chế hiển thị tiến độ bất đồng bộ: ảnh nào sinh xong trước sẽ hiện lên khung trước, không cần đợi đủ cả 4 ảnh. Thời gian xử lý tối đa 45 giây.

### Trạng thái trống (Empty)
Khi người dùng chuyển sang chế độ "So sánh" nhưng chưa lưu bộ đồ nào để đối chiếu, ô so sánh bên cạnh hiển thị hình bóng mờ của chiếc mắc áo cùng thông báo: "Chưa có bộ đồ thứ hai. Hãy phối thêm một bộ để so sánh nhé!".

### Trạng thái lỗi (Error)
Xuất hiện khi người dùng chọn kết hợp các món đồ xung đột hiển thị (ví dụ: đội nón ba tầm cùng lúc với nón lá chóp). Hệ thống tự động bỏ chọn món đồ cũ, gắn món đồ mới và hiện thông báo ngắn trong 2 giây: "Đã đổi loại nón phù hợp".

### Trạng thái dự phòng khi AI lỗi (Fallback)
Đối với tính năng "Tạo Lookbook":
- Nếu mạng ngắt, API báo lỗi hoặc quá thời gian chờ (sau đúng 45 giây): Khung tạo ảnh thông báo: "Phòng chụp studio đang bận. Tiệm gửi bạn bản phác thảo pixel art để lưu kỷ niệm nhé!".
- Hệ thống lập tức xuất ra một bức ảnh tổng hợp dạng thẻ bài Polaroid vẽ bằng pixel art thể hiện nhân vật cùng bảng thông tin các món đồ đã phối, kèm nút "Tải ảnh về máy". Người dùng vẫn có sản phẩm để khoe mà không bị đứt đoạn trải nghiệm.
- Đối với gợi ý của mèo Nếp: Nếu API không trả về gợi ý thời tiết động, hệ thống sử dụng kho 15 bộ quy tắc có sẵn trong mã nguồn để mèo Nếp đưa ra 3 bộ đồ phù hợp nhất với sự kiện.

## 4. Tiêu chí để coi là làm xong (Acceptance Criteria)

- Đổi phom áo, màu sắc và phụ kiện trên nhân vật phản hồi ngay lập tức dưới 100 mili-giây.
- Bộ lọc sự kiện cập nhật đúng danh sách đồ phù hợp.
- Thước đo màu sắc tính toán và hiển thị điểm số nhất quán theo công thức tương phản màu sắc.
- Thông điệp nhắc nhở văn hóa hiển thị đúng khi vi phạm 5 quy tắc chuẩn mực đã định nghĩa.
- Tính năng so sánh đặt được 2 bộ đồ cạnh nhau trên màn hình mà không vỡ khung.
- Luôn có kết quả trả về khi bấm tạo Lookbook (ảnh chân thực nếu thành công, thẻ pixel nếu gặp lỗi).
