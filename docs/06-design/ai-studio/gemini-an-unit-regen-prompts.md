# Gói prompt gen lại asset nhân vật theo đơn vị An (176×416)

**Mục tiêu:** Gen lại ~79 ảnh nhân vật, áo dài và phụ kiện theo spec An (khung 176×416, điểm chân 88,400). Dùng Google AI Studio hoặc script Gemini với Structured Output (nếu có API key có billing). *(Lịch sử: bộ 64×96 cũ được thay thế bằng đơn vị An tại quyết định #32, 05/10/2026)*

**Khối negative chung** (dán cuối mọi prompt):

```
Avoid: photorealistic, 3D render, glow, bloom, blur, soft gradient shading, painterly, text, letters, calligraphy, watermark, signature, logo, Chinese qipao, Korean hanbok, Japanese kimono, modern objects, shadows on the background.
```

**Ánh sáng & phong cách:** Trên-trái 45°, pixel art 2D sắc nét, viền cứng, bóng cứng, không glassmorphism. Nền `#FF00FF` (magenta) phẳng để chroma-key, chừa lề 8px đều 4 phía.

---

## A. NPC 4 hướng (16 ảnh)

Mỗi nhân vật gen 4 view: `view-front`, `view-left`, `view-right`, `view-back`.

### A1. Mèo Nếp (cat-nep)

**Khung:** 128×128 pixel, mèo cao ~100 px. Giữ đặc điểm: mèo trí nhất, biểu cảm vui vẻ.

**Tham chiếu:** Ảnh ghép từ sheet An nếu có, hoặc ảnh QA. Không có sprite cũ để tham chiếu.

**Prompt (4 view):**

```
Pixel-art Vietnamese cat character "Mèo Nếp", cute and playful expression, sitting or standing in a calm pose.
Keep the cat's personality: intelligent, curious, mischievous.
Canvas: 128×128 pixel, cat ~100px tall.
View: {front | left side | right side | back}
Style: pixel art 2D, hard edges, 1px outline #2B2035, flat shading 3–4 tones, light from top-left.
Palette: warm earth tones for fur (#A68058 #8B6F47), eyes bright #1E2A38, optional pink nose.
Background: flat solid #FF00FF, no shadow, no floor, 8px margin.
{NEGATIVE BLOCK}
```

**Hậu xử lý:** Tách nền magenta, căn theo bounding box mèo, kiểm tra kích thước. Lưu 4 file `cat-nep/view-{front,left,right,back}.png`.

---

### A2. Ông Lệ (ong-le) — dạng bóng mờ

**Khung:** 176×416 pixel, dáng cao 380–392 px (chibi như An).

**Ghi chú:** Ông Lệ là vị vua cũ trong truyền thuyết, xuất hiện dạng bóng mờ/ma quái. Giữ đặc điểm: cao, mảnh dạo, quần áo cổ hoàng đế (áo vàng, quần đỏ hoặc chàm).

**Tham chiếu:** Ảnh An front để giữ tỷ lệ chibi, thay khuôn mặt, tóc, thân hình.

**Prompt (4 view):**

```
Pixel-art Vietnamese ghostly figure "Ông Lệ", ancient royal spirit, ethereal and mysterious.
Shape: tall slender man, chibi-style proportions (head ~1/3 height), wearing ancient royal garments (golden yellow ao, crimson or indigo pants), translucent/faded appearance suggesting a ghost.
Canvas: 176×416 pixel, figure feet at y=400, total figure height 380–392 px.
View: {front facing | left side | right side | back}
Style: pixel art 2D, hard edges, 1px outline #2B2035 semi-transparent, flat shading 3–4 tones with faded/dithered effect, light from top-left.
Fabric colors: golden yellow #CFA449, indigo #1E2A38 or #2D3E50 for pants, charcoal #2B2035 for details.
Background: flat solid #FF00FF, no shadow, no floor, 8px margin.
Feet anchor: (88, 400) = center-x at 88, soles at y=400. Keep composition within frame.
{NEGATIVE BLOCK}
```

**Hậu xử lý:** Tách nền, căn chân y=400, kiểm tra dáng cao 380–392 px. Lưu 4 file.

---

### A3. Cú Cảm (cu-cam)

**Khung:** 176×416 pixel, dáng cao 380–392 px.

**Ghi chú:** Phụ nữ trung niên, nhân vật bán hàng khô cá ở chợ, quần áo thường ngày (áo yếm hoặc áo tứ thân màu chàm/nâu, khăn quấn đầu).

**Tham chiếu:** Sheet An hoặc ảnh QA.

**Prompt (4 view):**

```
Pixel-art Vietnamese middle-aged woman "Cú Cảm", friendly market vendor selling dried fish, wearing everyday garments.
Build: sturdy, warm expression, headscarf wrapped around head.
Garments: indigo (#1E2A38) or brown bark (#6B4423) ao tu than or simple ao yem, cotton headscarf.
Canvas: 176×416 pixel, figure feet at y=400, height 380–392 px.
View: {front | left | right | back}
Style: pixel art 2D, hard edges, 1px outline #2B2035, flat shading 3–4 tones, light from top-left.
Background: flat solid #FF00FF, 8px margin.
Feet anchor: (88, 400).
{NEGATIVE BLOCK}
```

**Hậu xử lý:** Tách nền, căn chân, kiểm tra dáng. Lưu 4 file.

---

### A4. Trương Tóc Búi (truong-toc-bui) × 4 view

**Khung:** 176×416 pixel, dáng cao 380–392 px.

**Ghi chú:** Phụ nữ trẻ, kiểu tóc búi đặc trưng, mặc áo dài truyền thống (áo dài trắng hoặc áo ngũ thân xanh chàm), tính cách vui vẻ.

**Tham chiếu:** Sheet An.

**Prompt (4 view):**

```
Pixel-art Vietnamese young woman "Trương Tóc Búi", cheerful personality, distinctive bun hairstyle, wearing traditional ao dai.
Garment: ao dai or ao ngu than in indigo (#1E2A38) or white, side slits, long sleeves, elegant posture.
Canvas: 176×416 pixel, feet at y=400, height 380–392 px.
View: {front | left side | right side | back}
Style: pixel art 2D, hard edges, 1px outline #2B2035, flat shading 3–4 tones, light from top-left.
Hair: bun wrapped tightly, small decorative pin or flower.
Background: flat solid #FF00FF, 8px margin.
Feet anchor: (88, 400).
{NEGATIVE BLOCK}
```

**Hậu xử lý:** Tách nền, căn chân, kiểm tra. Lưu 4 file.

---

## B. NPC chỉ mặt trước (3 ảnh)

### B1–B3. Cú Loan, Bà Mai, Mẹ Phương — mỗi nhân vật 1 ảnh `view-front`

**Khung:** 176×416 pixel, dáng cao 380–392 px.

Dùng prompt tương tự A nhưng chỉ với `View: front` duy nhất. Ví dụ:

**Cú Loan** (cụ Loan, bà ngoại của An):

```
Pixel-art Vietnamese elderly woman "Cú Loan" (grandmother), kind expression, wearing traditional ao dai or ao tu than in indigo/cream colors, age ~100+ (very elderly).
Canvas: 176×416 pixel, feet at y=400, height 380–392 px.
View: front, standing upright, facing forward.
Style: pixel art 2D, hard edges, 1px outline #2B2035, flat shading, light from top-left.
Details: gray or white hair styled simply, weathered hands, serene face.
Background: flat solid #FF00FF, 8px margin.
Feet anchor: (88, 400).
{NEGATIVE BLOCK}
```

**Bà Mai** (bà Mai, người chị em):

```
Pixel-art Vietnamese middle-aged woman "Bà Mai", maternal warmth, wearing simple everyday garments (brown bark #6B4423 or indigo #1E2A38 ao), headscarf optional.
Canvas: 176×416 pixel, feet at y=400, height 380–392 px.
View: front, standing, warm smile.
{... style/background như Cú Loan ...}
```

**Mẹ Phương** (mẹ của Phương, đã mất):

```
Pixel-art Vietnamese woman "Mẹ Phương", mature and dignified, wearing refined ao dai or ao tu than in indigo/ochre tones (#2D3E50 #CFA449).
Canvas: 176×416 pixel, feet at y=400, height 380–392 px.
View: front, poised posture.
{... style/background ...}
```

**Hậu xử lý:** Mỗi nhân vật 1 file theo format `<id>/view-front.png`.

---

## C. Garment layer (10 áo × 3 view = 30 ảnh)

**Spec chung:** Dải 528×416 pixel gồm 3 ô vuông lần lượt: ô 0 (x 0–175) front, ô 1 (x 176–351) side-left, ô 2 (x 352–527) back. Mỗi ô 176×416.

**Tô màu:** Áo vẽ thang xám **chỉ 4 giá trị xám calibrated** theo sáng: tối nhất `#212121`, `#616161`, `#9E9E9E`, sáng nhất `#E0E0E0`. Game dùng gradient-map 4 màu từ palette để tô. Giữ alpha (trong suốt).

**Prompt chung (thay `{...}` theo từng áo):**

```
Pixel-art grayscale garment layer for Vietnamese woman's traditional outfit, professional wardrobe asset.
Garment: {GARMENT_DESCRIPTION from assets/garments/<id>/README.md}
Style: Only the garment itself (ao/áo), NO body, head, hands, legs, or shoes. Flat 3-dimensional anatomy fitted on an invisible figure torso.
Color: Grayscale only. Use exactly 4 tonal levels: #212121 (darkest), #616161, #9E9E9E, #E0E0E0 (lightest). Map these to 4 primary colors in post-processing (gradient-map).
Canvas: 528×416 pixel total. Three side-by-side views:
  - Left 176×416: front view (facing viewer)
  - Center 176×416: left side view (facing right, character's left)
  - Right 176×416: back view (facing away)
Each cell: 176×416, no gutter. Feet line at y=400 (invisible reference).
Anatomy: fitted on invisible figure with body centered at x=88, feet at (88,400). Garment height from shoulder to hem typically 250–280 px.
Fabric shading: light from top-left 45°, hard shadows. No smoothing, no gradients, no dithering. Crisp pixel edges only.
Style: pixel art 2D, hard edges, no outline (outline handled in game). Flat shading 3–4 tones. No metallic sheen, no transparency gradients.
Background: flat solid #FF00FF per cell, no shadow, no floor, 8px margin inside each cell.
{NEGATIVE BLOCK}
```

**10 áo cần gen (từ `assets/garments/*/README.md`):**

1. `ao-tu-than` — áo tứ thân 4 vạt, khuy đắp, tay dài, dáng thẳng. Màu: nâu, chàm.
2. `ao-ngu-than-remix-2026` — áo ngũ thân cải biên, tay dài hoặc tay ngắn, hoạ tiết lạc.
3. `ao-ngu-than-tay-chen` — áo ngũ thân tay chèn, cổ chữ nhật, tay hẹp.
4. `ao-ngu-than-tay-thung` — áo ngũ thân tay thùng, tay rộng, nút cài.
5. `ao-dai-co-thuyen` — áo dài cổ thuyền, cổ ngang rộng, tay dài, sát nách.
6. `ao-dai-cuoi-phin` — áo dài cưới Phin (Pháp), kẻ sọc, tay bánh mì (puffed), cổ V.
7. `ao-dai-lemur` — áo dài Le Mur (1930s), cổ đứng cao, tay dài tạp chí, hai vạt dài.
8. `ao-dai-popolin` — áo dài Popoline, chất liệu bóng, tay dài, sát thân, chi tiết tối giản.
9. `ao-dai-raglan` — áo dài tay Raglan, tay từ cổ, xem thử tương xứng với cơ thể chibi.
10. `ao-dai-tan-thoi-vang-mo-ga` — áo dài tân thời cổ đứng, cổ nhọn (không vai bồng), chất lâu năm 1930s–40s.

**Hậu xử lý:** Tách 3 ô từ dải 528×416, cắt padding từng ô, kiểm tra kích thước mỗi ô 176×416, lưu dành một file tổng `<id>/<id>.png` kích thước 528×416 (ba ô ghép liên tiếp: front | side-left | back). Script `audit-assets.py` kiểm tra xám calibrated 4 tones và alpha.

---

## D. Accessory layer (10 phụ kiện × 3 view = 30 ảnh)

**Spec:** Dải 528×416 với 3 ô, cùng cấu trúc garment layer. Phụ kiện: khăn, mũ, kính, chân công, vòng tay, hoa cài…

**Vật phẩm 10 phụ kiện (từ `assets/accessories/*/README.md`):**

1. `guoc-moc` — guốc gỗ, đế cao, hai quai vải.
2. `hai-theu` — hài thêu, thêu kín, cổ cao.
3. `khan-mo-qua` — khăn mỏ quạ, khăn linen rủ xuống vai, gắn tay.
4. `khan-van-den` — khăn văn đen, khăn vải nhuộm chàm, quàng cổ hoặc buộc tóc.
5. `khan-van-hoang-yen` — khăn vải hoàng yến (vàng đồng), hoàn thiện trang phục cưới.
6. `kieng-bac` — kiếng bạc, khung bạc, mắt kính tròn vintage.
7. `kinh-mat-meo` — kính mắt mèo, viền nâu, mắt lẹo vintage 1950s.
8. `non-la` — nón lá, nón chỏm nón lá Việt truyền thống, vành rộng.
9. `non-quai-thao` — nón quai thao, nón xưởng may, quai dây vải, vai dáng chop.
10. `quat-lua` — quạt lửa, quạt tre tay cỡ nhỏ, hoạ tiết truyền thống, trong tay.

**Prompt (tương tự garment):**

```
Pixel-art grayscale accessory layer, Vietnamese traditional fashion item, rendered in 4-tone grayscale.
Item: {ACCESSORY_DESCRIPTION}
Canvas: 528×416 pixel, 3 views (front | left side | back), 176×416 each. Feet line y=400 (reference).
Only the accessory, no body. Positioned as worn/held: shoes on feet, hat on head, scarf around neck/shoulders, glasses on face (invisible anatomy). Placement height/x-position must align with invisible figure (feet at y=400, center at x=88).
Color: Grayscale exactly 4 tones: #212121, #616161, #9E9E9E, #E0E0E0.
Style: pixel art 2D, hard edges, 1px outline, flat shading 3–4 tones, top-left light.
Background: flat #FF00FF, 8px margin per cell.
{NEGATIVE BLOCK}
```

**Hậu xử lý:** Mỗi phụ kiện 3 file `<id>/view-{front,left,back}.png`.

---

## E. Tổng kế hoạch & kiểm tra

**Danh sách gen (79 ảnh):**
- NPC: 4 hướng × 4 (cat-nep, ong-le, cu-cam, truong-toc-bui) = 16 ảnh
- NPC front-only: 3 × 1 (cu-loan, ba-mai, me-phuong) = 3 ảnh
- Garment: 10 × 3 view = 30 ảnh
- Accessory: 10 × 3 view = 30 ảnh
- **Tổng: 79 ảnh**

**Kiểm tra hậu kỳ (script `scripts/audit-assets.py`):**

1. Kích thước: NPC 176×416 hoặc 128×128; Garment/Accessory 528×416 (hoặc 176×416 từng ô).
2. Chân y=400 (NPC, garment, accessory): căn offset từ bounding box.
3. Xám (garment/accessory): chỉ 4 giá trị `#212121`, `#616161`, `#9E9E9E`, `#E0E0E0`; hoặc khung độ sáng 10–240 (bỏ qua NPC chỉ dùng nhiều màu).
4. Alpha: giữ nguyên (không tách alpha).
5. Không watermark, không chữ, không logo.

**Lưu prompt log:** Mỗi ảnh ghi tại tệp README của từng asset (ví dụ `assets/characters/<id>/README.md` hoặc `assets/garments/<id>/README.md` nếu có mục "AI Prompt"), hoặc tệp prompt log tập trung *(dự kiến)*:
- Model & version (ví dụ `Gemini Flash Image`)
- Prompt đầy đủ (hoặc liên kết)
- Timestamp gen
- Tổng thay đổi mất bao lâu

---

## F. Fallback & chước chờ art

Khi chưa có asset mới (bộ 64×96 cũ đã bị xóa, không có fallback cũ):
- **NPC:** Không vẽ trong phòng hoặc bản đồ. Ở hộp thoại/Sổ tay: hiển thị lotus emblem với background nữa của chân dung. Đối với bản đồ journey: ô NPC trống hoặc hiện emblem nhỏ.
- **Garment:** An mặc outfit gốc (không dùng áo từ layer mới). Ở tủ đồ: hiển thị icon 48×48 (hoặc gợi ý "chờ art").
- **Accessory:** Không vẽ (hoặc hiển thị icon silhouette 48×48).

Cờ fallback trong code giữ nguyên để chỉ hiển thị các thành phần sẵn có khi bộ gen lại chưa đủ.

---

## G. Công cụ & phạm vi

- **Gen:** Google AI Studio (`aistudio.google.com`) hoặc script Gemini tự động (nếu có API key billing).
- **Hậu xử lý:** `scripts/process-ai-asset.py` (chroma-key, resize, crop frame) + `scripts/audit-assets.py` (kiểm tra kích thước, xám, alpha).
- **Không gen lại:** NPC chương 2–5 (chưa chơi được), background, screen, icon UI, 9-slice.
- **Lưu:** Không commit ảnh thô; commit metadata/manifest sau khi gen xong và kiểm tra xong.
