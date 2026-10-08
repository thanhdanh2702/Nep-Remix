# Checklist Kiểm thử Follow-up Sprint 01

## 1. Kiểm tra Reread (Core)
- [x] Tương tác lại với hotspot (vd: gương) mở được thoại đã đọc.
- [x] Không cấp lại clue/quà hoặc thay đổi completion khi đọc lại.
- [x] Reload giữa lúc đang reread vẫn giữ chế độ này.
- [x] Đọc lại không chen ngang hoặc làm mất queue thoại chưa đọc.

## 2. Kiểm tra Toast trên Mobile (Frontend)
- [x] Viewport 844x390: Hotspot vẫn click được khi toast đang hiện (toast không chặn pointer-events).
- [x] Nút đóng toast vẫn hoạt động bình thường.
- [x] Không sử dụng force click hoặc sleep dài trong code test.

## 3. Kiểm tra Focus & Modal (Frontend)
- [x] Nhấn Tab/Shift+Tab không bị thoát focus khỏi modal (Focus trap hoạt động).
- [x] Nhấn Escape đóng modal thành công.
- [x] Sau khi đóng modal, trả focus về đúng điểm mở (nếu điểm đó còn tồn tại).

## 4. Reduced Motion & Touch Target (Frontend)
- [x] Nút chạm (touch target) giữ ngưỡng >=43.5px đối với thiết kế 44px.
- [x] Sửa các đoạn `waitForTimeout(50)` thành `expect.poll` hoặc đợi animation thay vì sleep cứng.

## 5. Regression & Suite Run
- [x] `npm run test:core`
- [x] `node --import tsx scripts/validate-content.ts`
- [x] `npm run lint` & `npm run build`
- [x] `npx playwright test tests/browser/chapter1.spec.ts tests/browser/sprint01-integration.spec.ts`
- [x] Chạy Full Browser Suite với timeout mặc định và kiểm tra Asset.
- [x] Chạy kiểm thử trên Safari/thiết bị thực (ghi rõ nếu không có môi trường). *(Đã skip vì không có môi trường Safari/thiết bị thực, chỉ chạy trên Playwright Chromium).*

## 6. Phân loại tồn đọng (Không nghiệm thu vội)
- [x] Bug Reset save hỏng: Ghi nhận regression, báo rõ chưa có backup/reset (Không sửa thành PASS).
- [x] C1 mới (Loan wardrobe, replay UX, gate/content): Giữ trạng thái chưa duyệt. Đợi chủ dự án.

---

# QA Report
- **Commit được kiểm thử:** `d279a07` (nhánh main)
- **Môi trường & Server:** 
  - Worktree: `/Users/thanhdanh/Nep-Remix-test`
  - Server: `QA_BASE_URL` (Dev Server local HTTP)
  - Browser: Chromium (Playwright)
  - Viewports: Default (1366x1100), Mobile (844x390)
  - *Lưu ý: Không có môi trường Safari hay thiết bị thật để chạy.*
- **Lệnh đã chạy:**
  - `npm run test:core` (15/15 PASS)
  - `node --import tsx scripts/validate-content.ts` (PASS, true)
  - `npm run lint` & `npm run build` (PASS)
  - `npm run test:browser` (Full suite - 64/64 PASS)
- **Chi tiết kiểm thử:**
  - Đã phân biệt *Fresh walkthrough* (`chapter1.spec.ts`) và *Seeded fixture* (`sprint01-integration.spec.ts`).
  - Playwright Test 5 (`chapter1.spec.ts: modal focus trap`) ban đầu bị timeout do flaky race condition giữa tốc độ click của Playwright và animation di chuyển của nhân vật (khi click hotspot vật phẩm nhanh hơn thời gian character đi đến đích thì bị cancel). Lỗi đã được fix ổn định bằng cách thiết lập `reducedMotion: 'reduce'` cho hàm `finishPrologue` mà không cần dùng sleep ảo.
  - Bug `Reset save hỏng` (broken json): Đã verify trên `game.spec.ts`. Việc parse lỗi JSON trên localStorage không còn gây sập; game chặn việc lưu đè lên file hỏng và hiển thị toast "Bản lưu không hợp lệ". Do backup/reset chưa được triển khai, regression test đã ghi nhận đúng hành vi mong đợi hiện tại (Bản lưu không hợp lệ, không lưu đè).
- **Tồn đọng (Chưa nghiệm thu):**
  - Cơ chế Backup & Reset save thực tế.
  - Loan wardrobe, Replay UX và Gate/Content C1 mới (chờ Leader duyệt/bàn giao).
  - Chưa làm kiểm thử cho C2-C5 do chưa có kế hoạch.
