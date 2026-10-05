# Game pixel đã triển khai

## Cập nhật điểm-và-nhấp, Xưởng may, Chương 1 — 05/10/2026

Phòng cốt truyện là point-and-click: bấm/chạm vật có viền sáng (hotspot là nút DOM trên canvas, tối thiểu 44 px, không che tâm hotspot lớn hơn), **Soi**/Space lộ mọi vật, mũi tên pixel để sang phòng; sân hub vẫn đi bằng WASD/mũi tên + E. An đi tới vật được bấm, dừng cạnh vật rồi mới gọi lệnh tương tác. Kích thước thế giới lấy theo ảnh nền từng phòng, mọi phòng đều 16:9. Nền Chương 1 vẽ bằng code (`scripts/pixel/draw-c1-rooms.py`); NPC dùng 4 hướng view-front/left/right/back của spec An (khung 176×416 điểm chân 88,400), quay mặt về phía An khi nói chuyện.

`npm run setup` hỏi GEMINI_API_KEY, ghi vào `.env`; bỏ qua để chơi game mà không AI. `npm run smoke:ai` test Gemini connection.

**Xưởng may** (F12/F13): tab mới trong Tủ đồ, quét ảnh áo thật, gọi Gemini (`vision + structured output`) nhận diện dáng, cổ, hoa văn, màu rồi mở Phòng phối đồ với dáng + màu tương ứng; áo nước khác (hanbok/sườn xám) hiện thẻ giải thích khác biệt. **Selfie**: hộp thoại ở màn chờ, chỉ gọi `/api/ai/analyze-selfie` sau khi tick đồng ý và bấm Phân tích; ảnh thu nhỏ ≤ 768 px trên máy, server không cache.

**Chương 1 chơi được**: prologue 890×500 (mở rộng 16:9), Chương 1 ba phòng 640×360 (16:9 native), point-and-click trong cảnh, kết hợp vật phẩm từ ba puzzle, hiển thị puzzle modal, styling challenge ở Studio, kết thúc cốt truyện qua `completionDialogueId`. NPC sprite 64×96 trong c1-s3.

UI images được chuẩn hóa vào lưới pixel bằng `scripts/pixel/normalize-ui-images.py`; dialogue frame và HUD icons vẽ trong code; assets tại `assets/src/pixel/ui` được render ra `assets/ui-pixel/`. Pipeline pixel: `assets/palettes/*.json` (màu), `scripts/pixel/pixel-grid.py` (lưới), `.claude/skills/pixel-draw/SKILL.md` (hướng dẫn).

## Cập nhật màn chờ và header kem — 02/10/2026

Lựa chọn nền cuối: dùng nguyên ảnh `image.png` do người dùng đặt ở thư mục gốc, sao chép vào `assets/screens/main-shop/garden-user--landscape.png`. Nền này thay bản ImageGen thử nghiệm bên dưới; bảo tàng nằm bên phải. Biển đặt trên thanh ngang phía trên cửa, xoay cả khung và chữ theo từng gian nhà; khoảng đệm tính cả góc xoay giữ biển trọn trong vùng chơi khi màn hình thấp. Vùng chân được giới hạn theo polygon sân gạch và ao sen của ảnh. Đường vào nhà, bồn cây và vườn ngoài sân không còn dùng các hình chữ nhật của nền cũ. Nguồn và phép ánh xạ tọa độ ghi tại `assets/screens/main-shop/garden-user.md`.

Sảnh dùng nền `assets/screens/main-shop/garden-user--landscape.png` (bản gen gốc 1586×992, vẽ có smoothing): góc nhìn cao, ao sen nhỏ ở mép trái, khu bảo tàng riêng bên cạnh và sân gạch rộng giữa các khu vực. Nền phủ world 1000×625 bao quanh vùng đi lại 800×500; chiều cao An lấy từ `characterScale('hub', …)` (khoảng 15% chiều cao world). Vùng đi lại và va chạm trong `physics.ts` đã khớp với vị trí mới; biển bốn khu vực dùng cùng phép biến đổi camera. Phòng cốt truyện vẫn dùng bản đồ và camera riêng.

