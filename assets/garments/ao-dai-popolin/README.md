# Áo dài vải poplin hoa cúc — mẫu trong câu chuyện (ao-dai-popolin)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Poplin (ID cũ viết “popolin”) là tên chất liệu, không phải một phom áo riêng. Chưa xác thực khẳng định mẫu hoa cúc này là trang phục tiêu biểu của công nhân/cô giáo Nam Định thập niên 1980. Chất liệu, họa tiết và liên hệ Chương 4 là lựa chọn của dự án; bối cảnh áo dài giai đoạn này tham khảo [Bảo tàng Phụ nữ Nam Bộ — Áo dài xưa và nay](https://baotangphunu.com/ao-dai-xua-va-nay/).

Giữ ID `ao-dai-popolin` để không đổi dữ liệu game; dùng tên chất liệu “poplin” trong mô tả mới. Không gán xuất xứ, nghề người mặc hay mốc sản xuất cho mẫu khi chưa có nguồn chứng minh.

## Thiết kế chốt cho bộ asset mới

- Chọn áo dài hai tà, cổ đứng vừa, tay dài gọn và phom thoải mái; không dùng dáng váy xòe hoặc tay thụng.
- Mặt vải mộc, họa tiết hoa cúc nhỏ, thưa, phân bố như hoa trên vải; không phải hoa sen lớn thêu phủ gấu.
- Màu mặc định chàm sáng, hoa cúc sáng hơn nền; đây là phối màu của game.
- Mẫu hoa phải giữ cùng tỷ lệ, kiểu cánh và mật độ trên các thân/tay. Hoa theo bề mặt vải, không dán một hình phẳng giống nhau lên mọi góc.

## Mặc trên An và đồng bộ tủ đồ

Dáng cổ/tay/eo khớp An; quần dài tách khỏi áo. Bản treo phải giữ cùng hệ hoa cúc, không đổi sang áo trơn. Icon thu nhỏ cần vẫn nhận ra bề mặt có hoa nhỏ, không phóng hoa thành một cụm lớn để dễ nhìn.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-dai-popolin.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-dai-popolin--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-dai-popolin--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-dai-popolin--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
An's story poplin-fabric ao dai with a modest standing collar, neat long sleeves, a comfortable two-panel silhouette and a restrained matte textile appearance. Small sparse chrysanthemum flowers form a consistent fabric pattern across the body and sleeves, not large lotus embroidery. The fabric, pattern and period association are project choices rather than a verified unique historical garment type.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the exact same poplin garment with the same chrysanthemum flower shape, small scale and sparse distribution. Maintain neckline, sleeve cut and panel silhouette; do not replace the printed pattern with large embroidered flowers.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
