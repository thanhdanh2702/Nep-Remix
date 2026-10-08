# C3 — Contract đích, M0 đã duyệt có giới hạn

Ngày khảo sát: 08/10/2026. Baseline `main@c6fc47f9d96de3494b2801af918d45f2d44f1479`.
Chủ dự án đã duyệt contract đích ngày 08/10/2026, trừ các mục chưa chốt. Đây chưa phải API/logic C3 đã triển khai. Không bật C3 từ tài liệu này.
Kế hoạch/checkpoint/ownership: [11-c3-leader-plan.md](11-c3-leader-plan.md). Prompt chưa gửi: [c3-agent-prompts.md](c3-agent-prompts.md).

## 1. Nguồn và giới hạn

Ưu tiên yêu cầu chủ dự án trong phiên này, rồi docs C3/handoff mới hơn wording legacy trong `src/content/chapters/c3.json`. Đã đọc `01-narrative.md`, `02-gameplay.md`, mục C3 `03-chapters.md`, `04-implementation.md`, `05-art-audio.md`, `06-cultural-review.md`, `07-acceptance.md`, `10-c3-asset-handoff.md`, `c3-asset-export-evidence.md`, design system, manifest và gallery production. C2 contract là tài liệu lịch sử; source tại baseline mới quyết định API nào có thật.

- Gia đình hư cấu tại Đa Kao, Sài Gòn, 1962; Mai 22 tuổi, tóc bob. Vinh làm chứng sau chứng cứ; không giải cứu/nói thay Mai. Bà Lớn búi thấp, trưởng thành; Thầy Ba Càn nam lớn tuổi.
- Ba cảnh, đúng ba puzzle. S1 không puzzle; máy hát chỉ thoại tùy chọn, không thêm audio. Không dùng bùa legacy làm điều kiện hoặc thêm nhiệm vụ nhặt bùa.
- Tất cả đường bắt buộc ở `phai`, progress dùng `mat_phai`, `latVai=false`. Không C4/C5, asset mới, animation mới hoặc đổi danh tính.
- Mô tả đường ráp raglan từ cổ về nách; không dùng góc 45° hoặc kiến thức bói toán làm chứng minh. Không lấy lá số “tốt” làm căn cứ phẩm giá Mai.

## 2. ID, gate matrix và outcome

Giữ ID item legacy để không phá save:

```text
S1 = c3-s1-tiem-may-da-kao
S2 = c3-s2-phong-phong-thuy
S3 = c3-s3-dinh-thu-doi-dau
I1 = bien_nhan_tien_thay_boi
I2 = so_tu_vi_nguyen_ban_1962
I3 = thu_tay_thoa_thuan_boi_toan
P1 = p-c3-bagua-lock
P2 = p-c3-present-evidence
P3 = p-c3-styling-mai
D1 = d-c3-mua-chuoc
DX = d-c3-street-exit
D2 = d-c3-bagua
D3 = d-c3-so-tu-vi
D4 = d-c3-thoa-thuan
D5 = d-c3-ban-sua                 # MỚI, cần enum + dialogue + hotspot
D6 = d-c3-vinh-stand
D7 = d-c3-ong-le-defeat
D8 = d-c3-ending                  # MỚI, cần enum + dialogue + trigger
A = owned(I1) AND completed(D1)
B = A AND completed(DX)
C = B AND completed(D2) AND solved(P1)
    AND owned(I2) AND owned(I3) AND completed(D3) AND completed(D4)
E = C AND completed(D5) AND solved(P2) AND completed(D6) AND completed(D7)
F = E AND solved(P3) AND completed(D8)
```

`completed` nghĩa là acknowledge hết node/nhánh nhập lại, không phải mở modal. `owned` ở inventory không suy ra đã đọc. Expand A/B/C/E/F thành `Gate.all` thật; không lưu chuỗi biểu thức hoặc eval.

