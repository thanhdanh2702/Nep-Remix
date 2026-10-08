"""Reproducible export of approved C2 artwork. Run with Pillow installed."""
from pathlib import Path
import json
import hashlib
import html
import os
from PIL import Image, ImageFilter
from c2_asset_tools import actor_frame, split_four, gray_keys

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'assets/areas/chapter-2/_raw/review-v3'
PACK = ROOT / 'assets/areas/chapter-2/_raw/production-v4'
PACK.mkdir(parents=True, exist_ok=True)


def save(image, relative):
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return relative


def native(layer, index):
    image = Image.open(ROOT / f'assets/characters/an/{layer}.png').convert('RGBA')
    x, y = index % 8 * 176, index // 8 * 416
    return image.crop((x, y, x+176, y+416))


def clean(image):
    image = image.convert('RGBA')
    image.putdata([(r, g, b, 255) if a >= 128 else (0, 0, 0, 0) for r, g, b, a in image.getdata()])
    return image


def cells(name):
    image = clean(Image.open(PACK / f'{name}.png'))
    return [image.crop((image.width*i//3, 0, image.width*(i+1)//3, image.height)) for i in range(3)]


records = []
for source, actor, pose in [('loan-work', 'cu-loan', 'idle'), ('loan-exhibit', 'cu-loan', 'exhibition'),
                            ('ca-nghi', 'ca-nghi', 'idle'), ('ong-le', 'ong-le', 'idle')]:
    frame = actor_frame(clean(Image.open(RAW / f'characters/{source}.png')))
    path = save(frame, f'assets/characters/{actor}/scene-{pose}.png')
    records.append(path)
    if pose == 'idle':
        records.append(save(frame, f'assets/characters/{actor}/view-front.png'))
    # Portraits derive from the exact same sprite identity, not a separately redrawn face.
    records.append(save(frame.crop((0, 12, 176, 188)), f'assets/characters/{actor}/portrait-{pose}.png'))

# Crop out the generated alpha haze outside the actual sheet; keep the continuous drawing.
sketch = Image.open(RAW / 'props/restored-sketch.png').convert('RGBA').crop((256, 28, 768, 1504))
scene1 = 'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/'
records.append(save(sketch, scene1+'doc-c2-ban-ve-hoan-chinh.png'))
for i, strip in enumerate(split_four(sketch), 1):
    records.append(save(strip, scene1+f'doc-c2-manh-ban-ve-{i}.png'))
assembled = Image.new('RGBA',(1672,941))
paper1 = sketch.copy()
paper1.thumbnail((120,210), Image.Resampling.NEAREST)
assembled.alpha_composite(paper1,(365-paper1.width//2,280))
records.append(save(assembled,scene1+'c2-s1-gac-lung-ve-tranh--ban-ve-ghep.png'))

world_placements = []
for i, point in enumerate([(615,421),(993,520),(130,407),(1260,452)], 1):
    identifier = f'manh-ban-ve-ao-dai-{i}'
    icon = Image.open(ROOT/f'assets/items/{identifier}/{identifier}.png').convert('RGBA')
    overlay = Image.new('RGBA', (1672,941))
    icon.thumbnail((40,40), Image.Resampling.NEAREST)
    overlay.alpha_composite(icon, point)
    path = save(overlay, scene1+f'c2-s1-gac-lung-ve-tranh--manh-{i}.png')
    records.append(path)
    world_placements.append(dict(path=path, topLeft=point, itemId=identifier))

key = Image.open(ROOT/'assets/items/chia-khoa-ket-sat-bang-thau/chia-khoa-ket-sat-bang-thau.png').convert('RGBA')
key.thumbnail((28,28), Image.Resampling.NEAREST)
key_overlay = Image.new('RGBA',(1672,941))
key_overlay.alpha_composite(key,(401,386))
records.append(save(key_overlay, 'assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/c2-s2-kho-vai-hang-dao--chia-khoa.png'))
world_placements.append(dict(path=records[-1],topLeft=(401,386),itemId='chia-khoa-ket-sat-bang-thau'))

scene3 = 'assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/'
base = Image.open(ROOT / (scene3+'c2-s3-phong-trien-lam-doi-dau--phai.png')).convert('RGBA')
mounted = Image.new('RGBA', base.size)
paper = sketch.copy()
paper.thumbnail((168,218), Image.Resampling.NEAREST)
mounted.alpha_composite(paper, (491-paper.width//2,280))
records.append(save(mounted, scene3+'c2-s3-phong-trien-lam-doi-dau--ban-ve-treo.png'))

audience = Image.open(RAW / 'characters/reporters.png').convert('RGBA')
audience = audience.crop(audience.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox())
audience = audience.resize((325, round(audience.height*325/audience.width)), Image.Resampling.NEAREST)
overlay = Image.new('RGBA', base.size)
overlay.alpha_composite(audience, (1100, 780-audience.height))
records.append(save(overlay, scene3+'c2-s3-phong-trien-lam-doi-dau--nguoi-nghe.png'))
ending = Image.alpha_composite(Image.alpha_composite(base, mounted), overlay)
loan = Image.open(ROOT/'assets/characters/cu-loan/scene-exhibition.png').convert('RGBA')
ending.alpha_composite(loan, (720, 380))
records.append(save(ending.convert('RGB'), scene3+'cg-c2-loan-tu-ky-ten.png'))

# Native three-view references: EXACT body registration for subsequent garment fitting.
for name, layers in [('body-reference', ['body', 'head', 'hands', 'bottom', 'legs', 'shoes']),
                     ('outfit-reference', ['outfit_back', 'outfit_main']),
                     ('an-reference', ['shadow', 'hair_back', 'outfit_back', 'legs', 'shoes', 'body',
                                       'bottom', 'outfit_main', 'head', 'face', 'hair_front', 'hands'])]:
    strip = Image.new('RGBA', (528, 416))
    for col, index in enumerate((0, 22, 66)):
        cell = Image.new('RGBA', (176, 416))
        for layer in layers:
            cell.alpha_composite(native(layer, index))
        strip.alpha_composite(cell, (col*176, 0))
    strip.save(PACK / f'{name}.png')
    if name in ('body-reference', 'outfit-reference'):
        strip.crop((176,0,352,416)).save(PACK/f'{name}-side.png')

# JSON is generated metadata, never a replacement for a human approval.
(PACK/'exported-paths.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
print(f'Exported {len(records)} C2 artwork files and three native alignment references.')

for name, actor, poses in [('loan-expressions', 'cu-loan', ['worried', 'determined', 'relieved']),
                           ('ca-nghi-expressions', 'ca-nghi', ['stern', 'shocked', 'retreat'])]:
    if not (PACK/f'{name}.png').exists():
        continue
    for image, pose in zip(cells(name), poses):
        frame = actor_frame(image)
        records.append(save(frame, f'assets/characters/{actor}/scene-{pose}.png'))
        records.append(save(frame.crop((0, 12, 176, 188)), f'assets/characters/{actor}/portrait-{pose}.png'))

for name, kind, identifier, bounds in [
        ('lemur-corrected', 'garments', 'ao-dai-lemur', [(29,127,158,377), (31,127,133,377), (26,126,158,361)]),
        ('headwrap', 'accessories', 'khan-van-den', [(32,17,155,107), (24,17,144,110), (28,17,150,120)]),
        ('clogs', 'accessories', 'guoc-moc', [(51,377,140,397), (31,377,112,400), (41,377,141,396)])]:
    if not (PACK/f'{name}.png').exists():
        continue
    strip = Image.new('RGBA', (528, 416))
    for col, (image, box) in enumerate(zip(cells(name), bounds)):
        if name == 'lemur-corrected' and col == 1 and (PACK/'lemur-side.png').exists():
            image = clean(Image.open(PACK/'lemur-side.png'))
        crop = image.crop(image.getbbox())
        crop = crop.resize((box[2]-box[0], box[3]-box[1]), Image.Resampling.NEAREST)
        if kind == 'garments':
            crop = gray_keys(crop)
        cell = Image.new('RGBA',(176,416))
        cell.alpha_composite(crop,box[:2])
        if kind == 'garments' and col == 2:
            # Mechanical alpha seam closure only where An's torso is visible;
            # sample neighboring fabric, do not enlarge the outer silhouette.
            expanded = cell.filter(ImageFilter.MaxFilter(11))
            body = native('body',66)
            for y in range(148,210):
                for x in range(176):
                    if body.getpixel((x,y))[3] > 128 and cell.getpixel((x,y))[3] == 0:
                        cell.putpixel((x,y),expanded.getpixel((x,y)))
        strip.alpha_composite(cell, (col*176,0))
    records.append(save(strip, f'assets/{kind}/{identifier}/{identifier}.png'))

scene2 = 'assets/areas/chapter-2/c2-s2-kho-vai-hang-dao/'
base2 = Image.open(ROOT/(scene2+'c2-s2-kho-vai-hang-dao--phai.png')).convert('RGBA')
for source, state in [('safe-open', 'ket-mo'), ('safe-empty', 'ket-rong')]:
    if (PACK/f'{source}.png').exists():
        edited = Image.open(PACK/f'{source}.png').convert('RGBA')
        if edited.size != base2.size:
            raise ValueError('Safe room changed dimensions')
        # Preserve ALL source pixels outside the safe + door rectangle.
        box = (1236, 353, 1563, 609)
        state_overlay = Image.new('RGBA', base2.size)
        state_overlay.paste(edited.crop(box), box[:2])
        records.append(save(state_overlay, scene2+f'c2-s2-kho-vai-hang-dao--{state}.png'))

if (ROOT/'assets/garments/ao-dai-lemur/ao-dai-lemur.png').exists():
    preview = Image.new('RGBA', (528,416), '#f5e8d5')
    garment = Image.open(ROOT/'assets/garments/ao-dai-lemur/ao-dai-lemur.png').convert('RGBA')
    # Same continuous four-stop gradient map as StudioCharacter.recolorLayer.
    palette = [(30,21,35),(123,50,72),(211,124,116),(253,234,206)]
    colored = Image.new('RGBA',garment.size)
    colors = []
    for r,g,b,a in garment.getdata():
        at = r/255*3
        low = min(2,int(at))
        fraction = at-low
        colors.append(tuple(round(palette[low][i]+(palette[low+1][i]-palette[low][i])*fraction) for i in range(3))+(a,))
    colored.putdata(colors)
    for col, index in enumerate((0,22,66)):
        frame = Image.new('RGBA', (176,416))
        for layer in ['shadow','hair_back','legs','shoes','body','bottom']:
            if index == 66 and layer == 'hair_back':
                continue
            frame.alpha_composite(native(layer,index))
        frame.alpha_composite(colored.crop((col*176,0,(col+1)*176,416)))
        for layer in ['head','face','hair_front','hands']:
            frame.alpha_composite(native(layer,index))
            if index == 66 and layer == 'face':
                frame.alpha_composite(native('hair_back',index))
        for accessory in ['khan-van-den','guoc-moc']:
            path = ROOT/f'assets/accessories/{accessory}/{accessory}.png'
            if path.exists():
                frame.alpha_composite(Image.open(path).crop((col*176,0,(col+1)*176,416)))
        preview.alpha_composite(frame,(col*176,0))
    preview.save(PACK/'fitting-preview.png')

records += [f'assets/areas/chapter-2/{area}/{area}--phai.png' for area in
            ['c2-s1-gac-lung-ve-tranh','c2-s2-kho-vai-hang-dao','c2-s3-phong-trien-lam-doi-dau']]
reuse_ids = ['manh-ban-ve-ao-dai-1','manh-ban-ve-ao-dai-2','manh-ban-ve-ao-dai-3',
            'manh-ban-ve-ao-dai-4','ban-ve-ao-dai-tan-thoi','chia-khoa-ket-sat-bang-thau',
            'bien-lai-tra-no-goc-1935','ban-giao-keo-ep-hon']
records += [f'assets/items/{identifier}/{identifier}.png' for identifier in reuse_ids]
records += [f'assets/{kind}/{identifier}/{identifier}--icon.png' for kind, identifier in
            [('garments','ao-dai-lemur'),('accessories','khan-van-den'),('accessories','guoc-moc')]]
metadata = []
for relative in records:
    path = ROOT/relative
    with Image.open(path) as image:
        metadata.append(dict(path=relative, width=image.width, height=image.height,
                             bounds=image.convert('RGBA').getbbox(), sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
(PACK/'exported-paths.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
(PACK/'manifest.json').write_text(json.dumps(dict(version=4, backgroundChoice='A', assets=metadata,
    worldPlacements=world_placements,
    reuseItemIds=reuse_ids, missingRequiredArt=[],
    deferredOptionalArt=['NPC walk atlases (static NPC gameplay)', 'audio (optional)', 'mat-trai (not in C2 scope)'],
    generation='Built-in ImageGen; original PNGs and prompts retained in _raw',
    processing='User-approved deterministic crop/resize/alpha/canvas/palette export',
    npcAnimation='Static story poses; An reuses existing walk atlas. No duplicated frames advertised as animation.',
    approval='Background A approved. Final C2 gallery awaits user visual sign-off.',
    gameplayIntegrated=False), ensure_ascii=False, indent=2)+'\n')
(ROOT/'assets/areas/chapter-2/manifest.json').write_text((PACK/'manifest.json').read_text())
print(f'Final export: {len(records)} C2 PNG entries including three backgrounds.')

def figure(path, label):
    url = html.escape(os.path.relpath(ROOT/path,PACK))
    return f'<figure><a href="{url}"><img loading="lazy" src="{url}" alt="{html.escape(label)}"></a><figcaption>{html.escape(label)}</figcaption></figure>'

cards = ''.join(figure(r['path'], r['path'].removeprefix('assets/')) for r in metadata)
page = '''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C2 — Asset final v4</title>
<style>body{margin:0;background:#211b24;color:#f5e8d5;font:16px system-ui;line-height:1.6}main{max-width:1380px;margin:auto;padding:32px}h1{color:#e0ad6b}a{color:#e0ad6b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:20px}figure{margin:0;background:#302831;padding:16px;border-radius:12px;overflow:hidden}figure img{width:100%;height:360px;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#e8d9c6 0% 25%,#d7c7b5 0% 50%) 50%/20px 20px}figcaption{font-size:12px;overflow-wrap:anywhere;margin-top:12px}.hero{max-width:850px;margin:28px 0}.hero img{height:auto}.note{padding:18px;border-left:3px solid #e0ad6b;background:#302831}</style>
<main><h1>Chương 2 — Bộ asset v4</h1><p>Nền A · nắng ấm, gỗ nâu · nhân vật theo tỷ lệ đã chọn</p><p class="note">Đã xuất runtime. Chờ bạn duyệt thẩm mỹ cuối. Đây là gallery asset, chưa phải màn chơi C2 đã tích hợp. Click ảnh để xem file thật.</p>
<h2>An mặc Lemur + khăn vấn + guốc: ba hướng</h2><figure class="hero"><img src="fitting-preview.png" alt="Thử ghép trên An"><figcaption>Preview ghép bằng đúng các lớp An; màu được gradient-map như Studio. Hướng phải mirror hướng trái.</figcaption></figure>
<h2>Toàn bộ hình bàn giao</h2><div class="grid">'''+cards+'</div></main></html>'
(PACK/'gallery.html').write_text(page,encoding='utf-8')
