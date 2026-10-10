# Áo dài lấy cảm hứng Le Mur thập niên 1930 (ao-dai-lemur)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Trào lưu Le Mur của Cát Tường có nguồn đối chiếu. Mẫu này chọn cổ lá sen và vai bồng làm dấu hiệu thiết kế, nhưng chưa có bản vẽ/hiện vật cụ thể để xác nhận là bản phục dựng “Le Mur 1934”. Nguồn: [Bảo tàng Phụ nữ Nam Bộ — Nét duyên dáng của chiếc áo dài Việt Nam](https://baotangphunu.com/net-duyen-dang-cua-chiec-ao-dai-viet-nam/).

Giữ ID `ao-dai-lemur` để không đổi dữ liệu game ở bước này. Tên/nội dung khi tích hợp phải ghi “lấy cảm hứng”, không hứa đúng nguyên mẫu 1934. Các biến thể Le Mur không có cùng một cấu trúc bắt buộc.

## Thiết kế chốt cho bộ asset mới

- Cổ lá sen mềm, vai bồng vừa; ống tay phía dưới gọn với cổ tay thu nhẹ. Không giữ cổ đứng của áo ngũ thân rồi chỉ thêm vai bồng.
- Thân có nhấn eo vừa, tà trước và sau; đường khép áo kín đáo, không khe xẻ cao quá mẫu tham chiếu được duyệt.
- Chọn vải trơn, mặc định hồng sen; viền nhỏ tương phản làm rõ cổ. Không thêm hoa sen thêu lớn chỉ vì tên cổ là cổ lá sen.
- Ảnh hưởng thời trang Tây phương của trào lưu này là một phần bối cảnh lịch sử; giữ cổ và vai được chọn, không loại chúng khỏi prompt bằng negative chung.

## Mặc trên An và đồng bộ tủ đồ

Cổ lá sen nằm quanh chân cổ An, không lấn cằm hay tóc. Giữ vai bồng trong tỷ lệ chibi của An; không biến nhân vật thành mannequin thân dài. Ở góc sau và hai góc nghiêng, giữ cùng phần cổ, vai và đường eo của mẫu này.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-dai-lemur.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-dai-lemur--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-dai-lemur--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-dai-lemur--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
Vietnamese ao dai inspired by the 1930s Le Mur movement, using a soft petal collar, modest puffed shoulders and neat gathered cuffs. A gently shaped bodice and two long panels, with restrained contrasting collar edging and plain fabric. This is an original historically inspired design, not a claimed reproduction of a particular 1934 drawing. Fit An's existing body and poses.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the same petal-collar, puff-shoulder design; preserve the collar shape, cuff gathering, waist shaping and panel outline. Do not substitute a standing collar or create a different dress for the catalogue.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