Header kem cao 52px ở desktop, 50px trên điện thoại và 46px ở màn hình ngang thấp. Thanh khám phá phía dưới đã bỏ khỏi cả màn chờ và game, cùng mã điều hướng và CSS của thanh này. Thông báo khôi phục thành công không còn bật toast; các thông báo cần thiết nằm trong vùng chơi, dùng nền kem và viền tím. Thẻ “Chiếc rương của bà” đã bỏ khỏi sảnh; biển Cốt truyện vẫn mở hành trình.

`src/App.tsx` dựng màn chờ từ concept được chọn, với tiêu đề, nút vào game, tải ảnh, Cách chơi và Về Nếp. Chỉ mount `Game` sau khi người dùng bấm Vào game/Tiếp tục chơi. Bản lưu được đọc để chọn nhãn CTA nhưng chưa ghi lại trước khi vào game. Ảnh tải lên chỉ được kiểm tra và xem trước bằng object URL trên thiết bị; không gọi tuyến AI và không sinh nhân vật. Tài nguyên mới `assets/screens/welcome/welcome-courtyard.png` là phần tranh tách bằng ImageGen từ ảnh mẫu, đã thêm vào runtime-assets.json; không thay thế asset cũ.

`src/welcome/welcome.css` dựng khung grid gồm header kem và vùng chơi co giãn đến đáy màn hình. Khung này giữ nguyên khi chơi; CSS scoped theo `.game-stage` ghi đè kích thước viewport và khung 8:5 cũ. Cảnh/các phòng phủ phần còn lại dưới header; panel và modal game bị giới hạn trong vùng đó. Các cập nhật tỷ lệ khung bên dưới ghi lại lịch sử trước thay đổi này.

Biển khu vực trong sảnh mở Studio/Closet/Journey/Museum; điện thoại có menu khu vực trong vùng chơi. Header cho quay về màn chờ. Các bảng thông tin và menu tạm dừng input của game; hội thoại/modal nội bộ khóa các nút điều hướng để tránh chồng hộp thoại. Tiến trình vẫn dùng bộ lưu/khôi phục có sẵn.

## Cập nhật sảnh có khoảng đệm và biển cố định

*(Lịch sử, đã thay bằng bố cục toàn màn hình ở đoạn dưới)* Theo lựa chọn trước đó của người dùng, desktop hiển thị trọn cảnh sảnh 8:5, tối đa 1600×1000, có khoảng đệm ít nhất 24px quanh khung. Scene không còn crop trời/sân hoặc pan theo An ở bố cục này. Biển Phòng phối đồ/Cốt truyện/Tủ đồ/Bảo tàng dùng tọa độ world và cùng transform với nền, bao gồm kích thước; bỏ cơ chế ép biển vào mép viewport. Logo/HUD và thẻ chương được thu gọn. Mobile giữ bố cục cảm ứng trong khung đệm 8px.

Font VT323 Regular của Peter Hull tải từ kho Google Fonts tại `assets/fonts/vt323/VT323-Regular.ttf`, kèm OFL 1.1 và nguồn trong README cùng thư mục. CSS chỉ áp dụng dưới `.screen-hub`; các phòng giữ font cũ. Biển dùng ảnh người dùng cung cấp `assets/screens/main-shop/area-sign-frame.png`, giữ nguyên alpha và tỷ lệ. Registry hiện có 212 PNG, font được Vite phục vụ qua URL CSS.

Kiểm tra nhanh: lint/build đạt, font tải được trong Chrome; biển đứng nguyên khi An di chuyển; điều hướng vào Studio/quay về hoạt động và Studio giữ Segoe UI. Các phần mô tả tràn viền trước đây bên dưới là lịch sử triển khai.

## Cập nhật giao diện tràn viền

