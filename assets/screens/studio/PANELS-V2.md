# Khung UI Phòng phối đồ v2

Hai asset raster mới đồng bộ với gỗ gụ, hoa sen, giấy kem và viền vàng của dự án:

- `catalog-cabinet--9slice-v2.png`: nền tủ gỗ cho khay chọn trang phục.
- `styling-tray--9slice-v2.png`: khung giấy kem cho bảng thao tác và các ô trang phục.

Ảnh gốc 1254 × 1254 được giữ nguyên. CSS dùng `border-image` với slice 210 px ở bốn phía, có `fill`, để giữ các góc hoa sen vuông khi khung thay đổi kích thước. Tên áo, các tab, trạng thái chọn, ổ khóa và nút thao tác do React hiển thị; không có chữ hoặc nút vẽ sẵn trong PNG.

Nguồn: imagegen built-in. Metadata và SHA-256 nằm trong `asset-manifest.json`, `data/runtime-assets.json` và `assets/references/studio/studio-panels-v2-generation.json`.

Phòng phối đồ dùng nền toàn cảnh sẵn có `vietnamese-room--panorama.png`. Nhân vật được đặt trên mặt sàn, tách khỏi bảng thao tác, không thay đổi tỷ lệ cơ thể. Khay trang phục hiển thị 6, 4 hoặc 2 ô mỗi trang theo chiều rộng; dùng ảnh áo treo sẵn có thay vì cắt áo từ sprite nhân vật.
