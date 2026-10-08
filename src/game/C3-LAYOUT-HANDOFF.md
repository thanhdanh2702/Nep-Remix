# Bàn Giao Hình Học, Tọa Độ & Định Tuyến C3 (Frontend → Core / Tester / Leader)

- **Ngày lập / cập nhật:** 08/10/2026
- **Chi nhánh:** `agent/frontend`
- **Baseline chính thức hiện hành:** `c61d98fec539caec8d9481753247aeaaab16ca23` (chứa Checkpoint C runtime registry và Core M1 GREEN).
- **Nền gốc:** Art native **1672 × 941** (production assets theo manifest).
- **Ranh giới sở hữu:** Frontend sở hữu `src/game/` (`Game.tsx`, `RoomScene.tsx`, `room-render.ts`, `room-walker.ts`, `character-scale.ts`, `npc-portraits.ts`, `PuzzleModal.tsx`, `puzzle-actions.ts`, `bagua-puzzle.ts`, `puzzle.css`, `c3-*.test.ts`). Không tự ý sửa `src/core/`, `src/content/chapters/c3.json`, schema, catalogs hay test suites của Tester.
- **Trạng thái tích hợp:** **ĐỀ XUẤT HÌNH HỌC ĐÃ ĐỐI CHIẾU 100% VỚI COMPUTED ARRIVALS CỦA SNAPSHOT LEADER (`c3-geometry-review-input.json`) — CHỜ CORE CẬP NHẬT `c3.json`.**
- **Trạng thái M1 / Registry:** **ĐÃ GIẢI TỎA BLOCKER M1 & REGISTRY** (Core M1 đã GREEN với 101/101 test; Checkpoint C đã có sẵn tại baseline).
- **Trạng thái Git:** **UNCOMMITTED** (giữ nguyên không commit/push khi chưa có quyền).

---

## 1. Tỷ Lệ Nhân Vật & Mặt Sàn (Character Scale & Floor Math)

- **Kích thước canvas thế giới:** $W = 1672\text{ px}$, $H = 941\text{ px}$.
- **Khung sprite nhân vật:** $176 \times 416\text{ px}$, anchor engine $[88, 400]$, visible figure height $384\text{ px}$.
- **Scale NPC manifest:** Scale $1.35$ áp dụng đúng một lần trong renderer C3 (`c3RoomNpcs` / `sceneActors`):
  $$\text{Visible NPC Height} = 384\text{ px} \times 1.35 = 518.4\text{ px}$$
- **Tỷ lệ nhân vật An trên cùng mặt phẳng:**
  - Chiều cao vẽ của An trong cell là $389\text{ art px}$.
  - Để đảm bảo chiều cao nhìn thấy tương thích với NPC trên cùng mặt sàn ($518.4\text{ px}$):
    $$\text{Scale An} = \frac{518.4}{389} \approx 1.3326478$$
    $$\text{Target Height Ratio} = \frac{518.4}{941} \approx 0.5509033$$
- **Dải sàn di chuyển C3 (`HUMAN_HEIGHT['c3']`):**
  - `floorTop = 0.68` ($639.88\text{ px}$)
  - `floorBottom = 0.92` ($865.72\text{ px}$)
  - `back = 518.4 / 941 \approx 0.5509033`, `front = 518.4 / 941 \approx 0.5509033`.

---

## 2. Bảng 11 Interactables Thực Tế Trong `c3.json` — Xuất Trực Tiếp Từ `computedArrivals`

> **LƯU Ý CỐT LÕI VỀ TÍNH TOÁN:**
> Các số chân đến walker $[x, y]$ và khoảng cách trong bảng dưới đây được xuất trực tiếp từ thuật toán `targetFor` $\rightarrow$ `standClear` $\rightarrow$ `findPath` (khớp hoàn toàn với snapshot `computedArrivals` tại `docs/07-game/c3-geometry-review-input.json`), loại bỏ hoàn toàn các sai lệch do nhập tay hoặc làm tròn trước đây.
>
> **LƯU Ý VỀ VISUAL SIGNOFF:**
> Kiểm tra số học (arithmetic clearance) và tính khả thi hình học chỉ chứng minh rằng nhân vật không bị kẹt vật cản và nằm trong bán kính tương tác của engine. **ĐÂY CHƯA PHẢI LÀ VISUAL SIGNOFF.** Visual signoff trên sàn vẽ thực tế (painted floor) và kiểm tra phân lớp che khuất (occlusion) cần được thực hiện qua browser check trực quan.

