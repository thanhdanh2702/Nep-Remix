import { z } from 'zod';

// ==========================================
// 1. Literal ID Unions Derived from Content
// ==========================================

export const ChapterIdSchema = z.enum([
  'prologue',
  'c1',
  'c2',
  'c3',
  'c4',
  'c5'
]);
export type ChapterId = z.infer<typeof ChapterIdSchema>;

export const AreaIdSchema = z.enum([
  'c0-s1-tiem-may-chieu',
  'c0-s2-gac-xep-chiec-ruong',
  'c1-s1-buong-det-khoa-kin',
  'c1-s2-ban-tho-nha-tho-ho',
  'c1-s3-cong-dinh-doi-dau',
  'c2-s1-gac-lung-ve-tranh',
  'c2-s2-kho-vai-hang-dao',
  'c2-s3-phong-trien-lam-doi-dau',
  'c3-s1-tiem-may-da-kao',
  'c3-s2-phong-phong-thuy',
  'c3-s3-dinh-thu-doi-dau',
  'c4-s1-can-ho-tap-the',
  'c4-s2-tu-duong-ho-nguyen',
  'c4-s3-san-tu-duong-doi-dau',
  'c5-s1-tiem-may-bao-mang',
  'c5-s2-tran-dia-chi-vang',
  'c5-s3-doi-chat-hoi-sinh'
]);
export type AreaId = z.infer<typeof AreaIdSchema>;

export const ItemIdSchema = z.enum([
  'phan_may_mau_xanh',
  'kim_gut_bang_bac',
  'chia_khoa_dong_ba_chau',
  'thuoc_go_tho_may_1888',
  'con_thoi_go_mun',
  'that_lung_lua_cham',
  'dung_cu_moc_then_cua',
  'keo_may_bang_dong',
  'buc_thu_tay_chong_cu_Cam',
  'to_van_tu_cam_co_dat',
  'manh_ban_ve_ao_dai_1',
  'manh_ban_ve_ao_dai_2',
  'manh_ban_ve_ao_dai_3',
  'manh_ban_ve_ao_dai_4',
  'ban_ve_ao_dai_tan_thoi',
  'chia_khoa_ket_sat_bang_thau',
  'bien_lai_tra_no_goc_1935',
  'ban_giao_keo_ep_hon',
  'bua_chu_tru_yeu_1',
  'bua_chu_tru_yeu_2',
  'bien_nhan_tien_thay_boi',
  'so_tu_vi_nguyen_ban_1962',
  'thu_tay_thoa_thuan_boi_toan',
  'nam_cham_loa_dai',
  'kim_theu_thep',
  'cuon_chi_to_dao',
  'chiec_ao_dai_cuoi_vai_phin',
  'cac_trang_gia_pha_goc_bi_xe',
  'ho_so_giam_dinh_y_phuc_2026'
]);
export type ItemId = z.infer<typeof ItemIdSchema>;

export const ClueIdSchema = z.enum([
  'clue-ba-dan-do',
  'clue-tiet-hanh-kha-phong',
  'clue-thu-chong-cu-cam',
  'clue-van-tu-ban-dat',
  'clue-ban-ve-lemur-mat-ma',
  'clue-bien-lai-goc-1935',
  'clue-giao-keo-ep-hon',
  'clue-mua-chuoc-thay-boi',
  'clue-bagua-hint',
  'clue-so-tu-vi-goc',
  'clue-thoa-thuan-boi-toan',
  'clue-ao-cuoi-vai-phin',
  'clue-nam-1845',
  'clue-cong-duc-cu-loan-ba-mai',
  'clue-ao-nhai-livestream',
  'clue-ho-so-giam-dinh-2026'
]);
export type ClueId = z.infer<typeof ClueIdSchema>;

