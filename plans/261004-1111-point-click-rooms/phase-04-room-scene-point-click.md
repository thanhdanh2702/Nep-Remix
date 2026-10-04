# Phase 04 — room-scene-point-click

## Context Links
- Plan: ./plan.md · Brainstorm §4.2, §4.4 · Scout report
- Stack skill: `/frontend-development`, `/react-best-practices`

## Overview
- Priority: critical · Status: completed · Effort: 1.5–2 ngày
- Depends on: 01 (exitArrows), 02 (pixel-art, highlight). 03 là tuỳ chọn, đã có fallback.

## Key Insights
- Guard của `interact` kiểm `isPlayerInRange(interactable, playerPos)`. Truyền `playerPos = interactable.pos` thì luôn pass, **không sửa core**.
- `matchesSide` trong core không export. Lọc hotspot theo `side === 'ca_hai' || ('mat_' + side) === progress.side`, viết inline và ghi comment trỏ về `interact-command.ts:18`.
- Hotspot làm bằng **nút DOM trong suốt đặt trên canvas** thay vì hit-test canvas. Cách này có sẵn Tab/Enter, aria-label và tap. Playwright click được theo role. Canvas chỉ lo vẽ.
- Interactable được tham chiếu bởi `exitArrows[].via` (vd. `hitbox-stairs`) **không** render nút hotspot riêng. Mũi tên thay nó, nên không có 2 nút chồng nhau.
- Phase 01 canh lại `rect` theo hình thật của vật (bbox từ phase 03). Nút hotspot đặt theo `rect`.
- Nền hiện contain 8:5, nền lề màu plum. Không hotspot nào bị cắt; mép trái/phải có hotspot (mirror x .06, stairs x .875).

## Requirements
**`src/game/RoomScene.tsx`** (mới). Props `{ state, blocked, onInteract(id,pos), onExit(arrow) }`.
- Canvas vẽ theo thứ tự:
  1. nền
  2. overlay theo trạng thái (copy logic overlay từ `Scene.tsx`: `ban-cat-sau-nhat-phan`, `vai-phu-roi`, `tuong-go-mo-tay`, `ruong-mo-toang`)
  3. mèo `cat-nep` (s1)
  4. vfx bụi/ánh sáng
  5. **highlight**
- Highlight cho hotspot đang hover hoặc focus:
  - Có cutout (`hotspots.json` + `hotspot-<id>.png`) và chưa giải: viền bake bằng `bakeOutline`, cache theo id, pulse `steps(2)`.
  - Còn lại: `drawBrackets` theo rect.
- Overlay `<div class="room-hotspots">`:
  - Mỗi interactable thấy được là một `<button aria-label="<nhãn>">` đặt theo `rect` × camera, kích thước tối thiểu 44×44 (căn giữa rect).
  - Hover/focus → set `hoverId`. Click → `onInteract(id, interactable.pos)`.
  - Hover hiện tooltip nhãn pixel neo trên rect.
- Exit arrows: mỗi `exitArrows[]` là một `<button class="room-exit dir-*">` với ảnh `ARROW_*` (`gridToDataUrl`, ×3/×4 scale nguyên) và `px-bob`. Click → nếu có `via` thì `onInteract(via, pos)`, không thì `onExit(arrow)`.
- Cursor: `.room-hotspots button{cursor: cursorCss(CURSOR_HAND)}`, `.room-exit{cursor: CURSOR_EXIT}`, cảnh dùng `CURSOR_DEFAULT`. Gán qua CSS custom property set một lần lúc mount.
- Nút **"Soi"** (`aria-pressed`). Giữ `Space` trên desktop cũng được. Khi bật: vẽ brackets cho mọi hotspot trong 1.5s.
- Lấp lánh nhẹ (`drawSparkle`) mỗi ~4s trên hotspot **chưa tương tác lần nào** (dùng `completedDialogueIds`, `inventory`, `solvedPuzzleIds`). Tắt khi reduced-motion.
- Chuyển cảnh: `areaId` đổi thì fade đen 4 bước (~200ms) bằng lớp `.room-fade` + `px-fade`.
- QA hooks trên canvas: `data-ready`, `data-area`, `data-hover`.
- `blocked` → nút disabled, xoá hover, không vẽ highlight.
- Giữ < 200 LOC. Nếu vượt thì tách vòng vẽ sang `src/game/room-render.ts` (file mới, cùng phase này).

