# C2 Core checkpoint M1/M2

**Mới nhất: xem “Native layout follow-up” ở cuối báo cáo.** Các phần trước
là bằng chứng lịch sử M1–M4; dependency geometry cũ được thay bằng báo cáo mới.

Baseline chính thức `main@10d1f88fe20f4577757ad6ce2311eb60d28f7db4`, merge
vào agent/core tại `5998e0baf963c82df95a5b0d4a9e6a3dc0deba80`, không conflict.
RED loan checkpoint `5266661`; gates/order RED checkpoint `2d58e18`.
Người dùng đã cho phép merge baseline và commit local công việc C2, không push.

## Đã có API thật

Export từ `src/core/index.ts` qua `commands/studio/index.ts`:

```ts
getChallengeWardrobe(state: GameState, puzzleId: string, content: GameContent):
  | { ok: true; garmentIds: string[]; accessoryIds: string[];
      borrowedGarmentIds: string[]; borrowedAccessoryIds: string[] }
  | { ok: false; reason: string };

createChallengeStudioDraft(state: GameState, puzzleId: string, content: GameContent):
  | { ok: true; draft: StudioDraft }
  | { ok: false; reason: string };

validateChallengeStudioDraft(state: GameState, puzzleId: string,
  draft: StudioDraft, content: GameContent):
  { ok: true } | { ok: false; reason: string };
```

`StudioDraft.challengePuzzleId?: string` là context phải revalidate.
Hai helper đầu đúng contract mục 4; helper validation bổ sung cho local history
đúng yêu cầu revalidate. Leader cập nhật contract để consumer dùng tên thật.
`validateStudioDraft`/`challengeDraftFromAnswer` cũng export nhưng adapter nên
dùng ba helper trên. Không tin allowlist client; không thay closet/wallet.

Ví dụ adapter Frontend (không sửa `src/game/` ở Core):

```ts
const opened = createChallengeStudioDraft(state, 'p-c2-styling-loan', content);
if (!opened.ok) return showError(opened.reason);
const local = createScopedSession(opened.draft, 'studio');
// Sau thao tác local / undo / redo, kiểm trước khi nhận candidate:
const check = validateChallengeStudioDraft(state, 'p-c2-styling-loan', candidate.current, content);
if (!check.ok) return showError(check.reason);
// Giữ global PuzzleDraft; persist string fields qua dispatch hiện có:
dispatch(tree, {type:'puzzle/updateDraft', payload:{puzzleId:'p-c2-styling-loan',
  draft:{type:'styling',answer:{silhouette:candidate.current.silhouette,
    garmentId:candidate.current.garmentId,
    headwearId:candidate.current.equippedAccessories.headwear ?? '',
    footwearId:candidate.current.equippedAccessories.footwear ?? '',
    jewelryId:candidate.current.equippedAccessories.jewelry ?? '',
    handheldId:candidate.current.equippedAccessories.handheld ?? '',
    color0:candidate.current.colorPalette[0],color1:candidate.current.colorPalette[1],
    color2:candidate.current.colorPalette[2],color3:candidate.current.colorPalette[3],
    ...(candidate.current.eventContextId !== undefined
      ? {eventContextId:candidate.current.eventContextId} : {}),
    motifId:candidate.current.motifId ?? ''}}}}, content);
```

Không gọi global `studio/open` thay puzzle. Không persist loan list/context
như sở hữu. Command Studio cũng revalidate; Closet luôn kiểm quyền vĩnh viễn,
cả direct payload và session. Sau claim Lemur sở hữu thật, khăn/guốc không
được grant thêm. Brief không chấm màu/motif/phụ kiện ngoài brief, nhưng mọi
món mặc đều phải có quyền và đúng slot/catalog.

## Đã GREEN

- D0/G1/G2 bằng `when`/`exitGates`, direct command và forward legacy goBack.
- Receipt → sketch → styling; két phai; order tường minh 1–2–3–4, không xoay/flip.
- Draft order unique subset đồ sở hữu; partial/wrong order hợp lệ; feedback sai
  giữ state. Entry D0 idempotent, resume giữ phòng/stack/draft/queue.
