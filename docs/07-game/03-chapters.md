# 03 — Kịch bản triển khai từng chương

Đây là đường đi **đích cần build**, không phải mô tả mọi hành vi đã chạy. Area/puzzle ID bên dưới đều lấy từ JSON hiện tại. Bốn ID kết chương `d-c2-ending`…`d-c5-ending` là **ID mới đề xuất**, phải bổ sung schema và content. Các điều kiện đọc thoại, khóa cửa và thứ tự cao trào cũng cần bổ sung theo [kế hoạch kỹ thuật](04-implementation.md).

Quy ước: hoàn thành thoại = đã tới nút cuối hoặc đã xác nhận bản tóm tắt; nhặt giấy chưa đồng nghĩa đã đọc. Cho quay lại phòng cũ, giữ mọi chứng cứ, không tiêu hao vật phẩm nhiệm vụ. Mọi mục bắt buộc đều truy cập được trên mặt `phai`.

## Mở đầu — Căn Gác Thu 2026

**Mục tiêu:** học chạm, xem vật, dùng vật và đọc lời nhắn. Không đặt bài học lịch sử dài trước thao tác đầu tiên.

| Phòng | Kịch bản / hành động | Điều kiện đi tiếp |
|---|---|---|
| `c0-s1-tiem-may-chieu` | Nếp nhìn lên cầu thang; An xem gương, bàn may và lấy phấn xanh tùy chọn. Đọc `d-c0-stairs` khi chọn cầu thang | Đọc/chọn tiếp ở thoại cầu thang mở gác; không yêu cầu giải puzzle trong phòng không có puzzle |
| `c0-s2-gac-xep-chiec-ruong` | Gạt vải, tìm kim trong giỏ, mở khớp tượng, tra chìa vào rương | Hoàn thành ba puzzle và `d-c0-ba-dan-do` |

| Puzzle | Đáp án và kết quả | Gợi ý 1 → 2 → 3 |
|---|---|---|
| `p-c0-cloth` | `interact`; lộ ổ khóa | Rương đang bị phủ → xem tấm vải → chạm để gạt vải |
| `p-c0-mannequin-hand` | `kim_gut_bang_bac` → `chia_khoa_dong_ba_chau` | Bàn tay giữ một vật → khớp bị kẹt → dùng kim gút ở khớp tượng |
| `p-c0-chest-unlock` | Sau cloth, dùng chìa ba chấu → `thuoc_go_tho_may_1888`, thoại bà | Xem hình ổ khóa → cần ba chấu → dùng chìa từ tượng |

`d-c0-ong-le-whisper` là điềm báo tùy chọn, không bắt bật Lật vải. Kết thúc dùng thư của bà, ánh sáng từ thước chạm lên chiếc áo đầu tiên. Thưởng 50 Sen và thẻ nguồn gốc tiệm; thước chỉ xuất hiện một bản dù được cấp ở puzzle lẫn reward.

## C1 — Nếp Áo Khóa Chặt Thanh Xuân, 1888

**Mục tiêu cảm xúc:** từ bị giữ trong buồng đến tự bước qua cổng. **Văn hóa bằng hành động:** nhận biết con thoi/thắt lưng qua vật liệu, chiếc áo như vật dụng gắn với người mặc; không biến việc cắt chỉ thành phá bàn thờ.

| Phòng | Dàn cảnh và tiến trình | Cổng tiến trình đề xuất |
|---|---|---|
| `c1-s1-buong-det-khoa-kin` | Cầm bên khung dệt; bát cháo nguội gợi thời gian bị giữ. Nhặt con thoi và thắt lưng, ghép dụng cụ móc then | `p-c1-escape` mở cửa sau sang S2 |
| `c1-s2-ban-tho-nha-tho-ho` | Xem biển và hốc hộp cạnh cột. Kéo gia truyền đã có trong túi; dùng cắt dây buộc hộp, không cắt đồ thờ | Đọc lần lượt thư và văn tự sau khi lấy; mở S3 khi cả hai đã được đọc |
| `c1-s3-cong-dinh-doi-dau` | Văn tự phản bác việc trục lợi; thư phản bác lời mạo danh chồng; Cầm nói quyết định, sau đó chọn áo | Hai chứng cứ → `d-c1-giai-phong` → styling → `d-c1-gate-exit` |

