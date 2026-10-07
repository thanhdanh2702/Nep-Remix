# Sprint 01 — Review, tích hợp và bàn giao Tester

## Follow-up reread và UI — baseline bàn giao Tester 07/10/2026

- Merge runtime **`7ea60e8`**: Core đến `38ed058` (fast-forward), Frontend `0f01922` (merge không conflict). Đã review 13 file trong delta từ `9521d19`; giữ nguyên README ngoài scope và hai thư mục graph untracked. Không push, không khởi tạo agent, không triển khai C2–C5. Các phần phía dưới là lịch sử, không thay thế kết quả mới ở đây.
- Core phân biệt click xem lại và trigger tự động; reread không cấp clue/completion/quà, không chen ngang thoại khác, giữ mode qua reload/migration node đã đổi. Replay được audit, không thêm replay UI. Frontend sửa pointer-events của toast (nút đóng vẫn nhận click), tắt animation/transition trong reduced motion và đưa focus từ ngoài modal trở vào khi Tab/Shift+Tab. Chưa có regression browser chuyên biệt cho toàn bộ nhánh focus/toast mới; Tester bổ sung theo checklist.
- Leader thực chạy trên bản tích hợp: build client/server PASS (còn warning chunk >500 kB); `npm run lint` PASS; `npm run test:core` PASS (15 self-check và walkthrough); validator valid=true; 26/26 regression PASS. Coverage giới hạn các file dialogue commands/queue, interact, chapter-replay, serialize: lines **85.65%**, branches **80.69%**, functions **83.33%**, không phải coverage toàn app. `npm audit --omit=dev` online: 0 vulnerabilities.
- Browser Chrome headless, production build của worktree Leader, `QA_BASE_URL=http://127.0.0.1:3019`: hai file `chapter1.spec.ts` + `sprint01-integration.spec.ts` PASS **9/9**, timeout mặc định. Lượt mở rộng ba file với grep `Chapter 1|C1|draft|prologue|save|styling|with motion An walks` đạt **11 PASS, 1 FAIL / 12**; gồm reread gương PASS. Lỗi duy nhất tại `game.spec.ts:128`: helper parse `broken-json` như JSON mới. Đây là kỳ vọng cũ trái hợp đồng bảo toàn save hỏng, không phải bằng chứng reset đã hoạt động. Trace/screenshot của lượt FAIL được tạo dưới `test-results/`; lượt chạy tiếp theo có thể thay thế artifacts. Chưa chạy full browser/asset/Safari/thiết bị thật trong follow-up này.
- Tester giữ checklist **`801c976`** trên nhánh riêng; Leader không merge cả nhánh Tester vì có lịch sử khác ngoài scope. Tại worktree Tester, kiểm tra/lưu công việc hiện có rồi `git merge main`; xác nhận `git merge-base --is-ancestor 7ea60e8 HEAD`. Không reset hoặc bỏ checklist. Đảm bảo dependencies đã có trước khi chạy test. Không dùng server cũ của worktree khác: ghi rõ QA_BASE_URL và server/build, hoặc xác minh port mặc định vì reuseExistingServer=true.
- Thứ tự Tester: lint/build → 26 regression và test:core → validator → hai file browser 9 ca → bổ sung reread/toast/focus/reduced-motion và bỏ sleep 50 bằng polling/đợi animation → full browser với timeout mặc định → assets/viewport/Safari nếu có môi trường. Lệnh regression: `node --import tsx --test src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts`. Cập nhật ca save hỏng cũ thành kiểm tra bytes nguyên vẹn + thông báo chưa lưu; giữ regression reset riêng, không xóa bytes để làm pass.
- **Chưa nghiệm thu sprint.** Loan wardrobe, reset có backup, replay UX và gate/content C1 mới vẫn chờ duyệt theo `SPRINT-01-PROPOSALS.md` và kế hoạch. Không đổi decisions.md hoặc coi merge là phê duyệt. Reset save hỏng vẫn là lỗi đã biết; không đóng bằng ca bảo toàn save. Tester báo kết quả theo commit, phân biệt fresh walkthrough/seeded fixture, PASS/FAIL/chưa chạy và gửi commit test cục bộ cho Leader.

