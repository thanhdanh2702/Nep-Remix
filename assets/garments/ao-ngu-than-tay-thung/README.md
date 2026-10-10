# Áo tấc — ngũ thân tay thụng (ao-ngu-than-tay-thung)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã tạo và tích hợp bộ mới trong Studio/Tủ đồ ngày 07/10/2026. Nguồn và prompt ở `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Có căn cứ về lễ phục tay rộng trong hệ ngũ thân; khác áo tay chẽn ở độ rộng và độ dài ống tay. Nguồn: [Sở Văn hóa và Thể thao Huế — triển lãm áo dài qua các thời kỳ](https://svhttdl.hue.gov.vn/tin-trong-nuoc/ao-dai-viet-nam-qua-cac-thoi-ky-lich-su-mot-trien-lam-khong-the-bo-qua.html); [Bảo tàng Phụ nữ Nam Bộ — Áo dài xưa và nay](https://baotangphunu.com/ao-dai-xua-va-nay/).

Không gọi mọi áo tấc là triều phục cao cấp nhất hoặc tự gán phẩm cấp. Màu hoàng yến là lựa chọn cho game, không phải quy tắc chung cho mọi người mặc áo tấc.

## Thiết kế chốt cho bộ asset mới

- Cổ đứng, thân con phía trong và hò khuy bên phải như cấu trúc ngũ thân; không cổ nhật bình hay áo khoác mở ngực.
- Tay thụng rộng, dáng ống tay phải nhận ra ngay khi so với tay chẽn; không chỉ nới nhẹ cổ tay hoặc làm tay loe nhọn.
- Thân rủ rộng vừa, không chiết eo sát người. Tà dài và tay có độ rủ phù hợp tư thế lễ phục.
- Chọn vải trơn hoặc vân dệt rất nhẹ, mặc định hoàng yến. Không mặc định áo lễ phải có rồng, phượng, huy hiệu phẩm cấp hoặc trang trí cung đình.

## Mặc trên An và đồng bộ tủ đồ

Giữ tư thế tay thật của An trong ống tay thụng. Ở chỗ vải phủ bàn tay, cần thứ tự lớp hoặc mặt nạ che phủ; không vẽ bàn tay nổi xuyên qua ống tay. Áo đi với quần dài riêng, không ghép váy phồng hoặc đai to.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-ngu-than-tay-thung.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-ngu-than-tay-thung--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-ngu-than-tay-thung--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-ngu-than-tay-thung--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
Vietnamese ceremonial ao tac with the five-panel overlapping construction, standing collar and wearer's right-side fastening. Spacious body and genuinely broad, long draping sleeves, distinct from narrow-sleeved ao ngu than. Plain restrained cloth; no open coat front, court insignia, exaggerated bell cuffs or rigid sash. Match An's real arm poses and natural sleeve occlusion.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the identical closed-front ceremonial garment, making its broad long sleeves visible without changing the neckline, fastening side or body pattern. Keep its proportions distinct from the narrow-sleeved garment.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
