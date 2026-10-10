# Màn chờ và luồng vào Tiệm May Nếp

Cập nhật 02/10/2026 theo yêu cầu mới: mỗi lần mở web, người chơi đến màn chờ trước khi vào game. Đặc tả này thay thế luồng vào thẳng sân nhà trước đây.

## Màn chờ

Thông điệp chính: **Áo dài Việt. Chất riêng bạn.**
Khẩu hiệu: **Một tà áo. Muôn câu chuyện.**

Desktop đặt lời mời và nút ở trái, sân tiệm may pixel cùng các nhân vật áo dài ở phải. Mobile xếp tiêu đề, tranh minh họa và nút theo chiều dọc. Dùng bảng màu kem, tím mận, hồng sen cùng đường viền pixel.

Header kem gồm logo Tiệm May Nếp, Về Nếp và Cách chơi. Footer kem gồm Phối áo dài, Chuyện nhà và Nếp văn hóa. Hai thanh này luôn giữ nguyên khi vào game; vùng chơi co giãn và nằm giữa, thay cho khung 8:5 có khoảng đệm cũ.

## Các thao tác đang có

- **Vào game:** chỉ lúc bấm mới mở Game với nhân vật có sẵn. Bản lưu hợp lệ đổi nhãn thành Tiếp tục chơi.
- **Tải ảnh của bạn:** chọn ảnh JPG/PNG/WEBP, tick đồng ý gửi tới Google Gemini, bấm **Phân tích bằng Gemini** để nhận gợi ý kiểu tóc rồi **Dùng diện mạo này** để áp vào An. Ảnh được thu nhỏ trên máy, không lưu lại; đóng hộp thoại là xóa.
- **Chân dung pixel:** trong cùng hộp thoại, chọn giới tính (hiện chỉ "Nữ", "Nam" để "Sắp có") rồi bấm **Vẽ chân dung pixel**. Gemini kiểm tra ảnh (một người, thấy mặt, người lớn) và vẽ chân dung bán thân theo phong cách nhân vật trong tiệm; trình duyệt thu về lưới 96×96 pixel. Bấm **Dùng chân dung này** để lưu trên thiết bị: chân dung hiện trên HUD và cạnh lời thoại khi An nói. **Xoá chân dung đã lưu** để quay về như cũ. Nhân vật đi lại trong game vẫn là An ghép lớp.
- **Cách chơi:** ngoài sân đi bằng WASD/phím mũi tên (điện thoại: nút hướng) và E/Tương tác; trong phòng cốt truyện bấm/chạm vào vật có viền sáng, **Soi** (Space) để lộ mọi vật, mở **Túi đồ** để ghép vật phẩm.
- **Về Nếp:** giới thiệu mục tiêu giúp người trẻ tiếp cận văn hóa áo dài.
- **Ba mục footer:** giới thiệu các phân hệ khi đang ở màn chờ; mở phòng tương ứng khi đang chơi.
- **Logo hoặc Màn chờ:** quay về màn chờ khi không có hội thoại/modal game đang mở.

Mở thông tin hoặc menu tạm dừng di chuyển. Hội thoại/modal trong game khóa các nút điều hướng ngoài để tránh chồng hộp thoại. Lưu tiến trình và lựa chọn diện mạo thủ công vẫn hoạt động như trước.

## Tải ảnh ở phiên bản này

Chấp nhận JPG/PNG/WEBP tối đa 5 MB. Ảnh hợp lệ được xem trước, kèm tên file và nhãn **Tạo nhân vật pixel · Sắp có**. Tệp sai định dạng, quá lớn hoặc không giải mã được hiển thị thông báo để chọn lại.

Ảnh chỉ được xem trước trên thiết bị. Không tải ảnh lên máy chủ, không gọi tuyến AI, không tạo kết quả nhân vật giả, không lưu ảnh gốc vào localStorage. Object URL được thu hồi khi thay ảnh hoặc đóng ứng dụng.

Chỉ khi người dùng tick đồng ý và bấm **Phân tích** hoặc **Vẽ chân dung pixel** thì ảnh (đã thu nhỏ) mới được gửi tới Gemini. Thứ duy nhất được giữ lại là chân dung pixel 96×96 người dùng chọn lưu; ảnh gốc không bao giờ được lưu. Sprite nhân vật nam chưa có nên lựa chọn "Nam" đang khóa.

## Tiêu chí hoàn thành

- Lần mở trang mới và sau reload đều hiển thị màn chờ.
- Chưa mount canvas hay ghi tiến trình game trước khi bấm vào chơi.
- Các nút mở đúng bảng, chọn ảnh có xem trước và lỗi rõ ràng.
- Không có yêu cầu đến /api/ai/ trong luồng tải ảnh hiện tại.
- Header/footer kem giữ cùng vị trí trước và sau khi vào game.
- Game, nền phòng và các bảng nằm trong vùng giữa trên desktop, mobile dọc và ngang.
- Người chơi cũ tiếp tục bản lưu qua nút Tiếp tục chơi.
