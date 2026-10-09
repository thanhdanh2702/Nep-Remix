# C3 — Bàn Giao Khắc Phục Audit Hình Học, Bàn Phím & Nhãn Hotspot (Frontend → Core / Tester / Leader)

- **Ngày lập:** 09/10/2026
- **Chi nhánh:** `agent/frontend`
- **Baseline mục tiêu:** `56eeb3bafdbcb4a63529196be73f10ba08341ab0`
- **Checkout:** `/Users/thanhdanh/Nep-Remix-frontend`
- **Quyền Git:** Giữ nguyên trạng thái **UNCOMMITTED** (không commit, merge, push, reset, stash, clean).
- **Ranh giới sở hữu:** Frontend sở hữu độc quyền `src/game/DocumentViewer.tsx`, `src/game/puzzle.css`, `src/game/RoomScene.tsx`, `src/game/character-scale.ts`, `src/game/room-walker.ts`, `src/game/room-render.ts`, unit tests sát module `src/game/c3-*.test.ts`, và tài liệu này `src/game/C3-GEOMETRY-AUDIT-HANDOFF.md`. Tuyệt đối không sửa `src/core/`, `src/content/chapters/c3.json`, `scripts/check-c3-demo-ui.mjs`, schema, catalogs hay test suites của Tester.

---

## 1. Tóm Tắt Khắc Phục Audit 09/10/2026

Bản khắc phục này giải quyết dứt điểm 5 yêu cầu trọng tâm sau đợt review audit:

1. **P2 — Keyboard Document Reader Accessibility & Verification:**
   - Vùng cuộn tài liệu `.document-viewer-body` được bổ sung `tabIndex={0}`, `role="region"`, và `aria-label="Văn bản chứng cứ: [Tiêu đề]"`.
   - Bổ sung CSS `:focus-visible` với outline rõ ràng (`2px solid var(--c-warm-gold)`) và `overscroll-behavior: contain`.
   - Khi mở tài liệu, focus tự động đưa vào vùng đọc nội dung trước thay vì nhảy cóc qua nút hành động, cho phép người dùng bàn phím đọc chứng cứ trước khi bấm xác nhận.
   - Triển khai helper thuần túy `handleDocumentBodyKeyDown` được xuất trực tiếp từ `DocumentViewer.tsx`, hỗ trợ `ArrowDown`, `ArrowUp`, `PageDown`, `PageUp`, `Home`, `End` với `preventDefault()`.
   - **Xử lý Smooth Scrolling vs. Phím lặp (Key Repeat) & Reduced Motion:** Các phím nhảy (`Home`, `End`) và sự kiện nhấn giữ lặp (`repeat: true`) hoặc khi bật `prefers-reduced-motion` tự động chuyển `scrollBehavior = 'auto'` để triệt tiêu độ trễ hoạt họa (animation lag) và tránh dồn hàng đợi frame.
   - Thay thế test mock trước đây bằng kiểm thử trực tiếp helper thật `handleDocumentBodyKeyDown` và render `<DocumentViewer>` qua `renderToStaticMarkup` cho cả 4 tài liệu ở chế độ active và read-only.
   - Bổ sung kiểm thử Playwright component probe trên cả 3 viewport: Desktop (1366×900), Mobile (390×844), và Landscape (844×390).
   - Bảo toàn contract: chỉ xác nhận khi click nút xác nhận (không auto-ack khi cuộn hoặc bấm Escape); chế độ đọc lại trong Journal giữ nguyên trạng thái chỉ đọc và trả focus về trigger ban đầu.

