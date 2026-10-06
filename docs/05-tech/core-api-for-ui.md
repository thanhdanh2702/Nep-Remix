# Đặc Tả API Lõi Trò Chơi Dành Cho Giao Diện Người Dùng (Core API for UI)

> **Tham chiếu hợp đồng:** Tài liệu này là đặc tả kỹ thuật chi tiết về các hàm, kiểu dữ liệu, quy tắc giao tiếp và luồng gọi API giữa tầng Giao diện người dùng (UI) và Lõi xử lý logic (Core Engine).  
> Mọi nguyên tắc thiết kế tổng quát và phân định trách nhiệm đã được chốt tại [`docs/05-tech/ui-core-contract.md`](./ui-core-contract.md) và [`docs/01-overview/decisions.md`](../01-overview/decisions.md). File này tập trung đặc tả **chính xác các chữ ký hàm API** để đội ngũ UI triển khai mà không làm xáo trộn tính bất biến của lõi.

---

## 1. Khởi Tạo Trò Chơi (Initialization Flow)

Để khởi động Core Engine khi mở ứng dụng, tầng UI thực hiện tuần tự 3 bước thuần túy:

```ts
import { loadContent } from './src/content/index.ts';
import { createInitialState } from './src/core/state.ts';
import { createInitialTree } from './src/core/history/history-tree.ts';
import { fromJSON } from './src/core/history/serialize.ts';

// 1. Tải toàn bộ nội dung dữ liệu tĩnh đã được Zod xác thực
const content = loadContent();

// 2. Kiểm tra dữ liệu lưu trữ trong localStorage
const savedRaw = localStorage.getItem('tiem-may-nep-save-v1');
let gameTree;

if (savedRaw) {
  const restoreRes = fromJSON(savedRaw, content);
  if (restoreRes.ok) {
    gameTree = restoreRes.tree;
  } else {
    console.warn('Lỗi đọc file lưu, khởi tạo game mới:', restoreRes.reason);
    // Khởi tạo trạng thái mặc định sạch nếu save hỏng
    const initialState = createInitialState(content);
    gameTree = createInitialTree(initialState);
  }
} else {
  // 3. Khởi tạo trạng thái ban đầu và Cây Lịch Sử (HistoryTree)
  const initialState = createInitialState(content);
  gameTree = createInitialTree(initialState);
}
```

- **`loadContent(): GameContent`**: Tải và kiểm tra toàn bộ JSON của 6 chương, tủ đồ, đồ dùng, câu đố và thẻ văn hóa. Kết quả được lưu bộ đệm tĩnh (cached) trong RAM.
- **`createInitialState(content, ctx?, features?): GameState`**: Sinh bản chụp trạng thái mặc định với `wallet.senNgoc = 0`, tiến trình mở đầu `prologue` ở trạng thái sẵn sàng, `features.latVai = false`.
- **`createInitialTree(initialState, ctx?, version?): HistoryTree`**: Đóng gói trạng thái ban đầu thành nút gốc (`node-root`) của Cây Lịch Sử, gán `headId = 'node-root'`.

---

## 2. Danh Mục Các Hàm API Cốt Lõi (Core Functions)

Toàn bộ các hàm trong Core Engine là **hàm thuần túy (pure functions)**: không làm biến đổi (mutate) đối tượng truyền vào mà luôn trả về một bản sao đối tượng mới (`nextTree` hoặc `nextSession`).

### 2.1. `dispatch`
Thực thi một lệnh thay đổi trạng thái (Command) lên snapshot tại vị trí `headId` hiện tại của cây game.

- **Đầu vào:**
  - `tree: HistoryTree`: Cây lịch sử hiện tại.
  - `cmd: Command`: Lệnh cần thực thi (gồm `{ type: string, payload: unknown }`).
  - `content: GameContent`: Kho dữ liệu tĩnh của game.
  - `ctx?: ContextOptions`: Ngữ cảnh thời gian hoặc seed giả lập (tùy chọn).
  - `label?: string`: Nhãn mô tả thân thiện cho nút lịch sử (tùy chọn).
- **Đầu ra:**
  - Thành công: `{ ok: true, tree: HistoryTree, events: DomainEvent[], nodeId: string }`.
  - Thất bại: `{ ok: false, reason: string, tree: HistoryTree }`.
