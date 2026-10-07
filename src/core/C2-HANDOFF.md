# C2 Core checkpoint M1/M2

**Cập nhật M3–M4 ở cuối báo cáo.** Phần đầu giữ bằng chứng checkpoint M1.

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
