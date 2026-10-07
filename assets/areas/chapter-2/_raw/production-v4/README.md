# C2 production-v4

Gói xuất hoàn thiện cho gameplay C2 tĩnh đã thống nhất; thay gói nháp review-v3. Nền A đã chốt; còn người dùng duyệt thẩm mỹ cuối. Mở [gallery.html](gallery.html), xem [manifest runtime](../../manifest.json) và [bàn giao team](../../../../../docs/07-game/08-c2-asset-handoff.md).

## Nguồn và cách xuất

Tạo hình mới dùng **built-in ImageGen**, không dùng API/CLI ngoài. Prompt từng lần ở prompts.md và prompt-*.md. Nguồn v3 cho nhân vật chính/bản vẽ vẫn giữ nguyên. Các sheet mới đã giữ trong thư mục này, không được import runtime.

Người dùng cho phép script căn canvas, crop/resize, alpha và tách ảnh. scripts/export-c2-assets.py xuất vào đúng folder runtime, dùng nearest-neighbor và key xám cho Lemur; bù khe alpha nhỏ sau lưng theo mask thân An bằng màu vải lân cận. Khăn và guốc giữ màu, khớp renderer hiện có. fitting-preview.png mô phỏng thứ tự lớp và gradient-map của StudioCharacter, không phải ảnh chụp gameplay.

Hướng nghiêng Lemur được gen lại từ chính layer An có tay buông, tránh kiểu khoanh tay khiến hở thân. Bốn mảnh bản vẽ cắt từ một ảnh duy nhất; kiểm thử so sánh tái ghép từng byte. Két chỉ lấy vùng két/door từ ảnh chỉnh sửa, không thay pixels phần còn lại của nền A.

## Giới hạn minh bạch

NPC là pose tĩnh và chân dung, không phải walk atlas. An dùng bộ đi bộ hiện có; mặt trái và âm thanh tùy chọn không nằm trong gói. Chưa có họa sĩ sửa tay từng pixel, thẩm định văn hóa độc lập hoặc playtest C2. Không đánh dấu “đã vào app” chỉ vì PNG có trong runtime registry.