export const DialogueIdSchema = z.enum([
  'd-c0-cat',
  'd-c0-stairs',
  'd-c0-mirror',
  'd-c0-wall-key',
  'd-c0-hoop',
  'd-c0-ong-le-whisper',
  'd-c0-ba-dan-do',
  'd-c1-porridge',
  'd-c1-locked-door',
  'd-c1-tiet-hanh',
  'd-c1-incense',
  'd-c1-thu-chong',
  'd-c1-van-tu',
  'd-c1-giai-phong',
  'd-c1-gate-exit',
  'd-c2-ca-nghi',
  'd-c2-mat-ma',
  'd-c2-silk-shelves',
  'd-c2-bien-lai',
  'd-c2-giao-keo',
  'd-c3-gramophone',
  'd-c3-street-exit',
  'd-c3-incense-smoke',
  'd-c3-bagua',
  'd-c3-mua-chuoc',
  'd-c3-so-tu-vi',
  'd-c3-thoa-thuan',
  'd-c3-vinh-stand',
  'd-c3-ong-le-defeat',
  'd-c4-nam-1845',
  'd-c4-altar-incense',
  'd-c4-ao-cuoi',
  'd-c4-cong-duc',
  'd-c4-uncle-suu',
  'd-c4-patriarch-defeat',
  'd-c5-cat-audio',
  'd-c5-livestream',
  'd-c5-stairway',
  'd-c5-cam-spirit',
  'd-c5-loan-spirit',
  'd-c5-mai-spirit',
  'd-c5-phuong-spirit',
  'd-c5-an-center',
  'd-c5-ho-so',
  'd-c5-lam-apology'
]);
export type DialogueId = z.infer<typeof DialogueIdSchema>;

export const PuzzleIdSchema = z.enum([
  'p-c0-cloth',
  'p-c0-mannequin-hand',
  'p-c0-chest-unlock',
  'p-c1-escape',
  'p-c1-altar-cut-threads',
  'p-c1-present-contract',
  'p-c1-present-letter',
  'p-c1-styling-cam',
  'p-c2-sketch-assemble',
  'p-c2-safe-open',
  'p-c2-present-receipt',
  'p-c2-present-sketch',
  'p-c2-styling-loan',
  'p-c3-bagua-lock',
  'p-c3-present-evidence',
  'p-c3-styling-mai',
  'p-c4-magnet-needle',
  'p-c4-embroider-flower',
  'p-c4-chest-code-1845',
  'p-c4-present-genealogy',
  'p-c4-styling-phuong',
  'p-c5-scanner-diagnose',
  'p-c5-golden-weave-matrix',
  'p-c5-present-dossier',
  'p-c5-styling-an'
]);
export type PuzzleId = z.infer<typeof PuzzleIdSchema>;

export const InteractableIdSchema = z.enum([
  // prologue
  'hitbox-cat',
  'hitbox-stairs',
  'hitbox-table',
  'hitbox-mirror',
  'hitbox-chest-cloth',
  'hitbox-wall-key',
  'hitbox-sewing-basket',
  'hitbox-mannequin-hand',
  'hitbox-chest-lock',
  'hitbox-sewing-hoop',
  'vfx-ong-le-shadow',
  // c1
  'hitbox-loom-shuttle',
  'hitbox-belt-rack',
  'hitbox-cold-porridge',
  'hitbox-front-door',
  'hitbox-back-window',
  'hitbox-honor-plaque',
  'hitbox-incense-burner',
  'hitbox-ancestor-altar',
  'hitbox-village-officials',
  'hitbox-ong-le-entity',
  'hitbox-stone-step',
  'hitbox-styling-cam',
  'hitbox-village-gate-exit',
  // c2
  'hitbox-drawing-desk',
  'hitbox-fabric-basket',
  'hitbox-gas-lamp',
  'hitbox-french-window',
  'hitbox-drawing-easel',
  'hitbox-grandfather-clock',
  'hitbox-silk-shelves',
  'hitbox-iron-safe',
  'hitbox-reporters-crowd',
  'hitbox-ong-le-shadow',
  'hitbox-exhibition-podium',
  // c3
  'hitbox-gramophone',
  'hitbox-bonsai-pot',
  'hitbox-sewing-machine-base',
  'hitbox-fabric-attic',
  'hitbox-street-exit',
  'hitbox-incense-bowl',
  'hitbox-bagua-mirror',
  'hitbox-bagua-chest',
  'hitbox-salon-table',
  'hitbox-vinh-support',
  'hitbox-ong-le-crystal',
  'hitbox-styling-mai',
  // c4
  'hitbox-cassette-player',
  'hitbox-floor-crack',
  'hitbox-yarn-basket',
  'hitbox-phin-fabric',
  'hitbox-roof-beam',
  'hitbox-altar-incense',
  'hitbox-pedestal-chest',
  'hitbox-uncle-suu',
  'hitbox-ancestral-stone-step',
  'hitbox-ong-le-patriarch',
  'hitbox-styling-phuong',
  // c5
  'hitbox-cat-nep-keyboard',
  'hitbox-livestream-screen',
  'hitbox-digital-workshop-scanner',
  'hitbox-attic-stairway',
  'hitbox-ancestor-east',
  'hitbox-ancestor-south',
  'hitbox-ancestor-west',
  'hitbox-ancestor-north',
  'hitbox-an-center',
  'hitbox-golden-matrix',
  'hitbox-led-screen',
  'hitbox-lam-confession',
  'hitbox-catwalk-an'
]);
export type InteractableId = z.infer<typeof InteractableIdSchema>;

