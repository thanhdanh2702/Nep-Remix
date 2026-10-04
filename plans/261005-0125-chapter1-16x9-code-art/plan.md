---
title: chapter1-16x9-code-art
status: pending
mode: hard
scope: hold
priority: high
effort: 2 days
created: 2026-10-05
blockedBy: [workshop-selfie-ai]
blocks: [pixel-ui-kit]
---

# Chương 1 chơi được + phòng cốt truyện 16:9 + art vẽ bằng code

Phòng cốt truyện cố định 800×500 (8:5) → pillarbox trên màn 16:9 (user yêu cầu sửa). Engine phòng hard-code `prologue` nên c1 báo "Thiếu asset" ngay khi vào. `c1.json` không thể chơi hết qua UI (không có UI ghép đồ, puzzle "present"/styling, bàn thờ nằm mặt `trai` bị khóa, `puzzle/submit` bỏ qua phần thưởng số nhiều, exit s3 trỏ `'prologue'`). User muốn **mọi art mới vẽ bằng code**, không dùng Gemini sinh ảnh.

Nguồn: khảo sát engine (inline, 05/10 — tóm tắt trong từng phase), `../../../reports/Claude vẽ pixel UI bằng code.md` (pipeline char-grid/procedural), memory `finish-strategy-261004`, `autonomy-only-api-key`.

## Goal
- Mọi phòng cốt truyện hiển thị 16:9; prologue không lệch hotspot.
- Chương 1 (3 phòng) mở sau prologue, chơi hết từ đầu tới màn kết, art 320×180 vẽ bằng script Python/Pillow trong repo.

## Non-goals
- Chương 2–5, Lật vải, âm thanh, portrait mới cho NPC (dùng sprite 64×96 có sẵn).
- Viết lại cốt truyện c1; chỉ thêm tối thiểu lời thoại để mỗi đoạn ≥ 2 node, giữ nội dung lịch sử đã có (người duyệt văn hóa xem lại sau).
- Kéo stage xuống dưới HUD đáy.

## Phases
| # | Name | Status | Depends on | Owner |
|---|------|--------|------------|-------|
| 01 | [engine-16x9-prologue](phase-01-engine-16x9-prologue.md) | pending | — | developer |
| 02 | [c1-code-art](phase-02-c1-code-art.md) | pending | 01 | developer |
| 03 | [c1-core-content](phase-03-c1-core-content.md) | pending | 02 | developer |
| 04 | [c1-gameplay-ui](phase-04-c1-gameplay-ui.md) | pending | 03 | developer |

Chạy tuần tự. `data/runtime-assets.json` là file sinh tự động (`npm run audit:assets`) — phase 01 và 02 đều regenerate, tuần tự nên không xung đột.

## Dependencies
Python + Pillow (đã có). Không thêm npm dependency. Stack: `/frontend-development`.

## Risks & mitigations
- Migrate rect prologue sai → hotspot lệch: rect chuẩn hóa theo stage → công thức cố định `x' = (45 + x·800)/890`, `w' = w·800/890`; `check-game` + `game.spec` point-and-click bắt lỗi.
- Art procedural xấu/khó đọc: palette khóa, preview ×3 xem bằng mắt, tối đa 3 vòng; vật tương tác phải tương phản rõ (outline tối).
- Test cũ khóa giá trị 800 (`game.spec.ts:127`, `journey-map.spec.ts:56`) và modal "đang chuẩn bị" c1 (`game.spec.ts:67-72`) → cập nhật trong phase sở hữu.
- Self-check 3–7 dùng id c1 → phase 03 giữ pass.

## Rollback
Revert các commit; asset prologue cũ 800×500 còn trong git history.

## Validation Log
User yêu cầu tự quyết (memory `autonomy-only-api-key`). Quyết định:
| # | Câu hỏi | Chọn | Lý do |
|---|---|---|---|
| 1 | World size | Theo từng phòng = kích thước nền; prologue nới 890×500, c1 640×360 | Đều ≈16:9, engine không còn hằng số |
| 2 | Prologue 16:9 | Vẽ bằng code 45 px mỗi bên (kéo dài tường/sàn từ cột rìa + chi tiết pixel) | User muốn vẽ bằng code; hotspot chỉ dịch offset |
| 3 | Art c1 | Vẽ mới 3 phòng bằng code 640×360, bỏ art 4:3 cũ | Đồng bộ phong cách; s3 chưa có art |
| 4 | Bàn thờ mặt `trai` | Chuyển sang `phai` | Lật vải tắt cho 10/10 |
| 5 | Phần thưởng số nhiều | Mở rộng `puzzle/submit` xử lý `rewardItemIds`/`dialogueTriggerIds`/unlock | Một nguồn logic, self-check bao phủ |
| 6 | Cutout glow c1 | Không làm cutout; highlight dùng khung rect (fallback) | Tiết kiệm thời gian |

Red-team (05/10): `game.spec.ts` (01: assert world; 04: case c1) và `c1.json` (01: aspect/logicalSize; 03: nội dung) được sửa ở 2 phase — chấp nhận vì chạy tuần tự, mỗi phase chỉ sửa đúng dòng được giao. Plan chỉ bắt đầu sau khi plan workshop-selfie-ai xong (cùng đụng `Game.tsx`). CG/overlay prologue phải nới cùng offset 45 px.
