# C2 — kế hoạch thực thi cho Leader và team bốn agent

Ngày: 07/10/2026. Trạng thái: **kế hoạch bàn giao, chưa triển khai C2**. Team gồm Leader, Frontend, Backend/Core, Tester trên bốn worktree đang có. Không tạo thêm agent, không xây lại engine.

## 1. Mục tiêu và nguồn chuẩn

Hoàn thành Chương 2 “Tiếng Kéo Đêm Phố Cũ”, Hà Nội hư cấu năm 1935: người chơi giúp Loan phục hồi bản vẽ, chứng minh khoản nợ đã trả và khẳng định quyền tự quyết/tác giả của cô. C2 phải chơi được từ trạng thái vừa hoàn thành C1, lưu/tiếp tục ở mọi cổng, không cần mua đồ, gọi AI hoặc bật Lật vải.

Đọc theo thứ tự:

1. [Quyết định dự án](../01-overview/decisions.md), [nội dung](01-narrative.md), [gameplay](02-gameplay.md), phần C2 trong [kịch bản](03-chapters.md).
2. [Văn hóa và nguồn](06-cultural-review.md), [nghiệm thu](07-acceptance.md).
3. [Bàn giao art v4](08-c2-asset-handoff.md), [manifest C2](../../assets/areas/chapter-2/manifest.json), [gallery cuối](../../assets/areas/chapter-2/_raw/production-v4/gallery.html), [QA art](../../assets/areas/chapter-2/_raw/production-v4/qa.md).
4. [Hợp đồng Core hiện có](../../src/core/SPRINT-01-CONTRACT.md), [đề xuất chưa duyệt](../../src/core/SPRINT-01-PROPOSALS.md), [bàn giao tích hợp C1](team-sprint-01-integration.md).
5. Source hiện tại; các docs kỹ thuật cũ là ảnh chụp thời điểm lập, không thay cho kiểm tra source.

Nếu xung đột: quyết định người dùng đã chốt và decisions được duyệt → docs C2 hiện hành → contract đã triển khai → code/dữ liệu legacy cần sửa. Không coi một proposal là API đang tồn tại. Nếu có hai quyết định đã duyệt mâu thuẫn, hỏi người dùng trước khi code phần đó.

## 2. Baseline đã kiểm tra và khoảng trống thật

Tại lúc lập kế hoạch, Leader ở main `08a044e`; Core ở `agent/core` (`38ed058`), Frontend ở `agent/frontend` (`0f01922`), Tester ở `agent/tester` (`cd18e81`). Đây là snapshot tham khảo, không hardcode các SHA này làm baseline C2 sau khi repo đổi.

| Đã có | Còn phải làm / lưu ý |
| --- | --- |
| Gate, evaluator, queue thoại, draft, reward ledger, migration/replay đã có module | Tái sử dụng và thêm regression cho C2; không viết lại các hệ thống này |
| Content có ba phòng và năm puzzle C2 | `c2.json` còn 120 Sen, Hàng Gai, logicalSize cũ, két ở trai, yêu cầu flip/xoay, áo đáp án cũ, thiếu ending và các gate đọc giấy |
| Core đánh giá được order | `PuzzleModal.tsx` chưa có UI order chuyên biệt; hiện fallback gửi interact không giải được C2 |
| Playable/scene mapping có Mở đầu và C1 | Nối riêng C2; C3–C5 vẫn chưa playable |
| 56 PNG trong manifest v4: 45 hình và 11 icon tái sử dụng | Art mới đang là thay đổi chưa commit trong checkout Leader; các worktree khác chưa tự có chúng |
| Layer Lemur, khăn vấn đen, guốc mộc đã xuất | Cơ chế mượn wardrobe mới là proposal; UI hiện vẫn có ownership guard, dễ kẹt khi chưa sở hữu Lemur |
| Reward C2 legacy cấp hai áo và hai thẻ | Áo phụ `ao-dai-tan-thoi-vang-mo-ga` hiện có icon nhưng chưa có layer mặc riêng trong gói v4; không coi toàn catalog quà đã đủ art |
| Chín test art và build pass ở đợt art | Không phải chứng cứ C2 gameplay/E2E pass; baseline C1 cũng còn các ghi chú nghiệm thu phải đọc lại |

