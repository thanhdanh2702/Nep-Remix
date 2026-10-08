# Gói prompt AI Studio cho asset UI/áo hero (miễn phí)

> Mục đích: tạo (hoặc làm đẹp lại) 3 nhóm asset bằng **Google AI Studio web**, rồi hậu xử lý cục bộ bằng `scripts/process-ai-asset.py`. Không cần API key, không tốn tiền.
> Cơ sở chi phí: trang giá chính thức https://ai.google.dev/gemini-api/docs/pricing ghi "Google AI Studio usage is free of charge"; còn **Gemini API tạo ảnh không có free tier** (xem `.mcp.json.example` nếu muốn tự động hóa có phí).
> Luật thi: Gemini / Google AI Studio là công cụ AI chính thức, nên mọi asset gen đều đi qua đây và phải **lưu prompt log** (mục 8).

Thứ tự ưu tiên (thay dần, không chặn các phase UI khác):

1. 2-3 áo hero ở khung An 176×416 (view `front`, `left`, `back`).
2. Chân dung NPC 128×128 bản đẹp (thay bản crop từ sprite).
3. (Dropped) Nền dọc Studio 320×480 — screens dùng bản gen gốc hi-res, không cần chuẩn hóa.

## 1. Quy tắc chung cho mọi prompt

- **Nền `#00FF00` phẳng**, một màu, không bóng đổ lên nền, không gradient, không sàn. Gemini không xuất kênh alpha, nên ta tách nền cục bộ (chroma-key). Vì vậy **không dùng màu xanh lá nguyên chất `#00FF00` trên chính chủ thể** (vải men lam `#2D6A5D` thì an toàn).
- **Không chữ, không logo, không chữ ký, không watermark hiển thị.** Chỉ chấp nhận SynthID vô hình do Gemini tự gắn; đừng cố xóa.
- **Ánh sáng từ trên-trái** (design-system §1: Top-Left 45°), bóng cứng đổ xuống dưới-phải, không blur.
- **Bảng màu** (design-system §2.1 và §2.4): củ nâu `#6B4423`, chàm `#1E2A38` / `#2D3E50`, điều `#B83A24`, hoàng yến `#CFA449`, men lam `#2D6A5D`, giấy dó `#F5EFEB`; nền UI kem `#FFF1DF`, tím mận `#2B2035`, hồng sen `#D986A7`, vàng ấm `#E9B66B`.
- **Phong cách:** pixel art 2D sắc cạnh, nhân vật chibi cách điệu (đầu : thân khoảng 1:2.5 đến 1:3), viền cứng, không glassmorphism, không neon, không 3D bóng.
- **Chốt kích thước ảnh gen:** xin ảnh vuông hoặc dọc, chủ thể chiếm ≥ 70% khung, chừa lề nền xanh đều 4 phía để chroma-key không cắt mép.

Khối "negative" dán vào cuối mọi prompt (rút gọn từ lời khuyến cáo chung):

```
Avoid: photorealistic, 3D render, glow, bloom, blur, soft gradient shading, painterly, text, letters, calligraphy, watermark, signature, logo, Chinese qipao, Korean hanbok, Japanese kimono, modern objects, shadows on the background.
```

## 2. Chuẩn bị ảnh tham chiếu (làm một lần)

Mục tiêu: đưa cho Gemini ảnh An (đứng thẳng, nhìn thẳng) để giữ đúng tỷ lệ. Chạy từ thư mục `Nep-Remix` (Pillow đã cài; `artifacts/` đã nằm trong `.gitignore`):

```python
# python - <<'E' ... E  (hoặc lưu thành file tạm ngoài repo)
from pathlib import Path
from PIL import Image
root = Path('.')
out = root / 'artifacts' / 'ai-ref'; out.mkdir(parents=True, exist_ok=True)
layers = ['shadow', 'hair_back', 'outfit_back', 'legs', 'shoes', 'body', 'bottom',
          'outfit_main', 'head', 'face', 'hair_front', 'hands', 'head_accessory']
cell = Image.new('RGBA', (176, 416))  # front idle = ô số 0 (cột 0, hàng 0)
for name in layers:
    cell.alpha_composite(Image.open(root / f'assets/characters/an/{name}.png').convert('RGBA').crop((0, 0, 176, 416)))
bg = Image.new('RGBA', cell.size, '#00FF00'); bg.alpha_composite(cell)
bg.resize((704, 1664), Image.NEAREST).convert('RGB').save(out / 'an-ref-front.png')
```