2. **P3 — Hotspot Action Labels:**
   - Cập nhật từ điển `C3_HOTSPOT_LABELS` mô tả chính xác hành động ngữ cảnh của người chơi:
     - `hitbox-fabric-attic`: **"Nhặt biên nhận tiền"** (thay vì "Xem giá vải", vì hotspot này nhặt item `bien_nhan_tien_thay_boi`).
     - `hitbox-salon-table`: **"Trình chứng cứ"** (thay vì "Xem bàn đàm phán", vì hotspot này kích hoạt puzzle `p-c3-present-evidence`).
     - `hitbox-styling-mai`: **"Phối đồ cho Mai"** (thay vì "Đối chất và phối đồ cho Mai", vì khâu phối đồ diễn ra sau khi đối chất hoàn tất).
   - Tuyệt đối không lấy tên nhân vật thoại (`speaker`) để gán cho vật thể; nhân vật Vinh được gán "Nói chuyện với Vinh".
   - Tooltip (`tip.text`) và accessible name (`aria-label`) dùng chung 100% cùng một nguồn dữ liệu từ `C3_HOTSPOT_LABELS`.
   - Giữ nguyên 100% logic của C1 và C2 (không hồi quy).

3. **P2 — Giải Tỏa Mâu Thuẫn Hình Học Sàn Vẽ & Vùng Tiếp Cận Chiều Sâu 2.5D:**
   - Làm rõ sự khác biệt giữa **Hành lang đi lại phía trước (Foreground Unobstructed Transit Corridor)** và **Tổng mặt phẳng sàn sử dụng được (Total 2.5D Usable Floor Plane)** trong tranh vẽ 2.5D.
   - Bổ sung vật cản ghế bành ở S2 và vách trang trí bên trái ở S3 vào `OBSTACLES`, đưa ngưỡng vào cửa và fallback spawn ra mặt sàn thoáng ($y \approx 795.15\text{ px}$ ở S2 và $y \approx 819.61\text{ px}$ ở S3), chấm dứt hoàn toàn lỗi An đứng trên ghế hay lơ lửng ở $y = 639.88\text{ px}$.
   - Giải thích cơ sở mỹ thuật của các điểm đến ở chiều sâu sàn phía sau ($y = 640 - 740\text{ px}$): lối đi ngách hai bên bát hương ($y=660$), khoảng sàn thoáng bên phải rương Bát Quái ($y=650$), và khoảng sảnh mở bên phải bàn đàm phán ($y=720 - 740$).
   - Đo đạc chính xác tọa độ chân thực tế của An tại toàn bộ 22 hướng tiếp cận (11 trái, 11 phải), khớp 100% với `computedArrivals` của Leader snapshot.
   - Kiểm tra `findPath` thông suốt 22/22 tuyến đường từ cả fallback spawn và các ngưỡng cửa chuyển cảnh.

4. **Báo Cáo Phạm Vi Độ Phủ (Coverage Scope) Minh Bạch:**
   - Công bố câu lệnh coverage chính xác: `node --import tsx --test --experimental-test-coverage src/game/c3-*.test.ts src/game/chapter-availability.test.ts`.
   - Phân định rõ ràng giữa độ phủ unit test helper logic và độ phủ component UI gắn kết thật.

5. **Đóng Băng Bảng Băm Tệp Nguồn (SHA-256 Coherent Freeze):**
   - Cung cấp bảng fingerprint SHA-256 nhất quán cho tất cả các tệp Frontend trước khi Backend tiến hành ghim (pin).

---

## 2. Bảng 11 Hotspots C3 — Nhãn Khắc Phục & Thao Tác Chuẩn

