# Đặc Tả Tính Năng Tủ Đồ Và Xưởng May (Closet & Workshop)

## 1. Mục đích của khu vực

Phân khu Tủ đồ (nằm ở dãy nhà ngói bên phải sân nhà) tích hợp ba chức năng liên kết chặt chẽ: Tủ đồ cá nhân (Closet), Cửa hàng phụ kiện và Xưởng may số hóa (Workshop).
- **Tủ đồ và Cửa hàng:** Nơi lưu trữ các mẫu áo người dùng đã phối từ Phòng phối đồ, quản lý phụ kiện đang sở hữu và mua sắm vật phẩm mới bằng Sen Ngọc thưởng tích lũy trong app.
- **Xưởng may:** Không gian ứng dụng AI thị giác: người dùng đưa ảnh một chiếc áo dài ngoài đời thực vào, mô hình Gemini sẽ phân tích cấu trúc, màu sắc, hoa văn để may lại thành một chiếc áo pixel đưa vào tủ đồ. Đồng thời, Xưởng may đóng vai trò bộ lọc phân định văn hóa: nếu người dùng tải nhầm ảnh sườn xám hoặc hanbok, hệ thống sẽ phân tích các điểm khác biệt hình thái để người dùng hiểu rõ nét riêng của y phục người Kinh.

## 2. Các bước người dùng thao tác

### Thao tác tại Tủ đồ và Cửa hàng phụ kiện
Bước 1: Người dùng mở Tủ đồ, màn hình hiển thị hai ngăn kéo lớn: "Tủ Quần Áo" và "Cửa Hàng Phụ Kiện".

Bước 2: Trong ngăn "Tủ Quần Áo", người dùng xem danh sách các bộ đồ đã lưu từ Phòng phối đồ hoặc các mẫu áo may được từ Xưởng may. Bấm vào một bộ để xem chi tiết hoặc bấm "Mặc ngay" để đưa trang phục lên người nhân vật.

Bước 3: Chuyển sang ngăn "Cửa Hàng Phụ Kiện", người dùng xem các món đồ đang bán (khăn vấn cao cấp, quạt trầm hương, chuỗi ngọc, nón quai thao thêu...). Mỗi món hiển thị giá Sen Ngọc tương ứng.

Bước 4: Người dùng bấm "Mua", nếu đủ Sen Ngọc, hệ thống trừ Sen Ngọc, hiển thị hiệu ứng mở hộp quà pixel và chuyển món đồ vào kho đồ dùng được ngay trong Phòng phối đồ. Nếu không đủ Sen Ngọc, hệ thống gợi ý cách kiếm Sen Ngọc (chơi game Cốt truyện, may áo ở Xưởng may hoặc đọc thẻ ở Bảo tàng).

### Thao tác tại Xưởng may số hóa
Bước 1: Người dùng chuyển sang tab "Xưởng May", chạm vào khung bàn cắt vải để tải lên ảnh chụp một chiếc áo dài ngoài đời thực.

Bước 2: Nhấn nút "Bắt đầu may đo". Hệ thống gửi ảnh sang Gemini để bóc tách thông số cấu trúc (dáng áo, cổ áo, tay áo, màu chủ đạo, hoa văn).

Bước 3: Hiển thị kết quả:
- Trường hợp 1 (Nhận diện đúng áo dài): Hệ thống hiển thị chiếc áo pixel vừa được tạo thành công, kèm bảng tóm tắt đặc điểm và nút "Cất vào tủ đồ" (+50 Sen Ngọc thưởng).
- Trường hợp 2 (Nhận diện sườn xám hoặc hanbok): Hệ thống không tạo áo pixel mà mở bảng đối chiếu văn hóa: chỉ rõ các điểm khác nhau về cấu trúc tà, đường xẻ hông, cách cài khuy và phom dáng so với áo dài người Kinh. Người dùng được cộng 20 Sen Ngọc vì đã tìm hiểu kiến thức mới.

## 3. Các trạng thái màn hình

### Bố cục ngang (chính)
- **Phân khu Tủ đồ (`wardrobe`):**
  - **Cảnh nền:** Nền gốc `closet-shelf--landscape.png`, hiển thị với smoothing để fit/cover viewport, thể hiện phòng phục trang gỗ lim ấm áp và gương soi toàn thân.
  - **Nửa bên trái:** Bục đứng An mặc thử (khung 176×416, điểm chân 88,400), hiển thị ngay diện mạo khi bấm chọn đồ trong tủ; phía dưới có nút "Phối tiếp trong Studio". Áo được vẽ theo spec An với fallback nếu chưa có asset lớp áo.
  - **Nửa bên phải:** Bảng tủ đồ bọc trong khung `action-card-frame--9slice.png`, chứa thanh tab ("Áo đã có", "Bộ đã lưu", "Cửa hàng", "Xưởng may") và lưới ô đồ. Khi chuyển sang Cửa hàng, hiển thị danh sách phụ kiện kèm giá Sen Ngọc và trạng thái sở hữu.