| Thao tác | Điều kiện đích | Outcome / kiểm âm tính |
| --- | --- | --- |
| Vào C3 | status C3 đã unlocked từ complete C2; cùng policy entry hiện có | Fresh vào S1; resume giữ checkpoint hợp lệ. UI chưa PLAYABLE trước M4 |
| Collect I1 | Đúng S1/phai, item hotspot khả dụng, tương tác dùng chân thật | Cấp I1 duy nhất, ẩn overlay biên nhận; chưa được tính đọc D1 |
| Đọc D1 | S1/phai + owned(I1), hotspot đọc biên nhận | Queue/ack D1 cấp clue đúng node; không solve puzzle nào |
| Đọc DX | A, đúng S1/phai | Gợi bước sang phòng hồ sơ; chưa ack thì chưa qua exit |
| Exit S1 → S2 | B | `area/goTo`, không suy từ số puzzle (S1 bằng 0) |
| Đọc D2 | B, đúng S2/phai | Ghi chú “Càn trước, Tốn sau”; không dựa gương/phương vị |
| Open/submit P1 | B + completed(D2), đúng S2/phai | Hai ô chọn gửi `CAN_TON`; sai kiểu/mã không cấp đồ |
| Solve P1 | Gate trên + đúng mã | Cấp I2 và I3 nguyên tử, queue D3 → D4, đóng matching puzzle session |
| Đọc D3/D4 | P1 solved + sở hữu cả hai giấy | Ack độc lập; một giấy chưa đủ C. Không có pickup giấy bổ sung |
| Exit S2 → S3 | C | Thiếu thư hoặc chưa ack thư thì từ chối cả command trực tiếp |
| Đọc D5 | C, đúng S3/phai | UI bản sửa có trường đối chiếu với I2/I3; ack mới ghi completed |
| Open/submit P2 | C + completed(D5), đúng S3/phai | Chọn I2 đại diện, UI ghim I3 cạnh I2 và bản sửa; vẫn bắt owned(I3) ở Core |
| Solve P2 | Gate trên + answer=I2 | Không tiêu hao chứng cứ; queue D6 → D7; không cho trình thư đơn lẻ để solve |
| Đọc D6 | P2 solved + C + completed(D5) | Vinh xác nhận điều đã thấy, không quyết định tương lai thay Mai |
| Đọc D7 | Các điều kiện D6 + completed(D6) | Mai đối chất; chưa đọc xong không mở styling |
| Open/submit P3 | E, đúng S3/phai; quyền mặc hợp lệ | Chỉ raglan + kính mắt mèo + guốc mộc; màu tự chọn; đúng enqueue D8 |
| Đọc D8 | E + solved(P3) | Đọc kết, chưa ack không complete/claim |
| Complete | F + cả ba puzzle solved, currentChapter=c3, không locked | status completed; engine có thể unlock status C4 theo chapterOrder, UI C4 vẫn unavailable |
| Claim | completed + F + chưa claimed + ledger chưa có reward-c3 | +100 Sen và đủ quà một transition; command trực tiếp cũng phải tái kiểm F |
| Exit back | S2→S1, S3→S2 theo adjacency và unlocked thật | Không mất inventory/draft; stack lạ/nhảy tiến không bypass gate |
| Về Hub | Navigation hiện có, không areaId='prologue' | Không tự complete; pending session/queue theo UX hiện hữu |

`when` phải gắn cả puzzle/hotspot/thoại liên quan; `exitGates` cho hướng tiến. Không tin `unlockedAreaIds` legacy để bỏ qua gate. Complete/claim C3 cần recheck toàn F, tương tự phòng vệ C2 hiện có nhưng không thay đổi chính sách C1/C2.

**Thu biên nhận và đọc là hai transition rõ ràng:** item hotspot cấp I1; một hotspot “Đọc biên nhận” tại bàn có `when:itemOwned(I1)` mở D1. FE có thể hiển thị nút đọc ngay sau collect, nhưng không tự acknowledge. Không giả định item action đang hỗ trợ dialogue trigger. Overlay đã cất vào túi không hiện lại; UI đọc có ảnh document riêng. Core thêm ID hotspot cần thiết; FE gửi tọa độ thật. Nhật ký cho mở bản đọc được của chứng cứ đã đọc mà không dispatch collect/solve.

## 3. Quyết định rương và overlay

