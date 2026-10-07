# C2 — bàn giao asset cho team

Ngày 07/10/2026. Bộ hiện hành: **production-v4**, nền **A — nắng ấm, gỗ nâu**. [Gallery duyệt](../../assets/areas/chapter-2/_raw/production-v4/gallery.html) · [Manifest runtime](../../assets/areas/chapter-2/manifest.json) · [Nguồn và prompt](../../assets/areas/chapter-2/_raw/production-v4/prompts.md).

## Phạm vi và trạng thái

Asset đã xuất vào đường dẫn runtime, không còn chỉ nằm trong gói nháp v3. Nền A đã được người dùng chốt. Bộ cuối cần người dùng xem gallery để duyệt thẩm mỹ; xuất PNG không có nghĩa C2 đã được lập trình hoặc playtest.

Nhân vật giữ tạo hình v3 theo ảnh tỷ lệ người dùng, đầu nhỏ/thân dài hơn v2. Không kéo méo sprite để ép cao bằng canvas: khi bố trí NPC hãy căn chiều cao nhìn thấy theo bounds trong manifest, giữ chân trên sàn.

Hậu kỳ cơ học bằng script đã được người dùng cho phép: crop, resize nearest, alpha, căn khung và bốn key xám. Không tuyên bố đã qua bước họa sĩ sửa tay từng pixel hoặc thẩm định văn hóa độc lập. Đây là Hà Nội hư cấu năm 1935, không phải bản phục dựng lịch sử.

## Bộ hình để build

| Nhóm | Hình bàn giao | Cách dùng |
| --- | --- | --- |
| Nền | Ba nền A giữ kích thước native | S1 gác vẽ, S2 kho vải, S3 triển lãm |
| Loan | Idle ngũ thân, triển lãm Lemur, lo lắng/quyết tâm/nhẹ nhõm và chân dung | assets/characters/cu-loan/; view-front.png tương thích resolver hiện có |
| Cả Nghị | Idle, nghiêm nghị, hoảng hốt, lùi đi và chân dung | assets/characters/ca-nghi/; pose lùi đi là hình tĩnh |
| Ông Lệ | Bóng mờ đứng và chân dung | assets/characters/ong-le/; fade bằng opacity, không gán là vua/thần |
| Chứng cứ | Bản vẽ liền, bốn dải cắt từ chính ảnh đó và overlay ghép xong ở S1 | doc-c2-ban-ve-hoan-chinh.png, doc-c2-manh-ban-ve-1..4.png, --ban-ve-ghep.png; thứ tự trái → phải |
| Đồ nhặt | Bốn overlay mảnh giấy, overlay chìa ở đồng hồ | Cùng canvas với nền, ẩn riêng theo inventory |
| Két | Overlay mở có giấy và rỗng sau khi lấy | --ket-mo.png / --ket-rong.png; chỉ vẽ một state |
| Triển lãm | Bản vẽ treo, người nghe, vignette kết | --ban-ve-treo.png, --nguoi-nghe.png, cg-c2-loan-tu-ky-ten.png |
| Mặc đồ | Lemur, khăn vấn đen, guốc mộc; mỗi lớp ba hướng | Đúng đường dẫn garmentAsset/accessoryAsset, không thay khung An |
| Icon | Tái sử dụng tám item C2 và ba icon áo/phụ kiện có sẵn | Không dùng sheet đạo cụ v1/v2 thay icon |

An tiếp tục dùng atlas đi bộ hiện có. C2 dùng NPC tĩnh và pose đối thoại/chuyển cảnh; gameplay đã thống nhất không yêu cầu NPC tự đi quanh phòng. Chưa tạo walk atlas NPC riêng; nếu thêm cơ chế đó cần yêu cầu art bổ sung, không nhân bản pose tĩnh thành animation giả.

## Tọa độ và thứ tự ghép

Manifest ghi worldPlacements cho đồ nhặt, theo ảnh gốc, không phải CSS px. Frontend đo lại vùng bấm đủ rộng trên mobile, vùng đi và obstacle theo nền A. Overlay trải toàn canvas, vẽ tại (0,0) cùng transform với nền.

S2: nền → chìa nếu chưa nhặt → một state két nếu mở → nhân vật/UI. Két mở/rỗng chỉ phủ vùng két và door; ngoài vùng này trong suốt. Không lấy nguyên ảnh AI chỉnh sửa làm nền thay thế vì có thể đổi pixels ngoài két.

S3: nền → bản vẽ treo khi đã trình → người nghe → NPC/UI. Vignette kết đã tổng hợp, không ghép Loan/người nghe lần nữa. Tên Loan, chữ ký, biên lai và giao kèo do HTML hiển thị chữ thật có dấu; không coi nét trong tranh là chứng cứ đọc được.

## Phân việc bốn vai trò

| Vai trò | Việc tiếp theo |
| --- | --- |
| Leader | Đọc docs 01–08, khóa manifest v4; dùng worktree hiện có, giao ownership, giữ C1 nguyên trạng; không tự gen lại art |
| Frontend | Nối nền/overlay/pose, puzzle, chữ chứng cứ, mặc đồ; responsive/loading/retry; không import _raw |
| Backend/Core | Guard bản vẽ → chìa/két/hai chứng cứ → receipt → sketch → styling → ending; save/reload, thưởng idempotent theo docs |
| Tester | Đường đúng/sai, collect/remove overlay, save/resume, ghép khít, mặc đồ bốn hướng (phải mirror trái), mobile, C1 regression |

## Kiểm chứng

Script xuất: scripts/export-c2-assets.py; kiểm thử: scripts/test_c2_asset_tools.py. Manifest ghi kích thước, bounds và SHA-256. Báo cáo QA cuối nằm cạnh gallery.

Đợt này chỉ làm hình ảnh và công cụ xuất/QA; chưa bật C2, chưa thay gameplay, chưa playtest C2. Audio tùy chọn không nằm trong gói này; không dùng nhạc ngoài khi chưa có quyền.