Theo yêu cầu mới, `fullscreen.css` chuyển toàn bộ game sang viewport 100dvh, không có phần header/footer nằm ngoài cảnh. Header/HUD, điều hướng, nút Về sân nhà, bảng chào, tiến trình, túi đồ và toolbar đều là overlay. Các phòng phủ nền toàn màn hình và cuộn bên trong panel. `MannequinStage.tsx` neo chân paperdoll vào bục/sàn theo kích thước nền thực và phép cover.

Nền được bổ sung tại `assets/screens/main-shop/garden--landscape.png` (1585×992). Sheet người dùng gửi được giữ nguyên tại `assets/branding/viet-phuc-ui-sheet.png`; `logo-viet-phuc.png` và `sen-ngoc.png` tách vùng ảnh thật, loại nền caro bằng `scripts/import-branding.py`, không sinh thêm hình. Registry hiện có 211 PNG. Không vẽ thêm mèo ở hub vì nền mới đã có mèo.

Canvas cảnh phủ viewport, nền hiển thị kích thước thật với smoothing, camera cover/pan; tọa độ gameplay dùng kích thước thật của từng nền (prologue 890×500, c1-rooms 640×360, hub 1000×625). Mobile hub dùng cùng nền mới và camera theo An. Điểm neo nhãn được đưa vào khung nhìn để nút vẫn truy cập được khi cảnh bị crop.

An ở hub dùng scale 0.36 để tương ứng với bố cục tham chiếu mới; trong phòng cốt truyện giữ scale 0.25. Mọi lớp vẫn dùng chung frame và điểm neo chân. Smoke test giao diện đạt ở desktop, mobile dọc và mobile ngang: viewport phủ kín, panel nằm trong nền, nút quay về hoạt động. Lint/build đạt.

## Phạm vi

`src/App.tsx` mở game trong `src/game/Game.tsx`. Giữ React/Vite + Express hiện có. Nội dung lấy từ `src/content`; state tiến trình, vật phẩm, manh mối, tiền, phần thưởng và tủ đồ dùng command của `src/core`. UI chỉ giữ màn đang mở, modal, bản nháp Studio và vị trí/hoạt ảnh tức thời.

Màn mở đầu có tiệm may chiều, cầu thang, gác xép, các hội thoại/vật phẩm, ba câu đố, lời bà, manh mối và phần thưởng. Hub điều hướng đến Studio, Tủ đồ, Bảo tàng và Cốt truyện. Bản đồ chương hiển thị nội dung được cung cấp và tình trạng khả dụng; chưa bật phần chơi của chương 1–5.

Không sửa file asset gốc; chỉ sinh ảnh qua Gemini khi người dùng bấm "Chụp Lookbook AI". Phòng phối đồ gọi Gemini qua `/api/ai/stylist` để gợi ý trang phục khi bấm "Gợi ý từ Gemini"; Lookbook gọi `/api/ai/lookbook` để sinh 4 ảnh chân thực khi bấm "Chụp Lookbook AI", nhưng luôn hiển thị 4 ảnh pixel làm fallback. Không tạo hướng mới. Chưa phát âm thanh vì thư mục audio chỉ có tài liệu.

## Registry và render

- `src/game/assets.ts`: registry URL qua Vite `import.meta.glob`, bỏ `_raw`, kiểm tra kích thước trước khi dùng ảnh trên canvas. Registry bao gồm 207 PNG thật; trình render chỉ tải các lớp cần cho cảnh hiện tại.
- `data/runtime-assets.json`: đường dẫn, vai trò nhóm, kích thước, định dạng, alpha, bounding box và SHA-256. Metadata slice chi tiết dùng manifest hiện có của `main-shop`, `studio`, `museum`.
- `scripts/audit-assets.py`: chỉ đọc ảnh gốc; sinh metadata và contact sheet để kiểm tra trong `artifacts/`, không dùng ảnh QA làm asset sản phẩm.
- `Slice.tsx`: áp dụng border-image 9-slice/3-slice theo metadata; chữ, điều khiển và hội thoại là HTML. Khung action card có sẵn được dùng cho panel chung/tủ đồ khi thiếu khung chuyên biệt.
- Canvas cảnh dùng kích thước nền thật (không chuẩn hóa); nền hiển thị với smoothing (`image-rendering: auto`). Nhân vật An, NPC vẽ trên canvas với `imageSmoothingEnabled = true` (để mịn khi scale). Icon, 9-slice, 3-slice và ui-pixel dùng `image-rendering: pixelated`. Không coi hitbox tương tác là vật cản.

