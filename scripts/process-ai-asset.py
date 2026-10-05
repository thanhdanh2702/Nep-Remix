"""Post-process an AI-generated image (flat #00FF00 background) into a game-ready PNG.

Pipeline: chroma-key -> edge despill/erode -> autocrop -> fit to target frame ->
(pixel kinds only) median-cell downscale + palette quantize -> hard alpha (0/255).

Kinds: garment-an (176x416 cell, feet anchor y=400), portrait (128x128), icon (48x48),
background (cover-crop, opaque, no key). Needs Pillow; numpy is optional (median-cell
downscale falls back to a box average without it).
After writing, run `npm run audit:assets` to refresh data/runtime-assets.json.
"""
import argparse
import sys
import warnings
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageStat

# Design spec §2.1 (UI) + §2.4 (heritage garment) palettes.
UI_PALETTE = ['D986A7', 'F4CAD7', 'FFF1DF', 'FFF8EE', '2B2035', '74506E', 'E9B66B', 'A72D60', '8D234F', '711B40', '855064']
GARMENT_PALETTE = ['6B4423', '1E2A38', '2D3E50', 'B83A24', 'CFA449', '2D6A5D', 'F5EFEB']
KINDS = {'garment-an': (176, 416), 'portrait': (128, 128), 'icon': (48, 48), 'background': (540, 960)}
PIXEL_KINDS = {'portrait', 'icon'}
CELL = 4  # source pixels per target pixel for the median-cell step


def hex_to_rgb(value):
    value = value.strip().lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def key_green(rgb, erode):
    """Return (rgb, alpha): hue 65-150 deg, sat>=0.35, val>=0.25 is background; edge despill."""
    h, s, v = rgb.convert('HSV').split()
    mask = ImageChops.multiply(h.point(lambda x: 255 if 46 <= x <= 106 else 0),
                               ImageChops.multiply(s.point(lambda x: 255 if x >= 90 else 0),
                                                   v.point(lambda x: 255 if x >= 64 else 0)))
    alpha = ImageOps.invert(mask)
    # Despill only the band next to transparency (keeps genuinely green fabric intact).
    band = ImageChops.subtract(alpha, alpha.filter(ImageFilter.MinFilter(5)))
    r, g, b = rgb.split()
    spill = Image.merge('RGB', (r, ImageChops.darker(g, ImageChops.lighter(r, b)), b))
    rgb = Image.composite(spill, rgb, band)
    if erode > 0:
        alpha = alpha.filter(ImageFilter.MinFilter(2 * erode + 1))
    return rgb, alpha


def median_downscale(img, size):
    """Downscale RGBA to `size` taking the median of each CELLxCELL block (pixel-art grid)."""
    big = img.resize((size[0] * CELL, size[1] * CELL), Image.Resampling.LANCZOS)
    try:
        import numpy as np
    except ImportError:
        return big.resize(size, Image.Resampling.BOX)
    a = np.asarray(big)
    h, w = size[1], size[0]
    cells = a.reshape(h, CELL, w, CELL, 4).transpose(0, 2, 1, 3, 4).reshape(h, w, CELL * CELL, 4)
    solid = cells[..., 3] >= 128
    colors = np.where(solid[..., None], cells[..., :3].astype('float32'), np.nan)  # median over opaque px only
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)  # all-transparent cells -> NaN -> 0
        med = np.nan_to_num(np.nanmedian(colors, axis=2))
    alpha = np.where(solid.mean(axis=2) >= 0.5, 255, 0)
    return Image.fromarray(np.dstack([med, alpha]).astype('uint8'), 'RGBA')


def quantize(img, colors, palette, snap):
    """Reduce opaque pixels to <= `colors` colors, snapping near ones to the palette."""
    alpha = img.getchannel('A')
    if not alpha.getbbox():
        return img
    mean = tuple(int(c) for c in ImageStat.Stat(img.convert('RGB'), mask=alpha.point(lambda x: 255 if x else 0)).mean)
    rgb = Image.composite(img.convert('RGB'), Image.new('RGB', img.size, mean), alpha)
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = q.getpalette()[:colors * 3]
    entries = [tuple(pal[i:i + 3]) for i in range(0, len(pal), 3)]
    if snap > 0:
        def nearest(c):
            best = min(palette, key=lambda p: sum((x - y) ** 2 for x, y in zip(c, p)))
            return best if sum((x - y) ** 2 for x, y in zip(c, best)) <= snap ** 2 else c
        entries = [nearest(c) for c in entries]
    data = bytearray()
    for i, a in zip(q.tobytes(), alpha.tobytes()):
        data += bytes((*entries[i], 255)) if a else bytes(4)
    return Image.frombytes('RGBA', img.size, bytes(data))


