# Hệ Thống Thiết Kế & Nhận Diện Hình Ảnh Tiệm May Nếp (Design System)

> **Cương lĩnh Art Director & UI/UX Designer:** Tài liệu này xác lập toàn bộ ngôn ngữ thị giác, bản sắc mỹ thuật pixel art, bảng màu giao diện, quy chuẩn lưới điểm ảnh, kiểu chữ và thư viện thành phần giao diện thống nhất cho web game **"Việt phục Remix - Tiệm May Nếp"**.  
> Mọi tài nguyên đồ họa (assets) và thành phần giao diện (UI) phải tuân thủ nghiêm ngặt các quy chuẩn dưới đây để đảm bảo chất lượng hình ảnh đồng bộ, công thái học tối ưu và tính chuẩn xác văn hóa.

---

## 1. Phong Cách Mỹ Thuật (Art Direction & Core Visual Language)

- **Thể loại đồ họa:** Pixel art 2D sắc nét, phong cách nhân vật chibi cách điệu với tỷ lệ đầu - thân hài hòa (khoảng 1:2.5 đến 1:3), đặt trong bối cảnh làng quê và phố thị Việt Nam theo góc nhìn ba phần tư (three-quarter 3/4 perspective).
- **Cảm hứng văn hóa vật chất:** Chắt lọc trực tiếp từ kiến trúc truyền thống người Kinh gồm mái ngói vảy rêu phong, sân gạch Bát Tràng đỏ ấm, ao sen ngát hương, hàng hiên gỗ lim, tiệm may cổ kính, quầy lụa ngũ sắc, xớ giấy dó ngả vàng, gỗ mộc và các dòng vải dệt tự nhiên (đũi, tơ tằm, lụa Hà Đông).
- **Cảm xúc cốt lõi (Emotional Tone):** Ấm áp, thư giãn, khơi gợi tò mò khám phá, gần gũi và tự do sáng tạo.
- **Tính thủ công & Chiều sâu mỹ thuật:** Mang cảm giác tạo tác thủ công tinh xảo, có chiều sâu lớp lang không gian (foreground, midground, background) và chi tiết vừa đủ; kiên quyết tránh làm giao diện quá trẻ con (candy-pop chibi lòe loẹt) hoặc lạm dụng chi tiết trang trí gây rối rắm.
- **Quy tắc tạo hình Pixel:**
  - Cạnh bậc thang sắc gọn (stepped edges), đường viền cứng (hard edges), bóng đổ khối cứng (hard shadow, không làm mờ/blur).
  - Hướng sáng chiếu thống nhất toàn bộ hệ thống từ **trên - bên trái** (Top-Left 45° Lighting) tạo bóng đổ chéo tự nhiên xuống dưới bên phải.
- **Quy chuẩn cấm kỵ (Anti-AI Slop & Anti-Modern Fluff):**
  - Tuyệt đối **KHÔNG dùng hiệu ứng kính mờ (glassmorphism)**, màu neon phát sáng chói lọi, hiệu ứng 3D bóng bẩy giả tạo, bóng mờ (box-shadow blur) hoặc các panel bo tròn dạng viên thuốc (pill shape).
  - Giữ vững bản sắc văn hóa Việt Nam qua từng đường nét kiến trúc, cổng làng, kèo cột, nẹp áo và khuy cài; tuyệt đối không tự ý lai tạp hay pha trộn chi tiết trang phục, hoa văn của các quốc gia khác (sườn xám Trung Hoa, hanbok Triều Tiên, kimono Nhật Bản).
- **Nguyên tắc phân vùng thị giác:** Bối cảnh nền có thể giàu chi tiết hoài niệm sống động, nhưng vùng đặt văn bản (text container, panel đọc, hộp thoại, bảng manh mối) bắt buộc phải thoáng đãng, yên tĩnh, nền màu thuần hoặc vân giấy nhạt để bảo đảm độ tương phản tối đa và trải nghiệm đọc thoải mái nhất.

---

## 2. Bảng Màu Chủ Đạo & Quy Tắc Phân Bổ Màu (Color System)

### 2.1. Bảng màu giao diện nền tảng (UI Foundation Palette)

Mỗi màu sắc được quy định rõ mã Hex và vai trò chức năng riêng biệt, tạo nên diện mạo hoàng hôn ấm cúng, sang trọng và thanh nhã:

