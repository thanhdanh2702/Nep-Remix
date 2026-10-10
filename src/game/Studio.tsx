import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  createScopedSession,
  dispatchSession,
  undoSession,
  redoSession,
  resetSession,
  commitSession,
  runCommand,
  evaluateOutfit,
  getChallengeWardrobe,
  createChallengeStudioDraft,
  validateChallengeStudioDraft,
  validateStudioDraft,
  type GameState,
  type StudioDraft,
  type Command,
} from '../core';
import type { Garment } from '../content/schema';
import { content } from './store';
import { isHistoricalGarment } from '../content/garment-catalog';
import { asset } from './assets';
import { Modal } from './Modal';
import { StudioBook } from './StudioBook';
import { pop } from '../ui/motion';
import { StudioCharacter } from './StudioCharacter';
import { type WardrobeTab } from './StudioWardrobe';
import { StudioLookbookAi } from './StudioLookbookAi';
import './studio.css';
import './studio-book.css';
import './studio-reference.css';

export const events = [
  { id: 'dao_pho', name: 'Dạo phố' },
  { id: 'tet', name: 'Tết' },
  { id: 'dam_cuoi', name: 'Lễ cưới' },
  { id: 'be_giang', name: 'Bế giảng' },
  { id: 'le_chua', name: 'Lễ chùa' },
  { id: 'vieng_tang', name: 'Viếng tang' },
];

const palettes: { name: string; colors: [string, string, string, string] }[] = [
  { name: 'Củ nâu', colors: ['#C4A482', '#8B5A2B', '#5C3A21', '#2C1608'] },
  { name: 'Chàm', colors: ['#637687', '#2D3E50', '#1E2A38', '#101720'] },
  { name: 'Đỏ son', colors: ['#E7A08E', '#B83A24', '#8B261E', '#3A1916'] },
  { name: 'Hoàng yến', colors: ['#F3DF9F', '#CFA449', '#907030', '#382B02'] },
  { name: 'Men lam', colors: ['#B1D0BE', '#2D6A5D', '#204D44', '#102923'] },
  { name: 'Giấy dó', colors: ['#FFFFFF', '#F5EFEB', '#D6CCC2', '#8D8175'] },
];

export function makeDraft(garment: Garment): StudioDraft {
  return {
    type: 'studio',
    eventContextId: 'dao_pho',
    silhouette: garment.silhouette,
    garmentId: garment.id,
    colorPalette: [...garment.defaultColorPalette],
    equippedAccessories: {},
  };
}

export function draftToAnswerRecord(draft: StudioDraft): Record<string, string> {
  const ans: Record<string, string> = {
    silhouette: draft.silhouette,
    garmentId: draft.garmentId,
    headwearId: draft.equippedAccessories.headwear ?? '',
    footwearId: draft.equippedAccessories.footwear ?? '',
    jewelryId: draft.equippedAccessories.jewelry ?? '',
    handheldId: draft.equippedAccessories.handheld ?? '',
    color0: draft.colorPalette[0],
    color1: draft.colorPalette[1],
    color2: draft.colorPalette[2],
    color3: draft.colorPalette[3],
  };
  if (draft.eventContextId !== undefined) {
    ans.eventContextId = draft.eventContextId;
  }
  if (draft.motifId) {
    ans.motifId = draft.motifId;
  }
  return ans;
}

