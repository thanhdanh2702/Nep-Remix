# Các Quyết Định Kiến Trúc & Thiết Kế Đã Chốt (Decisions)

> **Lưu ý tối cao:** Tài liệu này là nguồn chân lý (Single Source of Truth) cao nhất về thiết kế, giao diện, cấu trúc và công nghệ của dự án. Hễ bất kỳ tài liệu nào khác trong `docs/` mâu thuẫn với `decisions.md` thì nội dung trong `decisions.md` là quyết định đúng và có hiệu lực thi hành.

---

### 1. Nhận diện & Tên thương hiệu
- **Quyết định:** Tên ứng dụng hiển thị là **"Tiệm May Nếp"**, dòng phụ dưới logo là **"Việt phục Remix"**, cùng khẩu hiệu chính thức: **"Một tà áo. Muôn câu chuyện."**
- **Lý do:** Định vị rõ rệt trải nghiệm kết hợp giữa may mặc cổ phong và kể chuyện văn hóa Việt hiện đại, gần gũi nhưng tôn trọng truyền thống.

### 2. Không gian Sảnh chính (Hub) & Điều hướng
- **Quyết định:** Sảnh chính là **SÂN NHÀ** ngoài trời lúc hoàng hôn (theo ảnh target: nền gạch đỏ hoa văn tròn trung tâm, ao sen bên trái, dãy nhà ngói hai bên, cổng vòm ở giữa). Bốn biển gỗ điều hướng vào 4 khu vực:
  - **"Phòng phối đồ"** (`id: studio`): Dãy nhà ngói bên trái; nơi thử đồ, phối màu và tạo diện mạo.
  - **"Tủ đồ"** (`id: closet`): Dãy nhà ngói bên phải; tích hợp Tủ đồ cá nhân, Cửa hàng và Xưởng may trang phục.
  - **"Cốt truyện"** (`id: journey`): Cổng vòm ở giữa sân; dẫn vào game Hành trình và chiếc rương cũ trên gác xép.
  - **"Bảo tàng"** (`id: museum`): Kệ sách gỗ cạnh bức tường trắng bên trái cổng vòm; lưu trữ kho thẻ văn hóa và kiến thức cổ phục.
  *(Các tên gọi cũ như "Bàn may", "Tủ gỗ", "Kệ sách" chỉ đóng vai trò văn phong miêu tả chi tiết, không dùng làm nhãn nút điều hướng trên UI).*
- **Lý do:** Khớp tuyệt đối với bản thiết kế trực quan mục tiêu (target mock-up) và tạo bố cục không gian nhập vai trực quan, phân định rành mạch 4 chức năng cốt lõi.

### 3. Đơn vị tiền tệ & Cơ chế thưởng
- **Quyết định:** Đơn vị tiền tệ trong toàn bộ ứng dụng là **"Sen Ngọc"** (biểu tượng viên ngọc hình hoa sen hồng), thay thế hoàn toàn cho danh xưng "xu". Cơ chế thưởng giữ nguyên:
  - Khởi đầu: `+100` Sen Ngọc.
  - Đọc xong 1 thẻ Bảo tàng: `+15` Sen Ngọc.
  - May hoàn thành áo ở Xưởng may: `+50` Sen Ngọc.
  - Nhận diện đúng sự khác biệt với sườn xám / hanbok: `+20` Sen Ngọc.
  - Hoàn thành phần Mở đầu (Prologue): `+50` Sen Ngọc.
  - Hoàn thành mỗi chương cốt truyện: `+100` Sen Ngọc.
- **Lý do:** Tăng hàm lượng văn hóa bản địa và hòa hợp cùng biểu tượng hoa sen chủ đạo của trò chơi.

### 4. Tỷ lệ hiển thị & Bố cục đa thiết bị (Responsive)
- **Quyết định:** Ưu tiên tỉ lệ màn hình **NGANG 16:9** (laptop, tablet xoay ngang). Trên điện thoại dọc (mobile portrait), áp dụng bố cục chuyên biệt: ảnh nền dọc riêng, thanh HUD ghim cố định cạnh trên, các thẻ hành động hiển thị dưới dạng bottom sheet vuốt mở, tuyệt đối không co giãn méo hình từ giao diện ngang.
- **Lý do:** Bảo toàn trọn vẹn mỹ thuật pixel art tinh xảo của bối cảnh sân nhà ngang mà vẫn giữ khả năng thao tác công thái học thuận tiện trên thiết bị di động.
*(bổ sung bởi mục 27, 28)*