- **Phân khu Xưởng may (`workshop`):**
  - **Cảnh nền:** Không sử dụng art background; Workshop chỉ có khung giao diện tải ảnh, khu vực phân tích AI kết quả, không vẽ nền cảnh.
  - **Trên cùng:** Khung thả ảnh (dashed border) để tải lên ảnh áo dài thật, kèm thông báo "Chọn hoặc thả ảnh áo vào đây" và "Ảnh chỉ dùng để nhận diện, không được lưu."
  - **Giữa:** Xem trước ảnh được chọn (tối đa 140px cao) và nút "Nhờ Gemini xem áo" để phân tích.
  - **Dưới:** Bảng kết quả phân tích AI (khi có) hiển thị dáng áo, cổ áo, hoa văn, màu chủ đạo, nút mở bảng so sánh với sườn xám/hanbok, và nút "Mặc thử" để áp vào Studio.

### Bố cục dọc (phụ)
Ngăn tủ đồ hiển thị dạng lưới các ô vuông pixel (mỗi ô là một trang phục hoặc phụ kiện). Góc trên cùng luôn hiển thị số Sen Ngọc hiện có.

### Trạng thái đang tải (Loading)
Xuất hiện khi Xưởng may đang gửi ảnh áo thật cho Gemini phân tích. Màn hình hiển thị hình ảnh chiếc máy may con bướm đang đạp chân nhịp nhàng kèm thông báo: "Thợ may Nếp đang đo đường kim mũi chỉ... (khoảng 3-5 giây)".

### Trạng thái trống (Empty)
- Trong ngăn Tủ đồ: Nếu người dùng chưa lưu bộ đồ nào, màn hình hiện chiếc mắc áo trống kèm dòng nhắn: "Tủ đồ đang vắng tanh. Bạn hãy sang Phòng phối đồ phối thử một bộ nhé!".
- Trong Xưởng may: Khung tải ảnh hiển thị đường nét đứt kèm biểu tượng máy ảnh và chữ: "Bấm vào đây để tải ảnh áo dài của bạn".

### Trạng thái lỗi (Error)
- Khi mua đồ không đủ Sen Ngọc: Nút mua rung lắc nhẹ kèm thông báo màu cam: "Bạn còn thiếu [X] Sen Ngọc. Hãy mở Cốt truyện khám phá chiếc rương cũ hoặc đọc thêm thẻ ở Bảo tàng nhé!".
- Khi tải ảnh lỗi định dạng hoặc ảnh mờ không thể nhận diện bất kỳ hình dáng trang phục nào: Hệ thống thông báo: "Ảnh mờ quá, thợ may chưa nhìn rõ nếp áo. Bạn chọn ảnh chụp rõ dáng áo hơn nhé!".

### Trạng thái dự phòng khi AI lỗi (Fallback)
Nếu Gemini bị lỗi mạng, quá tải hoặc không thể kết nối khi người dùng dùng Xưởng may:
- Hệ thống không làm đứt đoạn trải nghiệm mà chuyển sang chế độ "May đo thủ công".
- Màn hình hiển thị thông báo: "Máy may tự động đang bảo trì, mời bạn chọn thông số bằng tay!".
- Xuất hiện giao diện chọn nhanh 3 câu hỏi trắc nghiệm (Áo mấy tà? Cổ cao hay cổ tròn? Màu gì?), sau đó ghép ngay thành một chiếc áo pixel tặng người dùng kèm 50 Sen Ngọc thưởng.

## 4. Tiêu chí để coi là làm xong (Acceptance Criteria)

- Tủ đồ hiển thị đúng các món đã lưu và cập nhật trạng thái khi mặc thử.
- Mua phụ kiện trừ đúng số Sen Ngọc, không cho phép mua khi thiếu Sen Ngọc, lưu vĩnh viễn vào localStorage.
- Xưởng may nhận diện chính xác ít nhất 4 phom áo cơ bản từ ảnh thật và trả về kết quả JSON chuẩn.
- Phân biệt thành công ảnh sườn xám hoặc hanbok và hiển thị đúng bảng đối chiếu văn hóa.
- Chế độ may đo thủ công dự phòng hoạt động trơn tru khi ngắt kết nối mạng.
