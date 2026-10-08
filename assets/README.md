# Quy Chuẩn Quản Lý Kho Tài Nguyên Pixel Art (assets/README.md)

> Cập nhật C2 ngày 07/10/2026: [manifest production-v4](areas/chapter-2/manifest.json) và [bàn giao](../docs/07-game/08-c2-asset-handoff.md) ghi trạng thái mới cho Loan, Cả Nghị, Ông Lệ, Lemur, khăn vấn đen và guốc mộc; ưu tiên hơn danh sách chờ gen lịch sử bên dưới. Người dùng chọn tỷ lệ nhân vật theo ảnh mẫu và cho phép hậu kỳ cơ học bằng script. Không đổi khung An. Phụ kiện giữ màu theo renderer hiện tại; riêng áo dùng key xám. Chưa tuyên bố đã vào gameplay hoặc qua sửa tay của họa sĩ.

Tài liệu này là **NƠI DUY NHẤT** trong toàn bộ kho lưu trữ thông số kỹ thuật, kích thước điểm ảnh (pixel), bảng mã màu hex, tỷ lệ khung hình, quy chuẩn prompt và quy trình sản xuất đồ họa pixel art cho trò chơi **Tiệm May Nếp**.

Tất cả các tài liệu `README.md` con của từng asset trong kho chỉ được mô tả nội dung bằng lời văn và tên màu quy ước, tuyệt đối không được ghi lại các thông số kỹ thuật đã được chuẩn hóa tại đây.

---

## 1. Mục Đích & Cây Thư Mục Kho Asset Game

Kho tài nguyên này chuyên biệt phục vụ các thành phần đồ họa, hoạt ảnh và âm thanh trong gameplay (nhân vật, trang phục lớp, áo dài, phụ kiện, hoạ tiết, vật phẩm, khu vực, overlay, tài liệu cốt truyện, VFX, CG, âm thanh). Các thành phần khung giao diện, nút bấm, HUD và màn hình ứng dụng thuộc quyền quản lý của team UI.

Cấu trúc phân mục chuẩn hóa:

- `characters/`: Sprite nhân vật người chơi và các nhân vật phụ/NPC qua các thời kỳ (đứng, bước đi, tương tác, biểu cảm).
- `paperdoll/`: (Bãi bỏ) Thư mục lưu trữ lớp cơ thể chuẩn và tài liệu hệ thống 13 lớp cho nhân vật chính An.
- `garments/`: Các lớp áo dài mặc được (ghép trên cơ thể An) và ảnh đại diện thu nhỏ (thumbnail) trong Tủ đồ.
- `accessories/`: Các lớp phụ kiện mặc được trên nhân vật và biểu tượng phụ kiện (icon) trong Tủ đồ / Cửa hàng.
- `motifs/`: Hoa văn dệt truyền thống vẽ theo ô lặp liền viền (seamless tile) dùng phủ chất liệu vải.
- `items/`: Biểu tượng vật phẩm túi đồ, manh mối điều tra và đồ vật tương tác cốt truyện.
- `areas/<chapter>/`: Nền bối cảnh khu vực, các lớp phủ trạng thái (overlay), tài liệu phóng to (doc), tranh minh họa cao trào (CG) và hiệu ứng thị giác (VFX) phân theo từng chương (`prologue`, `chapter-1` đến `chapter-5`).
- `audio/`: Danh mục tệp âm thanh gồm nhạc nền (BGM), tiếng động môi trường (Ambience) và hiệu ứng tương tác (SFX).
- `screens/`: của team UI, kho này không quản lý.
- `design/`: của team UI, kho này không quản lý.

---

## 2. Cách Ghép Prompt Tạo Ảnh

Mọi prompt gửi tới mô hình tạo ảnh được lắp ráp theo đúng công thức 3 thành phần tuần tự:

$$\text{Prompt hoàn chỉnh} = [\text{Cụm kỹ thuật theo loại}] + [\text{Mô tả chủ thể (EN) trong README asset}] + [\text{Negative chung}]$$

- **[Cụm kỹ thuật theo loại]:** Trích xuất từ Mục 4 và Mục 5 tương ứng với loại tài nguyên cần vẽ.
- **[Mô tả chủ thể (EN)]:** Trích xuất nguyên văn từ mục tương ứng trong `README.md` của asset đó (chỉ mô tả nhân vật, trang phục, bố cục, chất liệu, màu sắc bằng tên tiếng Anh, cảm xúc).
- **[Negative chung]:** Khối từ khóa loại trừ bắt buộc quy định tại Mục 8.

---

## 3. Mô Hình & Cài Đặt Sinh Ảnh

