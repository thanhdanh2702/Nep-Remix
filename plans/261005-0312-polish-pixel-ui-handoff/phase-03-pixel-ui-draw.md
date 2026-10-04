# Phase 03 — pixel-ui-draw

## Overview
Priority: medium · Status: completed · Est. 3–4 h · Depends on: 02

## Key Insights
- Dialogue box hiện là CSS (`src/game/standing-dialogue.css`); khung 9-slice dùng qua `src/game/Slice.tsx` (`border-image`). Icon code-drawn có sẵn ở `src/ui/pixel-art.ts` (char-grid) và `src/welcome/PixelIcon.tsx` (SVG crispEdges).
- Motif: `assets/motifs/` chỉ có README (3 folder). Spec cũ nói nút/form/tab giữ CSS.
- Pipeline có sẵn: `scripts/pixel/pixel-grid.py`, `assets/palettes/*.json`, skill `.claude/skills/pixel-draw/SKILL.md` (đọc skill trước, theo đúng quy trình).

## Requirements (tất cả vẽ bằng char-grid, palette khóa)
- Khung hội thoại 9-slice (góc hoa sen / mây, 12–16 px slice) → áp cho hộp thoại đứng (`standing-dialogue.css`) bằng `border-image`, giữ nguyên layout + test.
- Icon HUD 16×16 (render ×2/×3 theo pixel-scale): túi đồ, sổ manh mối, bản đồ, Soi, Sen Ngọc (nếu chưa có bản pixel), cài đặt — dùng ở nút HUD tương ứng (thêm `<img>`/background cạnh chữ, không bỏ chữ — test dùng tên nút).
- 3 motif (theo tên folder trong `assets/motifs/`) dạng tile lặp 16–32 px → dùng làm dải trang trí header modal/thẻ bảo tàng (1 chỗ là đủ).
- Mỗi asset: `assets/src/pixel/ui/*.grid.json` → `pixel-grid.py` validate → render PNG vào `assets/ui-pixel/` (hoặc thư mục hợp lý) → preview, tối đa 2 vòng.

## Related Code Files
Create: `assets/src/pixel/ui/*.grid.json`, PNG output, có thể `src/ui/pixel-icons.css`. Modify: `src/game/standing-dialogue.css`, component HUD chứa các nút trên (tìm bằng grep — chỉ thêm icon), `data/runtime-assets.json` (generated).

## Todo
- [x] khung thoại 9-slice
- [x] 6 icon HUD
- [x] 3 motif + 1 chỗ dùng
- [x] audit:assets, lint, build, full test:browser, test:assets

## Success Criteria
Full `test:browser` pass; screenshot hộp thoại + HUD 1920×1080 và 844×390 sắc nét, icon đọc được.
