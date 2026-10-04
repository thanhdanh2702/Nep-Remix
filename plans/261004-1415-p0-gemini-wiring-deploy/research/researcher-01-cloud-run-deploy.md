# Research: Deploy Nep-Remix to Cloud Run (2026-10-04)

## TL;DR
Use a Dockerfile (multi-stage, node:22-slim) + `gcloud run deploy --source .`. Bundle server.ts with esbuild to `server.mjs` at app ROOT (not dist-server/, see pitfall). Key via Secret Manager `--set-secrets`. Add `app.set("trust proxy", 1)` (1 line; otherwise rate limiter is one global bucket). `--min-instances 1` only for the judging window. Runner-up: AI Studio Deploy button (fallback).

## Facts read from the repo (verified by tool)
- server.ts: `import { createServer as createViteServer } from "vite"` is a STATIC top-level import (line 5), used only in the `!isProd` branch. So `vite` must exist in prod node_modules (it is in `dependencies`, OK). Not lazy.
- isProd = NODE_ENV === "production"; PORT from env (default 3000); listens 0.0.0.0. OK for Cloud Run.
- Prod serves `path.resolve(__dirname, "dist")`, `__dirname` derived from `import.meta.url`.
- No `trust proxy` in server.ts; rate limiter keys on `req.ip` (20 req/min/IP, in-memory).
- Body limit 6mb (src/config/limits.ts). LOOKBOOK_TIMEOUT_MS = 45000 (src/config/ai-models.ts).
- gemini-client.ts reads process.env.GEMINI_API_KEY at import time (env-var secrets are resolved before start, fine).
- data/asset-manifest.json read in content/index.ts uses globalThis.require (undefined in ESM) so effectively dead; no other runtime file reads found (grep src/server, src/content, src/core). Copying data/ is harmless.
- vite build imports `assets/**` (root, 67 MB, 371 git-tracked files) from src/App.tsx and src/game/assets.ts. So `assets/` MUST NOT be in .dockerignore/.gcloudignore. public/assets only has .gitkeep.
- No Dockerfile, .dockerignore, .gcloudignore exist yet. package-lock.json and bun.lock both exist, so use `npm ci`.
- Tested locally: esbuild with `--bundle --platform=node --format=esm --packages=external --outfile=<dir>/server.mjs` succeeds (280 KB, handles ./src/*.ts imports). Bundled output keeps `__dirname = dirname(import.meta.url)`, so dist path is relative to the bundle file directory.

## Q1. Dockerfile vs buildpacks: Dockerfile (#1)
- Buildpacks default start = `npm start` = `tsx server.ts`; Node buildpack prunes devDependencies after build and tsx is a devDependency, so likely "tsx not found" at runtime; NODE_ENV at runtime also not guaranteed. UNVERIFIED (buildpack doc page 404 on fetch; from experience). Dockerfile removes the guesswork.
- `gcloud run deploy --source .` works with a Dockerfile present (Cloud Build builds it); no Docker Desktop needed on Windows.

Dockerfile:
```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build \
 && npx esbuild server.ts --bundle --platform=node --format=esm --packages=external --outfile=server.mjs

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/data ./data
EXPOSE 8080
CMD ["node", "server.mjs"]
```
Cloud Run injects PORT=8080; server honors it. Node 22 vs vite 8 engines: UNVERIFIED; if `npm ci` warns/fails use node:24-slim (local is v24.14.1).

.dockerignore (save identical copy as .gcloudignore; which one gcloud honors with a Dockerfile is UNVERIFIED, so provide both):
```
node_modules
dist
dist-server
.git
.env*
!.env.example
test-results
playwright-report
artifacts
plans
docs
reports
research_notes
*.rar
*.log
```
Do NOT exclude assets, src, public, data, index.html, configs. Root *.png screenshots optional: `/*.png`.

## Q2. esbuild bundle vs tsx in dependencies: esbuild bundle (#1)
- Bundle: no tsx at runtime, faster boot, tsx/esbuild stay devDeps. With `--packages=external`, express/vite/dotenv/@google/genai load from node_modules (all in `dependencies`), so no ESM dynamic-require problems.
- PITFALL (verified): emit to `server.mjs` at app root so `__dirname=/app`. Emitting to `dist-server/server.mjs` makes it serve `dist-server/dist` and `/` breaks. Avoids editing server.ts.
- Vite is statically imported even in prod; keep it in `dependencies`.
- Alternative (#2): move tsx to dependencies, `CMD ["npx","tsx","server.ts"]`. Works, slower boot, needs src/ in image. Use only if bundle misbehaves.

## Q3. Secrets / PORT / trust proxy
- Env-var secrets resolve at instance start; Google recommends pinning versions over `latest`; runtime service account needs roles/secretmanager.secretAccessor; deploy checks access (docs.cloud.google.com/run/docs/configuring/services/secrets, fetched).
- Create secret with NO trailing newline (PowerShell echo appends one); use Git Bash printf.
- Plain `--set-env-vars GEMINI_API_KEY=...` also works but key is visible in service config/console. Recommend Secret Manager pinned to version 1 (about 3 extra commands).
- Never bake .env into image (excluded).
- trust proxy: without it req.ip is the Google front-end address, so all users share one 20/min bucket (verified from code). Add `app.set("trust proxy", 1);` right after `const app = express();`. Value 1 matches one Google front-end hop appending client IP to X-Forwarded-For; not confirmed from an official doc this session (UNVERIFIED), so log req.ip after deploy. Limiter is per-instance memory; use `--max-instances 3` to bound it.

## Q4. Limits, timeout, cost, region
- Request size 32 MiB for HTTP/1, none for HTTP/2 (docs.cloud.google.com/run/quotas, verified). Our 6mb is far below.
- Timeout default 300 s, max 60 min (request-timeout doc, verified). 45 s lookbook is fine; set `--timeout 120` to tighten.
- Min instances incur billing even idle (min-instances doc, verified). Free-tier figures (2M requests, 400k vCPU-s, 1M GiB-s per month) and idle rates came from a weak pricing-page fetch: UNVERIFIED; check cloud.google.com/run/pricing. Plan: min-instances 1 only just before/during judging, then back to 0. Add `--cpu-boost`.
- Region asia-southeast1 (Singapore) is closest to Vietnam. Free-tier eligibility in that region UNVERIFIED.
- Needs billing-enabled project; enable run, cloudbuild, artifactregistry, secretmanager APIs.

## Exact commands (Git Bash; replace PROJECT)
```bash
gcloud auth login
gcloud config set project PROJECT
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

printf %s "YOUR_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-
PNUM=$(gcloud projects describe PROJECT --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PNUM}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# from D:/ao-dai/Nep-Remix
gcloud run deploy tiem-may-nep --source . --region asia-southeast1 \
  --allow-unauthenticated --set-secrets GEMINI_API_KEY=gemini-api-key:1 \
  --memory 1Gi --cpu 1 --timeout 120 --cpu-boost --max-instances 3 --min-instances 0

curl https://<service-url>/api/health

# judging window
gcloud run services update tiem-may-nep --region asia-southeast1 --min-instances 1
gcloud run services update tiem-may-nep --region asia-southeast1 --min-instances 0
```
Default compute SA assumed as runtime identity; answer Y if prompted to create an Artifact Registry repo. NODE_ENV is set in the Dockerfile.

## Q5. AI Studio Build one-click deploy
- AI Studio Build has a Deploy button (top right) deploying to Cloud Run with GEMINI_API_KEY injected server-side (ai.google.dev/gemini-api/docs/aistudio-build-mode search result; dev.to/googleai article fetched). Needs a GCP project with billing. Exact UI unverified.
- No technical conflict: it creates its own separate Cloud Run service (two URLs). Caveat: deploys AI Studio copy of the project, so repo changes must be synced; how it handles custom Express server.ts is UNVERIFIED (metadata.json declares MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API, suggests supported).
- Rank: #1 own Dockerfile + gcloud (reproducible, control of secrets/min-instances); #2 AI Studio Deploy as quick fallback or if contest needs an AI Studio-hosted entry.

## Comparison
| | Dockerfile + --source | Buildpacks --source | AI Studio Deploy |
|---|---|---|---|
| Error risk | low | medium (tsx prune, unverified) | unknown black box |
| Control | full | full | limited |
| Setup | ~15 min | ~10 min | ~2 min |
| Reproducible | yes | mostly | no |

## Gaps / unverified
- Cloud Run pricing numbers, free-tier region eligibility.
- Buildpack tsx behavior; node 22 vs vite 8 engines; trust proxy hop count; .dockerignore vs .gcloudignore precedence.
- Docker image never built locally; only esbuild bundle and file reads verified.
- Contest rule: must the submission be AI Studio-hosted? Confirm with organizers.
- trust proxy change touches server.ts (1 line).