Ghi chú: ảnh tham chiếu được tạo tạm thời trong thư mục `artifacts/ai-ref/` cho mục đích input của AI Studio, không commit.

Ghi chú: sheet An là 1408×4576 = 8 cột × 11 hàng, ô 176×416, chân neo tại (88, 400). Lớp áo thật là `outfit_main.png`; ở ô front idle, vùng áo chiếm khoảng x 50-139, y 127-377 (cao 250 px). Con số này dùng ở bước hậu xử lý (mục 5).

## 3. Cách dùng AI Studio web (từng bước)

1. Mở https://aistudio.google.com, đăng nhập tài khoản Google của nhóm.
2. Tạo chat mới, chọn **model tạo ảnh Nano Banana (Gemini Flash Image)**. Tên hiển thị có thể đổi theo thời điểm; chọn model có biểu tượng/nhãn "image generation".
3. Đính kèm ảnh tham chiếu (nút "+" hoặc kéo thả), dán prompt, bấm Run.
4. Muốn sửa: nhắn tiếp **từng thay đổi một** ("make the collar narrower", "keep everything else identical"). Đừng viết lại cả prompt.
5. Tải ảnh về (PNG), đặt tên tạm `raw-<id>-<view>.png`, để ngoài `assets/` (ví dụ `artifacts/ai-raw/`). Ảnh thô không commit.
6. Ghi ngay một mục vào **prompt log** (mục 8) trước khi gen tiếp.

## 4. Prompt mẫu

Mỗi prompt có bản tiếng Anh (dán vào model) và phần giải thích tiếng Việt. Thay `{...}` theo từng áo.

### 4.1. Áo hero trên An (kèm ảnh tham chiếu An)

Mục tiêu: **chỉ lớp áo**, cùng tỷ lệ, tư thế đứng thẳng, nền xanh, để ghép vào dải spec An (528×416, ô front).

```
Attached image: pixel-art chibi girl "An" standing, front view, on a flat green background.
Task: redraw ONLY the garment worn on the torso and skirt/pants, as a new outfit: {GARMENT_DESCRIPTION}.
Keep the exact body proportions, pose, scale and the garment's top/bottom position from the attached image.
Do NOT draw the head, hair, hands, legs or shoes: leave them out entirely.
Style: crisp 2D pixel art, hard stepped edges, 1px dark outline #2B2035, flat shading with 3 tonal steps, light from the top-left.
Fabric palette: {FABRIC_COLORS from #6B4423 #1E2A38 #2D3E50 #B83A24 #CFA449 #2D6A5D #F5EFEB}.
Background: perfectly flat solid #00FF00, no shadow, no floor, no gradient, 4-sided margin around the garment.
No text, no logo, no watermark.
Avoid: photorealistic, 3D render, glow, blur, qipao, hanbok, kimono, modern objects.
```

Ví dụ `{GARMENT_DESCRIPTION}` (đối chiếu `assets/garments/<id>/README.md` để lấy mô tả đúng):
- `ao-tu-than`: "Vietnamese four-panel ao tu than, brown bark (#6B4423) fabric, two front panels tied in a knot at the waist showing an indigo inner yem bib, wide loose trousers, long sleeves".
- `ao-dai-lemur`: "1930s Vietnamese modern ao dai Le Mur style, high stand collar, fitted bodice, two long panels to the ankle, side slits to the waist, vermilion (#B83A24) fabric with thin ochre trim".
- `ao-ngu-than-tay-chen`: "Vietnamese five-panel ao ngu than with narrow sleeves, indigo (#2D3E50), ochre (#CFA449) edge piping, cross collar".

Tạo **3 view** bằng cách đính kèm ảnh tham chiếu tương ứng và thêm một dòng: `View: {front | left side | back}, same scale and position as the attached reference.` Ảnh tham chiếu trái/sau lấy từ ô tương ứng của sheet An (cùng cách cắt như mục 2, đổi cột/hàng; xem `an-frames-qa.png` do `npm run audit:assets` sinh ra trong `artifacts/` để chọn ô).

### 4.2. Chân dung NPC 128×128 (kèm `<npc>-ref-front.png`)