**Chọn solve cấp cả hai giấy, tái dùng C2.** Không có command “nhặt sổ”, “nhặt thư” sau P1; không tạo state nửa nhặt. Lựa chọn này nằm trong contract đích đã được duyệt M0.

- Chưa solve P1: nền rương đóng, giấy I2/I3 chưa khả dụng; ghi chú khóa vẫn nhìn/đọc được.
- Sau solve: I2/I3 đã ở túi, rương rỗng bằng `--ruong-rong.png`; queue hai document.
- `--ruong-mo.png` có giấy được giữ trong gói art nhưng không dùng làm world state trong phương án cấp giấy nguyên tử này: không có thời điểm persist “đã mở nhưng giấy còn trong rương”. Không hiển thị mở trước solve hoặc còn giấy sau collect; không thêm animation/state giả chỉ để dùng đủ ảnh. Nếu sau này muốn pha mở rồi nhặt riêng phải sửa contract trước.
- Hai overlay giấy S2 không hiện như vật chưa nhặt sau solve. Có thể dùng trong view đọc/đối chiếu có nhãn rõ, không tạo pickup mâu thuẫn. Ghi chú, bản sửa và bộ hồ sơ S3 không phải vật phẩm collect: `toggleOffOnCollect` với `itemId:null` trong manifest không tự tạo hành vi.
- Rương overlay chỉ thay ROI `[1050,270,1335,474]`, cùng canvas 1672×941. Không thay nền bằng ảnh nguyên phòng `_raw`.

## 4. Văn bản chứng cứ — đích biên tập hư cấu

Core viết đồng bộ dialogue, item/clue descriptions và hai thẻ C3; FE dựng tiếng Việt bằng HTML, ảnh giấy chỉ nền. Sau đây là nội dung đích để đối chiếu, chưa phải sử liệu hoặc text đã có trong app:

| Văn bản | Nội dung phải đọc được | Ý nghĩa đối chiếu |
| --- | --- | --- |
| I1 / D1 | Biên nhận ghi người đưa tiền Bà Lớn, người nhận Thầy Ba Càn, khoản 2.000 đồng và việc viết lại nhận xét để buộc Mai chấp nhận sắp đặt | Xác định trao đổi tiền, không dùng số tiền làm câu đố |
| I2 / D3 | Sổ gốc: hồ sơ Mai–Vinh, phần ghi nhận ban đầu không có dòng yêu cầu Mai làm lẽ/giao tiệm | Có mốc nội dung để so với bản sửa; không gọi lá số này là đại cát/chân lý |
| I3 / D4 | Thư dẫn chiếu cùng hồ sơ, khoản nhận tiền và yêu cầu thêm lời phán nhằm ép Mai làm lẽ, giao quyền quyết định căn tiệm | Nối người trả tiền, người sửa và mục đích với I1/bản sửa |
| Bản sửa / D5 | Cùng tên hồ sơ; thêm lời áp đặt rằng Mai phải chấp nhận làm lẽ và giao quyền quyết định tiệm; UI đánh dấu dòng thêm bằng chữ/nhãn | Chứng minh khác biệt nội dung có chủ ý, không dựa nếp giấy, màu hoặc giả chữ |

Giữ tên người/hồ sơ/khoản tiền nhất quán ở cả bốn văn bản. Không thêm câu đố ngày giờ, chữ ký nhận dạng hoặc suy luận khoa học từ bói toán. D6: Vinh làm chứng về bản sửa/thỏa thuận sau khi đã trình bộ chứng cứ. D7: Mai vạch hành vi áp đặt. D8 bắt buộc nguyên văn:

> Tôi không cần một lời phán tốt hơn. Tôi cần các người ngừng dùng lời phán để quyết định thay tôi.

Vinh có thể nói “Tôi sẽ làm chứng về những gì đã thấy.” Không kết bằng bỏ trốn cứu Mai. Sửa cả hint/summary/brief/thẻ, không chỉ node thoại. Thẻ kỹ thuật chỉ mô tả đường ráp đã duyệt, bỏ phát biểu tác giả/năm chưa kiểm chứng; thẻ phê phán có nhãn diễn giải của tác phẩm. Chưa tuyên bố thẩm định văn hóa.

