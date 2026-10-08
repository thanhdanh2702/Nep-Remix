# Checklist & Báo Cáo Nghiệm Thu Độc Lập C2 — Tiếng Kéo Đêm Phố Cũ

**Ngày cập nhật:** 07/10/2026  
**Vai trò:** Tester độc lập  
**Worktree:** `/Users/thanhdanh/Nep-Remix-test` (`agent/tester`)  
**Tài liệu tham chiếu:** `09-c2-leader-plan.md`, `c2-contract.md`, `07-acceptance.md`, `assets/areas/chapter-2/manifest.json`, Core `C2-HANDOFF.md`, Frontend `C2-LAYOUT-HANDOFF.md`.

---

## 1. Rà Soát Bảo Toàn & Ranh Giới Sở Hữu (Ownership)

- **Tracked dirty files được bảo toàn 100% nguyên trạng:**
  - `scripts/check-game.ts` (diff dialogue queue & C1 altar resubmit)
  - `tests/browser/sprint01-integration.spec.ts` (diff corrupt save backup reset)
- **Untracked files ngoài scope được giữ nguyên, không stage:**
  - `fix-*.cjs`, `patch-*.cjs`, `"nháp"`, `run_test.ts`
- **Ownership của Tester:**
  - `tests/c2-regression.test.ts`
  - `tests/browser/chapter2.spec.ts`
  - `tests/checklist-c2.md`
  - Không sửa Core, UI, content JSON, PNG, asset exporter hoặc `package.json`.
  - Không push, không reset, không tự merge nhánh dev (`agent/core`, `agent/frontend`).

---

## 2. Kết Quả Sửa Đổi Toàn Diện Harness (Phần A)

Harness kiểm thử đã được đại tu triệt để, loại bỏ toàn bộ khoảng trống ở commit `9e4ca5a`:

### 2.1. Kiểm tra 100% Implementation thật (No Fake Code, No Silent Passes)
1. **Xóa bỏ toàn bộ hàm tự viết lại trong test:**
   - Đã gỡ bỏ hoàn toàn các hàm mảng giả lập (`moveLeft`, `moveRight`, `removeAt`) trong `tests/c2-regression.test.ts`.
   - Chuyển sang import và kiểm chứng trực tiếp các hàm từ runtime thật: `src/game/order-puzzle.ts` (`moveOrderPieceLeft`, `moveOrderPieceRight`, `removeOrderPiece`, `handleOrderSlotKey`).
2. **Loại bỏ NPC map / tọa độ hằng tự bịa:**
   - Chuyển sang gọi hàm renderer thật `c2RoomNpcs` từ `src/game/room-render.ts`.
   - Kiểm tra trực tiếp dữ liệu trả về của renderer: ID, tên, đường dẫn sprite, và tọa độ bounding box trên sàn native 1672×941.
3. **Cấm assertion điều kiện (`if (...) return`):**
   - Không còn bất kỳ câu lệnh `if (typeof fn === 'function')` hay `if (await el.isVisible())` nào để âm thầm pass khi dependency thiếu.
   - Nếu dependency (Core helper, UI module, hay selector bắt buộc) vắng mặt trên checkout, test **bắt buộc assert fail và báo FAIL / BLOCKED rõ ràng**.

### 2.2. Kiểm thử độc lập trên đúng Checkout (No External Fallback)
1. **Bỏ hoàn toàn fallback đường dẫn tuyệt đối:**
   - Xóa bỏ mọi đường dẫn trỏ sang worktree Leader `/Users/thanhdanh/Nep-Remix/` hay Frontend.
   - Mọi asset, source, content được kiểm tra nghiêm ngặt tại chỗ (`path.resolve('assets/...')`, `path.resolve('src/...')`).
2. **Khớp Clue ID theo Content thật:**
   - Đã sửa clue ID từ `clue-bien-lai-tra-no-goc-1935` thành `clue-bien-lai-goc-1935` đúng với định nghĩa trong `src/content/chapters/c2.json` và `content.clues`.
3. **Chuẩn hóa Payload Closet & Thử thách P5:**
   - Sử dụng đúng cấu trúc `equippedAccessories: { headwear: 'khan-van-den', footwear: 'guoc-moc' }` thay vì đưa flat lên root payload.
   - Fixture P5 hoàn chỉnh: đã giải P1–P4, đọc D0–D3, sở hữu 3 chứng cứ, ví 0 Sen, chưa unlock Lemur/khăn/guốc.
   - Kiểm tra chặn thoát quyền mượn ở cả 2 kênh:
     - Direct payload: `closet/saveOutfit` với đồ mượn.
     - Session-based: `closet/saveOutfit` khi activeSession là challenge Studio mang `challengePuzzleId`.