- **Mô hình chỉ định:** Sử dụng mô hình **`gemini-3.1-flash-image`** trong Google AI Studio.
- **Cấm sử dụng:** Tuyệt đối không sử dụng mô hình cũ `gemini-2.5-flash-image` do không đảm bảo độ sắc nét của khối pixel vuông và dễ sinh hạt mờ khử răng cưa.
- **Tỷ lệ khung hình (Aspect Ratio):** Luôn chọn trực tiếp trong mục cài đặt (Settings / Aspect Ratio) của giao diện Google AI Studio (ví dụ: 1:1, 4:3, 16:9, 3:4, 9:16) tương ứng với từng loại asset; không mô tả tỷ lệ khung bằng lời trong prompt.
- **Nguyên tắc thử nghiệm:** Mỗi lượt chỉnh sửa prompt chỉ thay đổi đúng một chi tiết hoặc một từ khóa duy nhất để kiểm soát chất lượng tạo hình.
- **Ảnh tham chiếu (Reference Image):**
  - Luôn đính kèm ảnh tham chiếu phong cách mỹ thuật chung của dự án để AI giữ đúng chất pixel hoài niệm Việt Nam.
  - Đối với các lớp trang phục (`garment-layer`) và phụ kiện (`accessory-layer`) của hệ thống 13 lớp An: **BẮT BUỘC** đính kèm hình ảnh khối cơ thể mẫu (`body base`) để mô hình căn khớp chính xác tỷ lệ vai, eo, cổ và tay áo.

---

## 4. Cụm Kỹ Thuật Chuẩn Hóa (Technical Prefix)

### Nhân vật (Character Sprites & Portraits)

Dành cho nhân vật chính An và NPC, sử dụng cụm kỹ thuật được tối ưu cho chibi pixel-art mục tiêu:

```text
chibi pixel-art style matching the reference, 1:1 detail, soft anti-aliased edges, 176x416 frame, feet at y=400
```

### Nền và Screens

**Không cần prefix resize.** Dùng:

```text
pixel art, limited palette, hard edges
```

thêm `, dithering` nếu là nền khu vực (`area-background`, `area-overlay`) hoặc tài liệu (`doc`).

### Quy tắc bổ sung:
- **Tách phông nền trong suốt (Chroma Key):** Đối với các asset cần tách phông trong suốt, thêm vào cuối cụm kỹ thuật:
  ```text
  flat solid #FF00FF background with no shadow
  ```
- **Ngoại lệ màu nền:** Nếu asset có chứa tông màu hồng sen, cánh sen hoặc đỏ tím (trùng dải màu magenta `#FF00FF`), chuyển sang dùng màu xanh lá thuần:
  ```text
  flat solid #00FF00 background with no shadow
  ```

---

## 5. Đơn Vị An & humanHeight

### 5.1. Khung nhân vật chuẩn (Character Frame)

- **Kích thước:** 176 × 416 pixel mỗi frame
- **Điểm chân (foot anchor):** (88, 400) — trung tâm ngang, chân của nhân vật ở hàng y = 400
- **Dáng cao:** 380–392 px (chiều cao nhân vật từ chân tới đỉnh đầu)
- **Tỉ lệ chibi:** Đầu và tóc khoảng 1/3 chiều cao nhân vật
- **Chi tiết:** Vẽ 1:1, khử răng cưa mềm (soft anti-aliased edges), nền trong suốt 100%, xuất đủ canvas

### 5.2. Mèo Nếp (Cat Sprite)

- **Khung:** 128 × 128 pixel
- **Kích thước mèo:** Cao khoảng 100 px trong khung

### 5.3. Áo và phụ kiện (Garment & Accessory Layers)

- **Kích thước:** dải 528 × 416 pixel
- **Bố cục 3 ô:** front (trái), side — left view (giữa), back (phải), mỗi ô 176 × 416 px
- **Kỹ thuật:** Áo vẽ thang xám theo độ sáng, được tô màu bằng **gradient-map 4 màu** của palette
- **Xuất:** Đủ canvas, không trim

### 5.4. Bảng humanHeight theo cảnh

Tỷ lệ chiều cao dáng An / chiều cao ảnh nền, đã căn bằng ảnh chụp ngày 05/10 (`src/game/character-scale.ts`, bảng `HUMAN_HEIGHT`). Chiều cao trượt tuyến tính từ `back` (chân ở mép sau dải sàn) đến `front` (chân ở mép trước); dải sàn tính theo tỷ lệ chiều cao nền.

| Cảnh (`CharacterScene`) | Nền | back | front | Dải sàn (trên → dưới) | Vật tham chiếu |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Mở đầu (`c0`) | `c0-s1`, `c0-s2` | 0.38 | 0.50 | 0.60 → 0.95 | bàn may chạm hông An |
| Chương 1 (`c1`) | `c1-s1..s3` | 0.42 | 0.42 | 0.60 → 0.95 | An vừa ngang khung cửa |
| Sảnh (`hub`) | `garden-user--landscape` | 0.15 | 0.15 | cả nền | An xấp xỉ cửa nhà |
| Phòng phối đồ (`studio`) | `vietnamese-room--landscape` | 0.34 | 0.48 | 0.47 → 0.73 | ghế tựa ≈ 1 m |
| Tủ đồ (`closet`) | `closet-shelf--landscape` | 0.31 | 0.55 | 0.71 → 1.00 | bàn trang điểm ≈ 75 cm |
| Xưởng may (`workshop`) | (chưa dùng nền) | 0.31 | 0.55 | 0.71 → 1.00 | theo Tủ đồ |

