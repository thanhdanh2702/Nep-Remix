# Danh Sách Tính Năng Ứng Dụng Tiệm May Nếp

Bảng dưới đây tổng hợp toàn bộ các tính năng dự kiến của ứng dụng Tiệm May Nếp, được đánh mã từ F01 trở đi. Nhóm mình phân định rõ tính năng nào bắt buộc phải chạy được trên bản nộp ngày 10/10/2026 và tính năng nào là dự phòng hoặc phát triển sau.

| Mã | Tên tính năng | Phân khu | Mục tiêu chính | Bắt buộc cho 10/10 |
| :--- | :--- | :--- | :--- | :--- |
| F01 | Luồng tạo nhân vật tại sảnh (Onboarding) | Sảnh sân nhà | Chọn mẫu có sẵn hoặc tải ảnh selfie tạo diện mạo mặc áo dài trắng | Có (dùng mẫu có sẵn làm lõi) |
| F02 | Selfie với sự đồng ý cho nhân vật tùy chỉnh | Sảnh chờ | Chọn ảnh, tick đồng ý gửi tới Gemini, bấm Phân tích để nhận gợi ý kiểu tóc và áp vào An; ảnh thu nhỏ trên máy, không lưu | Có (cần API key) |
| F03 | Thử đồ và đổi lớp phục trang | Phòng phối đồ (Studio) | Chọn phom áo, màu sắc, phụ kiện; cập nhật hình ảnh nhân vật tức thì | Có |
| F04 | Bộ lọc ngữ cảnh và sự kiện | Phòng phối đồ (Studio) | Lọc nhanh gợi ý đồ theo sự kiện (Tết, cưới, bế giảng, lễ chùa, viếng tang) | Có |
| F05 | Trợ lý mèo Nếp gợi ý đồ | Phòng phối đồ (Studio) | Mèo mướp đưa ra 3 bộ trang phục phù hợp với sự kiện và thời tiết | Có |
| F06 | Chấm điểm hài hòa màu sắc | Phòng phối đồ (Studio) | Đo độ tương phản và sắc độ, đưa điểm số và nhận xét ngắn | Có |
| F07 | Nhắc nhở quy tắc văn hóa | Phòng phối đồ (Studio) | Đưa cảnh báo nhẹ khi phối đồ lệch nghi lễ truyền thống, không cấm đoán | Có |
| F08 | So sánh song song trang phục | Phòng phối đồ (Studio) | Hiển thị 2 bộ đồ cạnh nhau để người dùng quan sát và chọn lựa | Có |
| F09 | Lookbook AI hai chế độ (người mẫu của tiệm / ảnh của tôi có đồng ý) | Phòng phối đồ (Studio) | Gemini chụp 4 góc (chính diện, ngoảnh lại, sau lưng, cận cảnh) bộ đang phối, trên người mẫu hư cấu hoặc ảnh của chính người chơi sau khi tick đồng ý; chụp lại từng góc, lưu PNG | Có (code done; hết lượt hoặc offline thì giữ ảnh pixel) |
| F10 | Kho lưu trữ trang phục cá nhân | Tủ đồ (Closet) | Xem lại các bộ đồ đã lưu, các mẫu áo đã mở khóa hoặc mua được | Có |
| F11 | Cửa hàng phụ kiện bằng Sen Ngọc | Tủ đồ (Closet) | Dùng Sen Ngọc thưởng để mở khóa thêm các phụ kiện truyền thống | Có |
| F12 | Xưởng may số hóa áo thật | Xưởng may (nằm trong Tủ đồ) | Quét ảnh áo thật, Gemini nhận diện dáng/cổ/hoa văn/màu và mở Phòng phối đồ với dáng + màu tương ứng | Có (Gemini extract cần API key) |
| F13 | Phân biệt áo dài với y phục ngoại | Xưởng may (nằm trong Tủ đồ) | Nhận diện sườn xám hoặc hanbok và hiển thị thẻ giải thích khác biệt | Có (Gemini recognition cần API key) |
| F14 | Thư viện thẻ tư liệu văn hóa | Bảo tàng (Museum) | Đọc tư liệu y phục người Kinh kèm chú dẫn nguồn sách lịch sử xác thực | Có |
| F15 | Tìm kiếm và lọc thẻ lịch sử | Bảo tàng (Museum) | Tìm thẻ tư liệu theo tên áo, thời kỳ lịch sử hoặc hoàn cảnh sử dụng | Có |
| F16 | Giải đố tìm đồ vật point-and-click | Cốt truyện (Journey) | Tương tác trong bối cảnh gác xép và chiếc rương cũ để tìm manh mối; kết hợp vật phẩm để giải puzzle | Có (Chương 1 chơi được) |
| F17 | Cơ chế Lật vải (Fabric Flip) | Cốt truyện (Journey) | Chuyển đổi giữa mặt phải và mặt trái của khung cảnh để giải đố | Chưa (Chương 1 chưa dùng) |
| F18 | Thử thách phối đồ lịch sử | Cốt truyện (Journey) | Bài tập phối đồ đúng bối cảnh ở cuối chương để mở khóa áo độc quyền | Có (Chương 1 chơi được) |
| F19 | Đối đầu với thực thể Ông Lệ | Cốt truyện (Journey) | Lựa chọn hành động hoặc lời thoại giải trừ định kiến làng xã trong game | Chưa (Chương 1 chưa có) |
| F20 | Lưu trữ cục bộ không cần tài khoản | Toàn hệ thống | Tự động lưu tủ đồ, số Sen Ngọc, tiến trình game vào bộ nhớ trình duyệt | Có |