```
Attached image: low-resolution pixel-art sprite of the Vietnamese village character "{NPC_NAME_AND_ROLE}".
Task: draw a bust portrait (head and shoulders) of the SAME character, facing slightly toward the viewer, expressive friendly face.
Keep the hairstyle, clothes colors and age from the attached sprite. {EXTRA_TRAITS}
Style: pixel art portrait as in a visual novel dialogue box, hard stepped edges, 1px outline #2B2035, flat shading, light from the top-left, limited palette.
Composition: square, character centered, shoulders cut at the bottom edge, 8% margin on other sides.
Background: perfectly flat solid #00FF00, nothing else.
No text, no logo, no watermark.
Avoid: photorealistic, 3D render, glow, blur, gradients, modern objects.
```

Giải thích: chân dung gốc chỉ có khi NPC được gen lại theo spec An (phần dưới mục 2 ghi chú). Prompt này dùng ảnh tham chiếu từ view-front hoặc ghép từ layer An để vẽ cùng nhân vật chi tiết hơn cho hộp thoại (design-system §6.2) và thẻ manh mối/Sổ tay (thu nhỏ 64×64). Giữ nguyên nhận diện: màu áo, kiểu tóc, tuổi.

### 4.3. Nền dọc Studio 320×480 (Dropped)

```
Vertical 9:16 pixel-art background for a cozy traditional Vietnamese tailor's studio (tiem may), three-quarter perspective.
Elements: wooden shelves with rolled silk bolts (indigo, ochre, vermilion, silk-white), a sewing table with spools, a lotus-pattern lantern, warm paper-cream walls, aged wooden floor.
Light from the top-left, hard pixel shadows, no blur.
Leave the central lower 55% of the image calm and low-detail (a text/card area will be placed on top).
Palette: cream #FFF1DF, plum #2B2035, lotus pink #D986A7, warm gold #E9B66B, brown bark #6B4423.
No text, no characters, no logo, no watermark.
Avoid: photorealistic, 3D render, glow, bloom, blur, qipao, hanbok, kimono, neon.
```

Giải thích: nền **không** dùng chroma-key; script chỉ cắt cover về tỷ lệ 9:16. Vùng giữa-dưới để yên tĩnh theo nguyên tắc phân vùng thị giác (design-system §1) để chữ/thẻ đặt lên vẫn đọc rõ.

## 5. Hậu xử lý bằng `scripts/process-ai-asset.py`

Chỉ cần Pillow (numpy tùy chọn). Từ thư mục `Nep-Remix`:

```bash
# Áo hero: lớp áo ở ô An 176x416, khớp vùng outfit_main (cao 250, gấu áo ở y=377)
python scripts/process-ai-asset.py --in artifacts/ai-raw/raw-ao-tu-than-front.png \
  --out assets/garments/ao-tu-than/ao-tu-than--an-front.png \
  --kind garment-an --target-h 250 --anchor-y 377

# Chân dung NPC 128x128 (pixel: median-cell + quantize palette + alpha cứng)
python scripts/process-ai-asset.py --in artifacts/ai-raw/raw-ba-mai-portrait.png \
  --out assets/characters/ba-mai/portrait.png --kind portrait

# (Dropped) Nền dọc — screens dùng bản gen gốc hi-res

# Thử trước, không ghi file
python scripts/process-ai-asset.py --in raw.png --out x.png --kind icon --dry-run

npm run audit:assets   # cập nhật data/runtime-assets.json
```

Quy ước đầu ra:
- `garment-an`: giữ hi-res (không quantize), alpha chỉ 0/255, viền xanh bị despill và erode 1px (`--erode`). Mặc định của script là `--target-h 400 --anchor-y 400` (hợp với ảnh cả hình người); với lớp áo luôn truyền `--target-h 250 --anchor-y 377`.
- `portrait` / `icon`: downscale theo median-cell (cần numpy, nếu không có thì dùng trung bình ô), tối đa `--colors` (mặc định 24, ≤ 32) màu, màu gần bảng palette (≤ `--snap`, mặc định 40) được kéo về palette design-system §2.1 + §2.4; đổi bảng bằng `--palette 2B2035,FFF1DF,...`.
- Kiểm tra nhanh sau khi chạy: dán lớp mới lên An (ô front) và so với `outfit_main`. Lệch thì chỉnh `--anchor-y` / `--target-h` hoặc nhờ họa sĩ chỉnh tay trong Aseprite. Lệnh script không tự đưa asset vào game; renderer chỉ dùng layer `--an-<view>` khi phase tích hợp bật.

