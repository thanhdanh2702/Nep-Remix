# Phân Cảnh: Gian Nhà Thờ Họ Bùi (`c1-s2-ban-tho-nha-tho-ho`)

Gian chính giữa của nhà thờ họ Bùi ba gian uy nghiêm vào đêm đông năm 1888. Nơi đây diễn ra câu đố then chốt của Chương 1: cụ Cầm cắt ba mối chỉ xám quấn bàn thờ tổ để lấy lại bức di thư của chồng và tờ văn tự cầm cố đất đai gian trá của Trưởng tộc.

## 1. Art hiện có (vẽ bằng code)

| Tệp | Nội dung | Kích thước | Trạng thái |
| :--- | :--- | :--- | :---: |
| `c1-s2-ban-tho-nha-tho-ho--phai.png` | Nền nhà thờ họ thế giới thực (mặt `phai`) | bố cục code-drawn | Đã vẽ |
| `layout.json` | bbox 0..1 của 3 vật tương tác + vị trí mũi tên lối ra `back`, `yard` | — | Đã sinh |

Cả hai do `scripts/pixel/draw-c1-rooms.py` tạo ra: không sửa PNG hay `layout.json` bằng tay, sửa script rồi chạy lại (xem `../README.md`). Rect trong `src/content/chapters/c1.json` được sao nguyên từ `layout.json`; `scripts/check-game.ts` kiểm hai bên khớp nhau.

Không có mặt `trai` (cõi Lật Vải): Lật Vải tắt cho bản nộp 10/10, bàn thờ tổ được giải ở mặt `phai`.

## 2. Vật tương tác (id trong `layout.json`)

| id | Vai trò trong game |
| :--- | :--- |
| `hitbox-honor-plaque` | Biển "Tiết Hạnh Khả Phong" (manh mối `clue-tiet-hanh-kha-phong`) |
| `hitbox-incense-burner` | Lời thoại lư hương |
| `hitbox-ancestor-altar` | Câu đố cắt chỉ xám bằng kéo may (`p-c1-altar-cut-threads`): nhận bức thư tay và tờ văn tự, mở lối sang cổng đình |

Lối ra: `back` (mũi tên trái) về `c1-s1-buong-det-khoa-kin`, `yard` (mũi tên xuống) sang `c1-s3-cong-dinh-doi-dau`, mở sau khi giải bàn thờ.

## 3. Nhân vật xuất hiện
- Cụ Cầm: Xem chi tiết tại `docs/08-assets/characters/cu-cam/`
- Thực thể Ông Lệ (sợi chỉ xám trói buộc): Xem tại `docs/08-assets/characters/ong-le/`
