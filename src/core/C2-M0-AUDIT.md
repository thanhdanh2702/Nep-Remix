# C2 Core — M0 audit / RED handoff

Ngày 07/10/2026. **Chưa triển khai runtime; checkpoint audit/RED cục bộ.** Phạm vi chỉ C2,
ba phòng/năm puzzle ID cũ. Người dùng yêu cầu audit/đề xuất/RED nếu checkpoint
chung hoặc art/docs chưa có trong worktree; không tự merge/cherry-pick.

## Baseline và blocker khởi động

- `git status --short` lúc bắt đầu: sạch.
- Core `agent/core`: `38ed058c0f91a171721951c72c4274eef9a869bb`.
- Leader `main`: `10d1f88fe20f4577757ad6ce2311eb60d28f7db4` (docs M0).
- Asset checkpoint A: `59671f5533e17e86dda40598b523774bade03ad7`.
- Frontend: `0f01922`; Tester: `cd18e81`, theo `git worktree list` lúc audit.
- Worktree Core chưa có bốn tài liệu C2 được yêu cầu hoặc manifest/art v4.
  Đã đọc bản trên `main` bằng `git show`, không cập nhật worktree khác.
- `c2-startup.md` ghi rõ commit A/B được duyệt, cập nhật/merge worktree là bước
  riêng chưa thực hiện. Chưa có xác nhận Leader về SHA chung cho ba worktree.
  `main@10d1f88` là checkpoint quan sát được, chưa tự coi là baseline đã nhận.
- Contract trên `main` **đã duyệt M0**, gồm D-C2-02/04/05; không xin duyệt lại
  loan/ending/migration policy đã chốt. Các API đích vẫn chưa triển khai.
- Manifest v4 còn ghi gallery chờ sign-off trong khi docs M0 mới hơn ghi đã
  duyệt. Leader/asset owner xử lý metadata này; Core không sửa manifest.
- D-C2-03 giữ cả hai reward garments. Layer đúng áo vàng còn thiếu theo docs;
  `missingRequiredArt: []` trong manifest không đóng blocker nghiệm thu quà.

**Để bắt đầu GREEN:** Leader xác nhận/đưa checkpoint chung vào worktree bằng
quy trình Git được phép. Core không tự merge. Người dùng đã cho phép commit
audit/RED bằng yêu cầu “commit đi”; chưa có quyền cập nhật checkpoint chung.

## Đối chiếu source trước đổi hợp đồng

| Source hiện tại | Contract đích / ca RED |
| --- | --- |
| C2 chưa khai báo `when`/`exitGates` | D0 trước collect/P1; G1 trước S2/key/safe; G2 trước S3/receipt |
| `area/goBack` chỉ kiểm stack không rỗng | Kiểm target thuộc chapter, adjacency và gate như goTo; unlocked legacy không bypass |
| Draft order chỉ kiểm array string | Unique subset của bốn mảnh đã sở hữu; rỗng/thiếu/sai thứ tự hợp lệ |
| Safe hotspot mặt trái | Mặt phải; không flip/code; sau G1 và có chìa khi submit |
| P3/P4/P5 chưa có thứ tự | Receipt → sketch → styling, có G2 |
| P5 dùng áo vàng; chưa loan/context | Lemur/khăn đen/guốc mượn có scope; không cấp closet/wallet |
| C2 chưa có D4/completionDialogueId | P5 enqueue ending; đủ năm puzzle và đọc ending mới complete |
| chapter/enter reset phòng/stack, không enqueue D0 | Entry idempotent; resume giữ phòng/stack/draft/queue |
| Reward C2 120 Sen | Claim mới +100; claimed legacy giữ tiền và ledger |
| Loader chỉ nhận `sprint-01-core-1`/unversioned | Nhận cũ+mới, migrate mọi snapshot, không auto-read hoặc tự claim |
| JSON vẫn Hàng Gai, logical 800×500, hint xoay | Hàng Đào/1935; bốn dải trái→phải 1–2–3–4; native rect từ Frontend |

