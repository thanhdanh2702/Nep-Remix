# Đặc Tả Tính Năng Phòng Phối Đồ (Studio)

## 1. Mục đích của khu vực

Phòng phối đồ (Studio, nằm ở dãy nhà ngói bên trái sân nhà với hình ảnh bàn may ấm cúng) là phân khu cốt lõi phục vụ trực tiếp đề bài "Việt phục Remix". Nơi đây cho phép học sinh, sinh viên tự do thử nghiệm các kiểu phối áo truyền thống người Kinh (tứ thân, ngũ thân tay chẽn, ngũ thân tay thụng, áo dài tân thời), kết hợp màu sắc từ Bảng màu truyền thống cho vải áo và phụ kiện theo từng bối cảnh đời sống thực tế. Khu vực này tích hợp thước đo kiểm tra mức độ hài hòa màu sắc, các lưu ý văn hóa để người mặc tự tin không phạm quy tắc lễ nghi, và tính năng tạo ảnh Lookbook chân thực bằng Gemini.

## 2. Các bước người dùng thao tác

Bước 1: Chọn áo. Ở dock tủ đồ phía dưới, tab "Áo dài" liệt kê 10 dáng áo (6 ô/trang, có nút ‹ ›). Áo chưa mở khóa hiện bóng tối kèm nhãn "Chưa mở khóa · cần Chương N". Bấm một áo đã có thì An trên thảm đổi áo ngay.

Bước 2: Tô màu. Tab "Màu vải" đổi bảng màu của bộ đang mặc; khối "Màu sắc" bên phải dock là 6 ô màu truyền thống chọn nhanh.

Bước 3: Phụ kiện và giày. Tab "Phụ kiện" và tab "Giày" gắn/tháo món đồ theo từng vị trí (đầu, cổ, tay, chân).

Bước 4: Xem và xoay. Nút ‹ › cạnh An xoay 4 góc nhìn; khung "Lookbook của bạn" bên phải luôn hiện 4 ô Chính diện / Góc nghiêng / Sau lưng / Cận cảnh của bộ đang phối. Dưới chân An có tên áo, thanh "Độ hài hòa x/100", nút Hoàn tác / Làm lại.

Bước 5: Gợi ý từ Gemini. Bấm "Gợi ý từ Gemini" để nhận tối đa 3 bộ gợi ý theo sự kiện đang chọn; mỗi bộ có nút "Mặc thử" (chỉ áp phần đã mở khóa).

Bước 6: Tùy chỉnh, lưu và Lookbook AI:
- "Tùy chỉnh bộ phối" mở modal: đặt tên bộ phối, chọn sự kiện (Tết, Lễ cưới, Bế giảng, Đi lễ chùa, Viếng tang, Dạo phố), "Ghim để so sánh", "Tháo phụ kiện", Hoàn tác / Làm lại / Đặt lại, nhận xét độ hài hòa và lưu ý văn hóa.
- "Lưu bộ phối" đưa bộ đồ vào Tủ đồ (mục "Bộ đã lưu").
- "Chụp Lookbook AI" gửi bộ đang phối cho Gemini để sinh 4 ảnh người mẫu hư cấu theo 4 góc nhìn (không dùng khuôn mặt người dùng); "Về ảnh pixel" quay lại 4 ô pixel.

## 3. Các trạng thái màn hình

