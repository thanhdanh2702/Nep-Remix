# C2 — checkpoint khởi động M0 và danh sách commit dự kiến

Ngày kiểm tra: 07/10/2026. Chủ dự án đã xác nhận “acpt hết nhé”: cho phép hai commit local A/B và duyệt contract/gallery. **Không sửa runtime, không push/reset; chưa merge/cập nhật worktree khác.** Danh sách dưới là snapshot M0 đã duyệt, không phải nhận định mọi thay đổi trong checkout đều thuộc C2.

## 1. Baseline Git và phạm vi bảo toàn

| Worktree | Branch / HEAD | Trạng thái kiểm tra |
| --- | --- | --- |
| Leader — /Users/thanhdanh/Nep-Remix | main / 08a044e | Asset/docs/scripts C2 chưa commit; còn các thay đổi ngoài phạm vi |
| Core — /Users/thanhdanh/Nep-Remix-core | agent/core / 38ed058 | Sạch |
| Frontend — /Users/thanhdanh/Nep-Remix-frontend | agent/frontend / 0f01922 | Sạch |
| Tester — /Users/thanhdanh/Nep-Remix-test | agent/tester / cd18e81 | Có tracked/untracked riêng, giữ nguyên |

Index Leader không có staged file tại lúc kiểm tra. Chưa thay branch hoặc cập nhật worktree nào. Art/docs mới chưa nằm trong Git HEAD của ba agent. SHA trên là snapshot kiểm tra, **không** là checkpoint C2 đã commit.

Tester có hai tracked dirty: `scripts/check-game.ts`, `tests/browser/sprint01-integration.spec.ts`; untracked: `fix-check-game.cjs`, `fix-syntax.cjs`, `patch-check-game.cjs`, `patch-check-game2.cjs`, `patch-corrupt-save.cjs`, `patch-modal-test.cjs`, `patch-modal-test2.cjs`, `patch-modal-test3.cjs`, `patch-modal-test4.cjs`, `patch-toast-close.cjs`, `patch-toast-test.cjs`, `patch-toast.cjs`, `run_test.ts`. Không đưa chúng vào checkpoint Leader hoặc tự dọn.

## 2. Baseline đã chạy trên Leader

Checkout: main@08a044e **cộng asset/docs/scripts C2 dirty được liệt kê dưới**; không gọi đây là clean reproducible commit. Production server của chính checkout: `NODE_ENV=production PORT=3031 npm start`, URL `http://127.0.0.1:3031`; Playwright dùng `QA_BASE_URL`, Chrome headless, viewport mặc định 1366×1100 và ca mobile 844×390 do suite khai báo. Không dùng server C1 cũ của nhánh khác. Không gọi AI.

| Kiểm tra | Kết quả thực chạy |
| --- | --- |
| `npm run build` | PASS client/server; còn cảnh báo JS chunk >500 kB |
| `npm run lint` (tsc --noEmit) | PASS; repo không khai báo lệnh ESLint riêng |
| `npm run test:core` | PASS 15 self-check và walkthrough/check-game hiện có |
| Bốn file regression Core/C1 của kế hoạch | PASS 26/26 |
| `node --import tsx scripts/validate-content.ts` | PASS cấu trúc/liên kết hiện có; không chứng minh C2 gameplay |
| `QA_BASE_URL=http://127.0.0.1:3031 npx playwright test tests/browser/chapter1.spec.ts tests/browser/sprint01-integration.spec.ts` | PASS 11/11 |
| `QA_BASE_URL=http://127.0.0.1:3031 npm run test:assets` | PASS 184 PNG preserved/emitted/decoded, dimensions đúng; mobile rooms suite không overflow/console error |
| Hash manifest runtime C2 vs v4 vs PNG vs registry | PASS 56 unique paths; version 4/background A |
| `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -p test_c2_asset_tools.py` | BLOCKED môi trường: ModuleNotFoundError PIL; không chạy được chín test bằng Python hiện tại |
| Full browser / Safari / fresh W0→W1→W2 / C2 E2E | CHƯA CHẠY; C2 chưa triển khai/playable |
| Coverage gameplay mới / security audit | CHƯA ĐO / CHƯA CHẠY trong kickoff docs-only |

Chín test helper art/100% helper coverage trong QA v4 là bằng chứng đợt art trước, không phải kết quả chạy lại này. Không cài dependency hoặc xuất lại PNG để làm baseline xanh. Không chạy `audit:assets` vì script ghi lại registry/metadata; thay bằng kiểm hash đọc-only và test built assets. Build/test chỉ tạo output chẩn đoán, không sửa source runtime.

