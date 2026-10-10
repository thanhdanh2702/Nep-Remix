# Áo dài cổ thuyền (ao-dai-co-thuyen)

- **Loại:** lớp áo mặc trên An, kèm bản treo và icon từ cùng thiết kế.
- **Trạng thái:** đã làm lại theo nét pixel và tư thế An, tích hợp trong Studio/Tủ đồ ngày 07/10/2026. Nguồn được chọn là `assets/references/wearables/sources/ao-dai-co-thuyen-v3.png`; toàn bộ prompt và các bước sửa nằm trong `assets/references/wearables/generation.json`.
- **Dùng ở đâu:** An trong Phòng phối đồ và Tủ đồ; hình áo treo trong khay chọn; icon tủ đồ từ cùng mẫu.
- **Quy cách chung:** đọc [README của bộ áo](../README.md), đặc biệt phần căn theo An, bốn góc, đồng bộ màu và giới hạn renderer hiện tại.

## Đối chiếu với trang phục thật

Kiểu cổ hở ngang có căn cứ trong lịch sử áo dài miền Nam cuối thập niên 1950–1960. Các nguồn có khác biệt về mốc và người sáng tạo; README này chốt cấu trúc, không chốt một tác giả/năm phát minh duy nhất. Nguồn: [Sở Văn hóa và Thể thao Huế — triển lãm áo dài qua các thời kỳ](https://svhttdl.hue.gov.vn/tin-trong-nuoc/ao-dai-viet-nam-qua-cac-thoi-ky-lich-su-mot-trien-lam-khong-the-bo-qua.html); [Bảo tàng Phụ nữ Nam Bộ — Áo dài xưa và nay](https://baotangphunu.com/ao-dai-xua-va-nay/).

Không đồng nhất mọi áo dài cổ hở với một thiết kế cổ tim hoặc áo không tay. Không dùng mốc niên đại chính xác hơn mức tư liệu đã đối chiếu.

## Thiết kế chốt cho bộ asset mới

- Cổ mở ngang có đường cong nhẹ hình thuyền, không cổ đứng; vẫn che vai, không biến thành cổ trễ vai hoặc cổ tim.
- Thân ôm vừa, tà trước và sau dài, xẻ hai bên; mặc cùng quần riêng.
- Mẫu chọn tay dài gọn, vai không bồng. Cổ thuyền là kiểu cổ, không bắt buộc một kiểu ráp tay hoặc một họa tiết lịch sử duy nhất.
- Chọn vải trơn nhẹ, màu mặc định xanh ngọc; không thêm viền cổ đứng, yếm hoặc đai.

## Mặc trên An và đồng bộ tủ đồ

Phần cổ hở cho phép nhìn thấy da từ layer cơ thể An; không vẽ da vào PNG áo. Hai góc nghiêng và góc sau phải giữ cùng độ mở cổ, không tự đổi thành cổ đứng phía sau.

Bộ mới dùng `registration: full-frame`: thu nhỏ đồng tỷ lệ cả nguồn năm ô rồi cắt đúng các canvas, giữ nguyên tương quan cổ–vai–khuỷu tay–cổ tay–eo–gấu. Không crop theo bounding box hoặc kéo giãn riêng nửa trên/nửa dưới để ép áo vừa An. Bản treo chỉ được crop và thu nhỏ sau khi đã tách ô mặc.

Renderer ghép thêm `assets/characters/an/studio-neck.png`/`studio-neck--right.png` dưới áo. Đây là mảnh da cổ sạch ở y=126–149, được lấy từ ảnh sửa bằng ImageGen và giới hạn trong silhouette cơ thể gốc, để đường viền áo lót cũ không lộ ra. Lớp bàn tay mặc định được lọc phần vải/thêu cũ, giữ da và viền bàn tay; áo tay thụng vẫn che bàn tay theo quy tắc riêng.

Ảnh QA nằm ở `artifacts/wearables/fit-final/`: bốn hướng × hai kiểu tóc × ba màu áo, màn hình Studio desktop/mobile và Tủ đồ. Script chụp kiểm tra khi dev server đang chạy: `npx tsx scripts/inspect-wearable-fit.ts final`. Các ảnh nguồn và bản trước vẫn được giữ để đối chiếu.

Dùng An gốc làm tham chiếu cơ thể và tư thế. PNG mặc chỉ chứa phần trang phục, không chứa người hoặc móc treo. Từ cùng bản thiết kế tạo bản treo theo tư thế vải buông tự nhiên; icon lấy từ bản treo đã duyệt. Cổ, khuy, đường ráp, mép tà, họa tiết và màu phải đối chiếu được giữa cả ba cách hiển thị.

## Danh sách tệp cần có

| Tệp | Vai trò và trạng thái |
| --- | --- |
| `ao-dai-co-thuyen.png` | Dải mặc: chính diện, nghiêng trái, sau lưng; đã tạo, đã tích hợp. |
| `ao-dai-co-thuyen--right.png` | Góc nghiêng phải riêng, giữ đúng bên hò/khuy; đã tạo, đã tích hợp. |
| `ao-dai-co-thuyen--hanging.png` | Cùng áo ở tư thế treo chính diện; đã tạo, đã tích hợp. |
| `ao-dai-co-thuyen--icon.png` | Icon thu từ bản treo với cùng màu mặc định; đã tạo, đã tích hợp. |

Kích thước, điểm neo, thứ tự các ô và quy tắc alpha theo [quy cách bộ áo](../README.md). Renderer đã hỗ trợ góc phải riêng, bản treo và lớp váy của tứ thân. Bộ này dành cho các tư thế đứng trong Studio/Tủ đồ; các pose đi bộ cần bộ animation riêng.

## Mô tả chủ thể (EN) — lớp mặc

```text
Vietnamese boat-neck ao dai inspired by the late-1950s to 1960s open-neck style: a broad shallow horizontal neckline with no standing collar, covered shoulders, neat long sleeves, a moderately fitted body and two long side-slit panels. Plain fabric, no shoulder puff or rigid belt. Leave the neck opening transparent for An's existing skin layer.
Use the existing An character layers as body and pose references. Produce registered clothing-only views on transparent canvases according to the shared garment specification; preserve An's neck, shoulders, wrists and foot anchors. Do not redesign An, draw skin or include the character, hanger, scene, text or watermark.
```

## Mô tả chủ thể (EN) — bản treo

```text
Hang the identical boat-neck garment, keeping the horizontal open neckline readable and the shoulders covered. Preserve its sleeve cut, panel silhouette and plain surface.
Use the approved wearable design as the garment reference. A single front-facing clothing-only product sprite on transparency; a shared hanger will be added separately by the UI. Do not generate a different garment for the wardrobe thumbnail.
```

## Kiểm tra riêng trước khi duyệt

- Đúng các dấu hiệu cấu trúc tại phần thiết kế chốt, không chỉ giống màu áo.
- Ghép vừa An ở bốn góc; không sai bên khuy, lộ áo nền hoặc xuyên tay/tóc.
- Bản treo và icon giữ nguyên thiết kế, họa tiết, vật liệu và màu của áo đang mặc.
- Giữ đúng mức độ xác thực ở trên trong tên và nội dung mô tả; chưa ghi “đã vào app” khi chưa có ảnh và QA.
