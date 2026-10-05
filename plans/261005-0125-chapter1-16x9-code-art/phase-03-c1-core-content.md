# Phase 03 — c1-core-content

## Context Links
- Plan: ./plan.md

## Overview
- Priority: high · Status: pending · Est. effort: 3–4 h · Depends on: 02

## Key Insights (khảo sát 05/10)
- `puzzle/submit` chỉ xử lý `rewardItemId`/`dialogueTriggerId` số ít (`puzzle-commands.ts:158,176`); bỏ qua `rewardItemIds`, `dialogueTriggerIds`, unlock s3. `item/use` cấp phần thưởng số nhiều + unlock exit (`item-commands.ts:125-150`) nhưng không trigger dialogue → clue `thu-chong`, `van-tu` không lấy được.
- `p-c1-escape` cần `dung_cu_moc_then_cua` từ `item/combine` (`item-commands.ts:6-9`).
- `p-c1-altar-cut-threads` mặt `trai` (bị khóa vì Lật vải tắt `store.ts:6,12`).
- s3 exit `{exit: "prologue"}` không phải area id → `area/goTo` lỗi (reason tiếng Anh).
- 8 dialogue c1 đều 1 node. Không có bước hoàn thành chương c1.
- Self-check 3–7 (`src/core/self-check.ts:216-311`) dùng id/area c1; `scripts/check-game.ts:14-37` replay prologue + kiểm rect 0..1.

## Requirements
- Core: `puzzle/submit` hỗ trợ `rewardItemIds[]`, `dialogueTriggerIds[]`, unlock area/exit như `item/use` (dùng chung helper, không nhân bản logic); reason lỗi tiếng Việt.
- `c1.json`: altar → `phai`; rect mọi interactable lấy từ `assets/areas/chapter-1/<area>/layout.json` (phase 02); thêm `exitArrows` cho mọi exit; s3 exit → kết thúc chương (dùng cơ chế `chapter/complete` hiện có, không trỏ `'prologue'`); mỗi dialogue ≥ 2 node (giữ câu gốc, thêm câu nối ngắn, không thêm dữ kiện lịch sử mới); thêm dialogue kết chương.
- `scripts/check-game.ts`: thêm walk-through c1 bằng `dispatch` (pick → combine → use → present → styling → complete) + rect c1 trong 0..1 + exit arrows hợp lệ.
- Self-check 15/15 vẫn pass.

## Related Code Files
**Modify:** `src/core/commands/puzzle/puzzle-commands.ts`, `src/core/commands/item/item-commands.ts` (chỉ khi tách helper dùng chung), `src/content/chapters/c1.json`, `scripts/check-game.ts`, `src/core/self-check.ts` (chỉ khi cần cập nhật kỳ vọng c1)

## Reuse strategy
EXTRACT-SHARED — helper cấp thưởng/unlock dùng chung cho `item/use` và `puzzle/submit`.

## Implementation Steps
1. Helper chung + `puzzle/submit` số nhiều.
2. c1.json (side, rect, exitArrows, exit kết chương, dialogue nodes).
3. check-game c1 walk-through.
4. lint, test:core.

## Todo List
- [x] helper + puzzle/submit
- [x] c1.json
- [x] check-game c1
- [x] lint + test:core pass

## Success Criteria
- `npm run test:core`: 15/15 + PASS prologue + PASS c1 walk-through (in tên các bước).
- Mọi clue c1 (`tiet-hanh`, `thu-chong`, `van-tu`) thu được trong walk-through.

## Test Spec
- Unit (check-game): `puzzle/submit` với `rewardItemIds:[a,b]` → inventory có a,b; `dialogueTriggerIds` → dialogue mở; submit 2 lần không nhân đôi thưởng; sai đáp án → reason tiếng Việt, state không đổi.

## Risk Assessment
- Đổi `puzzle/submit` ảnh hưởng prologue → check-game prologue bắt.

## Next Steps
Phase 04 làm UI cho các bước này.
