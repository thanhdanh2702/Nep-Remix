# Phase 07 — commit-push

## Context Links
- Plan: ../plan.md · CLAUDE.md § Git (conventional commits, clean messages)

## Overview
- Priority: high · Status: pending · Effort: 0.5h

## Requirements
- Commit theo từng nhóm logic, lên nhánh `main` của Nep-Remix (`origin` = `thanhdanh2702/Nep-Remix`). User đã yêu cầu commit và push trực tiếp.
- Thứ tự commit:
  1. `chore(assets): drop off-spec 64x96 character art and broken overlays; restore raw screens`: các file ảnh đã xóa hoặc thay, `data/runtime-assets.json`, `data/asset-gaps.json`, các fallback trong code, các CSS bỏ pixelated, 2 test đã sửa.
  2. `docs(assets): re-base asset spec on An`: phase 01.
  3. `docs: sync design system and feature docs with An unit`: phase 02.
  4. `feat(game): size every character from one An-based scale`: phase 03.
  5. `feat(story): An walks to the clicked hotspot; NPCs face her`: phase 04.
  6. `feat(museum): add character and keepsake codex`: phase 05.
  7. `style(ui): tune human height per screen from screenshots`: phase 06, kèm báo cáo QA và các file plan.
- Không commit:
  - `artifacts/`, `test-results/`;
  - `.cook-state.json`, `.claude/session-state/`;
  - `soundtrack/` (chưa nằm trong phạm vi, hỏi user sau).
- Không thêm dòng AI attribution. Không dùng `--no-verify`.
- Chạy `/simplify` trên các file code đã đổi trước commit code đầu tiên. Commit chỉ có docs hoặc test thì không cần.
- `git push origin main`. Nếu bị từ chối vì remote đã có commit mới thì `git pull --rebase` rồi push lại. Gặp conflict thì dừng và báo user.

## Success Criteria
- `git status` sạch, trừ các file ngoài phạm vi nêu trên.
- `git log origin/main` có đủ các commit trên.