## 3. Khóa scope và các quyết định cần xử lý ở M0

Giữ ba phòng, năm puzzle, ID cũ và đáp án order 1–2–3–4. Chốt 100 Sen cho C2 theo baseline docs; không trừ tiền save cũ đã từng nhận 120. Giữ 15 Sen khi đọc thẻ lần đầu theo quyết định hiện hành: claim reward chỉ mở khóa thẻ, không tự đọc hoặc tự cộng khoản này.

Giữ nền A, tỷ lệ nhân vật v3/v4, các đường dẫn runtime và lớp mặc đồ đã xuất. NPC dùng pose tĩnh; An dùng atlas đi bộ hiện có. Không tự gen lại art, thêm NPC walk atlas, flip, mã số két, combat, timer, AI chấm đồ hoặc nhánh kết thúc mới.

Leader cần ghi nhận ba quyết định trước cổng release:

- Người dùng duyệt thẩm mỹ gallery cuối; có thể làm logic trước nhưng không gọi art là đã được duyệt khi chưa có xác nhận.
- Loan wardrobe: thống nhất schema/context/API cụ thể giữa Core và Frontend, bám proposal nhưng phải kiểm tra chữ ký thật sau triển khai. Cho mượn Lemur + khăn đen + guốc trong challenge, không tăng sở hữu vĩnh viễn trước reward.
- Áo thưởng phụ chưa có layer: giữ reward legacy trong lúc đánh giá; xin người dùng chọn bổ sung art hoặc thay đổi danh sách quà. Không âm thầm bỏ áo, đổi phần thưởng, dùng layer Lemur giả làm áo khác hoặc coi fallback là art hoàn chỉnh. Việc này không chặn xây đường chơi Lemur nhưng chặn nghiệm thu quà đầy đủ nếu chưa được giải quyết.

Không kéo sửa toàn bộ backlog reset/replay/C1 vào sprint C2. Lỗi nền tảng nào thật sự chặn fresh C1→C2 hoặc resume C2 thì thêm reproducer, giao đúng owner và sửa tối thiểu; quyết định UX rộng hơn phải hỏi riêng.

## 4. Tuyến gameplay và hợp đồng cổng

Đường chuẩn: **thoại mở → nhặt bốn mảnh → ghép → đọc gợi ý đồng hồ → chìa/két → đọc cả hai giấy → trình biên lai → trình bản vẽ → phối Lemur → đọc kết → thưởng/Hub**.

| Mốc | Điều kiện phải được Core bảo vệ | UI/asset phản hồi |
| --- | --- | --- |
| Vào S1 | C2 đã được mở từ C1; enqueue `d-c2-ca-nghi` đúng một lần | Loan thường nhật, nền A; đóng/reload không làm mất thoại |
| Nhặt/ghép | Đã đọc mở đầu; sở hữu bốn mảnh duy nhất; đúng thứ tự | Bấm chọn, bỏ, đổi vị trí bằng nút; kéo-thả chỉ là tùy chọn; dùng bốn dải PNG thật |
| Sang S2 | `p-c2-sketch-assemble` solved AND `d-c2-mat-ma` completed | Bản vẽ ghép hiện trên giá; lối đi có phản hồi khi còn khóa |
| Mở két | Ở S2/phai, sở hữu chìa và gate S1 đạt | Chìa biến mất khỏi overlay sau nhặt; két mở/có giấy rồi rỗng theo thời điểm inventory được cấp thật |
| Sang S3 | Safe solved AND cả `d-c2-bien-lai`, `d-c2-giao-keo` completed | Hai giấy đọc lần lượt, không chỉ mở modal là cấp clue/hoàn thành |
| Trình biên lai | Ở S3, đã đọc đủ hai giấy, sở hữu biên lai | Cả Nghị chuyển từ stern sang shocked; sai giấy không mất đồ |
| Trình bản vẽ | Receipt solved, sở hữu bản vẽ đã ghép | Loan đứng ra nhận tác giả; hiện bản vẽ treo, chữ tên bằng HTML |
| Phối đồ | Sketch solved; challenge context hợp lệ | Lemur + khăn đen + guốc, `silhouette=tan_thoi`; màu tự chọn, không kiểm trường ngoài brief |
| Kết/thưởng | Đủ năm puzzle AND `d-c2-ending` đã đọc hết | Vignette v4, claim một lần; trở Hub/bản đồ bằng navigation hiện có |