## 5. API có thật tại baseline

Đã kiểm tra source, không lấy nhãn “Đề xuất” từ contract C2 làm hiện trạng:

| Source thật | Có sẵn / giới hạn |
| --- | --- |
| `src/content/schema.ts`, `src/content/index.ts` | `Gate.all`: puzzleSolved/dialogueCompleted/itemOwned; `when`, `exitGates`, exitArrows, entryDialogueId, completionDialogueId; Zod và liên kết. Present solution hiện chỉ có presentedItemId |
| `src/core/commands/journey/gate.ts` | `isGateSatisfied(state,gate?)`; `guardPuzzle(state,puzzleId,content,requireOwned=true)` kiểm phòng/side/prerequisite/owned, không kiểm proximity cho submit |
| `puzzle-commands.ts`, `puzzle-solution.ts` | `evaluatePuzzleAnswer`, `applyPuzzleSolved`; code normalizer bỏ dấu/case/space nhưng không đổi space thành underscore; cấp plural items và queue nhiều trigger đã có |
| `dialogue-queue.ts`, `dialogue-commands.ts` | `enqueueDialogues` dedup; advance/choose ack cấp clue; interaction đã completed vào mode reread. Queue helper hiện không tự check `dialogue.when`; Core phải bảo đảm các đường enqueue/recovery đúng thứ tự |
| `interact-command.ts`, `item-commands.ts` | `interact` nhận chân normalized và kiểm proximity theo metric 800×500; item/pick không nhận chân nhưng kiểm hotspot/phòng/gate; item/use present dùng chung submit outcome |
| `area-commands.ts` | goTo adjacency + gate; goBack tái dùng guard goTo |
| `studio/challenge-wardrobe.ts` | getChallengeWardrobe, createChallengeStudioDraft, challengeDraftFromAnswer, validateChallengeStudioDraft, validateStudioDraft đã có thật |
| `state.ts`, `draft-commands.ts` | Typed puzzleDrafts, activeSession, activeDialogue node/mode, dialogueQueue, claimedRewardIds; styling answer string-only |
| `chapter-commands.ts`, `reward-commands.ts` | Complete kiểm đủ puzzle/ending; riêng C2 recheck reading gate. Claim ledger và grantRewardGifts hợp tập quà; riêng C2 recheck pending claim |
| `history/serialize.ts`, `game/store.ts` | CONTENT_VERSION=sprint-02-core-1, nhận sprint-01-core-1 và raw envelope cũ; migrate mọi node; SAVE_KEY=tiem-may-nep-save-v1, backup, restore status, save boolean; replay không save |

Command/payload giữ nguyên:

```ts
{type:'chapter/enter', payload:{chapterId:'c3'}}
{type:'interact', payload:{targetId: '<hotspot id>', playerPos:{x:0.5,y:0.8}}}
{type:'item/pick', payload:{itemId:'bien_nhan_tien_thay_boi'}}
{type:'area/goTo', payload:{areaId:'c3-s2-phong-phong-thuy'}}
{type:'area/goBack', payload:{}}
{type:'puzzle/open', payload:{puzzleId:'p-c3-bagua-lock'}}
{type:'puzzle/updateDraft', payload:{puzzleId:'p-c3-bagua-lock', draft:{type:'code',answer:'CAN_'}}}
{type:'puzzle/submit', payload:{puzzleId:'p-c3-bagua-lock',answer:'CAN_TON'}}
{type:'puzzle/submit', payload:{puzzleId:'p-c3-present-evidence',answer:'so_tu_vi_nguyen_ban_1962'}}
{type:'puzzle/resetDraft',payload:{puzzleId:'p-c3-bagua-lock'}}
{type:'puzzle/close', payload:{}}
{type:'dialogue/advance',payload:{}}
{type:'dialogue/choose',payload:{choiceIndex:0}}
{type:'chapter/complete',payload:{chapterId:'c3'}}
{type:'reward/claim',payload:{chapterId:'c3'}}
```

