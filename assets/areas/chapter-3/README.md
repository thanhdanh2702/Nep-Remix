# Đường Chỉ Xuyên Năm Tháng (chapter-3)

- **Loại:** area-background
- **Dùng ở đâu:** Chương Ba, từ tiệm may Đa Kao tới phòng hồ sơ và dinh thự đối chất.
- **Mô tả:** Không gian đô thị Sài Gòn hư cấu với cửa chớp xanh ngọc, tường giấy dó, gỗ sẫm, ánh nắng hoàng yến và đồ dùng may mặc. Mai giữ vị trí trung tâm khi đối chiếu chứng cứ; Vinh đứng bên cạnh làm chứng. Giấy tờ được tách khỏi nền để giao diện trình bày nội dung thật.
- **Mô tả chủ thể (EN):** Fictional mid-century Vietnamese tailor shop, quiet records room and family mansion salon, illustrated in the established warm pixel-art language. Jade shutters, ivory plaster, dark wooden furniture and brass details. Clear evidence surfaces and walkable foregrounds support layered actors and removable documents.
- **Ghi chú văn hóa:** Minh họa có cảm hứng thời kỳ, chưa được thẩm định như phục dựng lịch sử. Không dùng cấu trúc raglan để khẳng định bói toán; không quy hành vi mua chuộc của nhân vật hư cấu cho toàn bộ tín ngưỡng hay cộng đồng.

## Danh sách tệp cần có

Các nguồn dưới đây nằm trong `_raw/review-v1/`, được giữ nguyên để đối chiếu. Bộ xuất kỹ thuật `production-v1` đã hoàn thành theo cho phép của người dùng; chưa đăng ký vào gameplay.

| Tên tệp | Mô tả bằng lời | Trạng thái |
| :--- | :--- | :---: |
| `c3-s1.png` | Tiệm may Đa Kao, máy may và lối phố | 🟨 nháp AI |
| `c3-s2.png` | Phòng lưu hồ sơ với rương đóng | 🟨 nháp AI |
| `c3-s3.png` | Dinh thự với bàn đối chiếu trống | 🟨 nháp AI |
| `mai-work-v2.png` | Mai tóc bob ngắn, mặt thon, đang làm việc trong tiệm | 🟨 nháp AI |
| `mai-expressions-v2.png` | Mai cùng danh tính mới khi điều tra, lên tiếng và nhẹ nhõm | 🟨 nháp AI |
| `vinh.png` | Vinh lắng nghe, nhận ra và làm chứng | 🟨 nháp AI |
| `ba-lon-v2.png` | Bà Lớn búi tóc thấp, nét tuổi rõ, nghiêm nghị, dao động và nhìn nhận | 🟨 nháp AI |
| `thay-ba-can-v2.png` | Thầy Ba Càn với nét nam lớn tuổi, bình tĩnh, lo lắng và tránh ánh mắt; bản cũ giữ để đối chiếu | 🟨 nháp AI |
| `raglan.png` | Áo raglan thang xám theo các góc An | 🟨 nháp AI |
| `boat-neck.png` | Áo cổ thuyền thang xám theo các góc An | 🟨 nháp AI |
| `cat-eye.png` | Kính mắt mèo cùng góc trước, nghiêng và gọng sau | 🟨 nháp AI |
| `documents.png` | Giấy chứng cứ trống cho chữ giao diện | 🟨 nháp AI |
| `chest-open.png` | Nguồn rương mở còn hồ sơ | 🟨 nháp AI |
| `chest-empty.png` | Nguồn rương mở sau khi lấy hồ sơ | 🟨 nháp AI |

## Duyệt và bàn giao

- [Gallery xuất kỹ thuật — dùng để duyệt cuối](_raw/production-v1/gallery.html)
- [Manifest production — đường dẫn thật, kích thước, SHA-256](manifest.json)
- [Gallery duyệt](_raw/review-v1/gallery.html)
- [Manifest nguồn](_raw/review-v1/manifest.json)
- [Prompt đã sử dụng](_raw/review-v1/prompts.json)
- [Tài liệu bàn giao C3](../../../docs/07-game/10-c3-asset-handoff.md)

Gói production có **51 PNG mới + 8 file tái sử dụng**: ba nền; 13 pose và 13 portrait, bốn view-front; hai áo ba góc; kính ba góc; bốn giấy chứng cứ; tám overlay giấy; hai trạng thái rương; một CG kết ghép từ nền và pose đã chọn. NPC có khung 176×416, portrait 128×128, áo/kính strip 528×416; overlay cùng canvas nền 1672×941.

Nhân vật trong preview ba cảnh và CG kết đã tăng 35%, giữ điểm chân. `sceneActors` trong manifest ghi scale 1.35 và tọa độ theo nền; sprite gốc không đổi khung.

23 kiểm tra kỹ thuật PASS, coverage helper mới 100% (58/58 dòng thực thi). Build trước đợt chỉnh scale PASS. Xem [bằng chứng kiểm tra](../../../docs/07-game/c3-asset-export-evidence.md). Coverage không đại diện cho gameplay hoặc toàn bộ exporter.

Giữ nguyên PNG nguồn, không ghi đè asset C2, không chạy audit ghi metadata chung. Chưa qua sửa tay họa sĩ, duyệt văn hóa hoặc kiểm thử C3 trong app; chưa commit. Animation đi bộ, mặt trái và audio ngoài phạm vi.
