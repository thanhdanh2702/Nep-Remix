# 07 — Kế hoạch kiểm thử và nghiệm thu

Tài liệu này là kế hoạch cần thực hiện khi build; không phải kết quả test runtime của đợt viết docs.

## Ma trận walkthrough bắt buộc

Tạo save mới, không dùng debug để cấp vật phẩm hoặc bỏ qua điều kiện. Mọi chương chạy với `latVai=false`, không cần AI, không cần mua đồ. Ngoài happy path, thử làm sớm bước tiếp theo ở mỗi cổng.

| Ca | Tuyến kiểm thử | Kết quả cuối |
|---|---|---|
| W0 | Tiệm → cầu thang → gạt vải → lấy kim → lấy chìa → mở rương → thư bà | 3 puzzle, kết Mở đầu, 50 Sen, một thước, một thẻ, C1 mở |
| W1 | Nhặt con thoi/dây → ghép → thoát → cắt dây hộp bằng kéo có sẵn → đọc hai giấy → trình văn tự → thư → Cầm tự quyết → phối → ra cổng | 5 puzzle, áo/thẻ đúng `reward-c1`, 100 Sen, C2 mở |
| W2 | Thoại mở → bốn mảnh → ghép → chìa → két → đọc cả hai giấy → biên lai → bản vẽ → phối → kết | 5 puzzle, C3 mở, không cần mặt trái |
| W3 | Biên nhận → đọc mua chuộc → ra phố → ghi chú Càn/Tốn → mở tráp → đọc sổ/thư → trình hồ sơ → lời Mai → phối → kết | 3 puzzle; S1 không kẹt dù không có puzzle; C4 mở |
| W4 | Nam châm → kim → đủ kim/chỉ → thêu → đọc áo → xà 1845 → tráp → đọc trang → đối thoại họ → trình → phối → kết | 5 puzzle; không ra S2 chỉ bằng lấy kim; C5 mở |
| W5 | Livestream/mẫu → ba điểm khác nhau → hồ sơ → gác → đọc ký ức → thứ tự năm → trình hồ sơ → đính chính → phối → về tiệm | 4 puzzle, hậu truyện và quà cuối, mẹ Phương hiện tại không bị kể là đã mất |

Tổng 25 puzzle, 17 phòng. Mỗi phần thưởng nhận đúng một lần. Tổng Sen từ sáu reward = 550 theo baseline được duyệt; tính delta riêng để không lẫn thưởng đọc thẻ, số dư ban đầu hoặc mua đồ.

## Core: test âm tính và invariant

| Nhóm | Input/hoàn cảnh | Kỳ vọng |
|---|---|---|
| Sở hữu | Submit đúng ID nhưng chưa có vật; present giấy chương khác | Bị từ chối, state không đổi |
| Use nhiều vật | Mảng rỗng, chỉ kim, chỉ chỉ, trùng kim, vật dư | Không thành công; chỉ tập kim + chỉ hợp lệ được giải thêu |
| Order | Sai thứ tự, thiếu, trùng, ID lạ; có thứ tự đúng nhưng chưa nhặt đủ mảnh | Không giải; trả thông báo hữu ích |
| Code | Chuỗi sai, payload object, mã đúng gửi từ phòng khác | Không giải; C3 chọn nhãn gửi đúng `CAN_TON` |
| Find | Cùng điểm ba lần; thiếu một; ID ngoài ảnh | Không giải; đúng ba điểm duy nhất mới đạt |
| Gate | Chạy command giải/đối thoại kết trước prerequisite | Core từ chối dù bỏ qua UI |
| Điều hướng | Nhảy thẳng phòng đã mở nhưng không có exit; `prologue` dùng làm area | Không chuyển; Hub dùng navigation riêng |
| Dialogue | Hai trigger; reload giữa trigger 1 và 2; đóng modal | Thứ tự không mất/nhân đôi; clue chưa đọc chưa cấp |
| Reward | Double click, dispatch lại, reload sau completion trước claim, claim lại | Tiền và tập quà không nhân; pending claim có thể phục hồi |
| Undo/replay | Undo quanh solve/claim, chơi lại kết chương | Không farm Sen, không mất đồ đã sở hữu ngoài replay |
| Styling | Chưa sở hữu áo thưởng; hết Sen; màu khác | Có loan wardrobe, qua màn được; màu không làm sai nếu không nằm trong brief |

Mọi đường hoàn thành (`puzzle/submit`, `item/use`, lệnh solve nội bộ nếu giữ) phải cùng guard, cùng outcome. Test không chỉ gọi đường UI hay dùng fixture đã tự cấp mọi vật.

## Lưu, khôi phục và migration

Tối thiểu một fixture trước/sau mỗi loại puzzle: đang xếp mảnh, chọn mã, chọn điểm, chọn hai vật và phối đồ. Reload giữ đúng bản nháp, inventory, phòng, node thoại và queue; không tự giải.