| Tên Màu | Mã Hex | Token | Vai trò sử dụng chính |
| :--- | :---: | :--- | :--- |
| **Hồng sen dịu** | `#D986A7` | `lotus-pink` | Màu nhận diện thương hiệu, sắc vải hoa sen và các chi tiết trang trí tinh tế |
| **Hồng phấn** | `#F4CAD7` | `soft-pink` | Nền tab đang chọn (active tab), vùng highlight lựa chọn và các mảng phụ trợ |
| **Kem giấy** | `#FFF1DF` | `paper-cream` | Nền panel chính, khung hội thoại NPC, nền sổ manh mối và bề mặt giấy dó |
| **Kem sáng** | `#FFF8EE` | `light-cream` | Mặt thẻ thông tin, ô nhập liệu (input fields), vùng hiển thị chi tiết đọc |
| **Tím mận đậm** | `#2B2035` | `deep-plum` | Màu chữ chính, viền nét khung ngoài (borders) và bóng đổ cứng khối pixel |
| **Tím trầm** | `#74506E` | `muted-plum` | Màu chữ phụ, chú thích, nhãn phụ, ngày tháng và chi tiết thứ cấp |
| **Vàng ấm** | `#E9B66B` | `warm-gold` | Điểm nhấn kim loại/vàng đồng, đường chỉ viền nhỏ, biểu tượng thưởng Sen Ngọc |
| **Hồng đậm** | `#A72D60` | `crimson-pink` | Màu mặt nút bấm hành động chính (Primary CTA Button) |
| **Hover nút chính** | `#8D234F` | `primary-hover` | Trạng thái rê chuột (hover) trên nút hành động chính |
| **Pressed nút chính** | `#711B40` | `primary-pressed` | Trạng thái nhấn giữ (pressed/active) trên nút hành động chính |
| **Màu viền phụ** | `#855064` | `sub-border` | Đường kẻ phân cách, viền phân khu phụ, đường nét đứt chỉ may |

### 2.2. Bảng màu trạng thái (State Colors)

Màu trạng thái luôn đi kèm biểu tượng (icon) hoặc nhãn chữ cụ thể để người chơi dễ dàng nhận biết:

- **Thành công (Success):** Chữ và icon `#2E6847`, nền `#E4EFDF` (kèm icon dấu kiểm hoặc hoa sen xanh).
- **Gợi ý / Cảnh báo (Warning/Hint):** Chữ và icon `#80501C`, nền `#FFF0CB` (kèm icon bóng đèn ý tưởng hoặc cuộn chỉ).
- **Lỗi / Chưa đúng (Error):** Chữ và icon `#A12B48`, nền `#FBE2E6` (kèm icon dấu chéo hoặc kéo may).
- **Chưa khả dụng (Disabled):** Nền `#E1D5DC`, chữ `#855064`, không có bóng nổi.

### 2.3. Tỷ lệ màu định hướng trong vùng UI (UI Color Ratio)

Trong các màn hình giao diện (HUD, bảng điều khiển, thẻ chức năng), tuân thủ tỷ lệ màu kinh điển:
- **65% Kem giấy** (`#FFF1DF` / `#FFF8EE`): Chiếm ưu thế áp đảo tạo phông nền thư thái, yên tĩnh như trang sách cổ.
- **20% Mực tím mận / Gỗ trầm** (`#2B2035` / `#74506E`): Tạo cấu trúc khung viền vững chãi và văn bản đọc rõ nét.
- **10% Hồng sen** (`#D986A7` / `#F4CAD7` / `#A72D60`): Dẫn dắt ánh nhìn vào các điểm tương tác cốt lõi.
- **5% Vàng ấm** (`#E9B66B`): Tôn vinh các thành tựu, điểm thưởng và chi tiết dát vàng quý giá.

*(Lưu ý: Không áp tỷ lệ 65-20-10-5 cứng nhắc lên phong cảnh nền môi trường. Bối cảnh thiên nhiên có thể sử dụng các màu bổ trợ như xanh lá chuối, xanh hồ sen, đỏ gạch Bát Tràng, nâu đất nhưng phải hòa sắc êm ái cùng bảng màu chính. Tuyệt đối không phủ hồng lên tất cả trang phục; giữ nguyên vẹn nhận diện riêng của áo tứ thân nâu đất, ngũ thân xanh chàm, áo tấc đen tuyền và áo dài trắng).*

### 2.4. Bảng màu truyền thống cho vải áo (Heritage Garment Palette)

