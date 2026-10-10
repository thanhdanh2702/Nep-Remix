# Áo dài tân thời cổ đứng — phối vàng mỡ gà (ao-dai-tan-thoi-vang-mo-ga)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Có căn cứ cho kiểu cổ đứng, tay gọn trong biến đổi áo dài cuối thập niên 1930. “Vàng mỡ gà” chỉ là màu của mẫu dự án, không xác lập một kiểu lịch sử riêng. Nguồn: [Bảo tàng Phụ nữ Nam Bộ — Nét duyên dáng của chiếc áo dài Việt Nam](https://baotangphunu.com/net-duyen-dang-cua-chiec-ao-dai-viet-nam/).

Không gán mẫu cụ thể cho họa sĩ Lê Phổ khi chưa có tư liệu mẫu đối chiếu. Không mô tả nó là một chuẩn duy nhất đã hoàn thiện cho toàn bộ áo dài Việt Nam.

## Thiết kế chốt cho bộ asset mới

- Cổ đứng vừa, tay thẳng gọn, không vai bồng hoặc cổ lá sen.
- Thân ôm vừa và tà áo rủ; không nhấn eo cực mạnh theo kiểu thời trang thập niên 1960.
- Chọn bề mặt lụa nhẹ, màu mặc định vàng mỡ gà, không thêu hoa lớn; đây là mẫu giản dị phân biệt với Le Mur.
- Đường khép áo và mép tà thống nhất ở mọi góc, không tự chuyển thành hàng khuy trang trí chạy giữa ngực.

## Mặc trên An và đồng bộ tủ đồ

Cổ và tay may theo khung An; quần dài là lớp riêng. Giữ độ rủ thân/tà và phần cổ đứng khi chuyển từ góc trước sang sau hoặc khi áo được treo.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-dai-tan-thoi-vang-mo-ga.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-dai-tan-thoi-vang-mo-ga--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-dai-tan-thoi-vang-mo-ga--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-dai-tan-thoi-vang-mo-ga--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
Late-1930s-inspired Vietnamese standing-collar ao dai with straight neat sleeves, no puffed shoulders, a moderately fitted body and softly draping long panels. Plain light silk appearance. Primrose yellow is its display palette, not a separate historical pattern. Preserve the same collar, closure and panel construction across An's views.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the exact standing-collar, straight-sleeved design with the same panel lengths, moderate shaping and plain fabric. Do not borrow puffed sleeves or a petal collar from the Le Mur-inspired item.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