### Công thức chuyển đổi tọa độ & Engine Metric:
- $x_{\text{norm}} = \frac{x_{\text{native}}}{1672}$, $y_{\text{norm}} = \frac{y_{\text{native}}}{941}$
- Metric khoảng cách Core guard: $\text{dist} = \sqrt{\left((p_x - h_x) \times 800\right)^2 + \left((p_y - h_y) \times 500\right)^2} \le \text{radius} \times 800$

### Bảng chi tiết 11 interactables:

| # | ID Hotspot | Cảnh | Hành Động | Tọa độ Native Đề Xuất $\{x, y\}$ | Tọa độ Norm Đề Xuất $\{x, y\}$ | Hit Rect Native $[x, y, w, h]$ | Hit Rect Normalized | Bán kính Radius | Tiếp cận Trái (Native) | Tiếp cận Phải (Native) | Chân đến Walker L / R (Native) | Khoảng cách L / R (Native) | Trạng thái Proximity |
| :-: | :--- | :-: | :--- | :--- | :--- | :--- | :--- | :-: | :--- | :--- | :--- | :--- | :---: |
| 1 | `hitbox-fabric-attic` | S1 | Item `bien_nhan_tien_thay_boi` | `[1246, 550]` | `{0.7452, 0.5845}` | `[1180, 460, 130, 180]` | `{0.706, 0.489, 0.078, 0.191}` | 0.19 (152px) | `[1140, 790]` | `[1350, 790]` | `[1104.76, 640.00]` / `[1385.24, 790.44]` | 82.8px / 144.1px | **PASS** ($\le 152\text{px}$) |
| 2 | `hitbox-c3-read-receipt` | S1 | Dialogue `d-c3-mua-chuoc` | `[1246, 550]` | `{0.7452, 0.5845}` | `[1180, 460, 130, 180]` | `{0.706, 0.489, 0.078, 0.191}` | 0.19 (152px) | `[1140, 790]` | `[1350, 790]` | `[1104.76, 640.00]` / `[1385.24, 790.44]` | 82.8px / 144.1px | **PASS** ($\le 152\text{px}$) |
| 3 | `hitbox-gramophone` | S1 | Dialogue `d-c3-gramophone` | `[1420, 600]` | `{0.8493, 0.6376}` | `[1350, 500, 140, 180]` | `{0.807, 0.531, 0.084, 0.191}` | 0.16 (128px) | `[1350, 790]` | `[1480, 790]` | `[1274.76, 790.44]` / `[1565.24, 680.00]` | 122.8px / 81.5px | **PASS** ($\le 128\text{px}$) |
| 4 | `hitbox-street-exit` | S1 | Dialogue `d-c3-street-exit` | `[880, 780]` | `{0.5263, 0.8289}` | `[752, 750, 250, 170]` | `{0.450, 0.797, 0.150, 0.181}` | 0.15 (120px) | `[820, 820]` | `[940, 820]` | `[676.76, 865.72]` / `[1077.24, 865.72]` | 107.4px / 104.8px | **PASS** ($\le 120\text{px}$) |
| 5 | `hitbox-incense-bowl` | S2 | Dialogue `d-c3-incense-smoke` | `[580, 620]` | `{0.3469, 0.6589}` | `[480, 500, 180, 160]` | `{0.287, 0.531, 0.108, 0.170}` | 0.16 (128px) | `[480, 795]` | `[680, 795]` | `[404.76, 660.00]` / `[735.24, 660.00]` | 86.5px / 77.3px | **PASS** ($\le 128\text{px}$) |
| 6 | `hitbox-bagua-mirror` | S2 | Dialogue `d-c3-bagua` | `[990, 580]` | `{0.5921, 0.6164}` | `[900, 480, 180, 170]` | `{0.538, 0.510, 0.108, 0.181}` | 0.18 (144px) | `[880, 795]` | `[1040, 795]` | `[824.76, 781.03]` / `[1155.24, 781.03]` | 132.9px / 132.9px | **PASS** ($\le 144\text{px}$) |
| 7 | `hitbox-bagua-chest` | S2 | Puzzle `p-c3-bagua-lock` | `[1190, 580]` | `{0.7117, 0.6164}` | `[1080, 420, 220, 230]` | `{0.646, 0.446, 0.132, 0.244}` | 0.19 (152px) | `[1080, 795]` | `[1260, 795]` | `[1004.76, 781.03]` / `[1375.24, 650.00]` | 138.8px / 96.1px | **PASS** ($\le 152\text{px}$) |
| 8 | `hitbox-salon-table` | S3 | Puzzle `p-c3-present-evidence` | `[840, 620]` | `{0.5024, 0.6589}` | `[680, 480, 320, 260]` | `{0.407, 0.510, 0.191, 0.276}` | 0.19 (152px) | `[750, 840]` | `[920, 840]` | `[604.76, 799.85]` / `[1075.24, 740.00]` | 147.7px / 129.4px | **PASS** ($\le 152\text{px}$) |
| 9 | `hitbox-c3-read-revision`| S3 | Dialogue `d-c3-ban-sua` | `[840, 620]` | `{0.5024, 0.6589}` | `[750, 480, 260, 240]` | `{0.449, 0.510, 0.155, 0.255}` | 0.19 (152px) | `[750, 840]` | `[920, 840]` | `[674.76, 799.85]` / `[1085.24, 720.00]` | 124.0px / 128.8px | **PASS** ($\le 152\text{px}$) |
| 10 | `hitbox-vinh-support` | S3 | Dialogue `d-c3-vinh-stand` | `[480, 740]` | `{0.2871, 0.7864}` | `[400, 420, 160, 390]` | `{0.239, 0.446, 0.096, 0.414}` | 0.16 (128px) | `[380, 820]` | `[580, 820]` | `[324.76, 810.00]` / `[635.24, 810.00]` | 83.1px / 83.1px | **PASS** ($\le 128\text{px}$) |
| 11 | `hitbox-styling-mai` | S3 | Puzzle `p-c3-styling-mai` | `[780, 740]` | `{0.4665, 0.7864}` | `[700, 420, 160, 390]` | `{0.419, 0.446, 0.096, 0.414}` | 0.16 (128px) | `[680, 825]` | `[880, 825]` | `[624.76, 810.00]` / `[935.24, 810.00]` | 83.1px / 83.1px | **PASS** ($\le 128\text{px}$) |

