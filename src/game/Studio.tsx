import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createScopedSession, dispatchSession, undoSession, redoSession, resetSession, commitSession, runCommand, evaluateOutfit, type GameState, type StudioDraft, type Command } from '../core';
import type { Garment } from '../content/schema';
import { content } from './store';
import { asset } from './assets';
import { Modal } from './Modal';
import { MannequinStage } from './MannequinStage';
import { pop } from '../ui/motion';
import { StudioCharacter, studioViews } from './StudioCharacter';
import { StudioWardrobe, type WardrobeTab } from './StudioWardrobe';
import { StudioStylist } from './StudioStylist';
import { StudioLookbookAi } from './StudioLookbookAi';
import './studio.css';

export const events = [{id:'dao_pho',name:'Dạo phố'},{id:'tet',name:'Tết'},{id:'dam_cuoi',name:'Lễ cưới'},{id:'be_giang',name:'Bế giảng'},{id:'le_chua',name:'Lễ chùa'},{id:'vieng_tang',name:'Viếng tang'}];
const palettes: {name:string;colors:[string,string,string,string]}[] = [
  {name:'Củ nâu',colors:['#C4A482','#6B4423','#50321A','#2C1608']},
  {name:'Chàm',colors:['#637687','#2D3E50','#1E2A38','#101720']},
  {name:'Đỏ son',colors:['#E7A08E','#B83A24','#8B261E','#3A1916']},
  {name:'Hoàng yến',colors:['#F3DF9F','#CFA449','#907030','#382B02']},
  {name:'Men lam',colors:['#B1D0BE','#2D6A5D','#204D44','#102923']},
  {name:'Giấy dó',colors:['#FFFFFF','#F5EFEB','#D6CCC2','#8D8175']},
];
export function makeDraft(garment: Garment): StudioDraft {
  return {type:'studio',eventContextId:'dao_pho',silhouette:garment.silhouette,garmentId:garment.id,colorPalette:[...garment.defaultColorPalette],equippedAccessories:{}};
}
// The Core draft stores strings. Keep palette and optional fields alongside solution fields.
function resumeChallenge(state: GameState, fallback: StudioDraft): StudioDraft {
  const active = state.activeSession;
  if (active?.type !== 'puzzle') return fallback;
  const challengePuzzleId = active.puzzleId;
  const saved = state.journey[state.currentChapter].puzzleDrafts?.[challengePuzzleId];
  if (saved?.type !== 'styling') return { ...fallback, ...(challengePuzzleId ? { challengePuzzleId } : {}) } as StudioDraft;
  const answer = saved.answer;
  const garment = content.garmentsById.get(answer.garmentId) ?? content.garmentsById.get(fallback.garmentId);
  if (!garment) return { ...fallback, ...(challengePuzzleId ? { challengePuzzleId } : {}) } as StudioDraft;
  const colors = [answer.color0, answer.color1, answer.color2, answer.color3];
  const palette = colors.every(c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c))
    ? colors as StudioDraft['colorPalette'] : garment.defaultColorPalette;
  const equippedAccessories: StudioDraft['equippedAccessories'] = {};
  for (const [slot, field] of Object.entries({ headwear: 'headwearId', footwear: 'footwearId', handheld: 'handheldId', jewelry: 'jewelryId' })) {
    if (content.accessoriesById.has(answer[field])) equippedAccessories[slot] = answer[field];
  }
  return {
    ...fallback,
    garmentId: garment.id,
    silhouette: garment.silhouette,
    colorPalette: [...palette],
    equippedAccessories,
    eventContextId: answer.eventContextId ?? fallback.eventContextId,
    motifId: answer.motifId,
    ...(challengePuzzleId ? { challengePuzzleId } : {})
  } as StudioDraft;
}
// `challenge` turns the room into a puzzle: it receives the live draft and renders the submit / cancel controls.
export function Studio({ state, send, notify, initial, challenge }: { state: GameState; send: (cmd:Command)=>GameState|null; notify:(message:string)=>void; initial?: StudioDraft; challenge?: (draft:StudioDraft)=>ReactNode }) {
  const [session, setSession] = useState(() => {
    const fallback = initial ?? makeDraft(content.garmentsById.get(state.closet.unlockedGarmentIds[0])!);
    return createScopedSession(challenge ? resumeChallenge(state, fallback) : fallback, 'studio');
  });
  const [tab,setTab] = useState<WardrobeTab>('garment');
  const [name,setName] = useState('');
  const [comparison,setComparison] = useState<StudioDraft | null>(null);
  const [optionsOpen,setOptionsOpen] = useState(false);
  const [viewIndex,setViewIndex] = useState(0);
  const [sparkle,setSparkle] = useState(0);
  const saveRef = useRef<HTMLButtonElement>(null);
  const view = studioViews[viewIndex];
  const preset = state.profile?.avatarPreset ?? 'an-default';
  const turn = (step:number) => setViewIndex(index => (index + step + studioViews.length) % studioViews.length);
  const draft = session.current;
  const puzzleId = challenge && state.activeSession?.type === 'puzzle' ? state.activeSession.puzzleId : undefined;
  const getChallengeWardrobe = (typeof globalThis !== 'undefined'
    ? (globalThis as Record<string, unknown>)['getChallengeWardrobe']
    : undefined) as
    | ((s: GameState, p: string, c: typeof content) => { ok: boolean; borrowedGarmentIds: string[]; borrowedAccessoryIds: string[] })
    | undefined;
  const challengeWardrobe = puzzleId && typeof getChallengeWardrobe === 'function'
    ? getChallengeWardrobe(state, puzzleId, content)
    : null;
  const loanGarmentIds: string[] = challengeWardrobe?.ok
    ? challengeWardrobe.borrowedGarmentIds
    : ((challengePuzzle as any)?.loanWardrobe?.garmentIds ?? (challenge ? ['ao-dai-lemur'] : []));
  const loanAccessoryIds: string[] = challengeWardrobe?.ok
    ? challengeWardrobe.borrowedAccessoryIds
    : ((challengePuzzle as any)?.loanWardrobe?.accessoryIds ?? (challenge ? ['khan-van-den', 'guoc-moc'] : []));

  useEffect(() => {
    if (!puzzleId) return;
    const answer = Object.fromEntries(Object.entries({
      garmentId: draft.garmentId, silhouette: draft.silhouette,
      headwearId: draft.equippedAccessories.headwear, footwearId: draft.equippedAccessories.footwear,
      handheldId: draft.equippedAccessories.handheld, jewelryId: draft.equippedAccessories.jewelry,
      color0: draft.colorPalette[0], color1: draft.colorPalette[1], color2: draft.colorPalette[2], color3: draft.colorPalette[3],
      eventContextId: draft.eventContextId, motifId: draft.motifId,
    }).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0));
    send({ type: 'puzzle/updateDraft', payload: { puzzleId, draft: { type: 'styling', answer } } });
  }, [draft, puzzleId]);
  const evaluation = evaluateOutfit(draft, {eventId:draft.eventContextId},content);
  const update = (cmd:Command) => {
    const result = runCommand({...state,activeSession:draft},cmd,content);
    if (!result.ok) { notify(result.reason); return; }
    setSession(current => dispatchSession(current,()=>result.state.activeSession as StudioDraft));
    // Garment/colour/accessory changes get the star-dust halo (design-system §7.2).
    if (cmd.type !== 'studio/selectEvent') setSparkle(count => count + 1);
  };
  const selectGarment = (garment:Garment) => update({type:'studio/applyPreset',payload:{preset:{...draft,garmentId:garment.id,silhouette:garment.silhouette,colorPalette:garment.defaultColorPalette}}});
  const wardrobe = (className:string) => <StudioWardrobe className={className} state={state} draft={draft} tab={tab} onTab={setTab} palettes={palettes} onGarment={selectGarment}
    onColor={palette=>update({type:'studio/setColor',payload:{colorPalette:palette.colors}})}
    onAccessory={accessoryId=>update({type:'studio/equip',payload:{accessoryId}})}
    loanGarmentIds={loanGarmentIds} loanAccessoryIds={loanAccessoryIds} />;
  const save = () => {
    const hasBorrowedGarment = loanGarmentIds.includes(draft.garmentId) && !state.closet.unlockedGarmentIds.includes(draft.garmentId);
    const hasBorrowedAccessory = Object.values(draft.equippedAccessories).some(
      id => id && loanAccessoryIds.includes(id) && !state.closet.unlockedAccessoryIds.includes(id)
    );
    if (challenge || hasBorrowedGarment || hasBorrowedAccessory) {
      notify('Bộ phối đang có đồ mượn của thử thách. Không thể lưu vào tủ đồ cá nhân.');
      return;
    }
    const result = commitSession(session);
    if (!result.ok) { notify(result.reason); return; }
    // Game's send() already raises the "Đã lưu bộ phối" success toast.
    if (send({...result.command,payload:{...result.command.payload as object,name:name.trim() || content.garmentsById.get(draft.garmentId)?.name}})) pop(saveRef.current);
  };
  const undo = <button disabled={!session.history.length} onClick={()=>setSession(s=>undoSession(s).session)}>Hoàn tác</button>;
  const redo = <button disabled={!session.future.length} onClick={()=>setSession(s=>redoSession(s).session)}>Làm lại</button>;
  const garmentName = content.garmentsById.get(draft.garmentId)?.name;
  return <div className="room studio-room">
    <picture className="room-background"><img className="art-hires" src={asset('assets/screens/studio/vietnamese-room--landscape.png')} alt="Phòng may gỗ Việt với lụa hồng, gốm men lam và thảm hoa sen" /></picture>
    <MannequinStage room="studio">
      <div className="studio-model">
        <StudioCharacter draft={draft} direction={view.direction} preset={preset}/>
        {sparkle > 0 && <span key={sparkle} className="studio-sparkle" aria-hidden="true" />}
        <div className="studio-turn-controls" role="group" aria-label="Xoay nhân vật">
          <button onClick={()=>turn(-1)} aria-label="Xoay nhân vật sang trái">‹</button>
          <span aria-live="polite">{view.label}</span>
          <button onClick={()=>turn(1)} aria-label="Xoay nhân vật sang phải">›</button>
        </div>
      </div>
      <p className="doll-caption" title={garmentName}>{garmentName}</p>
      {/* Instant feedback outside the modal; hidden (not removed) while the options dialog shows its own copy. */}
      <div className={`studio-session ${optionsOpen ? 'is-covered' : ''}`} role="group" aria-label="Độ hài hòa và lịch sử phối">
        <div className="studio-score" role="meter" aria-label="Độ hài hòa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={evaluation.score}>
          <span><span>Độ hài hòa</span><span>{evaluation.score}/100</span></span>
          <span className="studio-score-bar" style={{'--score':`${evaluation.score}%`} as CSSProperties} />
        </div>
        {undo}{redo}
      </div>
      <StudioStylist state={state} draft={draft} update={update} notify={notify} />
    </MannequinStage>
    {challenge?.(draft)}
    <section className="studio-lookbook" aria-label="Lookbook của bạn">
      <h2 className="studio-lookbook-heading">Lookbook của bạn</h2>
      <StudioLookbookAi draft={draft} eventTitle={events.find(e=>e.id===draft.eventContextId)?.name ?? events[0].name}
        actions={<>
          <button onClick={()=>setOptionsOpen(true)}>Tùy chỉnh bộ phối</button>
          <button ref={saveRef} className="primary" onClick={save}>Lưu bộ phối</button>
        </>}>
        {([
          {id:'front',direction:'down',label:'Chính diện'},
          {id:'side',direction:'left',label:'Góc nghiêng'},
          {id:'back',direction:'up',label:'Sau lưng'},
          {id:'closeup',direction:'down',label:'Cận cảnh'},
        ] as const).map(portrait=><figure key={portrait.id} className={`studio-lookbook-card ${portrait.id==='closeup'?'studio-lookbook-closeup':''}`}>
          <div className="studio-lookbook-portrait">
            <StudioCharacter id={`lookbook-${portrait.id}`} draft={draft} direction={portrait.direction} label={portrait.label} preset={preset}/>
          </div>
          <figcaption>{portrait.label}</figcaption>
        </figure>)}
      </StudioLookbookAi>
    </section>
    {wardrobe('studio-wardrobe-dock')}
    {optionsOpen && <Modal title="Tùy chỉnh bộ phối" className="studio-options" onClose={()=>setOptionsOpen(false)}>
      <label className="outfit-name">Tên bộ phối<input maxLength={36} placeholder="Nếp áo của An" value={name} onChange={e=>setName(e.target.value)} /></label>
      <button className="studio-pin" onClick={()=>setComparison(comparison?null:structuredClone(draft))}>{comparison?'Đóng so sánh':'Ghim để so sánh'}</button>
      {comparison && <div className="studio-comparison"><StudioCharacter id="comparison-doll" draft={comparison} direction="down" label="Bộ phối đã ghim" preset={preset}/><p>Bộ phối đã ghim<br/><strong>{content.garmentsById.get(comparison.garmentId)?.name}</strong></p></div>}
      <label className="studio-event">Sự kiện<select value={draft.eventContextId} onChange={e=>update({type:'studio/selectEvent',payload:{eventId:e.target.value}})}>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
      {Object.values(draft.equippedAccessories).some(Boolean) && <button className="studio-pin" onClick={()=>setSession(s=>dispatchSession(s,d=>({...d,equippedAccessories:{}})))}>Tháo phụ kiện</button>}
      <div className="session-tools">{undo}{redo}<button onClick={()=>setSession(s=>resetSession(s))}>Đặt lại</button></div>
      <div className="evaluation"><strong>Độ hài hòa · {evaluation.score}/100</strong><meter min={0} max={100} value={evaluation.score} />{evaluation.feedback.filter(f=>f.type!=='info').map((f,i)=><p key={i}>{f.message}</p>)}</div>
      <p className="fine-print">Bốn ô Lookbook tự cập nhật theo bộ đồ đang phối.</p>
    </Modal>}
  </div>;
}