## Sheet An đã đối chiếu

Các lớp mặc định và biến thể trong `assets/characters/an/` đều 1408×4576. Chia **8 cột × 11 hàng**, ô **176×416**, không có gutter giữa ô; bên trong ô có khoảng trong suốt lớn. Chỉ số frame là `row * 8 + column`.

| Hướng | Điểm bắt đầu | Đứng/chớp mắt | Đi bộ |
| --- | ---: | --- | --- |
| Trước/xuống | 0 | 0–3 | 4–11 |
| Trái | 22 | 22–25 | 26–33 |
| Phải | 44 | 44–47 | 48–55 |
| Sau/lên | 66 | 66–69 | 70–77 |

Contact sheet ghép đủ 88 ô được kiểm tra trực quan; bước chân, nếp áo và hướng đầu của các chuỗi trên có thay đổi thực. Runtime dùng frame đứng đầu mỗi hướng khi dừng, chuỗi đi 8 frame ở 9 frame/giây khi vị trí thay đổi. Các frame cục bộ 12–21 của mỗi nhóm có pose khác nhưng chưa đủ căn cứ đặt tên chuỗi hành động, nên chưa đưa vào gameplay.

**Tỷ lệ mỗi cảnh (`characterScale`):** Helper `characterScale(scene, bgH, footY?)` trả về số px world trên mỗi px art của An (dáng 389 px trong khung 176×416). Từng cảnh khai báo `humanHeight` (chiều cao An ÷ chiều cao nền) (bảng đầy đủ kèm dải sàn ở `assets/README.md` §5.4, đã căn bằng ảnh chụp ngày 05/10). Nếu có `footY` thì nội suy tuyến tính từ sàn sau tới trước. Làm tròn tọa độ cuối cùng về px màn hình, **không** làm tròn hệ số scale.

| Cảnh | humanHeight (sàn sau → trước) | Ghi chú |
|---|---|---|
| Mở đầu `c0-*` | 0,38 ở sàn sau → 0,50 ở mép trước | Co theo chiều sâu |
| Chương 1 `c1-*` | 0,42 | Cố định |
| Sảnh `garden-user` | 0,15 | Nền raw hires |
| Phòng phối đồ | 0,34 → 0,48 | Theo độ sâu chỗ chân đứng (`MannequinStage`) |
| Tủ đồ, Xưởng may | 0,31 → 0,55 | Như trên; tối đa 1,2× khung gốc |

Trong phòng truyện An đi tới vật được bấm (`room-walker.ts`); chân không đứng trong vùng vật cản (bàn may, rương — `OBSTACLES`), điểm rơi vào đó được đẩy ra sàn ngay phía trước. Khi vào phòng, An đứng ngay trên mũi tên dưới sàn, hoặc cạnh mũi tên treo tường (cầu thang). Hai lớp hiệu ứng phòng mở đầu (bụi nắng, ánh sáng rương) đã gỡ khỏi game ngày 05/10.

Điểm neo chung `(88, 400)` trong ô. Các lớp luôn cùng frame/hướng/thời gian:

```text
shadow → hair_back → outfit_back → legs → shoes → body → bottom
→ outfit_main → head → face → hair_front → hands → head_accessory
```

Tóc bob và áo jade/rose thay thế lớp tương ứng. Biến thể giày gold, bottom ivory và head accessory peach được đăng ký nhưng chưa có lựa chọn UI. Không chồng toàn bộ biến thể.

