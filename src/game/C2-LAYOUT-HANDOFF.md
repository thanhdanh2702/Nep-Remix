# Bàn Giao Tọa Độ & Layout C2 (Frontend → Core / Leader)

- **Ngày lập:** 07/10/2026
- **Người lập:** Frontend Owner (`agent/frontend`)
- **Mục tiêu:** Cung cấp bảng tọa độ chuẩn hóa, vùng bấm mở rộng (accessibility >= 44px), điểm xuất hiện (spawn), lối thoát (exits), và thông số NPC/sàn cho Chương 2 “Tiếng Kéo Đêm Phố Cũ” (Hà Nội 1935).
- **Quy chuẩn nguồn:** Nền A native kích thước **1672 × 941**, căn cứ theo `assets/areas/chapter-2/manifest.json`.
- **Ranh giới sở hữu:** Core áp dụng các thông số này vào `src/content/chapters/c2.json`. Frontend **không** tự sửa file JSON của Core.

---

## 1. Nguyên Tắc Đo Đạc & Phân Định Tọa Độ

1. **Native Pixel Bounds `[x1, y1, x2, y2]`**: Tọa độ góc trên-trái và góc dưới-phải của pixel thực tế trên canvas 1672×941 (lấy trực tiếp từ manifest).
2. **Normalized Center `pos = { x, y }`**: Điểm trung tâm chuẩn hóa trong khoảng $[0, 1]$:
   $$x = \frac{x_1 + x_2}{2 \times 1672}, \quad y = \frac{y_1 + y_2}{2 \times 941}$$
3. **Visual Bounds `rect_{vis}`**: Hình chữ nhật bao khít phần nhìn thấy được của đối tượng:
   $$x = \frac{x_1}{1672}, \quad y = \frac{y_1}{941}, \quad w = \frac{x_2 - x_1}{1672}, \quad h = \frac{y_2 - y_1}{941}$$
4. **Clickable Rect `rect`**: Vùng bấm tương tác được mở rộng nhằm đảm bảo kích thước tối thiểu đạt chuẩn tiếp cận **44 × 44 CSS px** trên mobile (390×844 và 844×390), đồng thời tránh chồng lấn vào các vật thể lân cận hoặc lối thoát.
5. **Radius `radius`**: Bán kính tương tác chuẩn hóa dùng cho lệnh `interact` của Core engine. Mặc định là `0.08` (tương đương ~134px trên nền 1672px).
6. **Mặt tương tác (`side`)**: Toàn bộ tương tác C2 bắt buộc đặt tại mặt **`phai`** (`mat_phai`), không dùng `trai` hoặc `latVai`.

---

## 2. Bảng Tọa Độ Chi Tiết Ba Phòng C2

### Phòng S1: `c2-s1-gac-lung-ve-tranh` (Căn gác lửng vẽ tranh phố Hàng Đào)
- **Kích thước gốc:** `1672 × 941`, tỉ lệ `16:9` (gần 8:5)
- **Sàn đi bộ (`c2` floor):** `floorTop = 0.58` (546 px), `floorBottom = 0.92` (866 px). Vùng An đi lại an toàn: $y \in [0.60, 0.90]$.
- **Spawn An:** `{ x: 0.25, y: 0.75 }` (sàn phòng bên trái, gần giá vẽ).

