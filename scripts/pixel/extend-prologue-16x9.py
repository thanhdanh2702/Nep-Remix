"""Extend every 800x500 prologue image to 890x500 (16:9) by drawing a 45 px band on each side with code.

The original image is placed at x=45. Each band continues the room from the image's own edge columns:
per-row colour (3x7 median of the edge, snapped to the image's palette), a shadow that darkens toward the
outer edge (Bayer-dithered between palette colours), and a wooden pillar with a corbel and a plinth at the
outer rim. Every colour written comes from the source image's palette; no model-generated pixels.

Overlay images (transparent edge columns) only get transparent bands, so they keep registering with the
background. Images that are not 800x500 (doc cards 400x250, hotspot cutouts, vfx) are skipped, which also
makes re-running safe.

Usage: python scripts/pixel/extend-prologue-16x9.py [--preview DIR]
  --preview DIR  writes seam crops (200x500 around each seam, x2) of the --phai backgrounds to DIR.
Files are overwritten in place (the 800x500 originals stay in git history).
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
AREAS = ROOT / 'assets/areas/prologue'
SRC_W, SRC_H, BAND = 800, 500, 45
PILLAR = 14  # outer pillar width in px
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5


def palette_of(rgb):
    return np.unique(rgb.reshape(-1, 3), axis=0).astype(np.int32)


def snap(colors, pal):
    """Nearest palette colour for each row of `colors` (N,3)."""
    d = ((colors[:, None, :].astype(np.int32) - pal[None, :, :]) ** 2).sum(axis=2)
    return pal[d.argmin(axis=1)]


def edge_colors(rgb, side, pal, radius):
    """Per-row colour at the seam: median of the 3 edge columns over +-radius rows, snapped to the palette."""
    cols = rgb[:, -3:, :] if side == 'right' else rgb[:, :3, :]
    padded = np.pad(cols, ((radius, radius), (0, 0), (0, 0)), mode='edge')
    stack = np.stack([padded[i:i + SRC_H] for i in range(2 * radius + 1)], axis=1)  # (H, 2r+1, 3, 3)
    return snap(np.median(stack.reshape(SRC_H, -1, 3), axis=1), pal)


def wood_tones(pal):
    """Pillar colours picked from the image's own palette: shadow, dark, mid, light."""
    targets = [(24, 14, 8), (58, 34, 18), (96, 58, 30), (150, 96, 50)]
    return [tuple(int(v) for v in snap(np.array([t]), pal)[0]) for t in targets]


def hash2(a, b):
    return ((a * 73856093) ^ (b * 19349663)) & 0xFFFF


def band(rgb, side, pal):
    """Band as (H, BAND, 3) with column 0 touching the seam, then flipped for the left side by the caller."""
    # Details blur into the wall/floor tone the further they run from the seam (vertical window grows with d).
    edges = {r: edge_colors(rgb, side, pal, r) for r in {2 + d // 2 for d in range(BAND)}}
    out = np.zeros((SRC_H, BAND, 3), np.uint8)
    ys = np.arange(SRC_H)
    for d in range(BAND):
        edge = edges[2 + d // 2]
        dark = 0.0 if d < 3 else min(0.5, 0.5 * ((d - 3) / (BAND - PILLAR - 3)) ** 1.4)
        dark = np.clip(dark + BAYER[ys % 4, d % 4] * 0.12 * (dark > 0), 0, 0.75)
        target = (edge * (1 - dark[:, None])).astype(np.int32)
        out[:, d] = snap(target, pal)
    shadow, dark_w, mid, light = wood_tones(pal)
    corbel = 30  # corbel rows at the top: the pillar widens by 5 px inward in two steps
    plinth_y = SRC_H - 26
    for y in range(SRC_H):
        width = PILLAR + (5 if y < 14 else 3 if y < corbel else 0)
        if y >= plinth_y:
            width = PILLAR + 3
        for k in range(width):  # k = distance from the outer rim
            d = BAND - 1 - k
            if k == 0 or k == width - 1:
                c = shadow  # outline
            elif k == 1:
                c = dark_w
            elif k >= width - 3:
                c = light if k == width - 2 else mid  # lit face towards the room
            else:
                grain = hash2(k, y // 7)
                c = dark_w if grain % 5 == 0 else light if grain % 11 == 0 else mid
            if y == 14 or y == corbel or y == plinth_y:
                c = shadow  # corbel / plinth step lines
            elif y > plinth_y and k == 2:
                c = dark_w
            out[y, d] = c
    # soft contact shadow of the pillar on the wall/floor: 3 columns, dithered toward the dark wood
    for d in range(BAND - PILLAR - 3 - 3, BAND - PILLAR - 3):
        for y in range(SRC_H):
            if BAYER[y % 4, d % 4] > -0.1 + 0.18 * (BAND - PILLAR - 3 - d - 1):
                out[y, d] = snap(np.array([(out[y, d].astype(np.int32) * 0.55).astype(np.int32)]), pal)[0]
    return out


def extend(path: Path):
    img = Image.open(path).convert('RGBA')
    if img.size != (SRC_W, SRC_H):
        return False
    arr = np.array(img)
    out = np.zeros((SRC_H, SRC_W + 2 * BAND, 4), np.uint8)
    out[:, BAND:BAND + SRC_W] = arr
    if arr[:, 0, 3].max() == 0 and arr[:, -1, 3].max() == 0:  # overlay: transparent bands
        Image.fromarray(out, 'RGBA').save(path)
        return True
    rgb = arr[:, :, :3]
    pal = palette_of(rgb)
    out[:, BAND + SRC_W:, :3] = band(rgb, 'right', pal)
    out[:, :BAND, :3] = band(rgb, 'left', pal)[:, ::-1]
    out[:, :BAND, 3] = 255
    out[:, BAND + SRC_W:, 3] = 255
    Image.fromarray(out, 'RGBA').save(path)
    return True


def preview(path: Path, folder: Path):
    img = Image.open(path).convert('RGB')
    for name, x0 in (('left', 0), ('right', img.width - 200)):
        crop = img.crop((x0, 0, x0 + 200, SRC_H)).resize((400, 1000), Image.Resampling.NEAREST)
        crop.save(folder / f'{path.stem}-seam-{name}.png', optimize=True)


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--preview', type=Path, help='directory for seam crops of the --phai backgrounds')
    args = p.parse_args()
    done = [path for path in sorted(AREAS.rglob('*.png')) if extend(path)]
    for path in done:
        print(f'extended {path.relative_to(ROOT).as_posix()} -> {SRC_W + 2 * BAND}x{SRC_H}')
    print(f'{len(done)} images extended; next: build-hotspot-cutouts.py then npm run audit:assets')
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
        for path in sorted(AREAS.rglob('*--phai.png')):
            preview(path, args.preview)


if __name__ == '__main__':
    main()
