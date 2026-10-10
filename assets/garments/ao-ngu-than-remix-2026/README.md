# Áo ngũ thân Remix 2026 — thiết kế đương đại của An (ao-ngu-than-remix-2026)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Đây là thiết kế hư cấu của An trong game, không phải mẫu cổ phục lịch sử. Nền cấu trúc ngũ thân được đối chiếu theo [Bảo tàng Lịch sử quốc gia — hiện vật ngũ thân tay chẽn](https://baotanglichsu.vn/vi/Articles/3090/72685/bao-tang-lich-su-quoc-gia-tiep-nhan-ao-dai-ngu-than-truyen-thong.html); các lựa chọn cách tân phải ghi rõ là của dự án.

Tên “Remix 2026” chỉ bối cảnh hiện tại của câu chuyện. Không khẳng định mẫu là chứng cứ lịch sử hoặc thiết kế đã được giới nghiên cứu xác thực.

## Thiết kế chốt cho bộ asset mới

- Giữ năm thân với thân con bên trong, cổ đứng và hò khuy bên phải; không mô tả thành năm tà rời.
- Tay gọn, phom thoải mái, đường nẹp sạch; cảm giác trẻ trung nằm ở tỷ lệ, cách hoàn thiện và phối màu, không ở giáp/áo hoodie/váy phồng.
- Chọn nền đỏ son, một điểm viền men lam nhỏ, không thêm biểu tượng cung đình hoặc nhận là bản mẫu lịch sử.
- Viền men lam và thân đỏ son cần lớp/mặt nạ riêng nếu phải giữ hai màu độc lập; một PNG bị gradient-map toàn bộ không đủ để bảo toàn hai vùng màu.

## Mặc trên An và đồng bộ tủ đồ

Cổ đứng và hò khuy phải khớp An và giữ đúng bên ở mọi góc; mặc với quần dài riêng. Bản treo, icon và bản mặc phải cùng vị trí điểm viền hiện đại, không dùng ba cách trang trí khác nhau cho cùng ID.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-ngu-than-remix-2026.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-ngu-than-remix-2026--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-ngu-than-remix-2026--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-ngu-than-remix-2026--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
An's original contemporary reinterpretation of Vietnamese ao ngu than, retaining five-piece construction with the inner fifth panel, a standing collar, wearer's right-side fastening and neat sleeves. Comfortable youthful proportions with one restrained modern edging detail. This is a fictional 2026 game design, not historical reconstruction; do not render five exposed tails, armour or a rigid wide belt.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the identical modern reinterpretation with the same collar, fastening, sleeve pattern and single edging detail. Preserve the chosen two-material design; do not substitute a generic historical garment or add new ornaments.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
