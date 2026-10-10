"""Pack approved ImageGen hat views onto An's 176x416 idle frames.

Only transparent view cropping, uniform nearest-neighbour scaling and translation
are used. The original shop icons and generated sources remain unchanged.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'assets/references/headwear/generation.json'


def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    registry_path = ROOT / 'data/runtime-assets.json'
    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    for entry in manifest['assets']:
        source = Image.open(ROOT / entry['source']).convert('RGBA')
        strip = Image.new('RGBA', (528, 416))
        for index, view in enumerate(entry['views']):
            cell = source.crop(tuple(view['crop']))
            bounds = cell.getchannel('A').getbbox()
            if not bounds:
                raise ValueError('Empty hat view: ' + entry['id'])
            cell = cell.crop(bounds)
            scale = view['width'] / cell.width
            cell = cell.resize((view['width'], round(cell.height * scale)), Image.Resampling.NEAREST)
            x = round(view['centerX'] - cell.width / 2)
            y = view['top']
            if x < 0 or x + cell.width > 176 or y < 0 or y + cell.height > 416:
                raise ValueError('Hat exceeds An frame: ' + entry['id'])
            strip.alpha_composite(cell, (index * 176 + x, y))
        path = ROOT / 'assets/accessories' / entry['id'] / (entry['id'] + '.png')
        strip.save(path)
        relative = path.relative_to(ROOT).as_posix()
        record = dict(path=relative, kind='accessory-layer', width=528, height=416,
                      format='PNG', mode='RGBA', alphaRange=list(strip.getchannel('A').getextrema()),
                      bounds=list(strip.getchannel('A').getbbox()), sha256=hashlib.sha256(path.read_bytes()).hexdigest())
        registry = [item for item in registry if item['path'] != relative] + [record]
        print('Packed ' + relative)
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
