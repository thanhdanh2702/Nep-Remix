import { useEffect, useRef, useState } from 'react';
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

import { ACTION_LABEL } from './puzzle-actions';
export { ACTION_LABEL };
import {
  BAGUA_TRIGRAMS,
  parseBaguaDraft,
  formatBaguaDraft,
  isBaguaComplete,
  isBaguaPuzzle,
} from './bagua-puzzle';
// 'use' puzzles that name a required item and every 'present' puzzle are answered with an inventory item.
const needsItem = (puzzle: Puzzle) => puzzle.type === 'present' || (puzzle.type === 'use' && Boolean(puzzle.solution.requiredItemId || puzzle.solution.requiredItemIds));

import { stylingAnswer } from './styling-answer';
export { stylingAnswer };

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

    const stripRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const trayRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const trayContainerRef = useRef<HTMLDivElement>(null);
    const [focusedPieceId, setFocusedPieceId] = useState<string | null>(null);

    // Keep focus on the active piece across re-orders or shift intentionally on removal
    useEffect(() => {
      if (focusedPieceId) {
        const el = stripRefs.current.get(focusedPieceId);
        if (el && document.activeElement !== el) {
          el.focus();
        }
      }
    }, [currentSeq, focusedPieceId]);

    const updateSeq = (next: string[], nextFocusId?: string | null) => {
      if (nextFocusId !== undefined) {
        setFocusedPieceId(nextFocusId);
      }
      onUpdateDraft({ type: 'order', answer: next });
    };

    const addPiece = (id: string) => {
      const next = addOrderPiece(currentSeq, id);
      updateSeq(next, id);
    };

    const removePiece = (index: number) => {
      const removedId = currentSeq[index];
      const next = removeOrderPiece(currentSeq, index);
      if (next.length > 0) {
        const nextIndex = Math.min(index, next.length - 1);
        updateSeq(next, next[nextIndex]);
      } else {
        // When all pieces are removed from the canvas, the strip elements unmount.
        // Prevent focus from dropping to document.body by redirecting focus to
        // the corresponding returned piece button in the tray (or the first tray button/modal).
        updateSeq(next, null);
        setTimeout(() => {
          const trayBtn = trayRefs.current.get(removedId) ?? trayContainerRef.current?.querySelector('button');
          if (trayBtn) {
            trayBtn.focus();
          }
        }, 0);
      }
    };

    const moveLeft = (index: number) => {
      if (index <= 0) return;
      const pieceId = currentSeq[index];
      const next = moveOrderPieceLeft(currentSeq, index);
      updateSeq(next, pieceId);
    };

    const moveRight = (index: number) => {
      if (index >= currentSeq.length - 1) return;
      const pieceId = currentSeq[index];
      const next = moveOrderPieceRight(currentSeq, index);
      updateSeq(next, pieceId);
    };

    return (
      <Modal title={puzzle.title} wide onClose={onClose}>
        <p>Sắp xếp bốn dải bản vẽ từ trái sang phải để phục hồi thiết kế hoàn chỉnh.</p>
        <div className="order-assembly" aria-label="Khung ghép dải bản vẽ">
          <div className="order-board" aria-label="Bản vẽ đang ghép">
            {currentSeq.length === 0 ? (
              <p className="order-empty-hint">Chưa có dải bản vẽ nào được đặt. Chọn mảnh bên dưới để ghép.</p>
            ) : (
              <div className="order-canvas-wrapper">
                <div className="order-canvas" role="region" aria-label="Bản vẽ ghép liên tục">
                  {currentSeq.map((id, index) => {
                    const stripPath = c2StripAsset(id);
                    const name = content.itemsById.get(id)?.name ?? `Dải ${index + 1}`;
                    return (
                      <div
                        key={id}
                        ref={(el) => {
                          if (el) stripRefs.current.set(id, el);
                          else stripRefs.current.delete(id);
                        }}
                        className={`order-strip-slot ${focusedPieceId === id ? 'is-selected' : ''}`}
                        tabIndex={0}
                        role="group"
                        aria-label={`Vị trí ${index + 1}: ${name}. Dùng phím Mũi tên trái/phải để đổi chỗ, Delete để gỡ.`}
                        onFocus={() => setFocusedPieceId(id)}
                        onClick={() => setFocusedPieceId(id)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            e.stopPropagation();
                            moveLeft(index);
                          } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            e.stopPropagation();
                            moveRight(index);
                          } else if (e.key === 'Delete' || e.key === 'Backspace') {
                            e.preventDefault();
                            e.stopPropagation();
                            removePiece(index);
                          }
                        }}
                      >
                        <span className="order-slot-num">{index + 1}</span>
                        {stripPath && (
                          <img
                            src={asset(stripPath)}
                            alt={name}
                            className="order-strip-img"
                            draggable={false}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {currentSeq.length > 0 && (
            <div className="order-strip-controls-panel" role="group" aria-label="Điều khiển vị trí các mảnh">
              <h4>Thao tác các mảnh đã ghép:</h4>
              <div className="order-strip-controls-list">
                {currentSeq.map((id, index) => {
                  const name = content.itemsById.get(id)?.name ?? `Dải ${index + 1}`;
                  return (
                    <div key={id} className="order-strip-control-row">
                      <span className="order-strip-control-label">
                        <strong className="order-slot-badge">{index + 1}</strong> {name}
                      </span>
                      <div className="order-strip-btn-group">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLeft(index);
                          }}
                          aria-label={`Dịch ${name} sang trái`}
                          title="Dịch sang trái"
                        >
                          ‹ Trái
                        </button>
                        <button
                          type="button"
                          disabled={index === currentSeq.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveRight(index);
                          }}
                          aria-label={`Dịch ${name} sang phải`}
                          title="Dịch sang phải"
                        >
                          Phải ›
                        </button>
                        <button
                          type="button"
                          className="order-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePiece(index);
                          }}
                          aria-label={`Gỡ ${name}`}
                          title="Gỡ bỏ"
                        >
                          × Gỡ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="order-tray" aria-label="Mảnh bản vẽ trong túi">
            <h4>Mảnh bản vẽ trong túi đồ:</h4>
            {unplaced.length === 0 ? (
              <p className="fine-print">
                {ownedStrips.length === 0
                  ? 'Túi đồ chưa có mảnh bản vẽ nào. Hãy tìm kiếm quanh gác lửng.'
                  : 'Đã đưa tất cả mảnh đang có vào khung ghép.'}
              </p>
            ) : (
              <div ref={trayContainerRef} className="order-tray-items">
                {unplaced.map(id => {
                  const stripPath = c2StripAsset(id);
                  const name = content.itemsById.get(id)?.name ?? id;
                  return (
                    <button
                      key={id}
                      ref={(el) => {
                        if (el) trayRefs.current.set(id, el);
                        else trayRefs.current.delete(id);
                      }}
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
          <button type="button" disabled={currentSeq.length === 0} onClick={() => updateSeq(resetOrderSeq(), null)}>
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

  if (isBaguaPuzzle(puzzle)) {
    const { ring1, ring2 } = parseBaguaDraft(draft?.answer);

    const selectRing1 = (id: string) => {
      const next = formatBaguaDraft(id, ring2);
      onUpdateDraft({ type: 'code', answer: next });
    };

    const selectRing2 = (id: string) => {
      const next = formatBaguaDraft(ring1, id);
      onUpdateDraft({ type: 'code', answer: next });
    };

    const canSubmit = isBaguaComplete(ring1, ring2);
    const label = ACTION_LABEL[puzzle.id] ?? 'Mở khóa Bát Quái';

    return (
      <Modal title={puzzle.title} wide onClose={onClose}>
        <p>Xoay hai vòng khóa Bát Quái theo manh mối ghi lại: quẻ mở đầu và quẻ tiếp nối.</p>
        <div className="bagua-lock-panel" aria-label="Khung điều khiển khóa Bát Quái">
          <div className="bagua-current-display" role="status" aria-label="Tổ hợp hiện tại">
            <div className={`bagua-slot ${ring1 ? 'is-filled' : ''}`}>
              <span className="bagua-slot-label">Vòng 1 (Trước)</span>
              <span className="bagua-slot-value">{BAGUA_TRIGRAMS.find(t => t.id === ring1)?.name ?? '—'}</span>
            </div>
            <span style={{ fontSize: '24px', color: 'var(--c-muted-plum)' }}>➔</span>
            <div className={`bagua-slot ${ring2 ? 'is-filled' : ''}`}>
              <span className="bagua-slot-label">Vòng 2 (Sau)</span>
              <span className="bagua-slot-value">{BAGUA_TRIGRAMS.find(t => t.id === ring2)?.name ?? '—'}</span>
            </div>
          </div>

          <div className="bagua-rings-container">
            <div className="bagua-ring-section">
              <h4>Vòng 1: Chọn quẻ đầu tiên</h4>
              <div className="bagua-trigram-grid" role="radiogroup" aria-label="Vòng thứ nhất">
                {BAGUA_TRIGRAMS.map(t => (
                  <button
                    key={`r1-${t.id}`}
                    type="button"
                    className={`bagua-trigram-btn ${ring1 === t.id ? 'is-active' : ''}`}
                    onClick={() => selectRing1(t.id)}
                    aria-pressed={ring1 === t.id}
                  >
                    <span className="bagua-trigram-symbol">{t.symbol}</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bagua-ring-section">
              <h4>Vòng 2: Chọn quẻ tiếp theo</h4>
              <div className="bagua-trigram-grid" role="radiogroup" aria-label="Vòng thứ hai">
                {BAGUA_TRIGRAMS.map(t => (
                  <button
                    key={`r2-${t.id}`}
                    type="button"
                    className={`bagua-trigram-btn ${ring2 === t.id ? 'is-active' : ''}`}
                    onClick={() => selectRing2(t.id)}
                    aria-pressed={ring2 === t.id}
                  >
                    <span className="bagua-trigram-symbol">{t.symbol}</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="actions">
          <button
            className="primary"
            disabled={!canSubmit}
            onClick={() => onSubmit(formatBaguaDraft(ring1, ring2))}
          >
            {label}
          </button>
          <button
            type="button"
            disabled={!ring1 && !ring2}
            onClick={() => onUpdateDraft({ type: 'code', answer: '' })}
          >
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

  if (puzzle.id === 'p-c3-present-evidence') {
    const hasI2 = itemIds.includes('so_tu_vi_nguyen_ban_1962');
    const hasI3 = itemIds.includes('thu_tay_thoa_thuan_boi_toan');
    const canPresent = hasI2 && hasI3;
    const isSelected = draft?.answer === 'so_tu_vi_nguyen_ban_1962';

    return (
      <Modal title={puzzle.title} wide onClose={onClose}>
        <p>Đối chiếu chứng cứ gốc và bản sửa để vạch trần âm mưu áp đặt trước mặt gia đình.</p>
        <div className="evidence-present-panel" aria-label="Bảng đối chiếu chứng cứ">
          <div className="evidence-docs-grid">
            <div className="evidence-doc-card is-original">
              <h4>1. Sổ tử vi nguyên bản (1962)</h4>
              <p className="evidence-doc-text">
                Hồ sơ xem ngày ban đầu giữa Mai và Vinh. Không có điều kiện ép buộc, không hề có dòng yêu cầu Mai làm lẽ hay giao quyền quyết định tiệm may.
              </p>
              <span className="fine-print" style={{ color: '#2d6a5d', fontWeight: 600 }}>
                {hasI2 ? '✓ Đã có trong túi' : '✗ Chưa có'}
              </span>
            </div>

            <div className="evidence-doc-card is-letter">
              <h4>2. Thư tay thỏa thuận</h4>
              <p className="evidence-doc-text">
                Thỏa thuận nhận khoản tiền 2.000 đồng kèm yêu cầu viết chèn thêm điều kiện nhằm buộc Mai phải chấp nhận làm lẽ và giao quyền quyết định tiệm may.
              </p>
              <span className="fine-print" style={{ color: '#8a6d1c', fontWeight: 600 }}>
                {hasI3 ? '✓ Đã có trong túi' : '✗ Chưa có'}
              </span>
            </div>

            <div className="evidence-doc-card is-altered">
              <h4>3. Bản sửa áp đặt (Đối chiếu)</h4>
              <p className="evidence-doc-text">
                Cùng tên hồ sơ nhưng chèn thêm điều kiện áp đặt: <span className="evidence-doc-highlight">“Mai phải chấp nhận làm lẽ và giao quyền quyết định tiệm may”</span>.
              </p>
              <span className="fine-print" style={{ color: 'var(--c-error)', fontWeight: 600 }}>
                Nội dung chèn thêm điều kiện ép buộc
              </span>
            </div>
          </div>

          <div className="evidence-selection-tray">
            <h4>Chọn chứng cứ đại diện đưa ra đối chất:</h4>
            {!canPresent ? (
              <p className="fine-print">
                Cần có cả <strong>Sổ tử vi nguyên bản</strong> và <strong>Thư tay thỏa thuận</strong> trong túi đồ để đối chất.
              </p>
            ) : (
              <div className="puzzle-items">
                <button
                  type="button"
                  className={isSelected ? 'selected' : ''}
                  aria-pressed={isSelected}
                  onClick={() => onUpdateDraft({ type: 'present', answer: 'so_tu_vi_nguyen_ban_1962' })}
                >
                  {itemAsset('so_tu_vi_nguyen_ban_1962') && <img src={asset(itemAsset('so_tu_vi_nguyen_ban_1962')!)} alt="" />}
                  {content.itemsById.get('so_tu_vi_nguyen_ban_1962')?.name ?? 'Sổ tử vi nguyên bản 1962'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="actions">
          <button
            className="primary"
            disabled={!canPresent || !isSelected}
            onClick={() => onSubmit('so_tu_vi_nguyen_ban_1962')}
          >
            Trình chứng cứ
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
  c3: {
    title: 'Tiếng kéo đêm phố cũ — Mai tự quyết định',
    src: 'assets/areas/chapter-3/c3-s3-dinh-thu-doi-dau/cg-c3-mai-tu-len-tieng.png',
    alt: 'Bà Lê Thị Mai đứng vững vàng trong tiệm may Đa Kao, cất tiếng bảo vệ tự do và tay nghề của chính mình',
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
    <strong>Đã hoàn thành {id === 'prologue' ? 'Màn mở đầu' : title}</strong>
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