export const GarmentIdSchema = z.enum([
  'ao-tu-than',
  'ao-ngu-than-tay-chen',
  'ao-ngu-than-tay-thung',
  'ao-dai-lemur',
  'ao-dai-tan-thoi-vang-mo-ga',
  'ao-dai-raglan',
  'ao-dai-co-thuyen',
  'ao-dai-cuoi-phin',
  'ao-dai-popolin',
  'ao-ngu-than-remix-2026'
]);
export type GarmentId = z.infer<typeof GarmentIdSchema>;

export const AccessoryIdSchema = z.enum([
  'khan-van-den',
  'khan-van-hoang-yen',
  'khan-mo-qua',
  'non-quai-thao',
  'non-la',
  'guoc-moc',
  'hai-theu',
  'kieng-bac',
  'kinh-mat-meo',
  'quat-lua'
]);
export type AccessoryId = z.infer<typeof AccessoryIdSchema>;

export const MotifIdSchema = z.enum([
  'motif-hoa-cuc-day',
  'motif-chim-phuong-von-may',
  'motif-hoa-sen-lien-hoa'
]);
export type MotifId = z.infer<typeof MotifIdSchema>;

export const EventIdSchema = z.enum([
  'tet',
  'dam_cuoi',
  'be_giang',
  'le_chua',
  'vieng_tang',
  'dao_pho'
]);
export type EventId = z.infer<typeof EventIdSchema>;

export const CultureCardIdSchema = z.enum([
  'ao-tu-than',
  'ao-ngu-than-tay-chen',
  'ao-ngu-than-tay-thung',
  'ao-dai-tan-thoi-lemur',
  'trang-phuc-hon-le-truyen-thong',
  'trang-phuc-tang-le-truyen-thong',
  'ao-nhat-binh',
  'ao-giao-linh',
  'ao-yem',
  'ao-dai-tay-raglan',
  'ao-ba-ba',
  'trang-phuc-hau-dong-tho-mau',
  'card-tiem-may-nep-origins',
  'card-ngu-than-nguyen-dynasty',
  'card-hu-tuc-ep-thu-tiet',
  'card-phong-trao-ao-dai-lemur-1934',
  'card-hu-tuc-tao-hon-ep-duyen',
  'card-ky-thuat-ao-dai-raglan-1960',
  'card-phe-phan-hu-tuc-boi-toan',
  'card-ao-dai-thoi-bao-cap-1980',
  'card-phe-phan-trong-nam-khinh-nu',
  'card-viet-phuc-remix-tuong-lai',
  'card-tong-ket-nam-the-he-phu-nu'
]);
export type CultureCardId = z.infer<typeof CultureCardIdSchema>;

// ==========================================
// 2. Core Entities Schemas
// ==========================================

export const NormalizedCoordSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1)
});

export const NormalizedRectSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1)
});

export const InteractableActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dialogue'),
    targetId: DialogueIdSchema
  }),
  z.object({
    type: z.literal('puzzle'),
    targetId: PuzzleIdSchema
  }),
  z.object({
    type: z.literal('item'),
    targetId: ItemIdSchema
  })
]);
export type InteractableAction = z.infer<typeof InteractableActionSchema>;

export const RequirementSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('puzzleSolved'), puzzleId: PuzzleIdSchema }),
  z.object({ kind: z.literal('dialogueCompleted'), dialogueId: DialogueIdSchema }),
  z.object({ kind: z.literal('itemOwned'), itemId: ItemIdSchema })
]);
export const GateSchema = z.object({ all: z.array(RequirementSchema) });
export type Requirement = z.infer<typeof RequirementSchema>;
export type Gate = z.infer<typeof GateSchema>;

