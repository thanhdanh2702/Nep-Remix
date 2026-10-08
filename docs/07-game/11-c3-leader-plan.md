# C3 — Kế hoạch Leader, M0 đã duyệt có giới hạn

Ngày: 08/10/2026. Chủ dự án đã duyệt kế hoạch/contract và cho phép triển khai theo milestone, trừ các mục chưa chốt. Bước hiện tại: chuẩn bị checkpoint và prompt trước khi dev bắt đầu. Team dự kiến đúng bốn vai trò Leader / Backend-Core / Frontend / Tester. Không tạo agent/worktree hoặc gửi task trong đợt này; worktree có sẵn không chứng minh có bốn agent đang hoạt động.

## 1. Baseline có bằng chứng

Áp dụng AGENTS do chủ dự án cung cấp trong phiên và `/Users/thanhdanh/AGENTS.md` (graphify cho câu hỏi codebase). Không có AGENTS.md trong bốn checkout qua `rg --files --hidden -g AGENTS.md -g '!node_modules' -g '!.git'`; không có ở `/AGENTS.md`, `/Users/AGENTS.md`. Đã dùng graphify query để định vị rồi đọc source; không rebuild graph hoặc gọi agent.

| Checkout / branch | HEAD | Quan hệ với main | Status trước soạn M0 |
| --- | --- | --- | --- |
| `/Users/thanhdanh/Nep-Remix` / main | c6fc47f9d96de3494b2801af918d45f2d44f1479 | Baseline | README overview chỉ thêm dòng trống; C3 asset/docs/scripts untracked; còn đồ ngoài scope |
| `/Users/thanhdanh/Nep-Remix-core` / agent/core | 633a0c01bbbf6b47c500139303511daa186d19ac | 0 commit riêng, thiếu 31 commit main | Clean |
| `/Users/thanhdanh/Nep-Remix-frontend` / agent/frontend | aed945dca6acadb6c8fdeaa8d6c8345100030bc0 | 0 commit riêng, thiếu 24 commit main | Untracked scratch/ |
| `/Users/thanhdanh/Nep-Remix-test` / agent/tester | f0ba80001c355f457869d398e422d0b4cc6c75ee | 14 commit riêng, thiếu 11 commit main | Hai tracked dirty files + nhiều script nháp, xem snapshot cuối tài liệu |

**Không tìm thấy checkpoint “C2 đã hoàn thành toàn bộ” đáp ứng nghiệm thu.** Checkpoint tốt nhất để bảo toàn là candidate tích hợp `c6fc47f`: runtime geometry fix cuối `524b3fc`, report/acceptance packaging tại `c6fc47f`. Git xác nhận merge Core `1e72498`, FE `e6ceac9`, các tester regression nhận có chọn lọc; không được merge toàn nhánh Tester vì có lịch sử ngoài scope.

Đối chiếu [c2-geometry-integration.md](c2-geometry-integration.md), [c2-integration-playtest.md](c2-integration-playtest.md), `artifacts/browser-report.json`, `test-results/.last-run.json` và source:

| Kiểm tra | Bằng chứng / kết quả | Giới hạn |
| --- | --- | --- |
| C2 unit/regression | Chạy lại `npm run test:c2`: 158/158 PASS | Không thay E2E/visual |
| Walker layout | Chạy lại `C2_MOVEMENT_REVISION=HEAD C2_CHECK_PATH_CLEARANCE=1 node --import tsx --test src/core/c2-layout.test.ts`: 20/20 PASS | Floor-strip không chứng minh chân trên sàn vẽ |
| Core/C1 walkthrough | Chạy lại `npm run test:core`: 15/15 + check-game PASS | Lượt sandbox lỗi IPC EPERM; lượt được duyệt ngoài sandbox pass |
| Typecheck | Chạy lại `npm run lint`: PASS | Không build/browser mới |
| Browser trước khảo sát | Report bắt đầu 2026-10-08T00:36:40.433Z, 212487ms, expected 29, unexpected/flaky/skipped=0; mọi result passed, retry=0; last-run passed | Report local không tự ghi Git SHA. Liên kết runtime 524b3fc / bundle index-CQejVare.js theo biên bản; chưa chạy E2E mới tại HEAD |
| Build/audit trước khảo sát | Biên bản C2 ghi PASS, 0 vulnerabilities | Không gọi đây là kết quả chạy mới ngày khảo sát |
| C3 export | Chạy lại Python runtime có Pillow, `scripts/test_c3_asset_tools.py --coverage`: 23/23 PASS, helper 58/58 executable lines | Không phải coverage exporter/renderer/gameplay |

