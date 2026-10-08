# Cốt truyện Tiệm May Nếp — hồ sơ thiết kế và triển khai

Ngày lập: 06/10/2026. Trạng thái: **đặc tả đề xuất để triển khai**, không phải xác nhận game đã hoàn thành. Phạm vi: Mở đầu + 5 chương, 17 phòng, 25 câu đố đang có trong dữ liệu.

## Trải nghiệm hướng tới

An mở chiếc rương của bà, lần theo những nếp áo để nghe câu chuyện của những người phụ nữ trong gia đình. Người chơi không “cứu” họ bằng một bộ đồ đúng chuẩn: người chơi tìm chứng cứ, giúp tiếng nói của họ được lắng nghe và cùng họ hoàn thiện chiếc áo họ chọn mặc. Đến hiện tại, An học cách gìn giữ ký ức mà vẫn được sáng tạo.

Thể loại: khám phá point-and-click, giải đố vật phẩm, visual novel và phối đồ. Không chiến đấu, không đếm ngược, không phạt thử sai, không bắt mua vật phẩm để đi tiếp. Mục tiêu thiết kế khoảng 90–120 phút cho lần chơi đầu; đây là giả thuyết cần playtest, không phải thời lượng đã đo.

## Đọc theo vai trò

| Tài liệu | Nội dung / người sử dụng |
|---|---|
| [01 — Cốt truyện và nhân vật](01-narrative.md) | Biên kịch, thiết kế nội dung: chủ đề, gia phả, giọng thoại, kết thúc |
| [02 — Gameplay và UX](02-gameplay.md) | Game designer, frontend: thao tác, sáu loại câu đố, gợi ý, phối đồ |
| [03 — Kịch bản từng chương](03-chapters.md) | Đường đi đủ 17 phòng, toàn bộ 25 puzzle ID, điều kiện mở khóa, lời thoại mẫu |
| [04 — Kế hoạch kỹ thuật](04-implementation.md) | Source map, các điểm chưa triển khai, hợp đồng trạng thái, thứ tự build |
| [05 — Mỹ thuật và âm thanh](05-art-audio.md) | Danh sách cảnh, bố cục tương tác, yêu cầu asset và khả năng tiếp cận |
| [06 — Văn hóa và nguồn](06-cultural-review.md) | Phân biệt sử liệu/hư cấu, các nội dung phải sửa và cổng duyệt văn hóa |
| [07 — Nghiệm thu](07-acceptance.md) | Walkthrough, kiểm thử âm tính, save/reward, điều kiện phát hành |
| [08 — Bàn giao asset C2](08-c2-asset-handoff.md) | Nền A đã chọn, nhân vật theo ảnh mẫu, gói duyệt và giới hạn kỹ thuật cho team |
| [09 — Kế hoạch Leader C2](09-c2-leader-plan.md) | Team bốn agent, ownership, cổng M0–M5, contract, test và prompt khởi động |

## Những gì đã có và chưa có

Kiểm tra mã nguồn tại ngày lập tài liệu:

- [Content](../../src/content/chapters/) có đủ sáu phần, nhưng [Game.tsx](../../src/game/Game.tsx) chỉ cho chơi `prologue` và `c1`.
- [RoomScene.tsx](../../src/game/RoomScene.tsx) mới ánh xạ cảnh hai phần này; [assets/areas](../../assets/areas/) chỉ có `prologue` và `chapter-1`.
- Core có evaluator cho sáu loại puzzle, nhưng modal chưa có giao diện chuyên biệt cho `order`, `code`, `find`; phần `use` nhiều vật phẩm cũng cần bổ sung.
- C2–C5 chưa có `completionDialogueId`. Cấp thưởng hiện chưa cấp đủ áo/thẻ/phụ kiện theo dữ liệu. Không thể chỉ bật bốn chương trong `PLAYABLE` rồi coi là hoàn tất.
- Một số nội dung bắt buộc nằm ở mặt `trai`, trong khi Lật vải đang tắt. Bản chiến dịch cơ sở trong hồ sơ này phải hoàn thành được hoàn toàn trên mặt `phai`.

## Thứ tự ưu tiên và quyết định cần chốt

[Quyết định dự án](../01-overview/decisions.md) là căn cứ hiện hành. Hồ sơ này giữ nhân vật, năm, area ID và puzzle ID; những thay đổi dưới đây là đề xuất, cần ghi nhận vào decisions trước khi code. Không mặc nhiên thay đổi cam kết demo 10/10 thành toàn bộ chiến dịch.

| Mục | Hướng đề xuất | Lý do |
|---|---|---|
| Điều khiển | Chạm/click là chính, bàn phím tương đương | Khớp UI point-and-click hiện tại; cần hòa giải mô tả điều khiển cũ |
| Lật vải | Không bắt buộc trong toàn chiến dịch cơ sở; pha sau là tăng cường hình ảnh | Tránh khóa tiến trình khi tính năng tắt |
| Kinh tế | Mở đầu 50 Sen; mỗi C1–C5 100 Sen | Theo quyết định hiện hành; JSON C2–C5 đang khác |
| C2 năm 1935 | Bài phối dùng `ao-dai-lemur`, không bắt dùng mẫu mô tả là cuối thập niên 1930 | Tránh lệch niên đại ngay trong bài học |
| C3 | Vạch trần sửa hồ sơ và nhận tiền, không phán xét tín ngưỡng | Chứng cứ phải chứng minh hành vi cụ thể |
| C5 | Đối chiếu mẫu với lời quảng cáo, không gọi vật liệu mới là “lai căng” | Phân biệt gian dối với cách tân |
| Assets | Tiếp tục đường dẫn runtime đang dùng, không di chuyển hàng loạt | Tài liệu asset cũ có quy ước khác |

## Phạm vi không làm ở đợt này

Không thêm combat, thế giới mở, nhánh kết thúc trừng phạt, gacha, tiền thật, multiplayer, AI chấm lịch sử hay AI bắt buộc để giải đố. Lựa chọn hội thoại đổi sắc thái và phản hồi, không nhân số chương. Không xây lại engine: mở rộng content/schema, command và renderer hiện có.

Hoàn chỉnh nghĩa là người chơi mới đi từ sân tiệm đến hậu truyện, lưu/tiếp tục được ở mọi bước, nhận đúng thưởng, không mắc kẹt, và mọi phát biểu văn hóa có nhãn cùng nguồn phù hợp. Xem [cổng nghiệm thu](07-acceptance.md).