### 5. Luồng gia nhập người dùng mới (Onboarding)
- **Quyết định:** Người dùng mới không phải bước qua màn hình onboarding tách rời; sảnh chính được mở ra ngay lập tức kèm thẻ nổi bật **"Bắt đầu câu chuyện của bạn"** với hai lựa chọn:
  - **"Tạo nhân vật từ ảnh"**: Tải ảnh selfie để pixel hóa diện mạo.
  - **"Dạo quanh sân nhà"**: Khám phá ngay với nhân vật mẫu mặc áo dài trắng truyền thống.
- **Lý do:** Giảm thiểu tối đa ma sát rào cản ban đầu, mời gọi người chơi tương tác ngay lập tức mà vẫn tạo lối vào cá nhân hóa tự nhiên.

### 6. Tách biệt hai hệ thống bảng màu (Color Palettes)
- **Quyết định:** Phân lập rõ 2 hệ thống màu:
  - **Bảng màu GIAO DIỆN (UI Theme):** Lấy theo thiết kế target gồm kem đào, hồng sen, mận chín, vàng đồng dùng cho khung viền, nền bảng, nút bấm và typography.
  - **Bảng màu TRUYỀN THỐNG (Heritage Palette):** Gồm củ nâu, chàm, điều, hoàng yến... chỉ dùng cho chất liệu, hoa văn và màu vải áo trong Phòng phối đồ.
- **Lý do:** Ngăn ngừa tình trạng xung đột nhận diện thị giác giữa các thành phần điều khiển hiện đại và tính chuẩn xác lịch sử của cổ phục.

### 7. Phong cách đồ họa & Nguyên tắc hiển thị chữ
- **Quyết định:** Toàn bộ hình ảnh môi trường, nhân vật tuân theo phong cách pixel art chi tiết, ấm áp như ảnh target. Toàn bộ chữ viết, nhãn biển, hội thoại phải render bằng **văn bản HTML/CSS thật**, tuyệt đối không nung chữ (bake text) chết vào tệp hình ảnh.
- **Lý do:** Giúp chữ hiển thị sắc nét ở mọi độ phân giải, hỗ trợ dịch thuật / đa ngôn ngữ, chuẩn SEO, hỗ trợ bộ đọc màn hình và dễ dàng tinh chỉnh nội dung.

### 8. Quy chuẩn lưu trữ tài nguyên hình ảnh (Assets Management)
- **Quyết định:** Tệp ảnh tĩnh cho game và UI sau khi sinh/tạo được lưu tại `public/assets/`. Toàn bộ mô tả thiết kế, thông số kỹ thuật và prompt tạo ảnh lưu tại `assets/`. Xóa bỏ hoàn toàn thư mục `assets/` ở gốc dự án.
- **Lý do:** Chuẩn hóa cấu trúc thư mục tài nguyên theo đúng chuẩn Vite bundler và phân định rõ ràng giữa tài nguyên phân phối web và tài liệu lưu trữ prompt kỹ thuật.

### 9. Quyền riêng tư & Cơ chế nhận diện diện mạo (Privacy & Avatar Mapping)
- **Quyết định:** Tuyệt đối không lưu trữ hay tái tạo ảnh khuôn mặt chân thực từ ảnh selfie của người dùng. Ảnh selfie chỉ được AI phân tích thuộc tính ngoại hình (kiểu tóc, màu tóc, kính mắt) để gán vào sprite nhân vật pixel tương ứng; không tự động đoán giới tính mà để người dùng tự chọn.
- **Lý do:** Bảo vệ nghiêm ngặt quyền riêng tư sinh trắc học và tôn trọng quyền tự quyết bản dạng của người dùng.

### 10. Nguyên tắc khai báo cấu hình Model AI
- **Quyết định:** Tên định danh kỹ thuật của model Gemini chỉ được phép khai báo tại **DUY NHẤT MỘT NƠI** trong mã nguồn (tệp cấu hình tập trung). Hệ thống tài liệu `docs/` chỉ mô tả vai trò chức năng (như "model đọc ảnh", "model sinh ảnh"), không rải rác tên model ở khắp nơi.
- **Lý do:** Triệt để áp dụng nguyên lý Single Source of Truth, tránh tình trạng tài liệu bị lỗi thời khi nâng cấp định danh model.