> **Quy định bất biến:** Bảng màu này **chỉ dùng cho chất liệu vải, hoa văn và vạt áo trong Phòng phối đồ**, không dùng làm màu cho các thành phần giao diện hệ thống.

- **Màu Củ Nâu (Brown Bark):** `#6B4423` — Vải đũi, tơ thô nhuộm củ nâu cho áo tứ thân, ngũ thân lao động.
- **Màu Chàm (Indigo):** `#1E2A38` / `#2D3E50` — Chiết xuất lá chàm ủ vôi, xanh đen thẫm bền bỉ và kín đáo.
- **Màu Điều / Son (Vermilion Red):** `#B83A24` — Cánh kiến đỏ truyền thống cho trang phục cưới hỏi, lễ hội.
- **Màu Hoàng Yến (Ochre / Gold):** `#CFA449` — Sắc vàng tơ tằm óng ả, tượng trưng sự ấm no và trang trọng.
- **Màu Men Lam (Ceramic Blue):** `#2D6A5D` — Sắc gốm lam cổ điển, dùng cho hoa văn ngọc bích và viền cổ.
- **Màu Giấy Dó (Dó Silk White):** `#F5EFEB` — Trắng ngà tự nhiên của sợi tơ thô và giấy dó mộc mạc.

---

## 3. Quy Chuẩn UI Pixel (Pixel Grid, Layout & Dimensions)

- **Màn hình nền & screen:** Hiển thị ảnh gốc (hi-res raw generation) theo kích thước thật của tệp. Ảnh được vẽ chi tiết 1:1 và có smoothing (`image-rendering: auto`) khi thu nhỏ hoặc mở rộng để fit/cover viewport. Ví dụ: Studio `vietnamese-room--landscape.png` 1585×992, Bảo tàng `bookshelf-pink--landscape.png` 1586×992, Sảnh `garden-user--landscape.png` 1586×992. Không chuẩn hóa sang lưới cố định.
- **Khu vực game (các phòng cốt truyện):** Thế giới (world) có kích thước = kích thước thật của nền. Ví dụ mở đầu prologue 890×500, chương 1 các phòng 640×360. Sảnh hub 1000×625. Nền được vẽ chi tiết 1:1, canvas có smoothing (`canvas.ctx.imageSmoothingEnabled = false` để vẽ An/NPC, nhưng ảnh nền tự smoothing khi scale).
- **Đơn vị giao diện cơ sở (UI Base Unit):** **4 CSS px**; nhịp bước bố cục chính (Major Cadence): **8 px**.
- **Hệ thống khoảng cách đồng bộ (Spacing System):** `4, 8, 12, 16, 24, 32, 48, 64 px`.
- **Độ dày đường viền (Borders):**
  - Viền `2 px` cho các thành phần nhỏ, nút phụ, ô chọn và thẻ con.
  - Viền `4 px` cho panel chính, hộp thoại, khung modal và thanh HUD.
- **Góc cắt bậc (Stepped Corners):** Cắt bậc vuông `4 px` (cho component vừa/nhỏ) hoặc `8 px` (cho panel lớn và modal). Tuyệt đối không dùng bo tròn CSS mượt mà (`border-radius: 9999px`).
- **Bóng cứng đặc trưng (Hard Shadows):**
  - Nút bấm và thẻ: Lệch xuống `4 px` (`box-shadow: 0 4px 0 #2B2035` hoặc màu nhấn đậm `#711B40`), hoàn toàn không làm mờ (blur: 0).
  - Panel chính và Modal: Lệch xuống `8 px` (`box-shadow: 0 8px 0 #2B2035`).
- **Khoảng cách đệm chuẩn (Padding Standards):**
  - Nút bấm: khoảng `12 × 20 px` (trên/dưới 12px, trái/phải 20px).
  - Thẻ thông tin (Cards): `16 px` đồng đều 4 phía.
  - Panel chính và hộp thoại: `24–32 px`.