| Tên đối tượng / Tác vụ | Content ID | Asset Path | Native Bounds `[x1, y1, x2, y2]` | Pos `{ x, y }` | Clickable Rect `{ x, y, w, h }` | Radius | Ghi chú vị trí & Tiếp cận |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mảnh bản vẽ 1** (dưới bàn) | `hitbox-drawing-desk` (item: `manh_ban_ve_ao_dai_1`) | `c2-s1-gac-lung-ve-tranh--manh-1.png` | `[619, 425, 652, 457]` | `{ x: 0.380, y: 0.469 }` | `{ x: 0.35, y: 0.43, w: 0.06, h: 0.08 }` | `0.08` | Dưới chân bàn vẽ, phía trên sàn; mở rộng 6%×8% đủ 44px. |
| **Mảnh bản vẽ 2** (trong giỏ) | `hitbox-fabric-basket` (item: `manh_ban_ve_ao_dai_2`) | `c2-s1-gac-lung-ve-tranh--manh-2.png` | `[998, 522, 1029, 559]` | `{ x: 0.606, y: 0.574 }` | `{ x: 0.58, y: 0.53, w: 0.06, h: 0.09 }` | `0.08` | Nằm trong giỏ vải trên sàn; tách xa bàn vẽ và cửa sổ. |
| **Mảnh bản vẽ 3** (dưới đèn) | `hitbox-gas-lamp` (item: `manh_ban_ve_ao_dai_3`) | `c2-s1-gac-lung-ve-tranh--manh-3.png` | `[136, 410, 166, 444]` | `{ x: 0.090, y: 0.454 }` | `{ x: 0.06, y: 0.41, w: 0.06, h: 0.09 }` | `0.08` | Dưới ngọn đèn ga vách tường bên trái. |
| **Mảnh bản vẽ 4** (bệ cửa sổ) | `hitbox-french-window` (item: `manh_ban_ve_ao_dai_4`) | `c2-s1-gac-lung-ve-tranh--manh-4.png` | `[1267, 456, 1297, 489]` | `{ x: 0.767, y: 0.502 }` | `{ x: 0.74, y: 0.46, w: 0.06, h: 0.09 }` | `0.08` | Bệ cửa sổ bên phải; **tách biệt khỏi Exit window** (>150px) để tránh chạm nhầm. |
| **Giá vẽ bản ghép** (ghép dải) | `hitbox-drawing-easel` (puzzle: `p-c2-sketch-assemble`) | `c2-s1-gac-lung-ve-tranh--ban-ve-ghep.png` | `[329, 280, 402, 490]` | `{ x: 0.219, y: 0.409 }` | `{ x: 0.18, y: 0.28, w: 0.08, h: 0.25 }` | `0.08` | Giá vẽ đứng; khi giải xong overlay bản ghép hiển thị tại đây. |
| **Lối sang kho vải (Exit)** | `window` (dẫn sang `c2-s2-kho-vai-hang-dao`) | Arrow / Cửa sổ vòm | `[1470, 188, 1638, 705]` | `{ x: 0.920, y: 0.380 }` | `{ x: 0.88, y: 0.20, w: 0.10, h: 0.55 }` | — | Khóa bởi cổng G1 (`p-c2-sketch-assemble` solved AND `d-c2-mat-ma` completed). |
| **NPC Cụ Loan (tĩnh)** | `c2-s1-loan` | `assets/characters/cu-loan/scene-idle.png` | Foot: `[1137, 706]` | `{ x: 0.68, y: 0.75 }` | Box: `{ x: 0.627, y: 0.308, w: 0.105, h: 0.442 }` | — | Loan đứng trên sàn gác lửng giữa giỏ vải và cửa sổ; hoàn toàn không chắn bàn vẽ, giỏ vải hay cửa sổ. |

---

### Phòng S2: `c2-s2-kho-vai-hang-dao` (Kho vải ngầm tiệm tơ lụa Hàng Đào)
- **Kích thước gốc:** `1672 × 941`, tỉ lệ `16:9`
- **Sàn đi bộ (`c2` floor):** `floorTop = 0.58` (546 px), `floorBottom = 0.92` (866 px). Vùng An đi lại: $y \in [0.60, 0.90]$.
- **Spawn An:** `{ x: 0.15, y: 0.75 }` (sàn bên trái, cạnh lối quay về S1).