### 11. Chỉ định phiên bản Model AI
- **Quyết định:** Model sinh ảnh bắt buộc sử dụng **`gemini-3.1-flash-image`** (tuyệt đối không dùng `gemini-2.5-flash-image` do lịch trình ngừng hoạt động vào ngày 02/10/2026). Model đọc ảnh sử dụng **Gemini Flash mới nhất** với chế độ Structured Output (JSON Schema).
- **Lý do:** Đảm bảo độ bền vững dài hạn của hệ thống, phòng tránh lỗi sập dịch vụ do vòng đời ngừng hỗ trợ và đảm bảo đầu ra dữ liệu được kiểm soát cấu trúc chặt chẽ.

### 12. Mốc thời gian Áo Lemur
- **Quyết định:** Mẫu áo dài Lemur đầu tiên của họa sĩ Nguyễn Cát Tường được đăng trên báo *Phong Hóa* số 90, ngày 23/3/1934. Mọi tài liệu thống nhất dùng mốc này (thay vì "đầu thập niên 1930"). Mã thời kỳ trong hệ thống là `nam_1934`.
- **Lý do:** Chuẩn xác hóa theo văn bản báo chí và sử liệu thực tế đã kiểm chứng.

### 13. Trang phục tân thời sau Lemur (Bỏ nhận định Lê Phổ)
- **Quyết định:** Không gán công cải tiến cho họa sĩ Lê Phổ do thiếu căn cứ xác thực. Mẫu áo dài tân thời xuất hiện sau Lemur được định danh chính xác là: **"áo dài tân thời cổ đứng, không vai bồng (giai đoạn sau Lemur, cuối thập niên 1930)"**. Mã định danh trang phục trong hệ thống là `ao_dai_tan_thoi_vang_mo_ga`.
- **Lý do:** Đảm bảo tính trung thực học thuật và chuẩn mực nghiên cứu trang phục dân tộc.

### 14. Phân loại độ tin cậy hình phạt hương ước cổ truyền
- **Quyết định:** Các hình phạt có nguồn tư liệu hương ước gốc xác thực gồm: phạt vạ bằng tiền, bắt nộp lợn, bêu tên hoặc bêu người trước đình làng. Các hình phạt khắc nghiệt như "gọt đầu bôi vôi, thả bè chuối" chưa có trong hương ước gốc, hạ mức tin cậy xuống **"dân gian / chưa kiểm chứng"**. Trong kịch bản game, chi tiết này chỉ được xuất hiện dưới dạng lời đồn hoặc lời đe dọa mang nhãn **"theo truyền khẩu"**.
- **Lý do:** Tôn trọng văn bản cổ học pháp lý làng xã, không bi kịch hóa sai lệch tư liệu lịch sử.

### 15. Phả hệ gia đình (Phương án 4B: Quan hệ bà - cháu)
- **Quyết định:** Cụ Cầm (1865) và Cụ Loan (1915) có quan hệ **bà ngoại - cháu ngoại**. Sau khi thoát cảnh thủ tiết năm 1888, cụ Cầm tái giá và sinh hạ một người con gái (khoảng năm 1890). Người con gái này là thế hệ trung gian, không có chương game riêng, hiển thị trên cây gia phả một ô ghi *(chưa đặt tên)*. Cụ Loan là con gái của người này. Giữ nguyên tất cả các năm sinh: Cầm 1865, Loan 1915, Mai 1940, Phương 1964, An 2004. Cây gia phả gồm 5 thế hệ chính và 1 ô trung gian.
- **Lý do:** Đảm bảo sự hợp lý sinh học về tuổi sinh nở (cụ Cầm sinh con gái năm ~25 tuổi, con gái sinh cụ Loan năm ~25 tuổi), giữ toàn vẹn 5 chương game.

### 16. Mạch truyện không gian & Địa chỉ tiệm may (Phương án 5A)
- **Quyết định:** 
  - Tiệm may của An chốt **một địa chỉ duy nhất: số nhà cổ phố Hàng Đào, Hà Nội** (tên gọi: Tiệm May Nếp). Thay mọi chỗ ghi nhầm Hàng Gai hoặc Hàng Bông cho tiệm của An.
  - Gia đình bà Mai chuyển vào Nam sinh sống vào giữa thập niên 1950 (ghi trung tính như một biến cố gia đình bình thường). Bối cảnh Chương 3 vẫn giữ nguyên tại góc đường Đa Kao, Sài Gòn năm 1962.
  - Bố của cô Phương là người Nam Định. Sau năm 1975, gia đình về quê nội, cô Phương làm việc tại nhà máy Dệt Nam Định (Chương 4).
  - Khi về già, bà Mai trở ra Hà Nội, mở lại tiệm may trong chính căn nhà cũ của cụ Loan tại phố Hàng Đào và đặt tên là Tiệm May Nếp. Bà mất năm 2024 ở tuổi 84, An tiếp quản.