export const InteractableSchema = z.object({
  id: InteractableIdSchema,
  kind: z.enum(['npc', 'object']),
  pos: NormalizedCoordSchema,
  radius: z.number().min(0).max(1),
  rect: NormalizedRectSchema.optional(),
  side: z.enum(['phai', 'trai', 'ca_hai']),
  when: GateSchema.optional(),
  action: InteractableActionSchema
});
export type Interactable = z.infer<typeof InteractableSchema>;

export const ExitArrowSchema = z.object({
  exit: z.string(),
  rect: NormalizedRectSchema,
  dir: z.enum(['left', 'right', 'up', 'down']),
  via: InteractableIdSchema.optional()
});
export type ExitArrow = z.infer<typeof ExitArrowSchema>;

export const AreaSchema = z.object({
  id: AreaIdSchema,
  chapterId: ChapterIdSchema,
  title: z.string(),
  aspect: z.enum(['8:5', '16:9']),
  /** Background size in art px; the room engine reads the real size from the background image. */
  logicalSize: z.object({
    w: z.number().int().positive(),
    h: z.number().int().positive()
  }),
  notes: z.string().optional(),
  spawn: NormalizedCoordSchema,
  sides: z.object({
    phai: z.literal(true),
    trai: z.boolean()
  }),
  exits: z.record(z.string(), z.string()),
  exitGates: z.record(z.string(), GateSchema).optional(),
  /** Point-and-click exit arrows; `via` routes the click through an interactable (e.g. a dialogue before the stairs). */
  exitArrows: z.array(ExitArrowSchema).optional(),
  interactables: z.array(InteractableSchema)
}).superRefine((area, ctx) => {
  for (const arrow of area.exitArrows ?? []) {
    if (!(arrow.exit in area.exits)) ctx.addIssue({ code: 'custom', message: `Exit arrow '${arrow.exit}' is not in exits of '${area.id}'.` });
    if (arrow.via && !area.interactables.some(i => i.id === arrow.via)) ctx.addIssue({ code: 'custom', message: `Exit arrow via '${arrow.via}' is not an interactable of '${area.id}'.` });
  }
});
export type Area = z.infer<typeof AreaSchema>;

export const DialogueChoiceSchema = z.object({
  text: z.string(),
  nextNodeId: z.string().optional()
});

export const DialogueNodeSchema = z.object({
  id: z.string(),
  text: z.string(),
  choices: z.array(DialogueChoiceSchema).optional(),
  clueId: ClueIdSchema.optional(),
  nextNodeId: z.string().optional()
});

export const DialogueSchema = z.object({
  id: DialogueIdSchema,
  speaker: z.string(),
  when: GateSchema.optional(),
  nodes: z.array(DialogueNodeSchema).nonempty()
});
export type Dialogue = z.infer<typeof DialogueSchema>;

export const ClueSchema = z.object({
  id: ClueIdSchema,
  chapterId: ChapterIdSchema,
  title: z.string(),
  description: z.string(),
  discoveredInDialogueId: DialogueIdSchema
});
export type Clue = z.infer<typeof ClueSchema>;

export const PuzzleBaseSchema = z.object({
  id: PuzzleIdSchema,
  title: z.string(),
  hasSession: z.boolean(),
  when: GateSchema.optional(),
  prerequisitePuzzleIds: z.array(PuzzleIdSchema).optional(),
  hints: z.tuple([z.string(), z.string(), z.string()])
});

export const FindPuzzleSchema = PuzzleBaseSchema.extend({
  type: z.literal('find'),
  solution: z.object({
    points: z.array(z.string()),
    rewardItemId: ItemIdSchema.optional(),
    dialogueTriggerId: DialogueIdSchema.optional()
  })
});

export const UsePuzzleSchema = PuzzleBaseSchema.extend({
  type: z.literal('use'),
  solution: z.object({
    action: z.string().optional(),
    requiredItemId: ItemIdSchema.optional(),
    requiredItemIds: z.array(ItemIdSchema).optional(),
    rewardItemId: ItemIdSchema.optional(),
    rewardItemIds: z.array(ItemIdSchema).optional(),
    dialogueTriggerId: DialogueIdSchema.optional(),
    dialogueTriggerIds: z.array(DialogueIdSchema).optional(),
    unlocksAreaId: AreaIdSchema.optional()
  })
});

