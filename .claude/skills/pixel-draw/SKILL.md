---
name: pixel-draw
description: Draw Nep-Remix pixel art by code (char-grid sprites and procedural Pillow room backgrounds). Use only when asked to draw or redraw a pixel asset.
disable-model-invocation: true
argument-hint: "<asset-id | room: s1|s2|s3>"
---

# pixel-draw

Pixel art here is written by code, never by an image model. Source files are the truth; PNGs are build output.

## Pick the format
- Prop / icon / ornament <= ~32 px per side: char-grid in `assets/src/pixel/<family>/<id>.grid.json`.
- Room background or any big scene: procedural Pillow in `scripts/pixel/draw-c1-rooms.py` (Chapter 1: 640x360).
- Never write a big image as a grid (too many characters, row-length errors).

## Steps
1. **Palette first.** Read `assets/palettes/ui.json` + `garment.json`. Grid legends may only use those hex values.
   Room ramps live in `RAMPS` at the top of `draw-c1-rooms.py` (anchored on the same palettes); <= 32 colours per room.
2. **Grid sprite.** Copy an existing grid in `assets/src/pixel/c1/` as the template. Fields: `id, w, h, palette, mirror
   ("x" = rows hold only the left half), legend, rows`. Silhouette in the darkest colour, then fill, then 2-3 tone shading.
3. **Validate (run, do not eyeball).** `python scripts/pixel/pixel-grid.py <file> [--preview 12]` prints <= 5 lines and exits 1
   on a wrong row count/length, a char missing from the legend, or a hex outside the palette. Fix the row it names, repeat.
4. **Room.** Add or edit the `draw_sN()` function: shell (`floor_tiles`, `back_wall`, `side_walls`, `beam_ceiling`) then props
   with `cv.begin()` ... `cv.end('<interactable id>')` (auto dark outline + bbox for `layout.json`), `cv.ao()` contact shadow,
   `cast_shadow()` to the lower left, `floor_light()` sun patch, `cv.vignette()` last. Light always comes from the upper right.
5. **Render.** `python scripts/pixel/draw-c1-rooms.py [s1|s2|s3] --preview <scratch dir>` writes the PNG, `layout.json`
   (normalised bbox per interactable id + exit arrows; exits non-zero if an id in `src/content/chapters/c1.json` is missing)
   and an x2 preview (1280 px wide).
6. **Look once.** Read only the x2 preview. Judge composition first (readable props, standing room for NPCs, light direction),
   then texture. At most 3 rounds per room; if the silhouette is wrong, rewrite the function instead of patching.
7. **Finish.** `npm run audit:assets` (updates `data/runtime-assets.json`), then `npm run lint && npm run test:core`.

## Rules
- Lighting = ramp shift (+1/-1) through Bayer dither (`cv.shade`), never new colours.
- Interactable objects get a dark outline (`cv.end(id)`) and clear contrast with their background.
- No readable text on boards or scrolls: use `glyph_column()` brush marks (the UI overlays real text).
- Keep NPC standing room empty (NPC sprites are drawn by the game); record it in `cv.boxes` by hand.
- Do not edit PNGs or `layout.json` by hand; rerun the script.
- Report one line per asset: `OK <id> <w>x<h> colors=<n>/<max> preview=<path>`.