Draft code dùng chuỗi token, ví dụ `''`, `CAN_`, `TON_`, `CAN_TON`, `TON_CAN`; mỗi vòng chọn Càn hoặc Tốn, chưa đủ thì chưa submit. UI không bắt gõ underscore. Draft chưa đủ không phải lời giải. Styling draft dùng `{type:'styling',answer:{silhouette:'tan_thoi',garmentId:'ao-dai-raglan',jewelryId:'kinh-mat-meo',footwearId:'guoc-moc',color0:'...',color1:'...',color2:'...',color3:'...'}}`; optional fields đều string.

DomainEvent thật ở `src/core/command.ts`: `itemPicked {itemId}`, `clueCollected {clueId}`, `puzzleSolved {puzzleId}`, `puzzleFeedback {puzzleId,result?:'incorrect'|'hint'}`, `areaEntered {areaId}`, `rewardGranted {rewardId?,amount?}`, `outfitChanged`, `outfitSaved`, `stateRestored`, `sideFlipped`. Không có event chestOpened/dialogueCompleted/chapterCompleted; FE đọc snapshot. Guard fail trả ok:false; đáp án sai hợp lệ có thể ok:true + incorrect event và state không đổi. Không coi ok:true là solved.

## 6. Delta cần thêm sau M0

1. Core sở hữu `c3.json`: gate matrix, side, exit/back, bỏ area exit prologue, lời thoại/brief/hints mới, reward 100, loanWardrobe, completionDialogueId D8. Nội dung bùa/khói nhang không gắn niềm tin với tội lỗi; vật legacy có thể giữ catalog để đọc save nhưng không là gameplay bắt buộc.
2. Core sở hữu `schema.ts`: thêm D5/D8 và hotspot IDs cần thiết; mở rộng **PresentPuzzle.solution.dialogueTriggerIds?: DialogueId[]** (API đề xuất mới) để P2 queue D6→D7. `applyPuzzleSolved` đọc plural trigger đã có; không tạo solve thứ hai hoặc React effect cấp lời thoại. P3 dùng dialogueTriggerId có sẵn cho D8.
3. Core tái kiểm F ở complete/claim C3, bảo vệ command trực tiếp, stale completed save và thứ tự thoại; tests không chỉ happy path.
4. Core migration C3 theo mục 8. Nếu cần helper `reconcileC3Progress`, đó là **helper nội bộ đề xuất**, không export cho FE trước bàn giao. Nó chỉ enqueue bước recovery đã đủ gate, không tự read/solve/complete.
5. FE thêm mapping C3 scene/pose/portrait/overlay/document viewer, mã hai vòng, journal reread read-only, adapter chân và Studio dùng helper hiện hữu. Không có command reread mới trong M0: journal mở lại text đã đọc là view không đổi state; hotspot dialogue có sẵn hỗ trợ mode reread.
6. Leader cập nhật metadata/registry/shared scripts sau checkpoint asset, kiểm đúng manifest và diff giới hạn C3. FE không chạy audit metadata trong worktree của mình.

## 7. Challenge wardrobe và reward

P3 khai báo `loanWardrobe: {garmentIds:['ao-dai-raglan'], accessoryIds:['kinh-mat-meo','guoc-moc']}`. Tái dùng helper C2, quyền=(catalog thật ∩ owned/loan theo puzzle). Không ép mua, không sửa closet để giả sở hữu, không gửi allowlist từ client. Local ScopedSession của Studio giữ global PuzzleDraft; persist bằng puzzle/updateDraft, không studio/open đè session.

Equip/preset/default/resume/undo local/submit phải revalidate context và mọi đồ được chọn. Sai context không mặc được. Closet thường chỉ permanent owned; bộ còn đồ mượn không được lưu outfit vĩnh viễn. Cancel thoát challenge mất quyền mượn, giữ draft; không xóa đồ đã sở hữu. Đáp án chỉ raglan/tan_thoi + jewelry kính + footwear guốc; không cổ thuyền thay thế, không bắt màu/motif.