**Lớp áo & phụ kiện (spec An):** Dải 528×416 gồm 3 ô theo thứ tự: ô 0 front (176×416), ô 1 side-left (176×416), ô 2 back (176×416). Áo vẽ thang xám theo độ sáng, được tô màu bằng gradient-map 4 màu palette từ tối đến sáng, giữ alpha. Phụ kiện đặt đúng chỗ trên khung An chuẩn. Fallback khi chưa có asset mới: dùng bản 64×96 cũ phóng theo `characterScale`, hoặc hiện icon nếu không có cả bản cũ.

## Di chuyển, tương tác và lưu

`Scene.tsx` dùng requestAnimationFrame + delta time (tối đa 50 ms), tốc độ 130 đơn vị/giây, chuẩn hóa vector đi chéo. `physics.ts` có vùng đi/obstacle theo chân nhân vật và spawn đã đo theo nền. Di chuyển thử theo hai trục; UI không dispatch mỗi frame. Input bị chặn khi mở modal/hội thoại, focus input/textarea/select/contenteditable hoặc tab mất focus; keys được xóa khi blur/visibility thay đổi. Mobile dùng pointer capture để giữ/nhả phím.

Các phòng cốt truyện gọi `nearestInteractable` và `interact` với tọa độ chuẩn hóa 0–1. Điểm tương tác/spawn trong prologue được hiệu chỉnh theo ảnh thật, độc lập collision. Core bỏ qua pickup đã sở hữu, puzzle đã giải và puzzle chưa đạt prerequisite để vật thể không che nhau. Không cho nộp vật phẩm chưa có hoặc mở rương trước khi gỡ vải. Puzzle mở rương kích hoạt đúng hội thoại bà và clue ngay khi đọc node có clue.

`store.ts` dùng `dispatch`, `prune`, `toJSON`/`fromJSON`; khóa save là `tiem-may-nep-save-v1`. Save lỗi có thông báo và chơi tiếp trong bộ nhớ. Save sai/không hợp lệ mở state mới và báo rõ. `features.latVai` luôn false.

Lịch sử tối đa 200 node: ưu tiên bỏ nhánh lá không được bảo vệ; nếu đường đang chơi vượt hạn mức, gộp snapshot cũ thành root checkpoint và giữ các command gần nhất. Tiến trình hiện tại và replay được giữ, nhưng các nhánh/điểm undo cũ ngoài cửa sổ này bị loại. ID node mới lấy từ chỉ số cao nhất còn giữ để tránh trùng sau prune. Studio dùng scoped session của core cho undo/redo và chỉ commit một `closet/saveOutfit` vào lịch sử khi lưu.

## Tài nguyên còn thiếu và tài liệu tham chiếu

Manifest gốc `data/asset-manifest.json` có **182 đường dẫn không tồn tại**. Nhiều tên đã có ảnh tương ứng ở đường dẫn mới (ví dụ item dùng dấu gạch ngang, An dùng sheet lớp); không đồng nghĩa thiếu 182 hình ảnh cần cho màn mở đầu. Danh sách chính xác nằm trong [`data/asset-gaps.json`](../../data/asset-gaps.json), không sửa manifest gốc để che chênh lệch.

