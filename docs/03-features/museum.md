# Đặc tả Bảo tàng nếp áo

Cập nhật: 10/10/2026.

## Mục đích và dữ liệu

Bảo tàng là nơi tra cứu trang phục, nhân vật và kỷ vật trong Tiệm May Nếp. Nội dung tĩnh được biên soạn từ nguồn công khai và cốt truyện, không phụ thuộc Gemini khi người chơi đọc. Mỗi thẻ phân biệt tư liệu lịch sử, diễn giải tác phẩm hoặc câu chuyện hư cấu.

- `src/content/culture-cards.json`: 27 thẻ tư liệu, gồm thẻ giới thiệu cho đủ 10 áo trong Phối đồ/Tủ đồ và các bài liên quan.
- `src/content/culture-sources.ts`: thư mục nguồn công khai đã đối chiếu; từng thẻ dùng `sourceIds` và `sourceNote` để ghi phạm vi tham khảo.
- `garmentId`: liên kết thẻ với catalog áo dùng chung; hiện vật dùng cùng bản treo và bảng màu mặc định của Tủ đồ.
- Nhân vật và 29 kỷ vật được suy ra từ tiến trình đã lưu, không thêm trường lưu mới.

Quyết định biên tập và bảng đối chiếu 10 áo nằm trong [ghi chép nghiên cứu](../04-culture/museum-content-research.md). Sprite là hình minh họa của dự án, không tự động được coi là bản phục dựng hiện vật.

## Thao tác

1. Mở Bảo tàng từ sân nhà hoặc thanh điều hướng.
2. Chọn tab **Tư liệu**, **Nhân vật** hoặc **Kỷ vật**. Khay bộ sưu tập hiển thị tối đa 6 thẻ mỗi trang.
3. Tìm bằng từ khóa, lọc thời kỳ trong tab Tư liệu hoặc chuyển trang khay. Chọn thẻ để xem hiện vật và đoạn giới thiệu.
4. Bấm **Mở tư liệu** để đọc sách 4 trang:
   - Giới thiệu, kèm nhãn phân biệt lịch sử với hư cấu/diễn giải.
   - Tên trong tư liệu, tên thường gọi và ghi chú về mẫu của dự án nếu có.
   - Nguồn: phạm vi sử dụng, tên bài, cơ quan/tác giả, liên kết ngoài và ngày đối chiếu. Thẻ chỉ diễn giải truyện ghi rõ nguồn nội bộ.
   - Nút **Đã hiểu · +15 Sen Ngọc**, chỉ cộng thưởng lần đầu.
5. Dùng nút lật trang hoặc phím ← →; Esc đóng sách. Thanh điều hướng phòng bị vô hiệu hóa khi đang đọc; focus được giữ trong modal và trả về nút mở khi đóng.

## Bố cục và trạng thái

- Nền thư phòng `gallery-room--panorama.png` dùng cover; giữa phòng là hiện vật trên `exhibit-stand.png`, bên phải là bảng giới thiệu.
- Khay bộ sưu tập ở đáy dùng `collection-dock--panorama.png`; khung giấy dùng `collection-paper-frame.png` và `gallery-frame.png`.
- Trang nguồn dùng con dấu `citation-seal.png`. Liên kết mở ở thẻ trình duyệt mới; cần mạng để đọc trang nguồn ngoài, còn nội dung đã biên soạn vẫn đọc được ngoại tuyến.
- Desktop hiển thị sách hai trang đối diện; màn nhỏ chuyển bố cục để đọc trong modal có cuộn. Hiệu ứng lật trang tắt khi bật giảm chuyển động.
- Không có kết quả: hiển thị lời nhắc đổi từ khóa và nút xem toàn bộ.
- Nhân vật/kỷ vật chưa khám phá: tên `???`, ảnh bị che và nút chi tiết vô hiệu hóa. Tiếp tục cốt truyện để mở.
- Thẻ đã đọc có dấu và bộ đếm; trạng thái đọc/phần thưởng được khôi phục từ bản lưu.

## Tiêu chí kiểm tra

- Mọi áo trong catalog có ít nhất một thẻ liên kết đúng; thẻ hôn lễ chung không gán áo cưới hư cấu làm hiện vật lịch sử.
- Thẻ lịch sử có nguồn; không còn trang hẹn bổ sung trích dẫn. Ghi chú nêu rõ các chi tiết chỉ thuộc câu chuyện hoặc thiết kế game.
- Mọi thẻ mở đúng sách, nguồn hiện đúng trang; tìm kiếm và bộ lọc phản hồi ngay.
- Đọc lại không nhận thưởng lần hai; các ID thẻ cũ tiếp tục hoạt động với bản lưu cũ.
- Khay, sách và liên kết nguồn dùng được ở desktop, điện thoại dọc và điện thoại ngang.
- Kiểm tra trình duyệt: `npx playwright test tests/browser/museum.spec.ts`; ảnh QA trong `artifacts/museum-*.png`.