## Follow-up báo lỗi Tester — 07/10/2026

- Đã merge `agent/tester` đến `3bcad6d` bằng `55bf2f6`, giữ checklist và các cập nhật test của Tester. Những kết quả ở các phần bên dưới là lịch sử lượt tích hợp đầu, không phải kết quả mới nhất.
- Xác nhận RED: `npm run test:core` thất bại vì `guardPuzzle` trả `Puzzle is already solved.`. Checkpoint `13cc853` thêm regression dispatch cho cả `puzzle/submit` và `item/use`, kiểm tra tree không đổi. Sửa reason thành `Câu đố '<id>' đã được giải.` trong `gate.ts`.
- Softlock modal S2 **chưa tái hiện trên bản Leader**: trước khi sửa runtime, cả ba case `chapter1.spec.ts` mới của Tester đã PASS (hai desktop và mobile 844×390). Không sửa UI/queue khi chưa có reproducer thất bại. Thêm regression browser đọc thư → chuyển văn tự → reload → đọc xong → assert không còn dialog, activeDialogue=null, queue=[], đủ hai completed IDs/clue → click cửa sang S3. Ca này PASS.
- GREEN mới: `npm run test:core` PASS toàn bộ; `node --import tsx --test src/core/sprint-01.test.ts tests/leader-core-integration.test.ts` PASS 16/16; `npm run lint` và `npm run build` PASS (warning chunk >500 kB vẫn còn); `npx playwright test tests/browser/chapter1.spec.ts tests/browser/sprint01-integration.spec.ts` PASS **9/9** với timeout mặc định. `npm audit --omit=dev`: 0 vulnerabilities. Chưa chạy lại full browser suite, asset hoặc đo coverage trong follow-up chỉ sửa text này.
- Tester: merge `main` mới, chạy lại hai file browser và `test:core`. Nếu modal vẫn kẹt, đính kèm trace và activeDialogue/dialogueQueue/currentArea từ snapshot tại lúc kẹt; ghi rõ `QA_BASE_URL`, worktree và server đang chạy vì Playwright có `reuseExistingServer=true`. Không dùng kết quả cũ hoặc bỏ assertion đóng modal. Các quyết định thiết kế chưa duyệt và vấn đề runtime khác trong bảng bên dưới vẫn giữ trạng thái cũ.

Ngày: 07/10/2026. Worktree Leader: `Nep-Remix`, nhánh `main`. Trạng thái: **đã tích hợp để kiểm thử, chưa nghiệm thu sprint**. Không triển khai C2–C5, không push/publish, không khởi tạo agent.

## Commit và kết luận review

- Merge `20a61af` chứa toàn lịch sử Core đến `bb28282` và Frontend `bd02b6e`; không chỉ cherry-pick commit cuối Core vì phần implementation nằm ở các commit trước.
- Leader sửa các lỗi tích hợp ở `0529b38`, `971e14b`, `efefece`: dùng Core draft thay state React; mở/đóng/resume puzzle session; lưu và khôi phục bộ phối, phụ kiện, palette; hồi phục complete chưa claim; tra đúng catalog thẻ và hiển thị thước trong ending; giữ reward markers khi inverse command khôi phục snapshot.
- Checkpoint RED tương ứng: `17e03a9`, `e48fd56`, `3c9c1ab`. Các test có trong `tests/browser/sprint01-integration.spec.ts` và `tests/leader-core-integration.test.ts`.
- Giữ **15 Sen khi đọc thẻ lần đầu** theo decisions #3. Nhận thẻ từ reward chỉ thêm `unlockedCardIds`, không đọc thẻ hoặc cộng 15 Sen. Museum hiển thị thông tin thưởng và nhãn ký vật riêng. Đề xuất xóa khoản tiền của Frontend không được áp dụng.
- Gỡ loan list suy từ reward: UI cho chọn áo mượn nhưng `studio/applyPreset/equip` vẫn chặn đồ chưa sở hữu; phụ kiện đáp án cũng không nhất thiết nằm trong reward. Các props/badge hỗ trợ hiển thị được giữ, nhưng loan wardrobe chưa được coi là hoạt động. C1 hiện qua được bằng starter wardrobe; cần fixture thiếu đồ để nghiệm thu cơ chế mượn sau duyệt.
- `ui_proof.md` không tìm thấy trong worktree Frontend khi review; báo cáo 56/56 của nhánh đó không dùng làm chứng cứ cho bản tích hợp.

