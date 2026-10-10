# Ảnh tham chiếu và ảnh nguồn

Thư mục này chứa ảnh phục vụ thiết kế hoặc tạo asset. Runtime, công cụ audit và gói triển khai đều bỏ qua thư mục này.

- `studio/phongphoido.png`: mẫu bố cục phòng phối đồ, nguồn tham chiếu của catalog áo và khung gương.
- `studio/khung.png`: mẫu khay chọn trang phục.
- `studio/vietnamese-room--landscape.png`: ảnh nguồn tham chiếu để tạo nền panorama hiện tại.
- Mẫu Lookbook trùng hoàn toàn với `assets/screens/studio/lookbook-frame.png`, nên chỉ giữ bản runtime.
- `branding/viet-phuc-ui-sheet.png`: sheet thương hiệu gốc; `scripts/import-branding.py` tách logo và biểu tượng từ đây.
- `main-shop/`: ảnh nguồn của khung thẻ, thanh HUD và prompt tạo chúng.
- `studio/`, `museum/`, `wardrobe/`: prompt tạo bộ hình hiện tại; `museum/citation-seal-v1.png` là ảnh nguồn con dấu trích dẫn.

Ảnh đã tích hợp vào game nằm trong `assets/screens/`, `assets/branding/` và các thư mục gameplay tương ứng. Giữ ảnh tham chiếu nguyên vẹn; không sao chép chúng vào thư mục runtime.
