# Giao Diện Bàn May Studio (assets/screens/studio)

Thư mục này chứa nền phòng phối đồ hiện tại, catalog áo, khung gương, khay chọn đồ và khung Lookbook AI.

Màn hình áp dụng hai bố cục: **bố cục ngang là bố cục chính** dành cho màn hình máy tính, và **bố cục dọc là bố cục phụ** dành cho thiết bị di động.

## Bố cục hiện tại theo `phongphoido.png`

- An và gương trực tiếp nằm phía trên khay, Lookbook bốn ảnh bên phải. Chiều cao nền giới hạn ở vùng phía trên khay; nhân vật dùng phần chiều cao còn trống dưới thanh điều hướng.
- Khay gỗ sát đáy có sáu ô giấy kem với áo treo lớn, tab Áo dài / Quần / Phụ kiện / Giày, bốn góc vàng cho lựa chọn và bảng màu 3×2 bên phải.
- Bộ áo mới nằm tại `assets/garments/<id>/`: lớp mặc, góc phải, bản treo và icon cùng thiết kế. Khay đọc trực tiếp từng `--hanging.png`, dùng cùng phép đổi màu với áo An đang mặc; không còn atlas cũ.
- `mirror-frame.png`: khung gương gỗ riêng, lòng trong suốt; renderer vẽ phản chiếu từ bộ phối đang dùng, tự cập nhật khi thay đồ, đổi màu, xoay hướng hoặc hoàn tác.
- Tab Quần đổi màu lớp quần riêng; khi chọn tứ thân, tab đổi thành Váy và điều khiển lớp váy riêng. Màu được lưu cùng bộ phối. Bản điện thoại cuộn ngang khay; điện thoại ngang dùng Lookbook bốn ô trên một hàng.
- Hai asset mới tạo bằng ImageGen tích hợp; prompt đầy đủ và ảnh tham chiếu ghi trong `../../references/studio/catalog-generation.json`. Chi tiết triển khai ở `wardrobe-frame.md` và `vietnamese-room.md`.

## Asset đang dùng

- `vietnamese-room--panorama.png`: nền phòng hiện tại.
- `mirror-frame.png`: khung gương phản chiếu nhân vật.
- `assets/garments/<id>/<id>--hanging.png`: bản áo treo trong khay, dùng chung với Tủ đồ.
- `wardrobe-frame--landscape.png`: khung khay trang phục.
- `lookbook-frame.png`: bảng ảnh Lookbook AI.

`asset-manifest.json` ghi kích thước và SHA-256 của các ảnh này. Mẫu thiết kế và prompt nằm ở [`../../references/studio/`](../../references/studio/). Các nền, thanh chọn và khung slice của giao diện cũ đã được dọn vì không còn được dùng.
