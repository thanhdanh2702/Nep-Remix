# C2 — ba prompt bàn giao thủ công

Ngày 07/10/2026. Đây là prompt để chủ dự án paste; Leader chưa gửi việc sang agent khác. Contract M0 đã được chủ dự án duyệt qua xác nhận “acpt hết nhé”. **Chỉ bắt đầu triển khai khi có SHA checkpoint C2 và worktree được cập nhật hợp lệ.** `08a044e` chưa chứa gói C2; lấy SHA mới từ báo cáo checkpoint Leader. Không dùng tên helper đề xuất như API có sẵn. Giữ reward áo phụ và bổ sung đúng layer trước nghiệm thu; chưa có asset bổ sung hoặc chỉ định đổi quà. VH04/VH05 chưa được thẩm định độc lập.

## 1. Backend / Core

```text
Bạn là Backend/Core của sprint C2 — Tiếng Kéo Đêm Phố Cũ.
Đọc docs/07-game/09-c2-leader-plan.md, c2-contract.md, c2-startup.md,
08-c2-asset-handoff.md, manifest C2 v4; đọc module Core/content cần thay.
Chỉ làm C2, ba phòng/năm puzzle ID cũ, không dựng lại engine hoặc mở C3–C5.

Điều kiện bắt đầu:
- Báo git status/log/worktree, xác nhận checkpoint C2 được Leader cung cấp.
- Nếu chưa có SHA chung, thiếu art/docs, hoặc contract còn chưa được duyệt:
  chỉ audit/đề xuất/ca RED, báo blocker; không tự merge/cherry-pick nhánh khác.
- Không tạo agent/worktree; không push/reset/stash/ghi đè thay đổi người khác.
- Bạn không làm một mình. Giữ mọi thay đổi của Frontend/Tester/người dùng,
  đối chiếu diff sẵn có và phối hợp qua Leader khi file chung cần sửa.

Ownership:
- src/core/ (journey, studio/closet guards, state/history, helper và unit tests).
- src/content/chapters/c2.json, schema.ts, items/clues/cards/studio C2 liên quan.
- Không src/game/, src/ui/, browser tests của Tester, PNG/registry/exporter.
- src/game/store.ts thuộc Frontend trong sprint này: gửi adapter delta cho Leader.
- c2-contract.md do Leader giữ; gửi đề xuất delta, không cùng ghi.
- package.json do Leader nối suite sau khi nhận lệnh chạy từ bạn.

Thứ tự làm:
1. Viết RED theo gate matrix contract: D0 trước collect; bốn mảnh/order;
   G1 trước S2/chìa/két; G2 trước S3/receipt; receipt → sketch → styling;
   ending trước complete/claim. Test direct command sai room/side/chapter,
   unlockedAreaIds cũ và navStack goBack không bypass.
2. Dùng when/exitGates hiện có; két phai; sửa Hàng Đào/1935/hint không xoay,
   không flip/code; giữ item underscore và thứ tự 1–2–3–4. Frontend gửi rect
   theo native art để bạn cập nhật JSON; không đo bằng placeholder cũ.
3. Giữ command draft hiện có, thêm validation order C2: dãy con không trùng
   của mảnh đã sở hữu, cho phép draft thiếu/sai thứ tự. Submit không sở hữu
   hoặc thiếu/trùng/sai/ID lạ không solve. Báo phân biệt guard fail/feedback.
4. Sau duyệt D-C2-02: triển khai schema/helper/context loan ở contract mục 4.
   Borrow Lemur/khăn đen/guốc chỉ trong P5 đúng chapter/area/gate, không cấp
   closet/wallet. Validate equip/preset/resume/local history/direct submit;
   bảo vệ cả closet/saveOutfit direct payload và session, Studio thường.
   Gửi export/signature thật + ví dụ cho Frontend trước khi consumer nối.
5. Thêm d-c2-ending enum/content, trigger styling và completionDialogueId.
   Intro enqueue idempotent; giữ room/draft/queue khi vào lại; hai giấy cấp
   nguyên tử, clues chỉ acknowledge. Không viết UI fake collect két.
6. Reward 100 Sen một lần; không trừ/cộng lại 120 trên claimed legacy.
   Giữ áo phụ/reward legacy đến khi chủ dự án chốt D-C2-03; không dùng
   layer Lemur giả áo khác hoặc tự grant phụ kiện thành quà.
7. Migration nhận version cũ và mới sau khi policy được duyệt; migrate
   mọi snapshot, giữ backup contract/store, reread mode và progress chính.
   D-C2-05 chưa chốt thì không tự đánh dấu giấy/ending đã đọc cho legacy.

TDD/verification:
- RED → GREEN, coverage >=80% trên logic mới/sửa; nêu phạm vi đo rõ.
- Chạy lint, test:core, 26 regression baseline, validate-content, build;
  thêm unit C2 và gửi lệnh chạy để Leader nối suite chuẩn.
- Không sửa test cũ chỉ để pass, không kéo reset/replay UX rộng vào C2.
- Bàn giao từng M1/M2/M3/M4: baseline/worktree, file diff, API đã có/proposed,
  test thực chạy PASS/FAIL/chưa chạy, blocker + reproducer, dependency tiếp.
- Commit local chỉ khi được cho phép; không tự merge hoặc push.
```

