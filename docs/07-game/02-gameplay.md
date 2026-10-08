# 02 — Gameplay và UX

## Vòng lặp chơi

Khám phá phòng → quan sát đồ vật → có câu hỏi → tìm/đối chiếu manh mối → giải một trở ngại → nghe nhân vật tự quyết định → hoàn thiện áo → mang ký ức về tiệm.

Một phòng giới thiệu tối đa một thao tác mới. Khoảng 4–6 hotspot hữu ích/phòng; vật trang trí được nhìn nhưng không giả vờ là vật phẩm. Sau mỗi hành động đúng phải có thay đổi nhìn thấy: hộp mở, giấy ghép lại, đường chỉ nới, NPC thay dáng. Không dùng thông báo “đúng” thay toàn bộ phản hồi.

Mục tiêu nhịp: Mở đầu 8–10 phút; C1 15–18; C2 18–22; C3 15–18; C4 18–22; C5 15–20. Playtest đo thực tế, không thêm lời thoại chỉ để đạt thời lượng.

## Giao diện phòng

- Trên cùng: tên chương/phòng, mục tiêu ngắn, nhật ký, cài đặt, về bản đồ.
- Giữa: tranh phòng + An + NPC + hotspot DOM trên canvas; không nhúng chữ quan trọng vào ảnh.
- Dưới: túi đồ, xem vật phẩm, “Dùng”, “Ghép”, “Soi”. Túi dài được cuộn và có bộ lọc vật phẩm của chương, không mất vật phẩm cũ.
- Cửa ra là nút rõ ràng. Cửa khóa giải thích điều còn thiếu bằng ngôn ngữ truyện, không để người chơi click vô hiệu.
- Khi chạm vật, An tới vị trí tương tác rồi mới mở nội dung. Bật giảm chuyển động cho phép tới ngay; kết quả core không phụ thuộc animation kết thúc đúng một frame.

Chạm vật → chọn vật phẩm → xác nhận là luồng chuẩn. Kéo-thả chỉ là tiện ích bổ sung. Mọi thao tác có Tab/Enter/Escape và nhãn đọc màn hình; không cần phản xạ, nghe âm thanh hoặc phân biệt màu để thắng. `Soi` làm rõ vị trí hotspot nhưng không tự giải câu đố; Space chỉ dùng khi không nhập mã/đọc modal.

## Sáu loại câu đố — hợp đồng UI

| Loại / ví dụ | Đầu vào và tương tác | Phản hồi / bảo vệ |
|---|---|---|
| `use` — chìa mở rương | Chọn một vật; hoặc nút tương tác nếu `action=interact` | Kiểm tra sở hữu và mục tiêu; sai không mất vật |
| `use` nhiều vật — thêu | Các ô “Kim”, “Chỉ”; chọn đủ rồi “Bắt đầu” | Thiếu chỉ nói rõ thiếu; mảng rỗng/một vật không được thành công |
| `present` — biên nhận | Chọn chứng cứ và đúng người/bàn trình bày, mở bản đọc được | Chứng cứ không bị tiêu hao; gợi ý vì sao vật khác chưa giải quyết lời cáo buộc |
| `order` — bản vẽ / ký ức | Khe đánh số, bấm thêm/bỏ, nút đổi vị trí; kéo-thả tùy chọn | Chặn trùng; xác nhận sau khi đủ; không yêu cầu xoay hình nếu schema chưa có góc xoay |
| `code` — két | C4 bàn phím 4 số; C3 hai ô chọn nhãn quẻ | C3 gửi giá trị chuẩn `CAN_TON`; không bắt người dùng đoán dấu gạch dưới |
| `find` — đối chiếu áo | Hai bản đối chiếu, hotspot + danh sách tương đương, chọn/bỏ chọn | Chính xác ba điểm khác nhau, không chấp nhận bấm cùng điểm ba lần |
| `styling` — cuối chương | Studio có danh sách mượn riêng, mục tiêu, thử áo, xác nhận | Áo đủ để giải luôn có sẵn; chỉ kiểm tra các trường đã nói trong đề |

`use` đơn/nhiều vật vẫn là một loại schema, nên tổng cộng sáu loại. Ghép con thoi + thắt lưng dùng recipe inventory hiện có, không thêm một engine crafting mới.

### Đặc tả puzzle đặc trưng

**Ghép bản vẽ C2:** bốn mảnh là bốn dải có dấu nối và phần hình liên tục. Thứ tự 1→2→3→4. Người chơi nhìn cổ, thân, tay và chữ ký trên bản phác cách điệu; không tuyên bố đây là quy trình may thật. Không viết “xoay mảnh” khi evaluator chỉ kiểm tra thứ tự. Chữ ký hiện rõ sau hoàn thành.

**Ổ khóa C3:** hai vòng có cả chữ và ký hiệu. Gợi ý xuất hiện trong ghi chú riêng của chủ tráp: “Càn trước, Tốn sau”. Đây là mã khóa hư cấu, không phải quy luật bói toán hoặc liên hệ khoa học với đường may raglan. Hình ráp tay raglan được giải thích ở bài phối/nhật ký riêng.

