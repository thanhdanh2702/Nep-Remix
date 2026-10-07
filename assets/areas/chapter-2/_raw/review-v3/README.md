# C2 — gói duyệt và bàn giao v3

> Bản lưu lịch sử. Đã được thay bởi [production-v4](../production-v4/README.md); xem [gallery hiện hành](../production-v4/gallery.html). Các dòng “chưa hoàn tất” bên dưới ghi trạng thái tại thời điểm v3, không phải trạng thái bàn giao mới.

Ngày 07/10/2026. [Mở gallery](gallery.html). Đây là **gói duyệt hình ảnh**, không phải xác nhận mọi asset đã hoàn tất hậu kỳ hoặc chương đã chơi được.

## Quyết định đã chốt

- Người dùng chọn bộ nền A: nắng ấm, gỗ nâu. Ba nền đã sao chép ra thư mục runtime chương hai, giữ nguyên ảnh gốc, đăng ký metadata.
- Tỷ lệ nhân vật lấy theo ảnh người dùng tại references/user-proportion-reference.png, không theo hai bảng chibi v2. Đầu nhỏ hơn, thân và tà áo dài hơn. Quyết định này ưu tiên cho C2 khi khác mô tả chibi chung.
- Loan trẻ ở năm 1935, thường nhật áo ngũ thân; triển lãm áo cảm hứng Lemur cổ lá sen và vai bồng nhẹ. Hai bộ giữ cùng khuôn mặt và tư thế.
- Nhân vật và bản vẽ mới **chờ người dùng duyệt**, nằm trong _raw nên không được glob runtime nạp.

## Đã có trong gói

- Ba nền A chính thức, ba nền B chỉ lưu làm phương án dự phòng, không dùng cho build.
- Năm PNG mới: Loan thường nhật, Loan triển lãm, Cả Nghị, Ông Lệ, nhóm người nghe.
- Một bản vẽ liền mới. Frontend có thể chia cùng một ảnh thành bốn dải trong UI để nét nối khớp tuyệt đối; tên tác giả và nội dung chứng cứ render bằng chữ thật.
- Sheet đạo cụ A/B và két: chỉ tham khảo hình, không coi là atlas hay overlay hoàn chỉnh.
- Manifest, prompt log, QA kích thước/alpha/hash và ảnh tỷ lệ tham chiếu.

## Chưa hoàn tất kỹ thuật

Nhân vật vẫn là PNG gốc độ phân giải lớn, không phải frame hay animation atlas đã căn theo khung An. Cần duyệt hình, chuẩn hóa canvas/anchor, làm sạch viền và kiểm tra alpha bằng công cụ đồ họa. Một số alpha bounds chạm cạnh ở Ông Lệ/người nghe; bản vẽ còn vùng mờ. Các phép đo trong qa.json không thay thế QA bằng mắt.

Chưa có animation walk, bộ biểu cảm riêng, layer áo Lemur mặc trên An đã căn khớp, overlay két mở và bản vẽ treo đã đo theo nền. Không đổi trạng thái những mục này thành hoàn chỉnh. Icon túi đồ hiện có được tái sử dụng, không thay bằng sheet lớn.

## Team đọc gì

Xem [hồ sơ bàn giao](../../../../../docs/07-game/08-c2-asset-handoff.md), manifest.json và docs/07-game/03-chapters.md. Không copy mọi PNG trong _raw vào runtime. Không dùng các mẫu Loan/Cả Nghị v1/v2 từ output/imagegen/chapter-2.

Thứ tự: người dùng duyệt nhân vật → chuẩn hóa kỹ thuật → promotion theo manifest → cập nhật runtime-assets → kiểm tra build và playtest C2. Frontend/backend có thể bắt đầu logic trên ba nền A trong lúc chờ art; tester không nghiệm thu full-art khi các mục trên chưa đóng.
