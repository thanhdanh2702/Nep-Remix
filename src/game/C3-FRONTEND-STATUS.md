# Frontend C3 — Báo Cáo Trạng Thái Triển Khai (M2 Consumer Integration & Document Reader)

- **Ngày cập nhật:** 08/10/2026
- **Chi nhánh:** `agent/frontend`
- **Baseline chính thức hiện hành:** `c61d98fec539caec8d9481753247aeaaab16ca23` (chứa Checkpoint C runtime registry và Core M1 GREEN).
- **Ranh giới sở hữu:** `src/game/` (`Game.tsx`, `RoomScene.tsx`, `room-render.ts`, `room-walker.ts`, `character-scale.ts`, `npc-portraits.ts`, `PuzzleModal.tsx`, `puzzle-actions.ts`, `bagua-puzzle.ts`, `puzzle.css`, `DocumentViewer.tsx`, `c3-documents.ts`, `InventoryCombine.tsx`, `c3-*.test.ts`).
- **Tuân thủ ranh giới:** Không tự ý sửa `src/core/`, `src/content/chapters/c3.json`, catalogs, `data/`, `package.json`, scripts, hay tests của Tester.
- **Thư mục scratch:** Được giữ nguyên vẹn (`scratch/` intact).
- **Trạng thái Git:** **UNCOMMITTED** (không commit, merge hoặc push khi chưa có quyền).

---

## 1. Trạng Thái Chi Tiết Từng Phân Đoạn (Slice Status)

### Slice 1: Document Reader & Journal Reread — **HOÀN THÀNH (Đã Kiểm Chứng TDD)**
1. **Document Viewer Riêng Biệt (`src/game/DocumentViewer.tsx`, `src/game/c3-documents.ts`):**
   - Đã triển khai component đọc tài liệu chứng cứ riêng cho C3 sử dụng ảnh giấy production từ manifest:
     - `doc-c3-bien-nhan`: `assets/areas/chapter-3/doc-c3-bien-nhan.png`
     - `doc-c3-so-goc`: `assets/areas/chapter-3/doc-c3-so-goc.png`
     - `doc-c3-thu-thoa-thuan`: `assets/areas/chapter-3/doc-c3-thu-thoa-thuan.png`
     - `doc-c3-ban-sua`: `assets/areas/chapter-3/doc-c3-ban-sua.png`
   - Dựng nội dung đối chiếu bằng HTML tiếng Việt ngữ nghĩa (semantic comparison):
     - **Biên nhận (S1 / D1):** Ghi nhận Bà Lớn đưa Thầy Ba Càn 2.000 đồng để viết lại nhận xét trong hồ sơ Mai–Vinh. Xác định giao dịch tiền bạc mua chuộc.
     - **Sổ gốc (S2 / D3):** Ghi nhận nội dung ban đầu hồ sơ Mai–Vinh; **hoàn toàn không có dòng yêu cầu Mai làm lẽ hay giao quyền tiệm**. Là mốc nội dung gốc; lời phán không quyết định phẩm giá Mai.
     - **Thư thỏa thuận (S2 / D4):** Dẫn chiếu hồ sơ Mai–Vinh, khoản tiền 2.000 đồng nhận từ Bà Lớn và yêu cầu thêm lời phán ép Mai làm lẽ, giao quyền quyết định tiệm. Nối người trả tiền, người sửa và mục đích với bản sửa.
     - **Bản sửa (S3 / D5):** Cùng tên hồ sơ; đánh dấu nổi bật dòng chèn thêm: *“Mai phải chấp nhận làm lẽ và giao quyền quyết định căn tiệm”*.
   - **Tuyệt đối không dùng:** Nét chữ, nếp giấy, vết mực hay "lá số đại cát" để chứng minh phẩm giá Mai.
2. **Lần Đọc Đầu Hoàn Tất Bằng Acknowledge Thật Của Core:**
   - Trong luồng đối thoại tại hiện trường, nút "Xác nhận đã đọc" (hoặc "Đọc tiếp thư thỏa thuận") gọi `advance()`, gửi command `dialogue/advance` thật lên Core.
   - Core ghi nhận `completedDialogueIds`, cấp clue tương ứng và pop queue tiếp theo (S2: `d-c3-so-tu-vi` $\rightarrow$ `d-c3-thoa-thuan`).
   - FE không tự đánh dấu completed hoặc giả lập state.