- **Lỗi có thể gặp:**
  - Lệnh vi phạm điều kiện bảo vệ (guard failure), ví dụ: không đủ Sen Ngọc khi mua đồ, chưa nhặt chìa khóa đã mở rương, tương tác ngoài cự ly cho phép.
  - Lệnh vi phạm bất biến dữ liệu (invariants violation).
  - Nút `headId` không tồn tại trong cây.

### 2.2. `undo`
Lùi đầu đọc `headId` về nút cha (`parentId`), ghi nhớ nút con vừa rời đi để phục vụ `redo`. Tuyệt đối không xóa bất kỳ nút nào trong cây.

- **Đầu vào:** `tree: HistoryTree`
- **Đầu ra:** `{ ok: boolean, tree: HistoryTree, reason?: string }`
- **Lỗi có thể gặp:** Đang ở nút gốc (`node-root`) thì `ok: false, reason: 'Already at root node; cannot undo further.'`.

### 2.3. `redo`
Tiến đầu đọc `headId` tới nút con được duyệt gần nhất (`lastVisitedChildId`) hoặc nhánh con mới nhất.

- **Đầu vào:** `tree: HistoryTree`
- **Đầu ra:** `{ ok: boolean, tree: HistoryTree, reason?: string }`
- **Lỗi có thể gặp:** Nút hiện tại không có nhánh con nào để bước tiếp (`ok: false, reason: 'No child node to redo to.'`).

### 2.4. `checkout`
Nhảy trực tiếp `headId` tới một nút bất kỳ trong cây lịch sử sau khi kiểm tra tính toàn vẹn của snapshot tại nút đó.

- **Đầu vào:**
  - `tree: HistoryTree`: Cây lịch sử.
  - `nodeId: string`: Mã định danh nút đích.
  - `content: GameContent`: Dữ liệu nội dung để kiểm tra bất biến.
- **Đầu ra:** `{ ok: boolean, tree: HistoryTree, reason?: string }`
- **Lỗi có thể gặp:**
  - Mã `nodeId` không tồn tại trong cây.
  - Snapshot tại nút đích vi phạm luật bất biến dữ liệu (`invariants violated`).

### 2.5. `revert`
Tạo một lệnh nghịch đảo của nút chỉ định và dispatch nó thành một nhánh mới tại `headId` hiện tại.

- **Đầu vào:** `tree: HistoryTree`, `nodeId: string`, `content: GameContent`, `ctx?: ContextOptions`
- **Đầu ra:** `DispatchResult` (`{ ok: true, tree, events, nodeId }` hoặc `{ ok: false, reason, tree }`)
- **Lỗi có thể gặp:** Nút mục tiêu thuộc loại một chiều (`one-way`) không có hàm nghịch đảo (hệ thống sẽ trả về lỗi hướng dẫn: `"không có lệnh nghịch đảo, dùng checkout"`).

### 2.6. `branches`
Truy vấn toàn bộ các nhánh lá (leaf nodes) và đường dẫn từ gốc đến từng ngọn trong cây lịch sử (dùng cho debug hoặc cây lựa chọn).

- **Đầu vào:** `tree: HistoryTree`
- **Đầu ra:** `Array<{ leafId: string, path: string[], leafLabel?: string }>`
- **Lỗi có thể gặp:** Không có lỗi (trả về mảng rỗng nếu cây không có nút).

### 2.7. `nearestInteractable`
Tính toán vật thể hoặc NPC gần nhất với người chơi trong khu vực hiện tại và kiểm tra xem người chơi đã bước vào cự ly tương tác hợp lệ hay chưa.

- **Đầu vào:**
  - `state: GameState`: Trạng thái game hiện tại (lấy từ `tree.nodes[tree.headId].snapshot`).
  - `content: GameContent`: Kho dữ liệu.
  - `playerPos: { x: number, y: number }`: Tọa độ chuẩn hóa của người chơi ($0 \le x, y \le 1$).
- **Đầu ra:** `string | null`: Trả về `interactableId` gần nhất nếu người chơi nằm trong phạm vi (để UI hiện prompt "Bấm E"), hoặc `null` nếu ở quá xa.
- **Lỗi có thể gặp:** Trả về `null` nếu khu vực hiện tại không tồn tại trong dữ liệu hoặc không có đối tượng nào trong tầm.

