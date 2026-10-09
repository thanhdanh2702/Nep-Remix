# Đặc Tả Tính Năng Phòng Phối Đồ (Studio)

## 1. Mục đích của khu vực

Phòng phối đồ (Studio, nằm ở dãy nhà ngói bên trái sân nhà với hình ảnh bàn may ấm cúng) là phân khu cốt lõi phục vụ trực tiếp đề bài "Việt phục Remix". Nơi đây cho phép học sinh, sinh viên tự do thử nghiệm các kiểu phối áo truyền thống người Kinh (tứ thân, ngũ thân tay chẽn, ngũ thân tay thụng, áo dài tân thời), kết hợp màu sắc từ Bảng màu truyền thống cho vải áo và phụ kiện theo từng bối cảnh đời sống thực tế. Khu vực này tích hợp thước đo kiểm tra mức độ hài hòa màu sắc, các lưu ý văn hóa để người mặc tự tin không phạm quy tắc lễ nghi, và tính năng chụp ảnh Lookbook AI bằng Gemini (người mẫu của tiệm hoặc ảnh của chính người chơi).

## 2. Các bước người dùng thao tác

Bước 1: Chọn áo. Ở dock tủ đồ phía dưới, tab "Áo dài" liệt kê 10 dáng áo (6 ô/trang, có nút ‹ ›). Áo chưa mở khóa hiện bóng tối kèm nhãn "Chưa mở khóa · cần Chương N". Bấm một áo đã có thì An trên thảm đổi áo ngay.

Bước 2: Tô màu. Tab "Màu vải" đổi bảng màu của bộ đang mặc; khối "Màu sắc" bên phải dock là 6 ô màu truyền thống chọn nhanh.

Bước 3: Phụ kiện và giày. Tab "Phụ kiện" và tab "Giày" gắn/tháo món đồ theo từng vị trí (đầu, cổ, tay, chân).

Bước 4: Xem và xoay. Nút ‹ › cạnh An xoay 4 góc nhìn; khung "Lookbook của bạn" bên phải luôn hiện 4 ô Chính diện / Góc nghiêng / Sau lưng / Cận cảnh của bộ đang phối. Dưới chân An có tên áo, thanh "Độ hài hòa x/100", nút Hoàn tác / Làm lại.

Bước 5: Gợi ý từ Gemini. Bấm "Gợi ý từ Gemini" để nhận tối đa 3 bộ gợi ý theo sự kiện đang chọn; mỗi bộ có nút "Mặc thử" (chỉ áp phần đã mở khóa).

Bước 6: Tùy chỉnh, lưu và Lookbook AI:
- "Tùy chỉnh bộ phối" mở modal: đặt tên bộ phối, chọn sự kiện (Tết, Lễ cưới, Bế giảng, Đi lễ chùa, Viếng tang, Dạo phố), "Ghim để so sánh", "Tháo phụ kiện", Hoàn tác / Làm lại / Đặt lại, nhận xét độ hài hòa và lưu ý văn hóa.
- "Lưu bộ phối" đưa bộ đồ vào Tủ đồ (mục "Bộ đã lưu").
- "Chụp Lookbook AI" mở hộp thoại Lookbook AI (mở ra không gọi AI):
  - **Người mẫu:** "Người mẫu của tiệm" (mặc định) là người mẫu hư cấu do Gemini tạo, dáng nam hoặc nữ theo giới tính nhân vật của bạn; "Ảnh của tôi" dùng ảnh của chính bạn (xem bên dưới).
  - **Bối cảnh:** Phố cổ, Vườn hoa, Tường vôi, Sân nhà hoặc "Nền của tôi" (tải ảnh nền riêng). Không khí ảnh theo sự kiện đang chọn (Viếng tang thì người mẫu nghiêm trang, không cười).
  - Bấm "Chụp 4 ảnh": Gemini chụp 4 góc Chính diện, Ngoảnh lại, Sau lưng, Cận cảnh. Ảnh Chính diện chụp trước làm mốc, ba góc còn lại bám theo để cùng một người, cùng một chiếc áo.
  - Mỗi ô ảnh có nút "Chụp lại góc …" khi lỗi hoặc muốn đổi riêng góc đó; các góc khác giữ nguyên. Bấm lại "Chụp 4 ảnh" khi đã xong sẽ chụp lại cả bộ.
  - Có đủ 4 ảnh thì hiện "Lưu ảnh PNG" (tấm poster 4 ảnh) và "Chia sẻ" (nếu trình duyệt hỗ trợ). Bấm vào một ảnh để xem lớn; Escape quay lại hộp thoại, Escape lần nữa đóng hẳn và trả focus về nút "Chụp Lookbook AI".
  - Hộp thoại nằm trên cùng, phủ cả thanh HUD (Sen Ngọc, Cài đặt). Dưới khung có "Câu chuyện tà áo" của chiếc áo đang mặc.
  - Đóng hộp thoại thì khung "Lookbook của bạn" hiện các ảnh AI đã chụp; "Về ảnh pixel" quay lại 4 ô pixel.