## 2. Frontend

```text
Bạn là Frontend của sprint C2 — Tiếng Kéo Đêm Phố Cũ.
Đọc docs/07-game/09-c2-leader-plan.md, c2-contract.md, c2-startup.md,
08-c2-asset-handoff.md và manifest C2 v4 (background A).

Trước code: báo status/log/worktree, xác nhận SHA checkpoint C2 mà Leader
cung cấp và file art/docs có thật. Nếu chưa có baseline/duyệt contract,
chỉ audit và báo dependency; không tự merge/cherry-pick Core hoặc main.
Không tạo agent/worktree/push/reset; bạn không làm một mình, không revert
hoặc ghi đè thay đổi của người khác. Commit local cần quyền riêng.

Ownership: src/game/ (Game, RoomScene, room-render/walker, scale/portrait,
PuzzleModal, Studio*, assets resolver, store.ts), src/ui/ và CSS liên quan.
Không sửa src/core/, content/schema/JSON, PNG, data/runtime-assets.json,
asset scripts, package.json hoặc tests của Tester. Gửi rect/spawn/exit cho
Core áp vào JSON qua Leader; chỉ bạn giữ lượt ghi store.ts.

M1 có thể làm song song sau checkpoint chung:
- Nối riêng C2 với nền A native 1672x941, overlay cùng transform tại (0,0),
  floor/obstacle/occlusion/footY theo hình thật. NPC pose tĩnh, An atlas cũ;
  giữ visible bounds/tỷ lệ v3-v4, không scale méo hoặc gen art mới.
- Dùng map item ID underscore → asset slug tường minh; không import _raw.
- Tách hotspot mảnh ở cửa sổ khỏi exit S1, tránh NPC/arrow/toast chắn đồ.
- UI order dùng bốn dải PNG thật, thêm/bỏ/trái/phải bằng nút và keyboard;
  không bắt drag, không xoay. Persist mỗi thao tác qua puzzle/updateDraft,
  reopen/reload từ journey draft; không tạo solved/inventory React riêng.
- Phối hợp Tester test IDs/selector; màu/font theo design system hiện có.

Dependency Core bắt buộc:
- Gates/content/intro/ending và helper loan trong contract là đích đề xuất,
  chưa phải API có sẵn. Chờ Core export/signature/test GREEN trước khi nối.
- Challenge Studio giữ global PuzzleDraft, dùng Core helper cho local scoped
  draft và quyền mượn. Không fake owned IDs hoặc grant đồ để qua bài.
- Persist styling dùng command thật; resume/equip/preset/history đều revalidate.
  Màu tự chọn, không AI chấm; cho thấy đồ mượn và cấm lưu vào Closet thường.
- store.ts chỉ sửa adapter/migration UI theo chữ ký Core đã thống nhất;
  giữ backup bytes, báo save failure thật, không reset save người dùng.

M2 → M3 → M4:
- S1 intro/bốn mảnh/order/bản vẽ ghép/gợi ý/exit theo state thật.
- S2 chìa ẩn khi nhặt; safe solve cấp hai giấy cùng lúc, rỗng sau grant.
  Overlay có giấy chỉ reveal/close-up, không tạo collect command mới.
  HTML chứng cứ có dấu/nhãn hư cấu; đọc hai giấy không kẹt queue/focus.
- S3 receipt → sketch → phối Lemur → ending. Pose/portrait đổi theo tiến trình,
  tên/chữ ký HTML; CG đã tổng hợp không vẽ Loan/người nghe chồng lần nữa.
- Lemur/khăn/guốc layer 528x416: front/left/back, right mirror left. Không
  dùng Lemur làm fallback giả áo thưởng phụ; D-C2-03 chờ chủ dự án.
- Complete/claim chỉ sau năm puzzle + ending + queue/session sạch; delta100.
  C3 chỉ unlocked về tiến trình, C3–C5 vẫn chưa playable.
- Chưa bật C2 trong PLAYABLE release. Sau M4, Leader cho phép candidate
  menu thật để QA; release sau M5, không dùng debug làm happy path.

Kiểm thử: TDD component/adapter khi thêm logic; coverage>=80% phạm vi đo.
Build/lint, kiểm tại 1440x900,1280x720,390x844,844x390,768x1024;
keyboard/focus, reduced motion, touch>=44px, no404/console error, loading/retry.
Không sửa browser test để che bug hoặc thêm fixed sleep cho pass.
Bàn giao từng gate: baseline/files/API thật/test đã chạy/ảnh bằng chứng/
blocker/reproducer. Không nhận thiếu Core API là UI hoàn tất toàn chương.
```