Gắn `when`/`exitGates` theo schema hiện hữu; đừng chỉ ẩn nút ở UI. `unlockedAreaIds` cũ không được bỏ qua gate đọc giấy mới. Giữ `d-c2-mat-ma` để tương thích nhưng sửa nội dung thành gợi ý vị trí, không thêm puzzle code.

Chốt rõ state két: với contract hiện tại safe solve cấp cả hai giấy, overlay rỗng có thể hiện ngay sau cấp inventory; overlay có giấy dùng cho bước reveal trước commit/close-up. Không để phần nhìn tạo thêm thao tác collect mà Core không có. Nếu muốn tách nhặt hai giấy thành hai command, phải sửa contract và test trước, không tự thêm ở UI.

## 5. Ownership — tránh nhiều worktree sửa cùng file

| Vai trò | Sở hữu chính | Không tự sửa |
| --- | --- | --- |
| Leader | Kế hoạch/contract, quyết định scope, baseline và tích hợp; `package.json` nếu cần nối suite | Không làm thay cả ba vai trò; không sửa test để che bug |
| Backend/Core | `src/content/chapters/c2.json`, `schema.ts`, nội dung C2 liên quan trong items/clues/cards/studio; `src/core/commands/journey/*`, studio guards, state/history; C2 contract và unit tests sát module | UI game, browser tests của Tester, PNG |
| Frontend | `Game.tsx`, `RoomScene.tsx`, `room-render.ts`, `room-walker.ts`, `character-scale.ts`, `npc-portraits.ts`, `PuzzleModal.tsx`, `Studio*.tsx`, CSS và UI mới cho C2 | Core evaluator, schema/JSON contract, PNG nguồn |
| Tester | `tests/browser/chapter2.spec.ts`, regression C2 mới, `scripts/check-game.ts`/validator/asset checker khi được phân công, báo cáo bằng chứng | Runtime Core/UI; phát hiện bug thì gửi reproducer về owner |

`src/game/store.ts` là file chia sẻ nhạy cảm: Frontend sở hữu; Core chỉ đề xuất thay đổi adapter và nhận lượt sửa qua Leader nếu bắt buộc. `schema.ts` và C2 JSON chỉ Core ghi; Frontend gửi tọa độ/hotspot để Core áp. `data/runtime-assets.json` và PNG khóa từ gói art; nếu cần xuất lại, Leader giao đúng một owner và chạy audit, không để nhiều nhánh cùng ghi.

Unit tests Core do Core viết trước logic; Tester viết kiểm thử độc lập, không thay cho TDD của dev. Shared file chỉ có một owner tại một thời điểm. Không revert thay đổi của người khác.

## 6. Trình tự thực thi và cổng bàn giao

### M0 — Leader khóa baseline và contract

1. Kiểm tra status/log/worktree; lưu danh sách thay đổi ngoài scope, không reset/stash/checkout đè dữ liệu người dùng.
2. Đối chiếu C1 source và báo cáo test; chạy baseline tối thiểu lint/core/build và C1 regression. Phân biệt lỗi có sẵn với regression C2, không tự nhận C1 đã nghiệm thu chỉ vì có merge.
3. Đóng gói docs/art bằng checkpoint local chỉ gồm file liên quan, sau khi được cho phép commit; không `git add .`. Không đưa docs overview/graph/output nháp ngoài phạm vi vào cùng commit.
4. Sau khi người dùng cho phép cập nhật nhánh, đưa cùng checkpoint baseline vào ba worktree bằng quy trình Git giữ commit riêng hiện có. Không reset các branch về main, không tạo thêm worktree. Mỗi owner xác nhận đã có manifest v4 và đúng baseline.
5. Tạo `docs/07-game/c2-contract.md`: payload có thật, các gate, ID ending, draft order, quyền mượn đồ, overlay states, quà/nhánh quyết định pending, file ownership. Contract phải ghi phần nào implemented, phần nào proposed.