| Đường dẫn/chức năng | Tình trạng và cách xử lý |
| --- | --- |
| `assets/audio/` | Chỉ có README, chưa có nhạc/SFX để phát. |
| `assets/areas/prologue/` | Không có nền portrait; nền gốc prologue 890×500 (ngang), mobile dùng cùng nền và camera pan. |
| `assets/screens/common-hud-bar--3slice.png` | Thiếu thanh HUD chung; dùng `main-shop/ui-hud--3slice.png` có sẵn. |
| `assets/screens/modal-frame-wood--9slice.png` | Thiếu khung modal chung; dùng khung action card có sẵn. |
| `assets/screens/wardrobe/coin-shop--9slice.png` | Thiếu khung cửa hàng chuyên biệt; dùng khung action card chung có sẵn. |
| `assets/screens/wardrobe/wardrobe-panel--9slice.png` | Thiếu khung ngăn kéo chuyên biệt; dùng khung panel chung có sẵn. |
| `assets/screens/wardrobe/wardrobe-tab-bar--3slice.png` | Thiếu thanh tab; tab dùng điều khiển HTML. |
| `assets/screens/wardrobe/item-slot-frame.png` | Thiếu khung icon; icon gốc nằm trong ô HTML. |
| `assets/areas/chapter-1/` | Có một số nền `bg-mat-phai/bg-mat-trai` và hình vật thể cũ, nhưng thiếu bộ trạng thái nền/VFX/CG chuẩn, nhân vật và bản đồ va chạm hoàn chỉnh. Chưa triển khai phần chơi chương. |
| `assets/areas/chapter-2/` đến `chapter-5/` | Các đường dẫn nền/trạng thái/VFX/CG kỳ vọng chưa đủ; chi tiết trong danh sách manifest thiếu. Chưa triển khai phần chơi chương. |
| `assets/characters/ong-le/silhouette.png`, `whisper-effect.png`, `dissolve-anim.png` | Manifest tham chiếu nhưng không tồn tại; không tạo bóng Ông Lệ hoặc bật mặt trái. |

Các tham chiếu chưa có trong checkout: `docs/05-tech/ui-core-contract.md`, `docs/05-tech/architecture.md`, `docs/06-design/user-flows.md`, `docs/07-game/`, `docs/04-culture/bibliography.md`; nhóm An cũng chưa có `assets/characters/an/README.md` mô tả frame. Triển khai dựa vào implementation thật, JSON content, tài liệu hiện có và kiểm tra ảnh, không dựng nội dung tài liệu bị thiếu.

Bảo tàng giữ nguyên `historicalFact`, tên trang phục và ghi chú từ content. Các thẻ chưa có trường nguồn kiểm chứng riêng; UI ghi rõ tình trạng này, không tự thêm nguồn. Thẻ Lemur có dẫn chiếu Phong Hóa số 90 ngay trong nội dung gốc.

## Kiểm tra đã chạy

- `npm run lint`: TypeScript đạt.
- `npm run build`: Vite production build đạt; PNG là file URL riêng, không nhúng base64. Có cảnh báo chunk JS khoảng 561 kB trước gzip; chưa chia chunk theo phòng.
- `npm run test:core`: 15 self-check hiện có đạt; kiểm tra bổ sung chơi hết prologue, guard vật phẩm/prerequisite, nhận thưởng một lần, tọa độ hợp lệ, va chạm/tốc độ đi chéo, BFS từ spawn tới mọi tương tác mặt phải, 450 command vẫn ≤200 node và replay/restore khớp.
- `npm run test:browser`: 3 bài Chrome đạt trên dev và production preview. Thử phím di chuyển/frame đi–đứng, E, chặn modal, cầu thang, cả 3 puzzle, clue/thưởng, reload/goBack; Studio undo/redo/save một node và tải Lookbook; museum/thưởng một lần, shop; mobile portrait, nút giữ, nhập tên và save lỗi. Luồng prologue không có console error, HTTP lỗi hoặc request `/api/ai/`.
- `npm run test:assets` trên production preview: 207 ảnh đăng ký giữ nguyên SHA-256 khi build, đủ ảnh được emit, fetch/decode bằng Chrome đúng kích thước; Studio/Tủ đồ/Bảo tàng mobile không tràn ngang, không lỗi console/HTTP. Đã xem lại screenshot desktop/mobile và cảnh kết thúc.

Screenshot/contact sheet/report nằm trong `artifacts/` (gitignored), gồm `hub-browser.png`, `studio-browser.png`, `mobile-hub.png`, `mobile-studio.png`, `mobile-closet.png`, `mobile-museum.png`, `prologue-completed.png`, `an-frames-qa.png`, `browser-report.json`.