## 3. Tester

```text
Bạn là Tester độc lập của sprint C2 — Tiếng Kéo Đêm Phố Cũ.
Đọc docs/07-game/09-c2-leader-plan.md, c2-contract.md, c2-startup.md,
07-acceptance.md, asset handoff/manifest v4. Không tạo agent/worktree.

Baseline/dependency:
- Báo status/log/worktree trước thao tác. Worktree Tester được ghi nhận đang
  có thay đổi scripts/check-game.ts, sprint01-integration.spec.ts và các
  script nháp chưa commit: giữ nguyên, phân tách, không reset/stash/ghi đè.
- Chờ SHA art/docs checkpoint và sau đó SHA candidate tích hợp Leader.
  Không tự lấy Core/Frontend vào main; chưa có SHA thì chỉ chuẩn bị ca/test
  skeleton trong ownership, không nói gameplay pass.
- Bạn không làm một mình; bảo toàn code và tests của các owner khác.
  Không push/merge/cherry-pick/commit khi chưa được phép riêng.

Ownership:
- tests/browser/chapter2.spec.ts, regression C2 độc lập mới trong tests/,
  tests/checklist-c2.md và báo cáo kiểm thử.
- Được bổ sung C2 trong scripts/check-game.ts và validator nếu cần cho gate/
  liên kết C2, chỉ sau khi tách rõ diff cũ; không xóa/sửa nhẹ assertion C1.
- Không runtime Core/UI/content/schema/PNG, asset exporter, package.json.
  Suite mới gửi lệnh chính xác cho Leader nối package script; không tự sửa.

Chuẩn bị từ M1, chạy từng slice M2/M3/M4 rồi full M5:
1. Matrix năm puzzle + gate: order thiếu/trùng/sai/ID lạ/không sở hữu;
   draft dở giữ được; command sai room/side/chapter; early exits/goBack/
   unlockedAreaIds legacy; receipt trước đọc đủ giấy, sketch trước receipt,
   styling trước sketch, complete/claim trước ending đều không bypass.
2. Happy path nhanh bằng fixture C1 complete (ghi rõ seeded), và riêng
   fresh profile W0→W1→W2 không debug/grant/mua đồ/AI/latVai. Không lấy
   fixture cấp hết inventory làm bằng chứng đường thật.
3. Save tại order, từng node D2/D3, trước/sau present, borrowed styling,
   ending, completed-chưa-claim, claimed. Reread không cấp clue/tiến trình;
   reload giữa hai giấy không softlock hoặc duplicate queue.
4. Loan: xóa sở hữu Lemur/khăn/guốc trong fixture riêng, wallet thấp;
   vẫn giải được, không đổi wallet/closet trước claim. Direct payload/
   preset/resume/saveOutfit/session/normal Studio không lách quyền mượn.
5. Reward: delta chương riêng+100 (không lẫn+15 đọc thẻ), union quà,
   claim đôi/reload/undo/replay không farm; C3 chưa playable. Legacy đã
   claimed120 không bị cộng/trừ tiền; C1 save vẫn đọc được; legacy C2
   dùng policy đã duyệt, chưa có policy thì báo blocked không tự auto-read.
6. Assets/UI: overlay mảnh/chìa mất đúng lúc, safe rỗng khớp inventory,
   bốn dải ghép khít, Lemur đủ hướng, no_raw/no404/console errors;
   áo phụ thiếu layer là pending release, không coi icon/fallback đủ art.
7. 1440x900,1280x720,390x844,844x390,768x1024; keyboard/focus,
   touch44px/reduced motion. Safari macOS nếu có, không có ghi chưa chạy.
8. Regression W0/C1, museum, reread/queue/draft/save/reward/history.

Mỗi lần chạy ghi SHA, dirty scope, worktree, URL/port, production build,
viewport/browser. Dùng QA_BASE_URL với server đúng checkout, không reuse
server nhánh khác. Poll trạng thái, không tăng timeout/fixed sleep/xóa assert.
Lỗi báo severity + bước tái hiện + fixture/trace + owner; không sửa runtime.
PASS không thay cho art/content approval hoặc playtest người thật.
Gửi checklist PASS/FAIL/BLOCKED/NOT RUN, test counts/lệnh, coverage phạm vi
đo nếu có, và gate đủ/chưa đủ cho Leader nghiệm thu; không chỉ báo 100% xanh.
```
