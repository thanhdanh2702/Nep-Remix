---
title: an-unit-design-system
status: pending
mode: hard
scope: hold
priority: critical
effort: 2 days
created: 2026-10-05
blockedBy: []
blocks: []
---

# Design system lấy An làm đơn vị chuẩn

Spec cũ (khung 64×96, lưới 800×500) không khớp với nhân vật chính An (khung 176×416, dáng chibi 389 px), nên UI và nhân vật lệch tỉ lệ và lệch mật độ pixel. Các việc đã làm ngày 05/10:
- Đã xóa 90 asset nhân vật 64×96 và 5 overlay hỏng.
- 9 ảnh screens đã quay về bản gen gốc.
- Code đã có fallback.

Plan này viết lại toàn bộ spec theo An, đưa tỉ lệ vào code, chụp và căn từng màn, rồi commit và push.

## Goal
- Mọi docs và data có thông số đều nói cùng một spec: đơn vị An.
- Một helper quyết định kích thước mọi nhân vật trên mọi màn.
- An đứng trong phòng truyện và đi tới vật được bấm.
- Bảo tàng có Sổ tay "Nhân vật" và "Kỷ vật".
- Có bộ ảnh chụp từng màn sau khi căn tỉ lệ.
- Đã push lên `origin/main`.

## Non-goals
- Không gen ảnh mới (công cụ gen chưa chốt). Chỉ viết danh sách và bộ prompt.
- Không sửa hay vẽ lại background. Không đụng file ảnh screens, items, motifs, ui-pixel.
- Không làm frame đi bộ cho từng áo. Ở Sảnh, An đi bộ với bộ trang phục gốc.
- Không làm chương 2–5.

## Đơn vị An (dùng chung cho mọi phase)
- **Khung nhân vật:** 176×416 mỗi frame, điểm chân (88,400), dáng cao 380–392 px. Tỉ lệ chibi, đầu và tóc khoảng 1/3 chiều cao. Vẽ chi tiết 1:1, khử răng cưa mềm, nền trong suốt, xuất đủ canvas.
- **NPC:** `view-front/left/right/back.png`, mỗi file 176×416.
- **Mèo:** khung 128×128, mèo cao khoảng 100 px.
- **Áo và phụ kiện:** dải 528×416 gồm 3 ô theo thứ tự front, side (trái), back. Áo vẽ thang xám theo độ sáng và được tô màu bằng gradient-map 4 màu của palette.
- **`humanHeight`** (chiều cao An / chiều cao nền), số khởi điểm:

  | Cảnh | `humanHeight` |
  |---|---|
  | Mở đầu `c0-*` | 0,38 ở sàn sau → 0,50 ở mép trước |
  | Chương 1 `c1-*` | 0,42 |
  | Sảnh `garden-user` | 0,15 |
  | Phòng phối đồ, Tủ đồ, Xưởng may | đo ở phase 06 |

- **Background, screens, icon UI:** ghi đúng kích thước thật của file đang có, không bắt resize.

## Phases
| # | Name | Status | Depends on | Owner |
|---|------|--------|------------|-------|
| 01 | assets-spec-docs | pending | — | docs-manager |
| 02 | project-spec-docs | pending | — | docs-manager |
| 03 | character-scale-and-layers | pending | — | developer |
| 04 | room-an-walk-npc-facing | pending | 03 | developer |
| 05 | museum-codex | pending | — | developer |
| 06 | qa-screenshot-tune | pending | 03, 04, 05 | tester |
| 07 | commit-push | pending | 01–06 | git-manager |

Có thể chạy song song: 01, 02, 03 và 05. 04 chạy sau 03. 06 chạy sau toàn bộ phần code. 07 chạy cuối cùng.

## Dependencies
- Dev server ở `:3000` và Playwright (Chrome) để chụp màn.
- Không cần API key.

## Risks & mitigations
- **Đi bộ trong phòng che mất vật bấm:** An đứng cạnh vật, không đứng đè lên vùng bấm. Vẽ An dưới lớp highlight.
- **Lệch số giữa docs và code:** phase 06 đối chiếu các số `humanHeight` cuối cùng vào `assets/README.md`. Đây là ngoại lệ có chủ đích: chỉ sửa đúng một bảng, chạy sau phase 01.
- **Test cũ gắn với spec 64×96:** sửa test theo hành vi mới, không xóa test.

## Rollback
Mỗi phase là một commit riêng. Hoàn tác bằng `git revert <sha>`. Asset đã xóa vẫn còn trong lịch sử git, ở commit trước khi xóa.

## Validation Log
- 2026-10-05 user: An là chuẩn; giữ nguyên background; screens dùng bản gen gốc; xóa asset nhân vật lệch tỉ lệ và overlay hỏng; làm Sổ tay; NPC xoay hướng; người chơi đi tới vật được bấm; công cụ gen để sau; tự quyết, không hỏi lại; commit và push docs lên repo.