4. **Không áp đặt ngôn ngữ lỗi:**
   - Chỉ kiểm tra `res.ok === false` và lý do từ chối tồn tại (`res.reason.length > 0`), không ép regex tiếng Anh.

### 2.3. Kiểm chứng UI & Trình duyệt Thật
1. **Kiểm tra Renderer NPC & Không che chắn:**
   - Kiểm tra `c2RoomNpcs` trả về Cụ Loan (S1), Cụ Loan lo âu (S2), Cả Nghị & Loan chuyển pose (S3).
   - Kiểm tra va chạm hình học (AABB intersection): khoảng cách an toàn với Mảnh 4 tại cửa sổ, Exit window S1, đồng hồ chìa khóa và két sắt S2. Vùng bấm duy trì chuẩn $\ge 44\text{px}$.
2. **Ghép tranh:**
   - Kích thước dải tranh gốc: 128 × 1476 ($w/h \approx 0.08672$). Tranh hoàn chỉnh: 512 × 1476.
   - Cấm `object-fit: fill` trên `.order-strip-img`.
   - Cấm ép cứng `width: 44px; height: 160px` trên `.order-strip-preview`.
   - Khung tranh liền mạch (gap = 0), controls (‹, ›, ×) tách rời bên dưới, không che nét vẽ.
3. **Bàn phím & Focus:**
   - Focus mảnh 4 → nhấn ArrowLeft 3 lần liên tiếp: kiểm tra thứ tự dời $3 \rightarrow 2 \rightarrow 1 \rightarrow 0$ và `document.activeElement` giữ nguyên trên mảnh 4 sau mỗi lần.
   - Kiểm tra tại vị trí biên: ArrowLeft ở index 0 và ArrowRight ở index 3 không làm thay đổi mảng.
   - Gỡ mảnh đầu / giữa / cuối: focus chuyển có chủ ý sang mảnh kế tiếp dồn lên (hoặc mảnh trước đó nếu gỡ mảnh cuối), tuyệt đối không rơi về `<body>`.
   - Khẳng định cấm `key={`${id}-${index}`}` trong `PuzzleModal.tsx`.
4. **Đa Viewport (5 cấu hình bắt buộc):**
   - 1440×900 (Desktop), 1280×720 (Laptop), 390×844 (Mobile portrait), 844×390 (Mobile landscape), 768×1024 (Tablet).
   - Touch targets $\ge 43.5\text{px}$. Bật reduced motion. Không fixed sleep.

---

## 3. Bảng Kết Quả Thực Chạy Suite Hồi Quy Độc Lập

Lệnh thực thi trên checkout hiện tại:
```sh
node --import tsx --test tests/c2-regression.test.ts
npx tsc --noEmit
```

- **Typecheck (`npx tsc --noEmit`):** PASS (0 errors).
- **Kết quả Node Test Runner (`tests/c2-regression.test.ts`):**

| Suite kiểm thử | Số ca | PASS | FAIL / BLOCKED (Phản ánh đúng dependency chưa tích hợp) |
| --- | :---: | :---: | :---: |
| **1. Gates Matrix (D0, G1, G2, P3-P5, D4)** | 7 | 3 | 4 (Chờ Core candidate: D0/G1/G2 gates) |
| **2. Order Puzzle Invariants** | 4 | 3 | 1 (Chờ Core candidate: draft order validation) |
| **3. S2 Safe & Atomic Papers & Clue** | 2 | 0 | 2 (Chờ Core candidate: safe mặt phải & atomic grant) |
| **4. Context Studio & Loan Isolation** | 4 | 1 | 3 (Chờ Core candidate: helper exports & invalid context guard) |
| **5. NPC Rendering & Geometry** | 3 | 0 | 3 (Chờ Frontend candidate: c2RoomNpcs & Asset merge) |
| **6. Ghép hình Native Ratio & Controls** | 3 | 2 | 1 (Chờ Frontend candidate: css controls min-height) |
| **7. Keyboard Navigation Implementation** | 3 | 1 | 2 (Chờ Frontend candidate: order-puzzle.ts) |
| **8. Reward Delta 100 Sen & Legacy** | 3 | 2 | 1 (Chờ Core candidate: c2.json 100 Sen) |
| **TỔNG CỘNG** | **29 ca** | **12 PASS** | **17 BLOCKED / RED (Kỳ vọng chính xác)** |