- Loan Lemur/khăn/guốc, equip/preset/silhouette/context/resume/direct submit
  guards; ordinary Studio và Closet chặn đồ mượn.
- Native size 1672×941 nền A, Hàng Đào/1935, ending trigger/content và completion
  dialogue, reward mới 100. Hai áo legacy giữ nguyên.

Lệnh thực chạy:

```sh
npm run lint
npm run test:core
node --import tsx --test --test-reporter=tap src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts
node --import tsx --experimental-test-coverage --test-coverage-include='src/core/commands/studio/challenge-wardrobe.ts' --test --test-reporter=tap src/core/c2-gates.red.test.ts src/core/c2-loan.test.ts
npx tsx scripts/validate-content.ts
npm run build
```

Tất cả PASS: 26 baseline, 53 C2 (36 cũ +17 loan); content `Valid:true`.
Coverage helper loan mới: lines 96.51%, branches 95.18%, functions 100%.
Phạm vi này **chưa** đại diện toàn bộ logic production đã sửa; sẽ đo phạm vi
mở rộng sau migration/M3–M4. Build có warning chunk >500kB.

## Việc tiếp theo / dependency

- M3–M4: fixtures queue từng node, migration mọi snapshot/version cũ+mới,
  claimed120/reread và legacy đang S3; guard complete/claim pending legacy
  không grandfather, history/replay không farm. Chưa nghiệm thu migration.
- Native rect/spawn/exit: chưa có bảng trong commit Frontend `7d1c1c8` hoặc
  worktree Frontend lúc kiểm tra. Đã hỏi đầu vào; chưa áp tọa độ placeholder
  như thể đo native. JSON notes ghi rõ phần đang chờ.
- Layer áo phụ thiếu vẫn chặn full reward art QA; không thay quà/art.
- Không merge Frontend; không bật menu C2/C3–C5; browser/tích hợp do Leader/Tester.
- Leader nối suite Node hai file C2 vào package scripts sau review, không sửa
  `package.json` từ Core. Đề xuất `test:c2:core` chạy hai file, mở rộng thêm
  migration suite ở checkpoint kế tiếp.

## M3–M4 Core GREEN (07/10/2026)

M1 GREEN commit `97c183d85703547c2c9e069a7b31e7e1a6771e7c`.
Migration RED commit `496ebab`: 4 FAIL/4 PASS trước sửa version/recovery/claim.
Ca bổ sung bắt lỗi replay thiếu D0 và queue legacy thiếu trường chọn D1 trước
intro: 2 FAIL trước sửa, sau sửa đều GREEN. Content strip labels: 1 FAIL/1 PASS
trước sửa catalog, sau sửa GREEN. Không nới 36 assertion gốc.

Đã hoàn thành logic:

- P2 cấp hai giấy nguyên tử; chỉ acknowledge mới cấp clue, queue D2→D3 giữ
  qua reload. P5 enqueue ending hai node; chưa đọc hết không complete/claim.
- Claim C2 kiểm lại chapter hiện tại, đủ puzzle/ending và gates đọc chứng cứ,
  kể cả legacy `status=completed`. Không grandfather pending claim.
- `CONTENT_VERSION='sprint-02-core-1'`; `fromJSON` nhận version này,
  `sprint-01-core-1` và unversioned, từ chối version lạ. Signature không đổi.
- Migration trên mọi snapshot: giữ room/navStack/solved/completed/claimed,
  wallet và reread mode. Typed order draft hợp lệ giữ nguyên; draft trùng/ID
  lạ/chưa sở hữu bị loại, matching session answer được vô hiệu hóa.
- Legacy C2 thiếu queue hoặc queue rỗng được enqueue intro và trigger chưa
  đọc theo thứ tự; giữ active node/mode và queue sẵn có, không auto-read.
  Repair chứng cứ đã earned từ solved P1/P2 khi engine cũ thiếu plural gifts.
- Legacy C2 mặt trái được chuyển sang `mat_phai` vì C2 v4 không hỗ trợ trái;
  không reset phòng hoặc tiến trình. Đây là normalization duy nhất của side.