Không áp rect placeholder. Manifest dùng asset ID kebab; game item ID vẫn
underscore. Frontend gửi hit rect/spawn/exit theo native art, Core mới áp JSON.

## API gửi Leader / Frontend trước consumer

**Đang có:** `puzzle/open`, `puzzle/updateDraft`, `puzzle/resetDraft`,
`puzzle/submit`, `chapter/enter`, `chapter/complete`, `reward/claim` qua
`runCommand`/`dispatch`; `StudioDraft` chưa có `challengePuzzleId`.
Hai helper dưới đây là chữ ký đích đã duyệt trong contract, **chưa export**:

```ts
getChallengeWardrobe(state: GameState, puzzleId: string, content: GameContent):
  | { ok: true; garmentIds: string[]; accessoryIds: string[];
      borrowedGarmentIds: string[]; borrowedAccessoryIds: string[] }
  | { ok: false; reason: string };

createChallengeStudioDraft(state: GameState, puzzleId: string, content: GameContent):
  | { ok: true; draft: StudioDraft }
  | { ok: false; reason: string };
```

Ví dụ consumer sau khi Core cung cấp export thật: gọi helper với
`p-c2-styling-loan`; nếu `ok:true`, dùng draft cho ScopedSession cục bộ, giữ
global PuzzleDraft. Persist bằng `puzzle/updateDraft` với
`{puzzleId:'p-c2-styling-loan', draft:{type:'styling',answer:{silhouette:'tan_thoi',
garmentId:'ao-dai-lemur',headwearId:'khan-van-den',footwearId:'guoc-moc'}}}`.
Không gọi global `studio/open` đè puzzle; không lưu allowlist thành ownership.

**Delta đề xuất cần Leader xác nhận trước consumer:** bổ sung helper thuần
để Frontend tái kiểm local undo/redo/resume, tránh tự viết guard trong React:

```ts
validateChallengeStudioDraft(
  state: GameState, puzzleId: string, draft: StudioDraft, content: GameContent,
): { ok: true } | { ok: false; reason: string };
```

Helper không sửa draft/state; kiểm context hiện tại, catalog, silhouette và
toàn bộ áo/phụ kiện. Command Studio/preset/equip/direct submit và Closet vẫn
phải tự guard, không tin kết quả UI. Tên/path export cuối cùng sẽ được công bố
kèm GREEN; Frontend chưa import đề xuất này. Cần thống nhất serialization màu
`color0`–`color3`/motif nếu UI persist các trường đó, mọi giá trị là string.

Draft P1: `{type:'order',answer:['manh_ban_ve_ao_dai_3']}` hợp lệ nếu đã sở hữu
mảnh 3 và qua D0. Trùng/ID lạ/chưa sở hữu: `ok:false`, giữ draft cũ. Submit sai
thứ tự/thiếu/ID lạ với đủ inventory: `ok:true` + `puzzleFeedback/incorrect`,
không solve/reward. Thiếu inventory hoặc sai room/side/chapter/gate: guard
`ok:false`. Frontend đọc event và solved IDs, không coi mọi `ok:true` là solve.

**Adapter delta cho `src/game/store.ts` (Frontend sở hữu):** giữ SAVE_KEY và
backup gốc, `fromJSON` result union hiện có và `migrated` flag. Core dự kiến
version `sprint-02-core-1`, nhận unversioned/`sprint-01-core-1` và version mới;
version lạ từ chối. Khi migration đổi bất kỳ snapshot nào, trả `migrated:true`
để store backup bytes trước write. Store hiện đã xử lý flag/backup và chống
save hỏng; chưa thấy cần đổi signature. Cần Tester/Frontend xác minh reload,
write failure, protected slot trên baseline chung. Không mở reset UX mới.

## TDD evidence M1 chuẩn bị

File mới `src/core/c2-gates.red.test.ts`; không sửa test cũ hay runtime.

```sh
node --import tsx --test --test-reporter=tap src/core/c2-gates.red.test.ts
```