export const CodePuzzleSchema = PuzzleBaseSchema.extend({
  type: z.literal('code'),
  solution: z.object({
    combination: z.string(),
    rewardItemId: ItemIdSchema.optional(),
    rewardItemIds: z.array(ItemIdSchema).optional(),
    dialogueTriggerId: DialogueIdSchema.optional(),
    dialogueTriggerIds: z.array(DialogueIdSchema).optional()
  })
});

export const OrderPuzzleSchema = PuzzleBaseSchema.extend({
  type: z.literal('order'),
  solution: z.object({
    sequence: z.array(z.string()).optional(),
    requiredItemIds: z.array(ItemIdSchema).optional(),
    rewardItemId: ItemIdSchema.optional(),
    dialogueTriggerId: DialogueIdSchema.optional(),
    unlocksAreaId: AreaIdSchema.optional()
  })
});

export const PresentPuzzleSchema = PuzzleBaseSchema.extend({
  type: z.literal('present'),
  solution: z.object({
    presentedItemId: ItemIdSchema
  })
});

export const StylingPuzzleSchema = PuzzleBaseSchema.extend({
  type: z.literal('styling'),
  solution: z.object({
    silhouette: z.string(),
    garmentId: GarmentIdSchema,
    headwearId: AccessoryIdSchema.optional(),
    jewelryId: AccessoryIdSchema.optional(),
    footwearId: AccessoryIdSchema.optional(),
    handheldId: AccessoryIdSchema.optional()
  })
});

export const PuzzleSchema = z.discriminatedUnion('type', [
  FindPuzzleSchema,
  UsePuzzleSchema,
  CodePuzzleSchema,
  OrderPuzzleSchema,
  PresentPuzzleSchema,
  StylingPuzzleSchema
]);
export type Puzzle = z.infer<typeof PuzzleSchema>;

export const ItemSchema = z.object({
  id: ItemIdSchema,
  name: z.string(),
  description: z.string(),
  category: z.enum(['tool', 'key', 'material', 'evidence', 'puzzle_piece', 'relic', 'garment']),
  consumable: z.boolean(),
  icon: z.string()
});
export type Item = z.infer<typeof ItemSchema>;

export const GarmentSchema = z.object({
  id: GarmentIdSchema,
  name: z.string(),
  silhouette: z.enum(['tu_than', 'ngu_than_tay_chen', 'ngu_than_tay_thung', 'tan_thoi']),
  historicalPeriod: z.enum(['thoi_le', 'thoi_nguyen', 'nam_1934', 'hien_dai']),
  defaultColorPalette: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  supportedEvents: z.array(EventIdSchema),
  culturalSummary: z.string(),
  spriteBasePath: z.string()
});
export type Garment = z.infer<typeof GarmentSchema>;

export const AccessorySchema = z.object({
  id: AccessoryIdSchema,
  name: z.string(),
  category: z.enum(['headwear', 'footwear', 'handheld', 'jewelry']),
  senNgocPrice: z.number().int().min(0),
  culturalNote: z.string(),
  genderCompatibility: z.enum(['male', 'female', 'unisex'])
});
export type Accessory = z.infer<typeof AccessorySchema>;

export const MotifSchema = z.object({
  id: MotifIdSchema,
  name: z.string(),
  category: z.string(),
  culturalSummary: z.string()
});
export type Motif = z.infer<typeof MotifSchema>;

export const CultureCardSchema = z.object({
  id: CultureCardIdSchema,
  title: z.string(),
  timePeriod: z.string(),
  historicalFact: z.string(),
  officialName: z.string().optional(),
  folkName: z.string().optional()
});
export type CultureCard = z.infer<typeof CultureCardSchema>;

export const RewardSchema = z.object({
  id: z.string(),
  chapterId: ChapterIdSchema,
  senNgoc: z.number().int().min(0),
  itemIds: z.array(ItemIdSchema).optional(),
  garmentIds: z.array(GarmentIdSchema).optional(),
  accessoryIds: z.array(AccessoryIdSchema).optional(),
  cardIds: z.array(CultureCardIdSchema).optional()
});
export type Reward = z.infer<typeof RewardSchema>;