| Reward-c3 | Legacy hiện tại | Đích M0 |
| --- | --- | --- |
| Sen | 150 | **100**, giảm 50 cho claim mới |
| Garments | ao-dai-raglan, ao-dai-co-thuyen | Giữ cả hai; strip production mới đều có |
| Cards | card-ky-thuat-ao-dai-raglan-1960, card-phe-phan-hu-tuc-boi-toan | Giữ ID, biên tập claim/nhãn |
| Accessories/items | Không khai báo | Không tự thêm kính/guốc thành quà |

Claim union toàn bộ quà và ledger `reward-c3` nguyên tử. Kính chỉ loan nếu chưa sở hữu; guốc có trong initial closet nhưng vẫn khai báo loan để fixture hợp lệ hết đồ không bị buộc mua. Giữ đủ layer/icon áo phụ, không bỏ quà để test xanh. Delta reward mới chỉ +100; tiền đọc thẻ là thao tác riêng, không pre-read. Legacy claimed 150 giữ nguyên wallet, repair quà phi tiền tệ bằng set, không cộng/trừ 50.

## 8. Draft, queue, save/load, migration và lịch sử

- Code/present/styling draft persist ngay mỗi thao tác qua command, close/reopen/reload giữ draft, reset chỉ draft hiện tại. Matching session đóng sau solve; không có session đồng thời hoặc state UI tự cấp vật.
- P1 queue D3→D4; P2 queue D6→D7; P3 queue D8. Không tự ack; reload giữa hai giấy/lời khai giữ node/queue và không nhân clue. Reread không tiến trình, không tiền. View bản đối chiếu phải mở lại được sau khi đọc.
- Giữ khóa save/backup; bảo vệ bytes save hỏng/unsupported, báo lỗi storage đầy/chặn. Không xóa localStorage hoặc dùng save thật để seed QA. Replay dùng tree riêng, không claim/main save.
- **Đích version đề xuất:** `sprint-03-core-1`; nhận sprint-02-core-1, sprint-01-core-1 và envelope legacy đang hỗ trợ. Không chỉ sửa constant: điều kiện `legacyC2 = parsed.contentVersion !== CONTENT_VERSION` hiện tại phải đổi để save sprint-02 không bị migrate lại C2 khi bump C3. C1/C2 snapshots phải giữ semantic progress/queue/side/wallet.
- Migrate mọi history node, không chỉ head. C3 chưa claimed từ version trước: giữ inventory/solved, nhưng các read marker/queue nội dung C3 cũ không được coi là đã đọc text mới; revalidate draft, chuẩn hóa mat_phai, xóa/sửa riêng session C3 không hợp lệ, đưa về checkpoint sớm nhất thiếu prerequisite trong cùng chương. Không tự solve/complete hoặc grant loan.
- Recovery có thứ tự: I1/D1/DX → D2/P1/D3/D4 → D5/P2/D6/D7 → P3/D8. Với P1/P2/P3 đã solved, sau khi đủ prerequisite phải enqueue đoạn chưa đọc tương ứng bằng cơ chế reconciliation Core, không yêu cầu solve lại puzzle đã khóa, không queue ending trước đối chất. Tái kiểm gate khi tiêu thụ recovery; không tin enqueueDialogues tự enforce when.
- Completed nhưng chưa claimed legacy: giữ lịch sử completed, đưa qua các đọc còn thiếu trước claim; status completed không bypass F. Claimed legacy: giữ completed/claimed/ledger/Sen 150, repair đúng quà phi tiền tệ, text mới cho xem lại tùy chọn, không khóa lại C4 progression đã có. Idempotency chứng minh bằng migrate hai lần và reload.
- Missing node fallback node đầu hợp lệ theo loader; thay text mà giữ node-1 vẫn cần version C3 để tránh đọc cũ thành đã đọc mới. Unknown save/version: bảo vệ bản gốc, báo lỗi.
- Undo/redo/history checkout và inverse snapshot không được làm mất ledger/đồ đã claim hoặc farm tiền. Test trước/sau solve, ending, complete, claim và replay. Queue/drafts được validate trên tất cả snapshot phục hồi; không đánh dấu solved khi chỉ khôi phục draft.

