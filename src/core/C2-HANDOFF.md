# C2 Core checkpoint M1/M2

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