- **Lý do:** Xâu chuỗi liền mạch hành trình địa lý từ Bắc vào Nam rồi quay trở về cội nguồn Hà Nội, gắn kết chặt chẽ mọi thế hệ vào cùng một không gian di sản.

### 17. Quy chuẩn tạo ảnh Lookbook trong Studio
- **Quyết định:** Lookbook sinh 4 ảnh tương ứng với 4 góc nhìn: chính diện, nghiêng, sau lưng và cận chi tiết. Sử dụng người mẫu do AI tạo dựng, **tuyệt đối không dùng mặt người dùng**. Giao diện có thanh tiến độ thời gian thực. Ảnh nào hoàn thành trước thì hiển thị trước. Nếu quá thời gian chờ (45 giây) thì tự động chuyển sang thẻ pixel dự phòng.
- **Lý do:** Tối ưu hóa trải nghiệm thị giác đa chiều, đảm bảo tính công thái học và giữ an toàn quyền riêng tư cá nhân.

### 18. Kiểu chơi cốt truyện & tương tác thế giới
- **Quyết định:** Giữ nguyên toàn bộ chương hồi, nhân vật, vật phẩm, câu đố từ `docs/07-game` nhưng tương tác theo thiết kế UI với cơ chế đi lại trong khu vực bằng phím, bấm E để tương tác với NPC/vật, thu thập manh mối qua hội thoại vào sổ manh mối, câu đố nhiều bước có tính năng Hoàn tác/Làm lại và điều hướng qua bản đồ chương. *(Lịch sử: spec hitbox từ `docs/07-game` được thay bằng `src/content` JSON và `src/core/physics.ts` ngày 05/10/2026)*
- **Lý do:** Đảm bảo trải nghiệm nhập vai trực quan và nhất quán với thiết kế giao diện đồ họa mà vẫn bảo toàn trọn vẹn kịch bản văn hóa cùng chiều sâu câu đố đã định hình.

### 19. Cơ chế Lật vải (Fabric Flip) & cờ tính năng
- **Quyết định:** Cơ chế Lật vải được giữ trong core dưới cờ cấu hình `features.latVai` nhưng TẮT ở bản nộp 10/10 do UI chưa thiết kế, đồng thời hoãn sản xuất hình ảnh mặt trái sau 10/10 và chỉ cân nhắc bật lại cho vòng chung kết 03/11.
- **Lý do:** Tránh nghẽn tiến độ hoàn thiện giao diện cho mốc nộp bài 10/10 trong khi vẫn đảm bảo mã nguồn lõi sẵn sàng kích hoạt lại mà không cần chỉnh sửa logic kiến trúc.

