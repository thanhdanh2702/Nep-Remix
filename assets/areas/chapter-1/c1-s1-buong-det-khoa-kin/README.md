# Phân Cảnh: Gian Buồng Dệt Khóa Then (`c1-s1-buong-det-khoa-kin`)

Gian buồng hẹp vách đất trát rơm nứt nẻ nơi cụ Cầm bị giam lỏng để ép thủ tiết vào mùa đông năm 1888. Cửa chính phía trước bị xích sắt khóa chặt, cụ Cầm phải tìm cách mở then cửa chớp phía sau để thoát ra nhà thờ họ.

## 1. Art hiện có (vẽ bằng code)

| Tệp | Nội dung | Kích thước | Trạng thái |
| :--- | :--- | :--- | :---: |
| `c1-s1-buong-det-khoa-kin--phai.png` | Nền buồng dệt thế giới thực (mặt `phai`) | bố cục code-drawn | Đã vẽ |
| `layout.json` | bbox 0..1 của 5 vật tương tác + vị trí mũi tên lối ra `window` | — | Đã sinh |

Cả hai do `scripts/pixel/draw-c1-rooms.py` tạo ra: không sửa PNG hay `layout.json` bằng tay, sửa script rồi chạy lại (xem `../README.md`). Rect trong `src/content/chapters/c1.json` được sao nguyên từ `layout.json`; `scripts/check-game.ts` kiểm hai bên khớp nhau.

Không có mặt `trai` (cõi Lật Vải): Lật Vải tắt cho bản nộp 10/10, mọi vật trong cảnh nằm ở mặt `phai`.

## 2. Vật tương tác (id trong `layout.json`)

| id | Vai trò trong game |
| :--- | :--- |
| `hitbox-loom-shuttle` | Nhặt con thoi gỗ mun |
| `hitbox-belt-rack` | Nhặt thắt lưng lụa chàm (ghép với con thoi thành dụng cụ móc then) |
| `hitbox-cold-porridge` | Lời thoại bát cháo nguội |
| `hitbox-front-door` | Lời thoại cửa chính bị xích khóa |
| `hitbox-back-window` | Câu đố mở then cửa chớp sau (`p-c1-escape`) |

Lối ra `window` (mũi tên lên) dẫn sang `c1-s2-ban-tho-nha-tho-ho`, mở sau khi giải `p-c1-escape`.

## 3. Nhân vật xuất hiện
- Cụ Cầm: Xem chi tiết sprite tại `docs/08-assets/characters/cu-cam/`
- Bóng Trưởng tộc (in mờ qua khe vách cửa): Xem tại `docs/08-assets/characters/truong-toc-bui/`