**Thêu C4:** có đủ kim và chỉ mới bắt đầu. Người chơi có thể bấm lần lượt năm điểm để xem bông hoa hiện dần; thao tác này là trình diễn tùy chọn, nút “Hoàn tất mũi thêu” tương đương. Không tính độ chính xác tay, tốc độ hoặc bắt lặp minigame khi tải lại. Thành công chỉ cấp áo một lần.

**Đối chiếu C5:** bên trái là mẫu tham chiếu trong hồ sơ gia đình, bên phải là sản phẩm quảng cáo “phục dựng đúng mẫu này”. Ba điểm đối chiếu: cách đóng áo, cấu trúc vạt trong, thông tin chất liệu trên nhãn. Vạt trong có ảnh chi tiết được tác giả chuẩn bị; không suy ra phần bị che từ một ảnh. Đọc nhãn chất liệu, không nhận diện hóa học bằng mắt. Game chạy bằng dữ liệu cố định, không cần AI.

## Gợi ý, nhật ký, thất bại

Ba nấc, người chơi tự mở miễn phí: 1) nhắc mục tiêu; 2) chỉ quan hệ/đồ vật; 3) nói hành động chính xác. Không giảm thưởng và không phán xét người cần hỗ trợ. Sau hai lần sai có thể mời mở gợi ý, không tự bật đáp án. Đã nhặt/đọc thì nấc gợi ý phải chuyển sang bước tiếp theo.

Nhật ký gồm “Việc đang làm”, “Chứng cứ đã đọc”, “Chuyện gia đình”, “Tư liệu văn hóa”. Thông tin hư cấu và sử liệu không dùng chung nhãn. Mở nhật ký không đổi tiến trình. Có nút quay về phòng chứa manh mối đã biết, nhưng không tự thu thập hộ.

Sai vật phẩm: phản hồi trong ngữ cảnh, ví dụ “Tờ này nói về nợ; điều Loan muốn nói tiếp là bản vẽ của mình”. Không mất tiền, không reset phòng. Thoát puzzle giữ bản nháp; “Làm lại câu đố” phải nói rõ chỉ xóa bản nháp, không xóa chương.

## Phối đồ không phải bài kiểm tra phẩm hạnh

Tách “đúng yêu cầu bài tập” khỏi “đúng/sai văn hóa”. Chương đưa ra một nhiệm vụ cụ thể, ví dụ thử chiếc áo Cầm đã chọn cùng khăn và guốc. Không nói mọi phụ nữ năm 1888 đều mặc một kiểu, hay một lựa chọn khác làm người mặc kém giá trị.

Giữ nghiệm thu tối thiểu theo đáp án hiện tại, ngoại trừ C2 đề xuất đổi sang `ao-dai-lemur`:

| Chương | Áo / trường bắt buộc | Tự do và nội dung phải chỉnh |
|---|---|---|
| C1 | `ao-ngu-than-tay-chen`, `ngu_than_tay_chen`, `khan-van-den`, `guoc-moc` | Màu tự chọn; sửa hint đang nói áo tay thụng và thước cầm tay |
| C2 | Đề xuất `ao-dai-lemur`, `tan_thoi`, `khan-van-den`, `guoc-moc` | Biên tập brief phụ kiện theo phương án được duyệt, không hint chuỗi ngọc khi không kiểm tra nó |
| C3 | `ao-dai-raglan`, `tan_thoi`, `kinh-mat-meo`, `guoc-moc` | Màu tự chọn; không hứa cổ thuyền cũng đúng nếu chưa có accepted variants |
| C4 | `ao-dai-cuoi-phin`, `tan_thoi`, `guoc-moc` | Sửa hint dép nhựa/tóc cặp; nếu đổi sang dép phải thêm asset và đáp án cùng lúc |
| C5 | `ao-ngu-than-remix-2026`, `ngu_than_tay_chen`, `quat-lua` | Thước là biểu tượng truyện, không phải đáp án phụ kiện; màu không chấm độ “thuần Việt” |

Nếu sau duyệt cho nhiều outfit hợp lệ, bổ sung `acceptedVariants` có kiểu rõ ràng và tests, không âm thầm mở rộng bằng so khớp tên. Vật phẩm cho mượn chỉ thuộc phiên thử thách; sau kết chương mới sở hữu phần thưởng, không mua bằng Sen để qua màn.

## Kết chương, chơi lại và kết nối app

Đủ puzzle → mở đối thoại kết → xác nhận kết → cấp thưởng một lần → hiện ký vật + ý nghĩa + thẻ đọc thêm → mở chương kế. Không bắt đọc thẻ để nhận áo hoặc mở chương.

Tủ đồ nhận áo; Bảo tàng nhận thẻ; Hub trở thành nơi nhìn lại hành trình. Có thể trở về Hub giữa chừng. Chơi lại dùng trạng thái replay riêng hoặc xem lại cảnh đã hoàn thành; không xóa tiến trình chính, không farm Sen, không nhân bản áo. Chức năng replay là hạng mục mới phải triển khai, không mặc định đã có.
