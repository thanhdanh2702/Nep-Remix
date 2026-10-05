"""Normalize hi-res painted UI images onto a pixel grid (code only, no image model).

For every image in TARGETS: back up the original to <dir>/_raw/<stem>-hires.png (first run only; later
runs re-read that backup so the result is idempotent), median-cell downscale to the target grid, quantize
to <= --colors colors snapped to assets/palettes/ui.json, hard alpha. Reuses median_downscale/quantize
from scripts/process-ai-asset.py. After running: npm run audit:assets.

Usage: python scripts/pixel/normalize-ui-images.py [--only STEM ...] [--colors 32] [--dry-run]
"""
import argparse
import importlib.util
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]

spec = importlib.util.spec_from_file_location('process_ai_asset', ROOT / 'scripts' / 'process-ai-asset.py')
pa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pa)

# path (relative to repo root) -> target (width, height). Sizes keep the source aspect ratio; integer cell
# = source / target (2 for full-scene art, 3-5 for HUD pieces displayed at 48-56 px).
TARGETS = {
    'assets/screens/main-shop/area-sign-frame.png': (512, 171),
    'assets/screens/main-shop/currency-hud.png': (384, 128),
    'assets/screens/main-shop/settings-button.png': (128, 128),
    'assets/screens/main-shop/garden-user--landscape.png': (793, 496),
    'assets/screens/studio/lookbook-frame.png': (572, 688),
    'assets/screens/studio/vietnamese-room--landscape.png': (793, 496),
    'assets/screens/studio/wardrobe-frame--landscape.png': (724, 241),
    'assets/screens/museum/bookshelf-pink--landscape.png': (793, 496),
    'assets/screens/welcome/welcome-courtyard.png': (887, 443),
}


def save_png(img, path):
    """Opaque images go out as indexed PNG (lossless for <= 32 colors, ~5x smaller); others stay RGBA."""
    if set(img.getchannel('A').tobytes()) == {255}:
        indexed = img.convert('RGB').convert('P', palette=Image.Palette.ADAPTIVE, colors=32)
        if indexed.convert('RGB').tobytes() == img.convert('RGB').tobytes():
            indexed.save(path, optimize=True)
            return
    img.save(path, optimize=True)


def normalize(rel, size, colors, snap, palette, dry_run):
    path = ROOT / rel
    backup = path.parent / '_raw' / f'{path.stem}-hires.png'
    source = backup if backup.is_file() else path
    with Image.open(source) as src:
        rgba = src.convert('RGBA')
    out = pa.median_downscale(rgba, size)
    out = pa.quantize(out, colors, palette, snap)
    hard = out.getchannel('A').point(lambda x: 255 if x >= 128 else 0)
    out.putalpha(hard)
    n = len(out.getcolors(out.width * out.height))
    print(f'{rel}: {rgba.width}x{rgba.height} -> {out.width}x{out.height}, {n} colors, alpha {sorted(set(hard.tobytes()))}')
    if dry_run:
        return out
    if not backup.is_file():
        backup.parent.mkdir(exist_ok=True)
        shutil.copy2(path, backup)
    save_png(out, path)
    print(f'  wrote {path.stat().st_size // 1024} KB (backup {backup.relative_to(ROOT).as_posix()})')
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--only', nargs='*', default=[], help='file stems to process (default: all)')
    p.add_argument('--colors', type=int, default=32, help='max colors per image, 2..32 (default 32)')
    p.add_argument('--snap', type=float, default=40, help='RGB distance to snap to ui palette (default 40)')
    p.add_argument('--dry-run', action='store_true', help='report only, write nothing')
    args = p.parse_args()
    if not 2 <= args.colors <= 32:
        p.error('--colors must be 2..32')
    palette = [pa.hex_to_rgb(c) for c in json.loads((ROOT / 'assets/palettes/ui.json').read_text(encoding='utf-8'))['colors']]
    todo = {rel: size for rel, size in TARGETS.items() if not args.only or Path(rel).stem in args.only}
    if not todo:
        sys.exit('error: no matching stems')
    for rel, size in todo.items():
        normalize(rel, size, args.colors, args.snap, palette, args.dry_run)
    if not args.dry_run:
        print('Next: npm run audit:assets')


if __name__ == '__main__':
    main()