### Bố cục ngang (chính)
- **Cảnh nền:** `vietnamese-room--landscape.png` (bản gen gốc), phủ kín màn hình và vẽ mượt (`art-hires`); ảnh được dịch để thảm tròn luôn nằm dưới chân An.
- **Giữa – trái (sân khấu):** An đứng trên thảm, cỡ theo độ sâu chỗ chân đứng (`HUMAN_HEIGHT.studio`, 0,34 → 0,48 chiều cao nền; tối đa 1,2× khung 176×416). Hai nút ‹ › xoay góc nhìn; bên dưới là tên áo, thanh độ hài hòa, Hoàn tác / Làm lại, "Gợi ý từ Gemini".
- **Phải:** Khung "Lookbook của bạn" (ảnh `lookbook-frame.png`) với lưới 4 ô và 3 nút "Tùy chỉnh bộ phối", "Lưu bộ phối", "Chụp Lookbook AI".
- **Dưới:** Dock tủ đồ (ảnh `wardrobe-frame--landscape.png`) gồm 4 tab "Áo dài", "Màu vải", "Phụ kiện", "Giày", phân trang 6 ô/trang và khối "Màu sắc". Icon áo 96×96 và icon phụ kiện 48×48 là pixel art, phóng theo bội số nguyên (`pixel-native`).
- **Lớp áo trên An:** khi đã có lớp áo theo spec An (dải 528×416: front | side | back), áo vẽ đè lên An và tô màu bằng gradient-map. Khi chưa có, An mặc bộ đồ gốc được tô theo bảng màu đang chọn; dock hiện icon áo; phụ kiện chưa có lớp thì không vẽ.
- Các ảnh `studio-panel-frame--9slice`, `event-selector-strip--3slice`, `color-palette-bar--3slice`, `lookbook-modal--9slice`, `workbench-ui--*` đã gen nhưng **chưa dùng**.

### Bố cục dọc (phụ)
Màn điện thoại xếp dọc: An và các nút xoay ở nửa trên bên trái, khung Lookbook thu nhỏ ở góc phải trên, thanh độ hài hòa và nút gợi ý dưới chân An, dock tủ đồ ở đáy màn hình. Màn ngang thấp (ví dụ 844×390) chỉ còn một dải hẹp nên An hiển thị nhỏ.

### Trạng thái đang tải (Loading)
Khi bấm "Chụp Lookbook AI" hoặc "Gợi ý từ Gemini", nút chuyển thành "Đang hỏi Gemini…" (vô hiệu hóa) cho đến khi có kết quả. Yêu cầu tự hủy sau 50 giây (`AI_TIMEOUT_MS`). Đổi bộ đồ trong lúc chờ sẽ hủy yêu cầu Lookbook và quay về ảnh pixel.

### Trạng thái trống (Empty)
Chưa ghim bộ nào thì modal "Tùy chỉnh bộ phối" chỉ có nút "Ghim để so sánh"; sau khi ghim, bộ đã ghim hiện cạnh bên với nhãn "Bộ phối đã ghim" và nút đổi thành "Đóng so sánh". Tủ đồ chưa có bộ lưu thì mục "Bộ đã lưu" nhắc ghé Phòng phối đồ để lưu bộ đầu tiên.

### Trạng thái lỗi (Error)
Mỗi vị trí phụ kiện (đầu, cổ, tay, chân) chỉ giữ một món: chọn món mới cùng vị trí sẽ thay món cũ. Áo hoặc phụ kiện chưa mở khóa không chọn được (hiện bóng tối và nhãn điều kiện mở khóa). Lưu bộ phối không hợp lệ thì hiện thông báo lý do.

### Trạng thái dự phòng khi AI lỗi (Fallback)
- **Lookbook AI:** mạng ngắt, API lỗi hoặc quá 50 giây thì giữ nguyên 4 ô ảnh pixel kèm nhãn "dùng ảnh pixel"; người dùng vẫn lưu được bộ phối.
- **Gợi ý từ Gemini:** khi AI không phản hồi, máy chủ trả bộ gợi ý dựng sẵn theo sự kiện (nếu có) và hiện nhãn ngoại tuyến; nếu không có gợi ý nào thì hiện thông báo ngắn.

## 4. Tiêu chí để coi là làm xong (Acceptance Criteria)

- Đổi phom áo, màu sắc và phụ kiện trên nhân vật phản hồi ngay lập tức dưới 100 mili-giây.
- Đổi sự kiện trong modal cập nhật độ hài hòa và lưu ý văn hóa theo sự kiện mới.
- Thước đo màu sắc tính toán và hiển thị điểm số nhất quán theo công thức tương phản màu sắc.
- Thông điệp nhắc nhở văn hóa hiển thị đúng khi vi phạm 5 quy tắc chuẩn mực đã định nghĩa.
- Tính năng so sánh đặt được 2 bộ đồ cạnh nhau trên màn hình mà không vỡ khung.
- Luôn có kết quả khi bấm "Chụp Lookbook AI" (4 ảnh AI nếu thành công, 4 ô ảnh pixel kèm nhãn ngoại tuyến nếu lỗi).