Log lượt mới ở `/tmp/c3-m0-{c2-tests,core-tests,lint,layout,asset-tests}.log`; core-tests.log chứa lượt sandbox thất bại, output lượt chạy lại thành công ở phiên tool, không giả sửa log đó thành pass. Browser artifact gồm 8 geometry, 10 walkthrough C2 (5 viewport × 2 motion), 11 C1/save/queue cases; fixture walkthrough C2 hoàn thành C1 trước, không phải fresh W0→W3 bằng UI.

Blocker C2 phải giữ công khai: **C2-GEO-009** chân An tại cửa sổ S1 cao hơn sàn vẽ; thiếu wear layer thật `ao-dai-tan-thoi-vang-mo-ga`; Safari/full visual chưa nghiệm thu. Không sửa C2 trong sprint C3 nếu chưa có phạm vi riêng. C1 independent review untracked không được dùng làm chứng cứ C2 đã release.

## 2. Inventory và dependency

Tất cả 12 nguồn người dùng yêu cầu có ở main: docs 01–07, handoff 10, export evidence, design system, manifest, gallery. Các worktree đều có tám docs đã tracked (01–07 + design system), nhưng thiếu hai docs C3 mới, manifest và gallery. Contract C2 cùng implementation có ở main; bản ở dev worktree cũ hơn, không lấy làm baseline C3.

Manifest `production-v1`: **59/59 production paths tồn tại và SHA-256 khớp** ở main; 51 PNG mới + 8 reuse. Metadata runtime hiện chỉ đăng ký 8 reuse, chưa đăng ký 51 mới. Ba worktree dev đều chỉ có 8/59 và hash khớp 8 reuse; thiếu cả 51 production PNG mới. Không tự copy/sync.

| Nhóm manifest | Số file | Ghi chú |
| --- | ---: | --- |
| Character sprite | 17 | 13 pose tĩnh + 4 view-front; 176×416, không animation |
| Portrait | 13 | 128×128 từ pose |
| Background | 3 | 1672×941 |
| Overlay | 10 | Giấy rời, ghi chú, rương mở/rỗng |
| Document | 4 | doc-c3-bien-nhan / so-goc / thu-thoa-thuan / ban-sua |
| Garment | 2 | Raglan + cổ thuyền strip 528×416 |
| Accessory | 1 | Kính mắt mèo strip 528×416 |
| Ending CG | 1 | Mai tự lên tiếng |
| Reuse | 8 | Guốc, Ông Lệ, ba icon outfit/accessory, ba icon evidence |

Đã đọc gallery HTML và xem trực tiếp ba scene-preview production: Mai bob, Bà Lớn búi thấp, Thầy Ba Càn lớn tuổi; người đã tăng 35%. Không tuyên bố final visual signoff thay chủ dự án. Manifest vẫn `gameplayIntegrated=false`, `sharedMetadataUpdated=false`, `culturalApproved=false`, `visualSignoff=Awaiting final exported gallery review`, `missingRequiredArt=[]`. `missingRequiredArt=[]` chỉ nói gói art, không nói game đủ dependency.

Dependency còn thiếu: checkpoint asset để ba dev checkout nhận cùng bytes; đăng ký metadata runtime; content C3 mới/gates; Present plural trigger; dialogue ending/bản sửa; recovery migration; geometry theo sàn vẽ/occlusion; UI code/document/reread; integration và QA build thật. Cultural review C3 chưa có xác nhận, không tự thêm claim lịch sử. Không cần gen asset/audio mới để bắt đầu sau M0.

## 3. Checkpoint đề nghị — chưa commit, chưa cập nhật worktree

| Checkpoint | Phạm vi chính xác dự kiến | Điều kiện |
| --- | --- | --- |
| A — c3-art-production-v1 | 51 production PNG mới theo manifest; `assets/areas/chapter-3/` gồm manifest, raw source/review, production gallery/preview/provenance; `docs/07-game/10-c3-asset-handoff.md`, `c3-asset-export-evidence.md`; ba script C3 | Review allowlist/hash, giữ nguồn; không chạy exporter lại; người dùng cho phép commit |
| B — c3-m0-contract | Ba tài liệu mới `11-c3-leader-plan.md`, `c3-contract.md`, `c3-agent-prompts.md` | Chủ dự án duyệt nội dung M0 và cho phép commit riêng |
| C — c3-runtime-registry | Leader đăng ký chính 51 production assets, metadata/hash/bounds và kiểm audit diff | Chỉ sau phép triển khai; không gộp M0 hoặc đồ nháp |
| D/E/F — Core / UI / QA | Theo ownership và milestones bên dưới | Mỗi candidate có diff/test, phép commit/integrate riêng theo chỉ đạo |

