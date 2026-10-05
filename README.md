# Tiệm May Nếp

Game pixel về nếp áo và ký ức gia đình, dùng React/Vite, Express và lõi trò chơi có sẵn trong `src/core/`. Hình ảnh lấy từ asset của dự án; chơi game và chụp Lookbook không cần khóa API.

## Chạy game

Yêu cầu Node.js tương thích Vite 8 và npm.

```sh
npm install
npm run dev
```

Mở http://localhost:3000 để đến màn chờ **Áo dài Việt. Chất riêng bạn.**, rồi bấm **Vào game** hoặc **Tiếp tục chơi**. Nút **Tải ảnh của bạn** cho chọn và xem trước JPG/PNG/WEBP trên thiết bị; tính năng tạo nhân vật pixel từ ảnh chưa triển khai. Trong game, dùng **WASD/phím mũi tên** để đi cùng An, **E** khi đến gần đồ vật hoặc nhân vật. Trên điện thoại có nút giữ để di chuyển và nút tương tác.

Thanh kem chứa logo ở trên luôn được giữ khi vào game. Thanh khám phá phía dưới đã bỏ; sảnh và các phòng phủ hết phần màn hình còn lại dưới header, co giãn theo vùng chơi thay cho khung 8:5 cố định. Biển khu vực neo vào tọa độ world và cùng camera với nền, xoay theo thanh gỗ phía trên cửa, có khoảng đệm để không bị cắt. Sảnh dùng font pixel VT323 hỗ trợ tiếng Việt, phục vụ từ file trong dự án. Chọn biển khu vực để vào các phòng; điện thoại có menu khu vực trong vùng chơi. Các bảng thao tác cuộn bên trong vùng chơi; màn chờ trên điện thoại nhỏ có thể cuộn để mọi nút đều truy cập được.

- **Cốt truyện:** khám phá tiệm may, lên gác xép, tìm vật phẩm, giải ba câu đố và mở chiếc rương của bà; nhận 50 Sen Ngọc.
- **Phòng phối đồ:** chọn áo, sự kiện, màu, phụ kiện; hoàn tác/làm lại, so sánh và lưu bộ phối. Lookbook tải PNG chính diện từ các lớp đang hiển thị.
- **Tủ đồ:** xem bộ phối đã lưu, tiếp tục phối và mua phụ kiện bằng Sen Ngọc.
- **Bảo tàng:** tìm/đọc nội dung văn hóa có sẵn; thưởng mỗi thẻ một lần.
- **Cài đặt:** chọn tên, tóc và màu áo có sẵn; bắt đầu lại sau khi xác nhận.

### Giao diện

- Token màu, khoảng cách, viền và bóng theo `docs/06-design/design-system.md` nằm ở `src/ui/tokens.css`. Mặc định cho phần tử (`src/ui/base.css`) nằm trong `@layer base`, nên CSS của từng màn luôn thắng.
- Chỉ dùng hai font tự host, đã kiểm đủ 134 chữ cái tiếng Việt có dấu: **VT323** cho tiêu đề, HUD, nhãn; **Be Vietnam Pro** cho đoạn văn và hội thoại.
- Ảnh vẽ độ phân giải cao dùng class `art-hires` (thu nhỏ mượt). Sprite pixel thật (NPC 64×96, áo, icon, khung 9-slice) dùng `pixel-native` và chỉ phóng theo bội số nguyên.
- Hiệu ứng (`src/ui/motion.css`, `src/ui/motion.ts`) chỉ dùng `transform`/`opacity` với `steps()`, gồm: hội thoại gõ chữ kèm chân dung, modal bật lên, toast trượt, rung khi chọn sai, Sen Ngọc đếm số. Tất cả tắt khi hệ điều hành bật giảm chuyển động.
- Thiết bị cảm ứng (`pointer: coarse`), kể cả điện thoại xoay ngang, luôn có nút di chuyển và nút tương tác ≥ 44px.
- Asset còn thiếu: tạo miễn phí trên Google AI Studio, rồi hậu xử lý bằng `python scripts/process-ai-asset.py`. Xem `docs/06-design/ai-studio/gemini-ui-asset-prompts.md`. Cấu hình MCP tạo ảnh bằng Gemini (cần key có billing) để sẵn ở `.mcp.json.example`.

Tiến trình tự lưu trên thiết bị vào `localStorage` với khóa `tiem-may-nep-save-v1`, bằng bộ serialize/restore của core. Hội thoại và modal chặn di chuyển; nhập văn bản và mất focus cũng dừng input.

## Build và kiểm tra

```sh
npm run lint
npm run test:core
npm run test:browser
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Kiểm tra trình duyệt dùng Playwright với Google Chrome đã cài. `test:browser` tự khởi động server dev nếu chưa chạy. Để kiểm tra bản build, đặt `QA_BASE_URL=http://127.0.0.1:4173`, rồi chạy `npm run test:browser` và `npm run test:assets` trong terminal khác. Trên PowerShell:

```powershell
$env:QA_BASE_URL='http://127.0.0.1:4173'
npm run test:browser
npm run test:assets
```

`npm run audit:assets` cần Python và Pillow, quét ảnh gốc rồi cập nhật metadata trong `data/` và ảnh kiểm tra trong `artifacts/`. Không chỉnh sửa file trong `assets/`.

## Phạm vi và tài nguyên

Màn mở đầu chơi hoàn chỉnh; các chương sau hiện có nội dung nhưng chưa đủ tài nguyên và bản đồ va chạm để triển khai trọn vẹn. Chưa có file âm thanh và nền portrait của hai phòng mở đầu; trên điện thoại các phòng này giữ tỷ lệ 8:5. `features.latVai` tắt.

Xem [ghi chú triển khai, kiểm tra và asset còn thiếu](docs/05-tech/game-implementation.md), [registry ảnh thật](data/runtime-assets.json) và [các đường dẫn cũ/thiếu trong manifest](data/asset-gaps.json).
