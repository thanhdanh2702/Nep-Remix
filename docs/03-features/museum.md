# Đặc Tả Tính Năng Bảo Tàng (Museum)

## 1. Mục đích của khu vực

Khu vực Bảo tàng (Museum, hiển thị qua kệ sách gỗ gắn biển đặt sát bức tường trắng bên trái cổng vòm sân nhà) là trung tâm lưu trữ tri thức văn hóa của Tiệm May Nếp. Khu vực này đáp ứng yêu cầu bắt buộc của đề bài về việc cung cấp thông tin ngắn gọn, chuẩn xác về nguồn gốc và ý nghĩa trang phục. Toàn bộ nội dung do nhóm mình tự biên soạn từ các nguồn sử liệu và nghiên cứu trang phục uy tín, phân định rành mạch giữa chi tiết có văn bản lịch sử xác thực với tập quán truyền khẩu dân gian. AI tuyệt đối không can thiệp vào việc sáng tác nội dung tại khu vực này.

## 2. Các bước người dùng thao tác

Bước 1: Người dùng chạm vào biển gỗ hoặc kệ sách Bảo tàng tại sảnh sân nhà để mở giao diện Bảo tàng.

Bước 2: Người dùng xem các nút hoặc tab chuyên biệt:
- **Thẻ Văn Hóa (Culture Cards):** Danh mục thẻ tư liệu được sắp xếp theo dòng thời gian (Thời Lê - Trịnh, Nguyễn, Pháp thuộc, hiện đại) hoặc loại trang phục (Tứ thân, Ngũ thân, Áo dài tân thời). Mỗi thẻ hiển thị chân dung NPC 128×128 (nếu đã gặp) hoặc bóng đen "???" (nếu chưa gặp), tên, chương lần đầu gặp.
- **Sổ Tay Nhân Vật (Character Codex):** Liệt kê tất cả nhân vật trong game có hội thoại hoặc tương tác (trừ An). Những nhân vật đã gặp hiển thị chân dung và mô tả ngắn; những nhân vật chưa gặp hiển thị bóng đen kèm "???".
- **Sổ Tay Kỷ Vật (Item Codex):** Liệt kê 29 vật phẩm trong game. Những vật đã tìm thấy hiển thị icon màu sắc và mô tả; những vật chưa tìm thấy hiển thị icon silhouette tô đen kèm "Chưa tìm thấy".

Bước 3: Người dùng chọn một thẻ thẻ Văn Hóa để mở rộng toàn màn hình. Mỗi thẻ gồm các phần chuẩn hóa:
- Tên gọi chính thức và các tên gọi dân gian.
- Hình vẽ minh họa cấu trúc chi tiết (vạt, tà, cổ, khuy, tay áo).
- Hoàn cảnh ra đời và ý nghĩa biểu tượng (ví dụ: năm thân áo ngũ thân tượng trưng cho tứ thân phụ mẫu và chính bản thân người mặc; năm hạt cùi tượng trưng cho ngũ thường: Nhân, Lễ, Nghĩa, Trí, Tín).
- Mục "Căn cứ lịch sử": Ghi rõ trích dẫn từ sách sử nào (ví dụ: *Đại Nam thực lục*, *Phủ biên tạp lục*).
- Mục "Ghi chú truyền khẩu": Nêu rõ những chi tiết chỉ mang tính quan niệm dân gian chưa có văn bản xác thực.

Bước 4: Đọc xong mỗi thẻ, người dùng bấm nút "Gấp sách", hệ thống cộng 15 Sen Ngọc thưởng và đánh dấu biểu tượng hoa sen xanh bên cạnh tên thẻ (đã đọc).

Bước 5: Người dùng có thể dùng thanh tìm kiếm nhanh ở đầu giao diện để gõ từ khóa (ví dụ: "cải cách Minh Mạng", "vải củ nâu", "áo tấc").

## 3. Các trạng thái màn hình

