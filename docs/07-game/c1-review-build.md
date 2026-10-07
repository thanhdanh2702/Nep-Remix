# Bản C1 bàn giao chủ dự án nghiệm thu

Ngày: 07/10/2026. Worktree Leader: `/Users/thanhdanh/Nep-Remix`, nhánh `main`. Chỉ Mở đầu/C1; không push, không triển khai C2–C5.

## Nguồn tích hợp

- Core đến `38ed058` và Frontend `0f01922` đã nằm trong merge `7ea60e8`.
- Tester: cherry-pick riêng `801c976` → `6e857fa` và `cd18e81` → `e50d377`. Không merge nguyên nhánh Tester: nhánh còn lịch sử docs/tooling/plans ngoài nhiệm vụ C1, gồm xóa nhiều file kế hoạch. Không xóa hoặc chỉnh các file đó.
- Worktree Tester còn hai file tracked chưa commit (`scripts/check-game.ts`, `tests/browser/sprint01-integration.spec.ts`) và các script tạm untracked; giữ nguyên tại worktree đó, chưa đưa vào bản nghiệm thu. Core/Frontend không có thay đổi chưa commit khi kiểm tra.
- README tổng quan và thư mục graph untracked của Leader được giữ nguyên, không đưa vào commit bàn giao. Không cập nhật/reset các worktree khác.

## Kiểm chứng Leader

Baseline runtime/test: `main@e50d377`. Build production riêng, `QA_BASE_URL=http://127.0.0.1:3021`, Chrome headless, timeout Playwright mặc định; không tái sử dụng dev server của worktree khác.

- Build client/server, `npm run lint`: PASS; còn warning bundle >500 kB.
- `npm run test:core`: PASS 15 self-check và walkthrough.
- `node --import tsx --test src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts`: PASS 26/26.
- `node --import tsx scripts/validate-content.ts`: valid=true; parse các JSON có sẵn không phải nghiệm thu C2–C5.
- `QA_BASE_URL=http://127.0.0.1:3021 npm run test:assets`: PASS 139 PNG, mobile room overflow/console checks.
- `npm audit --omit=dev` online: 0 vulnerabilities.
- `QA_BASE_URL=http://127.0.0.1:3021 npx playwright test`: full suite PASS **64/64** trong 2.2 phút; gồm C1 fresh walkthrough, reload, reread gương, toast mobile, modal và ca bảo toàn save hỏng đã cập nhật.
- Không đo lại coverage, không chạy Safari/thiết bị thật. Ca modal hiện chỉ assert focus sau Tab và đóng bằng Escape, chưa assert đầy đủ Shift+Tab/trả focus dù tên test và checklist ghi rộng hơn. Không coi suite xanh là bằng chứng đầy đủ cho các nhánh chưa assert.

## Cách nghiệm thu

Từ worktree Leader chạy `npm run build`, sau đó `PORT=3021 NODE_ENV=production node server.mjs` (hoặc dùng server 3021 của lượt này nếu còn chạy). Mở `http://localhost:3021` bằng profile trình duyệt riêng để bắt đầu từ save mới mà không xóa save đang chơi. Mở đầu → C1 → S1 ghép/mở cửa → S2 cắt dây và đọc hai giấy → S3 trình giấy/phối đồ/thoại kết → nhận thưởng/về Hub. Thử reload giữa thoại và lúc phối đồ, xem lại thoại, kiểm tra thưởng không nhân đôi.

Kỳ vọng bản hiện có: fresh balance 100 → 250 qua hai chương khi không mua/đọc thẻ; nhận đủ quà theo content. C2–C5 không playable. Cổng và thứ tự bắt buộc theo thiết kế C1 mới chưa được gắn, không nhầm với walkthrough hiện có.

## Giới hạn còn lại

Loan wardrobe, reset save có backup, replay UI và gate/content C1 mới vẫn chưa triển khai/chờ duyệt như `src/core/SPRINT-01-PROPOSALS.md`. Save hỏng được giữ nguyên và báo chưa lưu; đây không phải chức năng reset thành công. Đây là bản tích hợp để chủ dự án nghiệm thu **nội dung C1 hiện có**, chưa tự động đóng toàn Sprint 01.