3. **Chế Độ Xem Lại Trong Nhật Ký (Journal Read-only Reread):**
   - Tại `InventoryCombine.tsx`, mỗi chứng cứ sở hữu (`bien_nhan_tien_thay_boi`, `so_tu_vi_nguyen_ban_1962`, `thu_tay_thoa_thuan_boi_toan`) và manh mối đã ghi nhớ (kể cả bản sửa `d-c3-ban-sua` khi đã đọc) đều có nút **"Đọc văn bản" / "Xem lại tài liệu"**.
   - Mở `DocumentViewer` ở chế độ **`readOnly={true}`**:
     - Hiển thị badge: *"Sổ manh mối · Chỉ đọc"*.
     - Nút *"Đóng văn bản"* chỉ khép viewer, **tuyệt đối không gửi command**, không thay đổi `headId`, không cấp thêm clue hay Sen Ngọc.
     - Đã kiểm chứng tự động trong `src/game/c3-document.test.ts`: snapshot toàn bộ game state trước và sau khi xem lại giống nhau 100%.
4. **Cấp Giấy Nguyên Tử & Trạng Thái Rương S2:**
   - Khi giải P1 (`p-c3-bagua-lock`), Core cấp đồng thời cả 2 giấy tờ `so_tu_vi_nguyen_ban_1962` và `thu_tay_thoa_thuan_boi_toan`.
   - Rương chuyển thẳng sang rỗng (`c3-s2-phong-phong-thuy--ruong-rong.png`). Không có pickup rời, không làm giấy xuất hiện lại trong rương.

---