def fit_scale(src, box):
    return min(box[0] / src.width, box[1] / src.height)


def process(src, kind, size, args):
    palette = [hex_to_rgb(c) for c in (args.palette.split(',') if args.palette else UI_PALETTE + GARMENT_PALETTE)]
    rgb = src.convert('RGB')
    if kind == 'background':
        scale = max(size[0] / rgb.width, size[1] / rgb.height)
        resized = rgb.resize((max(size[0], round(rgb.width * scale)), max(size[1], round(rgb.height * scale))), Image.Resampling.LANCZOS)
        left, top = (resized.width - size[0]) // 2, (resized.height - size[1]) // 2
        return resized.crop((left, top, left + size[0], top + size[1])).convert('RGBA')
    rgb, alpha = key_green(rgb, args.erode)
    rgba = rgb.convert('RGBA')
    rgba.putalpha(alpha)
    box = rgba.getchannel('A').getbbox()
    if box is None:
        sys.exit('error: nothing left after chroma-key (is the background #00FF00?)')
    rgba = rgba.crop(box)
    canvas = Image.new('RGBA', size)
    if kind == 'garment-an':
        scale = fit_scale(rgba, (size[0], args.target_h))
        fitted = rgba.resize((max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale))), Image.Resampling.LANCZOS)
        pos = ((size[0] - fitted.width) // 2, args.anchor_y - fitted.height)
        if pos[1] < 0:
            sys.exit(f'error: fitted height {fitted.height} exceeds anchor-y {args.anchor_y}; lower --target-h')
    else:
        scale = fit_scale(rgba, size)
        fitted = median_downscale(rgba, (max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale))))
        fitted = quantize(fitted, args.colors, palette, args.snap)
        pos = ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2)
    canvas.paste(fitted, pos)
    hard = canvas.getchannel('A').point(lambda x: 255 if x >= 128 else 0)
    canvas.putalpha(hard)
    # Clear RGB of transparent pixels so no green survives under alpha=0.
    return Image.composite(canvas, Image.new('RGBA', size, (0, 0, 0, 0)), hard)


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--in', dest='src', required=True, type=Path)
    p.add_argument('--out', required=True, type=Path)
    p.add_argument('--kind', required=True, choices=sorted(KINDS))
    p.add_argument('--size', help='override target WxH, e.g. 128x128')
    p.add_argument('--palette', help='comma-separated hex list used for snapping (default: design spec 2.1 + 2.4)')
    p.add_argument('--colors', type=int, default=24, help='max colors for pixel kinds (<=32, default 24)')
    p.add_argument('--snap', type=float, default=40, help='RGB distance to snap to palette, 0 disables (default 40)')
    p.add_argument('--erode', type=int, default=1, help='alpha erode px to remove green fringe (default 1)')
    p.add_argument('--target-h', type=int, default=400, help='garment-an: fitted height cap (default 400; An outfit_main front = 250)')
    p.add_argument('--anchor-y', type=int, default=400, help='garment-an: bottom edge y in the cell (default 400; outfit_main hem = 377)')
    p.add_argument('--dry-run', action='store_true', help='print result, do not write')
    args = p.parse_args()
    if not 2 <= args.colors <= 32:
        p.error('--colors must be 2..32')
    size = tuple(int(v) for v in args.size.lower().split('x')) if args.size else KINDS[args.kind]
    with Image.open(args.src) as src:
        out = process(src, args.kind, size, args)
    alphas = set(out.getchannel('A').tobytes())
    colors = len(out.getcolors(out.width * out.height))
    print(f'{args.kind}: {out.width}x{out.height} RGBA, alpha values {sorted(alphas)}, {colors} colors')
    if args.dry_run:
        print('dry-run: nothing written')
        return
    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.save(args.out)
    print(f'wrote {args.out}. Next: npm run audit:assets')


if __name__ == '__main__':
    main()
