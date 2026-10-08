# Đặc Tả Tính Năng Bảo Tàng (Museum)

## 1. Mục đích của khu vực

Khu vực Bảo tàng (Museum, mở từ biển "Bảo tàng" trên ngôi nhà góc phải phía trước sân nhà) là trung tâm lưu trữ tri thức văn hóa của Tiệm May Nếp. Khu vực này đáp ứng yêu cầu bắt buộc của đề bài về việc cung cấp thông tin ngắn gọn, chuẩn xác về nguồn gốc và ý nghĩa trang phục. Toàn bộ nội dung do nhóm mình tự biên soạn từ các nguồn sử liệu và nghiên cứu trang phục uy tín, phân định rành mạch giữa chi tiết có văn bản lịch sử xác thực với tập quán truyền khẩu dân gian. AI tuyệt đối không can thiệp vào việc sáng tác nội dung tại khu vực này.

## 2. Các bước người dùng thao tác

Bước 1: Ở sân nhà, bấm biển "Bảo tàng" (hoặc nút "Bảo tàng" trên thanh điều hướng) để vào thư phòng.

Bước 2: Chọn một trong ba lối:
- **12 cuốn sách trên kệ** (số 01–12): mỗi cuốn gom 2 thẻ văn hóa (tổng 23 thẻ trong `src/content/culture-cards.json`). Cuốn đã đọc hết có dấu ✓.
- **Nút "Nhân vật"**: Sổ tay nhân vật – mọi người nói trong cốt truyện (trừ An), đã gặp hiện chân dung/biểu tượng hoa sen, tên và chương; chưa gặp hiện bóng đen "???".
- **Nút "Kỷ vật"**: Sổ tay kỷ vật – 29 vật phẩm; đã tìm hiện icon, tên, mô tả; chưa tìm hiện icon tô đen.

Bước 3: Mở sách. Modal "Sổ tay NN" có trang lót (tên hai thẻ) và các trang lật bằng "‹ Trang trước" / "Trang sau ›" (kèm "Trang x / y"). Mỗi thẻ chiếm hai trang:
- Trang 1: thời kỳ, tiêu đề, icon áo (nếu thẻ gắn với một dáng áo có trong game) và đoạn tư liệu lịch sử (`historicalFact`).
- Trang 2: "Những tên gọi qua thời gian" – tên chính thức (`officialName`) và tên thường gọi (`folkName`).
- Trang "Nguồn tư liệu" có con dấu `citation-seal.png`; trích dẫn thư mục chi tiết cho từng thẻ **chưa làm** (trang hiện ghi "sẽ được bổ sung").
- Trang cuối: mỗi thẻ một nút "Đã hiểu · +15 Sen Ngọc"; bấm lần đầu cộng 15 Sen Ngọc và đánh dấu đã đọc, sau đó nút đổi thành "Đã đọc và nhận thưởng".

Bước 4: Tra cứu. Mở mục "Tra cứu tư liệu" (kèm bộ đếm "x/23 đã đọc") để gõ từ khóa (ô "Tìm tư liệu") hoặc chọn thời kỳ (Tất cả, Nguyễn, 1888, 1934, 1960, 1962, 1980, 1982, 2026); bấm một kết quả mở thẳng trang của thẻ đó.

## 3. Các trạng thái màn hình

