# C2 — candidate chơi thử tích hợp

Ngày: 2026-10-07. Đây là candidate local, chưa phải nghiệm thu phát hành toàn bộ C2.

## Nguồn tích hợp

- Core `19d6c11` (bao gồm implementation và layout `1ccf21a`), merge `7cf52eb`.
- Frontend `edece11` (bao gồm Studio `1692327`), merge `a6afed8`.
- Tester: chỉ cherry-pick `9e4ca5a` và `c9845b1`, thành `8659016` và `4db6ce6`.
  Không merge lịch sử ngoài phạm vi hoặc dirty files C1 của worktree Tester.
- Bật C2 trong PLAYABLE; C3–C5 vẫn không chơi được.

## Sửa lỗi khi tích hợp (RED → GREEN)

1. Geometry FE mới đẩy chân ra sàn nhưng vượt guard ở bốn hotspot. Giữ pos,
   gates và công thức guard; cập nhật radius desk `.17`, easel `.21`, shelves
   `.30`, shadow `.25`. Dùng khoảng cách thực từ implementation walker, không
   gửi tọa độ vật thay chân người chơi. Test adapter kiểm cả hai phía, spawn/
   return, normal/reduced; S3 spawn được tránh podium xuống y `.775`.
2. Studio crash khi glob nhận ảnh trang phục C3 nháp không có metadata.
   Runtime chỉ nhận URL có trong runtime-assets.json. Không sửa/xóa/đăng ký
   các ảnh C3, không thay layer quà thiếu. Vite vẫn emit ảnh glob ngoài phạm
   vi trên đĩa: build này chỉ dùng local, chưa phải gói asset release sạch.
3. Browser normal motion phát hiện walk bị hủy bởi render hover/resize.
   Memoize world size để effect tải cảnh không reset walker giữa đường.
4. Sửa assertion CSS của harness sang selector nút thật
   `.order-strip-btn-group button`; không bỏ kiểm tra kích thước.

## Chạy và chơi

Server production riêng Leader: http://127.0.0.1:3062.

```sh
npm run build
NODE_ENV=production PORT=3062 npm start
```

Vào game → Cốt truyện → Phố Cổ Hà Nội / Cụ Loan (Chương 2).
Gate chính vẫn yêu cầu hoàn thành/nhận thưởng C1. Save gắn với origin:
localhost:3000 và 127.0.0.1:3062 không dùng chung save. Không tự sửa hoặc
ghi đè save thật để mở chương. Server port 3000 hiện thuộc worktree Tester,
không phải candidate Leader; không dùng nó để nghiệm thu candidate này.

## Kiểm thử

- `npm run test:c2`: 154/154 PASS (bao gồm 29 ca Tester).
- `C2_MOVEMENT_REVISION=HEAD node --import tsx --test src/core/c2-layout.test.ts`:
  18/18 PASS với source walker tích hợp.
- `npm run test:core`, validator, lint, build, npm audit: PASS; audit 0 vulnerabilities.
- Regression dialogue/reread/replay/Sprint 01: 26/26 PASS.
- Browser candidate: xem kết quả cuối trong commit bàn giao. Suite
  `tests/browser/c2-playtest.spec.ts` chạy UI menu → P1–P5 → ending → claim100
  → Hub, reload giữa hai giấy, kiểm không cấp loan vĩnh viễn trước claim,
  5 viewport × 2 motion. Fixture chỉ hoàn thành Mở đầu/C1 trước khi vào C2;
  không seed tiến trình C2. Đây không phải bằng chứng fresh-save C1 UI run.
- Artifact local: `artifacts/browser-report.json`,
  `artifacts/c2-playtest-ending-<width>-<motion>.png`.
- Coverage 100% lines/88.57% branches/100% functions chỉ đo hai helper
  order-puzzle/styling-answer; không phải coverage toàn Frontend.

## Chưa nghiệm thu

- Art: áo phụ `ao-dai-tan-thoi-vang-mo-ga` thiếu layer mặc thật; không dùng
  Lemur thay thế. Blocker nghiệm thu quà đầy đủ vẫn giữ nguyên.
- Tester cần nghiệm thu độc lập suite C2 đầy đủ trên SHA candidate; happy
  path Leader không thay thế toàn bộ keyboard/focus/geometry/path acceptance.
- Chưa kiểm Safari; build có cảnh báo chunk >500kB.
- Không push/reset; thay đổi ngoài phạm vi và worktree dev giữ nguyên.
