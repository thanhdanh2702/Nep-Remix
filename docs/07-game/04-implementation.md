# 04 — Kế hoạch kỹ thuật và backlog

## Bản đồ mã nguồn

| Khu vực | Trách nhiệm / điểm cần làm |
|---|---|
| [src/content/chapters](../../src/content/chapters/) | Biên tập sáu JSON theo kịch bản; thêm thoại kết, điều kiện, mũi tên thoát |
| [schema.ts](../../src/content/schema.ts), [index.ts](../../src/content/index.ts) | Zod và literal ID; mọi ID mới cần khai báo; kiểm tra liên kết chéo sau parse |
| [src/core/commands/journey](../../src/core/commands/journey/) | Guard, evaluator, giải puzzle, chuyển phòng, kết chương |
| [reward-commands.ts](../../src/core/commands/journey/reward-commands.ts) | Cấp thưởng đầy đủ, một lần; không chỉ cộng tiền; phối hợp invariant số dư ở wallet |
| [state.ts](../../src/core/state.ts), [history](../../src/core/history/) | Tiến trình, bản nháp, replay, invariant và lịch sử command |
| [store.ts](../../src/game/store.ts) | Lưu/khôi phục localStorage, migration, thông báo lỗi |
| [Game.tsx](../../src/game/Game.tsx) | Điều phối screen, chapter, ending, trả thưởng; chỉ mở chương sau khi đạt cổng QA |
| [RoomScene.tsx](../../src/game/RoomScene.tsx), [room-render.ts](../../src/game/room-render.ts) | Cảnh C2–C5, NPC, hotspot, mũi tên và phản hồi đúng tiến trình |
| [PuzzleModal.tsx](../../src/game/PuzzleModal.tsx), [Studio.tsx](../../src/game/Studio.tsx) | UI puzzle theo loại, wardrobe cho mượn, phản hồi theo trường thiếu |
| [character-scale.ts](../../src/game/character-scale.ts), [npc-portraits.ts](../../src/game/npc-portraits.ts) | Thêm scene/portrait đúng kích thước, chân đứng và lớp vẽ |
| [assets.ts](../../src/game/assets.ts) | Đường dẫn runtime, metadata, preload/fallback |

## Các chỗ có thể làm người chơi kẹt hoặc hoàn thành sai

Các nhận xét dưới đây là rà soát mã, cần viết regression test trước khi sửa; không phải báo cáo tất cả lỗi đã tái hiện trên UI.

| Ưu tiên | Hiện trạng quan sát | Hướng sửa bắt buộc |
|---|---|---|
| P0 | `PLAYABLE` và scene mapping mới có Mở đầu/C1; thiếu nền C2–C5 | Hoàn thiện từng chương theo lát cắt; không mở cờ hàng loạt |
| P0 | Mở cửa có hành vi tự mở các exit của phòng sau giải puzzle | Chuyển sang điều kiện tường minh; C4 lấy kim chưa được mở S2 |
| P0 | C3 S1 không có puzzle; một số thoại/mục nhặt không đủ nối tiến trình | Cho điều kiện dựa trên vật phẩm + đã đọc thoại; kiểm tra reachability |
| P0 | Hotspot bắt buộc `trai` khi `latVai=false` | Đưa vào `phai`; kiểm tra full walkthrough khi flag tắt |
| P0 | `use.requiredItemIds` có nhánh kiểm tra tập con; đường `item/use` khác có thể bỏ qua đủ bộ | Dùng evaluator chung, yêu cầu đủ đúng tập vật sở hữu; chặn rỗng/trùng/thiếu |
| P0 | `puzzle/solve` có thể bỏ qua quy trình submit/reward ở một số nhánh | Không public lối tắt hoàn thành; mọi đường vào dùng guard và cùng hàm áp kết quả |
| P0 | Reward hiện đánh dấu đã nhận/cộng Sen nhưng chưa cấp đủ các mảng quà | Cấp áo, phụ kiện, vật phẩm, thẻ và tiền trong một transition nguyên tử |
| P0 | Áo dùng để giải nằm trong thưởng cuối chương | Loan wardrobe theo puzzle; không dựa vào sở hữu trước chương |
| P0 | C2–C5 thiếu completion dialogue; exit có giá trị `prologue` không phải AreaId | Thêm kết chương; chuyển Hub bằng navigation riêng, không `area/goTo('prologue')` |
| P1 | Nhiều dialogue trigger nhưng chỉ mở đầu tiên, clue có thể được cấp trước khi đọc | Hàng đợi thoại xác định; clue cấp tại node thực sự đọc/xác nhận tóm tắt |
| P1 | `find` hiện so chiều dài và kiểm tra đủ điểm đích trong Set; với đáp án hiện tại đã loại đầu vào lặp thay điểm thiếu | Giữ regression này; validate thêm tính duy nhất của chính dữ liệu đáp án, không coi đây là bypass đã xác nhận |
| P1 | Guard area chỉ kiểm tra cùng chương/đã mở, chưa đủ adjacency | Exit hợp lệ từ phòng hiện tại + điều kiện; backtracking chỉ theo đường định nghĩa |
| P1 | Core completion chưa buộc đã đọc kết như UI | Guard tại core, không tin effect/UI hoặc command gọi tay |

