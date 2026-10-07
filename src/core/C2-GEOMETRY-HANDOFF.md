# C2 — NPC và native geometry gửi Leader / Frontend

Baseline Core `fd64750`, Frontend kiểm read-only `16778b3`. Core không merge
Frontend hoặc sửa UI. **Trạng thái: đề xuất Core, chờ Frontend xác nhận và gửi
bảng đo native. Chưa phải tọa độ/NPC đã nghiệm thu hoặc đã thống nhất hai bên.**

## Chênh lệch source thực tế

Frontend `room-render.ts/ROOM_NPCS` có ba key `hitbox-ca-nghi`, `hitbox-cu-loan`,
`hitbox-cu-loan-storage`. Core C2 có 11 interactables, không có ba ID này.
`RoomScene.tsx` xây danh sách NPC bằng cách filter `area.interactables` theo
`ROOM_NPCS`, nên ba mapping kia không được render. Chỉ thêm key vào map không
tạo placement. Core sẽ không thêm interactable có action giả để giải quyết.

## Phương án đề nghị Frontend xác nhận

Frontend dùng danh sách NPC hiển thị theo area, độc lập với interactables.
Ví dụ các render ID đề xuất (không là InteractableId, không dispatch command):

| Area | Actor / render ID đề xuất | Tương tác Core |
| --- | --- | --- |
| S1 `c2-s1-gac-lung-ve-tranh` | Cả Nghị `npc-c2-ca-nghi`; Loan `npc-c2-loan-s1` | D0 tự enqueue khi entry; không cần hotspot NPC |
| S2 `c2-s2-kho-vai-hang-dao` | Loan `npc-c2-loan-s2` | Giữ shelf dialogue, key, safe hiện có; không gán action mới cho NPC |
| S3 `c2-s3-phong-trien-lam-doi-dau` | Bóng Ông Lệ gắn hotspot thật `hitbox-ong-le-shadow`; Loan nếu art cần cutout riêng thì dùng render ID riêng | Giữ receipt/sketch/styling ID cũ; không vẽ thêm người lên overlay/CG đã composite |

Frontend sở hữu bảng placement/render, loader/pose và chuyển ID sang sprite.
Core sở hữu rect/pos/radius/spawn/exits của các action thật trong C2 JSON.
Không dùng rect một actor để ngầm thay rect thao tác giấy/két/puzzle. Chưa cần
thêm schema NPC: bảng actor thuần trình bày có thể thuộc Frontend. Nếu Leader
muốn placement actor đi qua content, cần chốt schema riêng có nghĩa hiển thị,
không tái sử dụng Interactable/action giả; chưa triển khai phương án đó.

## Native art đã kiểm được

Manifest `assets/areas/chapter-2/manifest.json`: version 4, background A,
cả ba nền 1672×941. Content đã khai báo logicalSize này; **rect/pos/spawn cũ
vẫn chưa được coi là số đo native đã duyệt**. Full-canvas overlays đặt ở (0,0)
là canvas ảnh, không phải hit rect. `worldPlacements.topLeft` là điểm đặt prop:

| Prop | Native topLeft từ manifest | Content item ID (giữ underscore) |
| --- | --- | --- |
| Mảnh 1 | 615, 421 | `manh_ban_ve_ao_dai_1` |
| Mảnh 2 | 993, 520 | `manh_ban_ve_ao_dai_2` |
| Mảnh 3 | 130, 407 | `manh_ban_ve_ao_dai_3` |
| Mảnh 4 | 1260, 452 | `manh_ban_ve_ao_dai_4` |
| Chìa | 401, 386 | `chia_khoa_ket_sat_bang_thau` |

Các điểm này chưa cho biết visible bounds, hit target 44 CSS px hoặc điểm đứng
walker. Core chưa suy ra rect từ chúng để thay báo cáo Frontend.

## Bảng Frontend cần bàn giao

Ghi commit, nền A native1672×941, hệ tọa độ và ảnh/bằng chứng đo. Mỗi phòng:

- Mỗi action thật trong content: `interactableId`, `nativeRect{x,y,w,h}`,
  `nativePos{x,y}`, `radius` (đơn vị normalized theo width), điểm đứng walker
  native và bằng chứng đi từ spawn đến điểm đó. Nếu không đi được, ghi blocker.
- `spawn{x,y}` native, floor bounds, obstacles/occlusion và foot anchors NPC
  từ Frontend; tránh NPC che vật hoặc đứng đúng vùng phải bấm.
- Mỗi exit: key/target area, native arrow rect, hướng và điểm entry/đứng.
  S1 `window`→S2; S2 `back`→S1, `hall`→S3; S3 `back`→S2.
- Mảnh 4: visible/hit rect của `hitbox-french-window` và exit `window` tách
  nhau; kiểm cả hit target mở rộng ít nhất 44 CSS px ở mobile. Không chỉ kiểm
  hai rect native không giao nhau: arrow không được đè tâm vùng bấm mảnh 4.
- Danh sách NPC thuần hiển thị: renderId/actor, sprite/pose, visible bounds,
  foot anchor và native placement từng phòng. Xác nhận chọn phương án ở trên
  hoặc đưa delta để Leader thống nhất.

Core nhận bảng mới normalize `x,w / 1672`, `y,h / 941`, kiểm bounds/ID/side/
gate và áp JSON một lần. Giữ ba phòng/năm puzzle và IDs cũ. Sau đó kiểm direct
interact radius, native aspect và khả năng walker đi đến từng action cùng
Frontend. Guard range hiện dùng hệ logic 800×500 trong `interact-command.ts`;
phải đối chiếu với walker native 1672×941 khi nhận bảng, không coi đổi metadata
JSON là đã xác minh reachability. Nếu cần sửa range, thêm regression RED trước.

## Blocker còn lại

Chưa có bảng đo đầy đủ hoặc xác nhận bố trí NPC từ Frontend trong commit/
worktree đã kiểm. Core đã yêu cầu đường dẫn/nội dung bảng từ Leader trong turn
review. Không tạo số đo placeholder, không tuyên bố M2/M3/M4 UI acceptance.
Layer `ao-dai-tan-thoi-vang-mo-ga` còn thiếu; giữ nguyên reward cả hai áo,
không tạo layer hoặc đổi quà. Blocker nghiệm thu quà đầy đủ vẫn mở.