Hợp đồng Core: [SPRINT-01-CONTRACT.md](../../src/core/SPRINT-01-CONTRACT.md). Draft styling ngoài các trường solution còn lưu `color0..color3`, `eventContextId`, `motifId` dạng chuỗi; không đổi đáp án hay chấm màu. UI giữ undo/redo cục bộ Studio, đồng bộ draft mỗi thay đổi. Claim vẫn do Core guard và transition thực hiện; UI chỉ yêu cầu complete/claim khi đủ điều kiện, cả lúc khôi phục phiên.

## Kiểm chứng đã chạy

| Lệnh / phạm vi | Kết quả thực chạy |
|---|---|
| `npm run lint` | PASS sau sửa hai lỗi Frontend và guard Leader |
| `node --import tsx --test src/core/sprint-01.test.ts tests/leader-core-integration.test.ts` | PASS 15/15 (14 Core + 1 inverse rollback); trước sửa inverse test FAIL đúng lỗi xóa claim |
| `node --import tsx scripts/check-core.ts` | PASS 15/15 self-check |
| `npm run test:core` | FAIL tại `scripts/check-game.ts:24`: kỳ vọng clue trước acknowledge; cần Tester cập nhật rồi chạy hết file để phát hiện các kỳ vọng cũ tiếp theo |
| `node --import tsx scripts/validate-content.ts` | Valid=true; sáu JSON vẫn parse được, không phải nghiệm thu C2–C5 |
| `npm run build` | PASS; còn warning chunk >500 kB |
| `npm run test:assets` với preview production 4173 | PASS 139 PNG và kiểm tra overflow/console mobile trong script; chạy trước sửa guard inverse cuối, không thay assets |
| `npx playwright test tests/browser/sprint01-integration.spec.ts --timeout=20000` | PASS 5/5: draft vật sau submit sai/close/reload; W0 fresh và đủ quà; pending claim đúng một lần; giữ save hỏng; styling reload/cancel/reopen |
| `npx playwright test --timeout=20000` | **56 PASS, 5 FAIL / 61**; dùng timeout 20 giây để chẩn đoán, không thay config timeout 120 giây. Xem phân loại dưới đây; chưa có full-suite GREEN |
| `npm audit --omit=dev` | 0 vulnerabilities từ registry online trong lượt tích hợp |

Chưa đo coverage số %, chưa chạy Safari/thiết bị thật hoặc full W1 với cổng thiết kế mới. Fixture riêng cho pending claim/styling có seed tiến trình; không gọi chúng là fresh walkthrough. W0 mới và walkthrough Core Mở đầu/C1 không cấp đồ bằng debug.

## Phân loại lỗi còn lại và quyền xử lý

