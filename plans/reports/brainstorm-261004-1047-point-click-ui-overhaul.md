# Brainstorm — Point-and-click overhaul, highlight, pixel asset pipeline

Date: 2026-10-04 · Deadline nộp: 2026-10-10 (còn 6 ngày) · Scoring: Execution 50% / Vision 30% / Creativity 20%

## 1. Vấn đề (như hiểu được)
- Phòng cốt truyện: An vẽ ở `AN.scale = 0.25` trong dải sàn y 314–480/500 → nhân vật bé, phòng bị HUD che, phải đi WASD tới đúng chỗ mới có prompt E. Gameplay thực chất là escape-room (puzzle `find/use/code/order/styling`), không cần đi lại.
- Không có phản hồi trực quan tại vật thể: prompt "E · …" nổi giữa màn, không gắn với vật.
- Hội thoại: chân dung 128px crop đầu → thiếu cảm giác "nhân vật xuất hiện" như Áo cưới giấy.
- Asset: muốn Claude Code tự tạo pixel asset + e2e, bớt phụ thuộc material.

## 2. Nhận xét UI hiện tại (công tâm)
**Điểm mạnh**
- Hub và bản đồ chương đẹp, đồng nhất palette, có hồn — là "money shot" khi pitch.
- Nền tảng kỹ thuật tốt: token CSS, `steps()` motion, tôn trọng reduced-motion, touch target ≥ 44px, font VT323 đã kiểm dấu tiếng Việt, camera snap device pixel, test Playwright.

**Điểm yếu (xếp theo mức ảnh hưởng tới giám khảo)**
1. **Lẫn mật độ pixel**: nền là AI "pixel-look" hi-res (smoothed), An là painted hi-res, NPC là pixel thật 64×96, CG mở rương là tranh anime không pixel. Trên cùng một màn có 3 độ phân giải pixel → lộ "AI-gen" rõ nhất.
2. **HUD quá tải trong phòng** (`artifacts/ui-polish/844-scene.png`): header + hàng 6 nút + toolbar dưới 3 nút + d-pad + nút E + prompt → che ~40% cảnh. Có 3 tầng điều hướng trùng nhau (header / hàng khu vực / toolbar chương).
3. **Nút trông như web form**: hộp kem viền đậm, không có khung 9-slice pixel → lệch tông với nền.
4. **Modal hoàn thành mở đầu** (`artifacts/prologue-completed.png`): nhìn xuyên thấu, sprite An vẽ đè lên modal → khó đọc (có thể chụp giữa animation — cần kiểm lại).
5. **Prompt tương tác không neo vào vật**, nhãn chung chung ("Chạm để xem · An").

## 3. Quyết định đã chốt với user
| Câu hỏi | Chọn |
|---|---|
| Phòng cốt truyện | **Không avatar, kiểu Áo cưới giấy**: cảnh tĩnh, click hotspot, mũi tên chuyển cảnh |
| Hub | **Giữ WASD** + viền sáng khi đến gần |
| Hội thoại | Tranh đứng nhân vật lớn + khung thoại phía trước |

### Các phương án đã cân nhắc (phòng)
| Phương án | Ưu | Nhược | Effort |
|---|---|---|---|
| **A. Escape-room không avatar (chọn)** | Bỏ được physics/collision cho phòng (c1–c5 đang thiếu), cảnh full màn, mobile = tap tự nhiên, hợp puzzle | Mất cảm giác "đi dạo"; cần bù bằng juice | ~1.5 ngày |
| B. Click-to-walk có avatar (Monkey Island) | "Game" hơn | Phải phóng to An, walkable polygon + pathfinding mỗi phòng | ~3–4 ngày |
| C. Giữ WASD + hover | Ít đổi code | Không giải quyết nhân vật bé | ~0.5 ngày |

## 4. Thiết kế đề xuất

### 4.1 Highlight renderer (dùng chung hub + phòng)
- **Phòng (canvas)**: mỗi hotspot có cutout RGBA (vật tách nền, cùng toạ độ với nền 800×500). Outline bằng alpha dilation: vẽ cutout lệch ±1 art-pixel 8 hướng lên offscreen canvas, tô màu glow bằng `source-in`, rồi vẽ cutout gốc lên trên. **Bake 1 lần mỗi cảnh**, mỗi frame chỉ `drawImage` + đổi alpha theo nhịp `steps()` (pulse 2 frame).
- **Fallback khi chưa có cutout**: khung góc pixel (4 corner bracket) quanh `interactables[].rect` + sparkle → không cần asset, dùng được ngay cho mọi chương.
- **Hub (DOM)**: biển khu vực là `<AreaSign>` → CSS `filter: drop-shadow(Npx 0 0 c) drop-shadow(-Npx 0 0 c) drop-shadow(0 Npx 0 c) drop-shadow(0 -Npx 0 c)` (N = 1 art-pixel theo scale) + pulse khi An đến gần. Chưa kiểm render trên phần tử xoay → test.
- Cutout có sẵn: chapter-1 đã có `hitbox-*.png` (vd. `hitbox-back-window.png` 210×76, RGBA) — **chưa kiểm** có khớp toạ độ nền không. Prologue (6 hotspot) chưa có → tạo bằng script crop theo `rect` + mask.

