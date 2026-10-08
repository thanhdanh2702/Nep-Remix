import { palette } from '../ui/pixel-art';
import { bakeOutline, drawBrackets, drawSparkle, outlinePad } from './hotspot-highlight';
import { setSmoothing } from '../ui/pixel-scale';
import { portraitFor } from './npc-portraits';
import { AN, assetRegistry, areaFolder } from './assets';
import { AN_FIGURE_H, characterScale, spriteScaleFor, type CharacterScene } from './character-scale';
import { npcView, type NpcView, type Pt } from './room-walker';
import type { ExitArrow } from '../content/schema';

export function c2AreaOverlays(
  chapterId: string,
  areaId: string,
  inventoryItemIds: string[],
  solvedPuzzleIds: string[]
): { id: string; path: string; visible: boolean }[] {
  if (chapterId !== 'c2') return [];
  const folder = areaFolder(chapterId, areaId);
  if (areaId === 'c2-s1-gac-lung-ve-tranh') {
    return [
      { id: 'manh-1', path: `${folder}/c2-s1-gac-lung-ve-tranh--manh-1.png`, visible: !inventoryItemIds.includes('manh_ban_ve_ao_dai_1') },
      { id: 'manh-2', path: `${folder}/c2-s1-gac-lung-ve-tranh--manh-2.png`, visible: !inventoryItemIds.includes('manh_ban_ve_ao_dai_2') },
      { id: 'manh-3', path: `${folder}/c2-s1-gac-lung-ve-tranh--manh-3.png`, visible: !inventoryItemIds.includes('manh_ban_ve_ao_dai_3') },
      { id: 'manh-4', path: `${folder}/c2-s1-gac-lung-ve-tranh--manh-4.png`, visible: !inventoryItemIds.includes('manh_ban_ve_ao_dai_4') },
      { id: 'ban-ve-ghep', path: `${folder}/c2-s1-gac-lung-ve-tranh--ban-ve-ghep.png`, visible: solvedPuzzleIds.includes('p-c2-sketch-assemble') },
    ];
  }
  if (areaId === 'c2-s2-kho-vai-hang-dao') {
    return [
      { id: 'chia-khoa', path: `${folder}/c2-s2-kho-vai-hang-dao--chia-khoa.png`, visible: !inventoryItemIds.includes('chia_khoa_ket_sat_bang_thau') },
      { id: 'ket-rong', path: `${folder}/c2-s2-kho-vai-hang-dao--ket-rong.png`, visible: solvedPuzzleIds.includes('p-c2-safe-open') },
    ];
  }
  if (areaId === 'c2-s3-phong-trien-lam-doi-dau') {
    return [
      { id: 'ban-ve-treo', path: `${folder}/c2-s3-phong-trien-lam-doi-dau--ban-ve-treo.png`, visible: solvedPuzzleIds.includes('p-c2-present-sketch') },
      { id: 'nguoi-nghe', path: `${folder}/c2-s3-phong-trien-lam-doi-dau--nguoi-nghe.png`, visible: solvedPuzzleIds.includes('p-c2-present-receipt') },
    ];
  }
  return [];
}

export function c3AreaOverlays(
  chapterId: string,
  areaId: string,
  inventoryItemIds: string[],
  solvedPuzzleIds: string[]
): { id: string; path: string; visible: boolean }[] {
  if (chapterId !== 'c3') return [];
  const folder = areaFolder(chapterId, areaId);
  if (areaId === 'c3-s1-tiem-may-da-kao') {
    return [
      { id: 'bien-nhan', path: `${folder}/c3-s1-tiem-may-da-kao--bien-nhan.png`, visible: !inventoryItemIds.includes('bien_nhan_tien_thay_boi') },
      { id: 'giay-doi-chieu', path: `${folder}/c3-s1-tiem-may-da-kao--giay-doi-chieu.png`, visible: true },
    ];
  }
  if (areaId === 'c3-s2-phong-phong-thuy') {
    return [
      { id: 'ghi-chu-khoa', path: `${folder}/c3-s2-phong-phong-thuy--ghi-chu-khoa.png`, visible: true },
      { id: 'ruong-rong', path: `${folder}/c3-s2-phong-phong-thuy--ruong-rong.png`, visible: solvedPuzzleIds.includes('p-c3-bagua-lock') },
    ];
  }
  if (areaId === 'c3-s3-dinh-thu-doi-dau') {
    return [
      { id: 'ho-so-goc', path: `${folder}/c3-s3-dinh-thu-doi-dau--ho-so-goc.png`, visible: true },
      { id: 'thu-doi-chieu', path: `${folder}/c3-s3-dinh-thu-doi-dau--thu-doi-chieu.png`, visible: true },
      { id: 'ban-sua', path: `${folder}/c3-s3-dinh-thu-doi-dau--ban-sua.png`, visible: true },
    ];
  }
  return [];
}