Fixtures bổ sung: save Mở đầu/C1 cũ; đã claimed nhưng thiếu áo/thẻ; đã complete trước khi có thoại kết mới; node bị đổi; JSON hỏng; version không hỗ trợ; localStorage hết chỗ/bị chặn. Kết quả không mất save gốc, không trừ tiền cũ, không cấp tiền hai lần. Thông báo lỗi có cách quay lại an toàn và không tuyên bố đã lưu khi thất bại.

## Kiểm tra dữ liệu và assets

- Parse toàn bộ content bằng Zod; kiểm tra ID tham chiếu và completed dialogue có thật.
- Mỗi puzzle reachable từ start của chương, không cần reward của chính chương để giải.
- Mỗi area có đường vào/ra hợp lệ, exit arrow theo nền cuối; đoạn kết chuyển Hub riêng.
- Không có vật bắt buộc chỉ ở `trai`; không có thoại bắt buộc orphan không có trigger.
- Tất cả source key, garment ID, accessory ID, item ID và asset path resolve được.
- Tất cả ảnh đúng dimensions metadata; không nạp file `_raw` vào runtime; không lấy số liệu asset report cũ làm kết luận.
- Đề, ba hint và solution cùng một đáp án; văn bản không còn yêu cầu “xoay” hoặc “Lật vải” chưa có trong bản cơ sở.

## Browser và kiểm tra sử dụng

Kiểm thử ít nhất desktop 1440×900, laptop 1280×720, điện thoại 390×844 dọc và 844×390 ngang, tablet 768×1024. Kiểm tra Chromium tự động, thêm kiểm tra Safari trên thiết bị/macOS vì môi trường sử dụng có thể khác. Không lấy một screenshot để kết luận đa thiết bị đã đạt.

- Nút bấm ≥44px, không chồng hai hotspot; NPC/An không chắn cửa hoặc che vật cần chọn.
- Tab/Enter/Escape giải được toàn game; focus modal được giữ và trả lại đúng nơi; Space không kích hoạt Soi khi đang nhập.
- Chữ tiếng Việt đọc được; tăng cỡ chữ vẫn cuộn tới nút tiếp; không có ý bắt buộc chỉ truyền bằng màu/âm thanh.
- Modal, inventory, bản đồ và Studio không chồng trạng thái; chuyển tab/reload không làm An đi mãi.
- Reduced motion và mute không làm mất manh mối. Đợi hiệu ứng kết thúc trước chụp bằng chứng lỗi.
- Bản build không có lỗi console/asset 404 trên happy path; thiếu asset/lỗi save có fallback rõ.

## Playtest nhịp và nội dung

Đề xuất vòng đầu 5 người chưa đọc lời giải, gồm người dùng điện thoại và người ít chơi giải đố. Ghi thời gian mỗi phòng, số lần sai, thời điểm mở gợi ý và chỗ không biết làm gì. Đây là nghiên cứu định tính nhỏ, không dùng để tuyên bố độ hiệu quả thống kê.

Mục tiêu vòng đầu: ít nhất 4/5 hoàn thành với gợi ý trong game, không cần người quan sát chỉ đường; không có softlock. Nếu đa số đứng yên trên 3 phút ở cùng một chỗ vì không hiểu UI, sửa khả năng nhìn thấy/brief trước khi giảm độ khó đáp án. Hỏi lại: “Vì sao chứng cứ này quan trọng?” và “Cách tân khác quảng cáo sai ở đâu?” để kiểm tra thông điệp không bị hiểu ngược.

Không gửi telemetry ra ngoài mặc định. Ghi chú thử nghiệm chỉ dùng mã người tham gia, không cần tên, ảnh hay dữ liệu riêng. Bổ sung analytics sản phẩm là một quyết định khác, không nằm trong scope tự động.

## Lệnh kiểm chứng sau khi có implementation

Các script hiện có trong [package.json](../../package.json):

```sh
npm run lint
npm run test:core
npm run build
npm run test:assets
npm run test:browser
```

Mở rộng `scripts/check-game.ts` hoặc suite tương đương từ walkthrough Mở đầu/C1 lên cả sáu phần. Thêm browser cases C2–C5 theo cấu hình Playwright đang dùng, không chỉ đổi cờ playable để test pass. Validator content phải có kiểm tra liên kết/ngõ cụt, vì Zod đơn thuần không chứng minh chơi được.

## Definition of Done

Chỉ ghi “Cốt truyện hoàn chỉnh” khi W0–W5 pass trên fresh save; fixtures migration pass; đủ áo/thẻ/reward; không cần AI, tiền hay flip để qua màn; 17 nền và các ảnh chứng cứ đạt QA; thoại kết đủ sáu phần; không còn claim văn hóa bắt buộc chưa được duyệt. Mọi lỗi P0/P1 trong kế hoạch kỹ thuật phải đóng bằng test hoặc bằng quyết định scope rõ ràng không ảnh hưởng đường đi.

Biên bản phát hành ghi commit/build, thiết bị, suite và kết quả thực chạy, người duyệt nội dung, vấn đề còn lại. Không đánh dấu checklist hoàn tất chỉ vì tài liệu đã tồn tại.
