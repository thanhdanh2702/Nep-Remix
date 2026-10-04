# Reuse scout — point-and-click rooms (2026-10-04)

Đã kiểm lại bằng grep/sed. Có một kết luận của scout bị sửa, đánh dấu **[sửa]**.

| Candidate | Fit | Verdict |
|---|---|---|
| `src/core/commands/journey/interact-command.ts:103` `interactCommand`. Guard kiểm side và `isPlayerInRange(interactable, playerPos)`. | 100% | REUSE-AS-IS. Truyền `playerPos = interactable.pos` thì guard pass mà không cần sửa core. |
| `interact-command.ts:61` `nearestInteractable()`. Đang dùng ở `scripts/check-game.ts`. | 100% | REUSE-AS-IS. Giữ cho check-game; phòng P&C không gọi hàm này. |
| `area-commands.ts:13` `area/goTo {areaId}`, cùng `area/goBack`. | 100% | REUSE-AS-IS |
| `AreaSchema.exits: record<string,string>` (`schema.ts:380`). Prologue có `stairs`, `back`. | 70% | REUSE-EXTEND. Thêm field optional `exitArrows` để lưu hình học mũi tên. |
| `src/ui/motion.ts`: `prefersReducedMotion`, `typewriter`, `withViewTransition`, `shake`, `pop`. | 100% | REUSE-AS-IS |
| `src/ui/motion.css`: các keyframe `steps()` và nhánh reduced-motion. | 90% | REUSE-EXTEND. Thêm `px-pulse`, `px-bob`. |
| `src/ui/pixel-scale.ts`: `setupCanvas`, `snapToDevice`, `integerScale`. `scene-view.ts:73` `drawPixelSprite`. | 100% | REUSE-AS-IS |
| `src/welcome/PixelIcon.tsx`: icon SVG vẽ bằng `crispEdges`. | 60% | Theo đúng pattern này cho cursor và mũi tên; module mới là `src/ui/pixel-art.ts`. |
| `AreaSign.tsx` | 80% | REUSE-EXTEND. Thêm prop `highlighted`. |
| `Scene.tsx`: hub đã có `near` cho destination (bán kính 64). | 90% | REUSE-EXTEND |
| `DialogueBox.tsx` (props `speaker,text,preset,children`), `npc-portraits.ts` `portraitFor`, `anLayerPath` | 70% | REUSE-EXTEND. Viết lại phần thân DialogueBox, giữ nguyên props để Game.tsx không phải đổi. |

**[sửa] Tests:** scout báo `game.spec.ts` không phụ thuộc WASD. Điều này **sai**. `tests/browser/game.spec.ts` dùng `keyboard.down('d')`, `press('e')` và `data-position` ở các dòng 8–66, 90–93, 130–135. `journey-map.spec.ts:30` kiểm `data-position` trong phòng. `ui-polish.spec.ts:68` kiểm `.touch-controls`. Phần story phải viết lại.

Cross-surface duplication: không có. Không cần EXTRACT-SHARED.
