# C2 — hợp đồng triển khai (đã duyệt M0)

Ngày 07/10/2026. Đối chiếu `main@08a044e` cùng gói art, manifest **v4 / background A**. Chủ dự án xác nhận “acpt hết nhé” sau báo cáo M0: duyệt checkpoint, gallery và contract đích. **Được duyệt thiết kế không có nghĩa API đã triển khai.** Không sửa runtime trong M0 này. Nguồn scope: [kế hoạch Leader](09-c2-leader-plan.md), [bàn giao art](08-c2-asset-handoff.md), [quyết định dự án](../01-overview/decisions.md).

## 1. Baseline và ký hiệu

- **Có:** hành vi/API kiểm tra được trong source hiện tại.
- **Đề xuất:** hợp đồng đích cho Core/Frontend/Tester, chỉ triển khai sau khi thống nhất; không import tên helper đề xuất như thể đã tồn tại.
- **Chờ duyệt:** quyết định thuộc chủ dự án, không tự chọn bằng code.

| Có trong engine | Khoảng trống C2 thật |
| --- | --- |
| `Gate.all`: `puzzleSolved`, `dialogueCompleted`, `itemOwned`; `when`, `exitGates`, prerequisite puzzle | C2 JSON chưa gắn cổng, két còn ở `trai`, nhắc xoay/flip, S3 exit trỏ `prologue` không phải area |
| Evaluator order so chuỗi chính xác; draft lưu trong progress | PuzzleModal order còn fallback `interact`, chưa có UI ghép |
| Queue nhiều thoại, acknowledge mới cấp clue; reread không tiến trình | Intro C2 chưa được nối; thiếu `d-c2-ending` trong content/enum |
| Complete kiểm đủ puzzle và `completionDialogueId` nếu khai báo; claim có ledger | Reward JSON C2 vẫn 120 Sen; styling còn yêu cầu áo vàng mỡ gà |
| Studio có guard equip theo sở hữu; save/migration/history có sẵn | Chưa có loan context; submit styling chưa kiểm quyền mặc; preset chưa kiểm mọi phụ kiện; `closet/saveOutfit` cho qua payload có garmentId mà không kiểm sở hữu |

Validator hiện pass cấu trúc không chứng minh C2 reachable/playable. UI chỉ bật `prologue`, `c1`; C2 vẫn chưa playable. Không bật C3–C5 trong sprint này.

## 2. ID và cổng ba phòng / năm puzzle

Giữ ID content underscore của item, không đổi theo slug asset. Viết ngắn trong bảng:

```text
S1 = c2-s1-gac-lung-ve-tranh
S2 = c2-s2-kho-vai-hang-dao
S3 = c2-s3-phong-trien-lam-doi-dau
P1 = p-c2-sketch-assemble
P2 = p-c2-safe-open
P3 = p-c2-present-receipt
P4 = p-c2-present-sketch
P5 = p-c2-styling-loan
D0 = d-c2-ca-nghi
D1 = d-c2-mat-ma
D2 = d-c2-bien-lai
D3 = d-c2-giao-keo
D4 = d-c2-ending                 # mới, cần thêm enum/content
G1 = D0 completed AND P1 solved AND D1 completed
G2 = G1 AND P2 solved AND D2 completed AND D3 completed
```

Tất cả puzzle/đồ nhặt bắt buộc ở `phai`; `latVai=false`. Gates Core kiểm cả command trực tiếp, không chỉ UI ẩn hotspot.

