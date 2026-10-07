import type { ChapterId } from '../content/schema.ts';
import type { GameContent } from '../content/index.ts';

// ==========================================
// 1. Session Drafts (Studio & Puzzle)
// ==========================================

export interface StudioDraft {
  type: 'studio';
  /** Revalidated against the current room/gate; never an ownership grant. */
  challengePuzzleId?: string;
  eventContextId?: string;
  silhouette: 'tu_than' | 'ngu_than_tay_chen' | 'ngu_than_tay_thung' | 'tan_thoi';
  garmentId: string;
  colorPalette: [string, string, string, string];
  equippedAccessories: {
    headwear?: string;
    footwear?: string;
    handheld?: string;
    jewelry?: string;
    [slot: string]: string | undefined;
  };
  motifId?: string;
}

export type StudioSession = StudioDraft;

export type PuzzleAnswerDraft =
  | { type: 'use' | 'present'; answer: string | string[] }
  | { type: 'code'; answer: string }
  | { type: 'find' | 'order'; answer: string[] }
  | { type: 'styling'; answer: Record<string, string> };

export interface PuzzleDraft {
  type: 'puzzle';
  puzzleId: string;
  chapterId: ChapterId;
  puzzleType?: 'find' | 'use' | 'code' | 'order' | 'present' | 'styling';
  valid: boolean;
  history?: Array<{ action: string; payload?: unknown }>;
  data: Record<string, unknown>;
}

export type PuzzleSession = PuzzleDraft;

export type ActiveSession = StudioDraft | PuzzleDraft | null;

// ==========================================
// 2. Closet & Journey Sub-structures
// ==========================================

export interface SavedOutfit {
  id: string;
  name: string;
  garmentId: string;
  equippedAccessories: {
    headwear?: string;
    footwear?: string;
    handheld?: string;
    jewelry?: string;
    [slot: string]: string | undefined;
  };
  colorPalette: [string, string, string, string];
  motifId?: string;
  createdAt: string;
}

export interface ActiveDialogueState {
  /** Revisit only: acknowledgement cannot grant clues or advance progression. */
  mode?: 'reread';
  dialogueId: string;
  currentNodeId: string;
  history: string[];
}

export interface ChapterProgress {
  currentArea: string;
  side: 'mat_phai' | 'mat_trai';
  navStack: string[];
  unlockedAreaIds: string[];
  completedDialogueIds: string[];
  solvedPuzzleIds: string[];
  hintTiers: Record<string, number>;
  claimed: boolean;
  status: 'locked' | 'in_progress' | 'completed';
  dialogueQueue?: string[];
  puzzleDrafts?: Record<string, PuzzleAnswerDraft>;
  activeDialogue?: ActiveDialogueState | null;
}

export interface PlayerProfile {
  name: string;
  gender: 'male' | 'female';
  avatarPreset: string;
  createdAt: string;
}

export type UserProfile = PlayerProfile;

export interface GameFeatures {
  latVai: boolean;
}

export interface GameSettings {
  textSpeed: 'normal' | 'fast';
  devDebug: boolean;
}

// ==========================================
// 3. Root GameState
// ==========================================

export interface GameState {
  claimedRewardIds?: string[];
  profile: PlayerProfile | null;
  features: GameFeatures;
  wallet: {
    senNgoc: number;
  };
  journey: Record<ChapterId, ChapterProgress>;
  currentChapter: ChapterId;
  notebook: {
    unlockedClueIds: string[];
  };
  inventory: {
    itemIds: string[];
  };
  closet: {
    unlockedGarmentIds: string[];
    unlockedAccessoryIds: string[];
    savedOutfits: SavedOutfit[];
  };
  museum: {
    unlockedCardIds?: string[];
    readCardIds: string[];
    claimedCardIds: string[];
  };
  activeSession: ActiveSession;
  settings: GameSettings;
}

export interface ContextOptions {
  now?: number | string | (() => number | string);
  seed?: number | string;
}

// ==========================================
// 4. Initial State Factory
// ==========================================

export function createInitialState(
  content: GameContent,
  ctx?: ContextOptions,
  features?: Partial<GameFeatures>
): GameState {
  let timestamp: string;
  if (typeof ctx?.now === 'function') {
    const res = ctx.now();
    timestamp = typeof res === 'number' ? new Date(res).toISOString() : String(res);
  } else if (typeof ctx?.now === 'number') {
    timestamp = new Date(ctx.now).toISOString();
  } else if (typeof ctx?.now === 'string') {
    timestamp = ctx.now;
  } else {
    timestamp = new Date(0).toISOString(); // Deterministic default epoch
  }

  const defaultOrder: ChapterId[] = ['prologue', 'c1', 'c2', 'c3', 'c4', 'c5'];
  const chapterKeys = (content.chapterOrder && content.chapterOrder.length > 0)
    ? (content.chapterOrder as ChapterId[])
    : defaultOrder;

  const journey = {} as Record<ChapterId, ChapterProgress>;

  for (const chId of chapterKeys) {
    const chData = content.chapters[chId];
    const firstAreaId = chData?.areas?.[0]?.id ?? `${chId}-s1`;
    const unlockedAreaIds = chId === 'prologue'
      ? (chData?.areas?.slice(0, 2).map((a) => a.id) ?? [firstAreaId])
      : [firstAreaId];

    journey[chId] = {
      currentArea: firstAreaId,
      side: 'mat_phai',
      navStack: [],
      unlockedAreaIds,
      completedDialogueIds: [],
      solvedPuzzleIds: [],
      hintTiers: {},
      claimed: false,
      status: chId === 'prologue' ? 'in_progress' : 'locked',
      dialogueQueue: [],
      puzzleDrafts: {},
      activeDialogue: null
    };
  }

  return {
    claimedRewardIds: [],
    profile: {
      name: 'An',
      gender: 'female',
      avatarPreset: 'an-default',
      createdAt: timestamp
    },
    features: {
      latVai: features?.latVai ?? false
    },
    wallet: {
      senNgoc: 100 // Decisions.md mục 3: khởi đầu +100 Sen Ngọc
    },
    journey,
    currentChapter: 'prologue',
    notebook: {
      unlockedClueIds: []
    },
    inventory: {
      itemIds: ['keo_may_bang_dong'] // Kéo may gia truyền mang theo trong giỏ
    },
    closet: {
      unlockedGarmentIds: ['ao-tu-than', 'ao-ngu-than-tay-chen'],
      unlockedAccessoryIds: ['khan-van-den', 'guoc-moc'],
      savedOutfits: []
    },
    museum: {
      unlockedCardIds: [],
      readCardIds: [],
      claimedCardIds: []
    },
    activeSession: null,
    settings: {
      textSpeed: 'normal',
      devDebug: false
    }
  };
}