| Tên đối tượng / Tác vụ | Content ID | Asset Path | Native Bounds `[x1, y1, x2, y2]` | Pos `{ x, y }` | Clickable Rect `{ x, y, w, h }` | Radius | Ghi chú vị trí & Tiếp cận |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chìa khóa két sắt** (sau con lắc) | `hitbox-grandfather-clock` (item: `chia_khoa_ket_sat_bang_thau`) | `c2-s2-kho-vai-hang-dao--chia-khoa.png` | `[409, 387, 421, 413]` | `{ x: 0.248, y: 0.425 }` | `{ x: 0.21, y: 0.32, w: 0.08, h: 0.24 }` | `0.08` | Sau quả lắc đồng hồ đứng góc trái. Nhặt xong biến mất. |
| **Kệ lụa Hà Đông** (thoại gợi ý) | `hitbox-silk-shelves` (dialogue: `d-c2-silk-shelves`) | Nền phòng | `[702, 207, 1136, 536]` | `{ x: 0.550, y: 0.400 }` | `{ x: 0.42, y: 0.22, w: 0.26, h: 0.35 }` | `0.08` | Các súc vải lụa nhiều tầng giữa phòng. |
| **Két sắt cổ** (mở két lấy 2 giấy) | `hitbox-iron-safe` (puzzle: `p-c2-safe-open`) | `c2-s2-kho-vai-hang-dao--ket-mo.png` / `--ket-rong.png` | `[1236, 353, 1563, 609]` | `{ x: 0.837, y: 0.511 }` | `{ x: 0.74, y: 0.37, w: 0.20, h: 0.28 }` | `0.08` | **Đổi sang mặt `phai`** (bỏ `trai`). Két mở hé/rỗng khớp inventory thực tế. |
| **Lối về gác lửng S1 (Exit back)** | `back` (dẫn sang `c2-s1-gac-lung-ve-tranh`) | Mép cửa trái | `[0, 423, 134, 846]` | `{ x: 0.040, y: 0.674 }` | `{ x: 0.00, y: 0.45, w: 0.08, h: 0.45 }` | — | Luôn mở cho người chơi quay lại kiểm tra gác lửng. |
| **Lối sang triển lãm S3 (Exit hall)** | `hall` (dẫn sang `c2-s3-phong-trien-lam-doi-dau`) | Cửa vòm phải | `[1538, 329, 1672, 752]` | `{ x: 0.960, y: 0.574 }` | `{ x: 0.92, y: 0.35, w: 0.08, h: 0.45 }` | — | Khóa bởi cổng G2 (Safe solved AND cả `d-c2-bien-lai`, `d-c2-giao-keo` completed). |
| **NPC Cụ Loan (tĩnh)** | `c2-s2-loan` | `assets/characters/cu-loan/scene-worried.png` | Foot: `[602, 659]` | `{ x: 0.36, y: 0.70 }` | Box: `{ x: 0.307, y: 0.258, w: 0.105, h: 0.442 }` | — | Loan đứng lo âu giữa đồng hồ và kệ lụa; không chắn đồng hồ hay két sắt. |

---

### Phòng S3: `c2-s3-phong-trien-lam-doi-dau` (Phòng triển lãm Báo Ngày Nay)
- **Kích thước gốc:** `1672 × 941`, tỉ lệ `16:9`
- **Sàn đi bộ (`c2` floor):** `floorTop = 0.58`, `floorBottom = 0.92`. Vùng An đi lại: $y \in [0.60, 0.90]$.
- **Spawn An:** `{ x: 0.12, y: 0.75 }` (sàn bên trái, gần cửa vào).

