# Đối chiếu văn hóa cho bộ trang phục mặc trên An

> Bản ghi dưới đây phản ánh bước đối chiếu ngày 06/10/2026. Nội dung catalog và Bảo tàng đã được rà soát lại ngày 10/10/2026; xem [đối chiếu nội dung Bảo tàng](museum-content-research.md) để biết các điểm đã sửa, nguồn từng thẻ và phạm vi phân biệt lịch sử với hư cấu. Các nhận xét về bản nháp asset bên dưới là ghi chép tại thời điểm cũ.

Ngày đối chiếu: 06/10/2026. Phạm vi: 10 mẫu áo trong `src/content/studio.json`, README từng áo và atlas hiện tại. Đây là đối chiếu tư liệu để xây dựng đặc tả tạo hình; không phải chứng nhận phục dựng hiện vật.

## Nguồn đối chiếu

- [A — Sở Văn hóa và Thể thao Huế: triển lãm Áo dài Việt Nam qua các thời kỳ lịch sử, 29/05/2025](https://svhttdl.hue.gov.vn/tin-trong-nuoc/ao-dai-viet-nam-qua-cac-thoi-ky-lich-su-mot-trien-lam-khong-the-bo-qua.html): cấu trúc tứ thân, ngũ thân, áo tấc, các biến thể Le Mur, cổ thuyền và ráp tay raglan.
- [B — Bảo tàng Lịch sử quốc gia: tiếp nhận áo dài ngũ thân truyền thống, 21/11/2021](https://baotanglichsu.vn/vi/Articles/3090/72685/bao-tang-lich-su-quoc-gia-tiep-nhan-ao-dai-ngu-than-truyen-thong.html): hiện vật ngũ thân tay chẽn; mô tả năm khuy bên phải và ống tay gọn.
- [C — Bảo tàng Phụ nữ Nam Bộ: Nét duyên dáng của chiếc áo dài Việt Nam, 05/03/2020](https://baotangphunu.com/net-duyen-dang-cua-chiec-ao-dai-viet-nam/): Le Mur năm 1934, biến đổi cổ và tay; áo cổ đứng cuối thập niên 1930.
- [D — Bảo tàng Phụ nữ Nam Bộ: Áo dài xưa và nay, 16/03/2016](https://baotangphunu.com/ao-dai-xua-va-nay/): áo tứ thân đi với váy; ngũ thân tay chẽn/tay thụng, áo dài cổ hở, raglan và trang trí áo dài thập niên 1980.

## Kết quả cho từng asset

| ID | Mức độ xác thực | Đặc tả để vẽ tiếp | Nguồn |
| --- | --- | --- | --- |
| `ao-tu-than` | Có căn cứ về kiểu áo truyền thống Bắc Bộ | Hai tà trước mở, yếm bên trong, dây thắt lưng mềm; hai thân sau nối sống lưng. Mẫu lịch sử được chọn phối với váy. Không dựng cổ đứng hoặc khuy chéo như ngũ thân. | A, D |
| `ao-ngu-than-tay-chen` | Có căn cứ; phân biệt thân áo với tà lộ ra ngoài | Cổ đứng, năm thân gồm thân con phía trong, năm khuy theo bên phải người mặc, tay gọn. Không vẽ thành năm dải tà rời hoặc áo bó eo kiểu áo dài hiện đại. | B, D |
| `ao-ngu-than-tay-thung` | Có căn cứ về áo tấc/lễ phục tay rộng | Giữ cấu trúc ngũ thân và cổ đứng, tay thụng rộng và dài rõ rệt. Dáng khác tay chẽn; không biến thành áo khoác mở trước hoặc cổ nhật bình. | A, D |
| `ao-dai-lemur` | Trào lưu có căn cứ; chưa đối chiếu một mẫu Cát Tường cụ thể | Chọn một biến thể có cổ lá sen và vai bồng, hai tà, nhấn eo. Ghi là thiết kế lấy cảm hứng Le Mur thập niên 1930; không tuyên bố sao chép nguyên mẫu năm 1934. | A, C |
| `ao-dai-tan-thoi-vang-mo-ga` | Kiểu cổ đứng có căn cứ; màu vàng là lựa chọn của dự án | Cổ đứng, tay thẳng/gọn, không vai bồng; dáng tân thời phân biệt với ngũ thân. Vàng mỡ gà không phải tên một cấu trúc áo lịch sử riêng. | C |
| `ao-dai-co-thuyen` | Có căn cứ về biến thể áo dài Việt Nam | Cổ mở rộng theo chiều ngang, không có cổ đứng; vẫn giữ thân và tà áo dài. Dùng mốc cuối thập niên 1950–1960, tránh khẳng định tác giả hoặc năm phát minh duy nhất khi nguồn không thống nhất. | A, D |
| `ao-dai-raglan` | Có căn cứ về kỹ thuật ráp tay trong áo dài Việt Nam | Đường ráp từ chân cổ chéo xuống nách, thân áo dài ôm vừa, xẻ tà bên và mặc cùng quần. Raglan là cách ráp tay, không phải họa tiết hoặc một kiểu cổ bắt buộc. | A, D |
| `ao-dai-cuoi-phin` | Mẫu của câu chuyện; chưa đủ nguồn cho mẫu lịch sử riêng năm 1982 | Có thể dùng dáng áo dài giản dị, vải phin trắng và cành đào nhỏ theo Chương 4. Những chi tiết năm 1982, tem phiếu, xuất xứ Nam Định là dữ liệu truyện, không coi là chứng cứ lịch sử đã xác thực. | D cho bối cảnh áo dài giai đoạn này; Chương 4 cho thiết kế cụ thể |
| `ao-dai-popolin` | Biến thể theo chất liệu/họa tiết của dự án | Popolin không xác lập một phom áo riêng. Dùng áo dài hai tà với hoa cúc nhỏ theo đặc tả truyện; chưa xác thực khẳng định mẫu tiêu biểu của công nhân/cô giáo Nam Định thập niên 1980. | D cho bối cảnh chung; README và Chương 4 cho thiết kế cụ thể |
| `ao-ngu-than-remix-2026` | Thiết kế đương đại hư cấu của An | Giữ dấu hiệu ngũ thân (cổ đứng, hò khuy bên phải, thân con), phần cách tân được ghi rõ là sáng tạo của game. Không gọi là cổ phục phục dựng năm 2026. | Đặc tả dự án; B cho nền cấu trúc ngũ thân |

## Các vấn đề trong đặc tả hiện tại

- `năm thân` không đồng nghĩa với năm tà lộ ra ngoài; cần sửa cách diễn đạt trong các prompt hiện tại trước khi tạo lại ngũ thân.
- README Le Mur đã ghi là thiết kế lấy cảm hứng, trong khi tên ở catalog nêu năm 1934 như một mẫu cụ thể. Khi chưa có ảnh/rập gốc đối chiếu, giữ nhãn lấy cảm hứng thay vì tuyên bố phục dựng.
- Các nguồn bảo tàng và triển lãm có khác biệt về một số niên đại, người sáng tạo và thời gian phổ biến. Đặc tả chọn dấu hiệu cấu trúc được đối chiếu, không coi mọi mốc kể lại là đã thống nhất.
- Các khẳng định về phin, popolin và Nam Định trong `culturalSummary`/`historicalFact` chưa đủ căn cứ trong các nguồn đã tìm. Cần phân biệt sự kiện của truyện với thông tin lịch sử trước khi đưa vào phần giáo dục của game.
- Không dùng cùng một phom tay loe và hoa sen lớn cho cả mười áo. Cổ, tay, hò khuy, tà và đồ mặc kèm phải phân biệt được từng kiểu.

## Đánh giá bản nháp tạo trước bước đối chiếu

Bản `ao-tu-than` vừa sinh bằng ImageGen là nháp chưa duyệt, chưa tích hợp vào runtime. Quan sát bản nháp: cổ ở góc sau còn giống cổ đứng, đai ngang khá bản; cần đối chiếu lại với cấu trúc áo mở/yếm/dây lưng mềm trước khi chốt. Không dùng ảnh này làm mẫu chuẩn để nhân ra chín áo còn lại.

Thứ tự công việc tiếp theo: sửa đặc tả từng áo theo bảng trên; chọn hình tham chiếu đúng loại; kiểm tra cấu trúc tạo hình; sau đó mới căn các lớp vào khung An và lấy thumbnail từ cùng asset. Đối chiếu văn hóa và kiểm tra khớp nhân vật là hai bước riêng, đều cần đạt.
