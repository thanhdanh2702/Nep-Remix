---
title: point-click-rooms
status: completed
mode: hard
scope: hold
priority: critical
effort: ~5 ngày
created: 2026-10-04
blockedBy: []
blocks: []
---

# Phòng cốt truyện kiểu point-and-click + highlight + hội thoại tranh đứng

An đi trong phòng bằng WASD với `scale 0.25` nên nhân vật bé. Người chơi phải lại gần vật thì mới có prompt E nổi giữa màn, và HUD che khoảng 40% cảnh. Plan này đổi phòng sang kiểu Áo cưới giấy: không có avatar, click hoặc tap vào hotspot, có viền sáng và mũi tên chuyển cảnh. Hub giữ WASD và thêm viền sáng cho biển. Hội thoại hiện tranh đứng lớn.

Nguồn: `plans/reports/brainstorm-261004-1047-point-click-ui-overhaul.md`, `plans/reports/reuse-scout-261004-1111-point-click.md`.
Stack skill cho cook: `/frontend-development`, `/react-best-practices`.

## Goal
- Màn mở đầu chơi trọn chỉ bằng chuột, tap hoặc Tab+Enter, không cần WASD.
- Mọi hotspot sáng viền khi hover hoặc focus. Mọi lối ra có mũi tên pixel nhún.
- Hội thoại có tranh đứng NPC ở bên phải, An ở bên trái. Người đang nói sáng, người còn lại tối.
- Lên hub, khi An đến gần thì biển khu vực sáng viền.

## Non-goals
- Không sửa core command. `interact` và `area/goTo` dùng nguyên như cũ.
- Không làm "cầm vật phẩm trên con trỏ" cho puzzle `use`; giữ modal hiện tại.
- Không làm thêm chương 1–5, không vẽ tranh bán thân mới, không dùng AI ngoài Gemini.
- Không đổi Studio, Tủ đồ, Bảo tàng, bản đồ chương.

## Phases
| # | Name | Status | Depends on | Owner |
|---|------|--------|------------|-------|
| 01 | content-exit-arrows | completed | — | Core FE |
| 02 | pixel-art-highlight-lib | completed | — | Core FE |
| 03 | prologue-hotspot-cutouts | completed | — | Art |
| 04 | room-scene-point-click | completed | 01, 02 (03 không chặn: có fallback) | Core FE |
| 05 | standing-dialogue | completed | — | AI-Game-Content / FE |
| 06 | hub-sign-glow-and-scene-cleanup | completed | 02, 04 | Core FE |
| 07 | browser-tests-rewrite | completed | 04, 05, 06 | QA (bất kỳ) |

Các nhánh chạy song song: {01, 02, 03, 05} → 04 → 06 → 07.

## File ownership (độc quyền)
- 01: `src/content/schema.ts`, `src/content/chapters/prologue.json`
- 02: `src/ui/pixel-art.ts` (mới), `src/game/hotspot-highlight.ts` (mới), `src/ui/motion.css`
- 03: `scripts/build-hotspot-cutouts.py` (mới), `scripts/hotspot-masks.json` (mới), `assets/areas/prologue/*/hotspot-*.png` (mới), `data/runtime-assets.json` (do `audit:assets` sinh ra)
- 04: `src/game/RoomScene.tsx` (mới), `src/game/room-scene.css` (mới), `src/game/Game.tsx`, `src/game/fullscreen.css`
- 05: `src/game/DialogueBox.tsx`, `src/game/npc-portraits.ts`, `src/game/standing-dialogue.css` (mới)
- 06: `src/game/Scene.tsx`, `src/game/physics.ts`, `src/game/AreaSign.tsx`, `src/game/hub.css`, `scripts/check-game.ts`. Bước 1–2 (glow) chỉ cần 02 nên làm sớm được; bước 3 (dọn nhánh phòng) phải chờ 04.
- 07: `tests/browser/game.spec.ts`, `tests/browser/journey-map.spec.ts`, `tests/browser/ui-polish.spec.ts`

## Dependencies
Không thêm dependency npm. Python + Pillow (đã dùng cho `audit:assets`).

## Risks & mitigations
- Test story vỡ khi bỏ WASD trong phòng → phase 07 viết lại. Trong lúc làm, chạy `test:core` để giữ core xanh.
- Cutout lệch với overlay theo trạng thái (vd. vải phủ đã rơi) → hotspot đã giải thì dùng khung góc (fallback).
- Màn hình dọc: phòng 8:5 hiện contain nên nhỏ → chấp nhận cho MVP, hotspot vẫn ≥ 44px nhờ vùng chạm tối thiểu.
- Deadline 10/10: thứ tự cắt là 03 (đã có fallback) → hiệu ứng nhặt đồ bay vào túi ở 04 → nút "Soi".

## Rollback
Mỗi phase là một commit riêng. Phase 04 + 06 là một cặp: muốn revert thì revert cả hai để phòng quay về `Scene` WASD. 01 chỉ thêm field optional nên revert an toàn. 03 chỉ thêm file mới.

## Validation Log
Không chạy (risk 1). Các quyết định đã chốt trong brainstorm: phòng không avatar, hub giữ WASD, tranh đứng.