Phòng phối đồ/Tủ đồ: chiều cao lấy theo độ sâu nơi chân An đứng, rồi giới hạn ≤ 1.2 lần khung gốc và không vượt vùng trống trên màn hình. Trong phòng truyện, chân An không đứng trong "vùng vật cản" của bàn/rương (`OBSTACLES` trong `src/game/room-walker.ts`); điểm rơi vào đó được đẩy ra sàn ngay phía trước.

*Quy tắc: Không làm tròn hệ số, chỉ làm tròn px màn hình.*

---

## 6. Bảng Chuẩn Hóa Loại Asset (Asset Specifications)

Các thông số dưới đây tuân thủ chính sách An làm đơn vị chuẩn:

| Loại Asset | Kích thước chuẩn (px) | Tỷ lệ khung khi gen | Cách cắt chuẩn hóa nếu AI không có tỷ lệ | Bảo Tàng | Số khung hình | Cần tách nền |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| `character-sprite` | 176 × 416 | 3:8 | Căn giữa nhân vật trên khung 176 × 416 px mỗi frame | An, NPC 4 hướng | 1 (idle) hoặc 4 (facing) | Có |
| `cat-sprite` | 128 × 128 | 1:1 | Căn giữa khung 128 × 128 px mỗi frame | Cat Nep | 2–4 khung | Có |
| `portrait` | crop từ front view | — | Dùng ô front của character-sprite, crop phần ngực trở lên | Sổ tay Nhân vật | 1–2 khung | Có |
| `paperdoll-layer` | 176 × 416 | 3:8 | (bãi bỏ; lớp cơ sở chính là 13 layer của An) | — | — | — |
| `garment-layer` | dải 528 × 416 | — | 3 ô front, side, back mỗi 176 × 416, xuất đủ canvas | — | 1 tĩnh | Có |
| `garment-icon` | 96 × 96 | 1:1 | Căn giữa tà áo thu nhỏ hiển thị trọn vẹn trong khung 96 × 96 px | Wardrobe UI | 1 tĩnh | Có |
| `accessory-layer` | dải 528 × 416 | — | 3 ô front, side, back mỗi 176 × 416, xuất đủ canvas | — | 1 tĩnh | Có |
| `accessory-icon` | 48 × 48 | 1:1 | Căn giữa vật thể trong khung 48 × 48 px | UI | 1 tĩnh | Có |
| `item-icon` | 48 × 48 | 1:1 | Căn giữa vật thể trong khung 48 × 48 px | Codex | 1 tĩnh | Có |
| `motif` | 32 × 32 | 1:1 | Vẽ họa tiết lặp vô tận (seamless repeat) trên lưới 32 × 32 px | — | 1 tĩnh | Có |
| `area-background` | kích thước thật của file | — | Gen theo kích thước thực tế của file đã khôi phục | — | 1 tĩnh | Không |
| `area-overlay` | kích thước thật của file | — | Gen theo kích thước thực tế của file đã khôi phục | — | 1–4 khung | Có |
| `cg` | kích thước thật của file | — | Gen theo kích thước thực tế của file đã khôi phục | — | 1 tĩnh | Không |
| `doc` | kích thước thật của file | — | Gen theo kích thước thực tế của file đã khôi phục | Codex | 1 tĩnh | Có |
| `screen-background` | kích thước thật của file (gốc AI) | — | Giữ nguyên bản gen gốc không downscale | UI | 1 tĩnh | Không |
| `icon UI` | 16 × 16 | 1:1 | Icon UI hiển thị theo bội số nguyên, độc lập với An unit | UI | 1 tĩnh | Có |
| `ui-frame-9slice` | kích thước thật của file | — | Giữ nguyên kích thước gốc | UI | 1 tĩnh | Có |
| `ui-bar-3slice` | kích thước thật của file | — | Giữ nguyên kích thước gốc | UI | 1 tĩnh | Có |

*Ghi chú:* 
- **Bãi bỏ `paperdoll-layer`:** Hệ thống búp bê giấy dùng 13 lớp của An trực tiếp, không cần lớp base riêng.
- **Background & screens:** Ghi đúng kích thước thật của file đang có, không bắt resize. Files đã khôi phục bản gen gốc ngày 05/10 được giữ nguyên kích thước, không downscale.

---

## 7. Quy Chuẩn Hệ Thống 13 Lớp & Gradient-Map Màu (An Character Layer System)

### 7.1. Thứ tự 13 lớp đồ họa (Layer Stacking Order)