| Tác vụ | Điều kiện đích (Đề xuất) | Outcome |
| --- | --- | --- |
| Vào C2 | C2 unlocked từ C1; không được vào nếu locked | S1 lần đầu; enqueue D0, không duplicate active/queued/completed |
| Nhặt bốn mảnh / mở P1 | D0 completed, đúng S1/phai | Nhặt từng ID duy nhất, không tự solve; draft có thể chưa đủ mảnh |
| Submit P1 | D0 completed, sở hữu cả bốn mảnh, thứ tự đúng | Solve P1, cấp bản vẽ, enqueue D1; chưa đọc D1 thì chưa sang S2 |
| S1 → S2 | G1 | Chuyển phòng qua exit thật; `unlockedAreaIds` không thay gate |
| Nhặt chìa / mở hoặc submit P2 | G1, đúng S2/phai; submit phải sở hữu chìa | Solve P2 cấp cả hai giấy nguyên tử, enqueue D2 rồi D3 |
| S2 → S3 | G2 | Một giấy đọc xong chưa đủ; mở modal chưa được tính completed |
| P3 trình biên lai | G2, đúng S3/phai, sở hữu `bien_lai_tra_no_goc_1935` | Chỉ đúng biên lai giải được; giấy không bị tiêu hao |
| P4 trình bản vẽ | G2 + P3 solved, đúng S3/phai, sở hữu `ban_ve_ao_dai_tan_thoi` | P4 solved; bản vẽ treo, Loan nhận quyền tác giả |
| P5 phối đồ | G2 + P3 + P4 solved, đúng S3/phai, quyền mặc hợp lệ | P5 solved, enqueue D4; không tự hoàn thành khi mới mở ending |
| Complete / claim | C2 hiện tại, cả năm puzzle solved, D4 completed; claim còn kiểm completed/ledger | Complete mở C3 về tiến trình, claim 100 một lần; C3 UI vẫn chuẩn bị |

Áp `when` vào cả pickup/hotspot và puzzle; `exitGates` bảo vệ chiều tiến. Core tái dùng `isGateSatisfied`/`guardPuzzle`, không tạo engine gate mới. Cổng G2 lặp ở các puzzle S3 để save legacy đang đứng S3 không bypass.

**Đề xuất điều hướng phục hồi:** S2 → S1 và S3 → S2 có exit back hợp lệ, không yêu cầu vượt cổng tiến lần nữa; Hub qua navigation hiện hữu, bỏ area exit `prologue`. `area/goBack` hiện chỉ kiểm stack có phần tử: cần regression cho stack legacy trỏ tiến/sai chương và sửa tối thiểu nếu bypass. Không xóa progress khi backtrack.

**Đề xuất entry/resume:** thêm `ChapterMeta.entryDialogueId?: DialogueId`, đặt C2 = D0, Core enqueue qua cơ chế queue hiện có. Không enqueue bằng React effect không idempotent. Vào lại C2 phải giữ phòng hợp lệ/draft/queue thay vì luôn về S1 như `chapter/enter` hiện tại; restore save giữ nguyên node thoại. Migration cho save C2 cũ chưa có D0 phải có chính sách tại mục 7, không tự đánh dấu đã đọc.

## 3. Command và draft ghép bản vẽ

Các command dưới đây **đã có**, giữ tên/payload:

```ts
{ type: 'chapter/enter', payload: { chapterId: 'c2' } }
{ type: 'area/goTo', payload: { areaId: 'c2-s2-kho-vai-hang-dao' } }
{ type: 'area/goBack', payload: {} }
{ type: 'puzzle/open', payload: { puzzleId: 'p-c2-sketch-assemble' } }
{ type: 'puzzle/updateDraft', payload: {
  puzzleId: 'p-c2-sketch-assemble',
  draft: { type: 'order', answer: ['manh_ban_ve_ao_dai_2'] }
} }
{ type: 'puzzle/resetDraft', payload: { puzzleId: 'p-c2-sketch-assemble' } }
{ type: 'puzzle/close', payload: {} }
{ type: 'puzzle/submit', payload: {
  puzzleId: 'p-c2-sketch-assemble',
  answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2',
           'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_4']
} }
{ type: 'dialogue/advance', payload: {} }
```