*Ghi chú quan trọng:* 17 ca FAIL/BLOCKED trên đây là **bằng chứng trung thực** của một harness kiểm thử nghiêm ngặt — harness từ chối pass giả tạo khi các module thật (`order-puzzle.ts`, `createChallengeStudioDraft`, `c2RoomNpcs`, và assets nhân vật) chưa được Leader merge vào candidate.

---

## 4. Ma Trận Nghiệm Thu Candidate B (Sẵn sàng khi Leader bàn giao SHA)

Khi Leader tích hợp Core + Frontend + Assets và bàn giao SHA candidate, Tester sẽ kích hoạt toàn bộ quy trình nghiệm thu sau:

1. **Đường chơi thật (Walkthrough):**
   - Fresh profile W0 → W1 → W2 (Mở đầu → C1 → C2 → kết → Hub), không debug grant, không mua đồ shop, không AI, tắt `latVai`.
   - Fixture C1 complete chạy nhanh độc lập.
2. **Cổng bảo vệ & Thứ tự câu đố:**
   - D0 gate: không nhặt mảnh trước khi đọc xong D0.
   - G1 gate: giải P1 và đọc D1 mới được sang S2.
   - G2 gate: mở két lấy 2 giấy và đọc đủ D2, D3 mới được sang S3.
   - Thứ tự S3: P3 (biên lai) $\rightarrow$ P4 (bản vẽ) $\rightarrow$ P5 (phối đồ).
   - Ending gate: đọc xong D4 mới được complete/claim.
   - Chặn command sai phòng, sai mặt trái, sai chương, goBack bypass.
3. **Order Puzzle Ghép bản vẽ:**
   - Draft lưu dở, từ chối ID lạ/trùng/chưa sở hữu.
   - Submit sai/thiếu không solve, không mất mảnh.
   - Hiển thị 4 dải native 128×1476 khít nhau, controls tách rời, touch $\ge 44\text{px}$.
   - Focus piece 4 $\rightarrow$ ArrowLeft 3 lần giữ focus, remove chuyển focus đúng slot.
4. **Két sắt S2:**
   - Cấp đồng thời 2 giấy, mở D2 rồi D3 vào queue, clue cấp sau acknowledge.
   - Két rỗng sau khi nhận giấy.
5. **Thử thách Phối đồ P5:**
   - Profile ví 0 Sen, chưa sở hữu Lemur/khăn/guốc vẫn giải được.
   - Không đổi ví, không cấp đồ vĩnh viễn vào closet trước claim.
   - Chặn lách đồ mượn qua `closet/saveOutfit` (cả direct payload và studio session).
   - Context sự kiện hợp lệ giữ nguyên qua reload; context lạ/rỗng bị từ chối rõ ràng.
6. **Thưởng & Lịch sử:**
   - Delta C2 đúng 100 Sen (không lẫn +15 đọc thẻ).
   - Idempotent: nhận lần 2 bị từ chối, reload/undo không farm.
   - Save legacy 120 Sen giữ nguyên số dư.
7. **NPC & Hình ảnh:**
   - Loan và Cả Nghị xuất hiện đúng phòng qua `c2RoomNpcs`.
   - Không che Mảnh 4, cửa sổ, đồng hồ chìa khóa, két sắt.
   - Không có lỗi 404 hình ảnh.
8. **Đa Thiết Bị (5 Viewports):**
   - 1440×900, 1280×720, 390×844, 844×390, 768×1024 đạt chuẩn bố cục, không tràn khung, touch $\ge 43.5\text{px}$.
9. **Blocker Nghiệm Thu Art:**
   - Áo phụ `ao-dai-tan-thoi-vang-mo-ga` chưa có layer mặc là **blocker nghiệm thu quà đầy đủ**. Không dùng fallback hay bỏ quà để báo xanh.

---

## 5. Kết Luận

- Harness kiểm thử độc lập đã được sửa đổi hoàn chỉnh, tuân thủ 100% các nguyên tắc kiểm thử thực tế và không có code giả lập.
- Harness đang ở trạng thái chuẩn bị tối ưu, sẵn sàng nhận candidate SHA từ Leader để tiến hành nghiệm thu toàn diện.