// `challenge` turns the room into a puzzle: it receives the live draft and renders the submit / cancel controls.
export function Studio({
  state,
  send,
  notify,
  initial,
  challenge,
}: {
  state: GameState;
  send: (cmd: Command) => GameState | null;
  notify: (message: string) => void;
  initial?: StudioDraft;
  challenge?: (draft: StudioDraft) => ReactNode;
}) {
  const puzzleId = challenge && state.activeSession?.type === 'puzzle' ? state.activeSession.puzzleId : undefined;

  const [session, setSession] = useState(() => {
    if (puzzleId) {
      const opened = createChallengeStudioDraft(state, puzzleId, content);
      if (opened.ok) {
        return createScopedSession(opened.draft, 'studio');
      }
      notify(opened.reason);
      const fallback = initial && isHistoricalGarment(initial.garmentId) ? initial : makeDraft(content.garmentsById.get(state.closet.unlockedGarmentIds.find(isHistoricalGarment) ?? content.garments[0].id)!);
      return createScopedSession(fallback, 'studio');
    }
    const fallback = initial && isHistoricalGarment(initial.garmentId) ? initial : makeDraft(content.garmentsById.get(state.closet.unlockedGarmentIds.find(isHistoricalGarment) ?? content.garments[0].id)!);
    return createScopedSession(fallback, 'studio');
  });

  const [tab, setTab] = useState<WardrobeTab>('garment');
  const [name, setName] = useState('');
  const [comparison, setComparison] = useState<StudioDraft | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const [sparkle, setSparkle] = useState(0);
  const [lookbookModalOpen, setLookbookModalOpen] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  const lookbookOpenRef = useRef<HTMLButtonElement>(null);
  const preset = state.profile?.avatarPreset ?? 'an-default';
  const draft = session.current;

  const challengeWardrobe = useMemo(() => {
    if (!puzzleId) return null;
    return getChallengeWardrobe(state, puzzleId, content);
  }, [state, puzzleId]);

  const loanGarmentIds: string[] = challengeWardrobe?.ok ? challengeWardrobe.borrowedGarmentIds : [];
  const loanAccessoryIds: string[] = challengeWardrobe?.ok ? challengeWardrobe.borrowedAccessoryIds : [];

  useEffect(() => {
    if (challengeWardrobe && !challengeWardrobe.ok) {
      notify(challengeWardrobe.reason);
    }
  }, [challengeWardrobe, notify]);

  const lastPersistedRef = useRef<string>('');
  useEffect(() => {
    if (!puzzleId) return;
    const answer = draftToAnswerRecord(draft);
    const serialized = JSON.stringify(answer);
    const savedAnswer = state.journey[state.currentChapter]?.puzzleDrafts?.[puzzleId]?.answer;
    const savedSerialized = savedAnswer ? JSON.stringify(savedAnswer) : '';

    if (serialized === lastPersistedRef.current || (lastPersistedRef.current === '' && serialized === savedSerialized)) {
      lastPersistedRef.current = serialized;
      return;
    }
    lastPersistedRef.current = serialized;
    send({ type: 'puzzle/updateDraft', payload: { puzzleId, draft: { type: 'styling', answer } } });
  }, [draft, puzzleId, send, state.currentChapter, state.journey]);

  const evaluation = evaluateOutfit(draft, { eventId: draft.eventContextId }, content);

  const update = (cmd: Command) => {
    const result = runCommand({ ...state, activeSession: draft }, cmd, content);
    if (!result.ok) {
      notify(result.reason);
      return;
    }
    const candidateDraft = result.state.activeSession as StudioDraft;
    if (puzzleId) {
      const check = validateChallengeStudioDraft(state, puzzleId, candidateDraft, content);
      if (!check.ok) {
        notify(check.reason);
        return;
      }
    } else {
      const check = validateStudioDraft(state, candidateDraft, content, true);
      if (!check.ok) {
        notify(check.reason);
        return;
      }
    }
    setSession(current => dispatchSession(current, () => candidateDraft));
    if (cmd.type !== 'studio/selectEvent') setSparkle(count => count + 1);
  };

  const selectGarment = (garment: Garment) =>
    update({
      type: 'studio/applyPreset',
      payload: {
        preset: {
          ...draft,
          garmentId: garment.id,
          silhouette: garment.silhouette,
          colorPalette: garment.defaultColorPalette,
        },
      },
    });

  const save = () => {
    const hasBorrowedGarment =
      loanGarmentIds.includes(draft.garmentId) && !state.closet.unlockedGarmentIds.includes(draft.garmentId);
    const hasBorrowedAccessory = Object.values(draft.equippedAccessories).some(
      id => id && loanAccessoryIds.includes(id) && !state.closet.unlockedAccessoryIds.includes(id)
    );
    if (challenge || hasBorrowedGarment || hasBorrowedAccessory) {
      notify('Bộ phối đang có đồ mượn của thử thách. Không thể lưu vào tủ đồ cá nhân.');
      return;
    }
    const result = commitSession(session);
    if (!result.ok) {
      notify(result.reason);
      return;
    }
    if (
      send({
        ...result.command,
        payload: {
          ...(result.command.payload as object),
          name: name.trim() || content.garmentsById.get(draft.garmentId)?.name,
        },
      })
    ) {
      pop(saveRef.current);
    }
  };

  const handleUndo = () => {
    setSession(s => {
      const next = undoSession(s);
      if (puzzleId) {
        const check = validateChallengeStudioDraft(state, puzzleId, next.session.current, content);
        if (!check.ok) {
          notify(check.reason);
          return s;
        }
      }
      return next.session;
    });
  };

  const handleRedo = () => {
    setSession(s => {
      const next = redoSession(s);
      if (puzzleId) {
        const check = validateChallengeStudioDraft(state, puzzleId, next.session.current, content);
        if (!check.ok) {
          notify(check.reason);
          return s;
        }
      }
      return next.session;
    });
  };

  const handleReset = () => {
    setSession(s => {
      const next = resetSession(s);
      if (puzzleId) {
        const check = validateChallengeStudioDraft(state, puzzleId, next.current, content);
        if (!check.ok) {
          notify(check.reason);
          return s;
        }
      }
      return next;
    });
  };

  const stripAccessories = () => {
    setSession(s => {
      const candidate: StudioDraft = { ...s.current, equippedAccessories: {} };
      if (puzzleId) {
        const check = validateChallengeStudioDraft(state, puzzleId, candidate, content);
        if (!check.ok) {
          notify(check.reason);
          return s;
        }
      }
      return dispatchSession(s, () => candidate);
    });
  };

  const undo = (
    <button aria-label="Hoàn tác" disabled={!session.history.length} onClick={handleUndo}>
      Hoàn tác
    </button>
  );
  const redo = (
    <button aria-label="Làm lại" disabled={!session.future.length} onClick={handleRedo}>
      Làm lại
    </button>
  );

  return (
    <div className="room studio-room studio-book-room" style={{ '--studio-tray-art': `url("${asset('assets/screens/studio/styling-tray--9slice-v2.png')}")` } as CSSProperties}>
      <picture className="room-background">
        <img
          className="art-hires"
          src={asset('assets/screens/studio/studio-c-backplate.png')}
          alt="Phòng may gỗ Việt với lụa hồng, gốm men lam và thảm hoa sen"
        />
      </picture>
      {challengeWardrobe && !challengeWardrobe.ok && (
        <div className="room-status error" role="alert">
          {challengeWardrobe.reason}
        </div>
      )}
      <StudioBook state={state} draft={draft} tab={tab} onTab={setTab} palettes={palettes}
        onGarment={selectGarment} onColor={palette => update({ type: 'studio/setColor', payload: { colorPalette: palette.colors } })}
        onAccessory={accessoryId => update({ type: 'studio/equip', payload: { accessoryId } })}
        onEvent={eventId => update({ type: 'studio/selectEvent', payload: { eventId } })} events={events}
        loanGarmentIds={loanGarmentIds} loanAccessoryIds={loanAccessoryIds} preset={preset} viewIndex={viewIndex}
        onView={setViewIndex} sparkle={sparkle} score={evaluation.score} undo={undo} redo={redo}
        onSave={save} onOptions={() => setOptionsOpen(true)} onLookbook={() => setLookbookModalOpen(true)}
        saveRef={saveRef} lookbookRef={lookbookOpenRef} inert={lookbookModalOpen || optionsOpen}
        update={update} notify={notify} challenge={challenge?.(draft)} />
      <StudioLookbookAi draft={draft} gender={state.profile?.gender ?? 'female'} playerName={state.profile?.name ?? 'An'}
        eventId={draft.eventContextId ?? 'dao_pho'} eventName={events.find(e => e.id === draft.eventContextId)?.name ?? events[0].name}
        open={lookbookModalOpen} onClose={() => setLookbookModalOpen(false)} openerRef={lookbookOpenRef} onSave={save}
        garmentIds={[...new Set([...state.closet.unlockedGarmentIds, ...loanGarmentIds])]}
        onGarment={id => { const garment = content.garmentsById.get(id); if (garment) selectGarment(garment); }} />
      {optionsOpen && (
        <Modal title="Tùy chỉnh bộ phối" className="studio-options" onClose={() => setOptionsOpen(false)}>
          <label className="outfit-name">
            Tên bộ phối
            <input
              maxLength={36}
              placeholder="Nếp áo của An"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <button className="studio-pin" onClick={() => setComparison(comparison ? null : structuredClone(draft))}>
            {comparison ? 'Đóng so sánh' : 'Ghim để so sánh'}
          </button>
          {comparison && (
            <div className="studio-comparison">
              <StudioCharacter
                id="comparison-doll"
                draft={comparison}
                direction="down"
                label="Bộ phối đã ghim"
                preset={preset}
              />
              <p>
                Bộ phối đã ghim
                <br />
                <strong>{content.garmentsById.get(comparison.garmentId)?.name}</strong>
              </p>
            </div>
          )}
          <label className="studio-event">
            Sự kiện
            <select
              value={draft.eventContextId}
              onChange={e => update({ type: 'studio/selectEvent', payload: { eventId: e.target.value } })}
            >
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          {Object.values(draft.equippedAccessories).some(Boolean) && (
            <button className="studio-pin" onClick={stripAccessories}>
              Tháo phụ kiện
            </button>
          )}
          <div className="session-tools">
            {undo}
            {redo}
            <button onClick={handleReset}>Đặt lại</button>
          </div>
          <div className="evaluation">
            <strong>Độ hài hòa · {evaluation.score}/100</strong>
            <meter min={0} max={100} value={evaluation.score} />
            {evaluation.feedback
              .filter(f => f.type !== 'info')
              .map((f, i) => (
                <p key={i}>{f.message}</p>
              ))}
          </div>
          <p className="fine-print">Lookbook dùng bộ đồ đang phối. Mở sổ ảnh trên bàn để xem bốn góc chụp.</p>
        </Modal>
      )}
    </div>
  );
}
