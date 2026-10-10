# Đối chiếu nội dung Bảo tàng nếp áo

Ngày kiểm tra: 10/10/2026. Phạm vi: catalog 10 bộ áo dùng trong Phối đồ/Tủ đồ và 27 thẻ Bảo tàng. Nội dung là bản tóm lược do dự án biên soạn, không sao chép nguyên văn bài nguồn, không chứng nhận các sprite là bản phục dựng hiện vật.

## Dữ liệu và nguồn

- `src/content/studio.json`: tên và mô tả ngắn dùng chung cho catalog.
- `src/content/culture-cards.json`: đoạn giới thiệu, tên gọi, ghi chú thiết kế, phạm vi nguồn và liên kết đến áo qua `garmentId`.
- `src/content/culture-sources.ts`: thư mục 11 nguồn công khai; `sourceIds` trên từng thẻ chọn đúng tài liệu liên quan.
- `MuseumReader.tsx`: trang 3 hiển thị nguồn với cơ quan/tác giả, liên kết và ngày đối chiếu. Thẻ truyện không có nguồn ngoài ghi rõ nguồn nội bộ.

## Bao phủ catalog

| Áo trong Phối đồ/Tủ đồ | Thẻ Bảo tàng chính | Phạm vi đối chiếu |
| --- | --- | --- |
| `ao-tu-than` | `ao-tu-than` | Kiểu áo và bộ mặc kèm; không chốt năm phát minh |
| `ao-ngu-than-tay-chen` | `ao-ngu-than-tay-chen` | Kết cấu, tay, khuy; phân biệt mẫu An với hiện vật nam trong bài bảo tàng |
| `ao-ngu-than-tay-thung` | `ao-ngu-than-tay-thung` | Lễ phục tay rộng; bỏ số đo “quá tà một tấc” |
| `ao-dai-lemur` | `ao-dai-tan-thoi-lemur` | Trào lưu và mốc 1934; không gọi sprite là bản sao mẫu gốc |
| `ao-dai-tan-thoi-vang-mo-ga` | `ao-dai-tan-thoi-vang-mo-ga` | Kiểu cổ đứng; phân biệt tên màu của dự án |
| `ao-dai-co-thuyen` | `ao-dai-co-thuyen` | Kiểu cổ; nêu khác biệt quy tác giả giữa hai nguồn |
| `ao-dai-raglan` | `ao-dai-tay-raglan` | Kỹ thuật ráp tay; phân biệt bối cảnh truyện 1962 |
| `ao-dai-cuoi-phin` | `ao-dai-cuoi-phin` | Kỷ vật hư cấu; nguồn ngoài chỉ hỗ trợ bối cảnh chung |
| `ao-dai-popolin` | `ao-dai-popolin` | Tên chất liệu; phom, hoa văn và xuất xứ mẫu thuộc dự án |
| `ao-ngu-than-remix-2026` | `card-viet-phuc-remix-tuong-lai` | Thiết kế hư cấu; tư liệu ngũ thân chỉ làm nền tham khảo |

Giữ nguyên ID của 23 thẻ cũ để bản lưu và phần thưởng chương tiếp tục hoạt động; bổ sung bốn thẻ còn thiếu. Các bài phụ về cùng một áo vẫn giữ ID nhưng ghi nguồn/phạm vi riêng. Thẻ hôn lễ chung không còn dùng áo cưới phin của Phương như một hiện vật đại diện cho hôn phục thời Nguyễn.

## Cách xử lý nội dung chưa được xác minh

- Những mốc báo, tác giả, cách giải thích nguồn gốc, tên dân gian và quy tắc tuyệt đối chưa có tài liệu đủ rõ được bỏ hoặc thu hẹp. Trang tên gọi dùng “Tên trong tư liệu”, không coi tên catalog là tên chính thức do cơ quan lịch sử ban hành.
- Các thẻ về Cụ Cầm, Cụ Loan, Mai, Phương, An và tiệm may là diễn giải tác phẩm. Không dùng câu chuyện để khẳng định một tập quán áp dụng cho mọi gia đình, địa phương hoặc giai đoạn.
- Nhật bình, giao lĩnh, yếm, bà ba, trang phục hôn/tang lễ và thờ Mẫu có nguồn riêng. UNESCO được dẫn cho thực hành tín ngưỡng, không phải chứng nhận riêng trang phục.
- Nguồn TRC về poplin có nội dung được công cụ tìm kiếm lập chỉ mục; trang trực tiếp có thể yêu cầu kiểm tra trình duyệt. Chỉ dùng thông tin dệt vải cơ bản trong mục này.

## Kiểm tra

Kiểm tra schema yêu cầu thẻ lịch sử có nguồn hợp lệ trong thư mục. Kiểm tra trình duyệt duyệt toàn bộ thẻ, đối chiếu đủ 10 ID áo, kiểm tra nguồn xuất hiện trên trang 3, lật sách, khôi phục bản lưu và chỉ nhận thưởng một lần. Các viewport desktop/mobile tiếp tục được kiểm tra trong `tests/browser/museum.spec.ts`.