Không stage `git add .`. Exclude README overview, `docs/07-game/c1-independent-review.md`, `graphify-out/`, `src/graphify-out/`, `output/`, `scripts/__pycache__/`, FE scratch và toàn dirty Tester khỏi checkpoint C3. Danh sách allowlist pending ở phụ lục là phạm vi kiểm tra trước commit, không phải lệnh commit đã chạy.

**Đề xuất cập nhật worktree sau phép riêng:** checkpoint A/B trước; Core/FE có thể fast-forward tới main/candidate đã duyệt sau khi kiểm lại status; giữ FE scratch. Tester diverged 14/11 và đang dirty: kiểm lịch sử/diff trước, thống nhất cách nhận checkpoint có chọn lọc trên branch hiện hữu, không merge cả nhánh, không tự reset/stash/rebase dirty files. Nếu cần đụng hai file dirty phải nhờ owner xác nhận phạm vi. Không tạo worktree mới. Hiện chưa có lệnh cập nhật nào được chạy.

## 4. Ownership theo repo thật

Một file chỉ một owner tại một thời điểm. Đổi ownership phải ghi rõ lượt bàn giao trong báo cáo Leader trước sửa; patch đề xuất không đồng nghĩa quyền sửa file người khác.

| Owner | File/module được sửa khi triển khai được phép | Không sở hữu |
| --- | --- | --- |
| Backend/Core | `src/content/chapters/c3.json`; `src/content/schema.ts`, `src/content/index.ts`; `src/core/state.ts`, `invariants.ts`, `commands/journey/`, `commands/studio/`, `history/` và tests `src/core/c3-*.test.ts` | game UI, runtime metadata, package scripts, catalog chung |
| Frontend | `src/game/Game.tsx`, `RoomScene.tsx`, `room-render.ts`, `room-walker.ts`, `character-scale.ts`, `npc-portraits.ts`, `PuzzleModal.tsx`, `Studio.tsx`, `InventoryCombine.tsx`, `store.ts`, `assets.ts`; UI/helper C3 mới, CSS game, tests `src/game/c3-*.test.ts` | c3.json/schema/Core, data registry, package.json, QA suite Tester |
| Tester | `tests/c3-regression.test.ts`, `tests/browser/c3-*.spec.ts`, fixtures C3 mới, `tests/checklist-c3.md`, `tests/c3-geometry-audit.md`, báo cáo và artifact QA C3 | Runtime, expected value để che lỗi, script/package chung |
| Leader | Ba docs M0; `data/runtime-assets.json`, `data/asset-manifest.json`, `data/asset-gaps.json`; `src/content/items.json`, `clues.json`, `culture-cards.json`, `studio.json` (chỉ entry C3); shared registry `src/core/registry.ts`, `src/core/commands/index.ts`, `src/core/index.ts`; `package.json`, Playwright config, scripts audit/validator/check-built/check-core/check-game và asset checkpoint | Không sửa song song các file đã giao Core/FE/Tester |

Core cung cấp exact catalog text patch C3 cho Leader áp; không tự sửa catalog Leader. Shared command registration nếu cần qua Leader; dự kiến chưa thêm command công khai. FE gửi bảng tọa độ/bounds/approach/radius đề nghị cho Core cập nhật c3.json. Schema ownership Core trước và xuyên M1–M3; Leader không thêm enum đồng thời. `Game.tsx` thuộc FE cả khi bật cờ M4: Leader quyết định QA gate, FE áp cờ trong file mình sở hữu. Leader không tự sửa file FE để tích hợp nếu chưa nhận lượt ownership.

`scripts/check-game.ts` dirty ở Tester được giữ nguyên; Tester viết file C3 mới, đề xuất thay script/config cho Leader. Không giải quyết dirty files bằng thay nội dung runtime để test xanh.

## 5. Milestone và gate bàn giao