---

## 3. Cơ Sở Nghệ Thuật & Tiếp Cận Cho Từng Interactable (Art & Approach Rationale)

Bán kính (radius) và kích thước vùng bấm (rect) không được chọn ngẫu nhiên để che giấu điểm đến sai, mà được xác định dựa trên đối tượng mỹ thuật (art asset) và không gian tiếp cận tự nhiên của nhân vật An:

1. **`hitbox-fabric-attic` & `hitbox-c3-read-receipt` (S1):**
   - **Art Object:** Ngăn kéo bàn cắt và kệ cuộn vải gác lửng góc phải tiệm Đa Kao ($x \in [1180, 1310], y \in [460, 640]$).
   - **Rect $130 \times 180\text{ px}$:** Ôm trọn ngăn kéo đựng biên lai và phần mép kệ vải.
   - **Radius $0.19$ ($152\text{ px}$):** Cho phép An đứng tiếp cận từ mép trái bàn cắt ($x \approx 1105$) hoặc phía góc phải ($x \approx 1385$), cả hai góc nhìn đều hướng thẳng vào ngăn kéo mà không va chạm chân bàn.
2. **`hitbox-gramophone` (S1):**
   - **Art Object:** Máy hát đĩa cổ đặt trên đôn gỗ sát tường phải ($x \in [1350, 1490], y \in [500, 680]$).
   - **Rect $140 \times 180\text{ px}$:** Bao quanh thùng máy loa kèn và đôn gỗ.
   - **Radius $0.16$ ($128\text{ px}$):** Vừa vặn để An đứng ở khoảng trống trước đôn ($x \approx 1275$) hoặc ngách góc tường ($x \approx 1565$) để thưởng thức/tương tác với máy hát mà không đè lên đôn.
