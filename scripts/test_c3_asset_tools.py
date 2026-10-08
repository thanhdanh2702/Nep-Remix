"""C3 mechanical-export guarantees; no gameplay dependencies."""
import unittest
from pathlib import Path
import json
import hashlib
from html.parser import HTMLParser
from PIL import Image


class MechanicalTests(unittest.TestCase):
    def tools(self):
        import c3_asset_tools
        return c3_asset_tools

    def test_clean_alpha_clears_hidden_rgb_and_haze(self):
        source = Image.new('RGBA', (2, 1))
        source.putdata([(40, 50, 60, 127), (90, 80, 70, 254)])
        self.assertEqual(list(self.tools().clean(source).getdata()), [(0,0,0,0),(90,80,70,255)])

    def test_pose_group_has_equal_height_and_feet(self):
        a = Image.new('RGBA', (100, 300), (120,80,50,255))
        b = Image.new('RGBA', (150, 300), (120,80,50,255))
        frames = self.tools().pose_group([a,b])
        self.assertEqual([f.size for f in frames], [(176,416)]*2)
        bounds = [f.getbbox() for f in frames]
        self.assertEqual(bounds[0][3],401)
        self.assertEqual(bounds[1][3],401)
        self.assertEqual(bounds[0][3]-bounds[0][1],bounds[1][3]-bounds[1][1])
        self.assertLessEqual(bounds[1][2]-bounds[1][0],160)

    def test_empty_pose_rejected(self):
        with self.assertRaises(ValueError):
            self.tools().pose_group([Image.new('RGBA',(10,10))])

    def test_bad_group_rejected(self):
        with self.assertRaises(ValueError):
            self.tools().pose_group([])

    def test_roi_changes_only_selected_rectangle(self):
        source = Image.new('RGBA',(40,30),(140,80,30,255))
        overlay = self.tools().roi_overlay(source,(10,8,25,20))
        self.assertEqual(overlay.size,source.size)
        self.assertEqual(overlay.getbbox(),(10,8,25,20))
        self.assertEqual(overlay.getpixel((0,0)),(0,0,0,0))

    def test_invalid_roi_rejected(self):
        with self.assertRaises(ValueError):
            self.tools().roi_overlay(Image.new('RGBA',(10,10)),(-1,0,11,5))

    def test_fit_layer_exact_box_and_grays(self):
        source = Image.new('RGBA',(40,80),(160,130,60,200))
        layer = self.tools().fit_layer(source,(30,127,150,377),gray=True)
        self.assertEqual(layer.size,(176,416))
        self.assertEqual(layer.getbbox(),(30,127,150,377))
        self.assertLessEqual({p[:3] for p in layer.getdata() if p[3]}, {(v,v,v) for v in (33,97,158,224)})

    def test_empty_layer_rejected(self):
        with self.assertRaises(ValueError):
            self.tools().fit_layer(Image.new('RGBA',(4,4)),(0,0,4,4))

    def test_empty_document_rejected(self):
        with self.assertRaises(ValueError):
            self.tools().crop_boxes(Image.new('RGBA',(4,4)),[(0,0,4,4)])

    def test_colored_layer_preserves_color(self):
        layer=self.tools().fit_layer(Image.new('RGBA',(4,4),(120,80,40,255)),(0,0,4,4))
        self.assertEqual(layer.getpixel((0,0)),(120,80,40,255))

    def test_unequal_document_crops_preserve_full_subject(self):
        source=Image.new('RGBA',(40,20))
        source.paste((220,190,130,255),(1,2,8,19))
        source.paste((220,190,130,255),(12,2,36,19))
        crops=self.tools().crop_boxes(source,[(0,0,10,20),(10,0,40,20)])
        self.assertEqual([im.size for im in crops],[(7,17),(24,17)])

    def test_portrait_uses_same_pixels(self):
        frame=Image.new('RGBA',(176,416))
        frame.paste((140,80,60,255),(45,30,130,401))
        portrait=self.tools().portrait(frame)
        self.assertEqual(portrait.size,(128,128))
        self.assertIn((140,80,60,255),portrait.getdata())

    def test_scene_actor_enlarged_without_moving_feet(self):
        frame=Image.new('RGBA',(176,416))
        frame.paste((120,80,40,255),(38,17,138,401))
        layer=self.tools().scene_actor(frame,780,825,1.35)
        self.assertEqual(layer.size,(1672,941))
        box=layer.getbbox()
        self.assertAlmostEqual(box[3]-box[1],384*1.35,delta=2)
        self.assertAlmostEqual(box[2]-box[0],100*1.35,delta=2)
        self.assertAlmostEqual(box[3]-1,825,delta=1)
        self.assertAlmostEqual((box[0]+box[2])/2,780,delta=1)

    def test_scene_actor_rejects_invalid_scale(self):
        for scale in (0,-1,float('inf'),float('nan')):
            with self.assertRaises(ValueError):
                self.tools().scene_actor(Image.new('RGBA',(176,416)),780,825,scale)

    def test_scene_actor_rejects_empty_frame(self):
        with self.assertRaises(ValueError):
            self.tools().scene_actor(Image.new('RGBA',(176,416)),780,825,1.35)


