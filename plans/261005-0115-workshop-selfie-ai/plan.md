---
title: workshop-selfie-ai
status: pending
mode: hard
scope: hold
priority: high
effort: 1 day
created: 2026-10-05
blockedBy: [p0-gemini-wiring-deploy]
blocks: [chapter-1-mini]
---

# Xưởng may + selfie → avatar (Gemini)

Hai route `/api/ai/analyze-garment` và `/api/ai/analyze-selfie` đã có (zod, fallback, reason code; selfie không cache) nhưng chưa có UI. Welcome còn nhãn "Tạo nhân vật pixel · Sắp có". Đây là 2 tính năng AI còn lại trong lịch (06/10) — tăng điểm "dùng Gemini" + Creativity (phân biệt áo dài / sườn xám / hanbok).

Nguồn: `../reports/reuse-scout-261005-0115-garment-workshop.md` (inline), `../reports/reuse-scout-261005-0115-selfie-avatar.md` (inline), `../../../plans/reports/brainstorm-261004-1357-finish-strategy-pixel-pipeline.md`.

## Goal
- Tủ đồ có tab **Xưởng may**: tải ảnh áo → Gemini nhận diện → thẻ kết quả → "Phối thử" mở Phòng phối đồ với dáng + màu đã nhận diện; áo nước khác → thẻ phân biệt văn hóa; lỗi → tự chọn thủ công.
- Welcome: tải ảnh → **màn đồng ý rõ ràng** → "Phân tích" → gợi ý diện mạo (tóc dài/ngắn) → "Dùng diện mạo này" áp vào nhân vật An.

## Non-goals
- Sinh sprite nhân vật từ ảnh (chỉ chọn preset có sẵn); kính (client chưa có layer kính).
- Lưu ảnh / kết quả phân tích phía server; mở khóa áo mới từ Xưởng may; art `assets/screens/workshop/*` (README only — dùng `CARD_FRAME` có sẵn).
- Sửa đoạn hướng dẫn WASD/E trong welcome (thuộc docs-sync / pixel UI).

## Phases
| # | Name | Status | Depends on | Owner |
|---|------|--------|------------|-------|
| 01 | [shared-image-upload](phase-01-shared-image-upload.md) | pending | — | developer |
| 02 | [selfie-avatar](phase-02-selfie-avatar.md) | pending | 01 | developer |
| 03 | [workshop-tab](phase-03-workshop-tab.md) | pending | 01 (song song 02) | developer |

## Dependencies
`GEMINI_API_KEY` (đã có). Không thêm dependency. Stack skills: `/frontend-development`, `/react-best-practices`.

## Risks & mitigations
- Ảnh selfie là dữ liệu cá nhân → AI chỉ gọi sau consent + bấm nút; downscale ≤ 768 px JPEG trên client; không lưu localStorage; xóa data URL khi đóng modal; server không cache (đã làm).
- Payload lớn (ảnh 5 MB → base64 ~6.7 MB > limit 6 MB) → downscale bắt buộc trước khi gửi.
- Preset server (`an-short-hair`…) ≠ preset client (`an-{bob|long}-{default|jade|rose}`) → map ở client (`avatar-preset.ts`), giữ outfit hiện tại.
- 2 test "no AI calls" (`welcome.spec.ts:42`, `game.spec.ts:83`) phải vẫn pass: upload preview không gọi AI.

## Rollback
Revert commit; welcome quay về preview local, Tủ đồ còn 3 tab. Không có dữ liệu/migration.

## Validation Log
User yêu cầu tự quyết để cuối cùng chỉ cần API key (memory `autonomy-only-api-key`). Quyết định mặc định:
| # | Câu hỏi | Chọn | Lý do |
|---|---|---|---|
| 1 | Điểm vào Xưởng may | Tab trong Tủ đồ | Không cần art hub mới; `Closet` đã có `onStudio(draft)` |
| 2 | Khi nào gọi selfie AI | Sau checkbox đồng ý + nút "Phân tích" | Responsible AI; giữ test no-AI |
| 3 | Map preset | Client map `hairLength` → `bob`/`long`, giữ outfit | Không đổi server; settings modal tiếp tục hoạt động |
| 4 | Áp avatar vào game | Prop `pendingAvatarPreset` cho `Game` → `profile/update` | Welcome nằm ngoài state game |

Red-team (05/10): `welcome.spec.ts:23` assert "Sắp có" → giao cho phase 02 sửa đúng dòng đó. Playwright `reuseExistingServer: true` → dev server :3000 đang chạy (code hiện tại) được dùng lại, không còn lỗi HMR cũ.