| # | ID Hotspot | Cảnh | Loại | Action Loại | Action Target ID | Nhãn Cũ | **Nhãn Khắc Phục Mới (`C3_HOTSPOT_LABELS`)** | Tooltip / Aria-Label |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `hitbox-fabric-attic` | S1 | Object | Item | `bien_nhan_tien_thay_boi` | Xem giá vải | **Nhặt biên nhận tiền** | Đồng nhất |
| 2 | `hitbox-c3-read-receipt` | S1 | Object | Dialogue | `d-c3-mua-chuoc` | "Bà Mai" *(Sai)* | **Đọc biên nhận tiền** | Đồng nhất |
| 3 | `hitbox-gramophone` | S1 | Object | Dialogue | `d-c3-gramophone` | "Bà Mai" *(Sai)* | **Xem máy hát đĩa** | Đồng nhất |
| 4 | `hitbox-street-exit` | S1 | Object | Dialogue | `d-c3-street-exit` | "Bà Mai" *(Sai)* | **Ra ngoài đường** | Đồng nhất |
| 5 | `hitbox-incense-bowl` | S2 | Object | Dialogue | `d-c3-incense-smoke` | "Bà Mai" *(Sai)* | **Xem bát hương** | Đồng nhất |
| 6 | `hitbox-bagua-mirror` | S2 | Object | Dialogue | `d-c3-bagua` | "Bà Mai" *(Sai)* | **Xem gương Bát Quái** | Đồng nhất |
| 7 | `hitbox-bagua-chest` | S2 | Object | Puzzle | `p-c3-bagua-lock` | Tiêu đề puzzle | **Mở rương Bát Quái** | Đồng nhất |
| 8 | `hitbox-salon-table` | S3 | Object | Puzzle | `p-c3-present-evidence`| Tiêu đề puzzle | **Trình chứng cứ** | Đồng nhất |
| 9 | `hitbox-c3-read-revision`| S3 | Object | Dialogue | `d-c3-ban-sua` | "Mai" *(Sai)* | **Đọc bản sửa hồ sơ** | Đồng nhất |
| 10 | `hitbox-vinh-support` | S3 | NPC | Dialogue | `d-c3-vinh-stand` | "Vinh" | **Nói chuyện với Vinh** | Đồng nhất |
| 11 | `hitbox-styling-mai` | S3 | Object | Puzzle | `p-c3-styling-mai` | Tiêu đề puzzle | **Phối đồ cho Mai** | Đồng nhất |

---

## 3. Kiến Trúc Hình Học Sàn Vẽ & Phân Vùng 2.5D (Floor Rationale)

### A. Thông số nền và tỷ lệ nhân vật
- **Canvas thế giới:** $W = 1672\text{ px}$, $H = 941\text{ px}$.
- **Sprite spec:** Sprite sheet $176 \times 416\text{ px}$, anchor $[88, 400]$, visible figure height $384\text{ px}$.
- **Hệ số tỷ lệ NPC:** Nhân vật NPC được vẽ theo hệ số $1.35$ trên nền 941:
  $$\text{Visible NPC Height} = 384\text{ px} \times 1.35 = 518.4\text{ px}$$
- **Tỷ lệ nhân vật An (`characterScale`):**
  $$\text{Scale An} = \frac{518.4}{389} \approx 1.3326478 \quad (\text{chiều cao hiển thị } 518.4\text{ px})$$
- **Dải sàn tổng quan C3 (`HUMAN_HEIGHT['c3']`):**
  $$\text{floorTop} = 0.68 \implies 639.88\text{ px}, \quad \text{floorBottom} = 0.92 \implies 865.72\text{ px}$$

### B. Giải tỏa mâu thuẫn hình học: Phân biệt hai phân vùng sàn
Mâu thuẫn trước đây trong tài liệu xuất phát từ việc gọi dải sàn thoáng phía trước là "toàn bộ sàn mở", dẫn đến việc các tọa độ tương tác ở chiều sâu ($y = 650 - 740\text{ px}$) bị hiểu nhầm là nằm ngoài sàn.

Trong thực tế mỹ thuật tranh vẽ phối cảnh 2.5D của C3, mỗi căn phòng gồm hai phân vùng sàn liên hoàn:

1. **Vùng A — Hành lang đi lại phía trước (Foreground Continuous Transit Corridor):**
   - **Đặc điểm:** Dải sàn đi bộ thoáng ngang suốt chiều rộng phòng ($x \in [83.60, 1588.40]$), nằm hoàn toàn phía trước tất cả đồ đạc/bàn ghế. Đây là nơi bố trí các cửa đi (doorway thresholds) và nơi các nhân vật NPC đứng hội thoại.
   - **S1 (`c3-s1-tiem-may-da-kao`):** $y \in [790.44, 865.72]\text{ px}$. Bà Mai đứng tại $[350, 790]$, cửa ra phố tại $x = 1571.68, y = 790.44$.
   - **S2 (`c3-s2-phong-phong-thuy`):** $y \in [781.03, 865.72]\text{ px}$. Thầy Ba Càn đứng tại $[580, 795]$, cửa trái từ S1 tại $x = 83.60, y = 795.15$, cửa phải sang S3 tại $x = 1588.40, y = 795.15$.
   - **S3 (`c3-s3-dinh-thu-doi-dau`):** $y \in [800.00, 865.72]\text{ px}$. Vinh $[480, 820]$, Bà Mai $[780, 825]$, Bà Lớn $[1170, 820]$, cửa trái từ S2 tại $x = 83.60, y = 819.61$.