// Canvas drawing for point-and-click rooms. Everything is pure canvas math over loaded images;
// RoomScene owns state, DOM and timing. The stage canvas is exactly the room background, so world px
// (the background's own pixel size) map to device px by `k`.

export interface Box { x: number; y: number; w: number; h: number }
export type NpcViews = Partial<Record<NpcView, HTMLImageElement>>;
/** `npcs`: loaded views per NPC id; `front` is always there (an NPC without it is not drawn). */
export interface RoomAssets {
  bg: HTMLImageElement;
  cat?: HTMLImageElement;
  cutouts: Record<string, HTMLImageElement>;
  npcs: Record<string, NpcViews>;
  overlays?: { id: string; img: HTMLImageElement; visible: boolean }[];
}
export interface Highlight { id: string; hit: Box; world: Box; useCutout: boolean }
export interface RoomFrame {
  w: number; h: number; k: number; t: number; reduced: boolean;
  s1: boolean;
  /** Hover/focus target, drawn alone. */
  focus: Highlight | null;
  /** "Soi" mode: brackets on every hotspot. */
  all: Box[];
  sparkle: { x: number; y: number; frame: number } | null;
  /** NPCs standing in the room: rect in world px, feet at its bottom centre. */
  npcs: { id: string; rect: Box }[];
  /** Scene for character scale; null draws no people. `an` = her feet in world px + the composited cell (once loaded). */
  scene: CharacterScene | null;
  an: { foot: Pt; cell: HTMLCanvasElement | undefined } | null;
}

/** Interactables that stand an NPC in the room (c1 content has no npc field): sprite path + ghost flag, by interactable id.
 *  Speaker-backed ones reuse npc-portraits so a sprite is named once. */
const speakerSprite = (speaker: string) => { const p = portraitFor(speaker); return p.kind === 'sprite' ? { path: p.path, ghost: p.ghost } : undefined; };
const OFFICIALS = 'assets/characters/truong-toc-bui/view-front.png';
export const ROOM_NPCS: Record<string, { path: string; ghost?: boolean } | undefined> = {
  'hitbox-village-officials': assetRegistry[OFFICIALS] ? { path: OFFICIALS } : undefined,
  'hitbox-ong-le-entity': speakerSprite('Bóng mờ Ông Lệ'),
  'hitbox-styling-cam': speakerSprite('Cụ Cầm'),
  'hitbox-ca-nghi': speakerSprite('Ông Cả Nghị'),
  'hitbox-cu-loan': speakerSprite('Cụ Loan'),
  'hitbox-cu-loan-storage': speakerSprite('Cụ Loan'),
  'hitbox-ong-le-shadow': speakerSprite('Bóng mờ Ông Lệ'),
};

export interface RoomNpc {
  id: string;
  name: string;
  path: string;
  ghost?: boolean;
  rect: Box;
}

