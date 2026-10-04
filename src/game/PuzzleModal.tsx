import { useState } from 'react';
import type { StudioDraft } from '../core';
import type { ChapterId, Puzzle } from '../content/schema';
import { content } from './store';
import { asset, itemAsset } from './assets';
import { Modal } from './Modal';
import './puzzle.css';

type Chapter = (typeof content.chapters)[ChapterId];

// Button text authored per puzzle / dialogue id; the content schema has no label field yet.
export const ACTION_LABEL: Record<string, string> = { 'p-c0-cloth': 'Gỡ tấm vải phủ', 'd-c0-stairs': 'Bước lên gác xép' };
// 'use' puzzles that name a required item and every 'present' puzzle are answered with an inventory item.
const needsItem = (puzzle: Puzzle) => puzzle.type === 'present' || (puzzle.type === 'use' && Boolean(puzzle.solution.requiredItemId || puzzle.solution.requiredItemIds));
// Shape that evaluatePuzzleAnswer expects for a 'styling' puzzle.
export const stylingAnswer = (draft: StudioDraft) => ({
  silhouette: draft.silhouette, garmentId: draft.garmentId, headwearId: draft.equippedAccessories.headwear,
  jewelryId: draft.equippedAccessories.jewelry, footwearId: draft.equippedAccessories.footwear, handheldId: draft.equippedAccessories.handheld,
});

// Hotspot of the unsolved puzzle that unlocks `areaId`. A locked exit arrow opens it (the arrow can sit on top of that very object).
export function unlockerOf(chapter: Chapter, area: Chapter['areas'][number], solved: string[], unlocked: string[], areaId: string) {
  if (unlocked.includes(areaId)) return undefined;
  return area.interactables.find(i => i.action.type === 'puzzle' && !solved.includes(i.action.targetId)
    && (chapter.puzzles.find(p => p.id === i.action.targetId)?.solution as { unlocksAreaId?: string } | undefined)?.unlocksAreaId === areaId);
}

const Hints = ({ puzzle, tier }: { puzzle: Puzzle; tier: number }) => <>{puzzle.hints.slice(0, tier).map((hint, i) => <p key={i} className="hint">{hint}</p>)}</>;
const Feedback = ({ text }: { text: string }) => text ? <p role="status" className="puzzle-feedback is-error">{text}</p> : null;

export function PuzzleModal({ puzzle, itemIds, hintTier, feedback, onSubmit, onHint, onClose }: {
  puzzle: Puzzle; itemIds: string[]; hintTier: number; feedback: string;
  onSubmit: (answer: unknown) => void; onHint: () => void; onClose: () => void;
}) {
  const [picked, setPicked] = useState('');
  const pick = needsItem(puzzle);
  const label = ACTION_LABEL[puzzle.id] ?? (puzzle.type === 'present' ? 'Đưa chứng cứ' : pick ? 'Dùng vật phẩm' : 'Thực hiện');
  const prompt = puzzle.type === 'present' ? 'Chọn chứng cứ trong túi đồ để đưa ra trước mặt họ.' : 'Chọn thao tác hoặc vật phẩm An đang mang theo.';
  return <Modal title={puzzle.title} onClose={onClose}>
    <p>{prompt}</p>
    {pick && <div className="puzzle-items">
      {!itemIds.length && <p className="fine-print">Túi đồ còn trống. Hãy khám phá căn phòng.</p>}
      {itemIds.map(id => <button key={id} className={picked === id ? 'selected' : ''} aria-pressed={picked === id} onClick={() => setPicked(id)}>
        {itemAsset(id) && <img src={asset(itemAsset(id)!)} alt="" />}{content.itemsById.get(id)?.name}
      </button>)}
    </div>}
    <div className="actions">
      <button className="primary" disabled={pick && !picked} onClick={() => onSubmit(pick ? picked : 'interact')}>{label}</button>
      <button disabled={hintTier >= 3} onClick={onHint}>Nếp gợi ý ({hintTier}/3)</button>
    </div>
    <Hints puzzle={puzzle} tier={hintTier} />
    <Feedback text={feedback} />
  </Modal>;
}

// Rendered inside the Studio (challenge mode): the player dresses the model, then presents the outfit.
export function StyleChallengeBar({ puzzle, draft, hintTier, feedback, onSubmit, onHint, onCancel }: {
  puzzle: Puzzle; draft: StudioDraft; hintTier: number; feedback: string;
  onSubmit: (answer: unknown) => void; onHint: () => void; onCancel: () => void;
}) {
  return <section className="studio-challenge" aria-label="Thử thách phối đồ">
    <h2>{puzzle.title}</h2>
    <Feedback text={feedback} />
    <div className="actions">
      <button className="primary" onClick={() => onSubmit(stylingAnswer(draft))}>Trình diện</button>
      <button disabled={hintTier >= 3} onClick={onHint}>Nếp gợi ý ({hintTier}/3)</button>
      <button onClick={onCancel}>Hủy thử thách</button>
    </div>
    <Hints puzzle={puzzle} tier={hintTier} />
  </section>;
}

const ENDING_ART: Partial<Record<ChapterId, { title: string; src: string; alt: string }>> = {
  prologue: { title: 'Nếp ký ức đầu tiên', src: 'assets/areas/prologue/c0-s2-gac-xep-chiec-ruong/cg-prologue-mo-ruong-hoi-sinh.png', alt: 'An mở chiếc rương gia bảo trong ánh sáng vàng' },
};

// Chapter summary: clues found + reward. Chapters without a painted CG get a plain card.
export function ChapterEnding({ chapter, clueIds, onHome, onMap, onClose }: {
  chapter: Chapter; clueIds: string[]; onHome: () => void; onMap: () => void; onClose: () => void;
}) {
  const { id, title, reward } = chapter.chapter;
  const art = ENDING_ART[id];
  const clues = clueIds.map(clueId => content.cluesById.get(clueId)).filter(clue => clue?.chapterId === id);
  return <Modal title={art?.title ?? title} wide onClose={onClose}>
    {art ? <img className="ending-art" src={asset(art.src)} alt={art.alt} /> : <p className="ending-ribbon">Hoàn thành chương</p>}
    {clues.map(clue => <article key={clue!.id} className="ending-clue"><h4>{clue!.title}</h4><p>{clue!.description}</p></article>)}
    <strong>Đã hoàn thành {art ? 'Màn mở đầu' : title} · +{reward.senNgoc} Sen Ngọc</strong>
    <div className="actions">
      {art && <button className="primary" onClick={onHome}>Về sân nhà</button>}
      <button className={art ? '' : 'primary'} onClick={onMap}>{art ? 'Xem bản đồ chương' : 'Trở về bản đồ'}</button>
    </div>
  </Modal>;
}