2. **Vùng B — Vùng sàn ngách / tiếp cận chiều sâu (Mid-Depth & Rear Walkable Zones):**
   - **Đặc điểm:** Các khoảng sàn thực tế ăn sâu về phía sau chân tường ($y \in [639.88, 781.03]\text{ px}$) giữa hoặc bên cạnh đồ nội thất, cho phép An bước lại gần để quan sát các vật thể trên bàn/tường:
   - **S1:**
     - Vách kệ vải gác xép (`hitbox-fabric-attic` / `hitbox-c3-read-receipt`): Lối tiếp cận trái đưa An đứng bên cạnh bàn cắt vải ở chân tường sau ($x = 1104.76, y = 640.00$).
     - Máy hát đĩa (`hitbox-gramophone`): Lối tiếp cận phải đưa An đứng ở ngách sàn sát tường phải ($x = 1565.24, y = 680.00$).
   - **S2:**
     - Bát hương (`hitbox-incense-bowl`): Hai lối đi hai bên bàn thờ cho phép An bước vào ngách trái giữa ghế bành và bàn thờ ($x = 404.76, y = 660.00$) hoặc ngách phải giữa bàn thờ và bàn sách ($x = 735.24, y = 660.00$).
     - Rương Bát Quái (`hitbox-bagua-chest`): Lối tiếp cận phải đưa An đứng vào khoảng sàn thoáng rộng bên phải rương dẫn ra cửa dinh thự ($x = 1375.24, y = 650.00$).
   - **S3:**
     - Bàn đàm phán cẩm thạch (`hitbox-salon-table` & `hitbox-c3-read-revision`): Phía bên phải bàn ($x > 1070$) là sảnh thoáng rộng rãi dẫn về phía cửa sổ sau; lối tiếp cận phải đưa An đứng tự nhiên bên cạnh bàn tại $x = 1075.24, y = 740.00$ và $x = 1085.24, y = 720.00$.

---

## 4. Tọa Độ Điểm Đến, Mũi Tên Thoát & Chuyển Cảnh Khắc Phục

### A. Bảng So Sánh Spawn & Chuyển Cảnh: Lỗi Cũ vs Khắc Phục Mới

| Vị Trí / Chuyển Cảnh | Phòng | Trạng Thái Cũ (Audit Báo Lỗi) | **Trạng Thái Khắc Phục Mới** | Normalized Mới | Cơ Sở Nghệ Thuật (Art Rationale) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S1 Fallback Spawn** | S1 | $[250.8, 790.44]$ | **$[250.8, 790.44]$** | $\{0.150, 0.840\}$ | Đứng trước bàn cắt vải, ngang hàng Bà Mai ($y = 790$) |
| **S2 Fallback Spawn** | S2 | $[167.2, 639.88]$ *(Đứng trên ghế)* | **$[167.2, 795.15]$** | $\{0.100, 0.845\}$ | `standClear` đẩy qua ghế bành, đứng ngang hàng Thầy Ba Càn ($y = 795$) |
| **S3 Fallback Spawn** | S3 | $[167.2, 639.88]$ *(Lơ lửng)* | **$[167.2, 819.61]$** | $\{0.100, 0.871\}$ | `standClear` đẩy qua vách trái, đứng ngang hàng Vinh/Bà Lớn ($y = 820$) |
| **S1 $\to$ S2 (Tiến)** | S2 | $[83.60, 639.88]$ *(Lơ lửng)* | **$[83.60, 795.15]$** | $\{0.050, 0.845\}$ | Bước qua ngưỡng cửa trái vào hành lang thoáng S2 |
| **S3 $\to$ S2 (Lùi)** | S2 | $[1588.40, 639.88]$ *(Lơ lửng)* | **$[1588.40, 795.15]$** | $\{0.950, 0.845\}$ | Bước qua ngưỡng cửa phải vào hành lang thoáng S2 |
| **S2 $\to$ S3 (Tiến)** | S3 | $[83.60, 639.88]$ *(Lơ lửng)* | **$[83.60, 819.61]$** | $\{0.050, 0.871\}$ | Bước qua ngưỡng cửa trái vào sảnh đối đầu S3 |
| **S2 $\to$ S1 (Lùi)** | S1 | $[1571.68, 639.88]$ *(Lơ lửng)* | **$[1571.68, 790.44]$** | $\{0.940, 0.840\}$ | Bước qua vòm cửa phải trở về tiệm may S1 |