**Gate M0:** contract được thống nhất; các worktree có cùng baseline art/docs; chưa bật C2 trong PLAYABLE bản release.

### M1 — Core contract, Frontend khung cảnh, Tester viết ca

- Core viết RED trước: order thiếu/trùng/sai/không sở hữu, exit sớm, present sai thứ tự, styling sớm, complete/claim sớm. Cập nhật JSON/schema/gate/ending và nội dung năm/địa danh/brief; thêm ending ID vào enum trước khi dùng. Không đổi ID item cũ.
- Core triển khai loan challenge có ràng buộc puzzle/area/chapter; equip/preset/resume đều revalidate; không tin list quyền mượn từ client. Mượn không thay wallet/closet, không cho lưu bộ đồ mượn vào Closet thường.
- Frontend song song nối nền A/scale/floor/NPC/overlay và UI order theo contract; dùng trạng thái thực từ Core, không tạo một nguồn solved/inventory riêng trong React. Gửi rect normalized và spawn/exit cho Core cập nhật JSON.
- Tester viết walkthrough/negative matrix, fixtures C1 complete → C2, save giữa mỗi cổng và thiếu đồ; chốt selector/test IDs với Frontend. Không dùng debug để làm happy path giả.

**Gate M1:** Core test GREEN, content parse/validate pass, UI sử dụng API thật; user không cần mua Lemur để giải.

### M2 — Lát cắt S1 hoàn chỉnh

Thoại mở → bốn điểm nhặt → order bằng nút hoặc bàn phím → bản vẽ hoàn chỉnh → đọc thoại gợi ý → S2. Persist order draft bằng `puzzle/updateDraft`; reload không tự solve. Ba mức hint nói rõ dải trái→phải, không nói xoay hoặc giả định mỗi dải tương ứng một bộ phận áo.

**Gate M2:** Tester qua S1 bằng thao tác thật; thử order sai rồi sửa được, đóng/reload giữ draft, mảnh đã nhặt biến mất, exit sớm bị Core từ chối.

### M3 — S2 và đọc chứng cứ

Chìa đồng hồ → mở két trên phai → hai giấy/hai thoại → S3. Văn bản giấy có dấu tiếng Việt, có nhãn chứng cứ hư cấu; queue theo đúng thứ tự, clue chỉ được cấp tại bước xác nhận đọc. Đóng/reload không mất giấy hoặc chặn đọc giấy thứ hai. Backtracking không reset vật/state.

**Gate M3:** đọc một giấy chưa đi S3; đọc đủ đi được; reload ở từng node/giữa hai thoại không softlock; visuals khớp inventory/state.

### M4 — S3, phối đồ, kết và reward

Biên lai → bản vẽ → Loan tự quyết → thử áo Lemur → ending → claim → Hub. Dùng pose/portrait v4; không vẽ thêm Loan/người nghe lên CG đã tổng hợp. Tên/chữ ký bằng UI thật. Hiển thị bốn hướng Studio, hướng phải mirror trái; loading/asset error có phản hồi.

Ending tối thiểu giữ lời Loan: “Khoản nợ đã trả. Còn bản vẽ, tôi sẽ tự ký tên.” An hỗ trợ, không trao quyền thay cô. Không dùng lời kể rằng áo “đủ thuần khiết” mới xứng đáng tự do.

**Gate M4:** kết chưa đọc thì chưa complete/claim; reward nguyên tử/idempotent; C3 mở về mặt tiến trình nhưng vẫn chưa playable và hiện thông báo chuẩn bị. Giải quyết quyết định áo thưởng phụ trước khi chốt full reward QA.

### M5 — Tích hợp, regression và bật C2

Leader review diff từng owner, tích hợp Core/contract → Frontend → test additions theo checkpoint hợp lệ. Merge/push là hành động riêng, chỉ thực hiện khi có chấp thuận rõ của người dùng. Sau mỗi lượt tích hợp chạy lại suite liên quan trên **checkout Leader**, không dùng kết quả nhánh riêng thay bằng chứng tích hợp.

