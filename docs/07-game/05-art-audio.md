# 05 — Mỹ thuật, giao diện và âm thanh

## Nguyên tắc sản xuất

Giữ pixel art và hệ hình hiện có; không vẽ lại toàn bộ Mở đầu/C1 khi chưa cần. Bối cảnh là không gian hư cấu có tham chiếu văn hóa, không gắn nhãn phục dựng chính xác nếu chưa đủ nguồn. Không dùng chữ Hán/Nôm giả làm manh mối có ý nghĩa; mọi văn bản cần bản đọc HTML và người kiểm tra.

An hiện có sprite 176×416; đặt chân theo cấu hình `character-scale.ts`, không suy ra scale từ chiều cao file có padding. Nền dùng kích thước native và metadata runtime; không cưỡng ép mọi nền thành 800×500 chỉ vì placeholder JSON ghi như vậy. Khi có nền cuối phải đo lại logicalSize, vùng đi, foot anchor, NPC occlusion và rect hotspot.

Đường dẫn nền tiếp tục quy ước runtime:

`assets/areas/<prologue|chapter-N>/<area-id>/<area-id>--phai.png`

Kiểm tra [assets.ts](../../src/game/assets.ts) trước khi giao asset; chỉ thêm `--trai` nếu pha Lật vải thực sự được duyệt. Cập nhật registry/metadata bằng quy trình repo, không dùng bảng “không thiếu asset” cũ làm bằng chứng đã đủ cảnh.

## Danh sách 17 nền

Hai phần đầu đã có thư mục nền, vẫn cần QA hotspot. Bốn phần sau tương ứng **12 nền còn phải bổ sung** tại thời điểm lập hồ sơ.

| Area ID | Điểm nhìn / đạo cụ phải đọc được | Khoảnh khắc thay đổi |
|---|---|---|
| `c0-s1-tiem-may-chieu` | Cầu thang, bàn may, gương, Nếp | Nếp hướng mắt lên gác |
| `c0-s2-gac-xep-chiec-ruong` | Giỏ kim, tay tượng, rương, vải phủ | Vải bỏ xuống, rương mở |
| `c1-s1-buong-det-khoa-kin` | Khung dệt, con thoi, dây, cửa sau | Then cửa trượt |
| `c1-s2-ban-tho-nha-tho-ho` | Không gian thờ trang trọng; hộp nhỏ cạnh cột, không trong vật thiêng | Dây hộp nới, giấy hiện |
| `c1-s3-cong-dinh-doi-dau` | Người đối thoại, vị trí trình giấy, cổng | Cầm bước ra sau lời tự quyết |
| `c2-s1-gac-lung-ve-tranh` | Bốn vùng chứa mảnh giấy, giá vẽ | Bản phác và chữ ký hoàn chỉnh |
| `c2-s2-kho-vai-hang-dao` | Đồng hồ và chìa nhìn thấy khi soi, két, hai giấy | Két mở, giấy đặt cạnh nhau |
| `c2-s3-phong-trien-lam-doi-dau` | Bảng trưng bày, người nghe, Loan | Bản vẽ có tên Loan được treo |
| `c3-s1-tiem-may-da-kao` | Máy may, máy hát, biên nhận, lối phố | Mai mang chứng cứ đi |
| `c3-s2-phong-phong-thuy` | Ghi chú mã, tráp, chỗ đọc hồ sơ | Hai văn bản có dấu sửa khác nhau |
| `c3-s3-dinh-thu-doi-dau` | Bàn trình chứng cứ, Mai và Vinh | Mai đứng ở trung tâm lời nói |
| `c4-s1-can-ho-tap-the` | Loa cũ, khe kim, chỉ, áo phin | Bông hoa hoàn thiện |
| `c4-s2-tu-duong-ho-nguyen` | Xà ghi năm, tráp, trang giấy | Trang được mở để đọc |
| `c4-s3-san-tu-duong-doi-dau` | Bàn sổ gia đình, người các thế hệ | Dòng tên được bổ sung |
| `c5-s1-tiem-may-bao-mang` | Băng cũ, màn livestream, bàn đối chiếu | Hồ sơ ba điểm được ghim |
| `c5-s2-tran-dia-chi-vang` | Bốn ký vật có năm, An giữa bàn | Sợi chỉ nối theo thời gian |
| `c5-s3-doi-chat-hoi-sinh` | Màn hình đính chính, sàn diễn, An | Mô tả nguồn mới và áo Remix |