3. **`hitbox-street-exit` (S1):**
   - **Art Object:** Vòm cửa chính tiệm may mở ra đường phố Đa Kao ($x \in [752, 1002], y \in [750, 920]$).
   - **Rect $250 \times 170\text{ px}$:** Bao phủ toàn bộ bậc thềm cửa mở ra đường.
   - **Radius $0.15$ ($120\text{ px}$):** Cho phép người chơi click vào bất kỳ vị trí nào trên bậc thềm cửa; An bước tới chân thềm ($y \approx 865.7$) để đọc thoại suy ngẫm trước khi chuyển cảnh sang phòng phong thủy.
4. **`hitbox-incense-bowl` (S2):**
   - **Art Object:** Bát hương và lư đồng trên bàn thờ phong thủy bên trái phòng ($x \in [480, 660], y \in [500, 660]$).
   - **Rect $180 \times 160\text{ px}$:** Bao quanh bát hương nghi ngút khói và đồ tế tự.
   - **Radius $0.16$ ($128\text{ px}$):** Đảm bảo An đứng trang nghiêm ở phía trước bàn thờ bên trái ($x \approx 405$) hoặc bên phải ($x \approx 735$), giữ khoảng cách kính cẩn với ban thờ.
5. **`hitbox-bagua-mirror` (S2):**
   - **Art Object:** Gương Bát Quái treo tường phía trên án thư giữa phòng ($x \in [900, 1080], y \in [480, 650]$).
   - **Rect $180 \times 170\text{ px}$:** Bao trọn khung gương Bát Quái bát giác và các dải linh phù.
   - **Radius $0.18$ ($144\text{ px}$):** Do gương treo cao trên tường, radius $144\text{ px}$ cho phép An đứng ngước nhìn gương từ cả hai bên án thư ($x \approx 825$ hoặc $x \approx 1155$).
6. **`hitbox-bagua-chest` (S2):**
   - **Art Object:** Rương gỗ mun khóa Bát Quái đặt bên phải án thư ($x \in [1080, 1300], y \in [420, 650]$).
   - **Rect $220 \times 230\text{ px}$:** Bao trọn nắp rương và ổ khóa vòng Bát Quái.
   - **Radius $0.19$ ($152\text{ px}$):** Cho phép An đứng tiếp cận trực diện mặt trước rương ($x \approx 1005$) hoặc bên hông phải rương ($x \approx 1375$) để giải câu đố ổ khóa.
7. **`hitbox-salon-table` & `hitbox-c3-read-revision` (S3):**
   - **Art Object:** Bàn trà đàm phán bằng cẩm thạch trung tâm dinh thự ($x \in [680, 1000], y \in [480, 740]$) và tập hồ sơ bản sửa đặt trên mặt bàn ($x \in [750, 1010], y \in [480, 720]$).
   - **Rect $320 \times 260\text{ px}$ / $260 \times 240\text{ px}$:** Bao phủ toàn bộ mặt bàn nơi trình chứng cứ.
   - **Radius $0.19$ ($152\text{ px}$):** An đứng ở mép trái bàn ($x \approx 605$) hoặc mép phải bàn ($x \approx 1075$), đối diện trực tiếp với Bà Lớn và Vinh trên bàn đàm phán.
8. **`hitbox-vinh-support` (S3):**
   - **Art Object:** Nhân vật Vinh đứng bên cánh trái sảnh dinh thự ($x \in [400, 560], y \in [420, 810]$).
   - **Rect $160 \times 390\text{ px}$:** Bao trọn vóc dáng Vinh.
   - **Radius $0.16$ ($128\text{ px}$):** Cho phép An đứng bên cạnh Vinh ($x \approx 325$ hoặc $x \approx 635$) cùng nhìn về phía Bà Lớn, không đè lấn sprite của nhau.