- **Vùng chạm tương tác (Click/Touch Target):** Vùng bấm tối thiểu đạt `44 × 44 px`; nút hành động chính có chiều cao tối thiểu `48 px` để thao tác công thái học thuận lợi trên cả màn hình cảm ứng.
- **Quy tắc phân cấp hành động:** Mỗi bước trên màn hình chỉ có **duy nhất một hành động chính** nổi bật với sắc hồng đậm `#A72D60`, các nút khác sử dụng kiểu nút phụ nền kem viền tím.
- **Hoa văn thương hiệu (Brand Motif):** Hoa sen cách điệu pixel được sử dụng có tiết chế tại các góc viền khung panel (corner ornament) và trên các huy hiệu phần thưởng.
- **Xử lý chất liệu nền (Textures):** Vân giấy dó mộc mạc, đường viền thớ gỗ mun hay nếp sợi vải chỉ xuất hiện điểm xuyết nhẹ ở vùng khung trang trí viền; vùng đặt văn bản đọc phải hoàn toàn sạch sẽ, không có texture gây nhiễu thị giác.
- **Phân định rạch ròi giữa Pixel Nguồn và CSS px:**
  - *Pixel nguồn của Sprite (An unit):** Nhân vật An 176×416, NPC 176×416, Mèo Nếp 128×128, Chân dung 128×128 được vẽ trên lưới pixel thật, chi tiết 1:1, khử răng cưa mềm. Hiển thị với smoothing (`image-rendering: auto`) khi thu nhỏ bởi scale. Icon UI (48×48 vật phẩm, 24×24 UI, 96×96 thumbnail) và 9-slice/3-slice khung là pixel art chuẩn, phóng theo bội số nguyên với `image-rendering: pixelated` (Nearest-Neighbor).
  - *CSS px của Giao diện UI:* Panel, nút bấm, chữ viết render bằng HTML/CSS thật trên lưới 4px, giữ nguyên độ nét từng nét chữ mà không bị thu phóng co kéo cưỡng bức toàn màn hình.

---

## 4. Quy Chuẩn Kiểu Chữ (Typography)

Toàn bộ hệ thống giao diện sử dụng tiếng Việt có dấu hoàn chỉnh, tròn trịa, trang nghiêm và dễ tiếp cận:

### 4.1. Lựa chọn phông chữ (Font Families)
- **Văn bản nội dung & Hội thoại (Body & Dialogue):** Ưu tiên hệ thống phông `system-ui`, `"Segoe UI"`, `sans-serif` (hoặc `Be Vietnam Pro` trên web). Tuyệt đối cấm dùng font pixel mô phỏng cho các đoạn văn bản dài vì sẽ gây mỏi mắt và biến dạng dấu tiếng Việt trên màn hình mật độ điểm ảnh cao.
- **Tiêu đề lớn & Logo (Title & Display):** Chỉ sử dụng phông pixel (như `VT323` hoặc `Departure Mono Viet`) khi đã xác minh vượt qua bài test ký tự tiếng Việt mẫu:
  `"Tiệm May Nếp ẶẫỢữđ"`
  Nếu không hiển thị đủ dấu chuẩn mực, hệ thống bắt buộc chuyển sang dùng phông `Be Vietnam Pro` trọng số 800 (ExtraBold).

### 4.2. Thang kích thước & Phân cấp thị giác (Type Scale & Leading)

| Cấp bậc văn bản | Kích thước / Chiều cao dòng (px) | Độ đậm (Font Weight) | Màu chữ mặc định | Phạm vi sử dụng |
| :--- | :---: | :---: | :---: | :--- |
| **Tiêu đề màn hình** | `32 / 40` | ExtraBold (800) | `#2B2035` | Tên phân khu sảnh, tiêu đề lớn màn chơi |
| **Tiêu đề panel / Modal** | `24 / 32` | Bold (700) | `#2B2035` | Tiêu đề bảng điều khiển, hộp thoại chính |
| **Tiêu đề thẻ / Nhãn mục** | `20 / 28` | Bold (700) | `#2B2035` | Tên áo trong tủ, tên thẻ văn hóa |
| **Văn bản nội dung (Body)** | `16 / 24` | Regular (400) / Medium (500) | `#2B2035` | Đoạn văn thuyết minh, mô tả trang phục |
| **Lời thoại NPC (Dialogue)** | `18 / 28` | Regular (400) | `#2B2035` | Lời thoại nhân vật trong game giải đố |
| **Chữ trên nút (Button)** | `16 / 24` | Bold (700) | `#FFF8EE` / `#2B2035` | Nhãn hành động trên nút bấm |
| **Chú thích / Tag (Caption)** | `14 / 20` | Medium (500) | `#74506E` | Giá Sen Ngọc, ngày tháng, niên đại lịch sử |