| Puzzle | Đáp án / hiệu ứng | Gợi ý 1 → 2 → 3 |
|---|---|---|
| `p-c1-escape` | Ghép `con_thoi_go_mun` + `that_lung_lua_cham` thành `dung_cu_moc_then_cua`; dùng ở then | Cửa sau có khe → cần móc và dây → ghép con thoi với thắt lưng |
| `p-c1-altar-cut-threads` | `keo_may_bang_dong` → thư + `to_van_tu_cam_co_dat`; xếp hàng hai thoại | Hộp bị dây giữ → đồ nghề cắt được dây → dùng kéo ở hộp cạnh cột |
| `p-c1-present-contract` | Trình văn tự trước người đang che giấu việc cầm cố | Tách lời nói khỏi giấy tờ → xem dấu trên văn tự → trình văn tự cầm cố đất |
| `p-c1-present-letter` | Sau contract, trình `buc_thu_tay_chong_cu_Cam` | Ai đang nói thay người khác? → đọc thư thật → trình thư chồng Cầm |
| `p-c1-styling-cam` | Sau lời tự quyết; outfit ở bảng gameplay | Cầm muốn chiếc áo của mình → xem brief áo/khăn/guốc → chọn ngũ thân tay chẽn, khăn đen, guốc |

**Thoại cao trào đề xuất:** “Lá thư này bác lời các ông nói thay chồng tôi. Còn đi hay ở, tôi tự quyết.” Không viết thư là “chân lý” cấp quyền cho Cầm. Không dùng cáo buộc dân gian về hình phạt như luật lịch sử đã xác minh.

Kết: bước qua cổng, tiếng dệt trở lại đều. Thưởng 100 Sen, hai áo và hai thẻ theo `reward-c1`; mở C2 sau kết chứ không sau puzzle đầu tiên.

## C2 — Tiếng Kéo Đêm Phố Cũ, 1935

**Mục tiêu:** phục hồi tiếng nói tác giả, chứng minh khoản nợ đã trả. **Biến thể gameplay:** ghép dải bản vẽ và đọc đối chiếu giấy tờ, không thêm một puzzle mã số dù thoại cũ có chữ “mật mã”.

| Phòng | Dàn cảnh / tiến trình | Cổng tiến trình đề xuất |
|---|---|---|
| `c2-s1-gac-lung-ve-tranh` | Dùng tên hiển thị Hàng Đào cho thống nhất. Gắn `d-c2-ca-nghi` làm thoại mở đầu; bốn mảnh ở bàn, giỏ, đèn, cửa sổ | Đọc mở đầu; lấy đủ bốn mảnh; ghép và đọc `d-c2-mat-ma` mở S2 |
| `c2-s2-kho-vai-hang-dao` | Chìa sau đồng hồ mở két; nhìn hai tờ giấy và dấu xác nhận trên cùng màn đọc | Hoàn thành safe + đọc `d-c2-bien-lai` và `d-c2-giao-keo` mở S3 |
| `c2-s3-phong-trien-lam-doi-dau` | Sự kiện trong truyện, không nhận là triển lãm lịch sử đã được xác minh. Trình biên nhận, rồi để Loan trình bản vẽ mình ký | receipt → sketch → styling → `d-c2-ending` mới |