9. **`hitbox-styling-mai` (S3):**
   - **Art Object:** Nhân vật Bà Mai đứng giữa sảnh dinh thự ($x \in [700, 860], y \in [420, 810]$).
   - **Rect $160 \times 390\text{ px}$:** Bao trọn vóc dáng Bà Mai.
   - **Radius $0.16$ ($128\text{ px}$):** Cho phép An đứng sát Bà Mai ($x \approx 625$ hoặc $x \approx 935$) để hỗ trợ thử trang phục may đo áo dài Raglan.

---

## 4. Chốt Cơ Chế Spawn & Chuyển Cảnh S1, S2, S3 (Spawn, Exits & Transitions)

### A. Phân định rõ Code hiện tại vs Đề xuất Đích Thực (Code Clamp vs Target Proposal):
1. **Thực tế trong code runtime hiện hành (`c3.json` hiện tại):**
   - `c3.json` hiện khai báo `spawn: { x: 0.1, y: 0.6 }` cho cả S2 và S3, và `{ x: 0.15, y: 0.5 }` cho S1.
   - Khi `RoomScene.tsx` tải phòng lần đầu (hoặc khi resume/load game mà không có lịch sử phòng trước):
     - Vị trí $y$ bị `clampToFloor` đẩy lên mép trên sàn `floorTop = 0.68 * 941 = 639.88px`.
     - Sau đó `standClear` xử lý va chạm:
       - **S1:** Tọa độ ban đầu $[250.8, 639.88]$ rơi vào hộp vật cản bàn may $\rightarrow$ `standClear` tự động đẩy chân An xuống vùng sàn thoáng tại $[250.8, 790.44]$ (normalized $\{0.150, 0.840\}$).
       - **S2:** Tại $x = 167.2$, mép trên sàn $y = 639.88$ không có vật cản $\rightarrow$ An đứng tại $[167.2, 639.88]$ (normalized $\{0.100, 0.680\}$).
       - **S3:** Tại $x = 167.2$, mép trên sàn $y = 639.88$ không có vật cản $\rightarrow$ An đứng tại $[167.2, 639.88]$ (normalized $\{0.100, 0.680\}$).
2. **Đề xuất đích thực theo Art (Target Proposal gửi Core cập nhật `c3.json`):**
   - Trên hình nền vẽ thực tế (art background), dải đi bộ thoải mái ngang tầm chân NPC:
     - S2: Thầy Ba Càn đứng ở $y = 795\text{ px}$. Đề xuất normalized spawn S2 là `{ x: 0.10, y: 0.845 }` (tương đương $[167.2, 795.15]$).
     - S3: Vinh và Bà Lớn đứng ở $y = 820\text{ px}$. Đề xuất normalized spawn S3 là `{ x: 0.10, y: 0.871 }` (tương đương $[167.2, 819.61]$).
   - *Core có thể giữ nguyên $\{0.1, 0.6\}$ (chạy an toàn ở $y = 639.88$) hoặc cập nhật sang $\{0.10, 0.845\}$ / $\{0.10, 0.871\}$ để An xuất hiện ở giữa sàn vẽ.*

### B. Bảng Mũi Tên Thoát & Chân Đến Chuyển Cảnh (`c3ExitArrows` & Transitions):

Khi người chơi chuyển phòng trong game thông qua mũi tên thoát, `RoomScene.tsx` tìm mũi tên dẫn về phòng vừa rời và đặt An tại điểm đến chuyển cảnh (`entryPoint` $\rightarrow$ `clampToFloor` $\rightarrow$ `standClear`):