## Hợp đồng dữ liệu đề xuất — chưa phải API đang có

Giữ kiến trúc command/state hiện hữu; không dùng chuỗi JavaScript eval làm điều kiện. Mở rộng Zod bằng union có kiểu và ID hợp lệ. Ví dụ minh họa, **không copy vào JSON hiện tại trước khi cập nhật schema**:

```ts
type Requirement =
  | { kind: 'puzzleSolved'; puzzleId: PuzzleId }
  | { kind: 'dialogueCompleted'; dialogueId: DialogueId }
  | { kind: 'itemOwned'; itemId: ItemId };

type Gate = { all: Requirement[] };
type AreaExit = { toAreaId: AreaId; when: Gate };
// Cùng Gate có thể bảo vệ interactable, puzzle và thoại kết.
// Side chỉ điều khiển hiển thị; guard core vẫn phải kiểm tra Gate.
```

MVP chỉ cần AND, chưa cần DSL phức tạp. Giữ tương thích `prerequisitePuzzleIds`, chuyển chúng thành điều kiện AND khi load. Cấm tham chiếu không tồn tại, tự phụ thuộc, chu trình chặn đường tiến và target khác chương. Điều kiện mở phòng nên suy ra từ state thay vì được cộng dồn bởi mọi puzzle bất kỳ.

Chu trình submit chuẩn:

1. Xác định puzzle thuộc chương hiện tại, người chơi ở phòng chứa puzzle và gate đã đạt.
2. Kiểm tra loại payload, số lượng, uniqueness, vật sở hữu và session nếu puzzle yêu cầu.
3. Đánh giá đáp án bằng evaluator chung.
4. Nếu sai: trả lý do an toàn, không đổi inventory/reward/solved state.
5. Nếu đúng: cập nhật solved, cấp vật phẩm theo set, tạo hàng đợi thoại, cập nhật bản nháp/session trong cùng transition.
6. UI hiển thị hiệu ứng dựa trên state đã commit; reload hoặc click đúp không áp lần hai.

`order` có requiredItemIds phải kiểm tra cả sở hữu lẫn đúng thứ tự; `present` phải thực sự sở hữu chứng cứ; `code` không chấp nhận payload sai kiểu. C3 UI chọn nhãn nhưng gửi token `CAN_TON`; hiện normalizer không bảo đảm “CAN TON” tương đương dấu gạch dưới, nên không dùng placeholder gây hiểu nhầm.

### Kết chương và cấp thưởng

Completion gate = tất cả puzzle của chương đã solved + thoại kết đã completed. Phần thưởng sử dụng `reward.id` làm khóa idempotency. Một lần commit phải cập nhật Sen và hợp của mọi danh sách garment/card/item/accessory rồi đánh dấu claimed. Không cho trạng thái “claimed nhưng áo chưa cấp”.

Theo baseline đề xuất: 50 + 5 × 100 = **550 Sen từ cốt truyện**. Không cộng vào đây tiền khởi tạo, đọc Bảo tàng, mua sắm. Nếu đồng bộ JSON với quyết định 100 Sen/chương, không trừ tiền của save cũ đã nhận nhiều hơn.