### 20. Quy chuẩn tỷ lệ, kích thước khu vực & hệ tọa độ **(Đã thay thế bởi #32)** (Lịch sử)
- **Quyết định (lịch sử, 01/10/2026, đã thay thế bởi #32):** Mỗi khu vực chuẩn hóa theo tỷ lệ 8:5, lưới logic 800×500 (hiển thị nhân đôi integer-scaling thành artboard 1600×1000), trong đó core engine chỉ nhận và xử lý tọa độ chuẩn hóa 0–1 và quy đổi ra pixel logic để tính toán khoảng cách.
- **Lý do:** Đảm bảo tính toán logic độc lập tuyệt đối với độ phân giải màn hình hiển thị của UI mà vẫn giữ tỷ lệ pixel art sắc nét chuẩn mực.
- **Ghi chú:** Đã thay thế bằng đơn vị An tại quyết định #32 (05/10/2026).

### 21. Quy tắc khoảng cách tương tác (NPC & Vật thể)
- **Quyết định:** Tương tác phím E được kích hoạt khi khoảng cách logic từ người chơi tới NPC nằm trong bán kính mặc định 0.08 chiều rộng khu vực (tương đương 64 px logic), còn với vật thể thì dựa vào khung chữ nhật được nới rộng 0.02 mỗi phía (nếu vật không có khung sẽ áp dụng bán kính như NPC). Các tọa độ vật thể được xác định tại `src/content/` JSON và `src/game/physics.ts`.
- **Lý do:** Tạo vùng nhận lệnh tương tác tự nhiên, mượt mà cho người chơi khi di chuyển bằng phím mà không đòi hỏi độ chính xác tuyệt đối từng điểm ảnh.

### 22. Quy chuẩn kích thước tài nguyên hình ảnh (Assets Sizing) **(Đã thay thế bởi #32)** (Lịch sử)
- **Quyết định (lịch sử, 01/10/2026, đã thay thế bởi #32):** Chuẩn hóa kích thước sprite người chơi và NPC là 64×96 mỗi frame, chân dung (portrait) 128×128 (thẻ manh mối dùng bản thu nhỏ 64×64), thumbnail áo trong tủ đồ 96×96, biểu tượng vật phẩm và phụ kiện 48×48, còn biểu tượng UI 24×24 do team UI phụ trách.
- **Lý do:** Tạo sự đồng bộ tỷ lệ mỹ thuật pixel art xuyên suốt các màn hình và phân định ranh giới trách nhiệm rõ ràng giữa chuỗi asset game và team giao diện.
- **Ghi chú:** Đã thay thế bằng đơn vị An tại quyết định #32 (05/10/2026).

### 23. Cơ chế Lưu trữ tiến trình (Save Game)
- **Quyết định:** Hệ thống áp dụng 1 slot lưu cục bộ trong `localStorage` với khóa có định danh phiên bản `"tiem-may-nep-save-v1"`, tự động lưu sau mỗi lệnh ghi vào cây game (giới hạn tối đa 200 nút lịch sử), tính năng "Chơi lại từ đầu" do UI xác nhận, xuất/nhập JSON chỉ mở ở chế độ gỡ lỗi (debug) và nếu tệp lưu bị hỏng sẽ thông báo bắt đầu mới thay vì gây treo ứng dụng.
- **Lý do:** Bảo vệ an toàn dữ liệu chơi của người dùng, hạn chế tràn bộ nhớ trình duyệt và đảm bảo tính bền vững chịu lỗi của ứng dụng.

### 24. Hệ thống Sự kiện gửi UI (UI Events)
- **Quyết định:** Core engine phát các sự kiện một chiều tới UI gồm `clueCollected`, `itemPicked`, `puzzleSolved`, `puzzleFeedback`, `rewardGranted`, `outfitChanged`, `outfitSaved`, `areaEntered`, `stateRestored` (cùng `sideFlipped` khi bật tính năng Lật vải) với payload chỉ mang định danh (id).
- **Lý do:** Duy trì khớp nối lỏng (loose coupling) tối đa giữa tầng logic và tầng giao diện, ngăn rò rỉ cấu trúc trạng thái phức tạp ra ngoài UI.

### 25. Ranh giới trách nhiệm UI và Core Engine
- **Quyết định:** UI chịu trách nhiệm quản lý vị trí tức thời của người chơi, camera, bắt phím, chuyển tab, cửa sổ modal và hoạt cảnh (animation); còn Core Engine giữ toàn bộ tiến trình cốt truyện, sổ manh mối, túi đồ, số dư Sen Ngọc, tủ đồ cá nhân và cây lịch sử trạng thái (cây lịch sử ẩn với người chơi và chỉ mở khi debug).
- **Lý do:** Đảm bảo kiến trúc phân lớp trong sạch, cho phép logic game chạy độc lập, kiểm thử tự động toàn diện mà không phụ thuộc vào chu kỳ render của giao diện.

### 26. Quy chuẩn phân định cấu trúc thư mục Asset
- **Quyết định:** Tệp hình ảnh xuất ra của game được lưu tại `assets/game/<loai>/`, danh mục máy đọc lưu tại `data/asset-manifest.json`, còn toàn bộ tài liệu trong `assets/` đóng vai trò lưu trữ đặc tả thông số kỹ thuật và prompt tạo sinh.
- **Lý do:** Tách bạch rành mạch giữa dữ liệu cấu hình máy đọc, tệp tài nguyên thực thi và tài liệu đặc tả thiết kế prompt.

### 27. Bố cục chính khung ngang và bố cục phụ khung dọc (L1 - 01/10/2026)
- **Quyết định (01/10/2026):** Khung ngang là bố cục chính, khung dọc là bố cục phụ; mọi màn hình đều có cả hai bố cục.
- **Lý do:** Tối ưu hóa trải nghiệm thị giác điện ảnh và độ chi tiết của không gian pixel art theo tỷ lệ màn ảnh rộng mà vẫn bảo đảm tính linh hoạt công thái học trên thiết bị di động.

### 28. Quy chuẩn nền màn hình ngang 8:5 và tạo sinh qua Gemini **(Đã thay thế bởi #32)** (L2 - 01/10/2026) (Lịch sử)
- **Quyết định (lịch sử, 01/10/2026, đã thay thế bởi #32):** Nền màn hình ngang chuẩn hóa theo tỷ lệ 8:5, lưới logic 800×500, hiển thị nhân đôi integer-scaling thành 1600×1000 (cùng lưới với khu vực game), tạo sinh bằng model AI theo tỷ lệ 16:9 rồi cắt biên hai bên về 8:5.
- **Lý do:** Đồng bộ hóa hoàn hảo tỷ lệ hiển thị giữa các màn hình giao diện với không gian khu vực cốt truyện và khắc phục giới hạn Gemini không có tỷ lệ 8:5 trực tiếp.
- **Ghi chú:** Đã thay thế bằng đơn vị An tại quyết định #32 (05/10/2026).

### 29. Quy cách đặt tên tệp nền ngang và nền dọc (L3 - 01/10/2026)
- **Quyết định (01/10/2026):** Nền màn hình dọc giữ nguyên số hiện có; đổi tên file thành `<ten>--portrait.png`, còn bản ngang là `<ten>--landscape.png`.
- **Lý do:** Chuẩn hóa quy cách gọi tên tệp rõ ràng, tách bạch hai biến thể bố cục cho cùng một màn hình mà không làm xáo trộn các thông số màn hình dọc đã thiết lập.

### 30. Kỹ thuật 9-slice cho khung và 3-slice cho thanh (L4 - 01/10/2026)
- **Quyết định (01/10/2026):** Khung modal, khung thẻ áp dụng kỹ thuật 9-slice; thanh HUD, thanh màu, dải chọn sự kiện áp dụng kỹ thuật 3-slice với duy nhất một file dùng cho cả hai hướng, ghi rõ kích thước góc/cạnh và không vẽ hai bản tách rời.
- **Lý do:** Tiết kiệm tài nguyên đồ họa và bảo đảm khung viền co giãn mượt mà theo mọi tỷ lệ màn hình mà không bị méo chi tiết góc viền.

### 31. Đặc tả hai bố cục trong README màn hình (L5 - 01/10/2026)
- **Quyết định (01/10/2026):** README mỗi màn hình bắt buộc có hai đoạn "Bố cục ngang" và "Bố cục dọc" tả bằng lời vị trí các vùng (nền, nhân vật, bảng, HUD, nút chính).
- **Lý do:** Cung cấp đặc tả giao diện trực quan, rành mạch để đội ngũ phát triển UI hiện thực hóa chính xác cả hai chế độ hiển thị mà không phụ thuộc vào diễn giải cảm tính.

### 20–22. Bỏ: Spec cũ 64×96 và 800×500
- **Thay thế bởi Quyết định #32**

### 32. Đơn vị An thay thế spec cũ 64×96 (05/10/2026)
- **Quyết định (05/10/2026):** Toàn bộ spec lấy nhân vật An làm đơn vị chuẩn thay cho lưới pixel cũ. An khung 176×416, điểm chân (88,400), dáng cao 380–392 px, tỷ lệ chibi. NPC, áo, phụ kiện cùng spec An. Helper `characterScale(scene, bgH, footY?)` quyết định kích thước mọi nhân vật trên mọi cảnh. Nền và screen giữ ảnh gen gốc, không resize bắt buộc. Icon/9-slice/ui-pixel là pixel art, phóng theo bội số nguyên.
- **Hệ quả:** Xóa 90 asset nhân vật 64×96 và 5 overlay hỏng; gen lại ~79 ảnh nhân vật/áo/phụ kiện theo spec An; screens dùng bản raw hi-res, backgrounds giữ nguyên; code có fallback (icon/bản cũ) khi asset mới chưa về.
- **Lý do:** Nhân vật chính và UI lệch tỉ lệ 4,3 lần và lệch mật độ pixel nên không ăn khớp. Spec An neo được cả asset gen sau lẫn code hiển thị, gom các hằng số scale rải rác về một chỗ, tạo nền tảng chuẩn cho toàn hệ thống.