Nền tĩnh không chứa vật phẩm vẫn vẽ sau khi đã nhặt. Đồ nhặt, nắp mở, dây cắt và giấy được trình là overlay/state variant riêng. Đừng để nền luôn vẽ chìa khóa sau khi inventory đã có chìa.

## Gói asset bổ sung cho mỗi chương

- Nền phai của từng phòng; spawn, floorTop/floorBottom, vùng che An, exit arrows, rect tương tác trên nền cuối.
- NPC/portrait cần thiết; kiểm tra trước các bộ nhân vật đang có như Loan, Mai, Phương, Cả Nghị, Vinh, Hoàng Lâm để tái sử dụng. Không coi có thư mục là mọi pose đã dùng được.
- Ảnh cận chứng cứ: thư/văn tự, bản vẽ bốn dải, biên nhận, hồ sơ sửa, gia phả, ba ảnh đối chiếu C5; bản chữ đọc được và nhãn hư cấu.
- Thumbnail vật phẩm, hình preview áo/phụ kiện; có loan wardrobe rendering đúng trước khi phát thưởng.
- Một vignette kết chương C1–C5; Mở đầu đã có hướng CG riêng. Vignette có thể dùng nền và pose sẵn có để giảm chi phí; không bắt video.
- Trạng thái thiếu asset phải có thông báo/retry hoặc placeholder có nhãn trong môi trường dev; bản phát hành không được âm thầm hiện phòng trống.

## Màu, chữ và bố cục

Mở đầu: nắng chiều, bụi gác và gỗ ấm. C1: chàm/gỗ, khoảng cửa sáng. C2: giấy, mực, sắc vải nổi hơn. C3: ánh sáng phố và xanh ngọc, không rập khuôn miền Nam thành biển hiệu neon. C4: phin sáng, gạch, điểm đào nhỏ. C5: trở lại màu tiệm và đường chỉ nối; sáng tạo hiện đại không bị mã hóa thành “đen/xấu”. Đây là art direction đề xuất, không phát biểu lịch sử về bảng màu của cả thời kỳ.

VT323 dùng tiêu đề ngắn theo hệ hiện có; Be Vietnam Pro cho thoại, nguồn và chứng cứ dài. Không đặt đoạn đọc nhỏ bằng font pixel. Chữ có dấu đầy đủ, tăng kích thước được, không tràn nút. Hotspot tối thiểu 44×44 CSS px; mở rộng vùng bấm nhưng tránh đè hai đối tượng gần nhau.

Desktop ưu tiên khung ngang; tablet/mobile giữ tỷ lệ nền, không kéo méo. Mobile dọc có hộp thoại/bottom sheet cuộn, nút túi và cửa luôn truy cập được; có thể gợi ý xoay máy nhưng không khóa chơi. Tại mọi viewport kiểm tra An không che đúng vị trí cần chạm.

## Âm thanh và chuyển động

Âm thanh là lớp tùy chọn: tiếng bước gỗ, kéo cắt, giấy mở, khung dệt, máy may, đài cũ. Không sử dụng bản ghi/bài hát có bản quyền chỉ vì hợp thời đại; phải có quyền sử dụng và ghi nguồn/license. Không tự gắn một nhạc cụ hoặc giai điệu với cả vùng nếu chưa thẩm định.

Không có manh mối chỉ nghe được: tiếng đài luôn có transcript, âm báo có phản hồi chữ. Tách âm lượng nhạc/hiệu ứng; lưu mute. Giảm chuyển động bỏ rung, nhấp nháy và hành trình đi dài; vẫn giữ trạng thái tương tác. Khi QA, đợi animation ổn định rồi mới kết luận lớp ảnh mờ hoặc trong suốt là lỗi.