- Source of truth: `journey.c2.puzzleDrafts[P1]`; active puzzle session chỉ là phiên thao tác. Frontend gửi update sau thêm/bỏ/đổi vị trí, không chỉ khi đóng modal. Save dùng store/dispatch hiện hữu.
- Đáp án trái → phải 1–2–3–4. Khai báo `solution.sequence` tường minh, giữ `requiredItemIds` cả bốn để guard sở hữu. Reward item giữ `ban_ve_ao_dai_tan_thoi`, thoại giữ D1 nhưng sửa thành gợi ý đồng hồ, không thêm mã két.
- Có: draft guard kiểm discriminator/shape và vị trí/gate, chưa kiểm uniqueness/ID/sở hữu của từng phần tử. **Đề xuất:** riêng order C2, draft là dãy con không trùng của bốn mảnh đã nhặt; cho phép rỗng/thiếu/sai thứ tự để sửa dở. Từ chối ID lạ/trùng/chưa sở hữu, không mất draft cũ. Migration revalidate draft legacy, không tự solve.
- Submit thiếu/trùng/sai/ID lạ không solve/cấp đồ/đổi wallet. Phân biệt guard fail (`ok:false`, state không đổi) với đáp án sai hợp lệ: engine hiện có thể trả `ok:true`, event `puzzleFeedback` incorrect, state không đổi. UI/Tester đọc event + solved IDs, không coi mọi `ok:true` là giải đúng.
- Solve đóng matching puzzle session, reward/queue chỉ một lần. Đóng/reopen/reload giữ draft; reset chỉ draft puzzle này, không reset inventory/phòng.
- UI dùng bốn ảnh dải thật, nút thêm/bỏ/trái/phải và bàn phím; kéo-thả tùy chọn. Không xoay và không ép mỗi dải thành tên một bộ phận áo.

## 4. Loan wardrobe và challenge Studio (Đề xuất, chưa có API)

Core thêm khai báo `StylingPuzzle.loanWardrobe?: { garmentIds: string[]; accessoryIds: string[] }` có validate tham chiếu catalog. P5 cho mượn đúng:

```text
garmentIds:   [ao-dai-lemur]
accessoryIds: [khan-van-den, guoc-moc]
solution: silhouette=tan_thoi, garmentId=ao-dai-lemur,
          headwearId=khan-van-den, footwearId=guoc-moc
```

Màu tự chọn; không AI chấm, không kiểm màu/motif hoặc phụ kiện ngoài brief để quyết định đáp án. Nhưng mọi đồ được chọn vẫn phải tồn tại và được sở hữu/mượn hợp lệ; điều này khác với chấm đáp án.

API đích để hai owner thống nhất trước M1 (tên mới dưới đây **không được import ở baseline**):

```ts
getChallengeWardrobe(state: GameState, puzzleId: string, content: GameContent):
  | { ok: true; garmentIds: string[]; accessoryIds: string[];
      borrowedGarmentIds: string[]; borrowedAccessoryIds: string[] }
  | { ok: false; reason: string };

createChallengeStudioDraft(state: GameState, puzzleId: string, content: GameContent):
  | { ok: true; draft: StudioDraft }
  | { ok: false; reason: string };

// StudioDraft thêm challengePuzzleId?: string; quyền không lấy từ client allowlist.
```

- Helper kiểm puzzle styling hiện tại, chapter/area/side/gates/unsolved; allowed = catalog có thật ∩ (sở hữu vĩnh viễn ∪ khai báo loan puzzle). `borrowed*` chỉ là phần chưa sở hữu. Không cấp vào closet, không trừ/cộng Sen.
- Helper tạo/resume draft từ persistent puzzle draft đã revalidate; chọn default hợp lệ khi chưa có draft. Context chỉ mang ID, **không là capability đáng tin**. Core tái kiểm context bằng state/content mỗi lần equip, preset, đổi silhouette, resume, submit. Sai context/đồ không hợp lệ phải phản hồi rõ, không âm thầm grant.
- `Studio.tsx` đang chạy ScopedSession cục bộ, trong khi global session là PuzzleDraft. Dùng helper tạo local StudioDraft; giữ global puzzle session để `puzzle/updateDraft` hoạt động. Không gọi `studio/open` toàn cục đè puzzle, không tự dựng danh sách loan trong React.
- Persist styling vẫn dùng command có thật `puzzle/updateDraft` với `{type:'styling', answer: Record<string,string>}`; không nhét boolean/array vào answer. Loan list/context được tái dựng từ content và puzzleId, không lưu như sở hữu. Local undo/redo và bản nháp restore cũng phải revalidate.
- `puzzle/submit` P5 kiểm quyền mặc độc lập với UI, cùng gate, kể cả gửi answer trực tiếp. Studio thường không có context: chỉ được mặc đồ sở hữu, kể cả `initialGarmentId`, preset và phụ kiện trong preset.
- `closet/saveOutfit` phải kiểm catalog + sở hữu vĩnh viễn của áo **và mọi phụ kiện**, cả direct payload lẫn session. Không lưu bộ còn đồ mượn vào Closet; thoát challenge làm mất quyền mượn, không xóa đồ sở hữu. Sau reward, Lemur được mặc thường vì đã sở hữu; khăn/guốc không tự thành quà nếu reward không khai báo.
- Core sở hữu guard/helper/state/schema, Frontend sở hữu adapter `store.ts` và UI. Core không sửa store khi chưa được Leader giao lượt; báo chữ ký export thật + test trước khi Frontend nối.

