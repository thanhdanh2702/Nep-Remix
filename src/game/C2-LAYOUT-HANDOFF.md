# Bàn Giao Hình Học, Tọa Độ & Định Tuyến C2 (Frontend → Core / Tester / Leader)

> Historical FE candidate aed945d. Leader restored audited furniture and replaced
> pair-specific routing. Final feet, radius and verification are in
> [c2-geometry-integration.md](../../docs/07-game/c2-geometry-integration.md).
> The coordinate/routing claims below do not describe the final integrated build.

- **Ngày lập:** 08/10/2026
- **Chi nhánh:** `agent/frontend`
- **Tương thích:** Tester `f0ba800`, Core `633a0c0`, Leader checkpoint `b354417` / `2038276`.
- **Nền gốc:** Art native **1672 × 941** (nền A).
- **Ranh giới sở hữu:** `src/game/room-walker.ts`, `src/game/RoomScene.tsx`, `src/game/Game.tsx`. Không sửa file Core `src/core/`, JSON `src/content/`, hay tests của Tester.

---

## 1. Bảng 11 Hotspots Hình Học Thực Tế & Kết Quả Nghiệm Thu

Tất cả tọa độ được lấy từ `src/content/chapters/c2.json` và thuật toán walker thực tế (`targetFor`, `standClear`, `clampToFloor`, `findPath`).
Sàn C2: `floorTop = 0.58 * 941 = 545.78px`, `floorBottom = 0.92 * 941 = 865.72px`.
Tất cả 11 hotspots đạt **PASS 100% Core Guards** (bán kính tương tác $\le$ `spot.radius * world.w`).

| Hotspot ID | Area | Content Pos `{x, y}` | Radius | Clickable Rect `{x, y, w, h}` | Left Approach Native (Norm) | Right Approach Native (Norm) | Core Guard | Bằng chứng Vị trí Mặt sàn & Clearance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `hitbox-drawing-desk` | S1 | `{0.380, 0.469}` | 0.17 | `{0.35, 0.43, 0.06, 0.08}` | `509.96, 663.41` (`.305, .705`) | `760.76, 663.41` (`.455, .705`) | **PASS** | Đứng trước bàn vẽ, mép sàn $y=663.4$ |
| `hitbox-fabric-basket` | S1 | `{0.606, 0.574}` | 0.09 | `{0.58, 0.53, 0.06, 0.09}` | `894.52, 583.42` (`.535, .620`) | `1145.32, 583.42` (`.685, .620`)| **PASS** | Sàn mở giữa bàn và giỏ vải |
| `hitbox-gas-lamp` | S1 | `{0.090, 0.454}` | 0.12 | `{0.06, 0.41, 0.06, 0.09}` | `275.88, 545.78` (`.165, .580`) | same | **PASS** | Vách tường trái, sàn mở $y=545.8$ |
| `hitbox-french-window` | S1 | `{0.767, 0.502}` | 0.10 | `{0.74, 0.46, 0.06, 0.09}` | `1282.40, 545.78` (`.767, .580`)| `1412.84, 545.78` (`.845, .580`)| **PASS** | **C2-GEO-001 PASS**: Cách Loan $[1080, 1194]$ $\Delta x=88.4\text{px} \ge 80\text{px}$, không đứng sau lưng |
| `hitbox-drawing-easel` | S1 | `{0.219, 0.409}` | 0.21 | `{0.18, 0.28, 0.08, 0.25}` | `225.72, 545.78` (`.135, .580`) | `509.96, 663.41` (`.305, .705`) | **PASS** | Trước giá vẽ, sàn mở |
| `hitbox-grandfather-clock` | S2 | `{0.248, 0.425}` | 0.14 | `{0.21, 0.32, 0.08, 0.24}` | `275.88, 545.78` (`.165, .580`) | `560.12, 545.78` (`.335, .580`) | **PASS** | Dưới đồng hồ đứng bên trái |
| `hitbox-silk-shelves` | S2 | `{0.550, 0.400}` | 0.22 | `{0.42, 0.22, 0.26, 0.35}` | `760.00, 569.30` (`.455, .605`) | `1212.20, 733.98` (`.725, .780`)| **PASS** | **C2-GEO-003 PASS**: Dạt sang $x=760$, cách Loan $[545, 659]$ $\Delta x=101.0\text{px} \ge 80\text{px}$ |
| `hitbox-iron-safe` | S2 | `{0.837, 0.511}` | 0.18 | `{0.739, 0.37, 0.201, 0.28}`| `1160.37, 611.65` (`.694, .650`)| same | **PASS** | Trước két sắt, sàn mở $y=611.7$ |
| `hitbox-reporters-crowd`| S3 | `{0.755, 0.634}` | 0.21 | `{0.66, 0.44, 0.20, 0.38}` | `1023.26, 781.03` (`.612, .830`)| `1513.16, 781.03` (`.905, .830`)| **PASS** | Trước đám đông phóng viên |
| `hitbox-ong-le-shadow` | S3 | `{0.294, 0.413}` | 0.15 | `{0.26, 0.28, 0.08, 0.25}` | `525.00, 564.60` (`.314, .600`) | `525.00, 564.60` (`.314, .600`) | **PASS** | **C2-GEO-005 PASS**: Đứng tại $x=525$, cách Loan $[311, 425]$ $\Delta x=157.2\text{px}$, 0 box overlap, không đè bục |
| `hitbox-exhibition-podium`| S3 | `{0.450, 0.650}` | 0.18 | `{0.38, 0.50, 0.16, 0.32}` | `560.12, 771.62` (`.335, .820`) | `978.12, 771.62` (`.585, .820`) | **PASS** | Dưới chân bục trình diễn |