### Thoại và bản nháp

Đề xuất thêm queue có ID, current node và completedDialogueIds; đóng thoại tạm không xóa queue. Queue không chứa bản sao văn bản dài. Thay đổi nội dung thoại cần version để xử lý node đã bỏ. Chỉ mở đoạn kết khi đáp ứng gate; không dùng tự phát hiện từ một hotspot bất kỳ.

Mỗi puzzle có draft dạng discriminated union: itemIds được chọn, orderedIds, code input, selectedPointIds hoặc outfit. Có command cập nhật draft, validate và persist; không chỉ giữ useState vì reload sẽ mất. Không lưu vị trí con trỏ và animation frame. Hủy thử thách không tự đánh dấu solved; save giữ draft để tiếp tục.

## Migration và dữ liệu người chơi

Hiện dùng khóa `tiem-may-nep-save-v1`; loader có ràng buộc với Lật vải, lịch sử được giới hạn. Khi mở rộng state cần version envelope và migration có fixture tests, không xóa localStorage để “sửa” save.

- Giữ bản save gốc trước migration; chỉ ghi bản mới sau parse + invariant thành công.
- Default các queue/draft/condition mới; không đổi ID cũ nếu không cần. ID C5 có từ nhạy cảm được giữ nội bộ nhưng đổi nhãn.
- Save có `claimed=true` nhưng thiếu áo/thẻ: repair bằng set theo reward cũ, không cộng Sen lại. Có migration marker để chạy lại an toàn.
- Save ở node/area không còn hợp lệ: về checkpoint an toàn trong cùng chương, giữ vật và puzzle đã giải; thông báo rõ. Không tự coi chương chưa chơi là hoàn thành.
- Save cũ đã complete nhưng chưa có thoại kết mới: cho xem lại tùy chọn, không khóa lại chương sau. Với chương đang chơi phải áp completion gate mới.
- LocalStorage đầy/bị chặn: game vẫn chơi trong phiên, hiện cảnh báo không lưu được; không nói “đã lưu”.
- Lịch sử undo/redo không được farm reward, nhân vật phẩm hoặc quay về gate không hợp lệ. Giới hạn undo vào phiên puzzle là lựa chọn ưu tiên; nếu giữ undo toàn cục phải test cả reward ledger.

## Các gói công việc theo phụ thuộc

| Gói | Người phụ trách theo vai trò | Đầu ra và cổng bàn giao |
|---|---|---|
| G0 — chốt thiết kế | Product + biên kịch + người duyệt văn hóa | Duyệt các quyết định README; claim registry; brief mỗi chương thống nhất đáp án |
| G1 — nền tiến trình | Core engineer | Gate, evaluator, queue, reward, migration; test âm tính pass |
| G2 — puzzle UI | Frontend + UX | use nhiều vật, order/code/find, draft resume, loan wardrobe; keyboard/touch pass |
| G3 — sửa Mở đầu/C1 | Content + frontend + QA | Vertical slice không regress; reward áo/thẻ đúng; replay/return Hub an toàn |
| G4 — hoàn thiện C2 | Content + art + frontend | Chương đầu tiên có order và kết mới; toàn bộ đường đi chạy trên build thật |
| G5 — hoàn thiện C3/C4 | Content + art + frontend | Code, đọc chứng cứ, thêu đủ vật, không phụ thuộc flip |
| G6 — hoàn thiện C5 | Content + art + frontend | Find, matrix, đính chính và hậu truyện; không gọi AI |
| G7 — ổn định toàn chiến dịch | QA + văn hóa + product | 17 phòng/25 puzzle, fresh & migrated saves, nghiệm thu thiết bị và nguồn |

Art có thể chuẩn bị song song sau G0, nhưng chỉ gắn cờ playable từng chương khi đủ asset + content + test. Không ước lượng ngày hoàn tất khi chưa biết số người và tốc độ sản xuất 12 nền còn thiếu. Mốc demo 10/10 vẫn tách khỏi chiến dịch đầy đủ; ưu tiên G0–G3 nếu giữ phạm vi demo Mở đầu/C1.

Đợt viết hồ sơ này không sửa runtime, content JSON, cấu hình hoặc save của người dùng.