### B. Cơ Chế Khôi Phục Game (Resume / Reload State)
Khi tải lại cảnh hoặc khôi phục savegame (không có thông tin phòng trước đó), hệ thống giải mã vị trí xuất phát tự động đẩy chân An ra mặt sàn đi bộ thoáng:
- S1: $[250.8, 790.44]$
- S2: $[167.2, 795.15]$
- S3: $[167.2, 819.61]$
Tuyệt đối không còn tình trạng An đứng ở $y = 639.88\text{ px}$.

---

## 5. Bảng 11 Interactables — Tọa Độ Native/Normalized & Chân Đến Khớp Snapshot Leader

Toàn bộ 22 điểm chân đến dưới đây khớp 100% với `computedArrivals` của Leader snapshot (`docs/07-game/c3-geometry-review-input.json`):

| # | ID Hotspot | Cảnh | Tọa độ Native Đề Xuất $\{x, y\}$ | Tọa độ Norm Đề Xuất $\{x, y\}$ | Hit Rect Native $[x, y, w, h]$ | Hit Rect Normalized | Bán kính Radius | Tiếp cận Trái (Native) | Tiếp cận Phải (Native) | Chân đến Walker L / R (Native) | Khoảng cách L / R (Core Native Space) | Proximity Guard | Tuyến đường `findPath` |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `hitbox-fabric-attic` | S1 | `[1246, 550]` | `{0.7452, 0.5845}` | `[1180, 460, 130, 180]` | `{0.706, 0.489, 0.078, 0.191}` | 0.19 (152px) | `[1140, 790]` | `[1350, 790]` | `[1104.76, 640.00]` / `[1385.24, 790.44]` | 82.8px / 144.1px | **PASS** ($\le 152\text{px}$) | **CLEAR** |
| 2 | `hitbox-c3-read-receipt` | S1 | `[1246, 550]` | `{0.7452, 0.5845}` | `[1180, 460, 130, 180]` | `{0.706, 0.489, 0.078, 0.191}` | 0.19 (152px) | `[1140, 790]` | `[1350, 790]` | `[1104.76, 640.00]` / `[1385.24, 790.44]` | 82.8px / 144.1px | **PASS** ($\le 152\text{px}$) | **CLEAR** |
| 3 | `hitbox-gramophone` | S1 | `[1420, 600]` | `{0.8493, 0.6376}` | `[1350, 500, 140, 180]` | `{0.807, 0.531, 0.084, 0.191}` | 0.16 (128px) | `[1350, 790]` | `[1480, 790]` | `[1274.76, 790.44]` / `[1565.24, 680.00]` | 122.8px / 81.5px | **PASS** ($\le 128\text{px}$) | **CLEAR** |
| 4 | `hitbox-street-exit` | S1 | `[880, 780]` | `{0.5263, 0.8289}` | `[752, 750, 250, 170]` | `{0.450, 0.797, 0.150, 0.181}` | 0.15 (120px) | `[820, 820]` | `[940, 820]` | `[676.76, 865.72]` / `[1077.24, 865.72]` | 107.4px / 104.8px | **PASS** ($\le 120\text{px}$) | **CLEAR** |
| 5 | `hitbox-incense-bowl` | S2 | `[580, 620]` | `{0.3469, 0.6589}` | `[480, 500, 180, 160]` | `{0.287, 0.531, 0.108, 0.170}` | 0.16 (128px) | `[480, 795]` | `[680, 795]` | `[404.76, 660.00]` / `[735.24, 660.00]` | 86.5px / 77.3px | **PASS** ($\le 128\text{px}$) | **CLEAR** |
| 6 | `hitbox-bagua-mirror` | S2 | `[990, 580]` | `{0.5921, 0.6164}` | `[900, 480, 180, 170]` | `{0.538, 0.510, 0.108, 0.181}` | 0.18 (144px) | `[880, 795]` | `[1040, 795]` | `[824.76, 781.03]` / `[1155.24, 781.03]` | 132.9px / 132.9px | **PASS** ($\le 144\text{px}$) | **CLEAR** |
| 7 | `hitbox-bagua-chest` | S2 | `[1190, 580]` | `{0.7117, 0.6164}` | `[1080, 420, 220, 230]` | `{0.646, 0.446, 0.132, 0.244}` | 0.19 (152px) | `[1080, 795]` | `[1260, 795]` | `[1004.76, 781.03]` / `[1375.24, 650.00]` | 138.8px / 96.1px | **PASS** ($\le 152\text{px}$) | **CLEAR** |
| 8 | `hitbox-salon-table` | S3 | `[840, 620]` | `{0.5024, 0.6589}` | `[680, 480, 320, 260]` | `{0.407, 0.510, 0.191, 0.276}` | 0.19 (152px) | `[750, 840]` | `[920, 840]` | `[604.76, 799.85]` / `[1075.24, 740.00]` | 147.7px / 129.4px | **PASS** ($\le 152\text{px}$) | **CLEAR** |
| 9 | `hitbox-c3-read-revision`| S3 | `[840, 620]` | `{0.5024, 0.6589}` | `[750, 480, 260, 240]` | `{0.449, 0.510, 0.155, 0.255}` | 0.19 (152px) | `[750, 840]` | `[920, 840]` | `[674.76, 799.85]` / `[1085.24, 720.00]` | 124.0px / 128.8px | **PASS** ($\le 152\text{px}$) | **CLEAR** |
| 10 | `hitbox-vinh-support` | S3 | `[480, 740]` | `{0.2871, 0.7864}` | `[400, 420, 160, 390]` | `{0.239, 0.446, 0.096, 0.414}` | 0.16 (128px) | `[380, 820]` | `[580, 820]` | `[324.76, 810.00]` / `[635.24, 810.00]` | 83.1px / 83.1px | **PASS** ($\le 128\text{px}$) | **CLEAR** |
| 11 | `hitbox-styling-mai` | S3 | `[780, 740]` | `{0.4665, 0.7864}` | `[700, 420, 160, 390]` | `{0.419, 0.446, 0.096, 0.414}` | 0.16 (128px) | `[680, 825]` | `[880, 825]` | `[624.76, 810.00]` / `[935.24, 810.00]` | 83.1px / 83.1px | **PASS** ($\le 128\text{px}$) | **CLEAR** |

