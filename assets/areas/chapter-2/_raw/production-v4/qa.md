# C2 v4 — kết quả kiểm chứng

Ngày 07/10/2026. **56 đường dẫn PNG duy nhất**: 45 hình C2 (gồm ba nền A) và 11 icon tái sử dụng. So với thời điểm 142 PNG runtime trước đợt này, thêm 42 PNG; tổng runtime hiện là 184.

## Kết quả thật đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| scripts/test_c2_asset_tools.py | PASS, chín test |
| --coverage trên cùng test suite | PASS; helper cơ học đạt 100% executable lines, 19/19 |
| scripts/audit-assets.py | PASS; 184 PNG, không có đường dẫn manifest gốc bị thiếu |
| npm run build | PASS client và server; vẫn có cảnh báo JS chunk trên ngưỡng |
| Hash manifest C2 so với runtime registry | PASS cả 56 đường dẫn |
| Hash runtime so với PNG được build phát ra | PASS cả 184 PNG |
| Gallery img src | PASS, mọi ảnh trỏ đến file thật |
| Ghép bốn dải bản vẽ | PASS, trùng từng byte với bản liền |
| Lemur | PASS kích thước dải, bốn key xám, che thân An ở cả ba hướng |
| Két mở/rỗng | PASS, chỉ có alpha trong vùng két/door, không đổi pixels ngoài vùng này |

Đã xem trực quan thử ghép áo/khăn/guốc trên An, nền A, hình kết và các sheet mới. Preview dùng đúng thứ tự lớp và công thức gradient-map của StudioCharacter nhưng **không phải kiểm thử E2E trong trình duyệt**.

## TDD evidence cho công cụ xuất

User journey: team nhận PNG đúng canvas/alpha, mặc khớp An và puzzle ghép khít, thay vì chỉ nhận sheet AI.

- RED: bộ test helper chạy và thất bại vì c2_asset_tools chưa tồn tại; sau bổ sung helper, bốn test đầu GREEN.
- RED tích hợp: test che thân phát hiện áo hướng nghiêng chỉ che 553/2039 pixels thân kiểm tra. Gen lại hướng nghiêng theo layer và body An, xuất lại đúng khung.
- RED tiếp theo: hướng sau còn khe alpha tại vai/tay. Khép khe nhỏ theo mask thân bằng màu vải lân cận; không mở rộng silhouette ngoài thân.
- GREEN cuối: chín test cùng suite pass. Coverage trên **ba hàm helper**, không phải toàn export script hoặc toàn game. Đo bằng trace/dis thư viện chuẩn vì môi trường không có coverage.py.
- Không tạo checkpoint commit, không sửa gameplay và không chạy C2 E2E trong đợt art này. Việc kiểm thử gameplay thuộc team frontend/core/tester sau tích hợp.

Các lần thử dùng trace CLI trực tiếp báo zero tests đã bị loại, không dùng làm bằng chứng coverage. Kết quả 19/19 lấy từ --coverage thực sự chạy đủ chín test.

## Giới hạn và bước duyệt

Chờ người dùng duyệt thẩm mỹ gallery cuối. Chưa qua họa sĩ sửa tay từng pixel hoặc thẩm định văn hóa độc lập. NPC là pose tĩnh; An tái sử dụng walk atlas. Audio và mặt trái không thuộc bộ C2 này.

git diff --check toàn repo còn cảnh báo dòng trống EOF trong docs/01-overview/README.md có sẵn trước đợt này; giữ nguyên thay đổi ngoài phạm vi của người dùng. Kiểm tra riêng các file tracked thuộc đợt asset không có lỗi whitespace.
