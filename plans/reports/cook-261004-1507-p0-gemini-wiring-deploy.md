# Cook report — p0-gemini-wiring-deploy

Plan: `plans/261004-1415-p0-gemini-wiring-deploy/` · Branch: `feat/p0-gemini-deploy` (từ `feat/point-click-rooms` HEAD) · 04/10/2026

## Phases executed
| # | Phase | Status |
|---|---|---|
| 01 | server-env-hardening | done (smoke key thật: OK list/text/image với key có sẵn trong env shell) |
| 02 | studio-ai-wiring | done |
| 03 | deploy-cloud-run | code done (bước 1–6); bước 7 (user chạy gcloud) + 8 (smoke URL thật) còn chờ |

## Files modified
- Modify: `server.ts`, `src/server/ai/{gemini-client,stylist,lookbook,analyze-selfie,analyze-garment}.ts`, `src/game/Studio.tsx`, `package.json`, `.gitignore`, `README.md`
- Create: `src/server/ai/sanitize.ts`, `.env.example`, `scripts/smoke-gemini.ts`, `scripts/check-ai-sanitize.ts`, `src/game/{ai-client.ts,AiStatusBadge.tsx,StudioStylist.tsx,StudioLookbookAi.tsx,studio-ai.css}`, `tests/browser/studio-ai.spec.ts`, `Dockerfile`, `.dockerignore`, `.gcloudignore`, `docs/05-tech/deploy-cloud-run.md`

## Existing utilities considered
Reused plan's audit: `plans/reports/reuse-scout-261004-1415-ai-wiring.md` — handlers/cache/Toast/Modal/StudioCharacter/`studio/applyPreset` REUSE; `ai-client.ts` FORK-NEW; 4 handler gom xử lý lỗi vào `sanitize.ts` (`toFallbackReason`).

## Compile & checks (main session, sau cả 3 phase)
- `npm run lint` pass · `npm run build` pass (vite + `server.mjs` 281 kB) · `dist/` không chứa `GoogleGenAI`/`@google/genai`
- `npx tsx scripts/check-ai-sanitize.ts` OK · `npm run test:core` 15/15 + check-game PASS
- `npm run test:assets` PASS (phase 03) · `studio-ai.spec.ts` 5/5 pass (server riêng :3121)
- Prod local `node server.mjs` (:3131): `/api/health`, `/`, PNG asset, POST stylist đều 200; runtime chỉ cần prod deps (không tsx)

## Deviations
- Lookbook: instruction "dữ liệu không tin cậy" đặt ở text part (chưa xác minh image model nhận `systemInstruction`); stylist dùng `systemInstruction`.
- Fallback thêm field: `message` (stylist, selfie), `reason` (garment). `eventId` kiểm bằng `Object.hasOwn` (trước đây `'constructor'` lọt qua `in`).
- Stylist luôn hiển thị trong `Modal` (portal vào `.studio-room`) thay vì inline — tránh vỡ layout mọi viewport.
- 429/network: không có gợi ý tĩnh phía client (list fallback nằm ở module server, import giá trị sẽ kéo SDK vào bundle) → chỉ badge offline + lời nhắn.
- `.dockerignore`/`.gcloudignore` giữ `!/map.png` (input của vite).

## Blockers / unverified
- **Full `test:browser` chưa chạy sạch:** process cũ PID 31108 (`tsx server.ts`) giữ :3000 và HMR :24678 → pageerror WebSocket làm fail các assert `errors==[]` (game/welcome "no AI", studio.spec dòng cuối). Đối chứng bằng stash cho thấy lỗi có sẵn trước khi sửa. Cần tắt PID 31108 rồi chạy lại.
- Docker image chưa build (Docker Desktop không chạy). Runbook gcloud chưa chạy.
- Badge `Gemini` với key thật trong UI chưa xem bằng mắt (spec dùng mock); hành vi runtime abort → `'timeout'` chưa kiểm.
- `ui-polish.spec.ts` chưa chạy trọn; chưa kiểm 320 px.

## Follow-ups
- Tắt PID 31108 → `npm run test:browser` đầy đủ.
- User chạy `docs/05-tech/deploy-cloud-run.md` → dán URL → smoke + Playwright với `QA_BASE_URL`.
- Cân nhắc chuyển list gợi ý tĩnh sang module shared (không SDK) để 429/offline vẫn có thẻ gợi ý.
- `cultureCardId` từ model chưa đối chiếu với `culture-cards.json`.
- Rate limiter 429 trả `{ok:false,error}` không có `fallback.reason` (client đã xử lý).
- Lookbook overlay che ~65% board ở landscape thấp — xem lại khi làm pixel UI.

## Handoff
Next: `/test` (full suite sau khi giải phóng :3000) → `/simplify` → `/docs` → `/git` (không commit `soundtrack/`, `.cook-state.json` cũ).

## Simplify pass

Files touched: 1 (`src/game/StudioStylist.tsx`)
Edits applied: 2 — hằng `OFFLINE_TEXT` thay chuỗi lặp 2 lần; biến `garmentUnlocked` thay 2 lần gọi `unlockedGarment(suggestion.garmentId)` trong `tryOn`.
Edits rejected: 0

Behavior verification:
- `npm run lint`: clean
- `npm run test:core`: PASS
- `npx tsx scripts/check-ai-sanitize.ts`: OK
- `playwright studio-ai.spec + studio.spec`: 6 passed

Declined (noted for later):
- Server diff (`lookbook.ts`, `stylist.ts`, `sanitize.ts`, `server.ts`) đã gọn — không sửa.
- `StudioLookbookAi.tsx` lặp `content.garmentsById.get(draft.garmentId)?.name` 2 chỗ (request vs alt text) — khác ngữ cảnh, giữ nguyên.