Chỉ thêm C2 vào PLAYABLE để phát hành sau acceptance; nếu browser QA cần đi qua menu thật, bật C2 trên candidate build đang kiểm thử sau M4 và không ghi “đã release” trước M5. Không mở C3–C5 để làm test pass.

## 7. Thiết kế UX và hình ảnh không được đánh đổi

- Tọa độ nền theo native metadata, không ép về placeholder cũ. Overlay cùng transform với nền tại (0,0); đo vùng đi/obstacle/occlusion và footY theo nền A.
- Không nhầm item ID underscore của content với asset filename kebab-case; dùng resolver/map tường minh, không thay hàng loạt bằng replace.
- S1 cửa sổ vừa chứa mảnh giấy vừa liên quan exit legacy: phải tách vùng bấm/nhãn và tránh arrow che đồ; có thể biểu diễn lối sang kho bằng nút điều hướng rõ, không bịa thêm cửa trong art.
- NPC đứng ngoài vùng cần nhặt/chạm; pose có visible bounds khác nhau không được nhảy chân hoặc kéo méo. Không cố làm cả canvas thành chiều cao thân.
- UI order có nút thêm/bỏ/trái/phải; không bắt kéo-thả trên điện thoại. Brief, ba hint, answer và ảnh phải thống nhất; không phạt thử sai, không reset cả phòng khi nhập sai.
- Chứng cứ có bản đọc HTML và focus/modal rõ; giữ font/chữ/màu theo design system hiện có, không dùng font pixel nhỏ cho đoạn dài.
- Màu không quyết định đúng/sai bài phối nếu brief không nói; phản hồi chỉ ra phần áo/phụ kiện còn thiếu, không phán xét phẩm giá người mặc.

## 8. Bộ kiểm thử nghiệm thu tối thiểu

| Nhóm | Bằng chứng cần có |
| --- | --- |
| Đường thật | Fresh profile → Mở đầu/C1 → C2 → kết/Hub, không cấp vật bằng debug; thêm fixture C1 hoàn tất để chạy C2 nhanh |
| Năm puzzle | Happy path và sai/thiếu/trùng/vật lạ; command sai room/side/chapter, early exit/present/styling/complete/claim |
| Save | Order draft, từng node hai giấy, trước/sau present, borrowed styling draft, complete chưa claim, claimed reload |
| Loan | Xóa quyền sở hữu cả ba đáp án khỏi fixture; chơi ở số dư không đủ mua; không đổi wallet/closet trước claim; từ chối lưu/mặc đồ mượn ngoài challenge |
| Reward/history | Delta C2 đúng 100; union quà đúng; double submit/claim/reload/undo/replay không farm; đọc thẻ riêng không lẫn delta chương |
| Legacy | Save C1 cũ giữ nguyên; claimed C2 cũ không cộng/trừ Sen lại; save ở S3 nhưng chưa đọc đủ giấy có đường quay lại/đọc an toàn, không tự hoàn thành |
| Art/UI | Đường dẫn resolve, không load _raw, không 404/console error, nhặt xong mất overlay, két state đúng, phối đồ đủ hướng |
| Thiết bị | 1440×900, 1280×720, 390×844, 844×390, 768×1024; keyboard/focus, reduced motion; Safari/macOS khi có môi trường |
| Regression | Mở đầu/C1, thoại reread, queue, reward, museum, draft và save lỗi theo hợp đồng hiện hành |

Lệnh đã có trong repo; Leader xác minh lại package.json trước khi chạy:

```sh
npm run lint
npm run test:core
node --import tsx --test src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts
node --import tsx scripts/validate-content.ts
npm run build
npm run test:assets
npx playwright test tests/browser/chapter1.spec.ts tests/browser/sprint01-integration.spec.ts tests/browser/chapter2.spec.ts
npm run test:browser
```

`chapter2.spec.ts` là đầu ra cần tạo, chưa phải suite đang tồn tại. Test C2 mới phải được nối vào lệnh chuẩn, không chỉ chạy thủ công rồi để ngoài CI. Dev áp TDD và đo coverage tối thiểu 80% trên phạm vi logic mới/sửa; ghi rõ phạm vi, không lấy coverage helper art làm coverage game.