## 9. Geometry và renderer

Đây là phép chuyển tọa độ theo art, chưa phải tọa độ gameplay đã nghiệm thu. Manifest native world **1672×941**, sprite 176×416, anchor engine `[88,400]`, visible height 384; scale production 1.35 ⇒ visible height xấp xỉ 518.4 px. Không lấy toàn frame 416 làm chiều cao người.

| Actor / cảnh | Chân pixel manifest | Chân normalized x/1672, y/941 |
| --- | --- | --- |
| Mai tailor S1 | 350,790 | 0.209330,0.839532 |
| Thầy Ba Càn idle S2 | 580,795 | 0.346890,0.844846 |
| Mai speak S3 | 780,825 | 0.466507,0.876727 |
| Vinh witness S3 | 480,820 | 0.287081,0.871414 |
| Bà Lớn reflective S3 | 1170,820 | 0.699761,0.871414 |

Giữ chân/bounds theo từng pose manifest, pose đổi theo state và không làm animation atlas. Preview witness/reflective không bắt FE dùng pose sau đối chất ngay từ đầu: trước chứng cứ dùng idle/stern đúng identity, sau evidence mới witness/reflective.

Engine vẽ `foot - anchor * scale`, rồi nhân viewport k. Exporter `scene_actor` neo theo visible bottom (`footY+1-bounds.bottom`) và rounding; FE phải đối chiếu sai khác khoảng một pixel với preview, không dịch chân từ padding cảm tính. Chọn C3 explicit render scale=1.35 cho các actor manifest; không dùng `characterScale(c2)*1.35`. Nếu adapter dùng target-height, scale=518.4/384=1.35 và **không nhân thêm**. An cùng mặt phẳng có target visible height≈518.4 ⇒ scale≈518.4/389=1.33265, nội suy depth nếu cần phải khớp các anchor đã duyệt. Scene scale C3 chưa có trong CharacterScene hiện tại; FE thêm có scope, không đổi c0/c1/c2.

Hotspot rect pixel chuyển sang normalized theo world; playerPos gửi chân thật `(footX/1672,footY/941)`. Guard proximity vẫn metric `sqrt((dx*800)^2+(dy*500)^2) <= radius*800` hoặc expanded rect hiện có; không âm thầm đổi engine metric toàn app. FE đo approach trái/phải, spawn/return/back/exit, path furniture, NPC ground-space và upright visible occlusion theo art; gửi bảng Core để Core cập nhật JSON/radius hợp lý. Không tăng radius tùy tiện hoặc thu footprint để pass.

Giữ full native nền/overlay, production path theo manifest, `_raw` chỉ preview/provenance. Đo lại walkable floor thật thay floor strip C2: blocker C2-GEO-009 chứng minh floor strip pass chưa đủ. Không biến rect visible toàn thân thành ground collision; vẫn kiểm occlusion thân khi cần. 44px touch targets, Tab/Enter/Escape, focus restore, reduced motion, portrait/landscape và text tiếng Việt theo design system.

## 10. Trạng thái cổng M0

Đã duyệt contract đích: gates A→F; solve rương cấp hai giấy; đối chiếu có bản sửa; present plural dialogue trigger; loan wardrobe C2; 100 Sen mới/giữ 150 legacy; migration recovery có thứ tự; ownership và milestone trong kế hoạch. Chủ dự án cho phép triển khai theo milestone và yêu cầu tự paste prompt; Leader không dispatch. Duyệt M0 không tự cấp quyền commit hoặc cập nhật worktree. Các thao tác Git cần phạm vi và phép riêng như kế hoạch. C3 chưa playable.

Các pending vẫn giữ: quyền Git cập nhật Tester và tích hợp candidate gameplay (A/B + fast-forward Core/Frontend đã được phép); final visual signoff còn ghi pending trong manifest; cultural review; Safari/full visual acceptance; blocker C2 tồn đọng. Các API ghi đề xuất trong mục delta là target để Core triển khai và công bố sau GREEN, không phải API baseline. Không coi duyệt contract là xác nhận các test hoặc review này đã hoàn tất.
