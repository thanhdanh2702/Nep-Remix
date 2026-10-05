# Căn Gác Xép Và Chiếc Rương Cũ (c0-s2-gac-xep-chiec-ruong)

- **Loại:** area-background
- **Dùng ở đâu:** Phân cảnh giải đố trọng tâm của Màn Mở Đầu (Prologue), năm hai nghìn không trăm hai mươi sáu
- **Mô tả:** Không gian căn gác lửng áp mái ngói đất nung nhuốm màu rêu phong cổ kính. Ánh nắng vàng hoàng thổ chiếu rọi qua khe ngói mắt rồng tạo thành những luồng sáng hình nón với bụi vàng lơ lửng. Ở chính giữa căn phòng trên nền sàn ván gỗ lim tối màu là chiếc rương gỗ lim bọc góc đồng chạm khắc hoa cúc tinh xảo, trên nắp phủ tấm vải bố thô màu kem đào ố vàng. Vách tường gỗ phía bên trái có một móc treo bằng đồng. Góc phía sau bên trái là tượng gỗ thợ may cũ đứng trầm mặc. Góc phía trước bên phải là chiếc hòm mây đặt giỏ may đan tre, góc xa bên phải là chiếc ghế đẩu gỗ, chồng sách báo cũ thập niên tám mươi và khung thêu tròn dang dở. Không vẽ nhân vật An, mèo Nếp hay bóng ma lên nền cảnh, để trống diện tích sàn phía trước rương cho người chơi đứng tương tác.
- **Mô tả chủ thể (EN):** Dusty nostalgic attic room of an ancient Vietnamese wooden house in Hanoi, sunlight beams streaming through terracotta clay roof tiles, antique brass-cornered ironwood trunk positioned in the center covered by a rough rustic burlap cloth, wooden walls, vintage mannequin tailor bust on the back left, sewing wicker basket on the front right, old embroidery hoop and stool on the far right, empty front wooden floor space for character interaction, no people on background, mystical atmospheric retro mood.
- **Ghi chú văn hóa:** Chiếc rương gia bảo cất giữ y phục năm thế hệ phụ nữ Việt Nam, là điểm tựa tâm linh và cầu nối đưa người chơi vượt thời gian tìm về cội nguồn di sản.
- **Tên cũ (nếu có):** `docs/08-assets/prologue/c0-s2-gac-xep-chiec-ruong/`

## Ai và cái gì có trong khu vực

- **Nhân vật và NPC xuất hiện:**
  - **Nhà thiết kế An:** Nhân vật chính di chuyển quanh căn gác, quan sát các góc phòng và thao tác giải đố mở rương (trỏ `characters/an`).
  - **Mèo Nếp:** Linh thú trợ thủ, nhảy lên nắp rương cào tấm vải phủ, sau đó nhảy xuống cào nhẹ vào giỏ may để mách nước cho người chơi (trỏ `characters/cat-nep`).
  - **Bóng mờ Ông Lệ:** Thực thể bóng đen lướt ngang qua xà gồ mái nhà khi nắp rương hé mở rồi biến mất vào khoảng không (trỏ `characters/ong-le`).
- **Đồ vật và điểm tương tác:**
  - **Tấm vải bố thô phủ nắp rương (gộp `hitbox-chest-cloth`):** Nằm ở chính giữa căn gác, trùm lên mặt rương gỗ lim. Người chơi chạm và vuốt ngang để gạt tấm vải trượt xuống sàn, làm lộ ra nắp rương gỗ lim và ổ khóa hoa cúc (lớp phủ `c0-s2-gac-xep-chiec-ruong--vai-phu-roi` đã xóa 05/10 vì không khớp nền; trạng thái chỉ đổi trong logic).
  - **Ổ khóa đồng chạm ba hoa cúc (gộp `hitbox-chest-lock`):** Nằm ở chính diện trên nắp rương gỗ lim. Người chơi tra `items/chia_khoa_dong_ba_chau` vào xoay theo chiều kim đồng hồ, ba cánh hoa cúc xòe nở và nắp rương hé mở tỏa hương thơm (lớp phủ `c0-s2-gac-xep-chiec-ruong--ruong-he-mo` đã xóa 05/10 vì không khớp nền; trạng thái chỉ đổi trong logic).
  - **Móc treo gỗ trên vách (gộp `hitbox-wall-key`):** Nằm ở vách gỗ phía bên trái căn gác. Người chơi chạm vào quan sát thấy chỉ còn sợi chỉ đỏ sờn đung đưa, chiếc chìa khóa đã bị ai đó chuyển đi.
  - **Tượng gỗ thợ may cũ:** Đặt ở góc phòng phía sau bên trái. Bàn tay gỗ đang nắm chặt một vật bằng đồng nhưng khớp ngón bị kẹt sợi chỉ cũ. Người chơi dùng `items/kim_gut_bang_bac` cạy khớp tay gỗ, làm rơi ra vật phẩm `items/chia_khoa_dong_ba_chau` (lớp phủ `c0-s2-gac-xep-chiec-ruong--tuong-go-mo-tay` đã xóa 05/10 vì không khớp nền; trạng thái chỉ đổi trong logic).
  - **Giỏ may của bà trên hòm mây:** Đặt ở góc phía trước bên phải căn gác. Người chơi chạm vào mở giỏ may để nhặt vật phẩm `items/kim_gut_bang_bac`.
  - **Ghế đẩu và khung thêu tròn (gộp `hitbox-sewing-hoop`):** Đặt ở góc xa bên phải căn gác. Người chơi chạm vào để ngắm nhìn đường kim mũi chỉ còn dang dở của người bà và đọc các dòng ghi chú hoài niệm.
  - **Lòng rương gia bảo:** Nằm ở vị trí trung tâm sau khi An mở toang rương gỗ. Người chơi chạm vào lớp lụa đỏ điều lót đáy để thu thập vĩnh viễn `items/thuoc_go_tho_may_1888` và mở khóa tài liệu ký ức đầu tiên (lớp phủ `c0-s2-gac-xep-chiec-ruong--ruong-mo-toang` đã xóa 05/10 vì không khớp nền; trạng thái chỉ đổi trong logic).

