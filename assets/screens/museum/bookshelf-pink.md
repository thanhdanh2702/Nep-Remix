# Bảo tàng hồng sen

Nền mới: `bookshelf-pink--landscape.png`. Tạo bằng công cụ image_gen tích hợp ngày 02/10/2026, tham chiếu nền `bookshelf-view--landscape.png`; giữ 12 cuốn sách, vị trí kệ và bố cục căn phòng. Không thay thế ảnh gốc.

Prompt cuối:

```text
Use case: precise-object-edit. Asset type: pixel art background for a Vietnamese heritage museum game, landscape 8:5. Edit target: the referenced existing bookshelf room. Redesign this exact room with a clearly dominant lotus pink palette: dusty rose limewashed walls, blush pink warm light, rose terracotta floor tiles, warm plum-brown carved timber. Strong traditional Vietnamese home character: carved wooden beams, wooden lattice window and bamboo blind, Vietnamese blue-and-white ceramics and lotus decoration, antique reading desk. Keep the exact camera, room geometry, bookshelf position and dimensions, and ALL TWELVE rectangular cloth bound books in the EXACT SAME positions, sizes and shapes as the reference (four columns across three rows on left). Preserve book colors blue, ochre, red and cream, their cloth binding and stitched details. Preserve window left and empty wall/reading desk right. Crisp pixel art consistent with reference, limited harmonious palette, no smooth 3D rendering. The pink must be visible across the room, cozy serene lived-in Vietnamese heritage interior. No people, no text, no typography, no interface. Do not shift any books because clickable hitboxes must align.
```

Giao diện `src/game/Museum.tsx` đặt 12 vùng bấm trên cùng mặt phẳng 8:5 với ảnh nền. Các sổ có tối đa hai mục tư liệu hiện có và sáu trang; sổ cuối có một mục và bốn trang. Có nút trước/sau, phím trái/phải, Escape, giữ focus trong hộp đọc và trả focus về sách khi đóng. Trên điện thoại, căn khung hình về kệ sách và hiển thị một trang. Tra cứu vẫn truy cập đủ 23 mục; phần thưởng chỉ nhận một lần cho mỗi mục. Màn bảo tàng ẩn dãy nút khu vực, HUD Sen Ngọc, Cài đặt và nhãn trạng thái lưu; vẫn giữ nút Về sân nhà.