**`src/game/room-scene.css`** (mới): layout overlay, exit arrow theo `dir`, tooltip, nút Soi, fade, nhãn VT323.

**`src/game/Game.tsx`**:
- `screen==='journey' && !showingMap` → render `<RoomScene>` thay `<Scene>`. Hub vẫn dùng `<Scene hub>`.
- `onExit(arrow)` → `send({type:'area/goTo',payload:{areaId: area.exits[arrow.exit]}})`.
- Dọn HUD trong phòng:
  - Bỏ `.controls-help`.
  - Ẩn `.main-nav` khi đang ở phòng (giữ `back-home`, ví, cài đặt).
  - `journey-toolbar` bỏ nút "Về tiệm may" (thay bằng mũi tên), còn "Túi đồ & Sổ manh mối", "Bản đồ chương" và tiến độ.
- Hiệu ứng nhặt đồ: event `itemPicked` thì cho icon item bay từ tâm hotspot tới `.inventory-strip` (clone `<img>`, transform `steps(6)`, ~360ms), bỏ qua khi reduced-motion. Cắt đầu tiên nếu trễ.

**`src/game/fullscreen.css`**: chỉ sửa các rule `.journey-toolbar`, `.inventory-strip`, `.controls-help`, `.screen-journey …` cho bố cục mới. Không đụng rule hub.

## Related Code Files
**Create:** `src/game/RoomScene.tsx`, `src/game/room-scene.css`, (tuỳ) `src/game/room-render.ts`
**Modify:** `src/game/Game.tsx`, `src/game/fullscreen.css`

## Existing code audit
REUSE-AS-IS: `interactCommand`, `area/goTo`, `loadImage`/`areaAsset` (`assets.ts`), `setupCanvas`/`setSmoothing` (`pixel-scale.ts`), `drawPixelSprite` (`scene-view.ts`), `prefersReducedMotion`, `withViewTransition`. Scout report: `../reports/reuse-scout-261004-1111-point-click.md`.

## Reuse strategy
FORK-NEW cho `RoomScene`. Scene hiện gộp physics, camera follow, input WASD, nên fork sạch dễ hơn thêm nhánh vào file 257 dòng. Logic overlay/vfx copy từ Scene; phase 06 xoá bản ở Scene, nên cuối cùng không còn trùng lặp.

## Implementation Steps
1. Khung RoomScene: canvas contain 8:5, ResizeObserver, tải ảnh, vẽ nền + overlay + mèo + vfx.
2. Overlay nút hotspot + exit arrows + tooltip, wiring `onInteract`/`onExit`.
3. Highlight: brackets trước, sau đó cutout outline khi `hotspots.json` tồn tại (`assetRegistry` có path thì dùng).
4. Nút Soi + Space, sparkle, fade chuyển cảnh, cursor.
5. Game.tsx: routing, onExit, dọn HUD, fly-to-inventory.
6. `npm run lint`, `npm run test:core`. Chơi tay Màn mở đầu từ đầu tới cuối bằng chuột, rồi bằng Tab/Enter.

## Todo List
- [x] RoomScene render
- [x] Hotspot buttons + exits
- [x] Highlight (brackets → outline)
- [x] Soi / Space / sparkle / fade / cursor
- [x] Game.tsx routing + HUD + fly-to-inventory
- [x] lint + test:core + chơi tay

## Success Criteria
- Màn mở đầu xong trọn (3 puzzle, mở rương, nhận 50 Sen Ngọc) chỉ bằng click. Cũng xong được chỉ bằng bàn phím (Tab/Enter).
- Hover hoặc focus hotspot thì canvas đổi `data-hover=<id>` và có viền.
- Ở 1366×768 và 844×390: HUD che < 15% vùng cảnh (đo bằng bounding box trong phase 07).
- Không còn d-pad hoặc nút E trong phòng.

## Risk Assessment
- Hai rect lồng nhau (table to vs vật nhỏ): nút có rect nhỏ hơn đặt sau trong DOM (z-order cao hơn).
- Nút tối thiểu 44px ở 390px ngang có thể đè nhau → chấp nhận, rect nhỏ thắng.
- Tốc độ: chỉ redraw khi hover/Soi/sparkle/fade đổi, hoặc dùng rAF khi có animation. Không vẽ lại liên tục khi đứng yên.

## Next Steps
Mở khoá 06 (dọn Scene) và 07 (test).