- Claimed legacy120 giữ nguyên tiền/ledger, repair quà phi tiền tệ, không grant
  khăn/guốc từ loan. Pending legacy ở S3 đọc phục hồi rồi claim +100 được.
- Replay C2 riêng enqueue D0 để không softlock trước collect; reward vẫn chặn,
  không thay main tree. Không mở rộng reset/replay UX.
- Items bốn dải mang nhãn 1–2–3–4, bỏ cách gán từng mảnh cho cổ/thân/tay/chữ ký;
  clues/giấy hư cấu giữ ID cũ, sửa wording gợi ý vị trí và năm 1935.

### Adapter / contract delta gửi Leader và Frontend

1. Đánh dấu API mục 4 implemented; bổ sung `validateChallengeStudioDraft`
   với chữ ký ở trên cho local undo/redo/resume. `createChallengeStudioDraft`
   trả lỗi rõ nếu saved draft không hợp lệ, không âm thầm cấp đồ để resume.
2. Đánh dấu entry/ending/gates/schema/native size/reward100 implemented; rect
   hotspot/spawn/exit vẫn pending báo cáo Frontend. Không coi legacy rect là
   native đã nghiệm thu.
3. Đánh dấu version/migration mục 6/7 implemented với side normalization và
   phục hồi chứng cứ đã earned. Store nhận `migrated:true`, backup bytes gốc
   trước ghi; **không cần đổi signature hoặc SAVE_KEY**. Hai ca adapter thực
   chạy xác nhận backup nguyên bytes và lỗi backup không ghi đè slot gốc.
4. Leader nối package script, Core không ghi `package.json`:

```json
"test:c2:core": "node --import tsx --test src/core/c2-*.test.ts"
```

Nối script này vào suite chuẩn sau review. File `.red.test.ts` giữ tên để theo
dấu checkpoint RED nhưng toàn bộ 36 ca nay PASS, không exclude/skip.

### Verification cuối M3–M4

| Lệnh | Kết quả thực chạy |
| --- | --- |
| `npm run lint` | PASS |
| `npm run test:core` | PASS 15 checks + walkthrough/self checks |
| Node baseline 4 file nêu trên | PASS 26/26 |
| `node --import tsx --test --test-reporter=tap src/core/c2-*.test.ts` | PASS 80/80, không skip |
| `npx tsx scripts/validate-content.ts` | PASS `Valid:true` |
| `npm run build` | PASS; warning chunk >500kB |
| `npm audit --json` | PASS 0 vulnerabilities, gồm dev dependencies |

Walkthrough unit mới đi từ state khởi tạo qua toàn bộ Mở đầu/C1→C2 bằng
command thật, không seed inventory/solved C2: reload order partial/sai rồi
sửa, hai giấy, styling mượn Lemur, từng node ending, pending claim reload,
reward/reload. Wallet 250→350; cards chỉ unlock, không auto-read.

Coverage có threshold **80% lines/branches/functions**, trên 10 module Core
có production logic mới/sửa (tính cả code cũ trong các module, không chỉ các
dòng dễ cover): `closet-commands.ts`, `area-commands.ts`, `chapter-commands.ts`,
`draft-commands.ts`, `puzzle-commands.ts`, `reward-commands.ts`,
`challenge-wardrobe.ts`, `studio-commands.ts`, `chapter-replay.ts`, `serialize.ts`.
Kết quả tổng: **87.56% lines, 80.95% branches, 82.47% functions**. Đây là
threshold tổng của phạm vi trên, không tuyên bố từng file cũ đều ≥80%.
Schema/catalog JSON được kiểm bằng parse/validator/content regression,
không gộp vào runtime coverage; state type/export barrel không có logic.

Lệnh coverage đầy đủ, không cần cài dependency mới:

```sh
node --import tsx --experimental-test-coverage \
  --test-coverage-include='src/core/commands/studio/challenge-wardrobe.ts' \
  --test-coverage-include='src/core/commands/studio/studio-commands.ts' \
  --test-coverage-include='src/core/commands/closet/closet-commands.ts' \
  --test-coverage-include='src/core/commands/journey/area-commands.ts' \
  --test-coverage-include='src/core/commands/journey/chapter-commands.ts' \
  --test-coverage-include='src/core/commands/journey/draft-commands.ts' \
  --test-coverage-include='src/core/commands/journey/puzzle-commands.ts' \
  --test-coverage-include='src/core/commands/journey/reward-commands.ts' \
  --test-coverage-include='src/core/history/serialize.ts' \
  --test-coverage-include='src/core/history/chapter-replay.ts' \
  --test-coverage-lines=80 --test-coverage-branches=80 --test-coverage-functions=80 \
  --test --test-reporter=tap src/core/c2-*.test.ts \
  src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts \
  src/core/sprint-01.test.ts tests/leader-core-integration.test.ts \
  scripts/check-core.ts scripts/check-game.ts
```

### Chưa nghiệm thu / dependency còn lại

- Bảng rect/spawn/exit native chưa được gửi. Đã kiểm read-only cả Frontend
  `7d1c1c8` và `16778b3`: không có report tọa độ trong commit/worktree lúc kiểm.
  Core chưa tự đo từ placeholder hoặc lấy full-canvas overlay làm hit rect.
- Layer áo phụ vẫn thiếu; giữ cả hai reward garment IDs. Không tạo/đổi art.
- Chưa merge Frontend, chưa browser/gameplay QA trên bản tích hợp, chưa bật
  candidate/release C2. M2/M3/M4 nghiệm thu UI vẫn cần Leader/Frontend/Tester.
- `src/game/`, browser tests, PNG, registry, exporter và package không bị Core
  sửa trong các commit implement. Mọi thay đổi ngoài ownership chỉ đến từ
  merge checkpoint chính thức được người dùng cho phép.

## Review follow-up: event context và NPC/native geometry

Baseline `agent/core@fd64750`, worktree sạch lúc bắt đầu. RED context commit
`e391378`: 12 ca mới, 10 FAIL/2 PASS đúng lỗi mất context và chấp nhận ID lạ.

**API delta, signature giữ nguyên:** `challengeDraftFromAnswer` và
`createChallengeStudioDraft` nay giữ `eventContextId` trong StudioDraft khi
answer có trường này. Dùng `EventIdSchema` hiện có: `tet`, `dam_cuoi`,
`be_giang`, `le_chua`, `vieng_tang`, `dao_pho`. Trường vắng mặt vẫn trả draft
không event context, tương thích save/draft cũ; không cần bump version.

Context rỗng/ID lạ → `{ok:false,reason:'Unknown event context.'}`. Trường
không phải string bị chặn bởi shape validation hiện có. Lỗi từ helper được
propagate qua updateDraft/submit; giữ state/draft cũ. Saved answer có context
lạ cũng được helper trả lỗi rõ khi resume, không âm thầm đổi context hoặc
grant đồ. `validateChallengeStudioDraft` tái kiểm context cho local history;
`studio/selectEvent` kiểm candidate mới theo cùng schema.

Event context chỉ là lựa chọn sự kiện để hiển thị/evaluate; không tham gia
tạo allowlist hoặc mở gate. Quyền mượn vẫn từ puzzleId + room/chapter/side/
gates/unsolved + catalog/ownership. Không chấm thêm context vào brief P5.
Frontend persist `eventContextId` string hợp lệ nếu có, omit khi chưa chọn;
không gửi `''` làm sentinel. Ví dụ adapter ở đầu báo cáo đã bổ sung trường này.

**NPC/tọa độ:** xem [C2-GEOMETRY-HANDOFF.md](C2-GEOMETRY-HANDOFF.md).
Không thay `c2.json` bằng tọa độ suy đoán, không thêm hotspot giả. Core đã
gửi phương án NPC thuần hiển thị và mẫu bảng native cần nhận qua báo cáo;
chưa có xác nhận Frontend hoặc bảng đo đầy đủ tại thời điểm follow-up.

Verification follow-up thực chạy:

| Lệnh | Kết quả |
| --- | --- |
| `node --import tsx --test --test-reporter=tap src/core/c2-context.test.ts` | RED 10 FAIL/2 PASS → GREEN 12/12 |
| `node --import tsx --test --test-reporter=tap src/core/c2-*.test.ts` | PASS 92/92: 80 cũ +12 context, không skip |
| Node baseline 4 file ở trên | PASS 26/26 |
| `npm run test:core` | PASS 15 checks + game walkthrough/self checks |
| `npm run lint` | PASS |
| `npx tsx scripts/validate-content.ts` | PASS `Valid:true` |
| `npm run build` | PASS; warning chunk >500kB hiện hữu |
| `npm audit --json` | PASS 0 vulnerabilities, gồm dev dependencies |

Coverage riêng **hai module production sửa trong follow-up này**, tính cả
code cũ: `challenge-wardrobe.ts` + `studio-commands.ts`: **90.07% lines,
84.33% branches, 80.43% functions**, threshold tổng 80% cả ba PASS. Helper
riêng 98.90% lines/96.67% branches/100% functions. Phạm vi 10 module C2 đã
bàn giao trước cũng PASS: 88.60%/80.92%/83.77%. Không thay assertion cũ.

Lệnh coverage hai module thực chạy:

```sh
node --import tsx --experimental-test-coverage \
  --test-coverage-include='src/core/commands/studio/challenge-wardrobe.ts' \
  --test-coverage-include='src/core/commands/studio/studio-commands.ts' \
  --test-coverage-lines=80 --test-coverage-branches=80 --test-coverage-functions=80 \
  --test --test-reporter=tap src/core/c2-*.test.ts \
  src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts \
  src/core/sprint-01.test.ts tests/leader-core-integration.test.ts \
  scripts/check-core.ts scripts/check-game.ts
```

Không thay schema/save version, reward, gates, queue hoặc migration trong
follow-up này. Giữ tất cả thay đổi owner khác; không UI/store/browser/PNG/
registry/package delta. Bảng geometry và layer áo phụ vẫn là dependency.

## Native layout follow-up — Core ready for Leader integration, visual floor BLOCKED

Baseline `agent/core@b3f72468bf99aeb5c8a0b572b808bbe114bb5f7f`, clean before edits.
Worktree `/Users/thanhdanh/Nep-Remix-core`; main remains official `10d1f88`.
Read Frontend layout at **b6bb71a**, without merging that branch. Current change
owns only C2 JSON, adjacent Core layout tests and these two Core reports.
No C3–C5, UI/store/browser/assets/registry/package changes.

### Geometry and API delta for Leader / Frontend

Applied 11 pos/rect/radius, three spawns, four exit arrows to JSON. Verified
manifest v4 A 1672×941 and actual visible bounds. Corrections to measured table:
safe rect `(.739,.37,.201,.28)`, crowd/receipt rect `(.657,.44,.203,.39)`, hall
arrow `(.92,.76,.08,.14)` to avoid safe clicks; radii now cover arrived feet
under the supplied floor from both approaches. Piece4 stays separate from S1
exit, including expanded 44px targets. Full details and native feet table:
[C2-GEOMETRY-HANDOFF.md](C2-GEOMETRY-HANDOFF.md).

**API signatures at the top are unchanged and exported.** Existing b3f7246
context fix remains verified by 12 context tests: valid catalog enum retained
through close/reopen/reload, invalid payload returns an explicit error without
changing prior state. Missing context remains compatible. Context and client
allowlist cannot authorize loans. Equip/preset/resume/direct submit and both
Closet save routes retain their Core guards. Local ScopedSession is a generic
immutable helper: consumer must call `validateChallengeStudioDraft` on each
candidate, including undo/redo, before accepting/rendering/persisting it; it
does not magically validate room/gate without GameState/GameContent. Use the
adapter example above and surface `{ok:false,reason}` rather than force-default
an invalid saved draft. Ordinary Studio/Closet do not inherit challenge access.

**Frontend adapter requests (not implemented in Core ownership):**

1. RoomScene first entry must consume `area.spawn` instead of its current
   bottom-centre fallback; preserve reverse-arrow return placement.
2. `go/fire` must pass actual normalized arrived walker feet, not `i.pos`,
   including reduced motion. No Core command/payload signature change.