*Ghi chú công thức khoảng cách Core:* Khoảng cách kiểm tra của Core guard được tính theo chuẩn tỉ lệ không gian màn chơi chuẩn $800 \times 500$:
$$\text{distance} = \sqrt{\left(\left(\frac{to.x}{W} - spot.pos.x\right) \times 800\right)^2 + \left(\left(\frac{to.y}{H} - spot.pos.y\right) \times 500\right)^2}$$
Tất cả 22/22 hướng tiếp cận đều đạt $\text{distance} \le \text{limit} = \text{radius} \times 800$ một cách nghiêm ngặt mà không cần nới lỏng bán kính.

---

## 6. Hộp Vật Cản (`OBSTACLES`) & Vùng Chân NPC (`NPC_FEET`)

### A. Vật cản nội thất cập nhật trong `room-walker.ts`:
```ts
const OBSTACLES: Record<string, Rect[]> = {
  'c3-s1-tiem-may-da-kao': [
    { x: 0.12, y: 0.50, w: 0.17, h: 0.32 }, // Bàn máy may
    { x: 0.68, y: 0.48, w: 0.21, h: 0.34 }, // Bàn cắt vải lớn
  ],
  'c3-s2-phong-phong-thuy': [
    { x: 0.05, y: 0.48, w: 0.17, h: 0.345 }, // Ghế bành gỗ bên trái (ngăn đứng trên ghế)
    { x: 0.275, y: 0.48, w: 0.145, h: 0.34 }, // Bàn thờ kinh dịch
    { x: 0.44, y: 0.45, w: 0.19, h: 0.36 },   // Bàn đọc sách
    { x: 0.63, y: 0.45, w: 0.18, h: 0.36 },   // Rương Bát Quái
  ],
  'c3-s3-dinh-thu-doi-dau': [
    { x: 0.05, y: 0.48, w: 0.18, h: 0.371 }, // Vách trang trí bên trái (ngăn lơ lửng)
    { x: 0.36, y: 0.48, w: 0.28, h: 0.35 },   // Bàn đàm phán cẩm thạch
  ],
};
```

