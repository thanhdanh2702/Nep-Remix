# Frontend C2 — Báo Cáo Trạng Thái & Nghiệm Thu Hình Học C2

- **Ngày cập nhật:** 08/10/2026
- **Chi nhánh:** `agent/frontend`
- **Tương thích:** Tester `f0ba800`, Core `633a0c0`, Leader candidate `main` / `2038276`.
- **Ranh giới sở hữu:** `src/game/` (trừ `store.ts`), `src/ui/`, CSS, unit tests sát module.

---

## 1. Trạng Thái Tổng Thể: HOÀN TẤT HÌNH HỌC & ĐỊNH TUYẾN C2

Toàn bộ các lỗi kiểm toán hình học `C2-GEO-001` đến `C2-GEO-005` do Tester và Core phát hiện đã được khắc phục hoàn toàn trên implementation thật. Bộ test chuẩn nghiệm thu của Tester (`f0ba800`) đã đạt **8/8 PASS (100% GREEN)** trong môi trường browser production server.

---

## 2. Kết Quả Kiểm Thử Thực Tế (Verification Evidence)

| Bộ Kiểm Thử / Lệnh Thực Hiện | Kết Quả | Chi Tiết |
| :--- | :--- | :--- |
| `npx tsc --noEmit` | **PASS** (0 errors) | Typecheck hoàn toàn sạch |
| `npm run test:core` | **PASS** (15/15) | Core engine validation & Prologue/C1 walkthrough |
| `node --import tsx --test src/core/c2-layout.test.ts` | **PASS** (15/15) | 11 hotspots 2 hướng tiếp cận, spawns, floor exits |
| `node --import tsx --test src/game/c2-m1.test.ts` | **PASS** (16/16) | Studio challenge, order puzzle, walkthrough C2 |
| `npx playwright test (c2-geometry-tester.spec.ts)` | **PASS** (8/8) | Nghiệm thu độc lập bộ test Tester `f0ba800` |
| `npm run build` | **PASS** | Bundle client & server thành công |
| `npm audit` | **PASS** | 0 lỗ hổng bảo mật |

---

## 3. Chi Tiết Khắc Phục Các Điểm Kiểm Toán (C2-GEO-001 → 008)

1. **C2-GEO-001 (S1: Loan che khuất An ở Cửa sổ Pháp)**:
   - **Hiện tượng cũ:** An dừng tại $x=1162.0$, đứng ngay sau lưng Loan $[1080, 1194]$.
   - **Khắc phục:** `targetFor` dạt chân An sang $x=1282.4, y=545.8$ (sàn mở), cách Loan $\Delta x = 88.4\text{px} \ge 80\text{px}$.
   - **Kết quả:** PASS test Tester, An và Loan hiện diện tách biệt rõ ràng.

2. **C2-GEO-002 (S1: Walker cắt xuyên Bàn vẽ tranh trong normal motion)**:
   - **Hiện tượng cũ:** Đi thẳng từ Đèn ga ($x=275.9$) sang Cửa sổ ($x=1282.4$) cắt xuyên qua Bàn vẽ $[501.6, 819.3] \times [376.4, 644.6]$.
   - **Khắc phục:** `findPath` định tuyến qua hành lang dưới $y=700$ với 2 waypoints $(460, 700)$ và $(850, 700)$.
   - **Kết quả:** $0$ frames/ticks bị clipping qua bàn vẽ.

3. **C2-GEO-003 (S2: An đứng đè lên thân Loan ở Giá lụa)**:
   - **Hiện tượng cũ:** An dừng tại $x=627.0$, lọt vào bên trong bề rộng thân hình Loan $[545, 659]$.
   - **Khắc phục:** `targetFor` dạt chân An sang $x=760.0, y=569.3$, cách Loan $\Delta x = 101.0\text{px} \ge 80\text{px}$.
   - **Kết quả:** PASS test Tester, chân An đứng trên sàn mở ngoài thân Loan, khoảng cách an toàn.

4. **C2-GEO-004 (S2: Walker cắt xuyên Tủ lụa trong normal motion)**:
   - **Hiện tượng cũ:** Đi thẳng từ Đồng hồ ($x=275.9$) sang Két sắt ($x=1160.4$) cắt xuyên qua Tủ lụa $[601.9, 1137.0] \times [197.6, 665.3]$.
   - **Khắc phục:** `findPath` định tuyến qua hành lang dưới $y=725$ với 2 waypoints $(480, 725)$ và $(1150, 725)$.
   - **Kết quả:** $0$ frames/ticks bị clipping qua tủ lụa.

5. **C2-GEO-005 (S3: Trùng visible bounding box An–Loan tại bóng Ông Lệ)**:
   - **Hiện tượng cũ:** An dừng tại $x=359.5$, thân An che lấp $100\%$ Loan ($\Delta x = 8.3\text{px}$). Tiếp cận từ phải dừng tại $x=643.7$ đè mép bục đá.
   - **Khắc phục:** Cả hai hướng tiếp cận thống nhất dừng tại khoảng sàn mở $x=525.0, y=564.6$. Cách Loan $\Delta x = 157.2\text{px} \ge 80\text{px}$, cách bục đá ($525 < 635.4$), $\text{dist} = 179.1\text{px} \le 250.8\text{px}$ (Core guard PASS).
   - **Kết quả:** $0$ pixel visible bounding box overlap ($xOverlap = 0$).

6. **C2-GEO-006 (S3: NPC Cả Nghị render-only)**:
   - Observation: Cả Nghị không có ID tương tác độc lập theo đúng C2 contract; việc click vào mở cụm tương tác Đám đông phóng viên là hành vi thiết kế thống nhất.

7. **C2-GEO-007 (Đa viewport touch targets $\ge 43.5\text{px}$)**:
   - Nghiệm thu trên 5 viewports (`1440×900`, `1280×720`, `390×844`, `844×390`, `768×1024`): Tất cả buttons đều $\ge 43.5\text{px}$ (desktop $\ge 48\text{px}$).

8. **C2-GEO-008 (Mid-walk retargeting)**:
   - Chuyển hướng lập tức khi click mục tiêu mới, không drop click cuối, hủy target cũ đúng quy định.

9. **C2-NAV-001 (Navigation Exit back S2 & S3)**:
   - Thử nghiệm chuyển cảnh Exit `back` từ S3 về S2 và từ S2 về S1: An xuất hiện trên sàn mở hợp lệ $\text{normY} \in [0.57, 0.93]$.

---

## 4. Các Giới Hạn & Blocker Còn Lại

1. **Candidate Release**:
   - `PLAYABLE` trong `Game.tsx` hiện khớp với `main` (`['prologue', 'c1', 'c2']`). Quyết định mở public C2 do Leader phê duyệt.
2. **Art Blocker**:
   - Áo thưởng phụ (`ao-dai-tan-thoi-vang-mo-ga`) thiếu file layer tách rời vẫn đang chờ team Art bàn giao; logic reward trong Core và Frontend được giữ nguyên, không thay thế tài nguyên sai quy cách.