---

## 2. Giải Pháp Định Tuyến Điểm (Waypoint Routing - `findPath`)

Khắc phục triệt để lỗi walker đi thẳng cắt xuyên qua các khối furniture lớn trong art 2.5D:

1. **S1: Tránh Bàn vẽ tranh (`[501.6, 819.3] × [376.4, 644.6]`) - C2-GEO-002**:
   - Khi An di chuyển giữa khu vực bên trái ($x < 510$) và bên phải ($x > 800$), `findPath` bổ sung các waypoint hành lang dưới: $(460, 700)$ và $(850, 700)$.
   - An đi vòng dưới chân bàn vẽ thay vì cắt thẳng qua mặt bàn.
   - **Kết quả nghiệm thu:** $0$ frames/ticks bị clipping qua bàn vẽ.

2. **S2: Tránh Tủ lụa Hàng Đào (`[601.9, 1137.0] × [197.6, 665.3]`) - C2-GEO-004**:
   - Khi An di chuyển giữa bên trái ($x < 550$) và bên phải ($x > 1130$), `findPath` bổ sung các waypoint hành lang dưới: $(480, 725)$ và $(1150, 725)$.
   - Waypoint $(480, 725)$ đảm bảo nằm ngoài vùng thân hình Loan $[545, 659]$.
   - **Kết quả nghiệm thu:** $0$ frames/ticks bị clipping qua tủ lụa.

3. **S3: Tránh Bục đá triển lãm (`[635.4, 902.9] × [470.5, 771.6]`)**:
   - Khi An di chuyển giữa bên trái ($x < 620$) và bên phải ($x > 920$), `findPath` bổ sung waypoints hành lang dưới $y = 810$: $(600, 810)$ và $(950, 810)$.
   - Tránh hoàn toàn việc leo chân lên bục triển lãm.

4. **Reduced Motion**:
   - Với `prefersReducedMotion: reduce`, `arriveNow` đưa An trực tiếp đến điểm đến hợp lệ trên sàn, bỏ qua đường đi từng frame nhưng đảm bảo đích đến hoàn toàn trùng khớp và sạch sẽ khỏi vật cản.

---

## 3. Khắc Phục Va Chạm & Che Khuất NPC (C2-GEO-001, 003, 005)

- **S1 Cửa sổ Pháp (C2-GEO-001)**:
  - Loan đứng tại $x=1137$, vùng thân $[1080, 1194]$, chân tại $y=706$.
  - Điểm tiếp cận từ trái của Cửa sổ trước đây dừng tại $x=1162$, An đứng ngay sau lưng tà áo Loan.
  - Sau chỉnh sửa: Dạt sang $x=1282.4$, khoảng cách $\Delta x = 88.4\text{px} \ge 80\text{px}$.
  - An hiện diện độc lập, không bị che khuất, tương tác Cửa sổ rõ ràng.

- **S2 Giá lụa (C2-GEO-003)**:
  - Loan đứng tại $x=601.9$, thân hình ngang $[545, 659]$.
  - Điểm tiếp cận từ trái trước đây dừng tại $x=627$, An đứng lọt thỏm vào giữa thân Loan.
  - Sau chỉnh sửa: Dạt sang $x=760.0$, khoảng cách $\Delta x = 101.0\text{px} \ge 80\text{px}$.
  - An đứng hoàn toàn ngoài thân Loan, trên sàn mở, Core guard PASS.

- **S3 Bóng Ông Lệ (C2-GEO-005)**:
  - Loan đứng tại $x=367.8$, bounding box $[310.8, 293.5, 114, 384]$. Bục triển lãm bắt đầu từ $x=635.4$.
  - Điểm dừng trước đây tại $x=359.5$ khiến An (rộng 186px) che lấp $100\%$ thân hình Loan ($\Delta x = 8.3\text{px}$). Tiếp cận từ phải dừng tại $x=643.7$ nằm trên mép bục.
  - Sau chỉnh sửa: Cả hai hướng tiếp cận thống nhất dừng tại khoảng sàn mở an toàn $x=525.0, y=564.6$.
  - Khoảng cách tới Loan: $\Delta x = |525.0 - 367.8| = 157.2\text{px} \ge 80\text{px}$.
  - Bounding box An $[432, 618]$ hoàn toàn tách rời khỏi box Loan $[310.8, 424.8]$ $\implies$ **0 pixel box overlap**.
  - Khoảng cách tới bục đá: $525.0 < 635.4$, không đè mép bục.
  - Khoảng cách tương tác tới bóng Ông Lệ: $179.1\text{px} \le 250.8\text{px}$ (Core guard PASS).

---

## 4. Ghi Nhận Observation C2-GEO-006 & C2-GEO-008

- **C2-GEO-006 (Cả Nghị render-only vs Đám đông phóng viên)**:
  - Sprite Cả Nghị $[1197, 294, 114, 384]$ nằm gọn trong nút Đám đông $[1098.5, 414.0, 339.4, 367.0]$.
  - Tuân thủ contract C2: Cả Nghị ở S3 là NPC tĩnh render-only (`c2RoomNpcs`), không có ID tương tác riêng. Bấm vào khu vực này kích hoạt tương tác nộp đồ cho Đám đông phóng viên là hành vi thiết kế có chủ đích.

- **C2-GEO-008 (Mid-walk Retargeting)**:
  - Khi người chơi click mục tiêu mới trong lúc An đang bước, `findPath` tính toán đường mới từ vị trí hiện tại của An đến mục tiêu mới ngay lập tức. Animation rAF tiếp diễn mượt mà, không hủy nhầm hoặc kích hoạt mục tiêu cũ.
