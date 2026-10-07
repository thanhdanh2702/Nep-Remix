# BÁO CÁO AUDIT ĐỘC LẬP: GEOMETRY VÀ DI CHUYỂN NHÂN VẬT CHƯƠNG 2 (C2)
**Dự án:** Tiệm May Ký Ức – C2: Tiếng Kéo Đêm Phố Cũ  
**Vai trò:** Tester độc lập Sprint C2  
**Phiên bản tài liệu:** v2 (Chuẩn hóa RED Suite & Chi tiết Coverage Ma trận)  
**Thời điểm thực hiện:** 2026-10-07  

---

## 1. BASELINE VÀ MÔI TRƯỜNG KIỂM THỬ ĐỘC LẬP

### 1.1. Git Baseline & Disclosures
- **Commit Baseline audit:** `63e6d97` (Merge commit tích hợp candidate `main@2038276` vào `agent/tester` theo Phương án A đã được Leader phê duyệt).
  - Đã giải quyết 2 xung đột:
    1. `package.json`: Giữ lại `test:docs`, tích hợp `test:c2` và `test:c2:playtest` từ Leader; `scripts/check-docs.mjs` tồn tại thực tế.
    2. `tests/c2-regression.test.ts`: Cập nhật selector theo Leader (`className="order-strip-btn-group"` kiểm tra cả `min-height` và `min-width`).
- **Commit local bàn giao:** `9d32c34` và các bổ sung chuẩn hóa RED.
- **Bảo toàn Workspace (Dirty files & nháp ngoài phạm vi giữ nguyên 100%):**
  - Dirty files C1 chưa commit: `scripts/check-game.ts`, `tests/browser/sprint01-integration.spec.ts`.
  - Draft scripts untracked: `fix-*.cjs`, `patch-*.cjs`, `"nháp"`, `run_test.ts`.
  - *Giới hạn bằng chứng:* Các dirty file C1 chỉ liên quan đến Chapter 1/Prologue, hoàn toàn không can thiệp vào bundle hay runtime của C2.
- **Tuân thủ Ownership:** Không sửa bất kỳ file runtime nào trong `src/core`, `src/game`, `src/ui`, `src/content`, CSS, PNG hoặc schema.

### 1.2. Môi trường Thực thi
- **Server:** Production server riêng biệt tại `http://127.0.0.1:3088` (`PORT=3088 NODE_ENV=production node server.mjs`), hoàn toàn tách biệt khỏi port Leader `3062`.
- **Bundle Production:** `dist/assets/index--7t7FVNY.js` (build từ `npm run build`).
- **Phân định Phương pháp Kiểm thử:**
  - **Browser thật (Playwright Chromium):** Điều khiển canvas thật, render CSS viewport, lắng nghe requestAnimationFrame của `room-walker.ts`, đo hoành độ/tung độ chân nhân vật qua dataset canvas, click DOM buttons, bắt tọa độ bounding client rect, và chụp screenshot thật.
  - **Fixture:** State injection cục bộ tạo cây lưu trữ hợp lệ đạt mốc mở khóa C2 (đã hoàn thành Prologue và C1, cấp 250 Sen), dùng để khởi động trực tiếp vào C2 mà không cần đi lại Prologue/C1 qua mỗi ca kiểm thử.

---

## 2. MA TRẬN COVERAGE THỰC CHẠY (TEST RUN COVERAGE MATRIX)

### 2.1. Ma trận Hotspot & Hướng Tiếp cận (Browser Thật)

