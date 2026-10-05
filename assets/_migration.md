# Bảng Đối Chiếu Di Chuyển Tài Nguyên (assets/_migration.md)

Tài liệu này ghi nhận nhật ký chuyển đổi và hợp nhất cấu trúc kho tài nguyên từ `docs/08-assets/` và các thư mục cũ sang cây thư mục chuẩn hóa tại `assets/` theo quy định tại Task A2.

## Nhật Ký Cập Nhật Đặc Biệt

### 05/10/2026: Chuyển sang đơn vị An

- **Spec cũ:** Nhân vật 64×96 px, nền 800×500 px (không khớp tỉ lệ)
- **Spec mới:** Nhân vật An 176×416 px (chibi pixel-art), humanHeight tỷ lệ động theo cảnh
- **Xóa:** 90 asset nhân vật 64×96, 5 overlay hỏng, paperdoll base layers
- **Khôi phục:** 9 screens bản gen gốc (không downscale)
- **Tài liệu:** Viết lại `assets/README.md` (13 lớp An, gradient-map 4 màu, danh sách gen lại)
- **Hiệu lực:** Áp dụng từ phase 01 trở đi

## 1. Danh Sách Tệp Đã Di Chuyển

| Đường Dẫn Cũ | Đường Dẫn Mới | Phân Loại & Ghi Chú |
| :--- | :--- | :--- |
| `docs/08-assets/characters/an/README.md` | `assets/characters/an/README.md` | Nhân vật |
| `docs/08-assets/characters/ba-lon/README.md` | `assets/characters/ba-lon/README.md` | Nhân vật |
| `docs/08-assets/characters/ba-mai/README.md` | `assets/characters/ba-mai/README.md` | Nhân vật |
| `docs/08-assets/characters/ca-nghi/README.md` | `assets/characters/ca-nghi/README.md` | Nhân vật |
| `docs/08-assets/characters/cat-nep/README.md` | `assets/characters/cat-nep/README.md` | Nhân vật |
| `docs/08-assets/characters/chu-suu/README.md` | `assets/characters/chu-suu/README.md` | Nhân vật |
| `docs/08-assets/characters/cu-cam/README.md` | `assets/characters/cu-cam/README.md` | Nhân vật |
| `docs/08-assets/characters/cu-loan/README.md` | `assets/characters/cu-loan/README.md` | Nhân vật |
| `docs/08-assets/characters/grandmother/README.md` | `assets/characters/grandmother/README.md` | Nhân vật |
| `docs/08-assets/characters/hoang-lam/README.md` | `assets/characters/hoang-lam/README.md` | Nhân vật |
| `docs/08-assets/characters/me-phuong/README.md` | `assets/characters/me-phuong/README.md` | Nhân vật |
| `docs/08-assets/characters/ong-le/README.md` | `assets/characters/ong-le/README.md` | Nhân vật |
| `docs/08-assets/characters/protagonist/README.md` | `assets/characters/protagonist/README.md` | Nhân vật |
| `docs/08-assets/characters/thay-ba-can/README.md` | `assets/characters/thay-ba-can/README.md` | Nhân vật |
| `docs/08-assets/characters/truong-toc-bui/README.md` | `assets/characters/truong-toc-bui/README.md` | Nhân vật |
| `docs/08-assets/characters/vinh/README.md` | `assets/characters/vinh/README.md` | Nhân vật |
| `docs/08-assets/studio/ao-dai-co-thuyen/README.md` | `assets/garments/ao-dai-co-thuyen/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-dai-cuoi-phin/README.md` | `assets/garments/ao-dai-cuoi-phin/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-dai-lemur/README.md` | `assets/garments/ao-dai-lemur/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-dai-popolin/README.md` | `assets/garments/ao-dai-popolin/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-dai-raglan/README.md` | `assets/garments/ao-dai-raglan/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-dai-tan-thoi-vang-mo-ga/README.md` | `assets/garments/ao-dai-tan-thoi-vang-mo-ga/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-ngu-than-remix-2026/README.md` | `assets/garments/ao-ngu-than-remix-2026/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-ngu-than-tay-chen/README.md` | `assets/garments/ao-ngu-than-tay-chen/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-ngu-than-tay-thung/README.md` | `assets/garments/ao-ngu-than-tay-thung/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/ao-tu-than/README.md` | `assets/garments/ao-tu-than/README.md` | Áo dài (studio -> garments) |
| `docs/08-assets/studio/guoc-moc/README.md` | `assets/accessories/guoc-moc/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/hai-theu/README.md` | `assets/accessories/hai-theu/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/khan-mo-qua/README.md` | `assets/accessories/khan-mo-qua/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/khan-van-den/README.md` | `assets/accessories/khan-van-den/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/khan-van-hoang-yen/README.md` | `assets/accessories/khan-van-hoang-yen/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/kieng-bac/README.md` | `assets/accessories/kieng-bac/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/kinh-mat-meo/README.md` | `assets/accessories/kinh-mat-meo/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/non-la/README.md` | `assets/accessories/non-la/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/non-quai-thao/README.md` | `assets/accessories/non-quai-thao/README.md` | Phụ kiện (studio -> accessories) |
| `docs/08-assets/studio/quat-lua/README.md` | `assets/accessories/quat-lua/README.md` | Phụ kiện (studio -> accessories) |
| `assets/items/patterns/README.md` | `assets/motifs/README.md` | Hoạ tiết danh mục |
| `assets/characters/protagonist/README.md` | `assets/paperdoll/README.md` | Paperdoll khung cơ thể (protagonist -> paperdoll) |
| `docs/08-assets/game-items/ban-giao-keo-ep-hon/README.md` | `assets/items/ban-giao-keo-ep-hon/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/bien-lai-tra-no-goc-1935/README.md` | `assets/items/bien-lai-tra-no-goc-1935/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/bua-chu-tru-yeu/README.md` | `assets/items/bua-chu-tru-yeu/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/buc-thu-tay-chong-cu-cam/README.md` | `assets/items/buc-thu-tay-chong-cu-cam/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/cac-trang-gia-pha-goc-bi-xe/README.md` | `assets/items/cac-trang-gia-pha-goc-bi-xe/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/chia-khoa-dong-cu/README.md` | `assets/items/chia-khoa-dong-cu/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/chia-khoa-ket-sat-bang-thau/README.md` | `assets/items/chia-khoa-ket-sat-bang-thau/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/con-thoi-go-mun/README.md` | `assets/items/con-thoi-go-mun/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/cuon-chi-to-dao/README.md` | `assets/items/cuon-chi-to-dao/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/cuon-nhat-ky-tiem-may/README.md` | `assets/items/cuon-nhat-ky-tiem-may/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/ho-so-giam-dinh-y-phuc-2026/README.md` | `assets/items/ho-so-giam-dinh-y-phuc-2026/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/kim-theu-thep/README.md` | `assets/items/kim-theu-thep/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/manh-ban-ve-ao-dai/README.md` | `assets/items/manh-ban-ve-ao-dai/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/so-tu-vi-nguyen-ban-1962/README.md` | `assets/items/so-tu-vi-nguyen-ban-1962/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/that-lung-lua-cham/README.md` | `assets/items/that-lung-lua-cham/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/thu-tay-thoa-thuan-boi-toan/README.md` | `assets/items/thu-tay-thoa-thuan-boi-toan/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/thuoc-go-tho-may-1888/README.md` | `assets/items/thuoc-go-tho-may-1888/README.md` | Vật phẩm game |
| `docs/08-assets/game-items/to-van-tu-cam-co-dat/README.md` | `assets/items/to-van-tu-cam-co-dat/README.md` | Vật phẩm game |
| `docs/08-assets/chapter-1/README.md` | `assets/areas/chapter-1/README.md` | Khu vực chapter-1 danh mục |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/README.md` | `assets/areas/chapter-1/c1-s1-buong-det-khoa-kin/README.md` | Khu vực chapter-1/c1-s1-buong-det-khoa-kin |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/bg-mat-phai` | `assets/areas/chapter-1/c1-s1-buong-det-khoa-kin/bg-mat-phai` | Khu vực chapter-1/c1-s1-buong-det-khoa-kin |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/bg-mat-trai` | `assets/areas/chapter-1/c1-s1-buong-det-khoa-kin/bg-mat-trai` | Khu vực chapter-1/c1-s1-buong-det-khoa-kin |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/hitbox-back-window` | `assets/areas/chapter-1/c1-s1-buong-det-khoa-kin/hitbox-back-window` | Khu vực chapter-1/c1-s1-buong-det-khoa-kin |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/hitbox-cold-porridge` | `assets/areas/chapter-1/c1-s1-buong-det-khoa-kin/hitbox-cold-porridge` | Khu vực chapter-1/c1-s1-buong-det-khoa-kin |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/hitbox-front-door` | `assets/areas/chapter-1/c1-s1-buong-det-khoa-kin/hitbox-front-door` | Khu vực chapter-1/c1-s1-buong-det-khoa-kin |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/README.md` | `assets/areas/chapter-1/c1-s2-ban-tho-nha-tho-ho/README.md` | Khu vực chapter-1/c1-s2-ban-tho-nha-tho-ho |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/bg-mat-phai` | `assets/areas/chapter-1/c1-s2-ban-tho-nha-tho-ho/bg-mat-phai` | Khu vực chapter-1/c1-s2-ban-tho-nha-tho-ho |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/bg-mat-trai` | `assets/areas/chapter-1/c1-s2-ban-tho-nha-tho-ho/bg-mat-trai` | Khu vực chapter-1/c1-s2-ban-tho-nha-tho-ho |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/hitbox-honor-plaque` | `assets/areas/chapter-1/c1-s2-ban-tho-nha-tho-ho/hitbox-honor-plaque` | Khu vực chapter-1/c1-s2-ban-tho-nha-tho-ho |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/hitbox-incense-burner` | `assets/areas/chapter-1/c1-s2-ban-tho-nha-tho-ho/hitbox-incense-burner` | Khu vực chapter-1/c1-s2-ban-tho-nha-tho-ho |
| `docs/08-assets/chapter-1/c1-s3-cong-dinh-doi-dau/README.md` | `assets/areas/chapter-1/c1-s3-cong-dinh-doi-dau/README.md` | Khu vực chapter-1/c1-s3-cong-dinh-doi-dau |
| `docs/08-assets/chapter-1/c1-s3-cong-dinh-doi-dau/bg-mat-phai` | `assets/areas/chapter-1/c1-s3-cong-dinh-doi-dau/bg-mat-phai` | Khu vực chapter-1/c1-s3-cong-dinh-doi-dau |
| `docs/08-assets/chapter-1/c1-s3-cong-dinh-doi-dau/bg-mat-trai` | `assets/areas/chapter-1/c1-s3-cong-dinh-doi-dau/bg-mat-trai` | Khu vực chapter-1/c1-s3-cong-dinh-doi-dau |
| `docs/08-assets/chapter-1/c1-s3-cong-dinh-doi-dau/hitbox-stone-step` | `assets/areas/chapter-1/c1-s3-cong-dinh-doi-dau/hitbox-stone-step` | Khu vực chapter-1/c1-s3-cong-dinh-doi-dau |
| `docs/08-assets/chapter-1/c1-s3-cong-dinh-doi-dau/hitbox-village-gate-exit` | `assets/areas/chapter-1/c1-s3-cong-dinh-doi-dau/hitbox-village-gate-exit` | Khu vực chapter-1/c1-s3-cong-dinh-doi-dau |
| `docs/08-assets/chapter-2/README.md` | `assets/areas/chapter-2/README.md` | Khu vực chapter-2 danh mục |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/README.md` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/README.md` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/bg-mat-phai` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/bg-mat-phai` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/bg-mat-trai` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/bg-mat-trai` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/hitbox-drawing-desk` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/hitbox-drawing-desk` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/hitbox-french-window` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/hitbox-french-window` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-1` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-1` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-2` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-2` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-3` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-3` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-4` | `assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/manh-ve-ao-dai-4` | Khu vực chapter-2/c2-s1-gac-lung-ve-tranh |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/README.md` | `assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/README.md` | Khu vực chapter-2/c2-s2-kho-vai-hang-dao |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/bg-mat-phai` | `assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/bg-mat-phai` | Khu vực chapter-2/c2-s2-kho-vai-hang-dao |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/bg-mat-trai` | `assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/bg-mat-trai` | Khu vực chapter-2/c2-s2-kho-vai-hang-dao |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/hitbox-grandfather-clock` | `assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/hitbox-grandfather-clock` | Khu vực chapter-2/c2-s2-kho-vai-hang-dao |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/hitbox-iron-safe` | `assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/hitbox-iron-safe` | Khu vực chapter-2/c2-s2-kho-vai-hang-dao |
| `docs/08-assets/chapter-2/c2-s3-phong-trien-lam-doi-dau/README.md` | `assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/README.md` | Khu vực chapter-2/c2-s3-phong-trien-lam-doi-dau |
| `docs/08-assets/chapter-2/c2-s3-phong-trien-lam-doi-dau/bg-mat-phai` | `assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/bg-mat-phai` | Khu vực chapter-2/c2-s3-phong-trien-lam-doi-dau |
| `docs/08-assets/chapter-2/c2-s3-phong-trien-lam-doi-dau/hitbox-exhibition-podium` | `assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/hitbox-exhibition-podium` | Khu vực chapter-2/c2-s3-phong-trien-lam-doi-dau |
| `docs/08-assets/chapter-2/c2-s3-phong-trien-lam-doi-dau/hitbox-reporters-crowd` | `assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/hitbox-reporters-crowd` | Khu vực chapter-2/c2-s3-phong-trien-lam-doi-dau |
| `docs/08-assets/chapter-3/README.md` | `assets/areas/chapter-3/README.md` | Khu vực chapter-3 danh mục |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/README.md` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/README.md` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/bg-mat-phai` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/bg-mat-phai` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/bg-mat-trai` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/bg-mat-trai` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/hitbox-bonsai-pot` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/hitbox-bonsai-pot` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/hitbox-fabric-attic` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/hitbox-fabric-attic` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/hitbox-gramophone` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/hitbox-gramophone` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s1-tiem-may-da-kao/hitbox-sewing-machine-base` | `assets/areas/chapter-3/c3-s1-tiem-may-da-kao/hitbox-sewing-machine-base` | Khu vực chapter-3/c3-s1-tiem-may-da-kao |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/README.md` | `assets/areas/chapter-3/c3-s2-phong-phong-thuy/README.md` | Khu vực chapter-3/c3-s2-phong-phong-thuy |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/bg-mat-phai` | `assets/areas/chapter-3/c3-s2-phong-phong-thuy/bg-mat-phai` | Khu vực chapter-3/c3-s2-phong-phong-thuy |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/bg-mat-trai` | `assets/areas/chapter-3/c3-s2-phong-phong-thuy/bg-mat-trai` | Khu vực chapter-3/c3-s2-phong-phong-thuy |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/hitbox-bagua-chest` | `assets/areas/chapter-3/c3-s2-phong-phong-thuy/hitbox-bagua-chest` | Khu vực chapter-3/c3-s2-phong-phong-thuy |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/hitbox-bagua-mirror` | `assets/areas/chapter-3/c3-s2-phong-phong-thuy/hitbox-bagua-mirror` | Khu vực chapter-3/c3-s2-phong-phong-thuy |
| `docs/08-assets/chapter-3/c3-s3-dinh-thu-doi-dau/README.md` | `assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/README.md` | Khu vực chapter-3/c3-s3-dinh-thu-doi-dau |
| `docs/08-assets/chapter-3/c3-s3-dinh-thu-doi-dau/bg-mat-phai` | `assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/bg-mat-phai` | Khu vực chapter-3/c3-s3-dinh-thu-doi-dau |
| `docs/08-assets/chapter-3/c3-s3-dinh-thu-doi-dau/hitbox-salon-table` | `assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/hitbox-salon-table` | Khu vực chapter-3/c3-s3-dinh-thu-doi-dau |
| `docs/08-assets/chapter-3/c3-s3-dinh-thu-doi-dau/hitbox-vinh-support` | `assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/hitbox-vinh-support` | Khu vực chapter-3/c3-s3-dinh-thu-doi-dau |
| `docs/08-assets/chapter-4/README.md` | `assets/areas/chapter-4/README.md` | Khu vực chapter-4 danh mục |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/README.md` | `assets/areas/chapter-4/c4-s1-can-ho-tap-the/README.md` | Khu vực chapter-4/c4-s1-can-ho-tap-the |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/bg-mat-phai` | `assets/areas/chapter-4/c4-s1-can-ho-tap-the/bg-mat-phai` | Khu vực chapter-4/c4-s1-can-ho-tap-the |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/bg-mat-trai` | `assets/areas/chapter-4/c4-s1-can-ho-tap-the/bg-mat-trai` | Khu vực chapter-4/c4-s1-can-ho-tap-the |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/hitbox-cassette-player` | `assets/areas/chapter-4/c4-s1-can-ho-tap-the/hitbox-cassette-player` | Khu vực chapter-4/c4-s1-can-ho-tap-the |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/hitbox-phin-fabric` | `assets/areas/chapter-4/c4-s1-can-ho-tap-the/hitbox-phin-fabric` | Khu vực chapter-4/c4-s1-can-ho-tap-the |
| `docs/08-assets/chapter-4/c4-s2-tu-duong-ho-nguyen/README.md` | `assets/areas/chapter-4/c4-s2-tu-duong-ho-nguyen/README.md` | Khu vực chapter-4/c4-s2-tu-duong-ho-nguyen |
| `docs/08-assets/chapter-4/c4-s2-tu-duong-ho-nguyen/bg-mat-phai` | `assets/areas/chapter-4/c4-s2-tu-duong-ho-nguyen/bg-mat-phai` | Khu vực chapter-4/c4-s2-tu-duong-ho-nguyen |
| `docs/08-assets/chapter-4/c4-s2-tu-duong-ho-nguyen/bg-mat-trai` | `assets/areas/chapter-4/c4-s2-tu-duong-ho-nguyen/bg-mat-trai` | Khu vực chapter-4/c4-s2-tu-duong-ho-nguyen |
| `docs/08-assets/chapter-4/c4-s2-tu-duong-ho-nguyen/hitbox-pedestal-chest` | `assets/areas/chapter-4/c4-s2-tu-duong-ho-nguyen/hitbox-pedestal-chest` | Khu vực chapter-4/c4-s2-tu-duong-ho-nguyen |
| `docs/08-assets/chapter-4/c4-s2-tu-duong-ho-nguyen/hitbox-roof-beam` | `assets/areas/chapter-4/c4-s2-tu-duong-ho-nguyen/hitbox-roof-beam` | Khu vực chapter-4/c4-s2-tu-duong-ho-nguyen |
| `docs/08-assets/chapter-4/c4-s3-san-tu-duong-doi-dau/README.md` | `assets/areas/chapter-4/c4-s3-san-tu-duong-doi-dau/README.md` | Khu vực chapter-4/c4-s3-san-tu-duong-doi-dau |
| `docs/08-assets/chapter-4/c4-s3-san-tu-duong-doi-dau/bg-mat-phai` | `assets/areas/chapter-4/c4-s3-san-tu-duong-doi-dau/bg-mat-phai` | Khu vực chapter-4/c4-s3-san-tu-duong-doi-dau |
| `docs/08-assets/chapter-4/c4-s3-san-tu-duong-doi-dau/hitbox-ancestral-stone-step` | `assets/areas/chapter-4/c4-s3-san-tu-duong-doi-dau/hitbox-ancestral-stone-step` | Khu vực chapter-4/c4-s3-san-tu-duong-doi-dau |
| `docs/08-assets/chapter-4/c4-s3-san-tu-duong-doi-dau/hitbox-uncle-suu` | `assets/areas/chapter-4/c4-s3-san-tu-duong-doi-dau/hitbox-uncle-suu` | Khu vực chapter-4/c4-s3-san-tu-duong-doi-dau |
| `docs/08-assets/chapter-5/README.md` | `assets/areas/chapter-5/README.md` | Khu vực chapter-5 danh mục |
| `docs/08-assets/chapter-5/c5-s1-tiem-may-bao-mang/README.md` | `assets/areas/chapter-5/c5-s1-tiem-may-bao-mang/README.md` | Khu vực chapter-5/c5-s1-tiem-may-bao-mang |
| `docs/08-assets/chapter-5/c5-s1-tiem-may-bao-mang/bg-mat-phai` | `assets/areas/chapter-5/c5-s1-tiem-may-bao-mang/bg-mat-phai` | Khu vực chapter-5/c5-s1-tiem-may-bao-mang |
| `docs/08-assets/chapter-5/c5-s1-tiem-may-bao-mang/bg-mat-trai` | `assets/areas/chapter-5/c5-s1-tiem-may-bao-mang/bg-mat-trai` | Khu vực chapter-5/c5-s1-tiem-may-bao-mang |
| `docs/08-assets/chapter-5/c5-s1-tiem-may-bao-mang/hitbox-digital-workshop-scanner` | `assets/areas/chapter-5/c5-s1-tiem-may-bao-mang/hitbox-digital-workshop-scanner` | Khu vực chapter-5/c5-s1-tiem-may-bao-mang |
| `docs/08-assets/chapter-5/c5-s1-tiem-may-bao-mang/hitbox-livestream-screen` | `assets/areas/chapter-5/c5-s1-tiem-may-bao-mang/hitbox-livestream-screen` | Khu vực chapter-5/c5-s1-tiem-may-bao-mang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/README.md` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/README.md` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/bg-mat-phai` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/bg-mat-phai` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-an-center` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-an-center` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-east` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-east` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-matrix` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-matrix` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-north` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-north` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-south` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-south` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-west` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/hitbox-ancestor-west` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s2-tran-dia-chi-vang/vfx-golden-web-explosion` | `assets/areas/chapter-5/c5-s2-tran-dia-chi-vang/vfx-golden-web-explosion` | Khu vực chapter-5/c5-s2-tran-dia-chi-vang |
| `docs/08-assets/chapter-5/c5-s3-doi-chat-hoi-sinh/README.md` | `assets/areas/chapter-5/c5-s3-doi-chat-hoi-sinh/README.md` | Khu vực chapter-5/c5-s3-doi-chat-hoi-sinh |
| `docs/08-assets/chapter-5/c5-s3-doi-chat-hoi-sinh/bg-mat-phai` | `assets/areas/chapter-5/c5-s3-doi-chat-hoi-sinh/bg-mat-phai` | Khu vực chapter-5/c5-s3-doi-chat-hoi-sinh |
| `docs/08-assets/chapter-5/c5-s3-doi-chat-hoi-sinh/hitbox-catwalk-an` | `assets/areas/chapter-5/c5-s3-doi-chat-hoi-sinh/hitbox-catwalk-an` | Khu vực chapter-5/c5-s3-doi-chat-hoi-sinh |
| `docs/08-assets/chapter-5/c5-s3-doi-chat-hoi-sinh/hitbox-lam-confession` | `assets/areas/chapter-5/c5-s3-doi-chat-hoi-sinh/hitbox-lam-confession` | Khu vực chapter-5/c5-s3-doi-chat-hoi-sinh |
| `docs/08-assets/chapter-5/c5-s3-doi-chat-hoi-sinh/hitbox-led-screen` | `assets/areas/chapter-5/c5-s3-doi-chat-hoi-sinh/hitbox-led-screen` | Khu vực chapter-5/c5-s3-doi-chat-hoi-sinh |
| `docs/08-assets/chapter-5/c5-s3-doi-chat-hoi-sinh/vfx-silk-butterflies` | `assets/areas/chapter-5/c5-s3-doi-chat-hoi-sinh/vfx-silk-butterflies` | Khu vực chapter-5/c5-s3-doi-chat-hoi-sinh |
| `docs/08-assets/prologue/README.md` | `assets/areas/prologue/README.md` | Khu vực prologue danh mục |
| `docs/08-assets/prologue/c0-s1-tiem-may-chieu/README.md` | `assets/areas/prologue/c0-s1-tiem-may-chieu/README.md` | Khu vực prologue/c0-s1-tiem-may-chieu |
| `docs/08-assets/prologue/c0-s1-tiem-may-chieu/bg-mat-phai` | `assets/areas/prologue/c0-s1-tiem-may-chieu/bg-mat-phai` | Khu vực prologue/c0-s1-tiem-may-chieu |
| `docs/08-assets/prologue/c0-s2-gac-xep-chiec-ruong/README.md` | `assets/areas/prologue/c0-s2-gac-xep-chiec-ruong/README.md` | Khu vực prologue/c0-s2-gac-xep-chiec-ruong |
| `docs/08-assets/prologue/c0-s2-gac-xep-chiec-ruong/bg-mat-phai` | `assets/areas/prologue/c0-s2-gac-xep-chiec-ruong/bg-mat-phai` | Khu vực prologue/c0-s2-gac-xep-chiec-ruong |
| `docs/08-assets/prologue/c0-s2-gac-xep-chiec-ruong/bg-mat-trai` | `assets/areas/prologue/c0-s2-gac-xep-chiec-ruong/bg-mat-trai` | Khu vực prologue/c0-s2-gac-xep-chiec-ruong |
| `docs/08-assets/prologue/c0-s2-gac-xep-chiec-ruong/vfx-ong-le-shadow` | `assets/areas/prologue/c0-s2-gac-xep-chiec-ruong/vfx-ong-le-shadow` | Khu vực prologue/c0-s2-gac-xep-chiec-ruong |

## 2. Danh Sách Vật Phẩm Trùng Đã Hợp Nhất Vào `assets/items/`

| Đường Dẫn Tại Thư Mục Chương Cũ | Đường Dẫn Hợp Nhất Duy Nhất | Ghi Chú |
| :--- | :--- | :--- |
| `docs/08-assets/prologue/c0-s2-gac-xep-chiec-ruong/thuoc-go-tho-may-1888` | `assets/items/thuoc-go-tho-may-1888` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/con-thoi-go-mun` | `assets/items/con-thoi-go-mun` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-1/c1-s1-buong-det-khoa-kin/that-lung-lua-cham` | `assets/items/that-lung-lua-cham` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/buc-thu-tay-chong-cu-cam` | `assets/items/buc-thu-tay-chong-cu-cam` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-1/c1-s2-ban-tho-nha-tho-ho/to-van-tu-cam-co-dat` | `assets/items/to-van-tu-cam-co-dat` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/ban-giao-keo-ep-hon` | `assets/items/ban-giao-keo-ep-hon` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/bien-lai-tra-no-goc-1935` | `assets/items/bien-lai-tra-no-goc-1935` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-2/c2-s2-kho-vai-hang-dao/chia-khoa-ket-sat-bang-thau` | `assets/items/chia-khoa-ket-sat-bang-thau` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/so-tu-vi-nguyen-ban-1962` | `assets/items/so-tu-vi-nguyen-ban-1962` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-3/c3-s2-phong-phong-thuy/thu-tay-thoa-thuan-boi-toan` | `assets/items/thu-tay-thoa-thuan-boi-toan` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/cuon-chi-to-dao` | `assets/items/cuon-chi-to-dao` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-4/c4-s1-can-ho-tap-the/kim-theu-thep` | `assets/items/kim-theu-thep` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-4/c4-s2-tu-duong-ho-nguyen/cac-trang-gia-pha-goc-bi-xe` | `assets/items/cac-trang-gia-pha-goc-bi-xe` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |
| `docs/08-assets/chapter-5/c5-s1-tiem-may-bao-mang/ho-so-giam-dinh-y-phuc-2026` | `assets/items/ho-so-giam-dinh-y-phuc-2026` | Chỉ lưu trữ 1 bản tại items/, README khu vực trỏ liên kết tham chiếu |

## 3. Bảng Chuẩn Hóa Định Danh Vật Phẩm Sang Kebab-Case (Task R0)

Toàn bộ 29 thư mục vật phẩm tại `assets/items/` và mã định danh tương ứng đã được chuẩn hóa từ snake_case/chữ hoa sang kebab-case ASCII không dấu chữ thường theo quy tắc hệ thống. Bảng đối chiếu ID cũ → ID mới phục vụ bước A9 tái tạo asset manifest:

| STT | ID Cũ (snake_case) | ID Mới (kebab-case) | Thư Mục Cũ | Thư Mục Mới |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `ban_giao_keo_ep_hon` | `ban-giao-keo-ep-hon` | `assets/items/ban_giao_keo_ep_hon` | `assets/items/ban-giao-keo-ep-hon` |
| 2 | `ban_ve_ao_dai_tan_thoi` | `ban-ve-ao-dai-tan-thoi` | `assets/items/ban_ve_ao_dai_tan_thoi` | `assets/items/ban-ve-ao-dai-tan-thoi` |
| 3 | `bien_lai_tra_no_goc_1935` | `bien-lai-tra-no-goc-1935` | `assets/items/bien_lai_tra_no_goc_1935` | `assets/items/bien-lai-tra-no-goc-1935` |
| 4 | `bien_nhan_tien_thay_boi` | `bien-nhan-tien-thay-boi` | `assets/items/bien_nhan_tien_thay_boi` | `assets/items/bien-nhan-tien-thay-boi` |
| 5 | `bua_chu_tru_yeu_1` | `bua-chu-tru-yeu-1` | `assets/items/bua_chu_tru_yeu_1` | `assets/items/bua-chu-tru-yeu-1` |
| 6 | `bua_chu_tru_yeu_2` | `bua-chu-tru-yeu-2` | `assets/items/bua_chu_tru_yeu_2` | `assets/items/bua-chu-tru-yeu-2` |
| 7 | `buc_thu_tay_chong_cu_Cam` | `buc-thu-tay-chong-cu-cam` | `assets/items/buc_thu_tay_chong_cu_Cam` | `assets/items/buc-thu-tay-chong-cu-cam` |
| 8 | `cac_trang_gia_pha_goc_bi_xe` | `cac-trang-gia-pha-goc-bi-xe` | `assets/items/cac_trang_gia_pha_goc_bi_xe` | `assets/items/cac-trang-gia-pha-goc-bi-xe` |
| 9 | `chia_khoa_dong_ba_chau` | `chia-khoa-dong-ba-chau` | `assets/items/chia_khoa_dong_ba_chau` | `assets/items/chia-khoa-dong-ba-chau` |
| 10 | `chia_khoa_ket_sat_bang_thau` | `chia-khoa-ket-sat-bang-thau` | `assets/items/chia_khoa_ket_sat_bang_thau` | `assets/items/chia-khoa-ket-sat-bang-thau` |
| 11 | `chiec_ao_dai_cuoi_vai_phin` | `chiec-ao-dai-cuoi-vai-phin` | `assets/items/chiec_ao_dai_cuoi_vai_phin` | `assets/items/chiec-ao-dai-cuoi-vai-phin` |
| 12 | `con_thoi_go_mun` | `con-thoi-go-mun` | `assets/items/con_thoi_go_mun` | `assets/items/con-thoi-go-mun` |
| 13 | `cuon_chi_to_dao` | `cuon-chi-to-dao` | `assets/items/cuon_chi_to_dao` | `assets/items/cuon-chi-to-dao` |
| 14 | `dung_cu_moc_then_cua` | `dung-cu-moc-then-cua` | `assets/items/dung_cu_moc_then_cua` | `assets/items/dung-cu-moc-then-cua` |
| 15 | `ho_so_giam_dinh_y_phuc_2026` | `ho-so-giam-dinh-y-phuc-2026` | `assets/items/ho_so_giam_dinh_y_phuc_2026` | `assets/items/ho-so-giam-dinh-y-phuc-2026` |
| 16 | `keo_may_bang_dong` | `keo-may-bang-dong` | `assets/items/keo_may_bang_dong` | `assets/items/keo-may-bang-dong` |
| 17 | `kim_gut_bang_bac` | `kim-gut-bang-bac` | `assets/items/kim_gut_bang_bac` | `assets/items/kim-gut-bang-bac` |
| 18 | `kim_theu_thep` | `kim-theu-thep` | `assets/items/kim_theu_thep` | `assets/items/kim-theu-thep` |
| 19 | `manh_ban_ve_ao_dai_1` | `manh-ban-ve-ao-dai-1` | `assets/items/manh_ban_ve_ao_dai_1` | `assets/items/manh-ban-ve-ao-dai-1` |
| 20 | `manh_ban_ve_ao_dai_2` | `manh-ban-ve-ao-dai-2` | `assets/items/manh_ban_ve_ao_dai_2` | `assets/items/manh-ban-ve-ao-dai-2` |
| 21 | `manh_ban_ve_ao_dai_3` | `manh-ban-ve-ao-dai-3` | `assets/items/manh_ban_ve_ao_dai_3` | `assets/items/manh-ban-ve-ao-dai-3` |
| 22 | `manh_ban_ve_ao_dai_4` | `manh-ban-ve-ao-dai-4` | `assets/items/manh_ban_ve_ao_dai_4` | `assets/items/manh-ban-ve-ao-dai-4` |
| 23 | `nam_cham_loa_dai` | `nam-cham-loa-dai` | `assets/items/nam_cham_loa_dai` | `assets/items/nam-cham-loa-dai` |
| 24 | `phan_may_mau_xanh` | `phan-may-mau-xanh` | `assets/items/phan_may_mau_xanh` | `assets/items/phan-may-mau-xanh` |
| 25 | `so_tu_vi_nguyen_ban_1962` | `so-tu-vi-nguyen-ban-1962` | `assets/items/so_tu_vi_nguyen_ban_1962` | `assets/items/so-tu-vi-nguyen-ban-1962` |
| 26 | `that_lung_lua_cham` | `that-lung-lua-cham` | `assets/items/that_lung_lua_cham` | `assets/items/that-lung-lua-cham` |
| 27 | `thu_tay_thoa_thuan_boi_toan` | `thu-tay-thoa-thuan-boi-toan` | `assets/items/thu_tay_thoa_thuan_boi_toan` | `assets/items/thu-tay-thoa-thuan-boi-toan` |
| 28 | `thuoc_go_tho_may_1888` | `thuoc-go-tho-may-1888` | `assets/items/thuoc_go_tho_may_1888` | `assets/items/thuoc-go-tho-may-1888` |
| 29 | `to_van_tu_cam_co_dat` | `to-van-tu-cam-co-dat` | `assets/items/to_van_tu_cam_co_dat` | `assets/items/to-van-tu-cam-co-dat` |