| Puzzle | Đáp án / hiệu ứng | Gợi ý 1 → 2 → 3 |
|---|---|---|
| `p-c2-sketch-assemble` | `manh_ban_ve_ao_dai_1` → `_2` → `_3` → `_4`; đủ bốn vật mới được nộp; nhận `ban_ve_ao_dai_tan_thoi` | Tìm dấu nét nối → nhìn hình và chữ ký → xếp bốn dải theo mẫu 1–2–3–4 |
| `p-c2-safe-open` | `chia_khoa_ket_sat_bang_thau` → biên lai và giao kèo | Đồng hồ che vật sáng → xem sau con lắc → lấy chìa mở két; giấy phía sau hiện trực tiếp |
| `p-c2-present-receipt` | `bien_lai_tra_no_goc_1935` | Kiểm tra lời nói còn nợ → đọc xác nhận nhận tiền → trình biên lai |
| `p-c2-present-sketch` | Sau receipt, `ban_ve_ao_dai_tan_thoi` | Loan muốn làm nghề gì? → nhìn tên tác giả → trình bản vẽ đã ghép |
| `p-c2-styling-loan` | Đề xuất outfit Lemur phù hợp mốc 1935, xem gameplay | Xem năm trên brief → chọn mẫu Loan vừa vẽ → áo Lemur và phụ kiện ghi rõ trong brief |

**Kết mới `d-c2-ending`:**

> Loan: “Khoản nợ đã trả. Còn bản vẽ, tôi sẽ tự ký tên.”
>
> An: “Chiếc áo này không chọn thay cuộc đời cô. Nó đi cùng điều cô đã chọn.”

Một khung hình cận chữ ký chuyển thành nét mực trong sổ tiệm. Thưởng mục tiêu 100 Sen. Mẫu áo mô tả cuối thập niên 1930 có thể được giới thiệu như tư liệu giai đoạn sau ở phần thưởng, không nói Loan mặc nó tại sự kiện 1935. Phải duyệt mẫu Lemur và phụ kiện trước khi chốt content.

## C3 — Đường Chỉ Xuyên Năm Tháng, 1962

**Mục tiêu:** nhận ra hồ sơ bị sửa và tiền trao đổi để ép Mai. **Điều không được kể:** “lá số tốt” mới khiến Mai xứng đáng, hoặc kỹ thuật raglan chứng minh bói toán đúng/sai.

| Phòng | Dàn cảnh / tiến trình | Cổng tiến trình đề xuất |
|---|---|---|
| `c3-s1-tiem-may-da-kao` | Mai đang chỉnh tay áo; nghe máy hát tùy chọn, xem hai tờ giấy và lấy `bien_nhan_tien_thay_boi`. Gắn `d-c3-mua-chuoc` vào xem biên nhận | Đã có biên nhận và đọc mua chuộc; `d-c3-street-exit` mở S2. Không trông chờ puzzle để mở vì S1 không có puzzle |
| `c3-s2-phong-phong-thuy` | Ghi chú có hai nhãn Càn/Tốn; mở tráp, đọc bản gốc và thư thỏa thuận nhận tiền | Đọc `d-c3-bagua`, giải lock, đọc cả `d-c3-so-tu-vi` và `d-c3-thoa-thuan` mở S3 |
| `c3-s3-dinh-thu-doi-dau` | Đối chiếu nội dung bị sửa với thư thỏa thuận. Vinh xác nhận sau chứng cứ, không nói thay Mai | evidence → `d-c3-vinh-stand` → `d-c3-ong-le-defeat` → styling → kết mới |

| Puzzle | Đáp án / hiệu ứng | Gợi ý 1 → 2 → 3 |
|---|---|---|
| `p-c3-bagua-lock` | UI hai ô Càn/Tốn → `CAN_TON`; nhận sổ gốc và thư thỏa thuận | Mã nằm trong ghi chú chủ tráp → đọc thứ tự hai nhãn → Càn trước, Tốn sau |
| `p-c3-present-evidence` | Chọn `so_tu_vi_nguyen_ban_1962`; yêu cầu đã có/đọc cả thư thỏa thuận; UI ghim thư cạnh sổ | Chứng minh ai sửa hồ sơ → đối chiếu với thư nhận tiền → trình bộ hồ sơ, chọn sổ làm vật đại diện |
| `p-c3-styling-mai` | Áo raglan, kính mắt mèo, guốc; soi đường ráp tay trong preview tùy chọn | Nhìn đường nối cổ–nách → chọn mẫu Mai đang làm → raglan và phụ kiện trong brief |