/** C2 static scene characters (Loan, Cả Nghị) placed on the room floor decoupled from interactable hitboxes. */
export function c2RoomNpcs(
  chapterId: string,
  areaId: string,
  solvedPuzzleIds: string[],
  world: { w: number; h: number }
): RoomNpc[] {
  if (chapterId !== 'c2') return [];
  const W = world.w, H = world.h;
  const npcBox = (footNormX: number, footNormY: number): Box => {
    const footX = Math.round(footNormX * W);
    const footY = Math.round(footNormY * H);
    // NPC visible bounds in manifest (e.g. cu-loan [31, 17, 145, 401]): width 114px, height 384px
    const w = 114;
    const h = 384;
    return {
      x: footX - Math.round(w / 2),
      y: footY - h,
      w,
      h,
    };
  };

  if (areaId === 'c2-s1-gac-lung-ve-tranh') {
    return [
      {
        id: 'c2-s1-loan',
        name: 'Cụ Loan',
        path: 'assets/characters/cu-loan/scene-idle.png',
        rect: npcBox(0.68, 0.75),
      },
    ];
  }

  if (areaId === 'c2-s2-kho-vai-hang-dao') {
    return [
      {
        id: 'c2-s2-loan',
        name: 'Cụ Loan',
        path: 'assets/characters/cu-loan/scene-worried.png',
        rect: npcBox(0.36, 0.70),
      },
    ];
  }

  if (areaId === 'c2-s3-phong-trien-lam-doi-dau') {
    const caNghiPath = solvedPuzzleIds.includes('p-c2-present-sketch')
      ? 'assets/characters/ca-nghi/scene-retreat.png'
      : solvedPuzzleIds.includes('p-c2-present-receipt')
        ? 'assets/characters/ca-nghi/scene-shocked.png'
        : 'assets/characters/ca-nghi/scene-stern.png';

    const loanPath = solvedPuzzleIds.includes('p-c2-styling-loan')
      ? 'assets/characters/cu-loan/scene-relieved.png'
      : solvedPuzzleIds.includes('p-c2-present-sketch')
        ? 'assets/characters/cu-loan/scene-determined.png'
        : 'assets/characters/cu-loan/scene-worried.png';

    return [
      {
        id: 'c2-s3-ca-nghi',
        name: 'Ông Cả Nghị',
        path: caNghiPath,
        rect: npcBox(0.75, 0.72),
      },
      {
        id: 'c2-s3-loan',
        name: 'Cụ Loan',
        path: loanPath,
        rect: npcBox(0.22, 0.72),
      },
    ];
  }

  return [];
}

export function c2ExitArrows(areaId: string): ExitArrow[] {
  if (areaId === 'c2-s1-gac-lung-ve-tranh') {
    return [{ exit: 'window', rect: { x: 0.88, y: 0.20, w: 0.10, h: 0.55 }, dir: 'right' }];
  }
  if (areaId === 'c2-s2-kho-vai-hang-dao') {
    return [
      { exit: 'back', rect: { x: 0.00, y: 0.45, w: 0.08, h: 0.45 }, dir: 'left' },
      { exit: 'hall', rect: { x: 0.92, y: 0.76, w: 0.08, h: 0.14 }, dir: 'right' },
    ];
  }
  if (areaId === 'c2-s3-phong-trien-lam-doi-dau') {
    return [{ exit: 'back', rect: { x: 0.00, y: 0.45, w: 0.08, h: 0.45 }, dir: 'left' }];
  }
  return [];
}

/** C3 static scene characters (Bà Mai, Thầy Ba Càn, Vinh, Bà Lớn) placed on the room floor per manifest sceneActors. */
export function c3RoomNpcs(
  chapterId: string,
  areaId: string,
  solvedPuzzleIds: string[],
  world: { w: number; h: number }
): RoomNpc[] {
  if (chapterId !== 'c3') return [];
  const W = world.w, H = world.h;
  const npcBox = (footNativeX: number, footNativeY: number, visibleW: number, visibleH: number): Box => {
    const footX = Math.round((footNativeX / 1672) * W);
    const footY = Math.round((footNativeY / 941) * H);
    const w = Math.round((visibleW / 1672) * W);
    const h = Math.round((visibleH / 941) * H);
    return {
      x: footX - Math.round(w / 2),
      y: footY - h,
      w,
      h,
    };
  };

  if (areaId === 'c3-s1-tiem-may-da-kao') {
    return [
      {
        id: 'c3-s1-mai',
        name: 'Bà Mai',
        path: 'assets/characters/ba-mai/scene-tailor.png',
        rect: npcBox(350, 790, 158, 519),
      },
    ];
  }

  if (areaId === 'c3-s2-phong-phong-thuy') {
    const canPath = solvedPuzzleIds.includes('p-c3-bagua-lock')
      ? 'assets/characters/thay-ba-can/scene-anxious.png'
      : 'assets/characters/thay-ba-can/scene-idle.png';
    return [
      {
        id: 'c3-s2-can',
        name: 'Thầy Ba Càn',
        path: canPath,
        rect: npcBox(580, 795, 164, 519),
      },
    ];
  }

  if (areaId === 'c3-s3-dinh-thu-doi-dau') {
    const vinhPath = solvedPuzzleIds.includes('p-c3-present-evidence')
      ? 'assets/characters/vinh/scene-witness.png'
      : 'assets/characters/vinh/scene-idle.png';

    const maiPath = solvedPuzzleIds.includes('p-c3-styling-mai')
      ? 'assets/characters/ba-mai/scene-relieved.png'
      : 'assets/characters/ba-mai/scene-speak.png';

    const baLonPath = solvedPuzzleIds.includes('p-c3-present-evidence')
      ? 'assets/characters/ba-lon/scene-reflective.png'
      : 'assets/characters/ba-lon/scene-stern.png';

    return [
      {
        id: 'c3-s3-vinh',
        name: 'Vinh',
        path: vinhPath,
        rect: npcBox(480, 820, 183, 519),
      },
      {
        id: 'c3-s3-mai',
        name: 'Bà Mai',
        path: maiPath,
        rect: npcBox(780, 825, 199, 519),
      },
      {
        id: 'c3-s3-ba-lon',
        name: 'Bà Lớn',
        path: baLonPath,
        rect: npcBox(1170, 820, 170, 519),
      },
    ];
  }

  return [];
}

