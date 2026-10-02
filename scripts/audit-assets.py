"""Read-only source asset audit; writes metadata under data/ and QA crops under artifacts/."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib

root = Path(__file__).resolve().parent.parent
out = root / 'artifacts'
out.mkdir(exist_ok=True)
records = []
for path in sorted([*(root / 'assets').rglob('*.png'), root / 'map.png']):
    if '_raw' in path.parts:
        continue
    with Image.open(path) as source:
        rgba = source.convert('RGBA')
        alpha = rgba.getchannel('A')
        relative = path.relative_to(root).as_posix()
        group = path.relative_to(root).parts[1] if path != root / 'map.png' else 'screens'
        kind = {'branding': 'branding-source-sheet' if 'sheet' in relative else 'brand-logo' if 'logo' in relative else 'currency-icon',
                'characters': 'character-layer' if '/an/' in relative else 'character-sprite',
                'paperdoll': 'paperdoll-layer', 'garments': 'garment-thumb' if '--icon' in relative else 'garment-layer',
                'accessories': 'accessory-icon' if '--icon' in relative else 'accessory-layer',
                'items': 'item-icon', 'motifs': 'motif'}.get(group, 'area-asset' if group == 'areas' else 'screen-asset')
        records.append(dict(path=relative, kind=kind, width=source.width,
                            height=source.height, format=source.format, mode=source.mode,
                            alphaRange=alpha.getextrema(), bounds=alpha.getbbox(),
                            sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
manifest = json.loads((root / 'data/asset-manifest.json').read_text(encoding='utf-8-sig'))
missing = [entry['path'] for entry in manifest if not (root / entry['path']).is_file()]
(out / 'asset-audit.json').write_text(json.dumps(dict(images=records, missingManifestPaths=missing), ensure_ascii=False, indent=2), encoding='utf-8')
(root / 'data/runtime-assets.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
(root / 'data/asset-gaps.json').write_text(json.dumps(dict(missingManifestPaths=missing,
    notes=[f'Manifest gốc có các tên tệp cũ; runtime-assets.json đối chiếu {len(records)} ảnh thật.',
           'Không có tệp âm thanh trong assets/audio/.',
           'Không có nền portrait cho hai khu vực prologue; UI giữ nguyên tỷ lệ 8:5.']),
    ensure_ascii=False, indent=2), encoding='utf-8')

layers = ['shadow', 'hair_back', 'outfit_back', 'legs', 'shoes', 'body', 'bottom', 'outfit_main', 'head', 'face', 'hair_front', 'hands', 'head_accessory']
sheets = [Image.open(root / f'assets/characters/an/{name}.png').convert('RGBA') for name in layers]
contact = Image.new('RGBA', (8*110, 11*160), '#FFF1DF')
draw = ImageDraw.Draw(contact)
for index in range(88):
    col, row = index % 8, index // 8
    frame = Image.new('RGBA', (176, 416))
    for sheet in sheets:
        frame.alpha_composite(sheet.crop((col*176, row*416, (col+1)*176, (row+1)*416)))
    frame = frame.resize((88,208), Image.Resampling.NEAREST)
    # Common crop for inspection only; never used as a game asset.
    contact.alpha_composite(frame.crop((0,40,88,190)), (col*110+10,row*160+10))
    draw.text((col*110+4,row*160+2),str(index),fill='#2B2035')
contact.convert('RGB').save(out / 'an-frames-qa.png')
print(f'Audited {len(records)} PNGs; {len(missing)} stale/missing manifest paths. An grid: 8x11, 176x416.')