### Bố cục ngang (chính)
- **Cảnh nền:** Nền gốc `bookshelf-pink--landscape.png` kích thước 1586×992, hiển thị theo kích thước thật với smoothing (`image-rendering: auto`) để fit/cover viewport, thể hiện không gian thư phòng khảo cứu cổ điển trang nhã, tường vôi trắng, kệ gỗ tối màu và ánh sáng dịu nhẹ.
- **Kệ sách (trái):** 12 cuốn sách trên kệ trong ảnh nền là các nút bấm (số 01–12, dấu ✓ khi đã đọc). Bấm một cuốn mở modal sách: trang lót, các trang tư liệu lật qua lại (thời kỳ, tiêu đề, ảnh áo nếu có, tư liệu lịch sử, tên gọi), trang cuối có con dấu `citation-seal.png` và nút "Đã hiểu · +15 Sen Ngọc" cho từng thẻ.
- **Bảng hướng dẫn (phải):** Panel giấy kem "Bảo tàng nếp áo" gồm lời mời, hai nút **"Nhân vật"** và **"Kỷ vật"** (mở Sổ tay), và mục thu gọn **"Tra cứu tư liệu"** có ô tìm kiếm, bộ lọc thời kỳ và bộ đếm "x/23 đã đọc".
- **Sổ tay Nhân vật / Kỷ vật:** modal lưới ô (3 cột trên điện thoại, 6 cột trên màn rộng). Nhân vật đã gặp hiện chân dung `view-front` (hoặc biểu tượng hoa sen khi ảnh chưa gen lại), tên và chương; chưa gặp hiện bóng đen "???". Kỷ vật đã tìm hiện icon 48×48 phóng ×2 (`pixel-native`), tên và mô tả; chưa tìm hiện bóng đen. Dữ liệu suy ra từ tiến trình đã lưu (hội thoại đã xong, túi đồ, câu đố đã giải, phần thưởng đã nhận), không thêm trường lưu mới.
- Các ảnh `bookshelf-view--*`, `card-modal--9slice`, `museum-filter-bar--3slice` đã gen nhưng **chưa dùng**.

### Bố cục dọc (phụ)
Màn hình mô phỏng các ngăn kệ sách gỗ pixel art ấm áp. Mỗi cuốn sách có gáy màu khác nhau đại diện cho từng thời kỳ, kèm tiêu đề ngắn gọn và chỉ số tiến độ đọc (ví dụ: "Đã đọc 4/8 thẻ").

### Trạng thái đang tải (Loading)
Toàn bộ dữ liệu thẻ văn hóa được lưu trữ sẵn trong mã nguồn ứng dụng (Local JSON data) nên thời gian tải gần như bằng 0. Nếu chuyển bộ lọc, màn hình có hiệu ứng lật trang sách nhẹ trong 150 mili-giây.

### Trạng thái trống (Empty)
Chỉ xuất hiện khi người dùng nhập từ khóa tìm kiếm không khớp với bất kỳ thẻ tư liệu nào. Màn hình hiển thị một cuốn sổ để ngỏ kèm thông báo: "Bảo tàng chưa tìm thấy tư liệu về từ khóa này. Bạn thử tìm 'ngũ thân', 'áo tấc' hoặc 'tứ thân' xem sao nhé!".

### Trạng thái lỗi (Error)
Không có lỗi mạng xảy ra do dữ liệu hoàn toàn tĩnh và nằm sẵn trong máy khách. Nếu có lỗi hiển thị phông chữ hoặc hình vẽ, hệ thống tự động đưa về định dạng văn bản chuẩn đơn giản của trình duyệt.

### Trạng thái dự phòng khi AI lỗi (Fallback)
Khu vực Bảo tàng không phụ thuộc vào Gemini hay bất kỳ mô hình AI nào. Do đó, khu vực này luôn hoạt động 100% bình thường ngay cả khi mất mạng hoàn toàn hoặc API AI bị ngắt.

## 4. Tiêu chí để coi là làm xong (Acceptance Criteria)

- Tối thiểu 6 thẻ tư liệu hoàn chỉnh tương ứng với các phom dáng trang phục chính của người Kinh.
- Mỗi thẻ bắt buộc có mục trích dẫn nguồn sách sử cụ thể và phân định rõ giữa chính sử với truyền khẩu dân gian.
- Tính năng lọc theo thời kỳ và tìm kiếm từ khóa phản hồi tức thì.
- Cơ chế cộng 15 Sen Ngọc khi đọc xong hoạt động chính xác và chỉ cộng một lần duy nhất cho mỗi thẻ để tránh gian lận điểm thưởng.
- Trạng thái các thẻ đã đọc được ghi nhớ bền vững trong localStorage.