export function c3ExitArrows(areaId: string): ExitArrow[] {
  if (areaId === 'c3-s1-tiem-may-da-kao') {
    return [{ exit: 'street', rect: { x: 0.90, y: 0.55, w: 0.08, h: 0.35 }, dir: 'right' }];
  }
  if (areaId === 'c3-s2-phong-phong-thuy') {
    return [
      { exit: 'back', rect: { x: 0.00, y: 0.55, w: 0.08, h: 0.35 }, dir: 'left' },
      { exit: 'mansion', rect: { x: 0.92, y: 0.55, w: 0.08, h: 0.35 }, dir: 'right' },
    ];
  }
  if (areaId === 'c3-s3-dinh-thu-doi-dau') {
    return [{ exit: 'back', rect: { x: 0.00, y: 0.55, w: 0.08, h: 0.35 }, dir: 'left' }];
  }
  return [];
}
/** Sprite sheets at An's spec share her art px and foot anchor (AN.anchor); the 128x128 cat has ~14 px under its paws. */
const CAT = { cell: 128, foot: { x: 64, y: 114 }, world: { x: 677, y: 458 }, height: 100, share: 0.26 };

/** Every layer of An for one sheet cell, composited once (native 176x416) and cached per layer set. Seen from
 *  behind, her back hair covers the bare head layer (same rule as the scene and the studio). */
const cells = new WeakMap<HTMLImageElement[], Map<number, HTMLCanvasElement>>();
export function anCell(layers: HTMLImageElement[], index: number): HTMLCanvasElement {
  let byIndex = cells.get(layers);
  if (!byIndex) cells.set(layers, byIndex = new Map());
  let cell = byIndex.get(index);
  if (!cell) {
    cell = document.createElement('canvas');
    cell.width = AN.cellWidth; cell.height = AN.cellHeight;
    const ctx = cell.getContext('2d')!, sx = index % AN.columns * AN.cellWidth, sy = Math.floor(index / AN.columns) * AN.cellHeight;
    const hair = AN.layers.indexOf('hair_back'), order = AN.layers.map((_, i) => i);
    const seq = index >= AN.directions.up ? order.filter(i => i !== hair).flatMap(i => AN.layers[i] === 'head' ? [i, hair] : [i]) : order;
    for (const i of seq) ctx.drawImage(layers[i], sx, sy, AN.cellWidth, AN.cellHeight, 0, 0, AN.cellWidth, AN.cellHeight);
    byIndex.set(index, cell);
  }
  return cell;
}

const outlines = new Map<string, { tint: HTMLCanvasElement; ring: HTMLCanvasElement }>();
/** Cream tint of the cutout plus its outline ring at device size, baked once per (area, id, size, thickness). */
function outlineFor(key: string, cutout: HTMLImageElement, w: number, h: number, px: number) {
  const id = `${key}|${w}x${h}|${px}`;
  let baked = outlines.get(id);
  if (!baked) {
    const tint = document.createElement('canvas');
    tint.width = w; tint.height = h;
    const ctx = tint.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; // nearest keeps the cutout alpha hard, so the ring stays crisp
    ctx.drawImage(cutout, 0, 0, w, h);
    const ring = bakeOutline(tint, w, h, palette.g, px);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = palette.c;
    ctx.fillRect(0, 0, w, h);
    baked = { tint, ring };
    outlines.set(id, baked);
  }
  return baked;
}