| Mốc | Phụ thuộc và đầu ra | Tiêu chí qua cổng |
| --- | --- | --- |
| **M0 — contract** | Baseline/inventory/contract/ba prompt để chủ dự án duyệt | Chốt rương atomic, gate matrix, 100 Sen, migration, ownership; dừng tại đây |
| M1 — Core | M0 được duyệt + phép triển khai + checkpoint A/B + worktree baseline thống nhất; Core content/schema/gates/recovery và tests | Negative guards, cả ba puzzle, đủ readings/ending, quyền mặc, migration/idempotency pass; bàn giao API/export thật và patch catalog |
| M2 — ba cảnh/UI | FE có asset checkpoint + registry Leader; đo art có thể thực hiện sau cho phép, nối behavior cần Core M1 | S1 không puzzle; S2 hai vòng/2 giấy; S3 đối chiếu/thoại/style; tọa độ gửi Core áp; desktop/mobile/keyboard/focus; không fake ownership |
| M3 — tích hợp | Core + FE candidate, Tester regression đã viết; Leader review diff và phép tích hợp | Candidate SHA/build riêng, validator/lint/Core/C2/build/assets pass; bộ C3 integration và migration không làm mất C1/C2 |
| M4 — QA/release gate | Tester kiểm candidate M3 cố định | W3 cùng W0/W1/W2 regression, geometry painted-floor + occlusion, 5 viewport×2 motion, touch/keyboard, fresh/migrated/replay, reward delta +100, console/404; báo Safari và signoff nội dung đúng thực tế |

Chỉ sau M4 và duyệt mới gọi C3 playable/bật cờ qua owner FE. C4/C5 không PLAYABLE kể cả status engine được unlock. Publish/push/merge không nằm trong phép M0. Không lấy coverage helper làm coverage app.

Lệnh hiện có cho M3/M4: `npm run test:c2`, `npm run test:c2:layout`, `npm run test:c2:acceptance`, `npm run test:core`, `npm run lint`, `node --import tsx scripts/validate-content.ts`, `npm run build`, `npm run test:assets`. `npm audit` trước commit theo AGENTS; quyền network nếu cần xử lý riêng. `test:c3`/`test:c3:acceptance` là script **đề xuất mới**, chưa có trong package; Leader thêm sau khi suite thật tồn tại. Audit asset hiện ghi data/artifacts dù docstring gọi read-only: không chạy trong M0; khi triển khai Leader phải review diff để không đăng ký mọi draft ngoài scope.

Tester dùng production origin/port riêng được Leader giao, xác nhận checkout/SHA/bundle; không chiếm server dev khác hoặc sửa save người dùng. Fresh full W0→W3 là gate riêng; fixture C2 completed chỉ dùng ca C3 cô lập và phải ghi rõ seed không chứa tiến trình C3. Safari chưa chạy thì ghi chưa chạy, không đổi thành pass. Các blocker C2 cũ được theo dõi riêng, không biến mất nhờ suite C3 pass.

## 6. Trạng thái sau duyệt M0 — 08/10/2026

Chủ dự án đã duyệt contract đích, ownership và milestone, trừ các mục chưa chốt. Các delta schema/API là mục tiêu được phép triển khai, vẫn chưa phải API có thật trước M1 GREEN. Duyệt này không tự cấp quyền Git.

Kiểm lại: main vẫn c6fc47f, manifest và asset/docs mới untracked; cả ba dev worktree giữ nguyên HEAD/status trong bảng baseline. Chưa có SHA checkpoint chung. Core/FE/Tester chưa được bắt đầu sửa runtime trên baseline cũ.

Chủ dự án đã cho phép riêng: commit A asset/handoff/scripts theo allowlist và B ba docs M0, rồi fast-forward Core/Frontend tới B, giữ scratch/ và mọi đồ ngoài scope. Tester diverged/dirty chỉ được khảo sát và trình phương án cập nhật riêng; chưa tự merge/reset/stash. Candidate gameplay chưa có quyền commit/merge mặc định; không push.

Pending không được coi đã duyệt: final exported-gallery signoff còn ghi pending trong manifest; cultural review/claim lịch sử; nghiệm thu Safari/full visual; C2-GEO-009 và wear layer áo phụ C2; cập nhật Tester và commit/merge candidate gameplay chưa cấp phép. Coverage/build/E2E C3 chưa chạy, không đánh dấu PASS.