| Vấn đề | Chủ sở hữu / hành động |
|---|---|
| `scripts/check-game.ts` assert clue trước đọc; helper đọc C1 dừng khi queue hết nhưng chỉ kỳ vọng một thoại; thông báo solved/guard đã đổi | **Tester:** assert chưa có clue khi mở; acknowledge current node rồi assert clue. Đọc riêng `d-c1-thu-chong`, sau đó `d-c1-van-tu`; kiểm tra queue và completed IDs, không bỏ assertion |
| Hai browser cases C1 chờ không còn dialog ngay sau thư, nhưng văn tự đang được mở đúng queue | **Tester:** cập nhật helper theo ID/nội dung từng thoại, assert thứ tự, reload giữa hai giấy và clue chưa đọc; sau đọc đủ mới kỳ vọng dialog đóng |
| Browser save hỏng parse `broken-json` như một save mới | **Tester:** assert bytes gốc nguyên vẹn, thông báo invalid và không báo đã lưu. Dùng save hợp lệ riêng cho ca restore progression; không ép runtime ghi đè save hỏng |
| Browser tương tác lại gương không mở lời An: `enqueueDialogues` bỏ qua ID đã completed, kể cả click chủ động | **Core:** cần phân biệt trigger tự động (không lặp) với yêu cầu xem lại chủ động; xem lại không cấp clue/quà hai lần. **Tester giữ test này làm regression**, không đổi thành kỳ vọng im lặng |
| Mobile 844×390 bị toast success intercept click hotspot; timeout 20 giây ở ca touch target | **Frontend:** kiểm tra bố cục/pointer interception, giữ nút đóng toast dùng được. **Tester:** tái hiện với timeout mặc định, thêm ca click khi toast đang hiện; không dùng force click hoặc sleep dài để che lỗi |
| `waitForTimeout(50)` trong helper touch target | **Tester:** thay bằng đợi animation hoàn tất hoặc `expect.poll` kích thước ổn định; giữ ngưỡng ≥43.5px cho target 44px, không hạ ngưỡng |
| Cổng C1, thoại tự quyết, hộp cạnh cột và loan wardrobe chưa gắn vào content; replay UX chưa nối helper | **Chủ dự án + Core/Frontend:** các mục chờ duyệt trong sprint vẫn chưa được phê duyệt bởi thao tác merge. Không đổi gate/đáp án hoặc tuyên bố W1 đặc tả mới đã PASS |
| Reset sau save hỏng có xác nhận nhưng `saveGame` vẫn từ chối ghi đè | **Core/Frontend:** cần đường reset có bảo toàn backup và quyền thay save rõ ràng theo quyết định UX; Tester bổ sung ca reset, không xóa save trong fixture để làm pass |

Leader không sửa các bài test cũ thuộc Tester trong lượt này; chỉ thêm reproducer cần cho review/tích hợp. Trong khi làm xuất hiện thay đổi `docs/01-overview/README.md` ngoài scope; file đó và hai thư mục graphify untracked được giữ nguyên, không đưa vào commit tích hợp.

## Hướng dẫn Tester cập nhật và chạy

Worktree Tester đã có commit riêng `3b41123`; dùng **merge**, giữ checklist và mọi thay đổi của Tester:

```sh
cd /Users/thanhdanh/Nep-Remix-test
git status --short
git merge main
```

Chạy khi worktree sạch hoặc sau khi Tester tự lưu công việc hiện tại; không reset, không checkout đè file. Nếu conflict, giữ các ca kiểm thử của Tester rồi hòa giải với reproducer mới. Chỉ sửa `scripts/` kiểm thử và `tests/`; bug runtime gửi về đúng owner với trace/fixture.

Thứ tự: typecheck → 15 regression mới → cập nhật và chạy `test:core` → content validator → 5 browser regression tích hợp → W0/W1 browser đã cập nhật → full browser với timeout mặc định → build/asset → ma trận viewport trong sprint. Đăng ký hai regression suite mới vào lệnh kiểm thử chuẩn bằng script trong phạm vi; đổi `package.json` cần Leader phân công cụ thể.

```sh
npm run lint
node --import tsx --test src/core/sprint-01.test.ts tests/leader-core-integration.test.ts
npm run test:core
node --import tsx scripts/validate-content.ts
npx playwright test tests/browser/sprint01-integration.spec.ts
npx playwright test tests/browser/chapter1.spec.ts tests/browser/game.spec.ts
npm run test:browser
npm run build
```

Để chạy `npm run test:assets`, mở `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` bằng terminal riêng. Báo cáo test phải ghi commit/build, lệnh, PASS/FAIL, viewport, lỗi runtime so với kỳ vọng cũ và mục chờ duyệt. Tổng delta reward W0/W1 =150, fresh balance 100→250 khi không đọc thẻ/thu chi khác; đủ item/áo/thẻ, không nhân thưởng khi reload/claim lại.
