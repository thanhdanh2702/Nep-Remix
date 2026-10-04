# Phase 01 — setup-and-copy

## Overview
Priority: high · Status: completed · Est. 1–2 h

## Requirements
- `scripts/setup.mjs` + script `"setup": "node scripts/setup.mjs"` trong `package.json`: nếu chưa có `.env` thì copy `.env.example`; hỏi "Dán Gemini API key" (stdin, ẩn ký tự nếu terminal hỗ trợ; Enter để bỏ qua); ghi `GEMINI_API_KEY=` vào `.env` (không in key ra màn hình); in hướng dẫn tiếp (`npm run dev`, mở `http://localhost:3000`). Hỗ trợ `npm run setup -- --key <KEY>` (không prompt) cho CI. Chạy được trên Windows PowerShell/Git Bash.
- `npm run smoke:ai` = `tsx scripts/smoke-gemini.ts` (đã có file) để kiểm key sau setup.
- Copy trong game: hướng dẫn "Ghé tiệm, chơi thế nào?" (`src/App.tsx`) — sân dùng WASD/mũi tên, **phòng cốt truyện bấm/chạm vào vật có viền sáng, Soi (Space) để lộ vật**, Túi đồ để ghép đồ; nhắc Xưởng may trong Tủ đồ và Gợi ý/Lookbook AI trong Phòng phối đồ. Giữ nguyên các chuỗi test đang assert (grep `tests/browser` trước khi đổi).

## Related Code Files
Modify: `package.json` (scripts only), `src/App.tsx` (chỉ panel help). Create: `scripts/setup.mjs`.

## Todo
- [x] setup.mjs + scripts
- [x] help copy
- [x] `npm run setup -- --key test123` tạo `.env` đúng (rồi khôi phục `.env` cũ nếu có); lint; welcome.spec pass

## Success Criteria
`.env` mới có đúng 1 dòng `GEMINI_API_KEY=...`, các biến khác từ `.env.example`; không key nào xuất hiện trong output.
