import type { StudioDraft, PuzzleAnswerDraft } from '../core';
import type { ChapterId, Puzzle } from '../content/schema';
import { content } from './store';
import { asset, itemAsset, c2StripAsset } from './assets';
import { Modal } from './Modal';
import {
  ALL_C2_STRIPS,
  addOrderPiece,
  removeOrderPiece,
  moveOrderPieceLeft,
  moveOrderPieceRight,
  resetOrderSeq,
  handleOrderSlotKey,
} from './order-puzzle';
import './puzzle.css';

type Chapter = (typeof content.chapters)[ChapterId];

// Button text authored per puzzle / dialogue id; the content schema has no label field yet.
export const ACTION_LABEL: Record<string, string> = {
  'p-c0-cloth': 'Gỡ tấm vải phủ',
  'd-c0-stairs': 'Bước lên gác xép',
  'p-c2-sketch-assemble': 'Ghép bản vẽ',
  'p-c2-safe-open': 'Mở hòm sắt',
  'p-c2-present-receipt': 'Trình biên lai',
  'p-c2-present-sketch': 'Trình bản vẽ',
};
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

export function PuzzleModal({ puzzle, itemIds, draft, hintTier, feedback, onSubmit, onHint, onClose, onUpdateDraft }: {
  puzzle: Puzzle; itemIds: string[]; hintTier: number; feedback: string; draft?: PuzzleAnswerDraft;
  onSubmit: (answer: unknown) => void; onHint: () => void; onClose: () => void; onUpdateDraft: (draft: PuzzleAnswerDraft) => void;
}) {
  if (puzzle.type === 'order') {
    const ownedStrips = ALL_C2_STRIPS.filter(id => itemIds.includes(id));
    const currentSeq: string[] = Array.isArray(draft?.answer)
      ? (draft.answer as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];
    const unplaced = ownedStrips.filter(id => !currentSeq.includes(id));
    const label = ACTION_LABEL[puzzle.id] ?? 'Ghép bản vẽ';

    const updateSeq = (next: string[]) => {
      onUpdateDraft({ type: 'order', answer: next });
    };

    const addPiece = (id: string) => updateSeq(addOrderPiece(currentSeq, id));
    const removePiece = (index: number) => updateSeq(removeOrderPiece(currentSeq, index));
    const moveLeft = (index: number) => updateSeq(moveOrderPieceLeft(currentSeq, index));
    const moveRight = (index: number) => updateSeq(moveOrderPieceRight(currentSeq, index));

    return (
      <Modal title={puzzle.title} wide onClose={onClose}>
        <p>Sắp xếp bốn dải bản vẽ từ trái sang phải để phục hồi thiết kế hoàn chỉnh.</p>
        <div className="order-assembly" aria-label="Khung ghép dải bản vẽ">
          <div className="order-board" aria-label="Bản vẽ đang ghép">
            {currentSeq.length === 0 ? (
              <p className="order-empty-hint">Chưa có dải bản vẽ nào được đặt. Chọn mảnh bên dưới để ghép.</p>
            ) : (
              <div className="order-slots">
                {currentSeq.map((id, index) => {
                  const stripPath = c2StripAsset(id);
                  const name = content.itemsById.get(id)?.name ?? `Dải ${index + 1}`;
                  return (
                    <div
                      key={`${id}-${index}`}
                      className="order-slot"
                      tabIndex={0}
                      role="group"
                      aria-label={`Vị trí ${index + 1}: ${name}. Dùng phím Mũi tên trái/phải để đổi chỗ, Delete để gỡ.`}
                      onKeyDown={(e) => {
                        handleOrderSlotKey(e.key, index, currentSeq, () => e.preventDefault(), updateSeq);
                      }}
                    >
                      <span className="order-slot-num">{index + 1}</span>
                      <div className="order-strip-preview">
                        {stripPath && <img src={asset(stripPath)} alt={name} className="order-strip-img" />}
                      </div>
                      <div className="order-strip-controls">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveLeft(index)}
                          aria-label={`Dịch ${name} sang trái`}
                          title="Sang trái"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          disabled={index === currentSeq.length - 1}
                          onClick={() => moveRight(index)}
                          aria-label={`Dịch ${name} sang phải`}
                          title="Sang phải"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          className="order-remove"
                          onClick={() => removePiece(index)}
                          aria-label={`Gỡ ${name}`}
                          title="Gỡ bỏ"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="order-tray" aria-label="Mảnh bản vẽ trong túi">
            <h4>Mảnh bản vẽ trong túi đồ:</h4>
            {unplaced.length === 0 ? (
              <p className="fine-print">
                {ownedStrips.length === 0
                  ? 'Túi đồ chưa có mảnh bản vẽ nào. Hãy tìm kiếm quanh gác lửng.'
                  : 'Đã đưa tất cả mảnh đang có vào khung ghép.'}
              </p>
            ) : (
              <div className="order-tray-items">
                {unplaced.map(id => {
                  const stripPath = c2StripAsset(id);
                  const name = content.itemsById.get(id)?.name ?? id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className="order-tray-btn"
                      onClick={() => addPiece(id)}
                      aria-label={`Thêm ${name}`}
                    >
                      {stripPath && <img src={asset(stripPath)} alt="" className="order-tray-thumb" />}
                      <span>+ {name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="actions">
          <button className="primary" onClick={() => onSubmit(currentSeq)}>
            {label}
          </button>
          <button type="button" disabled={currentSeq.length === 0} onClick={() => updateSeq([])}>
            Đặt lại
          </button>
          <button disabled={hintTier >= 3} onClick={onHint}>
            Nếp gợi ý ({hintTier}/3)
          </button>
        </div>
        <Hints puzzle={puzzle} tier={hintTier} />
        <Feedback text={feedback} />
      </Modal>
    );
  }

  const isMulti = puzzle.type === 'use' && Boolean(puzzle.solution.requiredItemIds);
  const answer = draft?.answer;
  const picked = isMulti ? (Array.isArray(answer) ? answer : []) : (typeof answer === 'string' ? answer : '');
  const pick = needsItem(puzzle);
  const label = ACTION_LABEL[puzzle.id] ?? (puzzle.type === 'present' ? 'Đưa chứng cứ' : pick ? 'Dùng vật phẩm' : 'Thực hiện');
  const prompt = puzzle.type === 'present' ? 'Chọn chứng cứ trong túi đồ để đưa ra trước mặt họ.' : 'Chọn thao tác hoặc vật phẩm An đang mang theo.';
  
  const togglePicked = (id: string) => {
    if (isMulti) {
      const arr = picked as string[];
      onUpdateDraft({ type: 'use', answer: arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id] });
    } else {
      onUpdateDraft({ type: puzzle.type === 'present' ? 'present' : 'use', answer: id });
    }
  };

  const isPicked = (id: string) => isMulti ? (picked as string[]).includes(id) : picked === id;
  const canSubmit = pick ? (isMulti ? (picked as string[]).length > 0 : !!picked) : true;

  return <Modal title={puzzle.title} onClose={onClose}>
    <p>{prompt}</p>
    {pick && <div className="puzzle-items">
      {!itemIds.length && <p className="fine-print">Túi đồ còn trống. Hãy khám phá căn phòng.</p>}
      {itemIds.map(id => <button key={id} className={isPicked(id) ? 'selected' : ''} aria-pressed={isPicked(id)} onClick={() => togglePicked(id)}>
        {itemAsset(id) && <img src={asset(itemAsset(id)!)} alt="" />}{content.itemsById.get(id)?.name}
      </button>)}
    </div>}
    <div className="actions">
      <button className="primary" disabled={!canSubmit} onClick={() => onSubmit(pick ? picked : 'interact')}>{label}</button>
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
  c2: {
    title: 'Khoản nợ đã trả, bản vẽ tự ký tên',
    src: 'assets/areas/chapter-2/c2-s3-phong-trien-lam-doi-dau/cg-c2-loan-tu-ky-ten.png',
    alt: 'Cụ Trần Thị Loan tự mình ký tên lên bản vẽ áo dài Tân thời trước sự chứng kiến của công chúng',
  },
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
    <strong>Đã hoàn thành {art ? 'Màn mở đầu' : title}</strong>
    <div className="ending-rewards">
      <h4>Phần thưởng nhận được:</h4>
      <ul>
        {reward.senNgoc ? <li>+{reward.senNgoc} Sen Ngọc</li> : null}
        {reward.garmentIds?.map(gId => <li key={gId}>{content.garmentsById.get(gId)?.name}</li>)}
        {reward.accessoryIds?.map(aId => <li key={aId}>{content.accessoriesById.get(aId)?.name}</li>)}
        {reward.itemIds?.map(iId => <li key={iId}>{content.itemsById.get(iId)?.name}</li>)}
        {reward.cardIds?.map(cId => <li key={cId}>Thẻ bảo tàng: {content.cultureCardsById.get(cId)?.title}</li>)}
      </ul>
    </div>
    <div className="actions">
      {art && <button className="primary" onClick={onHome}>Về sân nhà</button>}
      <button className={art ? '' : 'primary'} onClick={onMap}>{art ? 'Xem bản đồ chương' : 'Trở về bản đồ'}</button>
    </div>
  </Modal>;
}