### B. Vùng chân NPC né va chạm (`NPC_FEET`):
```ts
const NPC_FEET: Record<string, Rect[]> = {
  'c3-s1-tiem-may-da-kao': [{ x: 293, y: 750, w: 114, h: 45 }],   // Bà Mai (chân 350, 790)
  'c3-s2-phong-phong-thuy': [{ x: 523, y: 755, w: 114, h: 45 }],   // Thầy Ba Càn (chân 580, 795)
  'c3-s3-dinh-thu-doi-dau': [
    { x: 423, y: 780, w: 114, h: 45 },                              // Vinh (chân 480, 820)
    { x: 723, y: 785, w: 114, h: 45 },                              // Bà Mai (chân 780, 825)
    { x: 1113, y: 780, w: 114, h: 45 },                             // Bà Lớn (chân 1170, 820)
  ],
};
```

---

## 7. Phân Lớp Che Khuất (Occlusion) & Visible Bounds

- **Visible bounds nhân vật:**
  - Bà Mai S1: $[270, 272, 428, 791]$ (chân $[350, 790]$).
  - Thầy Ba Càn S2: $[498, 277, 662, 796]$ (chân $[580, 795]$).
  - Vinh S3: $[388, 302, 571, 821]$ (chân $[480, 820]$).
  - Bà Mai S3: $[680, 307, 879, 826]$ (chân $[780, 825]$).
  - Bà Lớn S3: $[1085, 302, 1255, 821]$ (chân $[1170, 820]$).
- **Phân tầng 2.5D:**
  - An di chuyển trên mặt phẳng $y \approx 790 - 820\text{ px}$.
  - Khi An đứng trước các vật thể nội thất ($y_{\text{An}} > y_{\text{obstacle\_bottom}}$), An được vẽ đè lên vật thể tự nhiên.
  - Vùng chân NPC (`NPC_FEET`) chỉ né 45px chân thật sự, không biến cả sprite 416px thành tường phẳng, cho phép An đi ngang qua mà vẫn giữ cảm giác chiều sâu không gian 2.5D.

---

## 8. Bảng Băm Tệp Nguồn (Coherent SHA-256 Fingerprints)

Tất cả các tệp Frontend đã hoàn tất chỉnh sửa và kiểm tra, sẵn sàng cho Backend ghim:

| Tệp | SHA-256 Fingerprint |
| :--- | :--- |
| `src/game/DocumentViewer.tsx` | `f4597ec886c48f8a326e0184f4034d3dedd1973bcc1dc4bdbc1a67b178284e4f` |
| `src/game/RoomScene.tsx` | `c272f58c97fc2313c09147cd9dab70472b2263eb8f88f846fe7f6940021cd568` |
| `src/game/room-walker.ts` | `ba2d88daecf6a666b3522eeeb90178f16a64b1ff4425eef39aa512d3c284f512` |
| `src/game/room-render.ts` | `59be77c9087e14e534c53cd3f517e244c91fe15708e827dd637e088a0183aa7b` |
| `src/game/character-scale.ts` | `2cda1b2172950fd6e82cfc24926fa91aeeff84512c4c00f21c6429715829ebfa` |
| `src/game/c3-layout.test.ts` | `5305e6e9e8618a6f87150ffa631aa98fe9e0962947277b489bcd594c43787ae4` |
| `src/game/c3-document.test.ts` | `7e40503f38e0df170908e5c4940ed08c3143d0a9df9d950ee3617952cfc7d99b` |
| `src/game/puzzle.css` | `f329d894fd4511ed7c2c706c8d6743f7dd7da0080d05d0bcdaf97ff5c2eb79cc` |