### 4.3. Tiêu chuẩn tương phản khả năng tiếp cận (Accessibility Contrast Targets)
- **Văn bản thường (dưới 18px):** Tỷ lệ tương phản tối thiểu đạt **4.5:1** so với màu nền. *(Ví dụ: Chữ tím mận `#2B2035` trên nền kem giấy `#FFF1DF` đạt tỷ lệ tương phản ~11.8:1, vượt xa chuẩn khắt khe WCAG AAA).*
- **Văn bản lớn (từ 18px trở lên) và ranh giới điều khiển tương tác:** Tỷ lệ tương phản tối thiểu đạt **3.0:1**.
- **Nguyên tắc kỹ thuật:** Tuyệt đối không tuyên bố đạt chuẩn tương phản nếu chưa đo đạc kiểm chứng bằng công cụ đo độ chói (luminance ratio).

---

## 5. Đơn Vị An & Kích Thước Pixel Gốc

Spec toàn bộ hệ thống lấy nhân vật chính An làm đơn vị chuẩn. Chi tiết bảng `HUMAN_HEIGHT` và định nghĩa khung assets xem tại `assets/README.md`.

**Mật độ pixel:**
- **Nhân vật (An, NPC, mèo):** Vẽ chi tiết 1:1, khử răng cưa mềm, xuất đủ canvas. Được thu nhỏ có smoothing khi hiển thị trên canvas. Nền trong suốt.
- **Nền & Screen:** Giữ ảnh gen gốc, vẽ có smoothing khi hiển thị. Không resize bắt buộc; kích thước thật của file đang có là spec.
- **Icon, 9-slice, 3-slice, ui-pixel:** Pixel art 1:1, phóng theo bội số nguyên với `image-rendering: pixelated` (Nearest-Neighbor).

| Thành phần đồ họa | Kích thước lưới gốc (Width × Height) | Ghi chú | Hiển thị |
| :--- | :--- | :--- | :--- |
| **Nhân vật An** | **176 × 416 pixel** | Điểm chân (88, 400), dáng cao 380–392 px, tỷ lệ chibi, sheet 8×11=88 ô | Theo `characterScale(scene, bgH, footY)` |
| **NPC / Mèo** | **176×416 / 128×128** | NPC 4 hướng view-front/left/right/back; mèo cao ~100 px | Theo `characterScale` |
| **Áo & phụ kiện** | **528 × 416 pixel** | Dải 3 ô: front \| side(left) \| back; áo thang xám tô màu gradient-map | Lớp trên An |
| **Bảo tàng (Portrait)** | **128 × 128 pixel** | Avatar hội thoại và Sổ tay nhân vật (thẻ manh mối 64×64) | Theo scale Scene |
| **Icon vật phẩm / phụ kiện** | **48 × 48 pixel** | Túi đồ, manh mối, tủ đồ | Pixel art ×2 lên 96px |
| **Icon UI** | **24 × 24 pixel** | Biểu tượng giao diện | Pixel art ×2–4 |
| **Khung modal/thẻ & Thanh** | **9-slice / 3-slice** | 1 file cho cả ngang lẫn dọc | Khung viền co giãn |
| **Nền & Screen** | **Kích thước thật của file** | Prologue 890×500, chương 1 640×360, screens bản raw | Giữ smoothing, không chuẩn hóa |

---

## 6. Thư Viện Thành Phần Dùng Chung & Đặc Tả Trạng Thái (Component Library)

Tất cả các thành phần tuân theo ngôn ngữ thị giác đồng bộ, thể hiện đủ 5 trạng thái tương tác:

### 6.1. Hệ thống Nút bấm (Buttons)
- **Nút hành động chính (Primary CTA):**
  - *Default:* Nền hồng đậm `#A72D60`, chữ kem sáng `#FFF8EE` (đậm 700), viền 2px tím mận `#2B2035`, bóng cứng 4px màu `#711B40`.
  - *Hover:* Nền chuyển sang `#8D234F`, con trỏ chuột dạng bàn tay (`pointer`).
  - *Pressed:* Nền chuyển sang `#711B40`, toàn bộ mặt nút dịch xuống `2 px`, bóng cứng thu về `2 px`.
  - *Focus:* Viền ngoài xuất hiện khung nét đứt màu vàng ấm `#E9B66B` cách nút 2px.
  - *Disabled:* Nền `#E1D5DC`, chữ `#855064`, không có bóng nổi, con trỏ dạng `not-allowed`.
