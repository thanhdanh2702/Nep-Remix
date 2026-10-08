# Checklist Nghiệm thu Mở đầu & Chương 1 (Sprint 01)

Dựa trên `team-sprint-01.md` và `07-acceptance.md`, đây là checklist kiểm thử ưu tiên **Tiến trình, Reward và Save**.

## 1. Mở đầu (W0)
- [ ] **Tiến trình:** Bấm rương, lấy kim/chỉ, mở rương, đọc thư bà.
- [ ] **Reward:** Hoàn thành đủ 3 puzzle, kết thúc chương nhận 50 Sen, 1 thước, 1 thẻ. Mở C1.
- [ ] **Save/Reload:** Reload ở giữa lúc đang lấy kim chỉ, trạng thái vẫn giữ nguyên.

## 2. Chương 1 (W1)
- [ ] **Tiến trình:** S1 (Nhặt con thoi, dây lưng -> Ghép -> Thoát ra S2).
- [ ] **Cổng S2 -> S3:** Cắt dây bàn thờ (dùng kéo), bắt buộc đọc hai giấy (văn tự, thư), S3 mới mở. 
- [ ] **Tiến trình S3:** Trình văn tự -> Trình thư -> Lời Cầm tự quyết -> Phối đồ -> Ra cổng.
- [ ] **Reward:** Hoàn thành đủ 5 puzzle, áo/thẻ nhận đủ theo `reward-c1`, cộng 100 Sen. Mở trạng thái C2.
- [ ] **Save/Reload:** Reload lúc đang đọc hai giấy, khi đang ở màn hình phối đồ không bị mất tiến trình.

## 3. Chặn Bypass & Âm tính (Negative tests)
- [ ] **Gate/Sở hữu:** Gửi `puzzle/submit` ID đúng nhưng chưa có đồ -> Từ chối.
- [ ] **Use nhiều vật:** Gửi mảng `item/use` bị thiếu, dư, trùng vật -> Từ chối.
- [ ] **Complete:** Cố tình gọi `chapter/complete` khi chưa đủ puzzle -> Từ chối.
- [ ] **Reward Idempotency:** Cố tình gọi `reward/claim` hai lần hoặc reload claim lại -> Từ chối, tiền không cộng dư.

## 4. Thoại & Queue
- [ ] Queue thoại xuất hiện đúng thứ tự, không mất, không nhân đôi khi reload.
- [ ] Clue chỉ cấp sau khi đã đọc/xác nhận node tương ứng.
- [ ] Lệnh `suspend` / xem lại Journal không đánh dấu hoàn tất thoại.

## 5. Migration & Replay
- [ ] **Migration:** Tải bản save cũ (v1) -> giữ lại đồ cũ, sửa lỗi nếu thiếu áo thưởng (không cộng thêm Sen lần 2).
- [ ] **Replay/Undo:** Undo quanh solve/claim không cày được tiền. Replay chương không làm mất vật phẩm gốc.

## 6. UI & Browser Accessibility
- [ ] Viewport: Desktop (1440x900, 1280x720), Mobile (390x844 dọc, 844x390 ngang). Không méo nền.
- [ ] Bàn phím: Chơi được bằng Tab/Enter/Escape; focus đúng chỗ sau khi đóng modal. Nút bấm ≥ 44px.
- [ ] Console/Network: Không có lỗi 404 về asset hoặc console error trên luồng Happy Path.
