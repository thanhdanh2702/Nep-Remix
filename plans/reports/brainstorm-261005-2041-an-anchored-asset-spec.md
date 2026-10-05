# Brainstorm — Thông số asset lấy An làm chuẩn

Ngày 2026-10-05. Phạm vi: Nep-Remix. Nộp bài 10/10.

## Vấn đề (theo bằng chứng, không theo cảm giác)

Spec đang lệch mật độ pixel và kích thước, nên UI và nhân vật không ăn khớp. Ảnh chụp 1366×768 lưu ở scratchpad `shots/`.

- **An** (nhân vật chính): khung 176×416, điểm chân (88,400), dáng cao 389 px. Vẽ chi tiết 1:1, khoảng 14k màu, kiểu chibi (đầu và tóc chiếm khoảng 1/3 chiều cao).
- **NPC, paperdoll, áo, phụ kiện**: khung 64×96, dáng chỉ khoảng 29×92 px. Tỉ lệ người thật (đầu khoảng 1/7 thân), mặt chỉ vài pixel.
  - Chênh nhau khoảng 4,3 lần về kích thước, và khác hẳn kiểu dáng.
  - Phóng to theo nearest-neighbor hay EPX ×4 đều không cứu được (`density-test.png`).
- **Spec cũ** (`assets/README.md` §5): character 64×96, nền 800×500. Thực tế:
  - An 176×416, nền mở đầu 890×500, nền chương 1 640×360, Sảnh raw 1586×992.
  - Spec không mô tả đúng asset nào đang thật sự có trong repo.
- **Code phản ánh sự lệch đó:**
  - `AN.scale 0.25` không dùng; Sảnh dùng `.30`.
  - NPC trong phòng vẽ ×1, chỉ cao 19–27% phòng (`room-render.ts:34,94`).
  - `n = round(k)` làm NPC lệch từ −30% đến +33% tùy viewport.
  - Áo 64×96 kéo ×3 ngang ×4 dọc để đắp lên An (`StudioCharacter.tsx:14-16`).
  - Phòng truyện không vẽ An.
- **Asset đã gen nhưng chưa hiển thị:** khoảng 92 / 233 PNG. Gồm 18 paperdoll, 39 ảnh NPC hướng sau/trái/phải, 12 file areas, nhiều file screens. Có thêm 23 file chỉ dùng ở chương 2–5, chưa chơi tới được.

## Ràng buộc từ user

1. An là chuẩn; sửa thông số toàn repo theo An.
2. **Background giữ nguyên** (không vẽ lại, không chuẩn hóa).
3. Screens và các nhóm khác (items, motifs, areas, branding, ui-pixel) dùng **bản gen lúc đầu**. Với screens nghĩa là bản `_raw`:
   - Dùng `*-hires` hoặc `*-v1`.
   - `background--landscape` lấy v2, `workbench-ui--portrait` lấy v3. Hai bản này khớp với bản đang dùng, sai lệch 10,4 và 7,7.
4. Sảnh giữ `garden-user`, chuyển sang bản raw hires.
5. Bảo tàng thêm Sổ tay "Nhân vật" và "Kỷ vật" (chưa gặp thì hiện bóng đen); NPC xoay hướng.
6. Trong phòng truyện, người chơi đi tới vật được bấm.
7. Nhóm asset nhân vật 64×96 **đang dùng trong phần chơi được** sẽ gen lại theo spec An. Lần này chỉ **viết spec**; công cụ gen để sau.

## Các phương án

