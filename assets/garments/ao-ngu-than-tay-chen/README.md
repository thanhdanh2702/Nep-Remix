# Áo ngũ thân tay chẽn (ao-ngu-than-tay-chen)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Có căn cứ về cấu trúc và hiện vật: cổ đứng, năm khuy phía bên phải người mặc, ống tay gọn. Năm thân là các mảnh cấu tạo áo, trong đó có thân con phía trong, không phải năm tà lộ ra ngoài. Nguồn: [Bảo tàng Lịch sử quốc gia — hiện vật ngũ thân tay chẽn](https://baotanglichsu.vn/vi/Articles/3090/72685/bao-tang-lich-su-quoc-gia-tiep-nhan-ao-dai-ngu-than-truyen-thong.html).

Ý nghĩa biểu tượng có thể được kể trong nội dung văn hóa; không biến chúng thành chữ hoặc hình đạo đức in trên áo. Không lấy kiểu áo nam hiện vật làm lý do thay cơ thể nữ An.

## Thiết kế chốt cho bộ asset mới

- Cổ lập lĩnh đứng vừa với cổ An; hò áo kín, năm khuy nhỏ theo đường hò bên phải của người mặc.
- Thân áo rủ vừa, không bó eo như áo dài hiện đại; cấu trúc gồm thân trước, thân sau và thân con bên trong.
- Ống tay chẽn gọn đến cổ tay, không bồng vai, không tay thụng, không xòe phễu.
- Vải trơn, mặc định chàm; các màu khác dùng cùng thiết kế. Không tự thêm long/phượng, bổ tử, tua trang sức hoặc hoa sen lớn.

## Mặc trên An và đồng bộ tủ đồ

Áo mặc cùng quần dài riêng của An. Đường hò/khuy phải giữ đúng bên ở bốn hướng; góc phải không được tạo bằng lật ảnh góc trái. Khi thay áo, loại các lớp áo gốc của An để không lộ hai cổ áo hoặc hai bộ tay.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-ngu-than-tay-chen.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-ngu-than-tay-chen--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-ngu-than-tay-chen--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-ngu-than-tay-chen--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
Vietnamese ao ngu than tay chen: a modest standing collar, a closed overlapping front with five small buttons along the wearer's right-side fastening, a concealed inner fifth panel and neat narrow long sleeves. Straight, comfortably draped silhouette, plain fabric; not five exposed tails and not a modern tightly cinched bodice. Fit the existing An poses, with trousers kept separate.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the same plain five-panel garment with its front closed and all five fastening positions unchanged. Relax the sleeves without changing their narrow cut or the wearer's right-side closure.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