export function drawRoom(ctx: CanvasRenderingContext2D, assets: RoomAssets, areaId: string, f: RoomFrame) {
  const { k, t } = f;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, f.w, f.h);
  // Painted prologue art (c0-*), chapter 2 art (c2-*), and chapter 3 art (c3-*) are smoothed; chapter backgrounds are code-drawn pixel art and stay crisp.
  // The stage has the background's aspect, so it fills the canvas exactly.
  setSmoothing(ctx, areaId.startsWith('c0-') || areaId.startsWith('c2-') || areaId.startsWith('c3-'));
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.drawImage(assets.bg, 0, 0);
  if (assets.overlays) {
    for (const ov of assets.overlays) {
      if (ov.visible) ctx.drawImage(ov.img, 0, 0);
    }
  }
  // People and the cat, back to front by foot line. Scale comes from characterScale at each foot, so they shrink
  // toward the back wall; sprites at An's art spec are painted art and are drawn smoothed. Device pixels from here.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (f.scene) {
    const scene = f.scene, bgH = assets.bg.naturalHeight, an = f.an?.foot ?? null;
    const figure = (img: CanvasImageSource, w: number, h: number, anchor: Pt, foot: Pt, scale: number, hires: boolean) => {
      setSmoothing(ctx, hires);
      const s = scale * k;
      ctx.drawImage(img, Math.round(foot.x * k - anchor.x * s), Math.round(foot.y * k - anchor.y * s), Math.round(w * s), Math.round(h * s));
    };
    const draws: { y: number; draw: () => void }[] = [];
    if (an && f.an?.cell) { const cell = f.an.cell; draws.push({ y: an.y, draw: () => figure(cell, AN.cellWidth, AN.cellHeight, AN.anchor, an, characterScale(scene, bgH, an.y), true) }); }
    if (f.s1 && assets.cat) {
      const cat = assets.cat, foot = CAT.world, anH = AN_FIGURE_H * characterScale(scene, bgH, foot.y);
      draws.push({ y: foot.y, draw: () => figure(cat, cat.naturalWidth, cat.naturalHeight, CAT.foot, foot, CAT.share * anH / CAT.height, true) });
    }
    for (const { id, rect } of f.npcs) {
      const views = assets.npcs[id], foot = { x: rect.x + rect.w / 2, y: rect.y + rect.h };
      const img = views && ((an && views[npcView(foot, an, { w: assets.bg.naturalWidth, h: bgH })]) || views.front);
      if (!img) continue;
      draws.push({ y: foot.y, draw: () => {
        ctx.globalAlpha = (ROOM_NPCS[id]?.ghost || id.includes('ong-le')) ? .7 : 1; // ghosts are see-through
        const scale = scene === 'c3' ? 1.35 : characterScale(scene, bgH, foot.y) * spriteScaleFor(img);
        figure(img, img.naturalWidth, img.naturalHeight, AN.anchor, foot, scale, img.naturalHeight >= 128);
        ctx.globalAlpha = 1;
      } });
    }
    draws.sort((a, b) => a.y - b.y).forEach(d => d.draw());
  }
  setSmoothing(ctx, false);
  // Highlight layer, in device space (drawBrackets sets its own transform).
  const n = Math.max(2, Math.round(k)); // art-pixel scale: never below x2 so brackets and sparkles stay legible
  for (const box of f.all) drawBrackets(ctx, box, f.reduced ? 0 : t, n);
  const focus = f.focus;
  if (focus) {
    const cutout = assets.cutouts[focus.id];
    if (focus.useCutout && cutout) {
      const px = Math.max(3, Math.round(k * 2)), pad = outlinePad(px);
      const w = Math.max(1, Math.round(focus.world.w * k)), h = Math.max(1, Math.round(focus.world.h * k));
      const x = Math.round(focus.world.x * k), y = Math.round(focus.world.y * k);
      const lit = f.reduced || Math.floor(t / 400) % 2 === 0; // steps(2) pulse
      const { tint, ring } = outlineFor(`${areaId}/${focus.id}`, cutout, w, h, px);
      // The object itself lights up (screen blend reads on dark wood and pale cloth alike), then the ring.
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = lit ? .34 : .2;
      ctx.drawImage(tint, x, y);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = lit ? 1 : .7;
      ctx.drawImage(ring, x - pad, y - pad);
      ctx.globalAlpha = 1;
    } else drawBrackets(ctx, focus.hit, f.reduced ? 0 : t, n);
  }
  if (f.sparkle) drawSparkle(ctx, f.sparkle.x, f.sparkle.y, f.sparkle.frame, n);
}