## 5. Queue, overlay, ending

- P2 cấp `bien_lai_tra_no_goc_1935` và `ban_giao_keo_ep_hon` cùng một outcome; D2 → D3. Clue chỉ cấp sau acknowledge node, không từ inventory hoặc mở modal. Reload giữa hai giấy không nhân queue hoặc mất giấy thứ hai; reread không cấp clue/completion lại.
- Visual két dựa inventory/solved thật. Chưa solve: đóng; đã cấp giấy: rỗng. `--ket-mo` có giấy chỉ dùng reveal trước commit/close-up, không tạo nút collect mới. Nếu muốn tách nhặt giấy phải duyệt contract mới trước.
- **Đề xuất** thêm `StylingPuzzle.solution.dialogueTriggerId?: DialogueId`, tái dùng `applyPuzzleSolved` enqueue D4 khi P5 đúng; đặt `chapter.completionDialogueId = D4`. Enum + dialogue + trigger phải đi cùng, không để orphan. Không thêm puzzle thứ sáu.
- D4 giữ Loan chủ động: “Khoản nợ đã trả. Còn bản vẽ, tôi sẽ tự ký tên.” An hỗ trợ, không trao quyền thay cô. Chứng cứ/triển lãm gắn nhãn hư cấu; không gắn phẩm giá với kiểu áo. Chữ tên/chứng cứ bằng HTML, không đọc nét giả chữ trong PNG.
- UI completion effect chỉ dispatch sau năm puzzle + ending completed + queue/session sạch; Core vẫn là thẩm quyền complete/claim. C3 unlocked không đồng nghĩa C3 PLAYABLE.

## 6. Save, completion, reward và lịch sử

**Có:** `SAVE_KEY=tiem-may-nep-save-v1`, backup `-backup`, saveGame trả boolean, restore có status; autosave không ghi đè save hỏng/không hỗ trợ; replay riêng không được save/claim. Giữ các bảo đảm này, không triển khai reset UX mới trong C2.

- **Đích đã chốt trong kế hoạch:** `reward-c2.senNgoc=100`; không cộng/trừ lại khoản 120 của save legacy đã claimed. Claim nguyên tử/idempotent qua ledger `reward-c2`. Reward C2 không gồm +15 đọc thẻ; claim chỉ unlock card, đọc lần đầu là thao tác riêng theo contract hiện hành.
- Giữ reward garment IDs hiện tại trong lúc chờ quyết định: `ao-dai-lemur`, `ao-dai-tan-thoi-vang-mo-ga`; card IDs `card-phong-trao-ao-dai-lemur-1934`, `card-hu-tuc-tao-hon-ep-duyen`. Không âm thầm bỏ áo phụ hoặc cấp khăn/guốc thành quà.
- Delta C2 riêng = +100. Ví dụ profile đi W0/W1 không đọc thẻ/mua đồ: wallet 250 → 350. Double claim/reload/undo/replay không farm. Claimed cũ giữ wallet/ledger; repair quà phi tiền tệ theo migration policy được duyệt, không cộng Sen.
- Persist/restore phòng, side, inventory, solved, typed drafts, active dialogue node/mode, queue, ending/completed/claimed, ledger trên **mọi snapshot** history. Không chỉ migrate head; chưa đọc ending không tự đánh dấu completed.
- Content version hiện `sprint-01-core-1`; loader từ chối phiên bản khác. **Đề xuất** mốc `sprint-02-core-1` có migration nhận mốc cũ và save không version; giữ backup bytes gốc trước ghi. Phiên bản lạ vẫn bị từ chối. Không chỉ đổi constant khiến save C1 hợp lệ bị hỏng.
- Save error phải báo chưa lưu, giữ slot thật; test bằng context/fixture riêng, không xóa localStorage người dùng. Legacy C2 solved/ở S3 nhưng chưa đọc giấy/ending cần đường phục hồi, không dùng unlockedAreaIds bypass. Chi tiết xử lý xung đột cần duyệt mục 7.