**Kết mới `d-c3-ending`:**

> Mai: “Tôi không cần một lời phán tốt hơn. Tôi cần các người ngừng dùng lời phán để quyết định thay tôi.”
>
> Vinh: “Tôi sẽ làm chứng về những gì đã thấy.”

Đường chỉ chéo trên tay áo được highlight để quan sát kỹ thuật, không ghi góc 45 độ cố định như quy luật mọi mẫu áo. Thưởng mục tiêu 100 Sen; thẻ về kỹ thuật và thẻ phê phán hành vi thao túng phải qua duyệt văn hóa.

## C4 — Tấm Lụa Đáy Rương, 1982

**Mục tiêu:** trải nghiệm sự chăm chút trong điều kiện thiếu thốn và trả lại tên người đóng góp. Không lãng mạn hóa nghèo khó như điều kiện để sống tốt.

| Phòng | Dàn cảnh / tiến trình | Cổng tiến trình đề xuất |
|---|---|---|
| `c4-s1-can-ho-tap-the` | Nam châm từ loa cũ, kim dưới khe gạch, chỉ đào cạnh vải; Phương chọn thêu bông nhỏ lên áo cưới | magnet → embroider đủ hai vật → đọc `d-c4-ao-cuoi` mở S2 |
| `c4-s2-tu-duong-ho-nguyen` | Đọc `d-c4-nam-1845`: năm trên xà của căn nhà trong truyện, không phải năm thành lập làng. Mở tráp, xem trang thất lạc | chest → đọc `d-c4-cong-duc` mở S3 |
| `c4-s3-san-tu-duong-doi-dau` | Đọc `d-c4-uncle-suu`, trình trang gốc, nghe sự ghi nhận; phối áo đã thêu | genealogy → `d-c4-patriarch-defeat` → styling → kết mới |

| Puzzle | Đáp án / hiệu ứng | Gợi ý 1 → 2 → 3 |
|---|---|---|
| `p-c4-magnet-needle` | `nam_cham_loa_dai` → `kim_theu_thep` | Kim khó với tới → có vật hút thép → dùng nam châm ở khe gạch |
| `p-c4-embroider-flower` | Phải có cả `kim_theu_thep` và `cuon_chi_to_dao`; nhận `chiec_ao_dai_cuoi_vai_phin` | Muốn thêu cần gì? → kiểm tra hai ô → chọn kim và chỉ, xác nhận |
| `p-c4-chest-code-1845` | `1845`; nhận `cac_trang_gia_pha_goc_bi_xe` trên mặt phải | Dòng khắc thuộc căn nhà → xem xà nóc → nhập 1845 |
| `p-c4-present-genealogy` | Trình các trang gốc; bản phiên âm/diễn giải có nhãn rõ | Tên nào đã bị bỏ? → đọc trang còn lưu → trình trang gia phả gốc |
| `p-c4-styling-phuong` | Áo cưới phin, guốc theo baseline; màu/brief không mâu thuẫn | Chiếc áo vừa tự hoàn thiện → chọn áo có hoa đào → áo cưới phin và guốc |

**Kết mới `d-c4-ending`:**

> Phương: “Con không xin xóa tên ai. Con muốn ghi đủ những người đã giữ ngôi nhà này.”
>
> Người trong họ: “Vậy hãy ghi cả tên, cả việc họ đã làm.”

Đổi hình ảnh một dòng tên xuất hiện trong sổ thay vì “đánh bại cả dòng họ”. Thưởng mục tiêu 100 Sen; tài liệu công đức của Loan/Mai được gắn nhãn hư cấu gia đình.

