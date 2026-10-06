# Đặc Tả Tính Năng Game Cốt Truyện (Journey)

> Hồ sơ triển khai toàn bộ Mở đầu + 5 chương nằm tại [docs/07-game](../07-game/README.md): kịch bản từng phòng, gameplay, kế hoạch kỹ thuật, văn hóa và nghiệm thu. Đây là đặc tả đề xuất ngày 06/10/2026; không mở rộng mặc định phạm vi demo 10/10. Các mô tả Lật vải dưới đây thuộc hướng thiết kế mở rộng, không phải điều kiện của bản cơ sở.

## 1. Mục đích của khu vực

Cốt truyện (Journey, được mở ra từ biển gỗ gắn trên cổng vòm ở giữa sân nhà, gắn liền với hành trình khám phá chiếc rương cũ trên gác xép) là phân khu trò chơi giải đố theo thể loại tương tác tĩnh (point-and-click) kết hợp visual novel ngắn. Tính năng này mang lại tính sáng tạo độc đáo cho ứng dụng, dẫn dắt người chơi vào hành trình khám phá ký ức của các thế hệ phụ nữ qua từng thời kỳ áo dài. Thông qua cơ chế tương tác và tính năng cốt lõi "Lật vải" (Fabric Flip), người chơi tự mình tháo gỡ các khúc mắc định kiến trong đời sống mà không có yếu tố kinh dị hay áp lực thời gian.

## 2. Các bước người dùng thao tác

Bước 1: Người chơi chạm vào biển gỗ "Cốt truyện" (hoặc cổng vòm giữa sân tiệm) để mở giao diện trò chơi.

Bước 2: Xem đoạn mở đầu ngắn (có nút "Bỏ qua"). Người chơi trong vai người cháu tiếp quản tiệm may, bước lên gác xép tìm thấy cuốn sổ ghi chép may đo của bà và mở nắp chiếc rương cũ, để lộ chiếc áo dài đầu tiên thuộc Chương 1.

Bước 3: Khám phá khung cảnh point-and-click:
- Chạm vào các đồ vật trên màn hình (khung cửi, cuộn chỉ, bức thư ố vàng, chiếc kéo đồng) để thu thập vật phẩm vào thanh túi đồ (Inventory) ở đáy màn hình.
- Ghép nối hoặc sử dụng vật phẩm vào đúng vị trí để mở khóa các chi tiết tiếp theo.
- An di chuyển tới vật được bấm, dừng cạnh vật rồi mới gọi lệnh tương tác. Nút hotspot được đặt theo hitbox của vật thể, An vẽ dưới lớp NPC phía trước nhưng trên nền.

Bước 4: Sử dụng cơ chế "Lật vải" (Fabric Flip):
Tắt ở bản nộp 10/10 — xem decisions.md
- Chạm vào nút biểu tượng "Lật vải" ở góc màn hình. Khung cảnh lập tức đổi sang mặt trái của tấm vải (màu sắc đảo sang tông trầm lạnh, hiển thị các đường chỉ ràng buộc và những dòng chữ định kiến ẩn giấu).
- Thu thập manh mối ở mặt trái tấm vải mà mặt phải không nhìn thấy được.
- Bấm "Lật vải" lần nữa để quay lại mặt phải và dùng manh mối vừa tìm được để giải câu đố.

Bước 5: Vượt qua chướng ngại định kiến (Thực thể Ông Lệ):
- Ở cao trào của màn chơi, bóng đen Ông Lệ xuất hiện ngăn cản sự thay đổi.
- Người chơi không chiến đấu bằng bạo lực hay phản xạ nhanh, mà dùng chính những hiểu biết và vật phẩm ý nghĩa thu thập được (như cây kéo cắt chỉ định kiến, bức thư tay nói lên sự thật) để hóa giải sự im lặng.

Bước 6: Thử thách phối đồ cuối chương:
- Sau khi giải xong câu đố cốt truyện, người chơi thực hiện bài tập phối lại chiếc áo cho người phụ nữ trong chương đó theo đúng bối cảnh lịch sử.
- Hoàn thành thử thách, người chơi nhận được chiếc áo độc quyền của chương đó vào Tủ đồ và được thưởng 100 Sen Ngọc.

## 3. Các trạng thái màn hình

### Trạng thái bình thường
Khung cảnh màn chơi vẽ theo phong cách pixel art ấm áp, có độ phân giải đồng bộ với sảnh tiệm. Thanh túi đồ ở dưới cùng hiển thị các ô chứa vật phẩm nhặt được. Nút "Lật vải" sáng nhẹ ở góc phải màn hình.

### Trạng thái Lật vải (Fabric Flip Active)
Toàn bộ khung cảnh đổi sang tông màu sợi dệt thô mộc (tông xám tro và xanh chàm), các đường kim mũi chỉ sáng lấp lánh xuất hiện, phơi bày những vết cắt và chữ viết ẩn giấu. Nhạc nền chuyển sang âm thanh tiếng khung cửi lách cách chậm rãi.

### Trạng thái đang tải (Loading)
Chỉ mất khoảng 0.3 giây khi chuyển cảnh giữa các màn. Màn hình hiển thị hình ảnh nếp vải đang được trải ra cùng câu trích dẫn ngắn.

### Trạng thái trống (Empty)
Túi đồ khi mới bắt đầu chương hiển thị 4 ô trống dạng khung nét đứt bằng chỉ thêu. Khi chạm vào ô trống, hệ thống hiện thông báo: "Ô chứa đồ trống".

### Trạng thái lỗi (Error)
Khi người chơi kéo thả một vật phẩm vào sai vị trí giải đố (ví dụ: dùng chìa khóa cắm vào cuộn chỉ), vật phẩm tự động trượt về lại ô túi đồ kèm âm thanh "lách cách" nhẹ và câu thoại gợi ý: "Món này không dùng ở đây được". Không có bất kỳ hình phạt hay mất máu nào.

### Trạng thái dự phòng khi AI lỗi (Fallback)
Trò chơi point-and-click được lập trình hoàn toàn bằng logic trạng thái máy khách (State Machine trong React/TypeScript), không sử dụng API AI để tính toán câu đố. Do đó trò chơi hoàn toàn độc lập, không bao giờ bị lỗi do AI ngắt kết nối.

## 4. Tiêu chí để coi là làm xong cho bản 10/10 (Acceptance Criteria)

- Hoàn thành trọn vẹn Chương 1 của trò chơi với đầy đủ cốt truyện và câu đố.
- Chơi hết Mở đầu và Chương 1 khi "Lật vải" tắt theo decisions.md; không đặt manh mối bắt buộc ở mặt trái. Lật vải không phải tiêu chí nghiệm thu bản 10/10.
- Hệ thống túi đồ cho phép nhặt, chọn và sử dụng ít nhất 3 vật phẩm khác nhau để giải đố.
- Màn hình kết chương có thử thách phối đồ, thưởng 100 Sen Ngọc và mở khóa thành công mẫu áo thưởng vào Tủ đồ chính của app.
- Lưu lại tiến trình chơi vào localStorage (nếu người dùng thoát ra giữa chừng, khi quay lại vẫn tiếp tục đúng bước đang dở).
