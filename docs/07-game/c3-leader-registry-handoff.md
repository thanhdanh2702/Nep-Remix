# C3 — Baseline M1 và bàn giao catalogs/registry Leader

Ngày 08/10/2026. Đây là thông báo giao baseline chính thức, không chỉ là HEAD quan sát được.

## Baseline giao Backend/Core

**M1 được giao baseline `077c05a90a747e2cdb41c590082488ebeda79257` tại `/Users/thanhdanh/Nep-Remix-core`, branch `agent/core`.** Đã đọc report `/tmp/c3-core-preflight-report.md`; xác minh lại HEAD và status sạch. Core được bắt đầu TDD/content/gates/schema/evaluator/queue/migration theo ownership trên baseline này, không cần chờ thêm một phép triển khai.

Bảng tọa độ FE chỉ chặn cập nhật geometry cuối và nghiệm thu approach/path/occlusion; không chặn tests logic/Core M1. Giữ geometry cũ được đánh dấu chưa nghiệm thu, không tự dựng tọa độ placeholder mới hoặc coi Core GREEN là geometry GREEN. Frontend có thể đo art/layout và gửi bảng trước khi nối consumer; nối consumer chỉ sau Core công bố API thật và tests GREEN.

Catalog/registry Leader là dependency tích hợp/renderer, không chặn TDD gates/schema/migration trên B. Core không sửa catalog/shared registry thay Leader. Nếu M1 phát hiện text/shape catalog cần chỉnh, gửi exact patch cho Leader để thống nhất trước integration. Bàn giao dưới đây là local UNCOMMITTED, chưa có ở Core/Frontend và không được gọi là checkpoint C đã phát hành.

## Phạm vi local Leader đã chuẩn bị

- `data/runtime-assets.json`: giữ nguyên từng entry trong 184 entry baseline; thêm đúng 51 production assets theo manifest, tổng 235. Không đăng ký `_raw`/preview hoặc sửa asset bytes.
- `data/asset-gaps.json`: cập nhật số ảnh và ghi rõ C3 chưa qua gameplay/visual/cultural/Safari acceptance. Manifest gốc `data/asset-manifest.json` giữ nguyên; source asset registry cũ không thay vai trò runtime metadata.
- `src/content/items.json`: chỉnh đúng năm entry C3 gồm ba chứng cứ và hai item bùa legacy giữ để load save; không thêm bùa vào gameplay hoặc dùng tín ngưỡng làm bằng chứng tội lỗi.
- `src/content/clues.json`: chỉnh đúng bốn entry C3; ghi chú khóa “Càn trước, Tốn sau”, sổ gốc/bản sửa/thư có quan hệ đối chiếu.
- `src/content/culture-cards.json`: hai thẻ thưởng C3 và entry raglan chung của C3; bỏ tác giả/năm phát minh chưa kiểm chứng và framing lá số tốt. Giữ ID, dùng nhãn kỹ thuật minh họa/diễn giải tác phẩm bằng các trường schema hiện có; chưa mở schema nghiên cứu pending.
- `src/content/studio.json`: đúng áo raglan, cổ thuyền và kính mắt mèo; giữ garment IDs, silhouette, prices, palettes, event lists và category jewelry. Cổ thuyền là quà phụ, không là accepted variant. Chỉnh base path hai áo về thư mục production; giữ nguyên formatting phần khác.
- `scripts/check-c3-leader-handoff.test.mjs`: bốn kiểm tra production metadata/hash/PNG dimensions, registry chỉ thêm đúng manifest, catalog không giữ claim bị loại, và bảo toàn mọi entry ngoài C3/các chapter bytes Mở đầu/C1/C2.

Không sửa Core runtime, schema, c3.json, FE/UI, package scripts hoặc tests của Tester. Không bật PLAYABLE. Diff README overview/đồ ngoài scope không thuộc bàn giao.

## TDD và kiểm chứng thực chạy