| Chuyển Cảnh | Phòng Đích | Mũi Tên Thoát Tương Ứng | Hướng Arrow | Rect Mũi Tên Native | Rect Normalized | Chân Đến Walker Khi Vào Phòng (Native) | Chân Đến Normalized | Trạng Thái Định Tuyến |
| :--- | :--- | :--- | :-: | :--- | :--- | :--- | :--- | :---: |
| S1 $\rightarrow$ S2 (Tiến) | S2 (`phong-phong-thuy`) | `back` (về S1) | `left` | `[0, 517.5, 133.8, 329.4]` | `{0.00, 0.55, 0.08, 0.35}` | `[83.60, 639.88]` | `{0.050, 0.680}` | **PASS** (Clear path tới rương Bát Quái) |
| S3 $\rightarrow$ S2 (Lùi) | S2 (`phong-phong-thuy`) | `mansion` (sang S3) | `right` | `[1538.2, 517.5, 133.8, 329.4]` | `{0.92, 0.55, 0.08, 0.35}` | `[1588.40, 639.88]` | `{0.950, 0.680}` | **PASS** (Clear path tới rương Bát Quái) |
| S2 $\rightarrow$ S3 (Tiến) | S3 (`dinh-thu-doi-dau`) | `back` (về S2) | `left` | `[0, 517.5, 133.8, 329.4]` | `{0.00, 0.55, 0.08, 0.35}` | `[83.60, 639.88]` | `{0.050, 0.680}` | **PASS** (Clear path tới bàn đàm phán) |
| S2 $\rightarrow$ S1 (Lùi) | S1 (`tiem-may-da-kao`) | `street` (ra S2) | `right` | `[1504.8, 517.5, 133.8, 329.4]` | `{0.90, 0.55, 0.08, 0.35}` | `[1571.68, 639.88]` | `{0.940, 0.680}` | **PASS** (Clear path tới bàn thợ may) |

### C. Cơ chế Khôi Phục Game (Resume / Reload State):
- Khi nạp lại bản lưu (Save/Load hoặc reload page) tại một cảnh, hệ thống không có lịch sử phòng trước (`prevArea.current = null`), do đó sẽ tự động dùng vị trí **Fallback Spawn** từ `c3.json`.
- Tất cả các điểm fallback spawn và transition entries đều được kiểm tra bằng unit test (`c3-layout.test.ts`), chứng minh 100% có đường đi thông suốt (`findPath !== null`) tới mọi interactable trong phòng.

---

## 5. Nhân Vật Hiện Trường (`c3RoomNpcs`) — Khớp 100% Manifest & Code

Tất cả nhân vật sử dụng asset production từ `assets/characters/` theo đúng manifest, tuyệt đối không dùng file `_raw`:
- **Bà Mai:** Tóc bob ngắn ôm gáy, rẽ lệch, hiện đại.
- **Bà Lớn:** Tóc rẽ giữa búi thấp, sợi bạc thái dương, trang trọng, trưởng thành.
- **Thầy Ba Càn:** Nam lớn tuổi, áo dài xám cũ, người bình thường.
- **Vinh:** Tóc rẽ ngôi, áo lam khói, phong thái hỗ trợ.

### Chi tiết các cảnh và pose:
- **S1 (Tiệm may Đa Kao):**
  - Bà Mai: Chân native $[350, 790]$, visible bounds $[270, 272, 428, 791]$.
    Path: `assets/characters/ba-mai/scene-tailor.png` (dáng may đo áo, kéo thước).
- **S2 (Phòng phong thủy):**
  - Thầy Ba Càn: Chân native $[580, 795]$, visible bounds $[498, 277, 662, 796]$.
    - Trước khi giải P1: `assets/characters/thay-ba-can/scene-idle.png`.
    - Sau khi giải P1: `assets/characters/thay-ba-can/scene-anxious.png`.
- **S3 (Dinh thự đối đầu):**
  - Vinh: Chân native $[480, 820]$, visible bounds $[388, 302, 571, 821]$.
    - Trước khi giải P2: `assets/characters/vinh/scene-idle.png`.
    - Sau khi giải P2: `assets/characters/vinh/scene-witness.png` (làm chứng).
    *(Lưu ý: Vinh KHÔNG CÓ `scene-relieved.png`).*
  - Bà Mai: Chân native $[780, 825]$, visible bounds $[680, 307, 879, 826]$.
    - Trước khi styling (P3): `assets/characters/ba-mai/scene-speak.png` (đối chất).
    - Sau khi hoàn tất styling (P3): `assets/characters/ba-mai/scene-relieved.png` (nhẹ nhõm).
    *(Lưu ý: Mai KHÔNG CÓ `scene-reflective.png`).*
  - Bà Lớn: Chân native $[1170, 820]$, visible bounds $[1085, 302, 1255, 821]$.
    - Trước khi giải P2: `assets/characters/ba-lon/scene-stern.png` (nghiêm nghị).
    - Sau khi giải P2: `assets/characters/ba-lon/scene-reflective.png` (nhìn nhận chứng cứ).

