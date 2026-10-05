# QA — An-unit screens (phase 06)

Ngày 2026-10-05. Ảnh chụp lưu ở `artifacts/ui-an-unit/` (thư mục bị gitignore). Viewport: 1366×768, 1920×1080, 390×844, 844×390.

## Lỗi người dùng báo, đã sửa
| Lỗi | Nguyên nhân | Sửa | Ảnh |
|---|---|---|---|
| 2 lớp hiệu ứng (bụi nắng s1, ánh sáng rương s2) | `VFX_FILE` + `drawRoom` | Gỡ khỏi game; file ảnh vẫn giữ, README đánh dấu "Gỡ khỏi game" | `fix/*-s1-back.png`, `fix/*-s2.png` |
| Lên gác rồi xuống lại thì An đứng trên bàn | Điểm vào phòng = tâm mũi tên cầu thang, mà mũi tên nằm trên bàn; dải sàn hình chữ nhật không biết vị trí bàn | `OBSTACLES` theo từng phòng + `standClear`; mũi tên treo tường thì An đứng cạnh, mũi tên dưới sàn thì đứng ngay trên mép | `fix/desk-s1-back.png` |
| Phòng phối đồ / Tủ đồ lệch tỉ lệ người so với cảnh | `MannequinStage` kéo An cao hết vùng trống (tối đa 416), không xét độ sâu | Chiều cao theo `characterScale(room, …, độ sâu chân)`; tối đa 1,2× khung gốc | `fix/{desk,fhd}-{studio,closet}.png` |

## humanHeight cuối cùng (`src/game/character-scale.ts`)
| Cảnh | back → front | Dải sàn | Kiểm bằng |
|---|---|---|---|
| c0 | 0.38 → 0.50 | 0.60–0.95 | s1: 0.447 sau khi bấm gương; s2: 0.399 cạnh ma-nơ-canh |
| c1 | 0.42 | 0.60–0.95 | 0.420 (151/360) |
| hub | 0.15 | — | 14.96% world |
| studio | 0.34 → 0.48 | 0.47–0.73 | An ≈ 1,6 lần ghế tựa |
| closet / workshop | 0.31 → 0.55 | 0.71–1.00 | An ≈ 2,1 lần bàn trang điểm ở giữa sàn |

## Test
- `npm run lint`: sạch.
- `npm run test:core`: 15/15, cùng 2 dòng PASS của check-game.
- `npx playwright test`: 56/56 pass.
- Màn chụp: 0 lỗi console, 0 phản hồi 4xx.

## Còn tồn
- Màn ngang điện thoại (844×390), Phòng phối đồ: An chỉ cao khoảng 80 px vì bị kẹp giữa thanh trên và thanh tủ đồ. Bố cục này có từ trước.
- Mũi tên cầu thang vẫn là nút DOM, vẽ đè lên canvas khi An đi ngang qua.
- NPC 4 hướng, mèo và layer áo/phụ kiện theo spec An chưa có file. Mới chạy được nhánh fallback, chưa kiểm được nhánh có ảnh thật.
- `OBSTACLES` mới khai báo cho 2 phòng mở đầu. Phòng chương 1 vẽ bằng code và chưa có ca nào đứng lên đồ vật.