### 2.8. `prune`
Cắt tỉa cây lịch sử để giữ tổng số nút không vượt quá `maxNodes` (mặc định 200 nút). Luôn bảo vệ nút gốc (`rootId`), nút đầu hiện tại (`headId`), toàn bộ tổ tiên của `headId` và các nút có gắn nhãn (`label`).

- **Đầu vào:** `tree: HistoryTree`, `maxNodes?: number` (mặc định 200)
- **Đầu ra:** `HistoryTree` đã được cắt bớt các nhánh rác cũ nhất.

### 2.9. `toJSON` & `fromJSON`
Tuần tự hóa và phục hồi Cây Lịch Sử ra/vào chuỗi JSON có đóng dấu định dạng `tiem-may-nep-save-v1`.

- **`toJSON(tree: HistoryTree): string`**: Trả về chuỗi JSON chứa phong bì phiên bản `tiem-may-nep-save-v1` và snapshot cây.
- **`fromJSON(jsonStr: string, content: GameContent): { ok: true, tree: HistoryTree } | { ok: false, reason: string }`**: Đọc chuỗi JSON, kiểm tra cấu trúc cây và chạy `validateState` trên snapshot của nút đầu `headId`.

---

## 3. Scoped Session (Phiên Thao Tác Cục Bộ Trong Phòng Phối Đồ & Câu Đố)

Để tránh làm phình Cây Lịch Sử chính với hàng chục thao tác thử áo hoặc xoay mảnh ghép, Core Engine cung cấp cơ chế **Scoped Session** độc lập trong RAM:

```
[Game History Tree] --- commitSession ---> Tạo duy nhất 1 node trên Cây Chính
         |                                       ^
    openSession                                  |
         v                                       |
  [ScopedSession: local stack undo/redo/reset]---+
```

### 3.1. Các hàm quản lý Scoped Session

| Tên hàm | Đầu vào | Đầu ra | Mục đích | Lỗi có thể gặp |
| :--- | :--- | :--- | :--- | :--- |
| `createScopedSession` | `(initialDraft, type)` | `ScopedSession<T>` | Mở phiên cục bộ cho Studio hoặc Câu đố | `type` không phải `'studio'` hoặc `'puzzle'` |
| `dispatchSession` | `(session, mutatorFn)` | `ScopedSession<T>` | Cập nhật draft, đẩy draft cũ vào stack `history`, xóa stack `future` | Lỗi trong hàm mutator của UI |
| `undoSession` | `(session)` | `{ ok, session }` | Hoàn tác bước thử gần nhất trong phiên | `ok: false` nếu `history` rỗng |
| `redoSession` | `(session)` | `{ ok, session }` | Làm lại bước vừa hoàn tác trong phiên | `ok: false` nếu `future` rỗng |
| `resetSession` | `(session)` | `ScopedSession<T>` | Trả draft về trạng thái ban đầu khi mở phiên | Không có lỗi |
| `commitSession` | `(session)` | `{ ok: true, command } \| { ok: false, reason }` | Đóng gói thành **đúng 1 Command** để dispatch vào Cây Game chính | Trả về `ok: false` nếu câu đố chưa giải đúng (`valid !== true`) |
| `cancelSession` | `(session)` | `null` | Hủy phiên, không ghi bất kỳ lệnh nào vào Cây Game | Không có lỗi |

### 3.2. Quy tắc Commit:
- **Phòng phối đồ (Studio):** `commitSession(session)` sinh ra lệnh `closet/saveOutfit` mang toàn bộ cấu hình áo, màu sắc, phụ kiện đã phối.
- **Câu đố (Puzzle):** `commitSession(session)` chỉ thành công khi trạng thái câu đố đã được đánh dấu `valid: true`, sinh ra lệnh `puzzle/solve`.

---

## 4. Ranh Giới Giữa Giao Diện (UI) Và Lõi (Core Engine)

Để kiến trúc luôn trong sạch và tất định, việc phân định quyền hạn được tuân thủ nghiêm ngặt:

### Trách nhiệm độc quyền của UI (KHÔNG gửi lệnh Core):
- Tọa độ di chuyển nhân vật tức thời theo từng khung hình ($60$ fps).
- Di chuyển camera viewport, hiệu ứng rung lắc (screenshake), hiệu ứng hạt (particles).
- Bắt sự kiện bàn phím (WASD, Mũi tên, phím `E`, phím `Space`, `Esc`).
- Trạng thái đóng/mở Modal, Drawer, Bottom sheet.
- Chuyển tab danh mục (ví dụ: chuyển giữa tab "Dáng áo", "Phụ kiện", "Màu sắc").
- Hiệu ứng rê chuột (Hover), tiêu điểm (Focus), hoạt ảnh chuyển cảnh (Transition).
- Điều hướng giữa các phân khu trên thanh menu chính.

### Trách nhiệm độc quyền của Core Engine:
- Toàn bộ luật nghiệp vụ (Business Rules), tính hợp lệ của trang phục, chuẩn mực văn hóa.
- Quản lý túi đồ (Inventory), điểm Sen Ngọc (Wallet), các thẻ manh mối đã mở khóa (Notebook).
- Cây cốt truyện và tiến trình chương (Journey Progress).
- Tính bất biến và khả năng khôi phục/hoàn tác của trạng thái trò chơi (History Tree).

---

## 5. Quy Tắc Render Giao Diện Từ State Của Head

1. **Nguyên lý Single Source of Truth:**
   - UI **LUÔN LUÔN** vẽ lại toàn bộ giao diện từ `tree.nodes[tree.headId].snapshot`.
   - UI **TUYỆT ĐỐI KHÔNG** tự ý cộng dồn hay trừ bớt dữ liệu hiển thị dựa trên mảng `events` trả về.
2. **Vai trò của `events`:**
   - Mảng `events` trả về từ `dispatch` chỉ phục vụ duy nhất mục đích kích hoạt **hiệu ứng nghe-nhìn (Audio/Visual FX)**:
     - Hiện thông báo Toast nhận manh mối mới (`clueCollected`).
     - Phát âm thanh chiến thắng khi giải đố xong (`puzzleSolved`).
     - Chạy hoạt ảnh hoa sen bay vào ví tiền (`rewardGranted`).
     - Phát tia sáng hào quang quanh An trên bục (`outfitChanged`).
3. **Sự kiện `stateRestored`:**
   - Khi người chơi thực hiện `undo`, `redo`, `checkout` hoặc tải lại game từ `localStorage`, Core Engine phát ra sự kiện `stateRestored`.
   - UI lắng nghe sự kiện này để đồng bộ và vẽ lại toàn bộ màn hình theo đúng snapshot của `headId`.

---

## 6. Cơ Chế Tương Tác Trong Không Gian (Point-and-Click / Move)

1. **Chuẩn hóa tọa độ:**  
   Người chơi di chuyển tự do trong khu vực. UI quy đổi tọa độ hiển thị của nhân vật về tọa độ chuẩn hóa $(x, y) \in [0..1]$ đối với khu vực hiện tại.
2. **Kiểm tra mỗi khung hình (`requestAnimationFrame`):**  
   UI gọi hàm thuần túy:
   ```ts
   const targetId = nearestInteractable(currentHeadState, content, playerNormalizedPos);
   ```
   - Nếu `targetId !== null`: UI hiển thị bóng gợi ý phím `"Bấm E để tương tác"` nổi trên đầu vật thể hoặc nhân vật đó.
   - Nếu `targetId === null`: UI ẩn biểu tượng gợi ý tương tác.
3. **Khi người chơi bấm phím `E`:**  
   UI gửi lệnh:
   ```ts
   dispatch(tree, {
     type: 'interact',
     payload: {
       targetId,
       playerPos: playerNormalizedPos
     }
   }, content);
   ```

---

## 7. Bảng Đối Chiếu: "Nút Bấm Giao Diện (UI) → Lệnh Core Engine"

Bảng dưới đây quy định chính xác hành động UI tương ứng với từng lệnh của Core:

| Nút / Thao tác trên giao diện | Lệnh Core Engine phát đi | Dữ liệu kèm theo (`Payload`) | Ghi chú hành vi |
| :--- | :--- | :--- | :--- |
| **"Bắt đầu" / "Vào chương" / "Tiếp tục"** | `chapter/enter` | `{ chapterId }` | Bước vào phân cảnh của chương |
| **"Xem lại chương"** | `chapter/replay` | `{ chapterId }` | Chơi lại câu đố; không cộng Sen Ngọc lần 2 |
| **Bấm `E` với NPC hoặc Đồ vật** | `interact` | `{ targetId, playerPos }` | Mở hội thoại, câu đố hoặc nhặt đồ |
| **"Bà kể tiếp nhé" / "Tiếp tục thoại"** | `dialogue/advance` | `{ dialogueId }` | Chuyển sang câu thoại tiếp theo |
| **Chọn câu trả lời trong hộp thoại** | `dialogue/choose` | `{ dialogueId, choiceIndex }` | Rẽ nhánh hội thoại |
| **Nút "Xác nhận" (Câu đố loại 1 bước)** | `puzzle/submit` | `{ puzzleId, answer }` | Nộp đáp án câu đố |
| **Đặt khuy / Ghép hình (Câu đố nhiều bước)** | Phiên `puzzle`: `dispatchSession` | `{ pieceId, slotId }` | Thực hiện trên phiên cục bộ, chưa ghi cây |
| **"Hoàn tác" trong câu đố** | Phiên `puzzle`: `undoSession` | Không có | Lùi 1 bước xếp hình trong phiên |
| **"Làm lại" trong câu đố** | Phiên `puzzle`: `redoSession` | Không có | Tiến 1 bước trong phiên |
| **"Làm lại từ đầu" trong câu đố** | Phiên `puzzle`: `resetSession` | Không có | Xóa hết các bước thử, về trạng thái rỗng |
| **"Kiểm tra câu đố"** | Phiên `puzzle`: `commitSession` | `{ puzzleId }` | Nếu đúng sinh lệnh `puzzle/solve` vào Cây Game |
| **Bấm nút "Gợi ý" (? đèn lồng)** | `puzzle/hint` | `{ puzzleId }` | Mở tầng gợi ý tiếp theo (1 -> 2 -> 3) |
| **"Mặc thử ngay"** | `studio/open` + `studio/equip` | `{ accessoryId }` | Mở Studio và gắn phụ kiện lên người |
| **"Lưu bộ phối"** | `closet/saveOutfit` | `{ garmentId, colorPalette, ... }` | Chuyển bộ đồ đang mặc vào Tủ đồ cá nhân |
| **"Quay lại khu vực trước"** | `area/goBack` | Không có | Quay lại phòng trước (KHÔNG phải undo lịch sử) |
| **"Mua phụ kiện"** | `wallet/spend` | `{ amount, purpose: 'buy_accessory', itemId }` | Trừ Sen Ngọc và mở khóa phụ kiện |
| **"Đọc xong thẻ bảo tàng"** | `museum/readCard` + `museum/claimReward` | `{ cardId }` | Đánh dấu đã đọc và nhận 15 Sen Ngọc |

---

## 8. Bảng Sự Kiện Kích Hoạt Hoạt Ảnh (Events for Animation)

Core Engine phát ra các sự kiện một chiều (`DomainEvent`) ngay sau khi lệnh áp dụng thành công. UI dựa vào payload của sự kiện này để kích hoạt âm thanh và hoạt họa:

```ts
export type DomainEvent =
  | { type: 'clueCollected'; payload: { clueId: string } }
  | { type: 'itemPicked'; payload: { itemId: string } }
  | { type: 'puzzleSolved'; payload: { puzzleId: string } }
  | { type: 'puzzleFeedback'; payload: { puzzleId: string; result: 'incorrect' | 'hint' } }
  | { type: 'rewardGranted'; payload: { rewardId: string; amount: number } }
  | { type: 'outfitChanged'; payload: { garmentId: string; slot: string } }
  | { type: 'outfitSaved'; payload: { outfitId: string } }
  | { type: 'areaEntered'; payload: { areaId: string } }
  | { type: 'stateRestored'; payload: { saveVersion: string } }
  | { type: 'sideFlipped'; payload: { side: 'mat_phai' | 'mat_trai' } };
```