Ba prompt cuối ở [c3-agent-prompts.md](c3-agent-prompts.md) để chủ dự án paste, Leader không dispatch. Backend bàn giao API thật + tests GREEN trước Frontend nối consumer; Tester chuẩn bị từ đầu sau checkpoint, chạy từng slice và candidate đúng SHA. Bật C3 public PLAYABLE chỉ được đề xuất sau nghiệm thu. Trước E2E menu, Leader/FE phải thống nhất cách truy cập candidate QA cô lập; không dùng debug grant/direct jump để thay tuyến menu sau C2, không tự mở public cờ để chạy test.

Bàn giao cuối phải gồm SHA, changed files, PASS/FAIL/BLOCKED/NOT RUN, coverage logic mới/sửa với phạm vi và lệnh thật, log/report/artifact, lỗi còn lại, production app URL/port gắn đúng checkout và bundle. Không trình URL lịch sử C2 như app C3 đã chạy.

## Phụ lục — snapshot Git và allowlist trước commit

Các status dưới đây đọc lúc khảo sát; ba docs M0 mới được tách riêng. Không thao tác Git mutation.

### Nep-Remix

```text
 M docs/01-overview/README.md
?? assets/accessories/kinh-mat-meo/kinh-mat-meo.png
?? assets/areas/chapter-3/
?? assets/characters/ba-lon/portrait-reflective.png
?? assets/characters/ba-lon/portrait-stern.png
?? assets/characters/ba-lon/portrait-uneasy.png
?? assets/characters/ba-lon/scene-reflective.png
?? assets/characters/ba-lon/scene-stern.png
?? assets/characters/ba-lon/scene-uneasy.png
?? assets/characters/ba-lon/view-front.png
?? assets/characters/ba-mai/portrait-investigate.png
?? assets/characters/ba-mai/portrait-relieved.png
?? assets/characters/ba-mai/portrait-speak.png
?? assets/characters/ba-mai/portrait-tailor.png
?? assets/characters/ba-mai/scene-investigate.png
?? assets/characters/ba-mai/scene-relieved.png
?? assets/characters/ba-mai/scene-speak.png
?? assets/characters/ba-mai/scene-tailor.png
?? assets/characters/ba-mai/view-front.png
?? assets/characters/thay-ba-can/portrait-anxious.png
?? assets/characters/thay-ba-can/portrait-idle.png
?? assets/characters/thay-ba-can/portrait-uneasy.png
?? assets/characters/thay-ba-can/scene-anxious.png
?? assets/characters/thay-ba-can/scene-idle.png
?? assets/characters/thay-ba-can/scene-uneasy.png
?? assets/characters/thay-ba-can/view-front.png
?? assets/characters/vinh/portrait-idle.png
?? assets/characters/vinh/portrait-surprised.png
?? assets/characters/vinh/portrait-witness.png
?? assets/characters/vinh/scene-idle.png
?? assets/characters/vinh/scene-surprised.png
?? assets/characters/vinh/scene-witness.png
?? assets/characters/vinh/view-front.png
?? assets/garments/ao-dai-co-thuyen/ao-dai-co-thuyen.png
?? assets/garments/ao-dai-raglan/ao-dai-raglan.png
?? docs/07-game/10-c3-asset-handoff.md
?? docs/07-game/c1-independent-review.md
?? docs/07-game/c3-asset-export-evidence.md
?? graphify-out/
?? output/
?? scripts/__pycache__/
?? scripts/c3_asset_tools.py
?? scripts/export-c3-assets.py
?? scripts/test_c3_asset_tools.py
?? src/graphify-out/
```

### Nep-Remix-core

```text
(clean)
```

### Nep-Remix-frontend

```text
?? scratch/
```

### Nep-Remix-test

```text
 M scripts/check-game.ts
 M tests/browser/sprint01-integration.spec.ts
?? fix-check-game.cjs
?? fix-syntax.cjs
?? "nh\303\241p"
?? patch-check-game.cjs
?? patch-check-game2.cjs
?? patch-corrupt-save.cjs
?? patch-modal-test.cjs
?? patch-modal-test2.cjs
?? patch-modal-test3.cjs
?? patch-modal-test4.cjs
?? patch-toast-close.cjs
?? patch-toast-test.cjs
?? patch-toast.cjs
?? run_test.ts
```

### Checkpoint A: 51 production PNG mới theo manifest

