# Áo dài cưới vải phin — mẫu trong câu chuyện (ao-dai-cuoi-phin)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Áo dài cưới là loại trang phục có thật. Tuy nhiên, mẫu vải phin trắng thêu cành đào, năm 1982, tem phiếu và xuất xứ Nam Định trong dự án là chi tiết của Chương 4, chưa có hiện vật/tư liệu độc lập xác nhận tổ hợp này. Tư liệu bối cảnh áo dài giai đoạn này: [Bảo tàng Phụ nữ Nam Bộ — Áo dài xưa và nay](https://baotangphunu.com/ao-dai-xua-va-nay/).

Không dùng nhãn “phục dựng chuẩn Nam Định 1982”. Không gán tính tiết kiệm, trong sạch hoặc thủy chung cho phụ nữ như một kết luận lịch sử từ chất liệu áo. Giữ bối cảnh năm 1982 ở phần truyện, không coi đó là niên đại của một kiểu phom riêng.

## Thiết kế chốt cho bộ asset mới

- Giữ thiết kế truyện: áo dài đơn giản, cổ đứng vừa, tay dài gọn, thân thoải mái và hai tà; mặc cùng quần dài riêng.
- Vải phin có bề mặt mộc và độ rủ vừa; không mô tả là lụa óng hoặc khẳng định phin được dệt thủ công.
- Một cành đào nhỏ năm cánh ở ngực, vị trí tránh đường khép áo; không thêm các cụm hoa sen lớn trên tay và gấu.
- Màu mặc định trắng ngà. Nếu cành đào cần giữ màu chỉ riêng khi đổi màu vải, phải tách lớp/mặt nạ như quy định chung.

## Mặc trên An và đồng bộ tủ đồ

Cành đào được cố định trên cùng mảnh thân trước, theo đúng vị trí khi nhìn nghiêng; không sao chép thêm cành đào lên lưng. Áo không bao gồm quần, tóc, khăn cô dâu, da hoặc bàn tay.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-dai-cuoi-phin.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-dai-cuoi-phin--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-dai-cuoi-phin--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-dai-cuoi-phin--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
An's fictional story wedding ao dai: a simple standing collar, neat long sleeves, a comfortably shaped body, two long panels and a matte cotton-cloth appearance. One small five-petalled peach-blossom sprig on the front chest, clear of the closure, and otherwise plain fabric. Its ivory palette and 1982 story context are project choices, not a documented reproduction of a museum garment.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the same modest wedding garment with exactly the same small front-chest blossom placement and plain matte cloth. Do not add wedding jewellery, a mannequin, trousers, elaborate silk shine or large hem embroidery.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
