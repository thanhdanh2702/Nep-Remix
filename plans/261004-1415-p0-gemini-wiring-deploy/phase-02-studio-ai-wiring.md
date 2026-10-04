# Phase 02 — studio-ai-wiring

## Context Links
- Plan: ./plan.md · Scout: ../reports/reuse-scout-261004-1415-ai-wiring.md
- Stack skills: `/frontend-development`, `/react-best-practices`

## Overview
- Priority: critical · Status: pending · Est. effort: 5–6 h · Depends on: 01

## Key Insights
- Không có client fetch helper nào (`fetch(` chỉ có trong server) → FORK-NEW `ai-client.ts`.
- Response: `{ok:true,data,cached?}` | `{ok:false,fallback:{…,reason}}`; 429 trả `{ok:false,error}` (không có `fallback`) — client phải xử lý cả 3.
- Stylist trả `StylistOutfitSuggestion[]` (`stylist.ts:85`): garmentId, garmentName, silhouette, colorPalette[4], accessoryIds, catComment, cultureCardId… Áp vào draft bằng command có sẵn `studio/applyPreset` (`Studio.tsx` `selectGarment`).
- Gemini có thể gợi ý garment/accessory **chưa mở khóa** → `runCommand` trả `ok:false`. Client phải đánh dấu "Chưa mở khóa" và chỉ áp phần hợp lệ (màu, phụ kiện đã có).
- Lookbook hiện = 4 `StudioCharacter` pixel local (`Studio.tsx:81-113`) — giữ làm fallback.
- Tạo ảnh cần billing → fallback là trạng thái bình thường, không phải lỗi; badge phải trung tính, không đỏ.
- `Studio.tsx` 116 LOC → logic mới đặt ở component riêng để không vượt 200 LOC.

## Requirements
**Functional:**
- Nút **"Gợi ý từ Gemini"** trong Studio: gửi `{eventId: draft.eventContextId}` → hiển thị tối đa 3 thẻ gợi ý (tên áo, 4 ô màu, phụ kiện, lời bình của Nếp); nút "Mặc thử" áp gợi ý vào draft (undo được như thao tác thường).
- Nút **"Chụp Lookbook AI"** trong khung Lookbook: gửi `LookbookRequest` dựng từ draft hiện tại (garmentName từ `content.garmentsById`, accessoryNames, event name) → thành công: lưới 4 ảnh AI + `disclosure`/`watermark`; nút "Về ảnh pixel" quay lại 4 ô pixel.
- Loading: nút disable + nhãn "Đang hỏi Gemini…"; client abort sau 50 s (`AbortSignal.timeout(50_000)`).
- Badge trạng thái nhỏ cạnh mỗi tính năng: `Gemini` (data thật) · `Đã lưu` (cached) · `AI offline – dùng gợi ý có sẵn / ảnh pixel` (fallback/429/network). Không hiển thị `reason` thô.
- Không gọi AI tự động khi vào Studio — chỉ khi bấm (giữ 2 test "no AI calls" pass).

**Non-functional:** chỉ `import type` từ `src/server/**`; bundle `dist/` không chứa `@google/genai`; touch target ≥ 44 px, text ≥ 12 px (ui-polish spec); `aria-live="polite"` cho vùng kết quả; giữ pixel style (tokens, `components.css` classes có sẵn).

## Architecture
```
Studio.tsx ──mount──> StudioStylist.tsx ──> ai-client.ts ──POST /api/ai/stylist
          └─(lookbook section)─> StudioLookbookAi.tsx ──> ai-client.ts ──POST /api/ai/lookbook
                                      └─ fallback: render children (4 StudioCharacter pixel)
AiStatusBadge.tsx  ← dùng chung bởi 2 component
```
`ai-client.ts`: `callAi<T>(path, body, signal?) → {status:'ok'|'cached'|'fallback', data?: T, fallback?: unknown}`; mọi lỗi mạng/HTTP/JSON → `status:'fallback'`.

## Related Code Files
**Modify:** `src/game/Studio.tsx`
**Create:** `src/game/ai-client.ts`, `src/game/AiStatusBadge.tsx`, `src/game/StudioStylist.tsx`, `src/game/StudioLookbookAi.tsx`, `src/game/studio-ai.css`, `tests/browser/studio-ai.spec.ts`
**Delete:** —
(Không sửa `studio.css`, `StudioWardrobe.tsx`, `game.spec.ts`, `welcome.spec.ts`, `studio.spec.ts`.)

