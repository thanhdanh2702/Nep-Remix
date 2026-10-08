# C3 — Bàn giao mỹ thuật: Đường Chỉ Xuyên Năm Tháng

Ngày lập: 07/10/2026. Phạm vi: asset hình ảnh C3; không thay đổi gameplay C2.

## Nguồn quyết định

- `03-chapters.md`, mục C3: luồng điều tra ba cảnh, hai hồ sơ và quyền tự quyết của Mai.
- `01-narrative.md`: Mai 22 tuổi, Vinh là người làm chứng, bối cảnh gia đình hư cấu tại Đa Kao năm 1962.
- `05-art-audio.md`: điểm tương tác phải nhìn thấy được; vật thu thập tách khỏi nền.
- `06-cultural-review.md`: không dùng cấu trúc raglan để chứng minh bói toán; không khẳng định một góc may cố định, ngày phát minh hoặc tác giả chưa được kiểm chứng.
- `../06-design/design-system.md`, `../../assets/README.md`: pixel art, đăng ký theo An, lớp áo xám; khung UI giữ hệ màu chung.
- Hồ sơ trong `assets/characters/{ba-mai,vinh,ba-lon,thay-ba-can}/README.md`; áo và kính trong `assets/garments/` và `assets/accessories/`.
- C2: nền đã chốt, Loan bản review-v3 và các strip tham chiếu An trong production-v4. Giữ nét, độ dài thân/chân; không quay lại đầu quá lớn.

Nếu JSON C3 cũ mâu thuẫn với docs mới, leader sửa theo docs trong sprint C3, không thay đổi cốt truyện để vừa một ảnh đã gen.

## Ngôn ngữ hình ảnh

Giữ nền pixel chi tiết, gỗ ấm, viền bậc và ánh sáng giàu chiều sâu như C2. Chuyển trọng tâm sang xanh ngọc, tường ngà, cửa chớp và ánh sáng phố; không neon hóa miền Nam. Không chép nguyên phòng Hà Nội sang Đa Kao.

Mai: tóc bob ngắn uốn ôm gáy, rẽ lệch, mặt thon và mắt hạnh nhân; áo dài xanh ngọc, đường ráp raglan, quần lụa dài và guốc mộc. Vinh: tóc rẽ ngôi, áo/suit lam khói, cử chỉ hỗ trợ. Bà Lớn: tóc rẽ giữa gọn, búi thấp với sợi bạc ở thái dương, mặt đầy và hàm rõ, mắt hẹp có nét tuổi; áo nhung mận chín, ngọc và ngọc trai. Thầy Ba Càn: áo dài xám cũ, người bình thường; không quái vật hóa, không dùng biểu tượng tín ngưỡng làm dấu hiệu tội lỗi.

### Phân biệt danh tính nữ — chỉnh theo phản hồi người dùng

Giữ chung nét pixel, tỷ lệ cơ thể và cách đổ bóng, không dùng chung một khuôn mặt rồi đổi màu áo. Điều chỉnh này ưu tiên hơn mô tả tóc phồng cũ của Mai trong hồ sơ asset. Không sửa An hoặc Loan/C2 trong đợt này.

| Nhân vật | Dáng tóc nhận diện | Đặc điểm mặt cần giữ |
| --- | --- | --- |
| An — giữ nguyên | Tóc dài xõa, hoa trắng | Mắt tròn, gương mặt mềm theo asset gốc |
| Loan — giữ nguyên | Tóc búi phồng, vài lọn buông | Theo danh tính C2 đã có; không lấy làm mặt mẫu cho Mai |
| Mai — bản mới | Bob ngắn ôm gáy, rẽ lệch, lộ tai | Oval thon, mắt hạnh nhân, nụ cười lanh lợi |
| Bà Lớn — bản mới | Rẽ giữa, tóc gọn búi thấp, sợi bạc | Mặt đầy vuông mềm, hàm rõ, mắt hẹp, nếp tuổi |

Các tư thế của cùng một nhân vật phải giữ cùng kiểu tóc, tỷ lệ mắt/mũi/hàm và độ tuổi. Chỉ biểu cảm thay đổi. Portrait đã tách từ đúng pose, không gen lại mặt. Bản hai đã được chọn cho lần xuất kỹ thuật theo cho phép của người dùng; gallery xuất cuối dành cho kiểm tra trước tích hợp. Đây không phải phục dựng tóc lịch sử đã được thẩm định.

Không sinh chữ, chữ giả, chữ ký hoặc triện vào giấy tờ. Nội dung thật do UI dựng, có dấu tiếng Việt. Hình thức căn phòng và y phục là minh họa hư cấu có cảm hứng thời kỳ, chưa phải phục dựng được thẩm định lịch sử.

## Danh mục và ý định sử dụng