Playwright có reuseExistingServer: mỗi báo cáo ghi commit, worktree, URL/port, build server và viewport. Khi dùng QA_BASE_URL, tự khởi chạy đúng production build của checkout cần test; không dùng server cũ của nhánh khác. Giữ timeout mặc định, dùng polling/đợi trạng thái thay fixed sleep; không tăng timeout hoặc xóa assertion để làm pass.

Không xóa localStorage thật của người dùng. Dùng browser context/save fixture riêng. Không thêm AI/network call vào đường chơi; thử full walkthrough khi tính năng AI và latVai tắt.

## 9. Handoff ngắn để tiết kiệm quota

Mỗi owner chỉ gửi báo cáo khi xong một gate hoặc bị chặn thực sự, theo mẫu:

```text
Mốc / baseline / worktree:
File đã sửa + commit cục bộ (nếu được phép):
Contract thay đổi: không / mục cụ thể:
Test thực chạy: PASS / FAIL / chưa chạy, kèm lệnh:
Bug/blocker: bước tái hiện + fixture/trace + owner cần xử lý:
Việc sẵn sàng cho vai trò tiếp theo:
```

Leader duy trì một checklist M0–M5 và một bug list có owner, severity, reproducer, regression test. Không yêu cầu mỗi agent đọc lại toàn repo hoặc viết lại story bible; chỉ đọc tài liệu và module thuộc phạm vi. Khi contract đổi, cập nhật một file contract và gửi delta cho consumer, không gửi cả lịch sử chat.

Definition of Done: năm puzzle, ba phòng và ending hoạt động trên đường thật; save/loan/reward/negative cases pass; art cuối được duyệt; quyết định quà phụ đã đóng; regression C1 không tăng; không P0/P1 làm kẹt, bypass hoặc mất dữ liệu; báo cáo release có commit/build và kết quả thực chạy. Nếu Safari/playtest người thật chưa có, ghi “chưa chạy”, không suy ra pass từ Chromium.

## 10. Prompt khởi động — paste vào Leader trước

```text
Bạn là Leader của sprint C2 — Tiếng Kéo Đêm Phố Cũ trong Nep-Remix.
Team đã có bốn worktree: Leader, Frontend, Backend/Core và Tester. Không tạo thêm agent/worktree và không gửi lệnh sang chat khác khi chưa được tôi cho phép.

Đọc docs/07-game/09-c2-leader-plan.md, các nguồn dẫn trong đó, contract Core hiện hành và manifest art C2 v4. Đây là kế hoạch triển khai, không phải bằng chứng game đã hoàn tất. Giữ nền A và tỷ lệ nhân vật đã chọn, không tự gen lại art hoặc mở C3–C5.

Trước hết thực hiện phần read-only của M0: kiểm tra baseline/dirty files/worktree, đối chiếu JSON C2 và API thật, liệt kê chênh lệch cần sửa, các quyết định pending và dependency. Tạo bản nháp c2-contract.md cùng checklist M0–M5 và ba prompt giao việc theo ownership cho Frontend/Core/Tester để tôi paste thủ công. Chưa sửa runtime hoặc thay đổi Git branch trong bước khởi động này.

Trong báo cáo đầu tiên, phải chỉ rõ: art chưa commit/chưa có trong các worktree khác; loan wardrobe chưa phải API hoàn thiện; dữ liệu C2 legacy còn khác docs; quyết định áo thưởng phụ thiếu layer và trạng thái duyệt art. Không tự bỏ quà hoặc tự coi proposal là đã duyệt.

Sau khi tôi xác nhận contract và quyền cập nhật baseline, điều phối triển khai từng lát cắt S1 → S2 → S3/kết, cho Frontend/Core/Tester làm song song đúng ownership. Giữ mô hình command/state hiện có, TDD cho dev, test độc lập cho Tester, không mua đồ/AI/flip để qua chương, reward 100 Sen idempotent theo docs. Mọi commit/merge/push phải trong quyền tôi đã cho; không reset hoặc ghi đè công việc của người khác.

Chỉ tuyên bố C2 hoàn tất khi đạt Definition of Done của kế hoạch và có kết quả thực chạy trên bản tích hợp. Bắt đầu bằng báo cáo M0 và các prompt giao việc, không chỉ trả một kế hoạch chung chung.
```
