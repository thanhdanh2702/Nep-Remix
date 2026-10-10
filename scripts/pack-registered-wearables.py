"""Compile the ImageGen remake's full registered frames into runtime assets.

No bounding-box registration or separate torso/tail scaling is permitted here.
Only one uniform resize of the whole sheet, grayscale material normalization,
cell packing and a derived presentation/icon are performed.
"""
import argparse
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('wearable_pack', ROOT / 'scripts/build-wearable-assets.py')
PACK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACK)
BACKUP = ROOT / 'artifacts/wearables/remake-2026-10-10/original'


def metadata(path):
    with Image.open(path) as image:
        alpha = image.convert('RGBA').getchannel('A')
        return dict(path=path.relative_to(ROOT).as_posix(), kind='garment-layer',
                    width=image.width, height=image.height, format='PNG', mode=image.mode,
                    alphaRange=list(alpha.getextrema()), bounds=list(alpha.getbbox()),
                    sha256=hashlib.sha256(path.read_bytes()).hexdigest())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest')
    parser.add_argument('--only', nargs='*')
    args = parser.parse_args()
    manifest_path = ROOT / args.manifest
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    catalog = {g['id']: g for g in json.loads((ROOT / 'src/content/studio.json').read_text(encoding='utf-8'))['garments']}
    registry_path = ROOT / 'data/runtime-assets.json'
    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    records = []
    for entry in manifest['assets']:
        if not entry.get('source') or (args.only and entry['id'] not in args.only):
            continue
        slug = entry['id']
        if slug not in catalog or entry['registration'] != 'full-frame':
            raise ValueError('Only catalog garments with full-frame registration may be compiled')
        folder = ROOT / 'assets/garments' / slug
        folder.resolve().relative_to((ROOT / 'assets/garments').resolve())
        before = BACKUP / slug
        before.mkdir(parents=True, exist_ok=True)
        for path in folder.iterdir():
            if path.is_file() and not (before / path.name).exists():
                shutil.copy2(path, before / path.name)
        source = Image.open(ROOT / entry['source']).convert('RGBA')
        if entry.get('alignCollars') and not entry.get('viewOffsets'):
            preliminary = PACK.registered_cells(source, entry)
            targets = [94, 71, 94, 105]
            target_y = entry.get('necklineY', 127)
            offsets, landmarks = [], []
            for i, cell in enumerate(preliminary):
                if i == 4:
                    offsets.append([0, 0])
                    continue
                alpha = cell.getchannel('A').point(lambda a: 255 if a >= 160 else 0)
                bounds = alpha.getbbox()
                if not bounds:
                    raise ValueError('Empty wearer view: ' + slug)
                band = alpha.crop((0, bounds[1], 176, bounds[1] + 5)).getbbox()
                center = (band[0] + band[2] - 1) / 2
                dx, dy = round(targets[i] - center), target_y - bounds[1]
                if abs(dx) > 22 or abs(dy) > 22 or bounds[3] + dy > 391:
                    raise ValueError('Generated view needs a new pose fit, not stretching: ' + slug + ' ' + str((i, bounds, dx, dy)))
                offsets.append([dx, dy])
                landmarks.append(dict(view=i, sourceCollar=[center, bounds[1]], translation=[dx, dy]))
            entry['viewOffsets'] = offsets
            entry['landmarks'] = landmarks
        cells = PACK.registered_cells(source, entry)
        strip = Image.new('RGBA', (528, 416))
        for i in range(3):
            strip.alpha_composite(cells[i], (176 * i, 0))
        hanging_bounds = cells[4].getchannel('A').getbbox()
        if not hanging_bounds:
            raise ValueError('Empty presentation cell')
        hanging = PACK.fit_hanging(cells[4].crop(hanging_bounds))
        outputs = {
            slug + '.png': strip,
            slug + '--right.png': cells[3],
            slug + '--hanging.png': hanging,
            slug + '--icon.png': PACK.icon_from_hanging(hanging, catalog[slug]['defaultColorPalette']),
        }
        for filename, image in outputs.items():
            path = folder / filename
            image.save(path)
            records.append(metadata(path))
        entry['compiled'] = True
        entry['outputs'] = [r['path'] for r in records if Path(r['path']).parent.name == slug]
        print('Compiled full registered frames: ' + slug)
    changed = {r['path'] for r in records}
    registry = [r for r in registry if r['path'] not in changed] + records
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