### 4.2 Phòng point-and-click
- Dữ liệu có sẵn: `interactables[].rect` (normalized) → hit-test chuột/tap, không cần `nearestInteractable` theo vị trí.
- Thêm vào `AreaSchema`: `exits: [{ to, rect, dir }]` → mũi tên pixel nhún (bob) ở mép, hover đổi cursor sang mũi tên. Chuyển cảnh: fade đen ~200ms `steps(4)`.
- Cursor pixel: mặc định / tay (hotspot) / mũi tên (exit) / kính lúp (đọc).
- Hotspot chồng nhau: rect nhỏ nhất thắng.
- **Touch không có hover**: tap = tương tác luôn; thêm nút "Soi" (và giữ Space trên desktop) hiện viền mọi hotspot 1.5s.
- Bỏ khỏi phòng: d-pad, nút E, prompt nổi. Gộp điều hướng còn 1 nút menu + túi đồ.

### 4.3 Hội thoại kiểu Áo cưới giấy
- Khung thoại full-width phía dưới, tranh đứng lớn đứng sau/trên khung, trái = An, phải = NPC; người đang nói sáng, người kia tối 60%; typewriter đã có.
- **MVP không cần art mới**: NPC 64×96 phóng nguyên ×4–×5 (256×384 / 320×480, crisp, pixel thật); An dùng sheet hi-res toàn thân ô 0.
- Stretch: tranh bán thân 2–3 biểu cảm/nhân vật qua Gemini → thêm kind `bust` cho `process-ai-asset.py`.

### 4.4 Juice (đều tắt khi reduced-motion)
Outline pulse · mũi tên bob · vật nhặt bay vào túi đồ · bụi nắng (vfx có sẵn) · fade chuyển cảnh · rung khi sai (có sẵn).

## 5. MagicPixel & pipeline asset
**MagicPixel** (`https://magicpixel.art/mcp`): SaaS đóng, remote HTTP + OAuth, ~20 tool (`generate_pixel_art`, `generate_directions`…), model không công bố, trả phí theo credit ($10–50/tháng), CLI 0 sao, tác giả ẩn danh. Kỹ thuật: *có lẽ* gắn được vào Claude Code qua `claude mcp add --transport http` (chưa test).
**Kết luận: không dùng.** Thể lệ chỉ cho Gemini / AI Studio và BTC có thể đòi prompt log → asset từ AI không phải Google là rủi ro bị loại. PixelLab MCP cũng vậy.

**Pipeline e2e đề xuất (an toàn thể lệ)**
| Loại asset | Cách tạo | Ghi chú |
|---|---|---|
| UI nhỏ: mũi tên, cursor, corner bracket, sparkle, khung 9-slice | **Code procedural** (ma trận pixel trong TS → canvas/SVG `crispEdges`) | Pixel chuẩn lưới, không dùng AI ảnh, Claude Code viết + QA trực tiếp |
| Cutout hotspot | Script Python crop nền theo `rect` + mask (chroma/threshold, chỉnh tay khi cần) | Không sinh ảnh mới → không lệch style |
| Tranh đứng, CG, nền mới | Gemini image (AI Studio web miễn phí, hoặc MCP `nanobanana` trong `.mcp.json.example`, cần billing) → `scripts/process-ai-asset.py` (chroma-key, downscale median-cell, quantize palette) → `npm run audit:assets` | Đã có sẵn; thêm kind `bust` |
| Kiểm tra | Playwright screenshot + Claude đọc ảnh để review | `tests/browser/*` đã có |

Nhắc một lần: việc dùng Claude Code để viết code cũng nằm trong vùng xám của thể lệ (đã flag 30/09) — giữ prompt log Gemini cho phần asset.

## 6. Rủi ro
| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| `tests/browser/game.spec.ts` dựa trên WASD + `data-position` → vỡ | High | Viết lại test theo click hotspot; giữ `data-target`/`data-ready` |
| Puzzle `use` cần chọn đồ rồi click vật | High | MVP giữ flow modal hiện tại; "cầm đồ trên cursor" để sau |
| Cutout lệch toạ độ nền | Medium | Fallback corner bracket; script kiểm bbox với `rect` |
| Mobile không hover → người chơi không biết chỗ bấm | Medium | Nút "Soi" + sparkle nhẹ định kỳ trên hotspot chưa xem |
| Lẫn mật độ pixel còn nguyên | Medium | Ưu tiên CG/tranh đứng qua pipeline quantize; không thêm style mới |
| 6 ngày, 3 người | High | Cắt theo thứ tự ở mục 7 |

## 7. Thứ tự làm (cắt từ dưới lên nếu trễ)
1. Hub: outline biển khi đến gần (0.5 ngày) — yêu cầu số 1, rủi ro thấp.
2. Phòng P&C cho prologue: bỏ avatar, hit-test rect, cursor, exits + mũi tên, fade (1.5 ngày).
3. Highlight canvas: corner-bracket fallback → cutout + dilation outline cho 6 hotspot prologue (1 ngày).
4. Dialogue tranh đứng từ sprite có sẵn (1 ngày).
5. Dọn HUD phòng + juice (1 ngày).
6. Stretch: tranh bán thân Gemini, cutout chapter-1.

## 8. Chỉ số thành công
- Prologue chơi hết chỉ bằng chuột hoặc tap, không cần bàn phím.
- Mọi hotspot có highlight khi hover/đến gần; mọi exit có mũi tên.
- HUD che < 15% cảnh ở 1366×768 và 844×390.
- `npm run lint`, `test:core`, `test:browser` xanh.

## Câu hỏi còn mở
- Chapter-1 `hitbox-*.png` có cùng hệ toạ độ với nền không? (kiểm ở /plan)
- Team có key Gemini billing cho MCP không, hay chỉ dùng AI Studio web?
- Hiện cảnh chuyển s1 → s2 qua `hitbox-stairs` (dialogue) — đổi thành exit thật hay giữ?