## Danh sách tệp cần có

| Tên tệp | Loại asset | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :--- | :---: |
| `c0-s2-gac-xep-chiec-ruong--phai.png` | `area-background` | Nền căn gác xép tĩnh mịch ngập bụi vàng chiều thu, chiếc rương gỗ lim đặt ở trung tâm phủ tấm vải bố thô, không có người, chừa khoảng sàn phía trước rương | ⬜ chưa gen |
| `c0-s2-gac-xep-chiec-ruong--vai-phu-roi.png` | `area-overlay` | Nắp rương gỗ lim đen bóng viền đồng lộ ra sau khi tấm vải bố trượt xuống chân rương, ổ khóa hoa cúc đồng đóng kín | Đã xóa 05/10 (không khớp nền) |
| `c0-s2-gac-xep-chiec-ruong--tuong-go-mo-tay.png` | `area-overlay` | Bàn tay tượng gỗ thợ may ở góc trái mở chốt các ngón tay sau khi dùng kim gút cạy, để rơi chiếc chìa khóa đồng ba chấu xuống sàn | Đã xóa 05/10 (không khớp nền) |
| `c0-s2-gac-xep-chiec-ruong--ruong-he-mo.png` | `area-overlay` | Ổ khóa ba cánh cúc xòe nở, nắp rương gỗ bật hé mở khoảng năm phân tỏa làn sương hương trầm dịu nhẹ | Đã xóa 05/10 (không khớp nền) |
| `c0-s2-gac-xep-chiec-ruong--ruong-mo-toang.png` | `area-overlay` | Nắp rương gỗ mở toang hoàn toàn, để lộ lớp lụa lót đỏ điều, nếp áo ngũ thân nâu sồng gập ngay ngắn, cuốn sổ tay bọc gấm và chiếc thước thợ may cổ | Đã xóa 05/10 (không khớp nền) |
| `c0-s2-gac-xep-chiec-ruong--trai.png` | `area-background` | Cõi dệt tâm thức nền màu xám chàm mộc mạc, mặt nắp rương hiện mạng lưới chỉ thêu kim tuyến phát sáng màu vàng rực | ⬜ hoãn sau 10/10 |
| `doc-c0-s2-so-tay-ky-uc-1888.png` | `doc` | Cuốn sổ tay bọc gấm mở rộng trang giấy dó ngả vàng, không có chữ, UI phủ chữ | ⬜ chưa gen |
| `doc-c0-s2-loi-dan-nguoi-ba.png` | `doc` | Tờ giấy hoa dâu cổ điển ghi lời nhắn gửi của người bà, không có chữ, UI phủ chữ | ⬜ chưa gen |
| `vfx-c0-s2-bong-mo-ong-le.png` | `vfx` | Dải khói đen mờ đục rách rưới lướt ngang qua xà gồ mái nhà rồi tan biến trong không gian | ⬜ chưa gen |
| `vfx-c0-s2-chi-theu-vang-sang.png` | `vfx` | Các đốm sáng hoàng kim lung linh chạy dọc theo đường chỉ thêu trên nắp rương tạo cảm giác sợi chỉ đang hồi sinh | ⬜ chưa gen |
| `vfx-c0-s2-anh-sang-thuoc-go.png` | `vfx` | Quầng sáng vàng ấm dịu lan tỏa từ các vạch khắc chữ Nho trên thân cây thước thợ may kéo dài khắp căn phòng | Gỡ khỏi game 05/10 (theo yêu cầu) |
| `cg-prologue-mo-ruong-hoi-sinh.png` | `cg` | Tranh minh họa cao trào kết màn mở đầu: góc nhìn cận cảnh An mở toang chiếc rương gia bảo, ánh sáng hoàng kim rực rỡ soi sáng nếp áo ngũ thân và gương mặt bừng sáng hy vọng | ⬜ chưa gen |
