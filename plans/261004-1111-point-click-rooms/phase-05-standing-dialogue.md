# Phase 05 — standing-dialogue

## Context Links
- Plan: ./plan.md · Brainstorm §4.3 · Tham chiếu: Áo cưới giấy (tranh đứng + khung thoại phía trước)

## Overview
- Priority: high · Status: pending · Effort: 1 ngày · Không phụ thuộc phase nào, chạy song song được

## Key Insights
- `DialogueBox` chỉ được dùng ở Game.tsx với props `{speaker,text,preset,children}`. Viết lại phần thân và **giữ nguyên props**, nhờ vậy Game.tsx (thuộc phase 04) không phải sửa.
- `Modal` đã nhận `className` và giữ `role="dialog"`, focus trap, Esc. Tiếp tục bọc bằng Modal để test `getByRole('dialog')` vẫn chạy.
- Sprite NPC `assets/characters/<id>/view-front.png` có kích thước 64×96 (đã kiểm `ba-mai`). Phóng nguyên ×4–×6 ra tranh đứng pixel thật, không cần vẽ thêm.
- An là sheet hi-res: ô 176×416, cell 0 là front idle. Ghép đủ `AN.layers` + biến thể preset (`anLayerPath`), vẽ smoothed.
- `DialogueSchema` chỉ có `speaker` cho cả hội thoại, node không có speaker riêng.

## Requirements
- Bố cục (`.dialogue-stage`):
  - Khung thoại full-width ở đáy, cao khoảng 28vh, khung 9-slice có sẵn (`Slice` + `CARD_FRAME`).
  - Tên người nói đặt trong tag vàng; typewriter giữ như cũ.
  - Phía sau khung, chân tranh đứng chìm dưới mép khung: **phải** là NPC `speaker`, **trái** là An.
- Ai đang nói:
  - `speaker === 'An'`: An sáng, bên phải trống.
  - `portraitFor(speaker).kind === 'emblem'` (lời kể, thư): không tranh NPC; An mờ hoặc ẩn; khung thoại ở giữa.
  - Còn lại: NPC sáng, An tối (`filter: brightness(.45)`, steps).
- `ghost` (Bóng mờ Ông Lệ, Băng ghi âm): opacity .7 + nhấp nháy 2 frame.
- Scale NPC: `n = clamp(floor(availableH / 96), 3, 6)` với `availableH ≈ 62vh`. Cập nhật khi resize.
- Vào cảnh: tranh trượt lên 8px `steps(4)` + fade, tắt khi reduced-motion.
- ≤ 640px: ẩn An khi An không nói, NPC n = 3.
- Click vào text thì hiện hết dòng (giữ hành vi cũ). Nút hành động giữ nguyên trong `children`.

## Related Code Files
**Modify:** `src/game/DialogueBox.tsx`, `src/game/npc-portraits.ts`
**Create:** `src/game/standing-dialogue.css`

## Existing code audit
REUSE-AS-IS: `portraitFor`, `anLayerPath`, `AN_PORTRAIT_LAYERS` (npc-portraits.ts), `typewriter` (motion.ts), `Modal` (className), `Slice`/`CARD_FRAME`.
REUSE-EXTEND: thêm vào `npc-portraits.ts` helper `standingSource(speaker)` trả `{kind:'sprite',path}` / `{kind:'an'}` / `null`. Sau khi viết lại, nếu `NPC_CROP` hoặc `AN_CROP` không còn dùng thì xoá (orphan do phase này tạo ra).

## Reuse strategy
REUSE-EXTEND. Viết lại thân `DialogueBox`, giữ export và props, CSS mới ở file riêng. Rule CSS cũ của portrait trong `game.css`/`components.css` bỏ nguyên, chỉ ghi chú nếu thành dead code.

## Implementation Steps
1. `standingSource()` trong npc-portraits.ts.
2. Component con `StandingPortrait` trong DialogueBox.tsx: canvas, NPC vẽ `imageSmoothingEnabled=false` ở scale nguyên, An vẽ smoothed.
3. Dựng bố cục stage + quy tắc sáng/tối + responsive.
4. `npm run lint`. Kiểm tay: hội thoại với mèo (sprite 32×32, cần n lớn hơn: tính theo chiều cao thật của sprite), cầu thang (An tự nói?), Bà dặn dò.

## Todo List
- [x] standingSource
- [x] StandingPortrait canvas
- [x] Layout + speaker logic + ghost
- [x] Responsive + reduced-motion
- [x] lint (tsc) · kiểm tay trong trình duyệt chưa làm

## Success Criteria
- Mở hội thoại NPC: thấy tranh NPC ≥ 288px cao ở 1366×768, nét pixel không mờ. An ở bên trái tối đi.
- `getByRole('dialog')` vẫn tìm thấy. Esc, Tab trap, nút "Tiếp tục" giữ nguyên hành vi.
- DialogueBox.tsx < 200 LOC.

## Risk Assessment
- Mèo `cat-nep` chỉ 32×32: scale theo chiều cao sprite thật (`n = floor(targetH / img.height)`), không fix cứng 96.
- An hi-res đặt cạnh NPC pixel lộ lệch mật độ pixel (đã biết từ brainstorm). Chấp nhận cho MVP; stretch là tranh bán thân Gemini qua `process-ai-asset.py`.

## Next Steps
Phase 07 kiểm hội thoại.