3. Fix C2 floor/obstacle/stand points: supplied floor [.58,.92] includes painted
   furniture; C2 has no `standClear` obstacles. S1 desk feet (510,546), S2 shelf
   (627,546), S3 P4 (359,546) reproduce visible furniture placement. Send updated
   measured feet/floor so Core can recheck radii. Current engine reachability
   is GREEN; physical placement/occlusion is **not accepted**.
4. Display-only NPCs from the layout report agree with separation from Core
   actions: c2-s1-loan, c2-s2-loan, c2-s3-ca-nghi, c2-s3-loan. Do not create the
   missing legacy NPC hotspot IDs as fake actions. Frontend owns render/poses.

Leader contract delta: record these implemented geometry values and adapter
requests; no schema, command or save version delta. Leader package delta:
include `src/core/c2-layout.test.ts` in C2 suite (the existing proposed
`node --import tsx --test --test-reporter=tap src/core/c2-*.test.ts` picks it up).
Core does not edit shared contract or package scripts.

### Progress/save/reward guarantees preserved

Compared JSON structurally with b3f7246 after removing geometry fields: exact
match, including full D0/G1/G2, five puzzle prerequisites, queue/ending, IDs,
reward and chapter metadata. Runtime migrations unchanged. Regression suites
cover stale unlockedAreaIds/navStack, legacy S3 gates, queued two-paper nodes,
head/history migration, reread/backup recovery and context drafts. No migration
bump required for coordinates; saves keep main progress, drafts and queue.

New claim remains +100 once. Card-read +15 is separate; claimed legacy +120
wallet/ledger stay untouched. Loan grants no closet items or wallet. No auto-read,
auto-complete, reward replay or purchase/AI/latVai dependency. Keep both reward
garments. Missing secondary yellow garment layer remains **BLOCKED** for full
reward-art acceptance; do not substitute Lemur or silently remove the reward.

### TDD / verification actually run

RED `8820dea`: layout 13 FAIL/0 PASS before production edits; lint compiles.
RED `5f52de7`: safe/hall 44px overlap FAIL. RED `58a8f23`: manifest containment
FAIL (safe then receipt after safe correction). GREEN: 15 layout tests PASS,
checking actual walker tick/standClear/targetFor from both approaches, real
interact guard at arrived feet, far-away rejection, native bounds, spawns and
expanded touch separation. No old assertions weakened; expected design tuples
reflect the documented corrections. The Node harness executes real walker code
with only its unused Vite atlas import omitted, using existing esbuild. It does
not test DOM rendering, furniture not registered as obstacles, or browser UI.

| Command actually run | Result |
| --- | --- |
| `node --import tsx --test --test-reporter=tap src/core/c2-*.test.ts` | PASS 107/107 (92 existing +15 layout), no skips |
| `node --import tsx --test --test-reporter=tap src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts` | PASS 26/26 |
| `npm run test:core` | PASS 15 core checks + game walkthrough/self checks |
| `npm run lint` | PASS |
| `node --import tsx scripts/validate-content.ts` | PASS `Valid: true` |
| `npm run build` | PASS; existing >500kB chunk warning |
| `npm audit --json` | PASS 0 vulnerabilities, including dev |
| Coverage command in M3–M4 section above (same 10 include paths, threshold 80 for lines/branches/functions; now includes layout via glob) | PASS 135/135; 88.60% lines /80.92% branches /83.77% functions |

Coverage scope: ten Core production modules changed earlier in this sprint,
including wardrobe, Studio/Closet, gates/navigation/drafts/puzzles/reward,
serialize/replay. Aggregate threshold passes; **not every individual module**
is above 80%. This follow-up changes content geometry only, no runtime logic;
JSON is not instrumented, and 15 geometry cases are reported separately. No UI,
render/walker coverage or browser acceptance is inferred from Core coverage.

Next dependency: Leader integrates Core checkpoint; Frontend consumes corrected
layout and resolves the three walker adapter issues; Leader integrates candidate;
Tester runs full actual path/browser/device/visual/save acceptance. These Core
results do not declare C2 complete. No push or other owner branch merge performed.
