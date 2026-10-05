---
title: p0-gemini-wiring-deploy
status: pending
mode: hard
scope: hold
priority: critical
effort: 1.5 days
created: 2026-10-04
blockedBy: []
blocks: [selfie-xuong-may, chapter-1-mini, pixel-ui]
---

# P0 — Nối Gemini vào UI + deploy Cloud Run

4 route `/api/ai/*` đã có (zod, cache, fallback) nhưng UI không gọi; bug thứ tự `dotenv` khiến key luôn rỗng → mọi call âm thầm fallback; chưa có URL deploy. Execution chiếm 50% điểm — giám khảo phải mở được URL và thấy Gemini chạy thật.

Nguồn: `../../../plans/reports/brainstorm-261004-1357-finish-strategy-pixel-pipeline.md`, `../../../plans/reports/explore-261004-1357-repo-gap-audit.md`, `research/researcher-01-cloud-run-deploy.md`, `research/researcher-02-gemini-api-verify.md`, `../reports/reuse-scout-261004-1415-ai-wiring.md`.

## Goal
- Server đọc key đúng, không lộ lỗi nội bộ, input người dùng được làm sạch, lookbook hủy request thật khi timeout.
- Studio có nút "Gợi ý từ Gemini" (Stylist) và "Chụp Lookbook AI"; có loading + badge "AI offline" khi fallback; ảnh pixel local vẫn là fallback.
- URL Cloud Run công khai (asia-southeast1) chạy production build.

## Non-goals
- Selfie → avatar, Xưởng may (plan sau; chỉ sửa phần server dùng chung của 2 route này).
- Open-Meteo / weather thật; AI health dashboard; multi-instance cache/rate-limit (Redis).
- Sửa 2 test "no AI calls" (`game.spec.ts:83`, `welcome.spec.ts:42`) — giữ nguyên làm regression guard: AI chỉ chạy khi bấm nút.

## Phases
| # | Name | Status | Depends on | Owner |
|---|------|--------|------------|-------|
| 01 | [server-env-hardening](phase-01-server-env-hardening.md) | pending | — | developer |
| 02 | [studio-ai-wiring](phase-02-studio-ai-wiring.md) | pending | 01 | developer |
| 03 | [deploy-cloud-run](phase-03-deploy-cloud-run.md) | pending | 01 (song song với 02) | developer + user (gcloud) |

## Dependencies
- `GEMINI_API_KEY` (AI Studio). **Tạo ảnh (`gemini-3.1-flash-image`) không có ở free tier** → Lookbook AI cần project bật billing; không có billing thì luôn rơi về ảnh pixel (vẫn chạy được).
- Cloud Run cần GCP project có billing account + `gcloud` CLI đã đăng nhập (user tự làm, cook không đăng nhập hộ).
- Stack skills cho cook: `/frontend-development`, `/react-best-practices` (phase 02); `/deploy` (phase 03).

## Risks & mitigations
- Client import giá trị từ `src/server/ai/*` → `@google/genai` lọt vào bundle trình duyệt. → Chỉ `import type`; phase 02 kiểm bằng grep bundle `dist/`.
- Lookbook 4 ảnh × tới 45 s giữa demo → nút disable khi đang chạy, client abort 50 s, cache server 30 phút, fallback pixel.
- Rate limiter sau proxy Cloud Run gộp mọi user một IP → `trust proxy` = 1.
- Model id sai → luôn fallback: `scripts/smoke-gemini.ts` gọi thật trước deploy (researcher-02 xác nhận cả 2 id hợp lệ).

## Rollback
- 01/02: revert commit; UI quay về lookbook pixel local, không phụ thuộc AI.
- 03: file mới (Dockerfile, ignore files) + script `start` — revert commit; xóa service bằng `gcloud run services delete tiem-may-nep --region asia-southeast1`.

## Validation Log
| # | Câu hỏi | Trả lời (04/10) | Ảnh hưởng |
|---|---|---|---|
| 1 | Billing cho Cloud Run + ảnh Lookbook? | Bật billing 1 project | Phase 03 runbook thêm budget alert 5–10 USD; Lookbook AI là đường chính, pixel là fallback |
| 2 | Đường deploy? | gcloud + Dockerfile | Phase 03 như viết; nút Deploy của AI Studio chỉ là dự phòng |
| 3 | Nhánh làm việc? | Nhánh mới `feat/p0-gemini-deploy` từ HEAD `feat/point-click-rooms` | Cook tạo nhánh trước phase 01 |

Red-team (04/10): tách unit test sanitize ra `scripts/check-ai-sanitize.ts`; smoke script cũng phải `import 'dotenv/config'` đầu tiên; README chỉ thêm mục deploy (sửa mô tả WASD để plan docs-sync).