Chênh lệch thật so với HEAD: **139 → 184 runtime PNG, thêm 45, không đổi record nào trong 139 ảnh cũ**. Manifest C2 gồm 45 PNG mới + 11 icon tái sử dụng. Con số “142 +42” ở QA art là mốc trung gian, không phải delta Git hiện tại. `missingRequiredArt: []` trong gói không chứng minh áo thưởng phụ đã có layer.

## 3. Hai commit local đã được cho phép

Checkpoint asset A đã commit local: `59671f5`. Commit docs B chứa tài liệu này và là checkpoint chung cần dùng cho bàn giao (lấy SHA từ báo cáo Leader / `git log -1`). Chưa merge ba worktree. Kiểm staged group A đúng 109 file, hash 56/56. `git diff --cached --check` có cảnh báo dòng trống EOF ở bốn README/prompts asset có sẵn; giữ nguyên bản bàn giao, không sửa ngoài nhiệm vụ đóng gói.

A. `chore(assets): checkpoint C2 production v4 and export tools` — **109 file**. Bao gồm runtime PNG/metadata/README, nguồn review-v3 + production-v4 và công cụ. Giữ raw v3 vì exporter thực sự đọc chúng; không chỉ commit v4 rồi làm mất khả năng xuất lại. Raw không được import vào runtime.

Danh sách chính xác nhóm A (mỗi dòng một file; không dùng `git add .` hoặc add cả thư mục):