## C5 — Nếp Áo Hồi Sinh, 2026

**Mục tiêu:** dùng điều đã học để phản bác quảng cáo sai và tự thiết kế có trách nhiệm. Không dùng mini-game để kết luận pháp lý hàng giả hoặc xét vật liệu nào “không Việt”.

| Phòng | Dàn cảnh / tiến trình | Cổng tiến trình đề xuất |
|---|---|---|
| `c5-s1-tiem-may-bao-mang` | Băng Mai và livestream hư cấu; quảng cáo nhận là phục dựng đúng mẫu nhà An. Đối chiếu ba chi tiết bằng ảnh/nhãn chuẩn bị sẵn | scanner → `d-c5-ho-so` → `d-c5-stairway` mở S2 |
| `c5-s2-tran-dia-chi-vang` | Đổi tên hiển thị “Bàn ký ức”. Bốn chân dung/kỷ vật và An ở giữa; đọc các ký ức theo thứ tự tự chọn, sau đó nối theo năm | Đọc bốn chân dung và An; giải matrix mở S3. Mọi nút ở `phai`, không bật Fabric Flip |
| `c5-s3-doi-chat-hoi-sinh` | Trình hồ sơ tại sự kiện hư cấu; Lâm đính chính, thêm nguồn và gọi thiết kế mới là cách tân. An phối áo Remix | dossier → `d-c5-lam-apology` đã biên tập → styling → `d-c5-ending` mới |

| Puzzle | Đáp án / hiệu ứng | Gợi ý 1 → 2 → 3 |
|---|---|---|
| `p-c5-scanner-diagnose` | Ba ID cũ `khuy_bam_kim_loai`, `thieu_vat_con`, `vai_nilon_lai_cang`; đổi nhãn UI thành “Cách đóng áo”, “Vạt trong”, “Nhãn chất liệu”; nhận hồ sơ | So với lời quảng cáo, không so “thuần Việt” → mở ảnh chi tiết và nhãn → chọn ba vùng được đối chiếu |
| `p-c5-golden-weave-matrix` | `hitbox-ancestor-east` → `hitbox-ancestor-south` → `hitbox-ancestor-west` → `hitbox-ancestor-north` → `hitbox-an-center` | Theo thời gian → nhìn năm dưới chân dung → Cầm 1888, Loan 1935, Mai 1962, Phương 1982, An 2026 |
| `p-c5-present-dossier` | `ho_so_giam_dinh_y_phuc_2026`; UI gọi “Hồ sơ đối chiếu mẫu”, không tuyên bố chứng nhận chuyên môn | Chỉ ra điểm không khớp lời quảng cáo → mở hồ sơ → trình hồ sơ trên màn hình |
| `p-c5-styling-an` | Áo ngũ thân Remix + quạt lụa, màu tự chọn | Sáng tạo và ghi nguồn → đọc brief phụ kiện → chọn áo Remix cùng quạt |

Giữ ID legacy để giảm ảnh hưởng save, nhưng không hiển thị từ “lai căng”. Không dùng Đông/Tây làm gợi ý vì tọa độ hình hiện tại không bảo đảm hướng; thứ tự dựa trên năm nhìn thấy được.

**Đối thoại đính chính đề xuất:**

> An: “Áo mới không sai vì có thay đổi. Điều cần sửa là lời giới thiệu rằng nó giống hệt mẫu cũ.”
>
> Lâm: “Tôi sẽ sửa phần mô tả, ghi nguồn mẫu và chỉ rõ những phần thiết kế lại.”

`d-c5-ending` chứa hậu truyện ở tiệm trong [story bible](01-narrative.md); không cần thêm area ID thứ 18: dùng vignette kết chương hoặc nền Hub sẵn có. Thưởng mục tiêu 100 Sen, áo và thẻ cuối. Ông Lệ tan thành sợi chỉ được dùng để may tiếp, không phải mọi định kiến xã hội đã được xóa vĩnh viễn.
