import { z } from 'zod';
import {
  ChapterContentSchema,
  ItemSchema,
  ClueSchema,
  CultureCardSchema,
  GarmentSchema,
  AccessorySchema,
  MotifSchema,
  type ChapterContent,
  type Item,
  type Clue,
  type CultureCard,
  type Garment,
  type Accessory,
  type Motif
} from './schema.ts';

import prologueJson from './chapters/prologue.json';
import c1Json from './chapters/c1.json';
import c2Json from './chapters/c2.json';
import c3Json from './chapters/c3.json';
import c4Json from './chapters/c4.json';
import c5Json from './chapters/c5.json';
import itemsJson from './items.json';
import cluesJson from './clues.json';
import cultureCardsJson from './culture-cards.json';
import studioJson from './studio.json';

export interface GameContent {
  chapters: Record<string, ChapterContent>;
  chapterOrder: string[];
  items: Item[];
  itemsById: Map<string, Item>;
  clues: Clue[];
  cluesById: Map<string, Clue>;
  cultureCards: CultureCard[];
  cultureCardsById: Map<string, CultureCard>;
  garments: Garment[];
  garmentsById: Map<string, Garment>;
  accessories: Accessory[];
  accessoriesById: Map<string, Accessory>;
  motifs: Motif[];
  motifsById: Map<string, Motif>;
}

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    chaptersCount: number;
    areasCount: number;
    interactablesCount: number;
    dialoguesCount: number;
    puzzlesCount: number;
    itemsCount: number;
    cluesCount: number;
    cultureCardsCount: number;
    garmentsCount: number;
    accessoriesCount: number;
    motifsCount: number;
  };
  missingAssets?: string[];
}

let cachedContent: GameContent | null = null;

export function loadContent(): GameContent {
  if (cachedContent) {
    return cachedContent;
  }

  // 1. Zod parse & validate raw content
  const prologue = ChapterContentSchema.parse(prologueJson);
  const c1 = ChapterContentSchema.parse(c1Json);
  const c2 = ChapterContentSchema.parse(c2Json);
  const c3 = ChapterContentSchema.parse(c3Json);
  const c4 = ChapterContentSchema.parse(c4Json);
  const c5 = ChapterContentSchema.parse(c5Json);

  const items = z.array(ItemSchema).parse(itemsJson);
  const clues = z.array(ClueSchema).parse(cluesJson);
  const cultureCards = z.array(CultureCardSchema).parse(cultureCardsJson);

  const studioSchema = z.object({
    garments: z.array(GarmentSchema),
    accessories: z.array(AccessorySchema),
    motifs: z.array(MotifSchema)
  });
  const studio = studioSchema.parse(studioJson);
  for (const chapter of [prologue, c1, c2, c3, c4, c5]) {
    for (const puzzle of chapter.puzzles) {
      if (puzzle.type !== 'styling' || !puzzle.loanWardrobe) continue;
      if (puzzle.loanWardrobe.garmentIds.some(id => !studio.garments.some(g => g.id === id))
        || puzzle.loanWardrobe.accessoryIds.some(id => !studio.accessories.some(a => a.id === id))) {
        throw new Error(`Unknown catalog reference in ${puzzle.id} loan wardrobe`);
      }
    }
  }

  const chapters: Record<string, ChapterContent> = {
    prologue,
    c1,
    c2,
    c3,
    c4,
    c5
  };

  cachedContent = {
    chapters,
    chapterOrder: ['prologue', 'c1', 'c2', 'c3', 'c4', 'c5'],
    items,
    itemsById: new Map(items.map((i) => [i.id, i])),
    clues,
    cluesById: new Map(clues.map((c) => [c.id, c])),
    cultureCards,
    cultureCardsById: new Map(cultureCards.map((c) => [c.id, c])),
    garments: studio.garments,
    garmentsById: new Map(studio.garments.map((g) => [g.id, g])),
    accessories: studio.accessories,
    accessoriesById: new Map(studio.accessories.map((a) => [a.id, a])),
    motifs: studio.motifs,
    motifsById: new Map(studio.motifs.map((m) => [m.id, m]))
  };

  return cachedContent;
}

