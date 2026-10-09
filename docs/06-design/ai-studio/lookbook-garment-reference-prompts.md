# Prompt gen 10 ảnh tham chiếu áo cho Lookbook

## Mục đích

Lookbook "Ảnh của tôi" đưa kèm một ảnh sản phẩm của chiếc áo dài vào mỗi lần gọi Gemini, để model vẽ đúng kiểu cổ, cách cài khuy và phần dưới. Ảnh tham chiếu là ảnh sản phẩm chụp trên ma-nơ-canh vô hình (ghost mannequin), không có người và không có chữ. Thiếu ảnh nào thì server mô tả áo đó bằng chữ, không bị chặn.

Mô tả áo trong từng prompt chép nguyên văn từ `promptEn` trong `src/content/lookbook-style.json`. Sửa `promptEn` thì sửa luôn khối prompt ở đây; `npx tsx scripts/check-lookbook-content.ts` báo lệch.

## Cách chạy

1. Mở AI Studio, chọn Chat với model tạo ảnh.
2. Dán từng khối prompt bên dưới, mỗi áo một lượt. Mỗi áo chạy trong một cuộc chat mới để ảnh trước không ảnh hưởng ảnh sau.
3. Kiểm từng ảnh trước khi lưu:
   - Không có người, không có chữ, không có logo.
   - Đúng kiểu cổ, tay áo và độ dài của áo trong prompt.
   - Khuy nhỏ chạy từ cổ qua vai phải xuống đường sườn phải (kiểu cài của người Việt). Áo tứ thân không có khuy, vạt trước buộc ở eo.
   - Có quần hoặc váy lộ ra bên dưới. Nếu sai thì chạy lại.
4. Lưu ảnh thành JPEG theo quy cách dưới đây.

## Quy cách lưu

- Đường dẫn: `public/lookbook-ref/<id>.jpg`, với `<id>` là id áo ghi ở mỗi khối.
- JPEG, tối đa 300KB mỗi ảnh, tỉ lệ 3:4, khoảng 768×1024.
- Vite copy thư mục `public` vào bản build, nên không cần sửa Dockerfile.
- Commit ảnh riêng với code: `feat(lookbook): add garment reference photos`.

## 10 prompt

### Áo tứ thân

Lưu thành `public/lookbook-ref/ao-tu-than.jpg`. Màu chính #8B5A2B, màu phụ #2C1608 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A traditional northern Vietnamese four-panel áo tứ thân dress with an open neckline that shows an inner silk halter (yếm) and long sleeves. The two front panels hang open and are knotted together at the waist with a silk sash, so the knot alone closes the front. It falls to the knee over a long, full, dark skirt. Fabric color saddle brown with espresso brown accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo ngũ thân tay chẽn

Lưu thành `public/lookbook-ref/ao-ngu-than-tay-chen.jpg`. Màu chính #C25975, màu phụ #3A0D1B (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A traditional Vietnamese five-panel áo ngũ thân with a low standing collar and narrow, fitted sleeves. Small round cloth buttons run from the collar across the right shoulder and down the right side seam (Vietnamese side fastening). The panels fall below the knee over loose silk trousers. Fabric color rose pink with dark wine accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo tấc tay thụng

Lưu thành `public/lookbook-ref/ao-ngu-than-tay-thung.jpg`. Màu chính #C49B18, màu phụ #382B02 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A ceremonial Vietnamese five-panel robe (áo tấc) with a low standing collar and very wide, flowing sleeves. Cloth buttons run along the right shoulder and the right side seam (Vietnamese side fastening). The robe reaches the ankles over loose silk trousers. Fabric color dark gold with very dark olive brown accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo dài Lemur 1934

Lưu thành `public/lookbook-ref/ao-dai-lemur.jpg`. Màu chính #FB6F92, màu phụ #5E0E27 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A 1930s reformed Vietnamese áo dài with a scalloped lotus-leaf collar, softly puffed shoulders and a fitted waist. It closes with Vietnamese side fastening along the right shoulder and side seam. Long front and back panels fall over loose silk trousers. Fabric color bright pink with burgundy accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo dài tân thời cổ đứng

Lưu thành `public/lookbook-ref/ao-dai-tan-thoi-vang-mo-ga.jpg`. Màu chính #E9D8A6, màu phụ #3D3315 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A late-1930s fitted Vietnamese áo dài with a standing collar and plain, smooth shoulders above slim sleeves. Small snap buttons run from the collar along the right shoulder and down the right side seam (Vietnamese side fastening). Long front and back panels fall over loose silk trousers. Fabric color sand beige with dark khaki brown accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo dài tay raglan 1960

Lưu thành `public/lookbook-ref/ao-dai-raglan.jpg`. Màu chính #457B9D, màu phụ #0D1B2A (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A 1960s fitted Vietnamese áo dài with a standing collar and raglan sleeves seamed diagonally from the collar to the underarm. Snap buttons run from the collar along the right raglan seam and down the right side seam (Vietnamese side fastening). Long panels with high side slits fall over loose silk trousers. Fabric color steel blue with midnight navy accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo dài cổ thuyền

Lưu thành `public/lookbook-ref/ao-dai-co-thuyen.jpg`. Màu chính #00B4D8, màu phụ #03045E (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A 1960s fitted Vietnamese áo dài with a wide boat neckline that sits across the collarbones and shows the neck and shoulders. Snap buttons run down the right side seam (Vietnamese side fastening). The fitted bodice flows into long front and back panels over loose silk trousers. Fabric color bright cyan blue with navy blue accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo dài cưới vải phin 1982

Lưu thành `public/lookbook-ref/ao-dai-cuoi-phin.jpg`. Màu chính #F0EFEB, màu phụ #8D8175 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A simple 1980s Vietnamese wedding áo dài in cotton poplin with a standing collar and small embroidered peach-blossom sprigs on the chest. It closes with Vietnamese side fastening along the right shoulder and side seam. Long panels fall over loose silk trousers. Fabric color off white with taupe grey accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo dài popolin hoa cúc

Lưu thành `public/lookbook-ref/ao-dai-popolin.jpg`. Màu chính #CCD5AE, màu phụ #606C38 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A 1980s Vietnamese áo dài in poplin with a standing collar and a small chrysanthemum print scattered over the fabric. It closes with Vietnamese side fastening along the right shoulder and side seam. Long panels fall over loose silk trousers. Fabric color sage green with olive green accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

### Áo ngũ thân Remix 2026

Lưu thành `public/lookbook-ref/ao-ngu-than-remix-2026.jpg`. Màu chính #EF476F, màu phụ #118AB2 (lấy từ `defaultColorPalette`).

```text
Product photograph of a single Vietnamese áo dài displayed on an invisible mannequin (ghost mannequin), front view, full length including the lower garment. A modern Vietnamese five-panel áo dài, a 2026 remix of the áo ngũ thân, with a low standing collar, narrow fitted sleeves and color-blocked panels. Cloth buttons run along the right shoulder and side seam (Vietnamese side fastening). The panels fall below the knee over loose trousers. Fabric color coral pink with ocean blue accents. Even soft daylight, plain warm off-white background, sharp fabric texture and seams, no person, no text. Aspect ratio 3:4.
```

## Kiểm tra sau khi lưu đủ ảnh

Chạy `ls public/lookbook-ref` và đếm đủ 10 file `.jpg`, tên khớp id áo.
