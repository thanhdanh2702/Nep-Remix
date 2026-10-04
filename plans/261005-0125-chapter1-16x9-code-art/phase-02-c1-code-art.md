# Phase 02 — c1-code-art

## Context Links
- Plan: ./plan.md · Pipeline: `../../../reports/Claude vẽ pixel UI bằng code.md` (mục "Bộ khung", "Validator", "preview 224–336px")

## Overview
- Priority: high · Status: pending · Est. effort: 5–6 h · Depends on: 01

## Key Insights
- (05/10, sau phase 01) Art prologue rất chi tiết, hiển thị ~1.9× ở 1920 px; nền c1 phải 640×360 để mật độ pixel gần prologue (320×180 sẽ thô gấp ~5×). Dùng nhiều lớp texture procedural (vân gỗ, gạch, dither ánh sáng, bóng đổ) để không phẳng.
- `drawRoom` đang bật smoothing → phải tắt cho nền pixel-art c1.
- c1 có 3 phòng (`c1.json`): **s1** `c1-s1-buong-det-khoa-kin` "Gian buồng dệt khóa then" (khung cửi + con thoi, giá thắt lưng lụa, bát cháo nguội, cửa trước khóa, cửa sổ sau); **s2** `c1-s2-ban-tho-nha-tho-ho` "Gian nhà thờ họ Bùi" (hoành phi tiết hạnh, lư hương, bàn thờ tổ); **s3** `c1-s3-cong-dinh-doi-dau` "Cổng đình làng Vạn Phúc" (các chức sắc, Ông Lệ, bậc đá, cụ Cầm, lối ra cổng). Bối cảnh 1888, làng lụa Vạn Phúc.
- Art cũ 4:3 320×240 (s1, s2) + sprite hitbox: bỏ (không dùng, không còn tham chiếu).
- Palette có sẵn: `src/ui/pixel-art.ts` (6 màu UI), `tokens.css` (gỗ `#402036/#291021`, sen `#d986a7`…), `scripts/process-ai-asset.py` `UI_PALETTE` + `GARMENT_PALETTE` (nâu gỗ `6B4423`, chàm `1E2A38/2D3E50`, son `B83A24`, vàng `CFA449`, men lam `2D6A5D`, giấy `F5EFEB`).
- Engine (phase 01) lấy world từ kích thước nền → nền c1 640×360 (16:9), stage scale nguyên lần bằng CSS `image-rendering: pixelated`.

## Requirements
- **Pipeline tối giản** (theo brainstorm): `Nep-Remix/assets/palettes/ui.json` + `garment.json` (Lospec format, lấy từ palette hiện có); `scripts/pixel/pixel-grid.py` — validate char-grid (`rows` đúng `w`/`h`, ký tự ∈ legend, hex ∈ palette; ≤ 5 dòng output, exit 1 khi lỗi) + render PNG 1× + `--preview N` (nearest-neighbor) + `--svg`. Dùng cho chi tiết nhỏ (đồ vật, hoa văn) đặt trong `assets/src/pixel/c1/*.grid.json`.
- **Nền phòng procedural:** `scripts/pixel/draw-c1-rooms.py` — mỗi phòng một hàm vẽ bằng Pillow ở 640×360 với palette khóa (≤ 24 màu/phòng): tường/sàn theo ramp, phối cảnh 1 điểm đơn giản, ánh sáng hướng cố định, outline tối cho vật tương tác; dán sprite char-grid cho vật nhỏ. Xuất `assets/areas/chapter-1/<area>/<area>--phai.png` (+ `--trai` = bản lật ngang nếu engine cần; engine mặc định `phai`).
- Vị trí vật tương tác trong art phải khớp ô đề xuất (để phase 03 đo rect): script in ra JSON bbox chuẩn hóa 0..1 của từng vật → `assets/areas/chapter-1/<area>/layout.json` (nguồn sự thật cho rect ở phase 03).
- Xóa art 4:3 cũ + sprite hitbox cũ của chapter-1; cập nhật `assets/areas/chapter-1/README.md`.
- `npm run audit:assets`.
- Skill ngắn `.claude/skills/pixel-draw/SKILL.md` (~60 dòng, `disable-model-invocation: true`) ghi quy trình: palette → grid/procedural → `pixel-grid.py` validate → preview → tối đa 3 vòng — để các lần vẽ sau tiết kiệm context. (Đặt ở `D:/ao-dai/Nep-Remix/.claude/skills/`.)

## Related Code Files
**Create:** `assets/palettes/ui.json`, `assets/palettes/garment.json`, `scripts/pixel/pixel-grid.py`, `scripts/pixel/draw-c1-rooms.py`, `assets/src/pixel/c1/*.grid.json`, `assets/areas/chapter-1/<3 areas>/*--phai.png`, `assets/areas/chapter-1/<3 areas>/layout.json`, `.claude/skills/pixel-draw/SKILL.md`
**Modify:** `assets/areas/chapter-1/README.md`, `data/runtime-assets.json` (generated), `src/content/chapters/c1.json` (CHỈ `logicalSize` → 640×360), `src/game/room-render.ts` (CHỈ tắt image smoothing khi vẽ nền phòng pixel-art c1 — prologue giữ nguyên)
**Delete:** `assets/areas/chapter-1/**/bg-mat-*` và sprite hitbox 4:3 cũ (không còn dùng)

## Implementation Steps
1. Palette JSON + `pixel-grid.py` (+ tự test: 1 grid lỗi độ dài → exit 1).
2. Char-grid vật nhỏ (con thoi, bát cháo, lư hương, hoành phi, …) ≤ 32 px.
3. `draw-c1-rooms.py` 3 phòng; preview ×3 mỗi phòng (960×540, ~690 visual token) — xem, sửa tối đa 3 vòng/phòng.
4. Xuất PNG + layout.json; xóa art cũ; README; audit:assets.
5. test:assets pass.

## Todo List
- [ ] palettes + pixel-grid.py
- [ ] grid vật nhỏ
- [ ] draw-c1-rooms.py 3 phòng + preview duyệt
- [ ] layout.json
- [ ] xóa art cũ + README
- [ ] audit:assets + test:assets
- [ ] SKILL.md pixel-draw

## Success Criteria
- 3 PNG 640×360, ≤ 24 màu mỗi ảnh (script kiểm), không pixel bán trong suốt.
- `layout.json` có bbox cho mọi interactable id của `c1.json`.
- `python scripts/pixel/pixel-grid.py <grid lỗi>` exit 1 với thông báo hàng sai.

## Risk Assessment
- Phòng đọc không ra vật → outline tối + tương phản; người xem preview duyệt.
- Không tốn token preview quá mức: chỉ Read preview đã crop/scale ≤ 960 px.

## Next Steps
Phase 03 dùng `layout.json` để đặt rect.