- **Ảnh của tôi:** chọn ảnh toàn thân một người, tick "Đây là ảnh của chính tôi…", rồi máy chủ kiểm tra ảnh (một người, thấy rõ mặt, người lớn). Thiếu toàn thân thì vẫn chụp được nhưng dáng người được ước đoán; không đạt thì hiện lý do và có nút "Dùng Người mẫu của tiệm". Ảnh chỉ thu nhỏ trên máy rồi gửi đi, không được lưu.

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
- **Gợi ý từ Gemini:** nút chuyển thành "Đang hỏi Gemini…" (vô hiệu hóa) cho đến khi có kết quả; yêu cầu tự hủy sau 50 giây (`AI_TIMEOUT_MS`).
- **Lookbook AI:** nút chính hiện "Đang chụp n/4…" kèm thanh tiến độ; ô chờ hiện "Chờ ảnh đầu tiên…" rồi "Đang chụp…". Ảnh nào xong hiện ngay, không chờ đủ bốn. Luồng tối đa khoảng 100 giây. Đổi bộ đồ hoặc đổi người mẫu và bối cảnh trong lúc chờ sẽ hủy lượt chụp.

### Trạng thái trống (Empty)
Chưa ghim bộ nào thì modal "Tùy chỉnh bộ phối" chỉ có nút "Ghim để so sánh"; sau khi ghim, bộ đã ghim hiện cạnh bên với nhãn "Bộ phối đã ghim" và nút đổi thành "Đóng so sánh". Tủ đồ chưa có bộ lưu thì mục "Bộ đã lưu" nhắc ghé Phòng phối đồ để lưu bộ đầu tiên.

### Trạng thái lỗi (Error)
Mỗi vị trí phụ kiện (đầu, cổ, tay, chân) chỉ giữ một món: chọn món mới cùng vị trí sẽ thay món cũ. Áo hoặc phụ kiện chưa mở khóa không chọn được (hiện bóng tối và nhãn điều kiện mở khóa). Lưu bộ phối không hợp lệ thì hiện thông báo lý do.

### Trạng thái dự phòng khi AI lỗi (Fallback)
- **Lookbook AI:** lỗi được báo riêng từng góc bằng câu tiếng Việt và nút "Thử lại" (không bao giờ hiện mã lỗi thô); các góc đã chụp xong vẫn giữ. Luồng đóng giữa chừng thì các ô chưa xong cũng chuyển thành lỗi có thể chụp lại. Nhãn "AI offline" chỉ hiện khi chưa có ảnh nào về; khi đó khung "Lookbook của bạn" giữ 4 ô pixel và người dùng vẫn lưu được bộ phối.
- **Hết lượt:** tiệm có trần số bộ ảnh mỗi ngày và mỗi người có hạn mức mỗi 10 phút. Hết trần ngày thì mọi ô hiện "Tiệm đã hết lượt chụp hôm nay, mai quay lại nhé", nút chính thành "Hết lượt hôm nay" (vô hiệu hóa) và vẫn giữ ảnh pixel. Chụp nhanh quá thì hiện "Bạn chụp hơi nhanh, nghỉ vài phút rồi chụp tiếp nhé." Chi tiết ở [lookbook-api.md](../05-tech/lookbook-api.md).
- **Gợi ý từ Gemini:** khi AI không phản hồi, máy chủ trả bộ gợi ý dựng sẵn theo sự kiện (nếu có) và hiện nhãn ngoại tuyến; nếu không có gợi ý nào thì hiện thông báo ngắn.

## 4. Tiêu chí để coi là làm xong (Acceptance Criteria)

- Đổi phom áo, màu sắc và phụ kiện trên nhân vật phản hồi ngay lập tức dưới 100 mili-giây.
- Đổi sự kiện trong modal cập nhật độ hài hòa và lưu ý văn hóa theo sự kiện mới.
- Thước đo màu sắc tính toán và hiển thị điểm số nhất quán theo công thức tương phản màu sắc.
- Thông điệp nhắc nhở văn hóa hiển thị đúng khi vi phạm 5 quy tắc chuẩn mực đã định nghĩa.
- Tính năng so sánh đặt được 2 bộ đồ cạnh nhau trên màn hình mà không vỡ khung.
- Mở hộp thoại "Lookbook AI" không gửi yêu cầu nào; chỉ bấm "Chụp 4 ảnh" mới gọi Gemini.
- Hộp thoại nằm trên cùng, không bị thanh HUD che; Escape đóng và trả focus về nút "Chụp Lookbook AI".
- Chế độ "Ảnh của tôi" chỉ chụp được khi đã có ảnh, đã tick đồng ý và ảnh qua bước kiểm tra; ảnh không được lưu.
- Yêu cầu gửi lên chỉ chứa id và mã màu (cùng ảnh người dùng nếu có), không chứa chữ tự do.
- Mỗi góc báo lỗi và chụp lại độc lập; hai lần chụp lại song song không ghi đè nhau.
- Luôn có kết quả khi bấm "Chụp 4 ảnh": ảnh AI cho góc thành công, câu thông báo tiếng Việt và nút thử lại cho góc lỗi, giữ 4 ô ảnh pixel nếu chưa có ảnh nào.
- Kiểm bằng `tests/browser/lookbook.spec.ts` (mock toàn bộ API) và smoke thật `scripts/smoke-lookbook.ts`.