| Nhóm | Nguồn trong gói duyệt | Sử dụng |
| --- | --- | --- |
| S1 | `c3-s1.png` | Tiệm may: máy may trái, cửa phố giữa, máy hát phải; bàn để biên nhận tách lớp |
| S2 | `c3-s2.png` | Phòng hồ sơ: bàn đọc, rương khóa, chỗ gắn ghi chú hai nhãn |
| S3 | `c3-s3.png` | Dinh thự: bàn đối chiếu trống, Mai đứng trung tâm, Vinh bên cạnh |
| Mai | `mai-work-v2.png`, `mai-expressions-v2.png` | Danh tính tóc bob mới đồng bộ: may áo, kiểm tra hồ sơ, tự lên tiếng, kết thúc |
| Vinh | `vinh.png` | Lắng nghe, nhận ra sự thật, làm chứng |
| Bà Lớn | `ba-lon-v2.png` | Danh tính búi thấp, mặt trưởng thành: nghiêm nghị, dao động, nhìn nhận chứng cứ |
| Thầy Ba Càn | `thay-ba-can-v2.png` | Bản chỉnh nét nam lớn tuổi theo phản hồi người dùng; bình tĩnh, lo lắng, tránh ánh mắt |
| Áo raglan | `raglan.png` | Ba góc mặc trên An; điều kiện phối đồ C3 |
| Áo cổ thuyền | `boat-neck.png` | Ba góc; áo thưởng phụ đã có trong JSON, tránh thưởng asset rỗng |
| Kính mắt mèo | `cat-eye.png` | Ba góc; phối với raglan và guốc mộc |
| Giấy tờ | `documents.png` | Biên nhận, sổ gốc, thỏa thuận, bản đối chiếu; nền giấy trống cho UI |
| Trạng thái rương | `chest-open.png`, `chest-empty.png` | Nguồn chỉnh sửa S2; phải xuất lớp phủ đúng đăng ký trước khi tích hợp |

Tất cả nguồn mới ở `assets/areas/chapter-3/_raw/review-v1/`. Gallery và manifest đi kèm là nguồn kiểm tra trạng thái thực tế, không phải tuyên bố đã vào app.

Tái sử dụng guốc mộc, Ông Lệ và icon manh mối hiện có khi phù hợp; không gen trùng để tăng số file. Nhân vật phụ Bà Lớn/Thầy Ba Càn có thể chỉ xuất hiện khi leader đã nối thoại; có art không đồng nghĩa được tự thêm nhánh truyện.

## Hợp đồng gameplay cần giữ

1. S1: đọc giấy tờ, lấy biên nhận, nghe thoại và mở lối phố. Không đặt thêm puzzle chỉ vì có máy may hoặc máy hát.
2. S2: khóa dùng hai nhãn UI **Càn / Tốn**, token `CAN_TON`. Đây là ghi chú do chủ rương đặt, không kiểm tra kiến thức bói hay phương vị. Mở rương rồi phải đọc cả sổ gốc lẫn thư thỏa thuận.
3. S3: đối chiếu bản sửa với hồ sơ gốc, UI ghim kèm thư thỏa thuận. Vinh làm chứng sau khi có bằng chứng; Mai tự nói. Phối raglan + kính mắt mèo + guốc mộc sau đối chất.
4. Giữ câu kết của Mai: “Tôi không cần một lời phán tốt hơn. Tôi cần các người ngừng dùng lời phán để quyết định thay tôi.”

Không lấy summary/thoại legacy về giờ sinh tốt, góc raglan cố định hoặc phần thưởng cũ làm chuẩn. Docs mới ghi mục tiêu thưởng 100 Sen; leader cần giải quyết chênh lệch dữ liệu trước nghiệm thu.

## Bộ xuất kỹ thuật đã hoàn thành

