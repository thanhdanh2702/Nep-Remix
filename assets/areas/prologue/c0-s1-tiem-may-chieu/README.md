# Sảnh Chính Tiệm May Nếp Trong Nắng Chiều (c0-s1-tiem-may-chieu)

- **Loại:** area-background
- **Dùng ở đâu:** Phân cảnh mở đầu của Màn Mở Đầu (Prologue), năm hai nghìn không trăm hai mươi sáu
- **Mô tả:** Không gian tầng một của căn nhà gỗ ba gian cổ kính phố Hàng Đào trong buổi chiều cuối thu tĩnh lặng. Ánh nắng vàng hoàng thổ xiên qua khung cửa kính gỗ mộc rọi lên sàn lát gạch bông cổ điển, làm nổi bật những hạt bụi vải lơ lửng. Chính giữa gian phòng là chiếc bàn cắt may lớn bằng gỗ xà cừ màu gỗ sẫm, trên mặt bàn bày dải lụa tơ tằm màu trắng ngà mở dở, kéo cắt vải bằng đồng thau và cuộn phấn may. Bên vách trái là tấm gương soi toàn thân viền gỗ mun chạm khắc đơn sơ phản chiếu ánh sáng dịu. Bên phải là lối cầu thang gỗ lim mòn nhẵn dẫn lên gác xép. Không vẽ bất kỳ nhân vật hay linh thú nào lên nền cảnh, để trống khoảng sàn trung tâm và hành lang di chuyển từ cửa chính vòng qua bàn cắt tới chân cầu thang cho người chơi đi lại.
- **Mô tả chủ thể (EN):** Atmospheric nostalgic interior of an antique Vietnamese tailor shop in Hanoi old quarter, warm late afternoon sunlight streaming diagonally through wooden french windows, rustic patterned tile floor, large antique dark wood cutting table with an unfinished roll of ivory white silk fabric and vintage tailor scissors, wooden staircase on the right leading up to the attic, large vintage wood-framed standing mirror on the left wall, spacious walk path in the center for character navigation, no people on background, cozy nostalgic autumn ambiance.
- **Ghi chú văn hóa:** Nếp nhà may đo truyền thống của gia đình thị dân Hà Nội gắn liền với nghề thợ may năm thế hệ, nơi lưu giữ tinh hoa cắt may thủ công từ thời lập tiệm.
- **Tên cũ (nếu có):** `docs/08-assets/prologue/c0-s1-tiem-may-chieu/`

## Ai và cái gì có trong khu vực

- **Nhân vật và NPC xuất hiện:**
  - **Nhà thiết kế An:** Nhân vật chính do người chơi điều khiển đi lại và khám phá không gian (trỏ `characters/an`).
  - **Mèo Nếp:** Linh thú trợ thủ, ban đầu nằm ngủ cuộn tròn ở sàn nhà gần chân cầu thang, sau đó tỉnh giấc đứng dậy đi vòng tròn và nhảy lên các bậc cầu thang dẫn lối cho An (trỏ `characters/cat-nep`).
- **Đồ vật và điểm tương tác:**
  - **Bàn cắt may xà cừ trung tâm (gộp `hitbox-table`):** Đặt ở vị trí trung tâm sảnh tiệm, hơi chếch về phía trước. Người chơi chạm vào để quan sát súc lụa trắng dở dang, chạm vào kéo cắt vải và nhặt vật phẩm phụ `items/phan_may_mau_xanh` đặt trên mép bàn; sau khi nhặt kích hoạt lớp phủ trạng thái bàn cắt (lớp phủ `c0-s1-tiem-may-chieu--ban-cat-sau-nhat-phan` đã xóa 05/10 vì không khớp nền; trạng thái chỉ đổi trong logic).
  - **Gương lớn soi toàn thân (gộp `hitbox-mirror`):** Đặt áp sát tường ở phía bên trái sảnh tiệm. Người chơi chạm vào để mở giao diện ngắm nhìn phục trang và diện mạo của An.
  - **Chiếc máy khâu con bướm đạp chân:** Đặt ở góc phía sau bên trái, gần khung cửa sổ. Người chơi chạm vào để nghe An bộc bạch hoài niệm về người bà đã ngồi suốt sáu mươi năm nuôi nấng gia đình.
  - **Khung ảnh chân dung người bà:** Đặt trang trọng trên góc trên bên phải của bàn cắt may. Người chơi chạm vào để nghe An thầm hứa tiếp nối ngọn lửa nghề may di sản.
  - **Cầu thang gỗ lim lên gác xép (gộp `hitbox-stairs`):** Nằm ở phía bên phải sảnh tiệm, vươn cao lên trần gác. Người chơi di chuyển tới chân cầu thang và tương tác để chuyển cảnh lên căn gác xép.
  - **Điểm nằm của Mèo Nếp (gộp `hitbox-cat`):** Nằm ở phía sàn trước chân cầu thang gỗ bên phải.

## Danh sách tệp cần có

| Tên tệp | Loại asset | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :--- | :---: |
| `c0-s1-tiem-may-chieu--phai.png` | `area-background` | Nền sảnh chính tiệm may buổi chiều thu, ánh nắng xiên rọi qua cửa kính lên bàn cắt vải gỗ xà cừ và cầu thang gỗ, không có người, chừa lối đi rộng rãi ở giữa | ⬜ chưa gen |
| `c0-s1-tiem-may-chieu--ban-cat-sau-nhat-phan.png` | `area-overlay` | Mặt bàn cắt may ở vị trí trung tâm sau khi người chơi đã nhặt viên phấn may, chỉ còn lại súc lụa trắng và kéo đồng | Đã xóa 05/10 (không khớp nền) |
| `c0-s1-tiem-may-chieu--trai.png` | `area-background` | Phân cảnh mặt trái lật vải cõi dệt tâm thức của sảnh tiệm may | ⬜ hoãn sau 10/10 |
| `vfx-c0-s1-bui-nang-chieu.png` | `vfx` | Vệt ánh sáng chiều với các hạt bụi tơ tằm li ti màu vàng hoàng thổ bay lơ lửng bồng bềnh tạo chiều sâu không gian | Gỡ khỏi game 05/10 (theo yêu cầu) |