```text
assets/characters/ba-mai/scene-tailor.png
assets/characters/ba-mai/portrait-tailor.png
assets/characters/ba-mai/scene-investigate.png
assets/characters/ba-mai/portrait-investigate.png
assets/characters/ba-mai/scene-speak.png
assets/characters/ba-mai/portrait-speak.png
assets/characters/ba-mai/scene-relieved.png
assets/characters/ba-mai/portrait-relieved.png
assets/characters/ba-mai/view-front.png
assets/characters/vinh/scene-idle.png
assets/characters/vinh/portrait-idle.png
assets/characters/vinh/scene-surprised.png
assets/characters/vinh/portrait-surprised.png
assets/characters/vinh/scene-witness.png
assets/characters/vinh/portrait-witness.png
assets/characters/vinh/view-front.png
assets/characters/ba-lon/scene-stern.png
assets/characters/ba-lon/portrait-stern.png
assets/characters/ba-lon/scene-uneasy.png
assets/characters/ba-lon/portrait-uneasy.png
assets/characters/ba-lon/scene-reflective.png
assets/characters/ba-lon/portrait-reflective.png
assets/characters/ba-lon/view-front.png
assets/characters/thay-ba-can/scene-idle.png
assets/characters/thay-ba-can/portrait-idle.png
assets/characters/thay-ba-can/scene-anxious.png
assets/characters/thay-ba-can/portrait-anxious.png
assets/characters/thay-ba-can/scene-uneasy.png
assets/characters/thay-ba-can/portrait-uneasy.png
assets/characters/thay-ba-can/view-front.png
assets/areas/chapter-3/c3-s1-tiem-may-da-kao/c3-s1-tiem-may-da-kao--phai.png
assets/areas/chapter-3/c3-s2-phong-phong-thuy/c3-s2-phong-phong-thuy--phai.png
assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/c3-s3-dinh-thu-doi-dau--phai.png
assets/garments/ao-dai-raglan/ao-dai-raglan.png
assets/garments/ao-dai-co-thuyen/ao-dai-co-thuyen.png
assets/accessories/kinh-mat-meo/kinh-mat-meo.png
assets/areas/chapter-3/doc-c3-bien-nhan.png
assets/areas/chapter-3/doc-c3-so-goc.png
assets/areas/chapter-3/doc-c3-thu-thoa-thuan.png
assets/areas/chapter-3/doc-c3-ban-sua.png
assets/areas/chapter-3/c3-s1-tiem-may-da-kao/c3-s1-tiem-may-da-kao--bien-nhan.png
assets/areas/chapter-3/c3-s1-tiem-may-da-kao/c3-s1-tiem-may-da-kao--giay-doi-chieu.png
assets/areas/chapter-3/c3-s2-phong-phong-thuy/c3-s2-phong-phong-thuy--so-goc.png
assets/areas/chapter-3/c3-s2-phong-phong-thuy/c3-s2-phong-phong-thuy--thu-thoa-thuan.png
assets/areas/chapter-3/c3-s2-phong-phong-thuy/c3-s2-phong-phong-thuy--ghi-chu-khoa.png
assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/c3-s3-dinh-thu-doi-dau--ho-so-goc.png
assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/c3-s3-dinh-thu-doi-dau--thu-doi-chieu.png
assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/c3-s3-dinh-thu-doi-dau--ban-sua.png
assets/areas/chapter-3/c3-s2-phong-phong-thuy/c3-s2-phong-phong-thuy--ruong-mo.png
assets/areas/chapter-3/c3-s2-phong-phong-thuy/c3-s2-phong-phong-thuy--ruong-rong.png
assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/cg-c3-mai-tu-len-tieng.png
```

### Checkpoint A: manifest, nguồn, gallery và preview ngoài runtime

Các file dưới đây giữ provenance; không đăng ký `_raw` vào runtime.

