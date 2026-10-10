# Áo tứ thân Bắc Bộ (ao-tu-than)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Kiểu áo truyền thống có tư liệu đối chiếu; mẫu của game chọn cách mặc với yếm và váy Bắc Bộ. Hai thân trước mở, hai thân sau nối sống lưng, không có hò khuy kín như ngũ thân. Nguồn: [Sở Văn hóa và Thể thao Huế — triển lãm áo dài qua các thời kỳ](https://svhttdl.hue.gov.vn/tin-trong-nuoc/ao-dai-viet-nam-qua-cac-thoi-ky-lich-su-mot-trien-lam-khong-the-bo-qua.html); [Bảo tàng Phụ nữ Nam Bộ — Áo dài xưa và nay](https://baotangphunu.com/ao-dai-xua-va-nay/).

Không gán mọi kiểu tứ thân về một năm ra đời duy nhất. Không gọi hình áo treo nguyên bộ váy/quần là lớp áo mặc.

## Thiết kế chốt cho bộ asset mới

- Áo ngoài cổ mở, hai tà trước tách nhau, không cổ đứng. Dây lưng mềm, nhỏ, rủ tự nhiên; không dùng đai cứng to bản.
- Yếm nằm bên trong, là phần trang phục riêng biệt về tạo hình; không biến thành cổ áo vuông dựng cao. Tay dài vừa phải, không tay bồng hoặc ống loe nghi lễ.
- Bản này dùng vải mộc, áo ngoài màu củ nâu, yếm sáng tương phản, váy chàm. Đây là bảng phối chọn cho game; không mặc định mọi áo tứ thân ngoài đời đều giống màu này.
- Chọn vải trơn để làm rõ cấu trúc; bỏ hoa sen lớn phủ đồng loạt cổ tay và gấu của atlas cũ.

## Mặc trên An và đồng bộ tủ đồ

Lớp áo gồm áo ngoài, yếm và dây lưng; váy dưới tách riêng. Khi mặc phải thay quần nền bằng váy, không chỉ che phần ống quần ở phía trước. Cùng một váy xuất hiện ở tất cả góc đứng; bản treo của món áo không kèm váy.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-tu-than.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-tu-than--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-tu-than--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-tu-than--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |
| `ao-tu-than--bottom.png` | Lớp váy dưới cùng bộ, dải ba góc, chuẩn căn theo An; đã tạo, đã tích hợp. |
| `ao-tu-than--bottom-right.png` | Góc phải của váy, cùng điểm neo; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
Northern Vietnamese ao tu than outer garment: open front with two separate front panels, a joined back with a centre seam, an inner yem bib and a soft narrow waist sash. Plain fabric, no standing collar, no closed five-button placket, no broad rigid belt. Sleeves follow An's reference pose. Output the outer garment, yem and sash only; its accompanying skirt is a separate wearable layer.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Show the same outer garment hanging open with the approved yem and sash arrangement, preserving construction and proportions. Do not add a body, skirt, trousers or a new collar. The skirt belongs to the separately documented bottom layer.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