---

## 6. Vật Cản, Vùng Chân NPC & Định Tuyến Walker (`room-walker.ts`)

### A. Vật cản nội thất (`OBSTACLES`):
- **S1 (`c3-s1-tiem-may-da-kao`):**
  - Bàn máy may: Normalized `{ x: 0.12, y: 0.50, w: 0.17, h: 0.32 }` $\rightarrow$ Native $[200.6, 470.5, 284.2, 301.1]$.
  - Bàn cắt may lớn: Normalized `{ x: 0.68, y: 0.48, w: 0.21, h: 0.34 }` $\rightarrow$ Native $[1137.0, 451.7, 351.1, 319.9]$.
- **S2 (`c3-s2-phong-phong-thuy`):**
  - Bàn thờ kinh dịch: Normalized `{ x: 0.275, y: 0.48, w: 0.145, h: 0.34 }` $\rightarrow$ Native $[459.8, 451.7, 242.4, 319.9]$.
  - Bàn đọc sách: Normalized `{ x: 0.44, y: 0.45, w: 0.19, h: 0.36 }` $\rightarrow$ Native $[735.7, 423.5, 317.7, 338.8]$.
  - Rương Bát Quái: Normalized `{ x: 0.63, y: 0.45, w: 0.18, h: 0.36 }` $\rightarrow$ Native $[1053.4, 423.5, 301.0, 338.8]$.
- **S3 (`c3-s3-dinh-thu-doi-dau`):**
  - Bàn đàm phán dinh thự: Normalized `{ x: 0.36, y: 0.48, w: 0.28, h: 0.35 }` $\rightarrow$ Native $[601.9, 451.7, 468.2, 329.4]$.

### B. Vùng chân đứng của NPC (`NPC_FEET`):
- **S1:** Bà Mai: Native $[293, 750, 114, 45]$ (chân $[350, 790]$).
- **S2:** Thầy Ba Càn: Native $[523, 755, 114, 45]$ (chân $[580, 795]$).
- **S3:**
  - Vinh: Native $[423, 780, 114, 45]$ (chân $[480, 820]$).
  - Bà Mai: Native $[723, 785, 114, 45]$ (chân $[780, 825]$).
  - Bà Lớn: Native $[1113, 780, 114, 45]$ (chân $[1170, 820]$).

### C. Định tuyến di chuyển (`findPath` & `standClear`):
- Thuật toán cắt đoạn (slab clipping) và kiểm tra biên float ($10^{-4}$ tolerance) chứng minh:
  - Mọi route segment đều né hoàn toàn các hộp vật cản nội thất.
  - Toàn bộ waypoints nằm trong dải sàn $y \in [639.88, 865.72]\text{ px}$.
  - `standClear` tự động đẩy tọa độ chạm vật cản ra vị trí sàn mở an toàn.

---

## 7. Overlays Hiện Trường (`c3AreaOverlays`)

Tất cả overlays tuân thủ đúng ID vật phẩm trong hợp đồng và manifest:
- **S1:**
  - `bien-nhan`: File `c3-s1-tiem-may-da-kao--bien-nhan.png`.
    - Item ID: `bien_nhan_tien_thay_boi` (khớp hợp đồng).
    - Tọa độ manifest: `topLeft: [1210, 473]`, `visibleBounds: [1210, 473, 1282, 489]`.
    - Ẩn khi `inventoryItemIds.includes('bien_nhan_tien_thay_boi')`.
  - `giay-doi-chieu`: File `c3-s1-tiem-may-da-kao--giay-doi-chieu.png`, `topLeft: [1320, 475]`, luôn hiển thị.