### Slice 2: Chốt Hình Học & Giữ Snapshot Handoff Ổn Định — **HOÀN THÀNH**
1. **Giữ Nguyên Vẹn Hash Handoff Cho Core:**
   - Tập tin [`src/game/C3-LAYOUT-HANDOFF.md`](file:///Users/thanhdanh/Nep-Remix-frontend/src/game/C3-LAYOUT-HANDOFF.md) được **giữ ổn định nguyên vẹn** với mã băm SHA-256:
     $$\mathbf{8149d5b9b5c15fb3d829305d5e8423f6664fbb1b96e70302cad7c78f536f0417}$$
   - Khớp 100% với `computedArrivals` của Leader (`c3-geometry-review-input.json`). Không có bất kỳ sai lệch làm tròn nào.
   - Core có thể dùng đúng mã SHA-256 này để pin provenance trong `src/core/c3-layout.test.ts`.
2. **Cơ Chế Spawn S2/S3:**
   - *Code fallback hiện tại:* `spawn: {x: 0.1, y: 0.6}` clamp tới $y = 639.88\text{ px}$. `standClear` cho vị trí $[167.2, 639.88]$.
   - *Đề xuất candidate đích thực trên sàn vẽ:*
     - S2: `{ x: 0.10, y: 0.845 }` ($y \approx 795.15\text{ px}$, ngang tầm Thầy Ba Càn $y = 795$).
     - S3: `{ x: 0.10, y: 0.871 }` ($y \approx 819.61\text{ px}$, ngang tầm Vinh/Bà Lớn $y = 820$).
3. **Chuyển Cảnh & Điểm Đến Exit Arrows:**
   - S1 $\rightarrow$ S2 (`back`): $[83.60, 639.88]$.
   - S3 $\rightarrow$ S2 (`mansion`): $[1588.40, 639.88]$.
   - S2 $\rightarrow$ S3 (`back`): $[83.60, 639.88]$.
   - S2 $\rightarrow$ S1 (`street`): $[1571.68, 639.88]$.
   - Tất cả 100% có path di chuyển tới mọi interactable trong phòng.
4. **Giới Hạn Thừa Nhận Rõ Ràng:**
   - Kiểm tra số học (arithmetic clearance) và slab clipping **chưa phải là visual signoff**. Visual signoff trên sàn vẽ thực tế và kiểm tra occlusion được ghi nhận **NOT RUN** (chờ phiên kiểm thử trình duyệt).

---

### Slice 3: Consumer State M1 Thật & Walkthrough — **HOÀN THÀNH (Module Level)**
1. **API Challenge Wardrobe M1 Thật:**
   - P3 styling tái sử dụng public API: `getChallengeWardrobe`, `createChallengeStudioDraft`, `validateChallengeStudioDraft`.
   - Trang phục mượn gồm: `ao-dai-raglan`, `kinh-mat-meo`, `guoc-moc`. Phom `tan_thoi`, màu sắc tự do.
   - Không ép mua, không fake sở hữu vĩnh viễn trong tủ đồ trước khi hoàn tất nhận thưởng.
2. **Ending & Claim:**
   - Nguyên văn câu kết của Mai:
     > *"Tôi không cần một lời phán tốt hơn. Tôi cần các người ngừng dùng lời phán để quyết định thay tôi."*
   - Claim nhận đúng **+100 Sen Ngọc** một lần duy nhất qua ledger của Core. FE không tự cộng Sen.
3. **Phạm Vi Walkthrough:**
   - Test walkthrough trong `src/game/c3-m1.test.ts` là kiểm thử module nội bộ chạy qua command sequence trên fixture C3 đã mở khóa.
   - **Đây không phải là bằng chứng C3 đã mở khóa từ menu chính sau C2.**

---

## 2. Bảng Dấu Vân Tay Tập Tin Mã Nguồn (SHA-256 Checksums)

| Đường Dẫn Tập Tin | Trạng Thái Git | SHA-256 Checksum | Ghi Chú |
| :--- | :---: | :--- | :--- |
| `src/game/C3-LAYOUT-HANDOFF.md` | Untracked | `8149d5b9b5c15fb3d829305d5e8423f6664fbb1b96e70302cad7c78f536f0417` | **Giữ nguyên vẹn cho Core pin** |
| `src/game/C3-FRONTEND-STATUS.md` | Untracked | `(báo cáo hiện hành)` | Báo cáo trạng thái M2 chi tiết |
| `src/game/c3-documents.ts` | Untracked | `d17559b17b88ab899edf07577625462233d511a62576ed24d507f1e097befa1d` | Dữ liệu & helper 4 văn bản chứng cứ |
| `src/game/DocumentViewer.tsx` | Untracked | `e8842cd9166bc56fae9e48201a4cc8c8056d92acb64b7ae653b7cce8cd3cb892` | Component xem tài liệu active + read-only |
| `src/game/c3-document.test.ts` | Untracked | `70e3c4ad7c4113f62eb4e01d52a4fab94225f95a3934acad0efd13ff4f778a6c` | 9 unit tests document, reread & render/scale |
| `src/game/c3-layout.test.ts` | Untracked | `f7d97dca15412c1ebe1946d22eab711f59ae2755042503f351be6563de70da25` | 6 tests hình học, spawn, exit, routing |
| `src/game/c3-m1.test.ts` | Untracked | `7ab1471c19114dced8af6963c6a0736282005a0655b2a9c797b98a5c3747f6df` | 8 tests consumer walkthrough, styling, bagua |
| `src/game/bagua-puzzle.ts` | Untracked | `d2e5a16a33cb77dfcf3a9e65a6eaa86bed241c085a6d24862a7d8a7499377cfd` | Logic giải mã quẻ Bát Quái |
| `src/game/puzzle-actions.ts` | Untracked | `fe0a35a936de571c3c0ca2898e417d2d5074847e555c686e661779ac7d84a65c` | Nhãn hành động câu đố & thoại đọc tài liệu |
| `src/game/InventoryCombine.tsx` | Modified | `11ac03e516ee04603bea2bc829081759fc7e5d3e1e137549ae01be109af6e495` | Tích hợp nút xem lại tài liệu trong túi/sổ |
| `src/game/Game.tsx` | Modified | `95b801e3703bd336bef2fd764754b827f1c7efe01a4859f59603888f55220a45` | Tích hợp DocumentViewer trong flow đối thoại |
| `src/game/puzzle.css` | Modified | `c122a7ede7a06e4d6c842467667bc0684b585f69b72c9f55a16332bc626a86d6` | CSS DocumentViewer & nút đọc trong sổ |
| `src/game/RoomScene.tsx` | Modified | `66a6eded8a4aa0cebfcdae5bd121164ab7e173c96334fcc1876bfec3f5dd02b2` | Tích hợp tĩnh scene actors C3 |
| `src/game/room-render.ts` | Modified | `59be77c9087e14e534c53cd3f517e244c91fe15708e827dd637e088a0183aa7b` | Render overlays, NPCs & exit arrows C3 |
| `src/game/room-walker.ts` | Modified | `31063822f43a41dfc8b0d17276724c891409877bbaf8cc82bc33384479792cad` | Định tuyến né vật cản & dung sai float biên |
| `src/game/character-scale.ts` | Modified | `2cda1b2172950fd6e82cfc24926fa91aeeff84512c4c00f21c6429715829ebfa` | Tỷ lệ nhân vật C3 (518.4px visible height) |
| `src/game/npc-portraits.ts` | Modified | `3129fc1975a323acfc891fb683a856d683ddd423164d1490c9128ea28e171e5b` | Mapping chân dung NPC C3 |
| `src/game/PuzzleModal.tsx` | Modified | `c5ab3b990e9b8617f0b1159a3d7b1bdd398bb57a000a89ab96db7bc1f391a634` | Modal câu đố Bát Quái và Trình chứng cứ C3 |

---

## 3. Ma Trận Kiểm Thử Thực Tế (Test Matrix)

| Hạng Mục | Lệnh Thực Thi | Kết Quả | Chi Tiết |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `npm run lint` | **PASS** | Exit code 0, 0 lỗi TypeScript strict mode |
| **Core Engine Baseline** | `npm run test:core` | **PASS** | 15/15 checks Core engine & C1 walkthrough GREEN |
| **C2 Regression** | `npm run test:c2` | **PASS** | 158/158 tests C2 giữ nguyên 100% GREEN |
| **C3 Test Suite Toàn Diện** | `node --import tsx --test src/game/c3-layout.test.ts src/game/c3-m1.test.ts src/game/c3-document.test.ts` | **PASS** | **23/23 tests GREEN** (6 layout + 8 m1 + 9 document/reread/helpers) |
| **Core Geometry Gate Provenance** | `C3_MOVEMENT_CHECKOUT=... node --import tsx --test src/core/c3-*.test.ts` (ở Core) | **PASS** | **172/172 tests GREEN**, 0 SKIP, 0 FAIL |
| **Production Build** | `npm run build` | **PASS** | Client và Server bundle build thành công (exit 0) |
| **Kiểm Thử Trình Duyệt / Touch / Focus / Occlusion** | *Chưa khởi chạy phiên trình duyệt thực tế* | **NOT RUN** | Cần candidate tích hợp và môi trường browser |

### Báo cáo Độ Phủ Mã Nguồn (Coverage Report) Minh Bạch Theo Phạm Vi:

1. **Phạm vi module logic C3 chuyên biệt:**
   - Lệnh: `node --import tsx --test --experimental-test-coverage '--test-coverage-include=src/game/bagua-puzzle.ts' '--test-coverage-include=src/game/c3-documents.ts' '--test-coverage-include=src/game/puzzle-actions.ts' '--test-coverage-include=src/game/character-scale.ts' '--test-coverage-include=src/game/npc-portraits.ts' src/game/c3-layout.test.ts src/game/c3-m1.test.ts src/game/c3-document.test.ts`
   - Kết quả: **100.00% Lines** / **93.24% Branches** / **100.00% Functions** (vượt xa ngưỡng 80/80/80).
2. **Phạm vi toàn bộ module game chia sẻ (kể cả renderer và walker khi chạy cùng bộ test hồi quy C2):**
   - Lệnh: `node --import tsx --test --experimental-test-coverage '--test-coverage-include=src/game/c3-documents.ts' '--test-coverage-include=src/game/bagua-puzzle.ts' '--test-coverage-include=src/game/puzzle-actions.ts' '--test-coverage-include=src/game/character-scale.ts' '--test-coverage-include=src/game/npc-portraits.ts' '--test-coverage-include=src/game/room-render.ts' '--test-coverage-include=src/game/room-walker.ts' src/game/c2-*.test.ts src/game/c3-layout.test.ts src/game/c3-m1.test.ts src/game/c3-document.test.ts`
   - Kết quả: **86.06% Lines** / **92.86% Branches** / **91.53% Functions** (tất cả 3 chỉ số đều $\ge 80\%$).

---

## 4. Đề Xuất Delta Candidate Entry Cho Leader (Chưa Tự Bật PLAYABLE)

- Cờ `PLAYABLE` tại [`src/game/Game.tsx:36`](file:///Users/thanhdanh/Nep-Remix-frontend/src/game/Game.tsx#L36) tiếp tục giữ nguyên `['prologue', 'c1', 'c2']`.
- Khi Leader và Tester sẵn sàng phiên tích hợp candidate, delta duy nhất cần áp dụng để mở đường chơi menu là:
  ```diff
  - const PLAYABLE:ChapterId[]=['prologue','c1','c2'];
  + const PLAYABLE:ChapterId[]=['prologue','c1','c2','c3'];
  ```
- Frontend không tự ý sửa dòng này để tuân thủ tuyệt đối quy trình bàn giao.