## Existing code audit
**Scout report:** ../reports/reuse-scout-261004-1415-ai-wiring.md

| File:line | Signature | Fit | Verdict |
|---|---|---|---|
| src/game/Studio.tsx:44 | `selectGarment` / `update(cmd)` qua `studio/applyPreset` | 90% | REUSE-AS-IS (truyền `update` + `draft` xuống) |
| src/game/Toast.tsx:7 | `Toast` + `notify(msg)` prop | 100% | REUSE-AS-IS cho lỗi áp gợi ý |
| src/game/StudioCharacter.tsx | 4 view pixel | 100% | REUSE-AS-IS làm fallback lookbook |
| src/server/ai/stylist.ts:85, lookbook.ts:11-40 | types | 100% | REUSE-AS-IS qua `import type` |
| — client fetch helper | none | — | FORK-NEW `ai-client.ts` |

**Cross-surface duplication:** không.

## Reuse strategy
FORK-NEW cho `ai-client.ts` + 3 component nhỏ; REUSE-AS-IS command `studio/applyPreset`, `Toast`, `StudioCharacter`, type từ server (type-only). `Studio.tsx` chỉ thêm ~10 dòng mount.

## Implementation Steps
1. `ai-client.ts` (≤ 60 LOC): fetch POST JSON, map 3 dạng response + lỗi mạng → union `status`.
2. `AiStatusBadge.tsx`: 3 trạng thái, class pixel có sẵn + `studio-ai.css`.
3. `StudioStylist.tsx`: nút, loading, 3 thẻ; "Mặc thử" → lọc garment/accessory theo `state.closet` (unlocked) → `update({type:'studio/applyPreset',…})`; phần bị khóa → nhãn "Chưa mở khóa" + `notify`.
4. `StudioLookbookAi.tsx`: bọc lưới pixel hiện có làm `children`; trạng thái `pixel | loading | ai`; ảnh AI `<img>` có `alt` theo `angleLabel`, `loading="lazy"`; hiển thị `disclosure`.
5. `Studio.tsx`: mount `StudioStylist` (gần event selector / evaluation) và bọc section lookbook bằng `StudioLookbookAi`.
6. `studio-ai.spec.ts` dùng `page.route('**/api/ai/**')` mock: (a) stylist ok → 3 thẻ, "Mặc thử" đổi garment; (b) stylist fallback → badge offline + gợi ý có sẵn; (c) lookbook ok (data-URL PNG nhỏ) → 4 ảnh + disclosure; (d) lookbook 500/abort → vẫn 4 ô pixel + badge offline; (e) vào Studio không bấm → 0 request `/api/ai/`.
7. `npm run build` → `grep -r "@google/genai\|GoogleGenAI" dist/` rỗng.
8. Chạy lint, test:core, test:browser (toàn bộ, gồm 2 test "no AI").

## Todo List
- [x] ai-client.ts
- [x] AiStatusBadge.tsx + studio-ai.css
- [x] StudioStylist.tsx (lọc đồ chưa mở khóa)
- [x] StudioLookbookAi.tsx (pixel fallback)
- [x] mount trong Studio.tsx
- [x] studio-ai.spec.ts 5 case
- [x] bundle không chứa SDK
- [x] toàn bộ test pass

## Success Criteria
- 5 case `studio-ai.spec.ts` pass; `game.spec.ts` + `welcome.spec.ts` (no AI) vẫn pass.
- Với key thật ở local: bấm "Gợi ý từ Gemini" → badge `Gemini`, 3 gợi ý khác fallback tĩnh; tắt mạng → badge offline, UI không vỡ.
- `grep GoogleGenAI dist/` rỗng; `Studio.tsx` ≤ 200 LOC.

## Risk Assessment
- Gợi ý chứa id không có trong `content` (enum server lệch content) → bỏ qua item đó, không crash.
- Ảnh base64 lớn ×4 làm nặng DOM → chỉ giữ ảnh của lần chụp gần nhất.
- Mobile landscape thấp: thẻ gợi ý chiếm chỗ model (đã ~70 px) → hiển thị gợi ý trong `Modal` có sẵn thay vì inline nếu viewport cao < 500 px.

## Security Considerations
- Không render HTML từ AI (chỉ text node); `imageUrl` chỉ chấp nhận `data:image/` hoặc same-origin.

## Next Steps
Selfie / Xưởng may tái dùng `ai-client.ts` + `AiStatusBadge.tsx`.
