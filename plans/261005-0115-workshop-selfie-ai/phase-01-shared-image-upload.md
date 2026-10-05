# Phase 01 — shared-image-upload

## Context Links
- Plan: ./plan.md

## Overview
- Priority: high · Status: pending · Est. effort: 1 h

## Key Insights
- `src/App.tsx:56-74` `selectPhoto`: kiểm type (jpeg/png/webp) + ≤ 5 MB, `URL.createObjectURL` + `Image.decode()`; không có downscale. Server body limit 6 MB → base64 của ảnh 5 MB vượt limit.
- Cả selfie lẫn Xưởng may cần: validate → decode → downscale → data URL JPEG.

## Requirements
- `src/ui/image-upload.ts` (≤ 60 LOC, không React):
  - `validateImageFile(file): string | null` — trả message tiếng Việt khi sai type/size (giữ đúng câu hiện có ở App.tsx).
  - `toDownscaledDataUrl(file, maxSide = 768, quality = 0.85): Promise<{ dataUrl: string; mimeType: 'image/jpeg' }>` — decode bằng `createImageBitmap` (fallback `Image`), vẽ canvas cạnh dài ≤ `maxSide`, `toDataURL('image/jpeg', quality)`; throw khi decode lỗi.
- Không đổi App.tsx ở phase này (phase 02 sở hữu App.tsx).

## Related Code Files
**Create:** `src/ui/image-upload.ts`

## Existing code audit
| File:line | Fit | Verdict |
|---|---|---|
| src/App.tsx:59 (type/size check) | 100% logic, inline | EXTRACT-SHARED (phase 02 chuyển App.tsx sang dùng module) |
| canvas downscale | none | FORK-NEW |

## Reuse strategy
EXTRACT-SHARED — module mới là nguồn duy nhất cho validate + downscale; phase 02 refactor `App.tsx` dùng nó, phase 03 dùng cho Xưởng may.

## Implementation Steps
1. Viết `image-upload.ts`.
2. `npm run lint`.

## Todo List
- [x] image-upload.ts
- [x] lint pass

## Success Criteria
- lint pass; spec của phase 02/03 chứng minh ảnh gửi đi là JPEG và cạnh dài ≤ 768.

## Next Steps
Mở khóa 02, 03.