Hệ thống hiển thị nhân vật An trên khung lưới chuẩn **176 × 416 pixel**, xếp chồng từ dưới lên trên theo đúng thứ tự (từ `src/game/assets.ts` -> `AN.layers`):

1. `shadow` — Bóng chân nhân vật in trên mặt đất
2. `hair_back` — Tóc sau (phần tóc mặt lưng)
3. `outfit_back` — Tà áo sau rủ dài sau lưng
4. `legs` — Đùi (phần chân trên quần)
5. `shoes` — Giày (phần chân dưới)
6. `body` — Khối cơ thể, dáng đứng, tông màu da cơ bản
7. `bottom` — Quần lụa dài hai ống (trắng hoặc đen, rủ chạm mu bàn chân)
8. `outfit_main` — Thân áo chính, cổ đứng/cổ sen, hàng khuy cài, đường xẻ tà bên sườn
9. `head` — Khuôn mặt (phần đầu không bao gồm tóc)
10. `face` — Mặt chi tiết (mũi, miệng, nếp mắt)
11. `hair_front` — Tóc trước (phần tóc che trán)
12. `hands` — Bàn tay (tay cầm, tay chạm áo)
13. `head_accessory` — Phụ kiện đội đầu (khăn vấn, khăn đóng, nón lá, nón quai thao)

### 7.2. Quy tắc xuất đủ canvas (No Trim)

Tất cả các tệp hình ảnh của `garment-layer` và `accessory-layer` **BẮT BUỘC** phải được lưu trữ trên canvas kích thước đầy đủ đúng **528 × 416 pixel** (3 ô × 176 × 416). Tuyệt đối không xén bớt (trim/crop) phần trong suốt thừa. Khi UI vẽ lên màn hình tại tọa độ gốc `(0, 0)`, mọi lớp áo và phụ kiện sẽ khớp tuyệt đối từng điểm ảnh với cơ thể nhân vật.

### 7.3. Bảng mã Gradient-Map Màu (Palette Swapping Keys)

Trang phục gồm lớp `garment-layer` và `accessory-layer` được lưu dưới định dạng PNG Thang độ xám (Grayscale). Động cơ render trên HTML5 Canvas sẽ quét dữ liệu điểm ảnh và thay thế 4 mã màu chuẩn này sang màu sắc người dùng lựa chọn (gradient-map):

- **4 Key màu thân áo chính (Garment Base):**
  1. `Highlight` (Vùng sáng phản quang vải): `#E0E0E0`
  2. `Base Tone` (Màu thân vải chủ đạo): `#9E9E9E`
  3. `Shadow Tone` (Vùng tối nếp gấp vải): `#616161`
  4. `Outline` (Đường viền nét vẽ viền áo): `#212121`

*Các chi tiết phụ (khuy cài, viền cỏ, đường chỉ) được vẽ đầy đủ màu trong layer, không cần gradient-map.*

---

## 8. Bảng Màu Chuẩn Hóa Của Dự Án (Palette Mapping)

Tất cả các tệp `README.md` mô tả asset con chỉ được phép gọi tên màu bằng **TÊN TIẾNG VIỆT** quy định dưới đây; mã Hex chỉ lưu trữ tại bảng này:

| Tên Màu Tiếng Việt | Mã Màu Hex | Tính Chất & Phạm Vi Sử Dụng |
| :--- | :---: | :--- |
| **củ nâu** (nâu củ nâu) | `#6B4423` | Nhuộm củ nâu Bắc Bộ mộc mạc, dùng cho áo tứ thân, ngũ thân lao động |
| **chàm** (chàm thẫm) | `#1E2A38` | Sắc xanh đen lá chàm ủ vôi, dùng cho vạt áo, cõi Lật Vải và trang phục góa bụa |
| **chàm sáng** | `#2D3E50` | Vùng sáng phản quang của lụa nhuộm chàm |
| **đỏ son** | `#B83A24` | Đỏ cánh kiến tươi tắn, dùng cho nơ mèo Nếp, hoa văn lễ hội, vạt áo cưới |
| **đỏ điều** | `#8B261E` | Đỏ sẫm cổ kính, rèm bàn thờ dòng họ, lót rương gỗ gia bảo |
| **hoàng yến** | `#CFA449` | Sắc vàng óng tơ tằm, ánh nắng thu chiếu rọi, chỉ thêu kim tuyến |
| **vàng mỡ gà** | `#E8D399` | Vàng nhạt thanh nhã của áo dài tân thời thập niên 1930 |
| **men lam** | `#2D6A5D` | Sắc xanh gốm men lam cổ truyền, ngọc bích, viền tà quyền quý |
| **xanh ngọc bích** | `#2E8B7A` | Xanh ngọc áo dài cổ thuyền thập niên 1960 của bà Mai |
| **lam khói** | `#4E6B7A` | Sắc lam xám mờ ảo của sương sớm và khói trầm |
| **giấy dó** (trắng ngà) | `#F5EFEB` | Màu sợi tơ tằm thô và giấy dó thủ công, nền áo phin bao cấp |
| **đen mun** | `#1C1614` | Gỗ mun bóng, guốc mộc, tóc đen nhánh, bóng đêm tĩnh mịch |
| **gỗ lim tối** | `#2E1C12` | Gỗ cột đình, thân rương cổ, sập gụ từ đường |
| **gỗ sẫm** | `#3D261A` | Bàn cắt may tiệm vải, cầu thang gỗ lim |
| **đồng thau cổ** | `#B58A42` | Ổ khóa ba chấu, thước thợ may, khuy kim loại cổ |
| **vàng kim tuyến** | `#F2C94C` | Đường nét chữ Nôm phát sáng trong cõi dệt tâm thức |
| **kem sáng** | `#FDEACE` | Nền thẻ sáng, điểm phản quang viền |
| **kem đào** | `#FDE5C8` | Tông nền bảng thẻ, bề mặt lụa ngà ấm áp |
| **đào nhạt** | `#F3C098` | Viền phản quang ánh gỗ |
| **hồng ngọc** | `#D37C74` | Viền phân cách nội dung |
| **hồng sen** | `#E75788` | Điểm nhấn hoa sen, sắc hồng hiện đại |
| **đỏ mận** | `#A53556` | Tông bóng nổi chân đế |
| **mận chín** | `#7B3248` | Màu chữ chú thích, vạt tơ dệt chín |
| **mận đậm** | `#411D3A` | Viền ngoài đậm nét của cấu trúc khung |
| **tím đêm** | `#251728` | Bóng tối sâu, chiều sâu của không gian ma mị |
| **mực đen** | `#1E1523` | Nét mực nho, chữ in đậm sắc cạnh |
| **vàng đồng** | `#E09B5A` | Viền kim loại dát vàng, chỉ vàng óng |
| **hồng hoàng hôn** | `#FB9A99` | Ánh trời chiều rọi qua ô cửa sổ kính |

---

## 9. Khối Từ Khóa Loại Trừ (Negative) & Quy Tắc Nội Dung

### 9.1. Negative chung bắt buộc ghép vào prompt
Mọi yêu cầu sinh ảnh bắt buộc đính kèm đoạn từ khóa loại trừ sau:

```text
photorealistic, realistic, hyperrealistic, 3D render, CGI, unreal engine, smooth gradients, anti-aliased, blurry, soft focus, bokeh, drop shadow, modern text, english text, chinese characters, kanji, hanzi, letters, signature, watermark, logo, western clothing, chinese qipao, korean hanbok, japanese kimono
```

### 9.2. Bốn quy tắc nội dung bất khả xâm phạm
1. **Tuyệt đối không để AI vẽ chữ vào ảnh:**
   - Không sinh chữ Hán, chữ Nôm, chữ Quốc ngữ, thư pháp, chữ ký, ấn triện hay biển hiệu có chữ.
   - Toàn bộ nội dung văn bản trên các bức thư, văn tự, bài vị, gia phả, hoành phi và chứng cứ sẽ do giao diện (UI Text Engine) phủ văn bản lên trên ảnh nền/vật phẩm khi hiển thị cho người chơi đọc.
2. **Tuyệt đối không vẽ và không gắn tên họa sĩ Lê Phổ:**
   - Tuân thủ Quyết định mục 13 (`decisions.md`): Không gán công cải tiến trang phục cho họa sĩ Lê Phổ do thiếu căn cứ xác thực. Mẫu áo sau thời kỳ Lemur được gọi chuẩn mực là: *"áo dài tân thời cổ đứng, không vai bồng (cuối thập niên 1930)"*.
3. **Không sao chép nguyên mẫu áo dài của Cát Tường:**
   - Thiết kế áo tân thời giai đoạn 1934 chỉ lấy cảm hứng văn hóa lịch sử từ phong trào canh tân y phục (cổ lá sen, chiết eo nhẹ, tay bồng thanh nhã), không chép y nguyên tác quyền bản thảo của Nguyễn Cát Tường.
4. **Không để lẫn trang phục ngoại lai vào áo dài và Việt phục:**
   - Không để xuất hiện sườn xám Trung Hoa (cổ áo khuy chéo xẻ đùi cao hở hang), Hanbok Triều Tiên (váy phồng quây ngực ngắn) hay Kimono Nhật Bản (đai lưng obi to bản). Áo ngũ thân và áo dài Việt Nam luôn mặc kèm quần lụa dài chấm mu bàn chân, xẻ tà từ eo, khuy cài kín đáo bên hữu theo đúng luân lý ngũ thường.

---

## 10. Quy Trình 9 Bước Sản Xuất & Tinh Chỉnh Asset

Mọi hình ảnh trước khi tích hợp vào app đều phải trải qua quy trình 9 bước tiêu chuẩn:

```
[1. Gen AI] ──> [2. Dò lưới] ──> [3. Ép palette] ──> [4. Xóa nền] ──> [5. Canvas chuẩn] ──> [6. Sửa tay] ──> [7. QA Kỹ thuật] ──> [8. Duyệt văn hóa] ──> [9. Xuất PNG]
```

- **Bước 1: Gen (Tạo ảnh nháp):** Dùng prompt ghép chuẩn gửi mô hình `gemini-3.1-flash-image` trong Google AI Studio, chọn tỷ lệ khung hình và lưu ảnh nháp vào thư mục `_raw/` cạnh README asset.
- **Bước 2: Dò lưới (Grid Snapping):** Đưa ảnh vào phần mềm chuyên dụng (Aseprite / Photoshop), căn chỉnh tỷ lệ pixel scale để từng hạt pixel ăn khớp hoàn hảo vào lưới lưới vuông (Pixel Grid).
- **Bước 3: Ép Palette (Color Quantization):** Giới hạn số lượng màu về đúng số lượng quy định (tối đa 4, 12, 16 hoặc 32 màu tùy loại asset), chuyển đổi sang bảng màu chuẩn của dự án.
- **Bước 4: Xóa nền (Chroma Key):** Khử hoàn toàn màu phông nền `#FF00FF` hoặc `#00FF00` thành kênh Alpha trong suốt 100%, không để lại viền lem hạt màu phông.
- **Bước 5: Đưa về Canvas chuẩn (Canvas Sizing):** Đặt hình vào kích thước khung hình chuẩn theo bảng kỹ thuật (ví dụ: 176 × 416, 528 × 416, 48 × 48 px), căn đúng trọng tâm hoặc vị trí offset, không cắt tỉa (no trim).
- **Bước 6: Sửa tay (Pixel Cleanup):** Họa sĩ dùng bút 1px chỉnh sửa thủ công: tỉa sắc nét đường viền (crisp outline), loại bỏ pixel thừa lạc lõng (stray pixels), chỉnh lại nếp vải và khuôn mặt.
- **Bước 7: QA Kỹ thuật:** Kiểm tra kích thước chính xác, kiểm tra độ sâu màu, xác nhận không có hiệu ứng anti-aliasing làm mờ viền.
- **Bước 8: Duyệt văn hóa (Cultural Review):** Đối chiếu hồ sơ nhân vật và tư liệu lịch sử: kiểm tra hàng khuy 5 hạt bên hữu, độ đứng của cổ lập lĩnh, chiều dài vạt áo, bảo đảm tính xác thực di sản.
- **Bước 9: Xuất PNG chuẩn:** Xuất tệp PNG nén lossless không mất dữ liệu, đặt tên chuẩn và đưa vào vị trí phân phối.

> **QUY TẮC BẮT BUỘC:** Bước 1 thực hiện bằng AI. Toàn bộ các **Bước 2 đến Bước 9 BẮT BUỘC thực hiện bằng công cụ đồ họa chuyên dụng và sự trau chuốt của con người**, tuyệt đối không dùng AI để tự động sửa chữa vì sẽ làm mất cấu trúc pixel grid.

---

## 11. Quy Chuẩn Đặt Tên & Quản Lý Trạng Thái

### 11.1. Cú pháp đặt tên tệp
- Toàn bộ dùng chữ thường, không dấu tiếng Việt, nối nhau bằng dấu gạch ngang (`kebab-case`), định dạng tệp luôn là `.png`.
- **Nền khu vực:** `<area-id>--phai.png` (mặt phải thế giới thực).
- **Mặt trái khu vực:** `<area-id>--trai.png` (cõi dệt lật vải; trạng thái ghi chú: *"hoãn sau 10/10"*).
- **Lớp phủ trạng thái:** `<area-id>--<trang-thai>.png` (Chờ gen lại các overlay trạng thái cảnh kỳ).
- **Nhân vật:**
  - Tư thế bối cảnh: `scene-<bien-the>-<pose>.png` (Chờ gen lại các CG nhân vật).
  - Chân dung biểu cảm: `portrait-<bien-the>-<bieu-cam>.png` (Chờ gen lại các chân dung biểu cảm).
- **Trang phục & Phụ kiện:**
  - Lớp trang phục mặc trên người: `<id>.png` (dùng trong `assets/garments/<id>/` hoặc `assets/accessories/<id>/`).
  - Ảnh đại diện hiển thị: `<id>--icon.png` (cho phụ kiện/vật phẩm hoặc áo trong tủ).
- **Thư mục ảnh nháp:** Mỗi asset có một thư mục `_raw/` nằm cạnh file `README.md` để lưu trữ các lần tạo ảnh của AI (`<ten>-v1.png`, `<ten>-v2.png`).

