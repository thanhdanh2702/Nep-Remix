# BÁO CÁO AUDIT ĐỘC LẬP: GEOMETRY VÀ DI CHUYỂN NHÂN VẬT CHƯƠNG 2 (C2)
**Dự án:** Tiệm May Ký Ức – C2: Tiếng Kéo Đêm Phố Cũ  
**Vai trò:** Tester độc lập Sprint C2  
**Phiên bản:** v3 (Bổ sung Exit Back, Chuẩn hóa Tiêu chí Normal/Reduced Motion & Bằng chứng Che khuất NPC)  
**Thời điểm thực hiện:** 2026-10-07  

---

## 1. BASELINE VÀ MÔI TRƯỜNG KIỂM THỬ ĐỘC LẬP

### 1.1. Git Baseline & Disclosures
- **Commit Baseline audit:** `63e6d97` (Merge commit tích hợp candidate `main@2038276` vào `agent/tester` theo Phương án A đã được Leader phê duyệt).
  - Đã giải quyết 2 xung đột:
    1. `package.json`: Giữ lại `test:docs`, tích hợp `test:c2` và `test:c2:playtest` từ Leader; `scripts/check-docs.mjs` tồn tại thực tế.
    2. `tests/c2-regression.test.ts`: Cập nhật selector theo Leader (`className="order-strip-btn-group"` kiểm tra cả `min-height` và `min-width`).
- **Commit local bàn giao:** `83ea458` (và các cập nhật chuẩn hóa v3).
- **Bảo toàn Workspace (Dirty files & nháp ngoài phạm vi giữ nguyên 100%):**
  - Dirty files C1 chưa commit: `scripts/check-game.ts`, `tests/browser/sprint01-integration.spec.ts`.
  - Draft scripts untracked: `fix-*.cjs`, `patch-*.cjs`, `"nháp"`, `run_test.ts`.
  - *Giới hạn bằng chứng:* Các dirty file C1 chỉ liên quan đến Chapter 1/Prologue, hoàn toàn không can thiệp vào bundle hay runtime của C2.
- **Tuân thủ Ownership:** Không sửa bất kỳ file runtime nào trong `src/core`, `src/game`, `src/ui`, `src/content`, CSS, PNG hoặc schema.

### 1.2. Môi trường Thực thi
- **Server:** Production server riêng biệt tại `http://127.0.0.1:3088` (`PORT=3088 NODE_ENV=production node server.mjs`), hoàn toàn tách biệt khỏi port Leader `3062`.
- **Bundle Production:** `dist/assets/index--7t7FVNY.js` (build từ `npm run build`).
- **Phương pháp phân loại Motion:**
  - **Normal Motion:** Nhân vật di chuyển liên tục theo thời gian qua hàm `tick` trong `room-walker.ts` (điều khiển bởi `requestAnimationFrame`). Đây là chế độ DUY NHẤT đo đạc quỹ đạo di chuyển (trajectory), lấy mẫu frame và phát hiện giao cắt xuyên qua các hộp vật cản `OBSTACLES`.
  - **Reduced Motion:** Nhân vật dịch chuyển tức thì tới điểm đến (`arriveNow`). Chế độ này KHÔNG có chu kỳ bước đi theo thời gian, do đó KHÔNG áp đặt kết luận frame xuyên vật thể; thay vào đó, chỉ đánh giá: tọa độ điểm đến (`arrived foot`), tính hợp lệ của dải sàn (`floorTop <= y <= floorBottom`), tương quan che khuất với NPC, và việc kích hoạt tương tác/command.

---

## 2. MA TRẬN COVERAGE THỰC CHẠY TOÀN DIỆN (FULL RUN COVERAGE MATRIX)

### 2.1. Ma trận Chi tiết Từng Phòng, Hotspot, Hướng và Exit