export function validateContent(): ValidationReport {
  const content = loadContent();
  const errors: string[] = [];
  const warnings: string[] = [];

  const allAreaIds = new Set<string>();
  const allInteractableIds = new Set<string>();
  const allDialogueIds = new Set<string>();
  const allPuzzleIds = new Set<string>();
  const allItemIds = new Set<string>();
  const allClueIds = new Set<string>();

  let areasCount = 0;
  let interactablesCount = 0;
  let dialoguesCount = 0;
  let puzzlesCount = 0;

  // 1. Check duplicate IDs for Items
  for (const item of content.items) {
    if (allItemIds.has(item.id)) {
      errors.push(`Duplicate item ID: ${item.id}`);
    }
    allItemIds.add(item.id);
  }

  // 2. Check duplicate IDs for Clues
  for (const clue of content.clues) {
    if (allClueIds.has(clue.id)) {
      errors.push(`Duplicate clue ID: ${clue.id}`);
    }
    allClueIds.add(clue.id);
  }

  // Map to count how many dialogues emit each clue
  const clueEmittedInDialogues = new Map<string, string[]>();

  // 3. Scan chapters, areas, dialogues, puzzles
  for (const chId of content.chapterOrder) {
    const ch = content.chapters[chId];
    if (!ch) {
      errors.push(`Chapter ${chId} not found in content`);
      continue;
    }

    // Register dialogues
    for (const d of ch.dialogues) {
      if (allDialogueIds.has(d.id)) {
        errors.push(`Duplicate dialogue ID: ${d.id}`);
      }
      allDialogueIds.add(d.id);
      dialoguesCount++;

      for (const node of d.nodes) {
        if (node.clueId) {
          if (!content.cluesById.has(node.clueId)) {
            errors.push(`Dialogue ${d.id} references non-existent clueId: ${node.clueId}`);
          }
          const list = clueEmittedInDialogues.get(node.clueId) ?? [];
          list.push(d.id);
          clueEmittedInDialogues.set(node.clueId, list);
        }
      }
    }

    // Register puzzles
    for (const p of ch.puzzles) {
      if (allPuzzleIds.has(p.id)) {
        errors.push(`Duplicate puzzle ID: ${p.id}`);
      }
      allPuzzleIds.add(p.id);
      puzzlesCount++;

      // Validate puzzle solution validity
      switch (p.type) {
        case 'find':
          if (!p.solution.points || p.solution.points.length === 0) {
            errors.push(`Puzzle ${p.id} (find) has empty solution points`);
          }
          break;
        case 'code':
          if (!p.solution.combination) {
            errors.push(`Puzzle ${p.id} (code) has empty combination`);
          }
          break;
        case 'present':
          if (!allItemIds.has(p.solution.presentedItemId)) {
            errors.push(`Puzzle ${p.id} (present) requires non-existent item: ${p.solution.presentedItemId}`);
          }
          break;
        case 'styling':
          if (!content.garmentsById.has(p.solution.garmentId)) {
            errors.push(`Puzzle ${p.id} (styling) requires non-existent garment: ${p.solution.garmentId}`);
          }
          break;
        case 'use':
          if (p.solution.requiredItemId && !allItemIds.has(p.solution.requiredItemId)) {
            errors.push(`Puzzle ${p.id} (use) requires non-existent item: ${p.solution.requiredItemId}`);
          }
          if (p.solution.requiredItemIds) {
            for (const rId of p.solution.requiredItemIds) {
              if (!allItemIds.has(rId)) {
                errors.push(`Puzzle ${p.id} (use) requires non-existent item: ${rId}`);
              }
            }
          }
          break;
        case 'order':
          if (p.solution.requiredItemIds) {
            for (const rId of p.solution.requiredItemIds) {
              if (!allItemIds.has(rId)) {
                errors.push(`Puzzle ${p.id} (order) requires non-existent item: ${rId}`);
              }
            }
          }
          break;
      }
    }

    // Register and check areas
    for (const area of ch.areas) {
      if (allAreaIds.has(area.id)) {
        errors.push(`Duplicate area ID: ${area.id}`);
      }
      allAreaIds.add(area.id);
      areasCount++;

      for (const it of area.interactables) {
        if (allInteractableIds.has(it.id)) {
          errors.push(`Duplicate interactable ID: ${it.id} in area ${area.id}`);
        }
        allInteractableIds.add(it.id);
        interactablesCount++;

        // Rule: area không có mặt trái thì không có interactable side "trai"
        if (!area.sides.trai && it.side === 'trai') {
          errors.push(`Area ${area.id} has sides.trai = false but contains interactable ${it.id} with side = 'trai'`);
        }

        // Rule: mọi interactable trỏ tới dialogue/puzzle/item tồn tại
        if (it.action.type === 'dialogue') {
          if (!allDialogueIds.has(it.action.targetId) && !ch.dialogues.some(d => d.id === it.action.targetId)) {
            errors.push(`Interactable ${it.id} references non-existent dialogue: ${it.action.targetId}`);
          }
        } else if (it.action.type === 'puzzle') {
          if (!allPuzzleIds.has(it.action.targetId) && !ch.puzzles.some(p => p.id === it.action.targetId)) {
            errors.push(`Interactable ${it.id} references non-existent puzzle: ${it.action.targetId}`);
          }
        } else if (it.action.type === 'item') {
          if (!allItemIds.has(it.action.targetId)) {
            errors.push(`Interactable ${it.id} references non-existent item: ${it.action.targetId}`);
          }
        }
      }
    }
  }

  // 4. Rule: mọi clue được phát ra từ đúng một dialogue
  for (const clue of content.clues) {
    const list = clueEmittedInDialogues.get(clue.id) ?? [];
    if (list.length === 0) {
      errors.push(`Clue ${clue.id} is not emitted by any dialogue node`);
    } else if (list.length > 1) {
      errors.push(`Clue ${clue.id} is emitted by multiple dialogues: ${list.join(', ')}`);
    }
  }

  // 5. Rule: item dùng ở đâu cũng phải được nhận ở đâu đó trước đó trong cùng chương hoặc chương trước
  const itemsGrantedInTimeline = new Set<string>();
  // Pre-seed default starter items if any (e.g. scissors from prologue or toolset)
  itemsGrantedInTimeline.add('keo_may_bang_dong'); // carried from sewing kit

  for (const chId of content.chapterOrder) {
    const ch = content.chapters[chId];
    if (!ch) continue;

    // Items granted by interactable direct pickup in this chapter
    for (const area of ch.areas) {
      for (const it of area.interactables) {
        if (it.action.type === 'item') {
          itemsGrantedInTimeline.add(it.action.targetId);
        }
      }
    }

    // Support crafting/combining: con thoi + that lung -> dung cu moc then cua
    if (itemsGrantedInTimeline.has('con_thoi_go_mun') && itemsGrantedInTimeline.has('that_lung_lua_cham')) {
      itemsGrantedInTimeline.add('dung_cu_moc_then_cua');
    }

    // Items granted by puzzle rewards in this chapter
    for (const p of ch.puzzles) {
      const sol = p.solution as any;
      if (sol?.rewardItemId) itemsGrantedInTimeline.add(sol.rewardItemId);
      if (sol?.rewardItemIds) {
        for (const rid of sol.rewardItemIds) itemsGrantedInTimeline.add(rid);
      }

      // Check required items
      if (sol?.requiredItemId && !itemsGrantedInTimeline.has(sol.requiredItemId)) {
        errors.push(`Puzzle ${p.id} requires item ${sol.requiredItemId} before it is obtained in chapter ${chId}`);
      }
      if (sol?.requiredItemIds) {
        for (const reqId of sol.requiredItemIds) {
          if (!itemsGrantedInTimeline.has(reqId)) {
            errors.push(`Puzzle ${p.id} requires item ${reqId} before it is obtained in chapter ${chId}`);
          }
        }
      }
      if (sol?.presentedItemId && !itemsGrantedInTimeline.has(sol.presentedItemId)) {
        errors.push(`Puzzle ${p.id} (present) presents item ${sol.presentedItemId} before it is obtained in chapter ${chId}`);
      }
    }
  }

  // 6. Optional check: data/asset-manifest.json (if present, report missing assets without modifying file)
  const missingAssets: string[] = [];
  try {
    // Only attempt in Node environments
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fs = (globalThis as any).require ? (globalThis as any).require('fs') : null;
      if (fs && fs.existsSync('data/asset-manifest.json')) {
        const raw = fs.readFileSync('data/asset-manifest.json', 'utf-8');
        const manifest = JSON.parse(raw);
        const manifestAssetIds = new Set(Array.isArray(manifest) ? manifest.map((a: any) => a.id) : Object.keys(manifest));
        for (const itId of allInteractableIds) {
          if (!manifestAssetIds.has(itId)) {
            missingAssets.push(`interactable:${itId}`);
          }
        }
      }
    }
  } catch {
    // Non-blocking
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingAssets: missingAssets.length > 0 ? missingAssets : undefined,
    stats: {
      chaptersCount: content.chapterOrder.length,
      areasCount,
      interactablesCount,
      dialoguesCount,
      puzzlesCount,
      itemsCount: content.items.length,
      cluesCount: content.clues.length,
      cultureCardsCount: content.cultureCards.length,
      garmentsCount: content.garments.length,
      accessoriesCount: content.accessories.length,
      motifsCount: content.motifs.length
    }
  };
}