| Phòng | Hotspot / Exit | Hướng tiếp cận | Normal Motion | Reduced Motion | Kết quả Kiểm tra | Ghi chú / Trạng thái |
|---|---|---|---|---|---|---|
| **S1** | Spawn | Khởi đầu phòng | PASS | PASS | PASS | Chân tại native `(418.0, 705.8)`, trên sàn mở |
| **S1** | `hitbox-drawing-desk` | Từ Spawn | PASS | PASS | PASS | Nhặt Mảnh 1, chân dừng tại `(518.3, 649.3)` |
| **S1** | `hitbox-fabric-basket` | Từ Bàn vẽ | PASS | PASS | PASS | Nhặt Mảnh 2, chân dừng tại `(668.8, 677.5)` |
| **S1** | `hitbox-gas-lamp` | Từ Sọt vải | PASS | PASS | PASS | Nhặt Mảnh 3, chân dừng tại `(275.9, 545.8)` |
| **S1** | `hitbox-french-window` | Từ Đèn măng-sông (trái $\to$ phải) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-001 & C2-GEO-002** | Đường đi cắt xuyên bàn vẽ (21 frames); Điểm dừng bị Loan che khuất |
| **S1** | `hitbox-french-window` | Từ Spawn (giữa $\to$ phải) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-001** | Điểm dừng bị Loan che khuất thân dưới |
| **S1** | `hitbox-drawing-easel` | Từ Cửa sổ (phải $\to$ giữa) | PASS | PASS | PASS | Mở P1 ghép tranh, chân dừng an toàn tại `(844.4, 621.1)` |
| **S1** | Exit `window` | Sau giải P1 & đọc D1 | PASS | PASS | PASS | Chuyển cảnh sang S2 an toàn |
| **S2** | Entry `window` | Khởi đầu phòng từ S1 | PASS | PASS | PASS | Chân đặt tại `(83.6, 545.8)`, sàn mở góc trái |
| **S2** | `hitbox-grandfather-clock` | Từ Entry | PASS | PASS | PASS | Nhặt chìa khóa thau, chân tại `(275.9, 545.8)` |
| **S2** | `hitbox-iron-safe` | Từ Đồng hồ (trái $\to$ phải) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-004** | Đường đi cắt ngang qua tủ vải trung tâm (36 frames) |
| **S2** | `hitbox-silk-shelves` | Từ Đồng hồ (trái $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-003** | Chân tại `(627.0, 684.1)`, đè lên thân NPC Loan |
| **S2** | `hitbox-silk-shelves` | Từ Hòm sắt (phải $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-003** | Dừng trong vùng bao hoành độ Loan `[545, 659]` |
| **S2** | Exit `back` | Quay lại S1 | NOT RUN | NOT RUN | NOT RUN | Luồng cốt truyện chính không yêu cầu lùi lại S1 |
| **S2** | Exit `hall` | Sau mở két & đọc D2/D3 | PASS | PASS | PASS | Chuyển cảnh sang S3 an toàn |
| **S3** | Entry `hall` | Khởi đầu phòng từ S2 | PASS | PASS | PASS | Chân đặt tại `(83.6, 545.8)` |
| **S3** | `hitbox-ong-le-shadow` | Từ Entry (trái $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-005** | Dừng tại `(359.5, 729.3)`, cách chân Loan $\Delta x = 8.3\text{px}$, đè bounding box |
| **S3** | `hitbox-ong-le-shadow` | Từ Phóng viên (phải $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-005** | Dừng tại `(643.7, 729.3)`, rơi vào mép gờ bục đá trưng bày |
| **S3** | `hitbox-reporters-crowd` | Từ bóng Ông Lệ | PASS | PASS | **C2-GEO-006 (Note)** | Chân dừng tại `(1220.6, 686.9)`; bao trọn Cả Nghị render-only |
| **S3** | Exit `back` | Quay lại S2 | NOT RUN | NOT RUN | NOT RUN | Luồng cao trào không yêu cầu lùi |

---

### 2.2. Ma trận Viewport & Motion

| Viewport | Độ phân giải | Loại thiết bị | Hotspot Sizing ($\ge 43.5\text{px}$) | Walker Route Tracking | Ghi chú |
|---|---|---|---|---|---|
| **V1** | `1440×900` | Desktop Standard | **PASS** (6/6 nút $\ge 48\text{px}$) | **FAIL (RED)** (C2-GEO-002, 004) | Đo đạc native pixel chuẩn |
| **V2** | `1280×720` | Desktop HD | **PASS** (6/6 nút $\ge 44\text{px}$) | **FAIL (RED)** (C2-GEO-002, 004) | Tỷ lệ 16:9 |
| **V3** | `390×844` | Mobile Portrait | **PASS** (Nút duy trì $\ge 43.5\text{px}$) | **FAIL (RED)** (Tái hiện lỗi tương tự) | CSS clamp expanded tap target đạt chuẩn |
| **V4** | `844×390` | Mobile Landscape | **PASS** (Nút duy trì $\ge 43.5\text{px}$) | **FAIL (RED)** (Tái hiện lỗi tương tự) | Không che khuất cạnh |
| **V5** | `768×1024` | Tablet Portrait | **PASS** (Nút duy trì $\ge 44\text{px}$) | **FAIL (RED)** (Tái hiện lỗi tương tự) | Tỷ lệ 4:3 |

---

## 3. PHÂN TÍCH CHUYÊN SÂU CÁC BUG HÌNH HỌC (C2-GEO-001 ĐẾN C2-GEO-008)

---

### 3.1. C2-GEO-001 (Major): Loan che khuất nhân vật An tại Hotspot Cửa Sổ Kính Mờ (S1)
- **Vị trí:** `c2-s1-gac-lung-ve-tranh`.
- **Tọa độ thực nghiệm:**
  - An tại `hitbox-french-window`: Native `(x: 1162.0, y: 545.8)`, Normalized `(0.695, 0.580)`.
  - Loan tại S1: Native foot `(x: 1137.0, y: 705.8)`, Normalized `(0.680, 0.750)`.
  - Biên hoành độ Loan: `x \in [1080.0, 1194.0]`.
- **Cơ chế lỗi:**
  - Trong `src/game/room-render.ts`:
    ```ts
    draws.sort((a, b) => a.y - b.y);
    ```
  - Vì $y_{\text{An}} = 545.8 < y_{\text{Loan}} = 705.8$, An được vẽ trước, sau đó sprite Loan (cao $404.6\text{px}$) được vẽ đè lên phía trước.
  - Do hoành độ $1162.0$ nằm trọn trong $[1080, 1194]$, thân và tà áo dài của Loan che khuất hoàn toàn chân, hông và phần dưới của An.
- **Trạng thái:** **MỞ (OPEN - REGRESSION RED)**.
- **Bằng chứng:** `artifacts/c2-geometry/c2-geo-001-s1-loan-occludes-an.png`.
- **Đề xuất FE:** Dời điểm dừng `hitbox-french-window` sang phải (`x \ge 0.76`, native $x \sim 1270\text{px}$).

---

### 3.2. C2-GEO-002 (Critical): Quỹ đạo Walker cắt thẳng qua Bàn Vẽ Trung Tâm (S1)
- **Vị trí:** `c2-s1-gac-lung-ve-tranh`.
- **Hiện tượng:**
  - Hộp vật cản Bàn vẽ (`hitbox-drawing-desk`): Native $x \in [501.6, 819.3]$, $y \in [376.4, 644.6]$.
  - Đi từ Đèn măng-sông `(275.9, 545.8)` sang Cửa sổ kính mờ `(1162.0, 545.8)`.
  - `room-walker.ts` thực hiện nội suy đường thẳng $y \approx 546\text{px}$ cắt ngang qua trung tâm bàn vẽ.
  - Ghi nhận **21 frame mẫu** chân An nằm lọt trong hộp vật cản bàn vẽ.
- **Trạng thái:** **MỞ (OPEN - REGRESSION RED)**.
- **Bằng chứng:** `artifacts/c2-geometry/c2-geo-002-s1-desk-path-clipping.png`.
- **Đề xuất Core/FE:** Bổ sung Navmesh / Waypoint routing đi vòng xuống hành lang dưới ($y > 0.70$).

---

### 3.3. C2-GEO-003 (Major): An đứng đè lên Loan tại Giá Lụa Tơ Tằm (S2)
- **Vị trí:** `c2-s2-kho-vai-hang-dao`.
- **Tọa độ thực nghiệm:**
  - An tại `hitbox-silk-shelves`: Native `(x: 627.0, y: 684.1)`, Normalized `(0.375, 0.727)`.
  - Loan tại S2: Native foot `(x: 601.9, y: 658.7)`, biên ngang $[545.0, 659.0]$.
- **Cơ chế lỗi:**
  - An dừng tại $x = 627.0$, lọt giữa thân Loan ($[545, 659]$).
  - Vì $y_{\text{An}} = 684.1 > y_{\text{Loan}} = 658.7$, An được vẽ đè lên phía trước thân Loan.
- **Trạng thái:** **MỞ (OPEN - REGRESSION RED)**.
- **Bằng chứng:** `artifacts/c2-geometry/c2-geo-004-s2-safe-path-clipping.png`.
- **Đề xuất FE:** Dời điểm dừng của Giá lụa sang phải ($x \ge 0.44$) hoặc sang trái ($x \le 0.30$).

---

### 3.4. C2-GEO-004 (Critical): Quỹ đạo Walker cắt thẳng qua Tủ Vải Trung Tâm (S2)
- **Vị trí:** `c2-s2-kho-vai-hang-dao`.
- **Hiện tượng:**
  - Hộp vật cản Tủ vải: Native $x \in [601.9, 1137.0]$, $y \in [197.6, 665.3]$.
  - Đi từ Đồng hồ quả lắc `(275.9, 545.8)` sang Hòm sắt `(1160.4, 611.7)`.
  - Walker đi thẳng cắt ngang chiều dài tủ vải trong **36 frame mẫu**.
- **Trạng thái:** **MỞ (OPEN - REGRESSION RED)**.
- **Bằng chứng:** `artifacts/c2-geometry/c2-geo-004-s2-safe-path-clipping.png`.
- **Đề xuất Core/FE:** Bổ sung điểm trung chuyển hành lang dưới ($y \ge 0.73$).

---

### 3.5. C2-GEO-005 (Major): An đứng quá sát Loan tại Bóng Ông Lệ (S3)
- **Vị trí:** `c2-s3-phong-trien-lam-doi-dau`.
- **Phân tích Hình học & Khoảng cách:**
  - Điểm dừng tiếp cận từ trái (cửa hành lang): Native An foot `(x: 359.5, y: 729.3)`.
  - Loan trong S3: Native foot `(x: 367.8, y: 677.5)`.
  - **Khoảng cách theo trục:**
    - Hoành độ: $\Delta x = |359.5 - 367.8| = 8.3\text{px}$.
    - Tung độ: $\Delta y = |729.3 - 677.5| = 51.8\text{px}$.
  - **Khoảng cách Euclidean:**
    $$d_{\text{Euclidean}} = \sqrt{(\Delta x)^2 + (\Delta y)^2} = \sqrt{(8.3)^2 + (51.8)^2} = \sqrt{68.89 + 2683.24} \approx 52.5\text{px}$$
  - **Phân tích Visible Bounding Boxes:**
    - Box Loan: $[x: 310.8, y: 293.5, w: 114, h: 384]$.
    - Box An (với chiều cao $411.5\text{px}$, rộng $\sim 186\text{px}$): $[x: 266.5, y: 317.8, w: 186, h: 411.5]$.
    - *Giao thoa phương ngang:* $[310.8, 424.8] \subset [266.5, 452.5] \implies$ **Trùng lặp 100% bề rộng Loan!**
    - *Giao thoa phương đứng:* $[317.8, 677.5] \implies$ **Trùng lặp $359.7\text{px}$ chiều cao!**
  - **Nhận định:** Dù khoảng cách Euclidean là $52.5\text{px}$ trên mặt sàn, do góc nhìn 2.5D và chiều cao sprite, An đứng chắn ngay trước mặt Loan, che lấp hầu như toàn bộ thân hình của NPC Loan.
- **Trạng thái:** **MỞ (OPEN - REGRESSION RED)**.
- **Bằng chứng:** `artifacts/c2-geometry/c2-geo-005-s3-ong-le-loan-overlap.png`.
- **Đề xuất FE:** Lùi điểm tiếp cận từ trái về $x \le 0.17$ (native $x \le 284\text{px}$) để đạt khoảng cách Euclidean $\ge 80\text{px}$ và không chồng visible bounds.

---

### 3.6. C2-GEO-006 (Medium / Observation): Cả Nghị & Vùng Bấm Đám Đông Phóng Viên (S3)
- **Vị trí:** `c2-s3-phong-trien-lam-doi-dau`.
- **Thực tế Hình học:**
  - Sprite Cả Nghị: `[x: 1197.0, y: 294.0, w: 114.0, h: 384.0]`.
  - Nút DOM `hitbox-reporters-crowd`: `[x: 1098.5, y: 414.0, w: 339.4, h: 367.0]`.
  - Hoành độ Cả Nghị $[1197, 1311]$ nằm lọt $100\%$ trong nút $[1098.5, 1437.9]$.
- **Đối chiếu Contract & Tác động UX:**
  - **Theo Contract:** C2 quy định NPC là render-only (`c2RoomNpcs`), tương tác hoàn toàn thông qua hotspots căn phòng. Về mặt Core logic, đây **không phải lỗi vi phạm hợp đồng**.
  - **Tác động UX:** Khi người chơi click vào nhân vật Cả Nghị, sự kiện Đám đông phóng viên được kích hoạt. Vì Cả Nghị là một phần của cảnh đối đầu phóng viên, hành vi này có thể chấp nhận được về mặt gameplay nhưng cần lưu ý nếu muốn tách riêng hội thoại độc lập cho Cả Nghị.
- **Trạng thái:** **QUAN SÁT / DESIGN NOTE (OBSERVATION)**.
- **Bằng chứng:** `artifacts/c2-geometry/c2-geo-006-s3-ca-nghi-reporters-crowd.png`.

---

### 3.7. C2-GEO-007 (Pass): Kích Thước Vùng Bấm Đa Viewport
- **Vị trí:** Cả 3 phòng (`c2-s1`, `c2-s2`, `c2-s3`).
- **Thực nghiệm:** Kiểm tra 11 Hotspots và các nút Exit trên cả 5 cấu hình Viewport (`1440×900`, `1280×720`, `390×844`, `844×390`, `768×1024`).
- **Kết quả:** Toàn bộ các nút đều đạt kích thước $\ge 43.5\text{px}$, tuân thủ cam kết WCAG touch ergonomics.
- **Trạng thái:** **ĐÃ ĐÓNG / ĐẠT (CLOSED / PASS)**.

---

### 3.8. C2-GEO-008 (Minor / Observation): Đổi Mục Tiêu Giữa Đường (Mid-walk Retargeting)
- **Hiện tượng:** Click mục tiêu mới khi đang di chuyển làm đổi vector tức thì từ tọa độ float hiện tại mà không có frame quay đầu hay giảm tốc; các lần click dồn dập $< 100\text{ms}$ bị nuốt lệnh.
- **Đối chiếu Contract:** Contract không quy định easing hay tweening cho walker.
- **Trạng thái:** **QUAN SÁT (OBSERVATION)** (Không áp đặt yêu cầu easing thành bug bắt buộc).

---

## 4. TÁCH BIỆT HAI TEST SUITES VÀ TRẠNG THÁI KIỂM THỬ

1. **Suite Tái hiện Bug (`tests/browser/c2-geometry-repro.spec.ts`):**
   - Khẳng định các điều kiện lỗi hiện hữu trên candidate.
   - **Kết quả:** `3 passed (39.2s)` $\implies$ Bằng chứng khách quan các bug C2-GEO-001 đến C2-GEO-006 đã được tái hiện 100%.

2. **Suite Chuẩn hóa Regression Hành vi Đúng (`tests/browser/c2-geometry.spec.ts`):**
   - Chứa assertion chuẩn hóa về hành vi đúng (0 clipping points, không bị che khuất, khoảng cách $\ge 60\text{px}$, không trùng visible bounds).
   - **Kết quả trên candidate hiện tại:** `5 FAILED (RED), 2 PASSED (GREEN) (1.4m)`
     - ❌ `S1: Walker route must not clip through drawing desk obstacle (C2-GEO-002)` $\implies$ **RED** (received 21 clipped points).
     - ❌ `S1: An arrived foot at french window must not be occluded behind Loan (C2-GEO-001)` $\implies$ **RED** (received overlap).
     - ❌ `S2: Walker route must not clip through fabric cabinet (C2-GEO-004)` $\implies$ **RED** (received 36 clipped points).
     - ❌ `S2: An arrived foot at silk shelves must maintain clearance from Loan (C2-GEO-003)` $\implies$ **RED** (received inside bounds).
     - ❌ `S3: An arrived foot at Ong Le shadow must maintain clearance & no box overlap (C2-GEO-005)` $\implies$ **RED** (received $\Delta x = 8.3\text{px}$).
     - ✅ `Multi-viewport Touch Targets >= 43.5px across all 5 viewports (C2-GEO-007)` $\implies$ **GREEN / PASS**.
     - ✅ `Mid-walk retargeting dynamics reaches destination (C2-GEO-008)` $\implies$ **GREEN / PASS**.

---

## 5. BÀN GIAO TIẾN ĐỘ VÀ CÁC BƯỚC TIẾP THEO

- **Các Bug Đang Mở (Chờ FE sửa layout/route):**
  - `C2-GEO-001` (S1 Loan che An)
  - `C2-GEO-002` (S1 Cắt xuyên Bàn vẽ)
  - `C2-GEO-003` (S2 Chồng lấn Loan)
  - `C2-GEO-004` (S2 Cắt xuyên Tủ vải)
  - `C2-GEO-005` (S3 Chồng lấn Loan ở bóng Ông Lệ)
- **Hành vi Quan sát / Thiết kế:**
  - `C2-GEO-006` (Cả Nghị render-only)
  - `C2-GEO-008` (Retargeting không easing)
- **Bug Đã Đóng / Đạt chuẩn:**
  - `C2-GEO-007` (Touch target sizing đa viewport)
- **Bước tiếp theo theo quy trình:**
  `Tester chuẩn hóa RED (ĐÃ XONG)` $\to$ `FE sửa route/layout` $\to$ `Core đối chiếu SHA FE` $\to$ `Leader tích hợp` $\to$ `Tester nghiệm thu lại (Chờ candidate SHA mới từ Leader)`.