### Mô tả chi tiết Payload:
- **`clueCollected` (`{ clueId }`):** Kích hoạt hoạt ảnh cuộn giấy mở ra góc phải màn hình, số lượng manh mối trên thanh sổ tay nảy số.
- **`itemPicked` (`{ itemId }`):** Hiệu ứng sprite đồ vật thu nhỏ và bay vào ô túi đồ tương ứng.
- **`puzzleSolved` (`{ puzzleId }`):** Phát hiệu ứng pháo hoa hoa sen, mở chốt khóa cửa hoặc hiện vầng sáng mở đường.
- **`puzzleFeedback` (`{ puzzleId, result }`):** Khi `result === 'incorrect'`, rung lắc nhẹ khung câu đố trong 0.3s; khi `result === 'hint'`, hiện bóng thoại của Nếp.
- **`rewardGranted` (`{ rewardId, amount }`):** Hiện biểu tượng `+X Sen Ngọc` bay vút lên biểu tượng ví tiền ở góc trên màn hình.
- **`outfitChanged` (`{ garmentId, slot }`):** Bụi sao lấp lánh (sparkles) xuất hiện quanh An trên bục đứng Studio.
- **`outfitSaved` (`{ outfitId }`):** Hiển thị toast thông báo: *"Đã lưu bộ phối vào Tủ đồ!"*.
- **`areaEntered` (`{ areaId }`):** Làm mờ màn hình (fade-out 150ms) rồi hiện phòng mới (fade-in 150ms), cập nhật tiêu đề khu vực.
- **`stateRestored` (`{ saveVersion }`):** UI tái lập toàn bộ trạng thái render từ snapshot nút đầu.
- **`sideFlipped` (`{ side }`):** Chuyển màu ánh sáng môi trường từ ấm sang ánh tơ lạnh (chỉ kích hoạt khi `features.latVai = true`).

---

## 9. Cơ Chế Lưu Game & Quản Trị Trạng Thái (Persistence Policy)

Tuân thủ nghiêm ngặt quyết định kiến trúc tại `docs/01-overview/decisions.md` (mục 8):

1. **Quy tắc Lưu Trữ:**
   - Ứng dụng chỉ sử dụng **đúng 1 slot lưu trữ duy nhất** tại `localStorage`, khóa:  
     `"tiem-may-nep-save-v1"`
   - UI tự động lưu sau mỗi lệnh thay đổi trạng thái được ghi vào Cây Game chính (`dispatch` thành công).
   - **Tuyệt đối KHÔNG lưu game ở giữa phiên Studio hoặc phiên câu đố dang dở** (chỉ lưu khi người chơi nhấn "Lưu bộ phối" hoặc "Giải xong").
2. **Cắt tỉa bộ nhớ trước khi ghi:**
   - Trước khi gọi `toJSON`, UI gọi hàm `prune(tree, 200)` để đảm bảo cây lịch sử không bao giờ vượt quá 200 nút, bảo vệ dung lượng trình duyệt.
   - Mã mẫu lưu game chuẩn mực phía UI:
     ```ts
     function autoSaveGame(tree: HistoryTree) {
       try {
         const prunedTree = prune(tree, 200);
         const jsonString = toJSON(prunedTree);
         localStorage.setItem('tiem-may-nep-save-v1', jsonString);
       } catch (err) {
         console.error('Không thể tự động lưu game vào localStorage:', err);
       }
     }
     ```
3. **Khởi động và Phục hồi lỗi:**
   - Khi mở app, gọi `fromJSON(savedStr, content)`.
   - Nếu tệp save hợp lệ: hiển thị tiếp tục game.
   - Nếu tệp save hỏng: UI hiển thị thông báo nhẹ nhàng: *"Dữ liệu lưu bị lỗi, tiệm đã khởi tạo chuyến đi mới cho bạn nhé!"* và bắt đầu lại từ `node-root`.
   - Có thể gửi tệp lưu sang endpoint `POST /api/save/verify` để kiểm tra độ tin cậy.
4. **Nút "Chơi lại từ đầu":**
   - UI hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn bắt đầu lại từ đầu? Mọi trang phục và tiến trình cũ sẽ được đặt lại."*
   - Khi người dùng đồng ý: UI xóa khóa `localStorage.removeItem('tiem-may-nep-save-v1')` và khởi tạo lại cây mới từ `createInitialTree(createInitialState(content))`.
5. **Chế độ Debug & Phản hồi UI:**
   - Tính năng Xuất/Nhập JSON thủ công chỉ hiển thị khi bật cờ `settings.devDebug === true`.
   - Các câu thông báo giao diện như *"Đã lưu bộ phối"* hoặc *"Chưa lưu được. Thử lại nhé."* là trách nhiệm của UI, Core chỉ chịu trách nhiệm trả về kết quả `{ ok: boolean, reason?: string }`.