### 11.2. Bốn trạng thái tiến độ chuẩn
Mọi tệp trong bảng danh mục của README asset đều mang một trong bốn trạng thái sau:
- ⬜ **chưa gen:** Mới có tài liệu mô tả, chưa tiến hành chạy AI.
- 🟨 **nháp AI:** Đã sinh ảnh thô từ Google AI Studio, đang lưu trong `_raw/`.
- 🟩 **đã làm sạch:** Đã hoàn thành các bước dò lưới, xóa phông, sửa tay 1px và đạt chuẩn QA kỹ thuật.
- ✅ **đã vào app:** Đã được kiểm tra văn hóa, tối ưu dung lượng và tích hợp thành công vào mã nguồn chạy của trò chơi.

---

## 12. Danh Sách Asset Chờ Gen Lại

### Nhân vật (Characters) — 7 NPC + An chính

#### 4 NPC × 4 hướng (view-front, view-left, view-right, view-back)
- `cat-nep` — mèo nếp, khung 128×128
- `ong-le` — ông Lê dạng bóng mờ (silhouette + whisper effect), khung 176×416
- `cu-cam` — Cú Cam, khung 176×416
- `truong-toc-bui` — Trưởng tóc bụi, khung 176×416

#### 3 NPC chỉ mặt trước (portrait-only)
- `cu-loan` — Cú Loan, khung 176×416
- `ba-mai` — Bà Mai, khung 176×416
- `me-phuong` — Mẹ Phương, khung 176×416

| NPC | Loại | Tệp Cần Gen | Trạng Thái |
| :--- | :--- | :--- | :---: |
| `cat-nep` | cat-sprite | `assets/characters/cat-nep/view-front.png`, `view-left.png`, `view-right.png`, `view-back.png` (mỗi 128×128) | Chờ gen lại |
| `ong-le` | character-sprite (shadow) | `assets/characters/ong-le/view-front.png`, `view-left.png`, `view-right.png`, `view-back.png` (mỗi 176×416, silhouette mờ) | Chờ gen lại |
| `cu-cam` | character-sprite | `assets/characters/cu-cam/view-front.png`, `view-left.png`, `view-right.png`, `view-back.png` (mỗi 176×416) | Chờ gen lại |
| `truong-toc-bui` | character-sprite | `assets/characters/truong-toc-bui/view-front.png`, `view-left.png`, `view-right.png`, `view-back.png` (mỗi 176×416) | Chờ gen lại |
| `cu-loan` | character-sprite | `assets/characters/cu-loan/view-front.png` (176×416) | Chờ gen lại |
| `ba-mai` | character-sprite | `assets/characters/ba-mai/view-front.png` (176×416) | Chờ gen lại |
| `me-phuong` | character-sprite | `assets/characters/me-phuong/view-front.png` (176×416) | Chờ gen lại |

### Trang phục (Garments) — 10 áo dài

| Áo | ID | Loại | Tệp Cần Gen | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| Áo Tứ Thân | `ao-tu-than` | garment-layer | `assets/garments/ao-tu-than/ao-tu-than.png` (dải 528×416, 3 ô front/side/back) | Chờ gen lại |
| Áo Ngũ Thân Tay Chẽn | `ao-ngu-than-tay-chen` | garment-layer | `assets/garments/ao-ngu-than-tay-chen/ao-ngu-than-tay-chen.png` (dải 528×416) | Chờ gen lại |
| Áo Ngũ Thân Tay Thùng | `ao-ngu-than-tay-thung` | garment-layer | `assets/garments/ao-ngu-than-tay-thung/ao-ngu-than-tay-thung.png` (dải 528×416) | Chờ gen lại |
| Áo Dài Lemur | `ao-dai-lemur` | garment-layer | `assets/garments/ao-dai-lemur/ao-dai-lemur.png` (dải 528×416) | Chờ gen lại |
| Áo Dài Tân Thời Vàng Mỡ Gà | `ao-dai-tan-thoi-vang-mo-ga` | garment-layer | `assets/garments/ao-dai-tan-thoi-vang-mo-ga/ao-dai-tan-thoi-vang-mo-ga.png` (dải 528×416) | Chờ gen lại |
| Áo Dài Raglan | `ao-dai-raglan` | garment-layer | `assets/garments/ao-dai-raglan/ao-dai-raglan.png` (dải 528×416) | Chờ gen lại |
| Áo Dài Cổ Thuyền | `ao-dai-co-thuyen` | garment-layer | `assets/garments/ao-dai-co-thuyen/ao-dai-co-thuyen.png` (dải 528×416) | Chờ gen lại |
| Áo Dài Cưới Phin | `ao-dai-cuoi-phin` | garment-layer | `assets/garments/ao-dai-cuoi-phin/ao-dai-cuoi-phin.png` (dải 528×416) | Chờ gen lại |
| Áo Dài Popolin | `ao-dai-popolin` | garment-layer | `assets/garments/ao-dai-popolin/ao-dai-popolin.png` (dải 528×416) | Chờ gen lại |
| Áo Ngũ Thân Remix 2026 | `ao-ngu-than-remix-2026` | garment-layer | `assets/garments/ao-ngu-than-remix-2026/ao-ngu-than-remix-2026.png` (dải 528×416) | Chờ gen lại |

