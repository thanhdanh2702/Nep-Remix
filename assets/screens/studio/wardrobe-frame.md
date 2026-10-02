# Khung chọn trang phục

- Mẫu: `khung.png` ở thư mục gốc dự án.
- Asset mới: `wardrobe-frame--landscape.png`, tạo bằng ImageGen tích hợp.
- Bố cục: sáu ô giấy kem, khung gỗ nâu hồng, tab ở trên và bảng màu bên phải; trang trí hoa sen.
- Ảnh tạo có lề trắng phía trên và dưới. `wardrobe-art` cắt lề bằng CSS, chỉ hiển thị vùng khung; không kéo giãn ảnh trang phục bên trong.
- Trang phục thật được đặt bằng `StudioWardrobe.tsx`, đổi màu từ lớp áo có sẵn và căn theo vùng alpha để áo chiếm vừa ô. Phụ kiện và giày dùng icon có sẵn, giữ tỷ lệ.
- Sáu mục mỗi trang, viền vàng cho mục đang chọn. Bản nhỏ cuộn ngang khay; tab, chọn màu, đổi trang và chọn đồ là điều khiển HTML.
- Khay đặt cố định sát đáy phòng, dưới nhân vật ở mọi kích thước màn hình. Bảng tùy chỉnh cũ được thay bằng cửa sổ Tùy chỉnh bộ phối; khay không nằm trong Lookbook hoặc cửa sổ này.
- Nhóm quần trong mẫu được thay bằng Màu vải để khớp chức năng phối đồ hiện có; không thêm lựa chọn quần không lưu được vào bộ phối.

## Prompt ImageGen

Use case: precise-object-edit. Asset type: reusable bottom wardrobe selection frame for a pixel-art Vietnamese dress-up game. Edit input khung.png. Preserve the exact original 5:1 wide horizontal aspect ratio and layout coordinates: carved wooden outer frame, four top tabs at x=7-20%,21-34%,35-48%,49-61%, six tall empty cream garment card frames across x=5.5-78%, and a separate dark rose palette panel at x=79-95.5%. Keep ALL six garment cards EMPTY; no clothes, people, mannequins, no drawings inside them. Remove ALL text and ALL icons from all four tabs and from the palette panel. Remove existing golden selected-card corner markers so the six cards are identical unselected cards. Remove colored swatch buttons from the palette panel, leaving a plain dark rose inset for real HTML color buttons. Redesign the decoration in subtle Vietnamese lotus and traditional wooden lattice motifs, tasteful tiny lotus corner engravings and a simple lotus divider at the foot of each card. Keep dusty rose, warm ivory paper, burgundy and dark reddish Vietnamese carved wood, warm muted gold fine highlights, the same charming crisp detailed pixel art as the input. Keep structure and positions locked precisely to the reference. No text, letters, numbers, watermark, no assets inside the cream cards. Complete entire panel with frame visible on all four sides. Opaque background.