class ProductionTests(unittest.TestCase):
    root=Path(__file__).resolve().parent.parent

    def test_garments_fit_native_torso_in_three_views(self):
        body=Image.open(self.root/'assets/characters/an/body.png').convert('RGBA')
        for identifier in ['ao-dai-raglan','ao-dai-co-thuyen']:
            garment=Image.open(self.root/f'assets/garments/{identifier}/{identifier}.png').convert('RGBA')
            self.assertEqual(garment.size,(528,416))
            self.assertLessEqual({p[:3] for p in garment.getdata() if p[3]}, {(v,v,v) for v in (33,97,158,224)})
            for col,index in enumerate((0,22,66)):
                frame=body.crop((index%8*176,index//8*416,index%8*176+176,index//8*416+416))
                covered=total=0
                for y in range(150,210):
                    for x in range(176):
                        if frame.getpixel((x,y))[3]>128:
                            total+=1
                            covered+=garment.getpixel((col*176+x,y))[3]>128
                self.assertGreater(covered/total,.95,f'{identifier} bare torso view {col}')

    def test_chest_overlay_is_bounded_and_same_canvas(self):
        area='c3-s2-phong-phong-thuy'
        for state in ['ruong-mo','ruong-rong']:
            path=self.root/f'assets/areas/chapter-3/{area}/{area}--{state}.png'
            im=Image.open(path).convert('RGBA')
            self.assertEqual(im.size,(1672,941))
            self.assertEqual(im.getbbox(),(1050,270,1335,474))

    def test_npc_pose_sizes_portraits_and_anchors(self):
        for actor,poses in [('ba-mai',['tailor','investigate','speak','relieved']),
                            ('vinh',['idle','surprised','witness']),
                            ('ba-lon',['stern','uneasy','reflective']),
                            ('thay-ba-can',['idle','anxious','uneasy'])]:
            heights=[]
            for pose in poses:
                im=Image.open(self.root/f'assets/characters/{actor}/scene-{pose}.png').convert('RGBA')
                self.assertEqual(im.size,(176,416))
                b=im.getbbox()
                self.assertEqual(b[3],401)
                heights.append(b[3]-b[1])
                with Image.open(self.root/f'assets/characters/{actor}/portrait-{pose}.png') as face:
                    self.assertEqual(face.size,(128,128))
                self.assertLessEqual({p[3] for p in im.getdata()},{0,255})
            self.assertEqual(len(set(heights)),1)

    def test_production_manifest_and_hashes(self):
        manifest=json.loads((self.root/'assets/areas/chapter-3/manifest.json').read_text())
        self.assertFalse(manifest['gameplayIntegrated'])
        self.assertGreaterEqual(len(manifest['assets']),40)
        for record in manifest['assets']:
            path=self.root/record['path']
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),record['sha256'])
            with Image.open(path) as im:
                self.assertEqual(im.size,(record['width'],record['height']))

    def test_table_papers_are_foreshortened(self):
        manifest=json.loads((self.root/'assets/areas/chapter-3/manifest.json').read_text())
        for placement in manifest['worldPlacements']:
            bounds=placement['visibleBounds']
            self.assertLessEqual(bounds[3]-bounds[1],20)

    def test_scene_layout_uses_larger_characters(self):
        manifest=json.loads((self.root/'assets/areas/chapter-3/manifest.json').read_text())
        self.assertEqual(len(manifest['sceneActors']),5)
        for actor in manifest['sceneActors']:
            self.assertEqual(actor['scale'],1.35)
            box=actor['visibleBounds']
            self.assertGreater(box[3]-box[1],480)
            self.assertGreaterEqual(box[0],0)
            self.assertGreaterEqual(box[1],0)
            self.assertLessEqual(box[2],1672)
            self.assertLessEqual(box[3],941)

    def test_source_images_unchanged(self):
        raw=self.root/'assets/areas/chapter-3/_raw/review-v1'
        for record in json.loads((raw/'manifest.json').read_text())['artifacts']:
            self.assertEqual(hashlib.sha256((raw/record['file']).read_bytes()).hexdigest(),record['sha256'])

    def test_gallery_links_resolve(self):
        folder=self.root/'assets/areas/chapter-3/_raw/production-v1'
        class Links(HTMLParser):
            def handle_starttag(self,tag,attrs):
                for key,value in attrs:
                    if key in ('href','src'):
                        self.paths.append(value)
        parser=Links()
        parser.paths=[]
        parser.feed((folder/'gallery.html').read_text())
        self.assertGreater(len(parser.paths),100)
        for path in parser.paths:
            self.assertTrue((folder/path).is_file(),path)


if __name__=='__main__':
    import sys
    if '--coverage' not in sys.argv:
        unittest.main()
    else:
        import trace
        import dis
        import types
        import c3_asset_tools
        tracer=trace.Trace(count=True,trace=False)
        suite=unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
        result=tracer.runfunc(unittest.TextTestRunner().run,suite)
        executable=set()
        def code_lines(code):
            executable.update(line for _,line in dis.findlinestarts(code) if line!=code.co_firstlineno)
            for constant in code.co_consts:
                if isinstance(constant,types.CodeType):
                    code_lines(constant)
        for value in vars(c3_asset_tools).values():
            if isinstance(value,types.FunctionType) and value.__module__==c3_asset_tools.__name__:
                code_lines(value.__code__)
        hit={line for (filename,line),count in tracer.results().counts.items()
             if Path(filename).resolve()==Path(c3_asset_tools.__file__).resolve() and count}
        percent=100*len(executable & hit)/len(executable)
        print(f'C3 helper executable-line coverage: {percent:.1f}% ({len(executable & hit)}/{len(executable)})')
        raise SystemExit(0 if result.wasSuccessful() and percent>=80 else 1)
