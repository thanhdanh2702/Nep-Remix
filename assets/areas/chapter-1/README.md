# Chương 1: Nếp Áo Khóa Then (Năm 1888 - Làng Lụa Vạn Phúc)

Thư mục này quản lý tài nguyên hình ảnh pixel art của Chương 1, đặt trong bối cảnh lịch sử thời vua Đồng Khánh (1888) tại làng dệt lụa Vạn Phúc, phủ Hoài Đức, tỉnh Hà Đông.

## 1. Nền phòng: vẽ bằng code, không dùng model sinh ảnh

Ba nền phòng 16:9 (**640 × 360 px**, PNG RGB đục, ≤ 32 màu mỗi phòng) do `scripts/pixel/draw-c1-rooms.py` tạo ra (Pillow + numpy, palette khóa neo từ `assets/palettes/ui.json` + `garment.json`, ánh sáng từ phía trên bên phải). Không sửa PNG bằng tay: sửa script rồi chạy lại.

```
python scripts/pixel/draw-c1-rooms.py [s1|s2|s3 ...] [--preview DIR]   # ghi PNG + layout.json, preview x2 vào DIR
python scripts/pixel/pixel-grid.py assets/src/pixel/c1/<id>.grid.json  # kiểm tra char-grid vật nhỏ (exit 1 khi lỗi)
npm run audit:assets                                                   # cập nhật data/runtime-assets.json
```

| Mã cảnh | Tên phân cảnh | Nền (`<mã cảnh>--phai.png`) | Vật tương tác trong `layout.json` |
| :--- | :--- | :---: | :---: |
| `c1-s1-buong-det-khoa-kin` | Gian buồng dệt khóa then | 640 × 360, đã vẽ | 5 + lối ra `window` |
| `c1-s2-ban-tho-nha-tho-ho` | Gian nhà thờ họ Bùi | 640 × 360, đã vẽ | 3 + lối ra `yard`, `back` |
| `c1-s3-cong-dinh-doi-dau` | Cổng đình làng Vạn Phúc (hoàng hôn) | 640 × 360, đã vẽ | 5 (3 vùng đứng cho NPC) + lối ra `exit` |

Chưa có mặt `trai` (cõi Lật Vải) cho Chương 1: Lật Vải tắt cho bản nộp 10/10.

## 2. `layout.json` là nguồn sự thật cho rect

Mỗi phòng có `layout.json` do chính script vẽ ra: bbox chuẩn hóa 0..1 (`x, y, w, h`) cho từng id trong `interactables` của `src/content/chapters/c1.json`, cộng vị trí mũi tên lối ra (`exits.<khóa>` = `x, y, dir`). Script thoát lỗi nếu thiếu id hoặc khóa lối ra. Các id NPC (`hitbox-village-officials`, `hitbox-ong-le-entity`, `hitbox-styling-cam`) là vùng đứng chừa trống: sprite NPC do game vẽ. Rect trong `c1.json` được đo lại từ `layout.json` ở bước nội dung (phase 03).

## 3. Vật nhỏ (char-grid) trong `assets/src/pixel/c1/`

| File | Dùng ở | Kích thước |
| :--- | :--- | :---: |
| `con-thoi-go-mun.grid.json` | s1: con thoi trên khung cửi | 20 × 6 |
| `chen-chao-nguoi.grid.json` | s1: bát cháo nguội | 18 × 11 |
| `lu-huong.grid.json` | s2: lư hương | 20 × 16 |
| `bai-vi.grid.json` | s2: bài vị trong khám thờ | 10 × 16 |
| `den-long-do.grid.json` | s2, s3: đèn lồng | 12 × 15 |

## 4. Còn thiếu cho Chương 1

| Mã món | Loại tài nguyên | Kích thước | Trạng thái |
| :--- | :--- | :--- | :---: |
| `con-thoi-go-mun`, `that-lung-lua-cham` | Icon vật phẩm túi đồ | 24 × 24 px | Chưa có |
| `buc-thu-tay-chong-cu-cam`, `to-van-tu-cam-co-dat` | Icon vật phẩm cốt truyện / chứng cứ | 24 × 24 px | Chưa có |

## 5. Nhân vật xuất hiện trong Chương 1
Nhân vật không đặt trong thư mục cảnh, người vẽ xem chi tiết tại:
- Cụ Cố Tổ Nguyễn Thị Cầm (23 tuổi): `docs/08-assets/characters/cu-cam/`
- Trưởng tộc Bùi Văn Thân (58 tuổi): `docs/08-assets/characters/truong-toc-bui/`
- Thực thể Ông Lệ (hình thái phong kiến áo thụng tro tàn): `docs/08-assets/characters/ong-le/`