export const ChapterMetaSchema = z.object({
  id: ChapterIdSchema,
  title: z.string(),
  year: z.number().int(),
  historicalPeriod: z.enum(['thoi_le', 'thoi_nguyen', 'nam_1934', 'hien_dai']),
  summary: z.string(),
  /** Dialogue whose completion (after every puzzle is solved) ends the chapter; the UI then runs chapter/complete + reward/claim. */
  completionDialogueId: DialogueIdSchema.optional(),
  reward: RewardSchema
});
export type ChapterMeta = z.infer<typeof ChapterMetaSchema>;

export const ChapterContentSchema = z.object({
  chapter: ChapterMetaSchema,
  areas: z.array(AreaSchema),
  dialogues: z.array(DialogueSchema),
  puzzles: z.array(PuzzleSchema)
}).superRefine((chapter, ctx) => {
  const error = (message: string) => ctx.addIssue({ code: 'custom', message });
  const puzzles = new Set<string>(chapter.puzzles.map(p => p.id));
  const dialogues = new Set<string>(chapter.dialogues.map(d => d.id));
  const areas = new Set<string>(chapter.areas.map(a => a.id));
  const dependencies = new Map<string, string[]>();
  const checkGate = (owner: string, gate?: Gate) => {
    const deps = dependencies.get(owner) ?? [];
    for (const requirement of gate?.all ?? []) {
      if (requirement.kind === 'puzzleSolved') {
        if (!puzzles.has(requirement.puzzleId)) error(`${owner}: foreign puzzle requirement ${requirement.puzzleId}`);
        deps.push(requirement.puzzleId);
      } else if (requirement.kind === 'dialogueCompleted') {
        if (!dialogues.has(requirement.dialogueId)) error(`${owner}: foreign dialogue requirement ${requirement.dialogueId}`);
        deps.push(requirement.dialogueId);
      }
    }
    dependencies.set(owner, deps);
  };
  for (const puzzle of chapter.puzzles) {
    checkGate(puzzle.id, puzzle.when);
    checkGate(puzzle.id, { all: (puzzle.prerequisitePuzzleIds ?? []).map(puzzleId => ({kind: 'puzzleSolved', puzzleId})) });
    const solution = puzzle.solution as { requiredItemIds?: string[]; points?: string[]; dialogueTriggerId?: string; dialogueTriggerIds?: string[]; unlocksAreaId?: string };
    for (const values of [solution.requiredItemIds, solution.points]) {
      if (values && (!values.length || new Set(values).size !== values.length)) error(`${puzzle.id}: solution must be nonempty and unique`);
    }
    for (const id of [solution.dialogueTriggerId, ...(solution.dialogueTriggerIds ?? [])]) if (id && !dialogues.has(id)) error(`${puzzle.id}: foreign dialogue trigger ${id}`);
    if (solution.unlocksAreaId && !areas.has(solution.unlocksAreaId)) error(`${puzzle.id}: foreign area unlock`);
  }
  for (const dialogue of chapter.dialogues) {
    checkGate(dialogue.id, dialogue.when);
    const nodes = new Set(dialogue.nodes.map(n => n.id));
    if (nodes.size !== dialogue.nodes.length) error(`${dialogue.id}: duplicate node`);
    for (const node of dialogue.nodes) for (const id of [node.nextNodeId, ...(node.choices ?? []).map(c => c.nextNodeId)]) if (id && !nodes.has(id)) error(`${dialogue.id}: invalid node link ${id}`);
  }
  for (const area of chapter.areas) {
    if (area.chapterId !== chapter.chapter.id) error(`${area.id}: wrong chapter`);
    for (const [key, gate] of Object.entries(area.exitGates ?? {})) {
      if (!area.exits[key] || !areas.has(area.exits[key])) error(`${area.id}: invalid gated exit ${key}`);
      checkGate(`${area.id}/${key}`, gate);
    }
    for (const hotspot of area.interactables) checkGate(hotspot.id, hotspot.when);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) { error(`Cyclic gate dependency at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of dependencies.get(id) ?? []) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const id of dependencies.keys()) visit(id);
});
export type ChapterContent = z.infer<typeof ChapterContentSchema>;
