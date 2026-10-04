# Cook — point-click-rooms (2026-10-04)

Plan: `plans/261004-1111-point-click-rooms/` · 7/7 phase xong.

## Phases executed
| # | Phase | Ai làm | Kết quả |
|---|---|---|---|
| 01 | content-exit-arrows | inline | `ExitArrowSchema` + `exitArrows` optional + superRefine; prologue có mũi tên `stairs` (via `hitbox-stairs`) và `back`; 9 `rect` canh lại theo bbox thật của vật |
| 02 | pixel-art-highlight-lib | developer | `pixel-art.ts` (grid → canvas/dataURL, cursor, mũi tên, góc, sparkle), `hotspot-highlight.ts` (bakeOutline, drawBrackets, drawSparkle), keyframe `px-pulse`/`px-bob` |
| 03 | prologue-hotspot-cutouts | developer | 9 cutout cắt bằng polygon, alpha 0/255, kèm `hotspots.json`; `audit:assets` 231 PNG |
| 04 | room-scene-point-click | developer + chỉnh inline | RoomScene: nút hotspot DOM, mũi tên, Soi/Space, sparkle, fade, cursor, vật bay vào túi, dọn HUD |
| 05 | standing-dialogue | developer | DialogueBox viết lại, giữ props; tranh đứng NPC (pixel ×3–6) + An, người nói sáng |
| 06 | hub-sign-glow-and-scene-cleanup | developer | biển hub sáng viền + pulse; Scene chỉ còn hub; bỏ world phòng; sửa check-game |
| 07 | browser-tests-rewrite | tester | game/journey-map/ui-polish spec viết lại theo click, thêm 8 test |

## Files modified
- **Tạo mới:**
  - `src/ui/pixel-art.ts`, `src/game/hotspot-highlight.ts`
  - `src/game/RoomScene.tsx`, `src/game/room-render.ts`, `src/game/room-scene.css`, `src/game/fly-to-inventory.ts`
  - `src/game/standing-dialogue.css`
  - `scripts/build-hotspot-cutouts.py`, `scripts/hotspot-masks.json`
  - 9 file `assets/areas/prologue/*/hotspot-*.png` và 2 file `hotspots.json`
- **Sửa:**
  - `src/content/schema.ts`, `src/content/chapters/prologue.json`
  - `src/ui/motion.css`
  - `src/game/Game.tsx`, `src/game/fullscreen.css`, `src/game/DialogueBox.tsx`, `src/game/npc-portraits.ts`
  - `src/game/Scene.tsx`, `src/game/physics.ts`, `src/game/AreaSign.tsx`, `src/game/hub.css`
  - `scripts/check-game.ts`
  - `data/runtime-assets.json`, `data/asset-gaps.json`
  - `tests/browser/game.spec.ts`, `journey-map.spec.ts`, `ui-polish.spec.ts`
- Lưu ý: worktree còn nhiều thay đổi chưa commit từ phiên trước (Studio, Museum, App, fonts…). Các file đó không thuộc plan này.

## Existing utilities considered
Dùng lại audit trong plan (`plans/reports/reuse-scout-261004-1111-point-click.md`), không scout lại.
- REUSE-AS-IS: `interactCommand` (truyền `playerPos = interactable.pos`), `area/goTo`, motion.ts, pixel-scale.ts, `drawPixelSprite`, Modal (className).
- REUSE-EXTEND: AreaSchema, AreaSign, DialogueBox, motion.css.
- FORK-NEW: RoomScene, pixel-art, hotspot-highlight.

## Chỉnh ngoài spec (đã kiểm)
- **Bỏ vẽ overlay theo trạng thái** (`ban-cat-sau-nhat-phan`, `vai-phu-roi`, `tuong-go-mo-tay`, `ruong-mo-toang`): các ảnh này là ảnh AI có khung hình cận cảnh, lệch với ảnh nền. Scene cũ vẽ chồng lên nên làm phòng bị phóng to sai. Cờ trạng thái vẫn giữ để chạy vfx.
- **Highlight hover**: vật sáng lên (blend `screen`, pulse) + viền vàng/kem dày `max(3, 2k)` px, cutout phóng kiểu nearest. Đã chụp xác nhận rõ trên bàn và gương ở 1366×768.
- Không thêm `bakeOutline` mới. Hàm này có thêm tham số `outer` (mặc định cream, không phá caller cũ).

## Compile / test
| Lệnh | Kết quả |
|---|---|
| `npm run lint` | PASS (chạy lại sau cùng) |
| `npm run test:core` | PASS 15/15 + check-game (chạy lại sau cùng) |
| `npm run test:browser` (dev :3100) | PASS 27/27 (tester); repeat-each 4: 28/28 |
| `npm run build` | PASS (cảnh báo chunk > 500 kB có từ trước) |
| preview :4174 `test:browser` / `test:assets` | PASS 27/27 / PASS |
| HUD che stage | 0.007 (1366×768), 0.037 (844×390) |

## Smoke checks
Chơi trọn Màn mở đầu bằng chuột và bằng Tab/Enter (150 Sen Ngọc). Đã xem ảnh chụp hover bàn/gương, hội thoại mèo, biển hub sáng viền.

## Follow-ups
- Tooltip của hotspot hội thoại trên đồ vật hiện tên người nói (gương hiện "An"). Cần thêm field nhãn cho interactable, vd. `label: "Gương đồng"`.
- Overlay trạng thái: hoặc gen lại cho trùng khung ảnh nền, hoặc đổi thành ô **cận cảnh** hiện 1–2s sau thao tác (đúng kiểu Áo cưới giấy, tận dụng art có sẵn).
- `hitbox-wall-key` đang trỏ vào tay nắm ngăn kéo vì trên vách không thấy chìa khoá/móc treo nào. Cần xác nhận.
- Chưa test tranh NPC 64×96 cao ≥ 288px: Màn mở đầu chỉ có mèo (32px) là NPC click được.
- Server :3000 của phiên khác đang chạy code cũ → restart trước khi chạy `test:browser` mặc định.
- LOC vượt 200: `Scene.tsx` 221, `RoomScene.tsx` 203, `game.spec.ts` ~300.
- CSS chết: `.dialogue-layer`/`.portrait-frame` trong `src/ui/components.css`, `.controls-help`/`.touch-controls` trong `src/game/game.css`.
- Màn dọc 390px chưa test.

## Handoff
Chain tiếp theo: test (đã chạy trong phase 07) → simplify → docs (README: WASD chỉ còn ở hub, phòng dùng chuột/tap/Tab) → git.

## Simplify pass
Files touched: 2 (RoomScene.tsx, room-render.ts) · Edits: 4 · Rejected: 0
- Bỏ tải ảnh overlay trạng thái (dead sau khi không vẽ overlay) + field `RoomAssets.overlays`.
- Gom key `hotspots.json` vào `boxesFor()`, gom `ids` cutout lọc 1 lần, gom `vfxOn`.
- RoomScene 203 → 199 LOC.
Verify: `npm run lint` clean · `test:core` PASS · `playwright test` (vite :3100) 27/27.
Declined: tách Scene.tsx (221 LOC) và game.spec.ts (~300) là việc tách file, ngoài phạm vi simplify. CSS chết trong components.css/game.css để /docs hoặc lượt dọn riêng.