| Trạng thái | Lệnh / bằng chứng | Kết quả và giới hạn |
| --- | --- | --- |
| PASS — RED được tái hiện | `node --test scripts/check-c3-leader-handoff.test.mjs` trước sửa data; `/tmp/c3-leader-handoff-red.log` | Exit 1: 1 PASS / 3 FAIL, thiếu registration và catalog legacy sai hướng |
| PASS — GREEN | Cùng lệnh sau sửa data; `/tmp/c3-leader-handoff-green.log` | Exit 0: 4/4 PASS; không đổi assertion để chấp nhận lỗi |
| PASS | `npm run lint` | Exit 0 |
| PASS | `node --import tsx scripts/validate-content.ts` | Exit 0, valid=true; không chứng minh C3 reachable |
| PASS | `npm run test:c2`; `/tmp/c3-leader-c2-regression.log` | Exit 0: 158/158 |
| PASS | `npm run test:core`; `/tmp/c3-leader-core-regression.log` | Exit 0: 15/15 + check-game Mở đầu/C1 |
| PASS | `npm run build`; `/tmp/c3-leader-registry-build.log` | Exit 0, bundle index-DPxglZU0.js; vẫn cảnh báo chunk >500kB |
| PASS | `QA_BASE_URL=http://127.0.0.1:3073 npm run test:assets`; `/tmp/c3-leader-assets-browser.log` | Exit 0: 235 registered PNG giữ hash, emit và decode đúng dimensions; Chromium mobile Studio/Closet/Museum không overflow/console error theo suite hiện hữu |
| NOT APPLICABLE | Coverage runtime logic mới/sửa trong slice Leader này | Chỉ thay data và thêm kiểm tra; không sửa hàm runtime. Không trình coverage test verifier làm coverage game |
| NOT RUN | Core M1/C3 gameplay E2E, fresh W0→W3, Safari, full visual/cultural QA | Chưa có implementation M1/M2 hoặc candidate tích hợp |
| APPROVED — đang thực hiện | Phát hành checkpoint C và cập nhật Core/Frontend | User đã duyệt riêng checkpoint C/M1 và cập nhật fast-forward-only; SHA được bàn giao sau kiểm chứng checkpoint chung |

Server kiểm tra asset: `NODE_ENV=production PORT=3073 npm start`, checkout `/Users/thanhdanh/Nep-Remix`, HEAD B + local diff nêu trên; URL `http://127.0.0.1:3073`, bundle `index-DPxglZU0.js`. Đây là app baseline C1/C2 với metadata/catalog C3 được chuẩn bị, **không phải C3 playable**. Không dùng URL C2 port 3062 cũ thay bằng chứng này. Không gọi AI để kiểm tra asset; không seed save người dùng.

## Phép Git cần riêng

Đề nghị một commit C scoped gồm đúng sáu JSON, test script và tài liệu bàn giao này; sau commit cập nhật Core/Frontend fast-forward-only nếu status cho phép, giữ nguyên edits của dev. Nếu có xung đột/dirty overlap thì dừng và thống nhất với owner, không stash/reset/force hoặc tự merge gameplay. Tester vẫn cần phép chuyển branch riêng đang chờ; không gộp quyền đó vào checkpoint C.

Baseline Core hiện vẫn là B; sau C được phép và cập nhật, Leader sẽ giao SHA bổ sung rõ ràng. Không bắt Core chờ C để bắt đầu phần logic độc lập. Mọi commit M1/M2 và merge candidate gameplay vẫn cần quyền scoped riêng, không push.

## Cập nhật quyền Git 08/10/2026

User đã duyệt phạm vi 8 file checkpoint C, 17 file M1 Core và fast-forward main/Core/Frontend; giữ mọi diff dev, không push/PLAYABLE. Tester không thuộc phạm vi cập nhật. Các mô tả local UNCOMMITTED phía trên ghi lại trạng thái lúc chuẩn bị; checkpoint này đưa đúng slice Leader vào Git. Core/FE chỉ được coi đã nhận sau khi kiểm HEAD và bảo toàn diff.