### Bố cục ngang (chính)
- **Cảnh nền:** Nền gốc `bookshelf-pink--landscape.png` kích thước 1586×992, hiển thị theo kích thước thật với smoothing (`image-rendering: auto`) để fit/cover viewport, thể hiện không gian thư phòng khảo cứu cổ điển trang nhã, tường vôi trắng, kệ gỗ tối màu và ánh sáng dịu nhẹ.
- **Kệ sách (trái):** 12 cuốn sách trên kệ trong ảnh nền là các nút bấm (số 01–12, dấu ✓ khi đã đọc). Bấm một cuốn mở modal sách: trang lót, các trang tư liệu lật qua lại (thời kỳ, tiêu đề, ảnh áo nếu có, tư liệu lịch sử, tên gọi), trang cuối có con dấu `citation-seal.png` và nút "Đã hiểu · +15 Sen Ngọc" cho từng thẻ.
- **Bảng hướng dẫn (phải):** Panel giấy kem "Bảo tàng nếp áo" gồm lời mời, hai nút **"Nhân vật"** và **"Kỷ vật"** (mở Sổ tay), và mục thu gọn **"Tra cứu tư liệu"** có ô tìm kiếm, bộ lọc thời kỳ và bộ đếm "x/23 đã đọc".
- **Sổ tay Nhân vật / Kỷ vật:** modal lưới ô (3 cột trên điện thoại, 6 cột trên màn rộng). Nhân vật đã gặp hiện chân dung `view-front` (hoặc biểu tượng hoa sen khi ảnh chưa gen lại), tên và chương; chưa gặp hiện bóng đen "???". Kỷ vật đã tìm hiện icon 48×48 phóng ×2 (`pixel-native`), tên và mô tả; chưa tìm hiện bóng đen. Dữ liệu suy ra từ tiến trình đã lưu (hội thoại đã xong, túi đồ, câu đố đã giải, phần thưởng đã nhận), không thêm trường lưu mới.
- Các ảnh `bookshelf-view--*`, `card-modal--9slice`, `museum-filter-bar--3slice` đã gen nhưng **chưa dùng**.

### Bố cục dọc (phụ)
Màn điện thoại: kệ 12 cuốn sách chiếm nửa trên; panel "Bảo tàng nếp áo" nằm ở đáy với hai nút "Nhân vật" / "Kỷ vật", mục "Tra cứu tư liệu" và bộ đếm "x/23 đã đọc". Sách mở thành modal gần toàn màn hình, một trang mỗi lần, nút lật trang ở đáy modal. Sổ tay xếp 3 cột.

### Trạng thái đang tải (Loading)
Toàn bộ dữ liệu thẻ văn hóa nằm sẵn trong mã nguồn (`culture-cards.json`) nên không có màn chờ. Lật trang có hiệu ứng trượt trang (tắt khi bật giảm chuyển động).

### Trạng thái trống (Empty)
Khi từ khóa/thời kỳ không khớp thẻ nào, mục "Tra cứu tư liệu" hiện: "Chưa tìm thấy tư liệu phù hợp. Hãy thử từ khóa khác." Sổ tay với save mới: toàn bộ ô là bóng đen (riêng kỷ vật có sẵn trong túi từ đầu thì hiện).

### Trạng thái lỗi (Error)
Không có lỗi mạng vì dữ liệu tĩnh nằm sẵn trong máy khách. Chân dung nhân vật chưa có ảnh theo spec An thì hiện biểu tượng hoa sen.

### Trạng thái dự phòng khi AI lỗi (Fallback)
Khu vực Bảo tàng không phụ thuộc vào Gemini hay bất kỳ mô hình AI nào. Do đó, khu vực này luôn hoạt động 100% bình thường ngay cả khi mất mạng hoàn toàn hoặc API AI bị ngắt.

## 4. Tiêu chí để coi là làm xong (Acceptance Criteria)

- 23 thẻ tư liệu trong 12 cuốn sách, phủ các dáng áo chính của người Kinh.
- **Chưa làm:** trích dẫn nguồn sách sử cụ thể cho từng thẻ và phân định chính sử với truyền khẩu dân gian (trang "Nguồn tư liệu" hiện ghi sẽ bổ sung).
- Tính năng lọc theo thời kỳ và tìm kiếm từ khóa phản hồi tức thì.
- Cơ chế cộng 15 Sen Ngọc khi đọc xong hoạt động chính xác và chỉ cộng một lần duy nhất cho mỗi thẻ để tránh gian lận điểm thưởng.
- Trạng thái các thẻ đã đọc được ghi nhớ trong bản lưu (localStorage).
- Sổ tay Nhân vật/Kỷ vật suy ra từ tiến trình đã lưu, không thêm trường lưu mới.