| | A. Spec theo "đơn vị An" (chọn) | B. Ép mọi thứ về lưới pixel chung | C. Spec theo px màn hình |
|---|---|---|---|
| Ý tưởng | 1 đơn vị = dáng An 389 px trong khung 176×416. Mọi asset nhân vật dùng chung khung và điểm chân của An. Mỗi cảnh khai báo `humanHeight` (% chiều cao nền) | Đặt 1 px art = 2 px màn hình, thu An về khoảng 64×96 | Liệt kê kích thước px cố định cho từng màn, từng asset, từng viewport |
| Hợp yêu cầu | Đúng: An là chuẩn, nền giữ nguyên | Trái yêu cầu: hủy chi tiết của An | Được, nhưng không định nghĩa được asset gen sau |
| Bảo trì | 1 helper `characterScale(scene)` thay 5 hằng số rải rác | Thấp | Kém: hàng chục con số, viewport đổi là sai |
| Công sức | Trung bình | Thấp | Trung bình, phải sửa lại liên tục |

**Chọn A** vì ba lý do:
- Đó là thứ duy nhất neo được cả asset gen sau lẫn code hiển thị.
- Không phải chạm vào nền.
- Gom các hằng số scale đang rải rác về một chỗ.

## Spec mới (nội dung cốt lõi để ghi vào `assets/README.md`)

**Đơn vị nhân vật:**
- Khung 176×416 cho mỗi frame, điểm chân (88,400).
- Dáng người cao 380–392 px. Tỉ lệ chibi giống An (đầu và tóc khoảng 1/3 chiều cao, mắt to).
- Vẽ chi tiết 1:1, cho phép khử răng cưa mềm, không giới hạn số màu.
- Nền trong suốt, xuất đủ canvas.

**Các loại asset:**

| Loại | Spec mới | Ghi chú |
|---|---|---|
| `character-sprite` (NPC) | 176×416 cho mỗi hướng, file `view-front/left/right/back.png` | Giữ tên file cũ; `left` có thể lật thành `right` |
| `garment-layer` | 176×416 cho mỗi hướng: front, side, back (3 frame). Một layer áo trọn bộ thay cho `outfit_main` + `outfit_back` của An | Thang xám theo độ sáng; game tô màu bằng gradient-map, vì palette 4 cấp xám không hợp với ảnh có khử răng cưa |
| `accessory-layer` | 176×416 cho mỗi hướng, 3 frame, đặt đúng chỗ trên dáng An | |
| `cat-sprite` | khung 128×128, mèo cao khoảng 100 px (khoảng 26% chiều cao An) | |
| `paperdoll-*` | **bỏ**. Lớp cơ sở chính là 13 layer của An | Giữ `avatar-female-default` làm ảnh đại diện |
| `area-background` / `cg` / `doc` / screens | **ghi đúng kích thước thật**, không bắt resize | 890×500 (mở đầu), 640×360 (chương 1), screens theo kích thước raw |
| `item-icon`, `accessory-icon`, `garment-thumb`, `motif`, `ui-pixel` | giữ nguyên file. Spec hiển thị theo CSS px, độc lập với đơn vị An | Đây là icon UI, không đứng cạnh An |

**Quy tắc cảnh (`humanHeight` = chiều cao An / chiều cao nền):**

| Cảnh | Số khởi điểm | Căn cứ |
|---|---|---|
| Mở đầu `c0-*` | 46%, co theo chiều sâu: 38% ở sàn sau, 50% ở mép trước | `an-c0.png`: bàn may tới ngang hông |
| Chương 1 `c1-*` | 42% | `an-c1.png`: An vừa ngang khung cửa |
| Sảnh `garden-user` | 15% (hiện 20%) | `an-hub.png`: An xấp xỉ cửa nhà |
| Phòng phối đồ, Tủ đồ, Xưởng may | đo lại bằng ảnh chụp | An là nhân vật chính giữa màn |

- Làm tròn ở mức px màn hình, **không** làm tròn hệ số phóng.
- An và NPC có thể vẽ smoothing khi bị thu nhỏ: ảnh có khử răng cưa nên thu nhỏ vẫn đẹp.

## Danh sách gen lại (phần chơi được), khoảng 79 ảnh