## 6. Đặt tên file

| Asset | Đường dẫn |
| :--- | :--- |
| Áo hero trên An | `assets/garments/<id>/<id>--an-<view>.png`, `<view>` ∈ {`front`, `left`, `back`} *(ví dụ: path pattern cho ao-tu-than)* |
| Chân dung NPC | `assets/characters/<npc-id>/portrait.png` |
| Nền dọc | `assets/areas/<tên>-vertical.png` |
| Ảnh thô (không commit) | `artifacts/ai-raw/raw-<id>-<view>.png` |

`<id>` dùng đúng id trong `assets/garments/` (`ao-tu-than`, `ao-dai-lemur`, ...) hoặc `assets/characters/` (`ba-mai`, `cat-nep`, ...). Tên chữ thường, gạch ngang, không dấu.

## 7. Checklist văn hóa (bắt buộc trước khi dùng ảnh)

Nguồn: `docs/04-culture/README.md`, design-system §1 và §2.4. Lưu ý: `docs/04-culture/` trong `Nep-Remix` hiện có README.md; các tài liệu con (phân loại phom dáng, màu sắc và nghi lễ, hướng dẫn phân biệt) hiện chưa hoàn thành *(dự kiến)*; hãy dựa vào design-system và README khi triển khai.

- [ ] Phom đúng loại: áo tứ thân, ngũ thân tay chẽn, tấc tay thụng, tân thời Lemur, cổ đứng không vai bồng (cuối 1930s), đúng tên trong mô tả `assets/garments/<id>/README.md`.
- [ ] Không lai sườn xám (qipao), hanbok, kimono, hanfu; cổ áo, nẹp, khuy, tà áo là của người Kinh.
- [ ] Màu vải thuộc bảng truyền thống design-system §2.4 (hoặc biến thể có nguồn). Màu điều/son (`#B83A24`) là màu cưới hỏi, lễ hội.
- [ ] Không có chữ đọc được, nhãn hiệu thật, tên cửa hiệu thật, nhân vật chính trị, cờ, khẩu hiệu.
- [ ] Không có chi tiết hiện đại lạc thời (khóa kéo, nhãn mác, vải in kỹ thuật số) trong bối cảnh cổ.
- [ ] Hoa văn, họa tiết là Việt (ví dụ sen, trúc, cúc): không tự "bịa" ý nghĩa; nếu nêu ý nghĩa thì có nguồn trong thẻ Bảo tàng.
- [ ] Người duyệt (ít nhất 1 thành viên đọc phần văn hóa) ký tên vào prompt log.

## 8. Prompt log (nộp BTC nếu được yêu cầu)

Mỗi lần gen thành công một asset được dùng trong game, **chép một mục** theo mẫu dưới đây vào phần "Nhật ký" cuối file này (hoặc file log riêng của nhóm), kèm ảnh chụp màn hình khung chat AI Studio (có tên model và prompt) lưu ngoài `assets/`.

```markdown
### <YYYY-MM-DD HH:mm> - <asset id>
- Công cụ: Google AI Studio (web) - model: <tên model hiển thị>
- Người gen / người duyệt văn hóa: <tên> / <tên>
- Ảnh tham chiếu: <file, vd. artifacts/ai-ref/an-ref-front.png>
- Prompt đầy đủ (nguyên văn, gồm các lượt sửa):
  1. <prompt>
  2. <lượt sửa>
- File thô: artifacts/ai-raw/<file>
- Lệnh hậu xử lý: python scripts/process-ai-asset.py <tham số>
- File cuối: assets/<đường dẫn>
- Chỉnh tay (nếu có): <Aseprite: ...>
```

### Nhật ký

_(chưa có mục nào)_

## 9. Muốn tự động hóa? (có phí)

`.mcp.json.example` có 2 MCP server tạo ảnh bằng Gemini API (`nanobanana-mcp-server@0.4.6` qua `uvx`, `pixelforge-mcp@0.2.0` qua `npx`). Cả hai cần `GEMINI_API_KEY` **bật billing**, không có free tier cho tạo ảnh. Không commit key; đặt key vào biến môi trường shell. Nếu dùng, vẫn chạy `scripts/process-ai-asset.py` và ghi prompt log như trên.
