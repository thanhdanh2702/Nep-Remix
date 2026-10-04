# Phase 02 — selfie-avatar

## Context Links
- Plan: ./plan.md · Stack: `/frontend-development`, `/react-best-practices`

## Overview
- Priority: high · Status: pending · Est. effort: 3–4 h · Depends on: 01

## Key Insights
- Welcome (`src/App.tsx`) nằm ngoài `Game`; `Game` nhận props `embedded`, `paused`, `onBlockedChange` (`App.tsx:97`). Profile cập nhật bằng `profile/update` `{name, avatarPreset}` (`Game.tsx:174`).
- Server `analyze-selfie` body `{ imageBase64, mimeType? }` → data `{hairLength, hairColor, glasses, avatarPreset}`; preset server (`an-glasses|an-short-hair|an-long-hair|an-default`) không khớp client (`an-{bob|long}-{default|jade|rose}`).
- `welcome.spec.ts:42` assert upload preview không gọi AI → AI chỉ chạy sau consent + nút.

## Requirements
**Functional:**
- Modal "Một phiên bản pixel của bạn" (panel `upload`):
  1. Chọn/thả ảnh → preview local như cũ (dùng `validateImageFile`).
  2. Khối đồng ý: checkbox "Tôi đồng ý gửi ảnh này tới Google Gemini để gợi ý diện mạo. Ảnh không được lưu lại." + nút **"Phân tích bằng Gemini"** (disable khi chưa tích, chưa có ảnh, hoặc đang chạy).
  3. Bấm → `toDownscaledDataUrl` → `callAi('/api/ai/analyze-selfie', {imageBase64, mimeType})` → hiển thị "Nếp gợi ý: tóc ngắn/dài" + `AiStatusBadge` + nút **"Dùng diện mạo này"**.
  4. Fallback → badge offline + "Bạn vẫn có thể chọn diện mạo trong Cài đặt"; không chặn vào game.
- "Dùng diện mạo này" → state `pendingAvatarPreset` ở App → prop vào `<Game>` → `Game` gửi `profile/update` một lần (giữ `name`, giữ outfit variant hiện tại) → toast "Đã áp diện mạo mới" → callback `onAvatarApplied` để App xóa pending.
- Thay nhãn "Tạo nhân vật pixel · Sắp có" (hàng nút welcome + upload status) bằng "Tạo nhân vật từ ảnh · Gemini".
- Đóng modal / chọn ảnh khác → xóa preview, data URL, kết quả; abort request đang chạy.
- `src/game/avatar-preset.ts`: `presetFromSelfie(hairLength, current)` → `an-bob-<outfit>` khi tóc ngắn, ngược lại `an-long-<outfit>`; outfit lấy từ `current` (`jade`/`rose`/`default`).

**Non-functional:** không ghi ảnh/kết quả vào localStorage; text ≥ 12 px, target ≥ 44 px.

## Related Code Files
**Modify:** `src/App.tsx`, `src/welcome/welcome.css`, `src/game/Game.tsx` (prop `pendingAvatarPreset?: string | null`, `onAvatarApplied?: () => void`), `tests/browser/welcome.spec.ts` (CHỈ dòng 23 `toContainText('Sắp có')` → nhãn mới; giữ nguyên assert no-AI dòng 42)
**Create:** `src/game/avatar-preset.ts`, `tests/browser/selfie.spec.ts`

## Existing code audit
| File:line | Fit | Verdict |
|---|---|---|
| src/App.tsx:56-74 selectPhoto | 90% | REUSE-EXTEND (dùng `validateImageFile`) |
| src/game/ai-client.ts callAi, AiStatusBadge.tsx | 100% | REUSE-AS-IS |
| Game.tsx:174 profile/update | 100% | REUSE-AS-IS |
| notify/Toast trong Game | 100% | REUSE-AS-IS |

## Reuse strategy
REUSE-EXTEND luồng upload có sẵn; `avatar-preset.ts` FORK-NEW (chưa có mapping nào).

## Implementation Steps
1. `avatar-preset.ts`.
2. App.tsx: `validateImageFile`; consent + nút phân tích + kết quả; state `pendingAvatarPreset`; cleanup khi đóng modal.
3. Game.tsx: prop + effect — khi `pendingAvatarPreset` có giá trị và `state.profile` tồn tại, gửi `profile/update` nếu khác preset hiện tại, rồi `onAvatarApplied()`. Nếu chưa có profile: kiểm `src/core/commands/profile/profile-commands.ts` và dùng command tạo profile hiện có, hoặc chờ.
4. welcome.css cho khối consent.
5. `selfie.spec.ts` (mock `page.route`): (a) chọn ảnh → 0 request AI; (b) chưa tích → nút disable; (c) tích + phân tích (mock `hairLength` ngắn) → body là JPEG, cạnh dài ≤ 768 (decode trong route handler hoặc kiểm kích thước bằng `page.evaluate`) → "Dùng diện mạo này" → vào game → Cài đặt hiển thị "Tóc ngắn"; (d) fallback → badge offline, vẫn vào game; (e) đóng modal → preview biến mất.
6. lint, test:core, `welcome.spec` + `game.spec` + `selfie.spec`.

## Todo List
- [x] avatar-preset.ts
- [x] App.tsx consent + phân tích + cleanup
- [x] Game.tsx pendingAvatarPreset
- [x] welcome.css
- [x] selfie.spec.ts 5 case
- [x] lint, test:core, welcome/game/selfie spec pass

## Success Criteria
- 5 case `selfie.spec` pass; `welcome.spec.ts` + `game.spec.ts` (no AI) pass.
- Không còn chuỗi "Sắp có" trong `src/App.tsx`.
- Không có `localStorage` mới liên quan ảnh.

## Test Spec
- Integration (Playwright, mock route): như bước 5.
- Mapping qua UI: tóc ngắn → `an-bob-*`; tóc dài/khác → `an-long-*`; outfit `jade` được giữ.

## Risk Assessment
- Lần đầu vào game chưa có profile → effect phải chờ; case (c) bao phủ.
- Re-render gửi `profile/update` lặp → chỉ gửi khi khác preset hiện tại, rồi xóa pending.

## Security Considerations
- Consent nêu rõ nhà cung cấp (Google Gemini) và không lưu. Không log ảnh phía client.