### Phụ kiện (Accessories) — 10 phụ kiện

| Phụ Kiện | ID | Loại | Tệp Cần Gen | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: |
| Nón Lá | `non-la` | accessory-layer | `assets/accessories/non-la/non-la.png` (dải 528×416) | Chờ gen lại |
| Quạt Lụa | `quat-lua` | accessory-layer | `assets/accessories/quat-lua/quat-lua.png` (dải 528×416) | Chờ gen lại |
| Khăn Vấn Đen | `khan-van-den` | accessory-layer | `assets/accessories/khan-van-den/khan-van-den.png` (dải 528×416) | Chờ gen lại |
| Khăn Vấn Hoàng Yến | `khan-van-hoang-yen` | accessory-layer | `assets/accessories/khan-van-hoang-yen/khan-van-hoang-yen.png` (dải 528×416) | Chờ gen lại |
| Khăn Mở Quạ | `khan-mo-qua` | accessory-layer | `assets/accessories/khan-mo-qua/khan-mo-qua.png` (dải 528×416) | Chờ gen lại |
| Kiềng Bạc | `kieng-bac` | accessory-layer | `assets/accessories/kieng-bac/kieng-bac.png` (dải 528×416) | Chờ gen lại |
| Nón Quai Thao | `non-quai-thao` | accessory-layer | `assets/accessories/non-quai-thao/non-quai-thao.png` (dải 528×416) | Chờ gen lại |
| Guốc Mộc | `guoc-moc` | accessory-layer | `assets/accessories/guoc-moc/guoc-moc.png` (dải 528×416) | Chờ gen lại |
| Hài Thêu | `hai-theu` | accessory-layer | `assets/accessories/hai-theu/hai-theu.png` (dải 528×416) | Chờ gen lại |
| Kính Mắt Mèo | `kinh-mat-meo` | accessory-layer | `assets/accessories/kinh-mat-meo/kinh-mat-meo.png` (dải 528×416) | Chờ gen lại |

### Ghi chú

- NPC chương 2–5 (`ca-nghi`, `vinh`, `chu-suu`, `hoang-lam`, `ba-lon`, `thay-ba-can`) đợi sau phase 01.
- Mỗi tệp garment và accessory là **dải 528 × 416 px** chứa 3 ô: front, side (trái), back, mỗi ô 176 × 416 px.
- Áo vẽ thang xám, tô màu bằng gradient-map 4 màu.
- **Trạng thái:** "Chờ gen lại" cho tất cả các tệp ở mục này.

---

## 13. Mẫu Chuẩn Cho README Của Từng Asset Con

Mọi tệp `README.md` của từng asset con trong toàn kho phải tuân thủ chính xác cấu trúc mẫu dưới đây:

```markdown
# <tên tiếng Việt của asset> (<id>)

- **Loại:** <chọn chính xác một loại trong Bảng loại asset tại assets/README.md>
- **Dùng ở đâu:** <ghi rõ phân cảnh cốt truyện, màn hình ứng dụng hoặc tính năng sử dụng>
- **Mô tả:** <Mô tả chi tiết bằng lời văn: nhân vật/sự vật là ai/cái gì, hình dáng, cử chỉ, nếp áo, chất liệu lụa/gỗ/đồng, cảm xúc, chuyển động. Màu sắc chỉ được gọi bằng TÊN TIẾNG VIỆT trong Bảng màu của assets/README.md. **TUYỆT ĐỐI KHÔNG GHI SỐ PIXEL, KHÔNG GHI DẤU X, KHÔNG GHI MÃ HEX, KHÔNG GHI TỌA ĐỘ, KHÔNG GHI TỶ LỆ SỐ.** >
- **Mô tả chủ thể (EN):** <Đoạn văn tiếng Anh đặc tả đối tượng: subject, pose, clothing details, traditional craftsmanship, fabric texture, colors by english common name, lighting mood. Không chứa các thông số kỹ thuật px hay mã hex>.
- **Ghi chú văn hóa (nếu có):** <Ý nghĩa lịch sử, phong tục cổ truyền, quy tắc ngũ thường, nguồn gốc trang phục>.
- **Tên cũ (nếu có):** <Đường dẫn hoặc tên gọi cũ trong các tài liệu trước đây để tiện truy vết>.

## Danh sách tệp cần có

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `<ten-tep-chuan>.png` | <Mô tả trạng thái hoặc góc nhìn bằng lời văn> | ⬜ chưa gen |
```

---

*Tài liệu này có hiệu lực áp dụng thống nhất cho toàn bộ quy trình sản xuất và chuẩn hóa tài nguyên của dự án Tiệm May Nếp kể từ ngày 05/10/2026.*