- **Nút phụ (Secondary Button):**
  - *Default:* Nền kem sáng `#FFF8EE`, chữ tím mận `#2B2035`, viền 2px tím mận `#2B2035`, bóng cứng 4px màu `#2B2035`.
  - *Hover:* Nền hồng phấn `#F4CAD7`.
  - *Pressed:* Nền chuyển sang `#E1D5DC`, dịch xuống 2px.
  - *Disabled:* Nền trong suốt, chữ và viền xám `#855064`.
- **Nút Icon (Icon Button):** Kích thước tối thiểu 44 × 44 px, nền kem giấy `#FFF1DF`, viền 2px `#855064`, icon pixel đặt chính giữa; hiệu ứng bóng cứng 4px.

### 6.2. Khung viền Panel, Hộp thoại & Modal
- **Panel giấy kem (Paper Panel):** Nền kem giấy `#FFF1DF`, viền ngoài 4px tím mận `#2B2035`, viền trong 2px vàng ấm `#E9B66B`, góc cắt bậc 8px, bóng cứng 8px `#2B2035`.
- **Hộp thoại NPC (NPC Dialogue Box):** Nền kem giấy `#FFF1DF`, viền 4px `#2B2035`. Chân dung NPC 128×128 đặt khung nổi bên trái/phải. Tên NPC đặt trên nhãn nền vàng ấm `#E9B66B` viền mận chín. Lời thoại chữ 18/28 px màu `#2B2035`.
- **Cửa sổ Modal:** Áp dụng kỹ thuật 9-slice với khung viền gỗ mộc hoặc hoa sen, nền kem sáng `#FFF8EE`, xuất hiện trên nền backdrop màu `#2B2035` có độ mờ 75%.

### 6.3. Tab danh mục, Thanh tìm kiếm & Ô chọn màu
- **Tab danh mục (Category Tabs):**
  - *Chưa chọn:* Nền kem giấy `#FFF1DF`, viền 2px `#855064`, chữ tím trầm `#74506E`.
  - *Đang chọn (Active):* Nền hồng phấn `#F4CAD7`, viền 2px hồng đậm `#A72D60`, chữ tím mận `#2B2035` (đậm 700), mép dưới liền mạch với panel nội dung.
- **Thanh tìm kiếm (Search Bar):** Chiều cao 44px, nền kem sáng `#FFF8EE`, viền 2px `#855064`, icon kính lúp pixel bên trái, chữ gợi ý (placeholder) màu tím trầm `#74506E`.
- **Ô chọn màu vải (Color Swatches):** Ô vuông pixel 36 × 36 px, viền 2px `#2B2035`. Khi được chọn, bao bọc bởi khung viền kép vàng ấm `#E9B66B` dày 4px kèm chấm tâm tròn.

### 6.4. Thẻ trang phục (Garment Card) với 4 trạng thái
- **Đã sở hữu (Owned):** Nền kem sáng `#FFF8EE`, viền 2px `#855064`, ảnh thumbnail áo 96×96 px, tên áo phía dưới chữ 16px đậm.
- **Đang chọn (Selected):** Nền hồng phấn `#F4CAD7`, viền 4px hồng đậm `#A72D60`, bóng nổi 4px.
- **Đang mặc (Equipped):** Viền 4px vàng ấm `#E9B66B`, góc trên có huy hiệu nền xanh lá `#E4EFDF` chữ xanh `#2E6847`: *"Đang mặc"*.
- **Chưa mở khóa (Locked):** Nền xám tro `#E1D5DC`, ảnh thumbnail bóng đen silhouette, icon ổ khóa đồng kèm số Sen Ngọc hoặc điều kiện hoàn thành chương.

### 6.5. Thẻ manh mối, Thẻ đáp án & Thanh tiến trình
- **Thẻ manh mối (Clue Card):** Nền giấy dó ngả vàng, viền nét đứt chỉ may, góc phải có dấu triện son `#A12B48`, icon vật chứng 48×48 px kèm trích dẫn văn bản cổ.
- **Thẻ đáp án câu đố (Puzzle Option Card):**
  - *Default:* Nền kem sáng, viền 2px tím mận.
  - *Selected:* Nền vàng ấm `#FFF0CB`, viền 3px `#80501C`.
  - *Correct:* Nền ngọc bích `#E4EFDF`, viền 3px `#2E6847`, phát âm thanh chuông ngân.
  - *Incorrect:* Nền đỏ nhạt `#FBE2E6`, viền 3px `#A12B48`, rung lắc nhẹ 200ms.