```text
assets/README.md
assets/accessories/guoc-moc/README.md
assets/accessories/guoc-moc/guoc-moc.png
assets/accessories/khan-van-den/README.md
assets/accessories/khan-van-den/khan-van-den.png
assets/areas/chapter-2/README.md
assets/areas/chapter-2/_raw/production-v4/README.md
assets/areas/chapter-2/_raw/production-v4/an-reference.png
assets/areas/chapter-2/_raw/production-v4/body-reference-side.png
assets/areas/chapter-2/_raw/production-v4/body-reference.png
assets/areas/chapter-2/_raw/production-v4/ca-nghi-expressions.png
assets/areas/chapter-2/_raw/production-v4/clogs.png
assets/areas/chapter-2/_raw/production-v4/exported-paths.json
assets/areas/chapter-2/_raw/production-v4/fitting-preview.png
assets/areas/chapter-2/_raw/production-v4/gallery.html
assets/areas/chapter-2/_raw/production-v4/headwrap.png
assets/areas/chapter-2/_raw/production-v4/lemur-corrected.png
assets/areas/chapter-2/_raw/production-v4/lemur-side.png
assets/areas/chapter-2/_raw/production-v4/lemur.png
assets/areas/chapter-2/_raw/production-v4/loan-expressions.png
assets/areas/chapter-2/_raw/production-v4/manifest.json
assets/areas/chapter-2/_raw/production-v4/outfit-reference-side.png
assets/areas/chapter-2/_raw/production-v4/outfit-reference.png
assets/areas/chapter-2/_raw/production-v4/prompt-clogs.md
assets/areas/chapter-2/_raw/production-v4/prompt-headwrap.md
assets/areas/chapter-2/_raw/production-v4/prompt-lemur-corrected.md
assets/areas/chapter-2/_raw/production-v4/prompt-lemur-side.md
assets/areas/chapter-2/_raw/production-v4/prompt-safe-empty.md
assets/areas/chapter-2/_raw/production-v4/prompts.md
assets/areas/chapter-2/_raw/production-v4/qa.md
assets/areas/chapter-2/_raw/production-v4/safe-empty.png
assets/areas/chapter-2/_raw/production-v4/safe-open.png
assets/areas/chapter-2/_raw/review-v3/README.md
assets/areas/chapter-2/_raw/review-v3/backgrounds/a/c2-s1-gac-lung-ve-tranh--phai.png
assets/areas/chapter-2/_raw/review-v3/backgrounds/a/c2-s2-kho-vai-hang-dao--phai.png
assets/areas/chapter-2/_raw/review-v3/backgrounds/a/c2-s3-phong-trien-lam-doi-dau--phai.png
assets/areas/chapter-2/_raw/review-v3/backgrounds/b/c2-s1-gac-lung-ve-tranh--phai.png
assets/areas/chapter-2/_raw/review-v3/backgrounds/b/c2-s2-kho-vai-hang-dao--phai.png
assets/areas/chapter-2/_raw/review-v3/backgrounds/b/c2-s3-phong-trien-lam-doi-dau--phai.png
assets/areas/chapter-2/_raw/review-v3/characters/ca-nghi.png
assets/areas/chapter-2/_raw/review-v3/characters/loan-exhibit.png
assets/areas/chapter-2/_raw/review-v3/characters/loan-work.png
assets/areas/chapter-2/_raw/review-v3/characters/ong-le.png
assets/areas/chapter-2/_raw/review-v3/characters/reporters.png
assets/areas/chapter-2/_raw/review-v3/gallery.html
assets/areas/chapter-2/_raw/review-v3/manifest.json
assets/areas/chapter-2/_raw/review-v3/prompts.md
assets/areas/chapter-2/_raw/review-v3/props/puzzle-props-a.png
assets/areas/chapter-2/_raw/review-v3/props/puzzle-props-b.png
assets/areas/chapter-2/_raw/review-v3/props/restored-sketch.png
assets/areas/chapter-2/_raw/review-v3/props/safe-states.png
assets/areas/chapter-2/_raw/review-v3/qa.json
assets/areas/chapter-2/_raw/review-v3/references/user-proportion-reference.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/README.md
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/c2-s1-gac-lung-ve-tranh--ban-ve-ghep.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/c2-s1-gac-lung-ve-tranh--manh-1.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/c2-s1-gac-lung-ve-tranh--manh-2.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/c2-s1-gac-lung-ve-tranh--manh-3.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/c2-s1-gac-lung-ve-tranh--manh-4.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/c2-s1-gac-lung-ve-tranh--phai.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-ban-ve-hoan-chinh.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-1.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-2.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-3.png
assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-4.png
assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/README.md
assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/c2-s2-kho-vai-hang-dao--chia-khoa.png
assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/c2-s2-kho-vai-hang-dao--ket-mo.png
assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/c2-s2-kho-vai-hang-dao--ket-rong.png
assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/c2-s2-kho-vai-hang-dao--phai.png
assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/README.md
assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/c2-s3-phong-trien-lam-doi-dau--ban-ve-treo.png
assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/c2-s3-phong-trien-lam-doi-dau--nguoi-nghe.png
assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/c2-s3-phong-trien-lam-doi-dau--phai.png
assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/cg-c2-loan-tu-ky-ten.png
assets/areas/chapter-2/manifest.json
assets/characters/ca-nghi/README.md
assets/characters/ca-nghi/portrait-idle.png
assets/characters/ca-nghi/portrait-retreat.png
assets/characters/ca-nghi/portrait-shocked.png
assets/characters/ca-nghi/portrait-stern.png
assets/characters/ca-nghi/scene-idle.png
assets/characters/ca-nghi/scene-retreat.png
assets/characters/ca-nghi/scene-shocked.png
assets/characters/ca-nghi/scene-stern.png
assets/characters/ca-nghi/view-front.png
assets/characters/cu-loan/README.md
assets/characters/cu-loan/portrait-determined.png
assets/characters/cu-loan/portrait-exhibition.png
assets/characters/cu-loan/portrait-idle.png
assets/characters/cu-loan/portrait-relieved.png
assets/characters/cu-loan/portrait-worried.png
assets/characters/cu-loan/scene-determined.png
assets/characters/cu-loan/scene-exhibition.png
assets/characters/cu-loan/scene-idle.png
assets/characters/cu-loan/scene-relieved.png
assets/characters/cu-loan/scene-worried.png
assets/characters/cu-loan/view-front.png
assets/characters/ong-le/README.md
assets/characters/ong-le/portrait-idle.png
assets/characters/ong-le/scene-idle.png
assets/characters/ong-le/view-front.png
assets/garments/ao-dai-lemur/README.md
assets/garments/ao-dai-lemur/ao-dai-lemur.png
data/asset-gaps.json
data/runtime-assets.json
scripts/c2_asset_tools.py
scripts/export-c2-assets.py
scripts/test_c2_asset_tools.py
```

B. `docs(game): define C2 kickoff contract and agent handoff` — **6 file**:

```text
docs/07-game/08-c2-asset-handoff.md
docs/07-game/09-c2-leader-plan.md
docs/07-game/README.md
docs/07-game/c2-agent-prompts.md
docs/07-game/c2-contract.md
docs/07-game/c2-startup.md
```

Tổng đề xuất **115 file**. Snapshot nhóm A lấy từ tracked diff + untracked C2 hiện có; nhóm B gồm ba tài liệu sẵn có chưa commit và ba tài liệu Leader vừa soạn. Trước commit phải kiểm status/diff lại, kiểm hash và staged diff chỉ đúng danh sách đã duyệt. Nếu file mới xuất hiện hoặc file chung có delta ngoài C2, tách và xin xác nhận lại.