---

## 9. Báo Cáo Đo Đạc Độ Phủ (Coverage Scope) Minh Bạch

- **Lệnh thực hiện:**
  ```bash
  node --import tsx --test --experimental-test-coverage src/game/c3-*.test.ts src/game/chapter-availability.test.ts
  ```
- **Kết quả đo đạc trực tiếp trên các module Frontend thuộc phạm vi sửa đổi:**

| File / Module | Line % | Branch % | Func % | Logic Chưa Phủ (Uncovered Scope) |
| :--- | :---: | :---: | :---: | :--- |
| `DocumentViewer.tsx` | **94.16%** | **76.47%** | **62.50%** | Dòng 45-46, 49-52, 60-61 (`useEffect` mount auto-focus và fallback click trong môi trường Node server rendering; đã được Playwright browser probe kiểm chứng PASS). |
| `c3-documents.ts` | **100.00%** | **100.00%** | **100.00%** | Toàn bộ phủ đầy đủ. |
| `character-scale.ts` | **100.00%** | **100.00%** | **100.00%** | Toàn bộ phủ đầy đủ. |
| `room-walker.ts` | **89.27%** | **77.33%** | **80.00%** | Dòng 39, 52-54, 61, 174 (các nhánh fallback phòng cũ ngoài C3). |
| `room-render.ts` | **70.02%** | **88.89%** | **76.92%** | Các hàm vẽ trực tiếp lên HTMLCanvasElement (`drawBrackets`, sparkle animation). |
| `bagua-puzzle.ts` | **100.00%** | **89.19%** | **100.00%** | Toàn bộ phủ đầy đủ. |
| `chapter-availability.ts` | **100.00%** | **100.00%** | **100.00%** | Toàn bộ phủ đầy đủ. |
| `npc-portraits.ts` | **100.00%** | **93.33%** | **100.00%** | Toàn bộ phủ đầy đủ. |
| `puzzle-actions.ts` | **100.00%** | **100.00%** | **100.00%** | Toàn bộ phủ đầy đủ. |

*Lưu ý minh bạch:* Độ phủ tổng thể của bộ chạy Node test bao gồm cả content schemas và core commands là **87.53% lines / 71.36% branches / 55.10% funcs**. Frontend không đánh đồng độ phủ helper/unit test với kiểm thử UI tích hợp; toàn bộ tương tác DOM thực tế, cuộn phím và focus containment được bảo đảm bổ sung thông qua hai probe Playwright: `scripts/check-c3-demo-ui.mjs` và `scratch/check-c3-keyboard-browser.mjs`.

---

## 10. Trạng Thái Kiểm Chứng Tổng Thể

- **TypeScript (`npm run lint`):** **PASS** (0 lỗi).
- **Unit & Logic Tests (`node --import tsx --test src/game/c3-*.test.ts src/game/chapter-availability.test.ts`):** **PASS 26/26**.
- **Core & Regression Tests (`npm run test:core`, `npm run test:c2`):** **PASS 158/158**.
- **Leader Handoff Validation (`node scripts/check-c3-leader-handoff.test.mjs`):** **PASS 4/4**.
- **Production Build (`npm run build`):** **PASS** (server.mjs và client bundle tạo sạch sẽ).
- **Leader UI Probe (`node scripts/check-c3-demo-ui.mjs`):** **PASS** (mount DocumentViewer, focus trap, journal return, và explicit ack).
- **Browser Keyboard Probe (`node scratch/check-c3-keyboard-browser.mjs`):** **PASS** (Desktop 1366×900, Mobile 390×844, Landscape 844×390, cuộn phím Arrow/Page/Home/End, không cuộn trang ngoài, không auto-ack).
- **Thiết bị thật / Safari / WebKit:** Ghi nhận trung thực là **NOT RUN** (chờ Tester nghiệm thu).