- **Thanh tiến trình (Progress Bar):** Áp dụng 3-slice, rãnh nền `#E1D5DC` viền 2px `#2B2035`, dải tiến độ màu hồng sen `#D986A7` hoặc vàng ấm `#E9B66B` với các khấc chia pixel rõ rệt.

### 6.6. Huy hiệu chương cốt truyện (Chapter Badge)
- **Đang khám phá (Active):** Nền vàng ấm `#FFF0CB`, viền `#80501C`, nhãn *"Đang khám phá"*, hoạt ảnh cuộn chỉ quay nhẹ.
- **Hoàn thành (Completed):** Nền ngọc bích `#E4EFDF`, viền `#2E6847`, dấu triện son *"Đã giải phóng nếp áo"*.
- **Chưa mở (Locked):** Nền `#E1D5DC`, chữ `#74506E`, icon ổ khóa đồng.
- **Sắp ra mắt (Upcoming):** Nền giấy mờ viền nét đứt, nhãn *"Hồi sau sẽ rõ"*.

### 6.7. HUD điểm thưởng "Sen Ngọc"
- Đặt trên nền tím mận đậm `#2B2035`, góc cắt bậc 4px, icon viên Sen Ngọc hồng lấp lánh bên trái, số dư hiển thị màu vàng ấm `#E9B66B` (font đậm 700), nút "+" nhỏ mở bảng nhiệm vụ/lịch sử.

### 6.8. Thông báo nổi (Toast) & Bảng nhận trang phục
- **Toast thông báo:** Trượt nhẹ từ mép trên/dưới, nền kem sáng `#FFF8EE`, viền 2px `#2B2035`, bóng cứng 4px, kèm icon trạng thái thành công/gợi ý/lỗi.
- **Bảng nhận trang phục mới:** Khung modal lộng lẫy viền hoa sen dát vàng, tia sáng tỏa pixel, nhân vật mặc chiếc áo mới ngay giữa khung, nhãn thưởng `+100 Sen Ngọc`, nút chính *"Mặc thử ngay"*.

### 6.9. Thẻ Lookbook (Lookbook Card)
- Mô phỏng phong cách ảnh Polaroid cổ điển kết hợp khung lụa: Khung viền kem giấy dày 16px, góc dưới có chữ ký số "Tiệm May Nếp", dòng ghi chú thời kỳ lịch sử và nhãn minh bạch *"Ảnh do AI tạo"*.

---

## 7. Áp Dụng Xuyên Suốt & Minh Họa Chi Tiết 3 Màn Đại Diện

Hệ thống nhận diện được ứng dụng nhất quán qua toàn bộ hành trình trải nghiệm:  
**Sảnh chính → Phòng phối đồ → Tủ đồ → Bản đồ chương → Khám phá Làng May → Hội thoại NPC → Sổ manh mối → Câu đố → Ghép khuy áo → Nhận thưởng → Lookbook.**

### 7.1. Màn 1: Sảnh Chính (The Courtyard Hub)
- **Bối cảnh:** Khoảng sân làng Việt cổ kính lúc hoàng hôn vàng ấm, nền gạch đỏ hoa văn tròn trung tâm, ao sen thanh bình bên trái, dãy nhà ngói hai bên, cổng vòm rêu phong dẫn vào Cốt truyện.
- **Bố cục trực quan:**
  - Thanh HUD ghim cố định cạnh trên (logo, Sen Ngọc, cài đặt).
  - 4 lối vào biển gỗ điều hướng hiển thị rành mạch: "Phòng phối đồ" (trái), "Tủ đồ" (phải), "Cốt truyện" (giữa sau), "Bảo tàng" (sát tường trắng bên cổng vòm).
  - Thẻ nổi "Bắt đầu câu chuyện của bạn" đặt trang nhã ở nửa dưới sân với hai nút hành động: *"Tạo nhân vật từ ảnh ▶"* (hồng đậm nổi bật) và *"Dạo quanh sân nhà ▶"* (liên kết phụ).
  - Chú mèo Nếp nằm sưởi nắng cuộn tròn trên thềm gạch cạnh khóm hoa.

