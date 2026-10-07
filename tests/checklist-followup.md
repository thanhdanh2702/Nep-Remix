# Checklist Kiểm thử Follow-up Sprint 01

## 1. Kiểm tra Reread (Core)
- [ ] Tương tác lại với hotspot (vd: gương) mở được thoại đã đọc.
- [ ] Không cấp lại clue/quà hoặc thay đổi completion khi đọc lại.
- [ ] Reload giữa lúc đang reread vẫn giữ chế độ này.
- [ ] Đọc lại không chen ngang hoặc làm mất queue thoại chưa đọc.

## 2. Kiểm tra Toast trên Mobile (Frontend)
- [ ] Viewport 844x390: Hotspot vẫn click được khi toast đang hiện (toast không chặn pointer-events).
- [ ] Nút đóng toast vẫn hoạt động bình thường.
- [ ] Không sử dụng force click hoặc sleep dài trong code test.

## 3. Kiểm tra Focus & Modal (Frontend)
- [ ] Nhấn Tab/Shift+Tab không bị thoát focus khỏi modal (Focus trap hoạt động).
- [ ] Nhấn Escape đóng modal thành công.
- [ ] Sau khi đóng modal, trả focus về đúng điểm mở (nếu điểm đó còn tồn tại).

## 4. Reduced Motion & Touch Target (Frontend)
- [ ] Nút chạm (touch target) giữ ngưỡng >=43.5px đối với thiết kế 44px.
- [ ] Sửa các đoạn `waitForTimeout(50)` thành `expect.poll` hoặc đợi animation thay vì sleep cứng.

## 5. Regression & Suite Run
- [ ] `npm run test:core`
- [ ] `node --import tsx scripts/validate-content.ts`
- [ ] `npm run lint` & `npm run build`
- [ ] `npx playwright test tests/browser/chapter1.spec.ts tests/browser/sprint01-integration.spec.ts`
- [ ] Chạy Full Browser Suite với timeout mặc định và kiểm tra Asset.
- [ ] Chạy kiểm thử trên Safari/thiết bị thực (ghi rõ nếu không có môi trường).

## 6. Phân loại tồn đọng (Không nghiệm thu vội)
- [ ] Bug Reset save hỏng: Ghi nhận regression, báo rõ chưa có backup/reset (Không sửa thành PASS).
- [ ] C1 mới (Loan wardrobe, replay UX, gate/content): Giữ trạng thái chưa duyệt. Đợi chủ dự án.