---

## 10. Bảng Tọa Độ & Công Thức Chuyển Đổi Tọa Độ Màn Hình ↔ Tọa Độ Chuẩn Hóa

### 10.1. Quy chuẩn không gian hiển thị
- **Khung hình Logic (Virtual Canvas):** Chuẩn tỷ lệ $8:5$, kích thước logic cố định là **$800 \times 500$ px**.
- **Hiển thị Pixel Art:** Nhân đôi nguyên lần ($\times 2$) thành artboard **$1600 \times 1000$ px** sắc nét (Crisp Pixel).
- **Tọa độ Core Engine:** Luôn là số thực chuẩn hóa trong đoạn $[0..1]$:
  - Gốc tọa độ $(0, 0)$ nằm ở góc trên bên trái khu vực.
  - Tọa độ $(1, 1)$ nằm ở góc dưới bên phải khu vực.

### 10.2. Thuật toán Fit khung hình bằng `contain` (Letterbox / Pillarbox)
Khi hiển thị khung hình trò chơi trên bất kỳ kích thước màn hình thiết bị nào ($W_{screen} \times H_{screen}$) với chế độ `object-fit: contain`:

$$\text{Tỷ lệ co giãn } scale = \min\left(\frac{W_{screen}}{800}, \frac{H_{screen}}{500}\right)$$

$$\text{Chiều rộng hiển thị thực tế } W_{render} = 800 \times scale$$

$$\text{Chiều cao hiển thị thực tế } H_{render} = 500 \times scale$$

$$\text{Độ lệch ngang } offsetX = \frac{W_{screen} - W_{render}}{2}$$

$$\text{Độ lệch dọc } offsetY = \frac{H_{screen} - H_{render}}{2}$$

### 10.3. Công thức chuyển đổi 2 chiều

#### A. Từ Tọa độ Chuột / Cảm ứng màn hình $\rightarrow$ Tọa độ Chuẩn hóa Core $[0..1]$
Khi người chơi bấm chuột hoặc chạm màn hình tại tọa độ $(X_{screen}, Y_{screen})$:

$$x_{logic} = \frac{X_{screen} - offsetX}{scale}$$

$$y_{logic} = \frac{Y_{screen} - offsetY}{scale}$$

$$x_{norm} = \text{clamp}\left(\frac{x_{logic}}{800}, 0, 1\right)$$

$$y_{norm} = \text{clamp}\left(\frac{y_{logic}}{500}, 0, 1\right)$$

*(Trong đó hàm `clamp(v, min, max)` giữ cho giá trị không vượt quá đoạn $[min, max]$).*

#### B. Từ Tọa độ Chuẩn hóa Core $[0..1]$ $\rightarrow$ Vị trí vẽ trên Màn hình (Canvas Screen)
Khi UI cần vẽ nhân vật hoặc nhãn tương tác từ Core lên màn hình:

$$X_{screen} = offsetX + \left(x_{norm} \times 800 \times scale\right)$$

$$Y_{screen} = offsetY + \left(y_{norm} \times 500 \times scale\right)$$

### 10.4. Ví dụ kiểm chứng bằng số cụ thể
Giả sử người dùng sử dụng màn hình máy tính có độ phân giải $W_{screen} = 1920$ px, $H_{screen} = 1080$ px:
1. $scale = \min(1920 / 800, 1080 / 500) = \min(2.4, 2.16) = 2.16$.
2. $W_{render} = 800 \times 2.16 = 1728$ px; $H_{render} = 500 \times 2.16 = 1080$ px.
3. $offsetX = (1920 - 1728) / 2 = 96$ px (mỗi bên có dải đen 96px); $offsetY = (1080 - 1080) / 2 = 0$ px.
4. Một click chuột ở vị trí $X_{screen} = 960$ px, $Y_{screen} = 540$ px:
   - $x_{logic} = (960 - 96) / 2.16 = 400$ px.
   - $y_{logic} = (540 - 0) / 2.16 = 250$ px.
   - $x_{norm} = 400 / 800 = 0.5$; $y_{norm} = 250 / 500 = 0.5$ (Chính xác tâm của khu vực).