- **S2:**
  - `ghi-chu-khoa`: File `c3-s2-phong-phong-thuy--ghi-chu-khoa.png`, `topLeft: [990, 408]`, luôn hiển thị.
  - `ruong-rong`: File `c3-s2-phong-phong-thuy--ruong-rong.png`, ROI `[1050, 270, 1335, 474]`.
    - Hiển thị khi `solvedPuzzleIds.includes('p-c3-bagua-lock')`.
    - **Quyết định hợp đồng:** Giải P1 cấp nguyên tử cả hai giấy `so_tu_vi_nguyen_ban_1962` và `thu_tay_thoa_thuan_boi_toan`; rương chuyển thẳng thành rỗng. Giữ `--ruong-mo.png` trong kho art nhưng không dùng làm persistent world state; không tạo state nhặt rời từng giấy.
- **S3:**
  - `ho-so-goc`: `c3-s3-dinh-thu-doi-dau--ho-so-goc.png`, `topLeft: [640, 457]`.
  - `thu-doi-chieu`: `c3-s3-dinh-thu-doi-dau--thu-doi-chieu.png`, `topLeft: [840, 450]`.
  - `ban-sua`: `c3-s3-dinh-thu-doi-dau--ban-sua.png`, `topLeft: [970, 451]`.

---

## 8. Đề Xuất Delta Cụ Thể Gửi Core Để Cập Nhật `src/content/chapters/c3.json`

Backend/Core sở hữu `src/content/chapters/c3.json`. Frontend bàn giao patch delta hình học 11 interactables và spawn như sau:

```json
{
  "c3-s1-tiem-may-da-kao": {
    "hitbox-fabric-attic":    { "pos": { "x": 0.7452, "y": 0.5845 }, "radius": 0.19, "rect": { "x": 0.706, "y": 0.489, "w": 0.078, "h": 0.191 } },
    "hitbox-c3-read-receipt": { "pos": { "x": 0.7452, "y": 0.5845 }, "radius": 0.19, "rect": { "x": 0.706, "y": 0.489, "w": 0.078, "h": 0.191 } },
    "hitbox-gramophone":      { "pos": { "x": 0.8493, "y": 0.6376 }, "radius": 0.16, "rect": { "x": 0.807, "y": 0.531, "w": 0.084, "h": 0.191 } },
    "hitbox-street-exit":     { "pos": { "x": 0.5263, "y": 0.8289 }, "radius": 0.15, "rect": { "x": 0.450, "y": 0.797, "w": 0.150, "h": 0.181 } }
  },
  "c3-s2-phong-phong-thuy": {
    "hitbox-incense-bowl":    { "pos": { "x": 0.3469, "y": 0.6589 }, "radius": 0.16, "rect": { "x": 0.287, "y": 0.531, "w": 0.108, "h": 0.170 } },
    "hitbox-bagua-mirror":    { "pos": { "x": 0.5921, "y": 0.6164 }, "radius": 0.18, "rect": { "x": 0.538, "y": 0.510, "w": 0.108, "h": 0.181 } },
    "hitbox-bagua-chest":     { "pos": { "x": 0.7117, "y": 0.6164 }, "radius": 0.19, "rect": { "x": 0.646, "y": 0.446, "w": 0.132, "h": 0.244 } },
    "spawn_proposal":         { "x": 0.10, "y": 0.845 }
  },
  "c3-s3-dinh-thu-doi-dau": {
    "hitbox-salon-table":     { "pos": { "x": 0.5024, "y": 0.6589 }, "radius": 0.19, "rect": { "x": 0.407, "y": 0.510, "w": 0.191, "h": 0.276 } },
    "hitbox-c3-read-revision":{ "pos": { "x": 0.5024, "y": 0.6589 }, "radius": 0.19, "rect": { "x": 0.449, "y": 0.510, "w": 0.155, "h": 0.255 } },
    "hitbox-vinh-support":    { "pos": { "x": 0.2871, "y": 0.7864 }, "radius": 0.16, "rect": { "x": 0.239, "y": 0.446, "w": 0.096, "h": 0.414 } },
    "hitbox-styling-mai":     { "pos": { "x": 0.4665, "y": 0.7864 }, "radius": 0.16, "rect": { "x": 0.419, "y": 0.446, "w": 0.096, "h": 0.414 } },
    "spawn_proposal":         { "x": 0.10, "y": 0.871 }
  }
}
```