- **NPC 4 hướng:** `cat-nep`, `ong-le` (dạng bóng mờ), `cu-cam`, `truong-toc-bui`. Tổng 16 ảnh.
- **NPC chỉ cần mặt trước** (đứng cạnh An trên bản đồ): `cu-loan`, `ba-mai`, `me-phuong`. Tổng 3 ảnh.
- **10 áo × 3 hướng:** 30 ảnh.
- **10 phụ kiện × 3 hướng:** 30 ảnh.
- **Không gen lại:** NPC chương 2–5 giữ bản 64×96, chỉ hiện dạng thẻ trong Sổ tay.

## Tích hợp, làm song song với việc gen

1. **Viết lại spec:**
   - `assets/README.md` §4–6.
   - `assets/screens/README.md` cùng 5 README con. Sửa luôn phần vi phạm luật "README con không ghi thông số".
   - `docs/06-design/ai-studio/gemini-ui-asset-prompts.md`.
   - Quyết định 20–22 trong `docs/01-overview/decisions.md`.
   - Bộ prompt gen lại theo đơn vị An.
2. **Thêm helper `characterScale`** và khai báo `humanHeight` cho từng area/screen. Gỡ `NPC_W/H`, `AN.scale`, `spriteScale .30`, `--char-h`, và việc ép NPC/An cùng chiều cao trong khung hội thoại.
3. **Screens:** trỏ sang bản `_raw` và cập nhật `data/runtime-assets.json` (`loadImage` sẽ báo lỗi nếu kích thước không khớp).
4. **Phòng truyện:** vẽ An, cho An đi tới vật được bấm, có co theo chiều sâu. NPC dùng 4 hướng và quay mặt về phía An.
5. **Phòng phối đồ và Tủ đồ:** vẽ áo và phụ kiện theo layer khung An.
   - Khi chưa có bản gen mới: tạm dùng bản 64×96 phóng theo `characterScale`.
   - Tủ đồ gắn cờ "đang chờ art" cho món nào còn bản cũ.
6. **Bảo tàng:** thêm Sổ tay "Nhân vật" và "Kỷ vật".
7. **QA:** chụp từng màn ở 1366, 1920, 390 dọc và 844 ngang, căn lại `humanHeight` theo cửa và bàn ghế, chụp lại.

## Rủi ro

- **Chưa có art mới:** khi bản gen lại chưa về, Phòng phối đồ và phòng truyện vẫn lệch dáng. Giảm thiểu: có cờ fallback và ghi rõ trong danh sách chờ art.
- **Gen lại khó đồng nhất:** khoảng 79 ảnh cần cùng kiểu dáng với An và căn đúng khung. Giảm thiểu: prompt kèm ảnh An làm tham chiếu, script căn theo điểm chân và kiểm tra kích thước khi đăng ký.
- **Tô màu áo:** đổi từ palette swap sang gradient-map làm đổi cách tô ở Phòng phối đồ. Cần test trên các bộ màu hiện có.
- **Hiệu năng:** sheet của An khoảng 1408×4576 × 13 layer; vẽ thêm An trong phòng truyện thì cần tái dùng ảnh đã ghép sẵn (cache composite).
- **Thể lệ:** công cụ gen chưa chốt. Nếu không dùng Gemini thì cần xác nhận với BTC. Đã nhắc một lần.

## Thước đo thành công

- Tỉ lệ chiều cao An so với nền nằm trong ±3% số đã chốt ở mọi viewport kiểm tra.
- Mọi NPC đứng cạnh An cao trong khoảng ±10% chiều cao An, cùng kiểu chibi (sau khi có art mới).
- Không asset nào trong registry vừa không dùng vừa không có lý do được ghi lại.
- `npm run lint`, `test:core`, `test:browser` đều qua; có bộ ảnh chụp từng màn trước và sau.

## Câu hỏi còn mở

- Công cụ và người gen 79 ảnh (script Gemini hay team gen trên AI Studio). User để sau.
- Hub có cần An mặc áo đang phối khi đi bộ không. Muốn vậy thì mỗi áo cần thêm frame đi bộ (88 frame); tạm hoãn.
