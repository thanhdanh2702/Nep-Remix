# Phase 03 — deploy-cloud-run

## Context Links
- Plan: ./plan.md · Research: ./research/researcher-01-cloud-run-deploy.md (Dockerfile, ignore files, lệnh gcloud đầy đủ)
- Stack skill: `/deploy`

## Overview
- Priority: critical · Status: pending · Est. effort: 2–3 h code + thời gian user chạy gcloud · Depends on: 01 (song song được với 02)

## Key Insights
- `server.ts` import `vite` tĩnh (dòng 5) → `vite` phải ở `dependencies` (đã có). Prod chạy `dist/` khi `NODE_ENV=production`.
- `start` hiện = `tsx server.ts` (tsx là devDependency, không set NODE_ENV) → hỏng sau `npm ci --omit=dev`.
- esbuild (đã có ở devDeps) bundle `server.ts` → **`./server.mjs` ở root** (không phải `dist-server/`, vì `__dirname` sẽ trỏ sai thư mục `dist`). `--platform=node --format=esm --packages=external`.
- `assets/` (67 MB) là input của `vite build` → KHÔNG được ignore.
- Cloud Run: request ≤ 32 MiB, timeout mặc định 300 s (đặt 120 s), PORT do env cấp. Billing account bắt buộc. min-instances tính tiền cả khi rảnh → chỉ bật trong khung chấm.
- AI Studio Build có nút Deploy riêng (tạo service Cloud Run khác) → phương án dự phòng.

## Requirements
**Functional:**
- `npm run build` = `vite build` + bundle server → `server.mjs`.
- `npm start` = `node server.mjs` với `NODE_ENV=production` (set trong Dockerfile `ENV`; script start không phụ thuộc cross-env).
- Dockerfile multi-stage `node:22-slim`: stage build (`npm ci`, `npm run build`) → stage runtime (`npm ci --omit=dev`, copy `dist/`, `server.mjs`), `USER node`, `EXPOSE 8080`.
- Key qua Secret Manager (`--set-secrets GEMINI_API_KEY=gemini-api-key:1`), không bake vào image.
- Runbook `docs/05-tech/deploy-cloud-run.md`: các lệnh gcloud từ research (enable API, tạo secret, IAM `secretAccessor`, `gcloud run deploy tiem-may-nep --source . --region asia-southeast1 --timeout 120 --allow-unauthenticated`, bật/tắt `--min-instances 1`), rollback, xóa service.

**Non-functional:** image không chứa `.env`, `node_modules` host, `tests/`, `artifacts/`, `plans/`, `test-results/`, `soundtrack/`; build local chạy được trên Windows (Docker Desktop không bắt buộc — `--source` build trên Cloud Build).

## Related Code Files
**Modify:** `package.json` (scripts `build`, `start`, thêm `build:server`), `.gitignore` (thêm `server.mjs`), `README.md` (chỉ mục Chạy & Deploy: env, `npm run build && npm start`, link runbook — sửa mô tả WASD thuộc plan docs-sync riêng)
**Create:** `Dockerfile`, `.dockerignore`, `.gcloudignore`, `docs/05-tech/deploy-cloud-run.md`
**Delete:** —

## Existing code audit
Không có app-level logic mới (infra/config) → bỏ reuse-scout theo quy tắc. Không có Dockerfile/CI config nào trong repo (đã xác minh ở explore).

## Reuse strategy
FORK-NEW — file infra mới; dùng lại `vite build` + esbuild có sẵn, không thêm dependency.

## Implementation Steps
1. `package.json`: `"build:server": "esbuild server.ts --bundle --platform=node --format=esm --packages=external --outfile=server.mjs"`, `"build": "vite build && npm run build:server"`, `"start": "node server.mjs"`. Giữ `dev` = `tsx server.ts`.
2. `.gitignore` += `server.mjs`.
3. Dockerfile + `.dockerignore` + `.gcloudignore` theo research-01 (đối chiếu lại danh sách ignore với Non-functional).
4. Kiểm tra local: `npm run build` → PowerShell `$env:NODE_ENV='production'; npm start` → `curl localhost:3000/api/health` 200, `/` trả HTML, 1 asset PNG 200, POST stylist trả ok/fallback.
5. `npm run test:assets` (dist hashes) pass.
6. Viết runbook + cập nhật README.
7. **User** chạy runbook (gcloud login, billing, secret, deploy) → dán URL.
8. Smoke trên URL thật: `/api/health`, mở Studio, bấm "Gợi ý từ Gemini" → badge `Gemini`; chạy `QA_BASE_URL=<url> npx playwright test tests/browser/studio-ai.spec.ts tests/browser/game.spec.ts`.

## Todo List
- [x] scripts build/build:server/start
- [x] .gitignore server.mjs
- [x] Dockerfile, .dockerignore, .gcloudignore
- [x] prod local smoke (health, /, asset, stylist)
- [x] test:assets pass
- [x] runbook + README
- [ ] user deploy → URL
- [ ] smoke + Playwright trên URL thật

## Success Criteria
- `npm run build && NODE_ENV=production npm start` chạy không cần `tsx`.
- URL `https://tiem-may-nep-*.asia-southeast1.run.app` mở được trên điện thoại; `/api/health` 200; Stylist trả badge `Gemini` (key thật).
- Playwright `game.spec.ts` + `studio-ai.spec.ts` pass với `QA_BASE_URL`.

## Risk Assessment
- Buildpacks/`--source` dùng Dockerfile nếu có ở root → đảm bảo Dockerfile ở root Nep-Remix.
- Vite 8 cần Node ≥ 20.19 → node:22-slim OK (chưa kiểm build image thật — bước 7 sẽ lộ).
- In-memory cache/rate-limit không chia sẻ giữa instance → đặt `--max-instances 2` cho demo.
- Chi phí: min-instances + ảnh lookbook → đặt budget alert trong runbook.

## Security Considerations
- Secret version pin (`:1`), không dùng `latest`; service account runtime chỉ có `secretAccessor` cho secret này.
- `--allow-unauthenticated` là cần cho giám khảo; rate-limit (phase 01) là lớp bảo vệ chi phí duy nhất → giữ 20 req/phút/IP.

## Next Steps
URL này dùng cho video demo + bài nộp; các plan sau (selfie, chương 1, pixel UI) chỉ cần redeploy.