- Gallery: `assets/areas/chapter-3/_raw/production-v1/gallery.html`.
- Manifest chính: `assets/areas/chapter-3/manifest.json`; ghi SHA-256, kích thước, source, actor anchors và `worldPlacements` cho từng file.
- 51 PNG mới + 8 tái sử dụng. Bốn nhân vật có 13 pose tĩnh, 13 portrait và bốn `view-front`; không gọi các pose này là animation.
- NPC: 176×416, điểm chân `[88,400]`, cùng chiều cao giữa các pose của từng nhân vật. Portrait 128×128 tách từ cùng pose.
- `assets/garments/ao-dai-raglan/ao-dai-raglan.png` và `assets/garments/ao-dai-co-thuyen/ao-dai-co-thuyen.png`: strip 528×416, trước/nghiêng trái/sau, bốn key xám 33/97/158/224.
- `assets/accessories/kinh-mat-meo/kinh-mat-meo.png`: strip cùng khung, giữ màu. Renderer hiện tại ẩn slot jewelry ở góc sau; cần giữ hành vi này hoặc chủ động kiểm thử nếu đổi.
- Ba nền và overlay 1672×941. Giấy nằm trên bàn đã ép ngắn theo mặt bàn; khi đọc dùng `doc-c3-*.png` nguyên hình và chữ UI. Thu thập phải tắt overlay tương ứng, không bake vào nền.
- Hai overlay rương giới hạn ROI `[1050,270,1335,474]`; không thay ảnh nguyên phòng. CG kết `c3-s3-dinh-thu-doi-dau/cg-c3-mai-tu-len-tieng.png` là ảnh ghép, không thay danh tính nhân vật.
- Có hai ảnh fitting trên An và ba preview bố cục cảnh trong gallery. Preview chỉ là đề xuất bố cục, không phải tọa độ gameplay đã kiểm thử.
- Theo phản hồi người dùng, nhân vật trong cả ba cảnh và CG kết đã tăng **35%** so với bản ghép đầu: scale **1.35**, cao hiển thị khoảng 518 px trên nền cao 941 px. Giữ điểm chân, tỷ lệ thân/đầu và sprite 176×416 gốc. `sceneActors` trong manifest ghi pose, scale, điểm chân theo pixel nền và visible bounds. Leader chuyển các giá trị này sang tọa độ renderer, áp dụng tương ứng cho An cùng mặt phẳng; không nhân 1.35 thêm lần nữa nếu đã tính từ chiều cao hiển thị. Cần kiểm tra trong app khi tích hợp.
- Công cụ: `scripts/export-c3-assets.py`; kiểm tra: `scripts/test_c3_asset_tools.py`. [Bằng chứng kiểm tra](c3-asset-export-evidence.md).

## Leader tiếp tục tích hợp

- Người dùng duyệt tạo hình và nền qua gallery.
- Người dùng đã cho phép hậu kỳ như C2; đã giữ PNG gốc, crop pose và tách portrait. Không cần chạy lại ImageGen hoặc tự đổi danh tính nhân vật.
- Áo và kính cần đăng ký đúng ba góc An. Kiểm tra đặc biệt tay trái thả xuống, lưng không thủng thân, kính không vẽ tròng lên sau đầu. Không chỉ resize rồi tuyên bố khớp.
- Rương mở/rỗng phải là lớp phủ cùng kích thước nền, chỉ thay vùng rương. Ảnh gen cả phòng là nguồn, không được dùng nguyên ảnh làm overlay.
- Đo hotspot, vùng cản, chân nhân vật theo PNG thật; không dùng lại tọa độ placeholder của JSON hoặc C2.
- Xuất manh mối thế giới thành overlay; thu thập thì tắt lớp, không để giấy tiếp tục nằm trên nền.
- Duyệt kỹ thuật: alpha, kích thước, palette áo, scale giữa các pose, giao điểm cổ/tay/eo, clipping ở ba góc, rương không nhảy vị trí, không chữ giả.
- Nguồn giấy `documents.png` không chia đều các cột: sổ mở rộng hơn biên nhận. Tách theo bounding box thật, không chia bốn bằng nhau. Strip nhân vật cũng cần kiểm tra mép cột trước khi crop.
- Mai và Bà Lớn đã dùng danh tính bản hai. Thầy Ba Càn dùng bản hai nam lớn tuổi: tóc bạc ngắn, trán cao, mắt hẹp, hàm rõ và râu bạc. Giữ bản cũ để đối chiếu; không quay lại ảnh nguồn superseded hoặc tự tăng đầu.
- Duyệt trong UI ở mobile và desktop; so C2 cạnh C3. Không tuyên bố sửa tay họa sĩ, thẩm định văn hóa hoặc kiểm thử app khi chưa thực hiện.

## Phạm vi cách ly

Gói này không sửa `src/content/chapters/c3.json`, `data/runtime-assets.json`, `data/asset-gaps.json`, renderer hay các file C2. Chưa chạy `audit-assets.py` vì script đó ghi metadata chung trong lúc team đang phát triển C2. Leader C3 đăng ký asset theo manifest, nối trạng thái vật phẩm/rương/thoại, đo lại hotspot và chạy audit khi tích hợp. Vite đã bundle được asset mới, nhưng điều đó không chứng minh UI C3 đã dùng chúng.

Mặt trái, animation đi bộ bốn hướng, audio và cảnh tổ tiên C5 không thuộc gói này. Cảnh kết có thể dựng bằng nền S3 + pose Mai/Vinh thay vì gen thêm ảnh có nguy cơ lệch danh tính.

## Trạng thái

Đã hoàn thành xuất kỹ thuật theo cho phép của người dùng ngày 07/10/2026, cập nhật scale theo phản hồi sau đó. 23 kiểm tra PASS; helper coverage 100% (58/58 dòng). Build trước đợt chỉnh scale PASS; đợt này không đổi runtime code. PNG nguồn và prompt giữ nguyên. Gallery xuất cuối sẵn để kiểm tra; chưa tích hợp gameplay C3, chưa kiểm thử mobile/desktop C3 và chưa thẩm định văn hóa. Chưa commit hoặc chuyển sang worktree leader. Không gọi trạng thái này là “C3 gameplay hoàn chỉnh”.
