"""User-approved deterministic C3 exports; no generation or gameplay mutations.

Run with Pillow. Sources stay immutable. Shared asset audit is intentionally not run.
"""
from pathlib import Path
import hashlib
import html
import json
import os
from PIL import Image, ImageFilter
from c3_asset_tools import clean, pose_group, portrait, fit_layer, crop_boxes, roi_overlay, scene_actor

ROOT=Path(__file__).resolve().parent.parent
AREA=ROOT/'assets/areas/chapter-3'
RAW=AREA/'_raw/review-v1'
PACK=AREA/'_raw/production-v1'
PACK.mkdir(parents=True,exist_ok=True)
records=[]
placements=[]
actors=[]
scene_actors=[]
SCENE_ACTOR_SCALE=1.35


def save(image,relative,kind,source=None):
    path=ROOT/relative
    path.parent.mkdir(parents=True,exist_ok=True)
    image.save(path)
    records.append(dict(path=relative,kind=kind,source=source,width=image.width,height=image.height,
                        bounds=image.convert('RGBA').getbbox(),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    return relative


def source(name):
    return Image.open(RAW/(name+'.png')).convert('RGBA')


def thirds(image,breaks=None):
    breaks=breaks or (image.width//3,2*image.width//3)
    return [image.crop((a,0,b,image.height)) for a,b in zip((0,*breaks),(*breaks,image.width))]


def native(name,index):
    image=Image.open(ROOT/f'assets/characters/an/{name}.png').convert('RGBA')
    x,y=index%8*176,index//8*416
    return image.crop((x,y,x+176,y+416))


for name,actor,poses in [
    ('mai-expressions-v2','ba-mai',['investigate','speak','relieved']),
    ('vinh','vinh',['idle','surprised','witness']),
    ('ba-lon-v2','ba-lon',['stern','uneasy','reflective']),
    ('thay-ba-can-v2','thay-ba-can',['idle','anxious','uneasy'])]:
    strips=thirds(source(name),(560,1000) if actor=='ba-mai' else None)
    sources=([source('mai-work-v2')]+strips) if actor=='ba-mai' else strips
    names=(['tailor']+poses) if actor=='ba-mai' else poses
    frames=pose_group(sources)
    for frame,pose in zip(frames,names):
        origin='mai-work-v2' if actor=='ba-mai' and pose=='tailor' else name
        save(frame,f'assets/characters/{actor}/scene-{pose}.png','character-sprite',origin)
        save(portrait(frame),f'assets/characters/{actor}/portrait-{pose}.png','portrait',origin)
    save(frames[0],f'assets/characters/{actor}/view-front.png','character-sprite','mai-work-v2' if actor=='ba-mai' else name)
    actors.append(dict(id=actor,poses=names,frame=[176,416],footAnchor=[88,400],visibleHeight=frames[0].getbbox()[3]-frames[0].getbbox()[1]))

area_ids=['c3-s1-tiem-may-da-kao','c3-s2-phong-phong-thuy','c3-s3-dinh-thu-doi-dau']
for number,identifier in enumerate(area_ids,1):
    save(source(f'c3-s{number}').convert('RGB'),f'assets/areas/chapter-3/{identifier}/{identifier}--phai.png','area-background',f'c3-s{number}')

garment_bounds=[(29,127,158,377),(31,127,133,377),(26,126,158,361)]
for name,identifier in [('raglan','ao-dai-raglan'),('boat-neck','ao-dai-co-thuyen')]:
    strip=Image.new('RGBA',(528,416))
    for col,(piece,box,index) in enumerate(zip(thirds(source(name),(525,922)),garment_bounds,(0,22,66))):
        cell=fit_layer(piece,box,gray=True)
        # Close tiny transparent seam gaps over the back torso using adjacent existing fabric.
        # No new fabric design or silhouette is drawn.
        if col==2:
            expanded=cell.filter(ImageFilter.MaxFilter(11))
            body=native('body',index)
            for y in range(150,210):
                for x in range(176):
                    if body.getpixel((x,y))[3]>128 and cell.getpixel((x,y))[3]==0:
                        cell.putpixel((x,y),expanded.getpixel((x,y)))
        strip.alpha_composite(cell,(col*176,0))
    save(strip,f'assets/garments/{identifier}/{identifier}.png','garment-layer',name)

glasses=Image.new('RGBA',(528,416))
for col,(piece,box) in enumerate(zip(thirds(source('cat-eye'),(525,922)),
                                     [(61,79,132,100),(31,78,93,98),(45,80,136,101)])):
    glasses.alpha_composite(fit_layer(piece,box),(col*176,0))
save(glasses,'assets/accessories/kinh-mat-meo/kinh-mat-meo.png','accessory-layer','cat-eye')

papers=crop_boxes(source('documents'),[(40,0,430,768),(430,0,1135,768),
                                     (1135,0,1590,768),(1590,0,2046,768)])
paper_ids=['bien-nhan','so-goc','thu-thoa-thuan','ban-sua']
for paper,identifier in zip(papers,paper_ids):
    save(paper,f'assets/areas/chapter-3/doc-c3-{identifier}.png','doc','documents')


def world_overlay(area_id,identifier,paper,point,max_size,item_id=None):
    cut=paper.copy()
    # Mechanical foreshortening for horizontal tabletop surfaces.
    cut=cut.resize(max_size,Image.Resampling.NEAREST)
    overlay=Image.new('RGBA',(1672,941))
    overlay.alpha_composite(cut,point)
    path=save(overlay,f'assets/areas/chapter-3/{area_id}/{area_id}--{identifier}.png','area-overlay','documents')
    placements.append(dict(path=path,areaId=area_id,itemId=item_id,topLeft=point,visibleBounds=overlay.getbbox(),toggleOffOnCollect=True))


world_overlay(area_ids[0],'bien-nhan',papers[0],(1210,473),(72,16),'bien_nhan_tien_thay_boi')
world_overlay(area_ids[0],'giay-doi-chieu',papers[3],(1320,475),(66,14))
world_overlay(area_ids[1],'so-goc',papers[1],(760,433),(80,18),'so_tu_vi_nguyen_ban_1962')
world_overlay(area_ids[1],'thu-thoa-thuan',papers[2],(875,426),(52,16),'thu_tay_thoa_thuan_boi_toan')
world_overlay(area_ids[1],'ghi-chu-khoa',papers[0],(990,408),(42,12))
world_overlay(area_ids[2],'ho-so-goc',papers[1],(640,457),(130,20))
world_overlay(area_ids[2],'thu-doi-chieu',papers[2],(840,450),(70,16))
world_overlay(area_ids[2],'ban-sua',papers[3],(970,451),(72,16))

for name,state in [('chest-open','ruong-mo'),('chest-empty','ruong-rong')]:
    overlay=roi_overlay(source(name),(1050,270,1335,474))
    save(overlay,f'assets/areas/chapter-3/{area_ids[1]}/{area_ids[1]}--{state}.png','area-overlay',name)
    Image.alpha_composite(source('c3-s2'),overlay).convert('RGB').save(PACK/f'chest-preview-{state}.png')


def fitting(identifier):
    garment=Image.open(ROOT/f'assets/garments/{identifier}/{identifier}.png').convert('RGBA')
    # Studio uses a continuous four-stop ramp, darkest -> lightest.
    palette=[(18,45,43),(35,91,77),(80,151,125),(214,238,208)]
    colored=Image.new('RGBA',garment.size)
    colors=[]
    for r,g,b,a in garment.getdata():
        at=r/255*3
        low=min(2,int(at))
        fraction=at-low
        colors.append(tuple(round(palette[low][i]+(palette[low+1][i]-palette[low][i])*fraction) for i in range(3))+(a,))
    colored.putdata(colors)
    preview=Image.new('RGBA',(528,416),'#f5e8d5')
    for col,index in enumerate((0,22,66)):
        frame=Image.new('RGBA',(176,416))
        for layer in ['shadow','hair_back','legs','shoes','body','bottom']:
            if index==66 and layer=='hair_back':
                continue
            frame.alpha_composite(native(layer,index))
        frame.alpha_composite(colored.crop((col*176,0,(col+1)*176,416)))
        for layer in ['head','face','hair_front','hands']:
            frame.alpha_composite(native(layer,index))
            if index==66 and layer=='face':
                frame.alpha_composite(native('hair_back',index))
        for accessory in ['guoc-moc','kinh-mat-meo']:
            if index==66 and accessory=='kinh-mat-meo':
                continue  # Current renderer hides the jewelry slot from behind.
            path=ROOT/f'assets/accessories/{accessory}/{accessory}.png'
            frame.alpha_composite(Image.open(path).convert('RGBA').crop((col*176,0,(col+1)*176,416)))
        preview.alpha_composite(frame,(col*176,0))
    preview.save(PACK/f'fitting-{identifier}.png')


for identifier in ['ao-dai-raglan','ao-dai-co-thuyen']:
    fitting(identifier)

# Composited layout review and economical ending vignette: no generated new identity.
scene_placements=[[(area_ids[0],'ba-mai','tailor',350,790)],
                  [(area_ids[1],'thay-ba-can','idle',580,795)],
                  [(area_ids[2],'ba-mai','speak',780,825),(area_ids[2],'vinh','witness',480,820),
                   (area_ids[2],'ba-lon','reflective',1170,820)]]
for number,entries in enumerate(scene_placements,1):
    background=source(f'c3-s{number}')
    for placement in placements:
        if placement['areaId']==area_ids[number-1]:
            background=Image.alpha_composite(background,Image.open(ROOT/placement['path']).convert('RGBA'))
    for area_id,actor,pose,x,foot_y in entries:
        frame=Image.open(ROOT/f'assets/characters/{actor}/scene-{pose}.png').convert('RGBA')
        layer=scene_actor(frame,x,foot_y,SCENE_ACTOR_SCALE)
        background.alpha_composite(layer)
        scene_actors.append(dict(areaId=area_id,actorId=actor,pose=pose,scale=SCENE_ACTOR_SCALE,
                                 footPosition=[x,foot_y],visibleBounds=layer.getbbox()))
    if number==3:
        save(background.convert('RGB'),f'assets/areas/chapter-3/{area_ids[2]}/cg-c3-mai-tu-len-tieng.png','cg','composited from S3 + approved NPC poses')
    background.convert('RGB').save(PACK/f'scene-preview-{number}.png')

reuse=['assets/accessories/guoc-moc/guoc-moc.png','assets/characters/ong-le/view-front.png']
for kind,identifier in [('garments','ao-dai-raglan'),('garments','ao-dai-co-thuyen'),('accessories','kinh-mat-meo')]:
    reuse.append(f'assets/{kind}/{identifier}/{identifier}--icon.png')
for identifier in ['bien-nhan-tien-thay-boi','so-tu-vi-nguyen-ban-1962','thu-tay-thoa-thuan-boi-toan']:
    reuse.append(f'assets/items/{identifier}/{identifier}.png')
for relative in reuse:
    path=ROOT/relative
    image=Image.open(path)
    records.append(dict(path=relative,kind='reuse',width=image.width,height=image.height,
                        bounds=image.convert('RGBA').getbbox(),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))

manifest=dict(version='production-v1',chapterId='c3',assets=records,actors=actors,sceneActors=scene_actors,
              sourceManifest='assets/areas/chapter-3/_raw/review-v1/manifest.json',worldPlacements=placements,
              chestROI=[1050,270,1335,474],backgroundSize=[1672,941],
              postprocessingPermission='User explicitly approved mechanical processing as C2',
              processing='Crop, alpha threshold, nearest resize, same-height NPC framing, four-key garment mapping, bounded overlays, native An fitting',
              gameplayIntegrated=False,sharedMetadataUpdated=False,culturalApproved=False,
              technicalExportComplete=True,visualSignoff='Awaiting final exported gallery review',
              missingRequiredArt=[],deferredOptionalArt=['Walk animation atlases','mat-trai','audio','C5 ancestor poses'],
              integrationNotes=['UI authors all Vietnamese paper text and Càn/Tốn labels; no generated glyphs.',
                                'Copy native garments/accessories; side view right is mirrored by renderer.',
                                'Jewelry slot glasses are hidden in back view by existing renderer.',
                                'Run shared asset audit and C3 integration tests only during leader integration.',
                                'NPCs are static poses, not duplicate-frame animations.'])
(AREA/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(PACK/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')


def figure(path,label):
    url=html.escape(os.path.relpath(ROOT/path,PACK))
    return f'<figure><a href="{url}"><img src="{url}" loading="lazy" alt="{html.escape(label)}"></a><figcaption>{html.escape(label)}</figcaption></figure>'


previews=''.join(figure(str((PACK/f'scene-preview-{i}.png').relative_to(ROOT)),f'Bố cục cảnh {i} — preview, chưa phải gameplay') for i in (1,2,3))
previews+=''.join(figure(str((PACK/f'chest-preview-{state}.png').relative_to(ROOT)),f'Rương {state} ghép trên nền gốc') for state in ['ruong-mo','ruong-rong'])
fits=''.join(figure(str((PACK/f'fitting-{id}.png').relative_to(ROOT)),f'An mặc {id} + kính + guốc, ba góc') for id in ['ao-dai-raglan','ao-dai-co-thuyen'])
cards=''.join(figure(r['path'],r['path'].removeprefix('assets/')) for r in records)
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C3 — Asset production v1</title>
<style>body{margin:0;background:#fff1df;color:#2b2035;font:16px/1.6 system-ui}main{max-width:1380px;margin:auto;padding:28px}a{color:#075f50}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0;padding:14px;background:#fff8ee;border:1px solid #d7c5b1;border-radius:8px}img{width:100%;height:340px;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#e8d9c6 0% 25%,#d7c7b5 0% 50%) 50%/20px 20px}figcaption{font-size:13px;overflow-wrap:anywhere}.scene img{height:auto}.note{border-left:4px solid #2e8b7a;padding:16px;background:#fff8ee}h1{color:#075f50}</style>
<main><h1>C3 — Bộ xuất kỹ thuật v1</h1><p>Mai tóc bob · Bà Lớn búi thấp · Thầy Ba Càn nam lớn tuổi. Giữ PNG nguồn và prompt.</p><p class="note">Đã tăng nhân vật trong cảnh lên 35%, giữ điểm chân và tỷ lệ cơ thể. Sprite gốc giữ khung chuẩn; sceneActors trong manifest ghi scale hiển thị. Chưa tích hợp gameplay hoặc thẩm định văn hóa. Kiểm tra fitting và preview trước khi leader tích hợp.</p>
<p><a href="../review-v1/gallery.html">Ảnh nguồn và bản cũ</a> · <a href="manifest.json">Manifest bàn giao</a> · <a href="../../../../../docs/07-game/10-c3-asset-handoff.md">Hướng dẫn leader</a></p>
<h2>Ghép trên khung An</h2><div class="grid">'''+fits+'</div><h2>Bố cục cảnh và nhân vật</h2><div class="grid scene">'+previews+'</div><h2>Toàn bộ file bàn giao</h2><div class="grid">'+cards+'</div></main></html>'
(PACK/'gallery.html').write_text(page,encoding='utf-8')
print(f'Exported {len(records)} C3 PNG entries including {len(reuse)} reused files.')