### 7.2. Màn 2: Phòng Phối Đồ (The Atelier Studio)
- **Bối cảnh & Bố cục:**
  - *Nửa bên trái:* Bục đứng tròn bằng gỗ lim tôn vinh nhân vật Paperdoll (ma-nơ-canh), dưới chân có bóng đổ mềm, vòng hào quang bụi sao lấp lánh khi đổi áo.
  - *Khay điều khiển bên phải:* Bọc trong khung panel giấy kem viền mận chín, hàng trên là dải sự kiện (Tết, Lễ cưới, Đi lễ chùa...), hàng giữa là khay chọn dáng áo và thanh màu truyền thống, hàng dưới là cụm nút hành động chính.
  - *Góc Lookbook:* Cửa sổ bật lên hiển thị lưới 4 ảnh AI chân thực theo 4 góc nhìn.
- **Avatar mặc định chuẩn xác:**
  - Mái tóc đen dài truyền thống buông nhẹ, cài hai bông hoa trắng thanh nhã bên tai.
  - Diện chiếc **áo dài ngũ thân màu kem lụa dệt điểm xuyết hoa vàng nhạt** thanh khiết.
  - Quần dài lụa đen rủ chạm mu bàn chân và giày tối màu mộc mạc.
- **Nguyên tắc tôn vinh trang phục:** Áo dài và trang phục truyền thống là **tiêu điểm thị giác cao nhất**; toàn bộ khung viền, nhãn chữ hay hoa văn trang trí không bao giờ được che lấp vạt áo, hàng khuy cài hay nếp lụa.

### 7.3. Màn 3: Hội Thoại NPC & Sổ Manh Mối (Dialogue & Clue Archive)
- **Hộp thoại NPC:**
  - Panel giấy kem đặt ở cạnh dưới màn hình, viền cứng 4px màu tím mận.
  - Chân dung NPC pixel 128×128 đặt trang trọng bên góc, ánh nhìn hướng vào lời thoại.
  - Tên NPC đặt trên nhãn nổi màu vàng ấm `#E9B66B`. Lời thoại kích thước 18/28 px tương phản tối đa, phân tách rõ lời kể và lời dặn dò.
- **Sổ manh mối:**
  - Trình bày như một cuốn sổ tay đóng gáy chỉ cổ truyền, các trang giấy dó chia theo từng chương thời kỳ.
  - Thông tin có thứ bậc rõ rệt: Tên hiện vật chứng cứ → Ảnh tư liệu phục dựng → Lời khai nhân chứng → Con dấu triện son xác thực nguồn khảo cứu.

---

## 8. Kỹ Thuật Phóng To Không Làm Mờ Ảnh (Pixel Crisp Rendering)

Khi hiển thị trên trình duyệt hiện đại, để tránh cơ chế làm mờ điểm ảnh (Bilinear Interpolation), bắt buộc áp dụng:

```css
/* Áp dụng cho toàn bộ hình ảnh sprite, canvas và khung pixel art */
.pixel-art {
  image-rendering: pixelated; /* Chuẩn Chrome, Edge, Safari hiện đại */
  image-rendering: -moz-crisp-edges; /* Firefox */
  image-rendering: crisp-edges;
}
```

Trong canvas dựng hình của Studio và Gameplay:
```javascript
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // Tắt hoàn toàn khử răng cưa
```

---

## 9. Quy Tắc Mỹ Thuật Khi Vẽ Mặt Trái Của Cảnh (Cơ Chế Lật Vải)

Cơ chế "Lật vải" (Fabric Flip) là điểm nhấn nghệ thuật độc bản trong phân khu Cốt truyện:
- **Mặt phải (Thế giới thực):** Ánh hoàng hôn ấm áp của sân nhà, gỗ mộc, vải lụa rạng ngời tươi sáng.
- **Mặt trái (Ký ức ẩn giấu):** Chuyển sang tông màu dệt thô mộc mạc gồm xám tro củi tàn (`#4A4A4A`), chàm lạnh ngả xanh đen (`#1A2530`) và sợi đay ố vàng (`#8C826A`).
- **Đường chỉ ràng buộc (Tangle Threads):** Nối từ các góc định kiến làng xã phong kiến, khi có manh mối sẽ phát sáng ánh chỉ tơ vàng (`#F2C94C`) hoặc đỏ son (`#EB5757`).
- **Ngôn ngữ biểu đạt:** Đồ họa giữ phong thái trang nhã, giàu sức gợi của tranh khắc gỗ dân gian Việt Nam, tuyệt đối không vẽ máu me hay gây hoảng sợ.