Đã chạy, exit 1: **36 tests, 13 PASS, 23 FAIL**, không skip. Typecheck PASS.
RED là assertion nghiệp vụ, không phải lỗi dependency/compiler. Các ca:

- D0: bốn direct pickup, hotspot pickup, P1 open — FAIL.
- G1/G2: forward exit với unlocked legacy, forward goBack, key — FAIL.
- Safe right-side open và atomic papers/queue/save — FAIL do hotspot còn trái.
  Negative safe submit trước G1 hiện PASS nhờ sai side, chưa chứng minh gate;
  phải chạy lại sau khi chuyển hotspot phải.
- G2 đủ hai giấy, receipt→sketch→styling, ending trước completion — FAIL.
- Order draft unknown/duplicate/unowned — FAIL; ba draft hợp lệ — PASS.
- Bốn submit order sai không solve, unowned guard và wrong room/side/chapter
  — PASS (đối chứng cho contract feedback hiện có).
- Intro idempotent/resume và giữ room/stack/drafts/queue — FAIL.
- Claim mới — FAIL đúng `120 !== 100`; claimed legacy/save giữ 220 và không
  auto-read ending — PASS. Claim mới fixture chỉ thêm D4 nếu catalog có D4,
  tránh unknown-dialogue invariant che mất regression tiền thưởng.

Reproducer ngắn: currentChapter c2, S1, `unlockedAreaIds=[S1,S2,S3]`,
`navStack=[S2]`, chưa đọc D0/D1, gọi `area/goBack` → hiện `ok:true` vào S2.

Lệnh gửi Leader nối suite chuẩn sau GREEN: lệnh Node ở trên; không đổi
`package.json`. Tên `.red.test.ts` hiện cố ý báo suite chưa đạt, không nối vào
release checks rồi bỏ qua lỗi.

## Verification thực chạy trên HEAD Core cũ

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | PASS, sau sửa type narrowing trong test mới |
| `npm run test:core` | PASS: 15 checks + game walkthrough/self checks |
| `node --import tsx --test --test-reporter=tap src/core/dialogue-reread.test.ts src/core/replay-audit.test.ts src/core/sprint-01.test.ts tests/leader-core-integration.test.ts` | PASS 26/26 |
| `npx tsx scripts/validate-content.ts` | PASS `Valid:true` trên content legacy |
| `npm run build` | PASS; có warning chunk >500 kB hiện hữu |
| C2 RED suite | FAIL có chủ đích: 23/36; 13 đối chứng PASS |
| Coverage ≥80% logic mới/sửa | Chưa đo: chưa có thay đổi production, chưa GREEN |
| `npm audit --json` | PASS trước commit: 0 vulnerabilities, gồm dev dependencies |

Dependencies lấy từ node_modules của worktree Leader qua symlink tạm, gỡ sau
kiểm tra. Build/validator PASS chỉ xác nhận baseline cũ, không nghiệm thu art
v4 hoặc gameplay C2 mới. Không browser test. Audit dependency chạy sau khi
người dùng cho phép commit; không thay dependency/lockfile.

## Bàn giao theo milestone

- M0: checkpoint audit + RED gồm hai file mới thuộc `src/core/`; không
  runtime/schema/content delta, không API mới thật, không push/merge.
- M1: chờ checkpoint chung. Tiếp theo loan/catalog guards, local history,
  session/direct Closet, Studio thường, migration toàn snapshot và reread
  fixtures; đo coverage ≥80% trên module/nhánh production thực sửa.
- M2: chờ M1 và native rect Frontend; walkthrough D0→pieces→P1→D1→S2.
- M3: chờ M2; safe mặt phải, key, atomic papers, ack clues, reload queue→S3.
- M4: chờ M3; receipt→sketch→Lemur→ending→complete/claim100, legacy120 giữ;
  reward art còn blocker áo phụ. Không bật menu/candidate/release từ Core.

Leader cần nhận delta helper validation ở trên và xác nhận baseline chung.
Không yêu cầu duyệt lại thiết kế đã duyệt; commit audit/RED theo quyền mới
của người dùng, không mở rộng quyền sang merge hoặc triển khai runtime.