| Tên đối tượng / Tác vụ | Content ID | Asset Path | Native Bounds `[x1, y1, x2, y2]` | Pos `{ x, y }` | Clickable Rect `{ x, y, w, h }` | Radius | Ghi chú vị trí & Tiếp cận |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ký giả & Quan khách** (trình biên lai) | `hitbox-reporters-crowd` (puzzle: `p-c2-present-receipt`) | `c2-s3-phong-trien-lam-doi-dau--nguoi-nghe.png` | `[1100, 414, 1425, 780]` | `{ x: 0.755, y: 0.634 }` | `{ x: 0.66, y: 0.44, w: 0.20, h: 0.38 }` | `0.08` | Đám đông cử tọa bên phải; trình biên lai trả nợ gốc 1935. |
| **Bóng mờ Ông Lệ** (trình bản vẽ) | `hitbox-ong-le-shadow` (puzzle: `p-c2-present-sketch`) | `assets/characters/ong-le/view-front.png` (ghost) | `[453, 280, 529, 498]` | `{ x: 0.294, y: 0.413 }` | `{ x: 0.26, y: 0.28, w: 0.08, h: 0.25 }` | `0.10` | Bóng mờ đứng đối chất; trình bản vẽ Lemur hoàn chỉnh. |
| **Bục trình diễn** (thử thách Lemur) | `hitbox-exhibition-podium` (puzzle: `p-c2-styling-loan`) | Nền phòng | `[635, 470, 902, 771]` | `{ x: 0.450, y: 0.650 }` | `{ x: 0.38, y: 0.50, w: 0.16, h: 0.32 }` | `0.08` | Bục danh dự nơi phối áo Lemur, khăn vấn đen và guốc mộc cho Loan. |
| **Lối về kho vải S2 (Exit back)** | `back` (dẫn sang `c2-s2-kho-vai-hang-dao`) | Cửa vòm trái | `[0, 423, 134, 846]` | `{ x: 0.040, y: 0.674 }` | `{ x: 0.00, y: 0.45, w: 0.08, h: 0.45 }` | — | **Sửa exit:** Quay về S2, **không trỏ về `prologue`** như content legacy. |
| **NPC Ông Cả Nghị (tĩnh)** | `c2-s3-ca-nghi` | `assets/characters/ca-nghi/scene-stern.png` / `scene-shocked.png` / `scene-retreat.png` | Foot: `[1254, 678]` | `{ x: 0.75, y: 0.72 }` | Box: `{ x: 0.697, y: 0.278, w: 0.105, h: 0.442 }` | — | Đứng cạnh đám đông. Chuyển từ nghiêm nghị → hoảng hốt khi trình biên lai → lùi bước khi trình bản vẽ. |
| **NPC Cụ Loan (tĩnh)** | `c2-s3-loan` | `assets/characters/cu-loan/scene-worried.png` / `scene-determined.png` / `scene-relieved.png` | Foot: `[368, 678]` | `{ x: 0.22, y: 0.72 }` | Box: `{ x: 0.167, y: 0.278, w: 0.105, h: 0.442 }` | — | Đứng bên bục trình. Chuyển từ lo âu → quyết tâm tự ký tên → nhẹ nhõm sau khi thử thách hoàn thành. |

---

## 3. Khuyến Nghị Áp Dụng Cho Core (`c2.json`)

1. **Chuẩn hóa `side`**: Đảm bảo tất cả interactables và puzzles đều có `side: "phai"`. Xóa bỏ `side: "trai"` tại `hitbox-iron-safe`.
2. **Cập nhật Exit S3**: Đổi `exits: { "exit": "prologue" }` thành `exits: { "back": "c2-s2-kho-vai-hang-dao" }`.
3. **Thêm Gate bảo vệ**:
   - G1 tại Exit `window` của S1: `["p-c2-sketch-assemble", "d-c2-mat-ma"]`.
   - G2 tại Exit `hall` của S2: `["p-c2-safe-open", "d-c2-bien-lai", "d-c2-giao-keo"]`.
4. **Phần thưởng & Tiền tệ**: Cập nhật `reward.senNgoc = 100` (thay vì 120 legacy) theo đúng baseline contract.
5. **NPCs tĩnh**: Core không cần tạo hitbox giả cho Loan hay Cả Nghị trong `interactables`. Frontend quản lý render tĩnh và chuyển pose theo state của các puzzles.
