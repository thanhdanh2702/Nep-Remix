---
title: polish-pixel-ui-handoff
status: pending
mode: fast
scope: hold
priority: high
effort: 1 day
created: 2026-10-05
blockedBy: [chapter1-16x9-code-art]
blocks: []
---

# Hoàn thiện: pixel UI vẽ bằng code + bàn giao "chỉ cần API key"

Gameplay + AI đã xong (prologue, c1, Studio AI, Xưởng may, selfie). Còn: 9 ảnh UI là ảnh hi-res chưa về lưới pixel; thiếu khung hội thoại 9-slice, icon HUD, motif; hướng dẫn chơi còn mô tả WASD/E trong phòng (đã là point-and-click); chưa có lệnh setup hỏi API key; docs lệch.

Nguồn: `../reports/cook-261004-1507-p0-gemini-wiring-deploy.md`, `../../../plans/reports/explore-261004-1357-repo-gap-audit.md` (mục 6, 9), memory `autonomy-only-api-key`, `finish-strategy-261004` (mọi art mới vẽ bằng code).

## Goal
- UI đồng nhất lưới pixel; phần tử mới (khung thoại, icon, motif) vẽ bằng char-grid qua `scripts/pixel/pixel-grid.py` + skill `pixel-draw`.
- Người nhận repo: `npm install` → `npm run setup` (hỏi key, ghi `.env`) → `npm run dev`. Deploy = 1 lệnh trong runbook.
- Docs, hướng dẫn trong game, README khớp hành vi thật.

## Non-goals
Chương 2–5, âm thanh, Lật vải, đổi palette toàn app.

## Phases
| # | Name | Status | Depends on | Owner |
|---|------|--------|------------|-------|
| 01 | [setup-and-copy](phase-01-setup-and-copy.md) | pending | — | developer |
| 02 | [pixel-ui-normalize](phase-02-pixel-ui-normalize.md) | pending | — | developer |
| 03 | [pixel-ui-draw](phase-03-pixel-ui-draw.md) | pending | 02 | developer |
| 04 | [docs-sync](phase-04-docs-sync.md) | pending | 01, 03 | docs-manager |

01 song song với 02 (không chung file). 02 → 03 tuần tự (cùng regenerate `data/runtime-assets.json`).

## Risks
- Chuẩn hóa ảnh hi-res làm vỡ test kích thước asset → `audit:assets` + `test:assets` sau mỗi phase.
- `.env` chứa key → setup script không in key, `.env` đã gitignore.

## Rollback
Revert commit; ảnh gốc còn trong git history.

## Validation Log
Tự quyết (memory `autonomy-only-api-key`): fast mode, không red-team (không chạm security/dữ liệu ngoài việc ghi `.env` cục bộ).