## 7. Ghi nhận duyệt và cổng release

| ID | Quyết định / trạng thái sau xác nhận M0 | Giới hạn còn lại |
| --- | --- | --- |
| D-C2-01 | Chủ dự án duyệt gallery production-v4 / nền A | Không suy ra đã qua thẩm định văn hóa độc lập hoặc gameplay QA |
| D-C2-02 | Duyệt schema/helper/context loan ở mục 4 và guard Closet/Studio liên quan | Core triển khai RED→GREEN, công bố chữ ký thật trước Frontend; không fake loan |
| D-C2-03 | Giữ reward hiện tại theo phương án bảo toàn trong contract; chưa có chỉ định bỏ/đổi áo phụ | Cần bổ sung layer đúng áo trước nghiệm thu quà đầy đủ; chưa giao gen art trong M0. Không dùng layer Lemur giả áo phụ |
| D-C2-04 | Duyệt wording/ending đề xuất cho triển khai | Chưa có người thẩm định hoặc bằng chứng sử liệu VH04/VH05 mới; không ghi đã xác minh bản báo gốc |
| D-C2-05 | Duyệt phương án giữ tiền/solved/claimed lịch sử, không auto-read; cho đọc phục hồi rồi complete/claim theo cổng mới | Core phải có fixture cho queue/gifts legacy, không silently grandfather pending claim hoặc tự nhận thưởng |

Con số 100 và nền A giữ nguyên. Chủ dự án đã cho phép commit hai nhóm file M0; chưa cập nhật/merge ba worktree trong checkpoint này, không push. Áo phụ chưa có layer thì chưa được tuyên bố full reward QA đạt; duyệt contract không tạo ra asset còn thiếu.

## 8. Ownership và bàn giao

- Leader giữ bản contract này, baseline/commit inventory/tích hợp; Core gửi delta đề xuất hoặc patch contract để Leader cập nhật, tránh cùng ghi. `package.json` chỉ Leader nếu nối suite mới.
- Core: `src/core/`, `src/content/chapters/c2.json`, schema và catalog C2 liên quan, unit tests sát module. Không UI/browser/PNG. Không mở triển khai C3–C5.
- Frontend: `src/game/` **kể cả store.ts trong sprint C2**, `src/ui/`, CSS. Không schema/content/Core/PNG/registry. Gửi rect/spawn/exit cho Core áp JSON.
- Tester: `tests/browser/chapter2.spec.ts`, regression C2 mới trong `tests/`, báo cáo; được giao thêm riêng suite C2 trong `scripts/check-game.ts`/validator nếu cần. Không sửa runtime hay asset exporter. Không ghi đè các thay đổi cũ chưa commit.

Tích hợp theo Core API/content → Frontend consumer → Tester additions → chạy lại trên Leader. Chờ quyền Git, không tự merge giữa các worktree. C2 candidate chỉ được bật menu thật sau M4 để QA; release sau M5. Prompt chi tiết: [c2-agent-prompts.md](c2-agent-prompts.md). Checklist/baseline và exact inventory: [c2-startup.md](c2-startup.md).