### Không commit cùng checkpoint

- `docs/01-overview/README.md`: tracked thay đổi dòng trống EOF có sẵn, ngoài phạm vi; giữ nguyên. Không sửa chỉ để `git diff --check` toàn repo xanh.
- `docs/07-game/c1-independent-review.md`: untracked review C1 riêng, không thuộc C2.
- `graphify-out/`, `src/graphify-out/`: graph/index/cache cục bộ, không thuộc deliverable C2.
- `output/`: bản gen/review/ảnh loại trung gian, không phải đường runtime hay nguồn mà exporter hiện đọc. Các nguồn cần tái xuất đã có trong `assets/areas/chapter-2/_raw/` và được liệt kê rõ ở A. Giữ output hiện có, không xóa.
- Các icon C2 tái sử dụng đã tracked và không đổi không cần stage; không thêm file giả chỉ vì xuất hiện trong manifest.
- Dirty files của worktree Tester không thuộc nhóm A/B.

## 4. Khoảng trống runtime đối chiếu source

C2 JSON còn 120 Sen, Hàng Gai, logicalSize 800×500/aspect placeholder, két mặt trái, hint xoay/flip, đáp án styling áo phụ; chưa có gate/entry/ending phù hợp. UI chưa có order thực, scene mapping C2/loan adapter, PLAYABLE chưa gồm C2. Core đã có gate/order/draft/queue/reward/migration nhưng chưa có schema/context loan; styling submit và Closet direct-save chưa bảo vệ quyền mượn như contract đích.

Chi tiết implemented/proposed/pending, payload và năm puzzle: [c2-contract.md](c2-contract.md). Ba prompt manual: [c2-agent-prompts.md](c2-agent-prompts.md). Không thay runtime ở đợt này để che chênh lệch.

## 5. Checklist điều phối M0–M5

- [x] M0 đọc kế hoạch/handoff/manifest và source liên quan, kiểm Git/ngoài scope, đo baseline tối thiểu.
- [x] M0 soạn exact commit inventory, draft contract và ba prompt thủ công.
- [x] M0 chủ dự án duyệt nhóm file/quyền commit, gallery, contract loan, policy phục hồi và wording. Giữ reward áo phụ; layer còn là việc chưa thực hiện.
- [x] M0 đóng gói local đúng danh sách A/B đã duyệt; SHA A ở mục 3, SHA B trong báo cáo Leader.
- [ ] M0 cập nhật ba worktree khi được cho phép, bảo toàn dirty Tester. M0 chưa đóng khi các owner chưa xác nhận cùng checkpoint.
- [ ] M1 Core RED→GREEN schema/gates/loan/ending; Frontend khung cảnh/order; Tester ca độc lập. Core công bố chữ ký API thật trước consumer.
- [ ] M2 nghiệm thu S1 intro → bốn mảnh → ghép → đọc D1 → S2.
- [ ] M3 nghiệm thu S2 chìa/két/hai giấy/queue/reload → S3.
- [ ] M4 nghiệm thu S3 receipt → sketch → Lemur → ending → reward/Hub; đóng quyết định áo phụ. Leader cho phép candidate C2 để QA menu thật.
- [ ] M5 tích hợp Core → Frontend → Tester sau quyền Git; chạy trên Leader, full W0/W1/W2 + negative/save/history + regression/multi-device. Release C2 sau duyệt art/nội dung/quà; C3–C5 không playable.

## 6. Kết quả xác nhận của chủ dự án

1. Được phép commit **A (109 file) + B (6 file)**. Merge/cập nhật worktree là bước riêng, chưa thực hiện.
2. Gallery v4 và loan schema/helper/context ở contract mục 4 đã được duyệt; API vẫn cần triển khai.
3. Giữ reward hiện tại, cần bổ sung layer đúng áo phụ trước nghiệm thu. Chưa tạo/giao gen art bổ sung, không dùng Lemur giả áo khác.
4. Wording/ending được duyệt cho triển khai; người thẩm định và nguồn VH04/VH05 chưa có bằng chứng mới. Không tuyên bố đã xác minh sử liệu.
5. Duyệt giữ lịch sử/tiền và cho đọc phục hồi, không auto-read/tự nhận thưởng; Core cần kiểm chứng migration bằng fixtures.

Gallery được chủ dự án duyệt trực tiếp, không suy ra từ test tự động. Chưa tuyên bố C2 hoàn tất hoặc C1 đã được chủ dự án nghiệm thu chỉ từ baseline này. Baseline security bổ sung trước commit: `npm audit --omit=dev` PASS, 0 vulnerabilities (không bao gồm dev dependencies).