```text
assets/areas/chapter-3/README.md
assets/areas/chapter-3/_raw/production-v1/chest-preview-ruong-mo.png
assets/areas/chapter-3/_raw/production-v1/chest-preview-ruong-rong.png
assets/areas/chapter-3/_raw/production-v1/fitting-ao-dai-co-thuyen.png
assets/areas/chapter-3/_raw/production-v1/fitting-ao-dai-raglan.png
assets/areas/chapter-3/_raw/production-v1/gallery.html
assets/areas/chapter-3/_raw/production-v1/manifest.json
assets/areas/chapter-3/_raw/production-v1/scene-preview-1.png
assets/areas/chapter-3/_raw/production-v1/scene-preview-2.png
assets/areas/chapter-3/_raw/production-v1/scene-preview-3.png
assets/areas/chapter-3/_raw/review-v1/ba-lon-v2.png
assets/areas/chapter-3/_raw/review-v1/ba-lon.png
assets/areas/chapter-3/_raw/review-v1/boat-neck.png
assets/areas/chapter-3/_raw/review-v1/c3-s1.png
assets/areas/chapter-3/_raw/review-v1/c3-s2.png
assets/areas/chapter-3/_raw/review-v1/c3-s3.png
assets/areas/chapter-3/_raw/review-v1/cat-eye.png
assets/areas/chapter-3/_raw/review-v1/chest-empty.png
assets/areas/chapter-3/_raw/review-v1/chest-open.png
assets/areas/chapter-3/_raw/review-v1/documents.png
assets/areas/chapter-3/_raw/review-v1/gallery.html
assets/areas/chapter-3/_raw/review-v1/mai-expressions-v0.png
assets/areas/chapter-3/_raw/review-v1/mai-expressions-v2.png
assets/areas/chapter-3/_raw/review-v1/mai-expressions.png
assets/areas/chapter-3/_raw/review-v1/mai-work-v2.png
assets/areas/chapter-3/_raw/review-v1/mai-work.png
assets/areas/chapter-3/_raw/review-v1/manifest.json
assets/areas/chapter-3/_raw/review-v1/prompts.json
assets/areas/chapter-3/_raw/review-v1/raglan.png
assets/areas/chapter-3/_raw/review-v1/thay-ba-can-v2.png
assets/areas/chapter-3/_raw/review-v1/thay-ba-can.png
assets/areas/chapter-3/_raw/review-v1/vinh.png
assets/areas/chapter-3/manifest.json
```

Ngoài danh sách trên, checkpoint A gồm đúng `docs/07-game/10-c3-asset-handoff.md`, `docs/07-game/c3-asset-export-evidence.md`, `scripts/c3_asset_tools.py`, `scripts/export-c3-assets.py`, `scripts/test_c3_asset_tools.py`. Tám reuse đã tracked không cần stage lại. Các thư mục output/graph/cache/nháp không thuộc allowlist.

## Checkpoint A/B được phép — 08/10/2026

Checkpoint A đã tạo: `f87f7fdf89ac609b1a1746c84a471494d67176fd` — 89 file đúng allowlist (51 production PNG mới, 33 file metadata/provenance/gallery/preview, 2 docs handoff/evidence, 3 scripts). Tất cả 59 production paths/hash khớp; asset tests 23/23 PASS, helper coverage 58/58; npm audit 0 vulnerabilities. Checkpoint B là commit chứa ba docs M0 này ngay sau A; dùng SHA B Leader công bố khi fast-forward, không dùng SHA baseline c6fc47f hoặc SHA A thiếu contract.

Core/Frontend được phép fast-forward-only tới B sau khi kiểm status; không mang scratch vào commit. Các HEAD/status ở mục baseline là snapshot lịch sử trước cập nhật, không phải kết quả cập nhật mới. Bằng chứng sau cập nhật phải xác nhận cùng SHA B và 59/59 hashes ở từng worktree.

Tester: khảo sát merge-tree main/agent/tester cho thấy add/add conflict tại tests/browser/c2-geometry.spec.ts. Đây là thử tính merge, không merge branch/worktree. Không merge toàn lịch sử Tester vào main hoặc ngược lại tự động. Phương án xin phép riêng ưu tiên: tạo branch mới agent/tester-c3 từ B ngay trong worktree Tester hiện hữu, giữ branch agent/tester ở f0ba800 và giữ byte-for-byte hai tracked dirty files/các nháp. Chỉ chuyển branch nếu Git cho phép giữ nguyên dirty files; nếu bị chặn thì dừng, không stash/reset/force. Cần review hai tracked dirty files với owner trước khi dùng chúng làm test evidence; suite C3 mới không được sửa các file đó. Phương án này chưa được cho phép, chưa thực hiện.

Không mở app/gameplay hoặc chạy E2E trong checkpoint docs/art này. Runtime tests/build/E2E C3: NOT RUN; C3 chưa playable. Hook post-commit graphify sẵn có tự chạy khi commit, không đăng ký output graph vào checkpoint.