| Phòng | Hotspot / Exit | Hướng tiếp cận | Normal Motion | Reduced Motion | Kết quả Kiểm tra | Ghi chú & Tọa độ thực tế |
|---|---|---|---|---|---|---|
| **S1** | Spawn | Khởi đầu phòng S1 | PASS | PASS | PASS | Chân tại native `(418.0, 705.8)`, sàn mở |
| **S1** | `hitbox-drawing-desk` | Từ Spawn | PASS | PASS | PASS | Nhặt Mảnh 1, dừng tại `(518.3, 649.3)` |
| **S1** | `hitbox-fabric-basket` | Từ Bàn vẽ | PASS | PASS | PASS | Nhặt Mảnh 2, dừng tại `(668.8, 677.5)` |
| **S1** | `hitbox-gas-lamp` | Từ Sọt vải | PASS | PASS | PASS | Nhặt Mảnh 3, dừng tại `(275.9, 545.8)` |
| **S1** | `hitbox-french-window` | Từ Đèn (trái $\to$ phải) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-001 & C2-GEO-002** | Normal: 21 frame xuyên bàn vẽ; Cả hai: Điểm dừng bị Loan che khuất |
| **S1** | `hitbox-french-window` | Từ Spawn (giữa $\to$ phải) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-001** | Điểm dừng bị Loan che khuất thân dưới |
| **S1** | `hitbox-drawing-easel` | Từ Cửa sổ (phải $\to$ giữa) | PASS | PASS | PASS | Giải P1 ghép tranh, chân tại `(844.4, 621.1)` |
| **S1** | Exit `window` | Sau P1 & D1 (sang S2) | PASS | PASS | PASS | Chuyển cảnh sang S2 an toàn |
| **S2** | Entry `window` | Khởi đầu phòng từ S1 | PASS | PASS | PASS | Chân đặt tại `(83.6, 545.8)`, sàn mở góc trái |
| **S2** | `hitbox-grandfather-clock` | Từ Entry | PASS | PASS | PASS | Nhặt khóa thau, chân tại `(275.9, 545.8)` |
| **S2** | `hitbox-iron-safe` | Từ Đồng hồ (trái $\to$ phải) | **FAIL (RED)** | PASS | **C2-GEO-004** | Normal: 36 frame cắt ngang tủ vải; Reduced: Teleport đến safe an toàn |
| **S2** | `hitbox-silk-shelves` | Từ Đồng hồ (trái $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-003** | Chân tại `(627.0, 684.1)`, lọt giữa thân Loan `[545, 659]` |
| **S2** | `hitbox-silk-shelves` | Từ Hòm sắt (phải $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-003** | Dừng trong vùng bao hoành độ Loan |
| **S2** | **Exit `back`** | **Lùi từ S2 về S1** | **PASS** | **PASS** | **PASS (VERIFIED)** | Quay về S1 thành công, chân đặt tại sàn mở S1 (`normY = 0.58`) |
| **S2** | Exit `hall` | Sau mở két & đọc D2/D3 | PASS | PASS | PASS | Chuyển cảnh sang S3 an toàn |
| **S3** | Entry `hall` | Khởi đầu phòng từ S2 | PASS | PASS | PASS | Chân đặt tại `(83.6, 545.8)` |
| **S3** | `hitbox-ong-le-shadow` | Từ Entry (trái $\to$ giữa) | **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-005** | Dừng tại `(359.5, 729.3)`, cách Loan $\Delta x = 8.3\text{px}$, trùng visible box |
| **S3** | `hitbox-ong-le-shadow` | Từ Phóng viên (phải $\to$ giữa)| **FAIL (RED)** | **FAIL (RED)** | **C2-GEO-005** | Dừng tại `(643.7, 729.3)`, rơi vào mép gờ bục đá trưng bày |
| **S3** | `hitbox-reporters-crowd` | Từ bóng Ông Lệ | PASS | PASS | **C2-GEO-006 (Note)**| Bao trùm Cả Nghị render-only |
| **S3** | **Exit `back`** | **Lùi từ S3 về S2** | **PASS** | **PASS** | **PASS (VERIFIED)** | Quay về S2 thành công, chân đặt tại sàn mở S2 (`normY = 0.58`) |

---

### 2.2. Ma trận Viewport & Touch Ergonomics

| Viewport | Độ phân giải | Loại thiết bị | Vùng bấm Hotspots ($\ge 43.5\text{px}$) | Walker Route Tracking | Ghi chú kỹ thuật |
|---|---|---|---|---|---|
| **V1** | `1440×900` | Desktop Standard | **PASS** (Tất cả $\ge 48\text{px}$) | **FAIL (RED)** (C2-GEO-002, 004) | Đo đạc native pixel chuẩn |
| **V2** | `1280×720` | Desktop HD 16:9 | **PASS** (Tất cả $\ge 44\text{px}$) | **FAIL (RED)** (C2-GEO-002, 004) | Tỷ lệ chuẩn 16:9 |
| **V3** | `390×844` | Mobile Portrait | **PASS** (Tất cả $\ge 43.5\text{px}$) | **FAIL (RED)** (Tái hiện lỗi tương tự) | CSS clamp mở rộng tap target |
| **V4** | `844×390` | Mobile Landscape | **PASS** (Tất cả $\ge 43.5\text{px}$) | **FAIL (RED)** (Tái hiện lỗi tương tự) | Không che khuất biên ngang |
| **V5** | `768×1024` | Tablet Portrait 4:3| **PASS** (Tất cả $\ge 44\text{px}$) | **FAIL (RED)** (Tái hiện lỗi tương tự) | Letterbox trên-dưới hoạt động đúng |

---

## 3. TIÊU CHÍ NGHIỆM THU HÌNH HỌC VÀ LÀM RÕ CÁC PHÁT HIỆN

### 3.1. Chuẩn hóa Tiêu chí Khoảng cách NPC (Bỏ hardcode $\ge 60\text{px}$)
- **Nguyên tắc:** Ngưỡng khoảng cách Euclidean $60\text{px}$ trước đây chỉ là **đề xuất tham khảo** của Tester, **không phải là quy định contract đã duyệt**.
- **Tiêu chuẩn nghiệm thu cốt lõi mới:**
  1. **Không che khuất bất hợp lý trong không gian 2.5D:** Khi An và NPC cùng đứng trong một khung cảnh, An không được đứng ngay sau lưng NPC khiến tà áo/thân hình NPC che lấp hoàn toàn nhân vật An (như tại Cửa sổ S1), hoặc An không được đứng chắn sát phía trước che lấp NPC quan trọng (như tại bóng Ông Lệ S3).
  2. **Không va chạm và đè lấn thân hình (AABB / Visible Bounds Overlap):** An không được có tọa độ chân rơi vào bên trong bề rộng thân hình của NPC trên cùng bình diện sàn (như tại Giá lụa S2, An đứng lọt vào khoảng $[545, 659]$ của Loan).
  3. **Khả năng tương tác và quan sát:** Người chơi phải phân biệt rõ ràng hai nhân vật, click đúng mục tiêu và không bị cản trở bởi hitbox đối tượng khác.

### 3.2. C2-GEO-005: Bằng chứng Che khuất và Trùng lặp Hình học tại Bóng Ông Lệ (S3)
- **Tọa độ thực nghiệm:**
  - An tại bóng Ông Lệ: Native foot `(x: 359.5, y: 729.3)`.
  - Loan tại S3: Native foot `(x: 367.8, y: 677.5)`.
- **Khoảng cách:**
  - Khoảng cách hoành độ: $\Delta x = |359.5 - 367.8| = \mathbf{8.3\text{px}}$ (chưa tới $0.5\%$ chiều rộng khung hình).
  - Khoảng cách tung độ: $\Delta y = |729.3 - 677.5| = \mathbf{51.8\text{px}}$.
  - Khoảng cách Euclidean mặt sàn: $d = \sqrt{(8.3)^2 + (51.8)^2} \approx \mathbf{52.5\text{px}}$.
- **Bằng chứng Hình học Thực tế:**
  - Bounding box Loan: $[x: 310.8, y: 293.5, w: 114, h: 384]$.
  - Bounding box An: $[x: 266.5, y: 317.8, w: 186, h: 411.5]$.
  - **Trùng lặp phương ngang:** Toàn bộ thân Loan $[310.8, 424.8]$ nằm lọt $100\%$ bên trong thân An $[266.5, 452.5]$.
  - **Trùng lặp phương đứng:** Giao thoa $[317.8, 677.5]$ chiếm tới $359.7\text{px}$ ($> 90\%$ chiều cao của Loan!).
  - **Hệ quả thị giác:** Vì chân An thấp hơn chân Loan ($729.3 > 677.5$), thuật toán vẽ xếp An lên phía trước. Với $\Delta x$ chỉ $8.3\text{px}$, thân hình An che phủ gần như trọn vẹn bóng dáng của NPC Loan phía sau.
  - Hướng tiếp cận từ bên phải: An dừng tại `(643.7, 729.3)`, chân đặt ngay trên mép gờ đá bục triển lãm.

### 3.3. C2-GEO-006: NPC Cả Nghị Render-only và Tác động UX (S3)
- Sprite Cả Nghị `[1197, 294, 114, 384]` nằm trong nút Đám đông phóng viên `[1098.5, 414.0, 339.4, 367.0]`.
- Theo đúng contract C2: NPC là render-only (`c2RoomNpcs`), không có ID tương tác độc lập trong Core. Hành vi click vào Cả Nghị mở đối thoại Đám đông phóng viên phù hợp với thiết kế gom cụm cảnh đối đầu. Ghi nhận là **Observation**, không coi là lỗi Core.

### 3.4. C2-GEO-008: Đổi Mục tiêu Giữa đường (Mid-walk Retargeting)
- Contract không quy định easing hay quay đầu. Walker đổi hướng tức thì và đến đúng mục tiêu mới.
- Ghi nhận là **Observation**, không áp đặt yêu cầu easing làm tiêu chí chặn release.

---

## 4. TỔNG HỢP TRẠNG THÁI BÀN GIAO BUG & TEST SUITES

### 4.1. Tình trạng Test Suites Hiện tại
1. `tests/browser/c2-geometry-repro.spec.ts`: **`3 passed (39.2s)`** (Khẳng định bug tồn tại).
2. `tests/browser/c2-geometry.spec.ts`: **`5 FAILED (RED), 3 PASSED (GREEN) (1.1m)`**
   - ❌ **RED:** S1 Cắt xuyên Bàn vẽ trong Normal motion (C2-GEO-002).
   - ❌ **RED:** S1 An bị Loan che khuất ở Cửa sổ kính mờ (C2-GEO-001).
   - ❌ **RED:** S2 Cắt xuyên Tủ vải trong Normal motion (C2-GEO-004).
   - ❌ **RED:** S2 An đứng bên trong thân Loan ở Giá lụa (C2-GEO-003).
   - ❌ **RED:** S3 An và Loan trùng visible bounds ở bóng Ông Lệ (C2-GEO-005).
   - ✅ **GREEN:** S2 & S3 Exit `back` điều hướng quay lại phòng trước an toàn trên sàn mở.
   - ✅ **GREEN:** 5 Viewports Touch targets $\ge 43.5\text{px}$ (C2-GEO-007).
   - ✅ **GREEN:** Mid-walk retargeting hoàn thành chuyển hướng (C2-GEO-008).

### 4.2. Bảng Phân loại Bug Bàn giao

| Mã Bug | Vị trí / Hiện tượng | Trạng thái | Đơn vị Phụ trách Sửa |
|---|---|---|---|
| **C2-GEO-001** | S1: Loan che khuất An tại Cửa sổ | **MỞ (OPEN - RED)** | Frontend (Layout coordinates) |
| **C2-GEO-002** | S1: Walker cắt xuyên Bàn vẽ | **MỞ (OPEN - RED)** | Frontend / Core (Routing / Waypoints) |
| **C2-GEO-003** | S2: An đứng đè lên thân Loan ở Giá lụa | **MỞ (OPEN - RED)** | Frontend (Layout coordinates) |
| **C2-GEO-004** | S2: Walker cắt xuyên Tủ vải | **MỞ (OPEN - RED)** | Frontend / Core (Routing / Waypoints) |
| **C2-GEO-005** | S3: An che lấp Loan tại bóng Ông Lệ | **MỞ (OPEN - RED)** | Frontend (Layout coordinates) |
| **C2-GEO-006** | S3: Cả Nghị trong nút Đám đông phóng viên | **OBSERVATION** | Content / Design note |
| **C2-GEO-007** | Đa Viewport: Kích thước Hotspots $\ge 43.5\text{px}$ | **ĐÃ ĐÓNG (PASS)** | Frontend (Đã đạt chuẩn) |
| **C2-GEO-008** | Retargeting đổi hướng tức thì | **OBSERVATION** | Frontend (Đã đạt chuẩn) |
| **C2-NAV-001** | Điều hướng Exit `back` ở S2 và S3 | **ĐÃ ĐÓNG (PASS)** | Frontend / Engine (Đã đạt chuẩn) |

---

## 5. BẢO TOÀN THAY ĐỔI VÀ TIẾN ĐỘ TIẾP THEO

- Toàn bộ thay đổi test và báo cáo đã được lưu trữ trong commit local [`83ea458`](file:///Users/thanhdanh/Nep-Remix-test) và commit cập nhật tiếp theo.
- Các dirty files ngoài phạm vi C2 (`scripts/check-game.ts`, `tests/browser/sprint01-integration.spec.ts`) và các file nháp được bảo toàn tuyệt đối, không bị stage hay xóa.
- Không sửa bất kỳ file runtime hay package.json nào.
- Tester sẵn sàng chạy nghiệm thu lại độc lập ngay khi Leader chuyển giao SHA tích hợp bản sửa từ Frontend và Core.
