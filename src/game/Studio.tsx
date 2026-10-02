import { useState } from 'react';
import { createScopedSession, dispatchSession, undoSession, redoSession, resetSession, commitSession, runCommand, evaluateOutfit, type GameState, type StudioDraft, type Command } from '../core';
import type { Garment } from '../content/schema';
import { content } from './store';
import { asset } from './assets';
import { Modal } from './Modal';
import { Paperdoll } from './Paperdoll';
import { MannequinStage } from './MannequinStage';
import { StudioCharacter, studioViews } from './StudioCharacter';
import { StudioWardrobe, type WardrobeTab } from './StudioWardrobe';
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
export function Studio({ state, send, notify, initial }: { state: GameState; send: (cmd:Command)=>GameState|null; notify:(message:string)=>void; initial?: StudioDraft }) {
  const [session, setSession] = useState(() => createScopedSession(initial ?? makeDraft(content.garmentsById.get(state.closet.unlockedGarmentIds[0])!), 'studio'));
  const [tab,setTab] = useState<WardrobeTab>('garment');
  const [name,setName] = useState('');
  const [comparison,setComparison] = useState<StudioDraft | null>(null);
  const [optionsOpen,setOptionsOpen] = useState(false);
  const [viewIndex,setViewIndex] = useState(0);
  const view = studioViews[viewIndex];
  const turn = (step:number) => setViewIndex(index => (index + step + studioViews.length) % studioViews.length);
  const draft = session.current;
  const evaluation = evaluateOutfit(draft, {eventId:draft.eventContextId},content);
  const update = (cmd:Command) => {
    const result = runCommand({...state,activeSession:draft},cmd,content);
    if (!result.ok) { notify(result.reason); return; }
    setSession(current => dispatchSession(current,()=>result.state.activeSession as StudioDraft));
  };
  const selectGarment = (garment:Garment) => update({type:'studio/applyPreset',payload:{preset:{...draft,garmentId:garment.id,silhouette:garment.silhouette,colorPalette:garment.defaultColorPalette}}});
  const wardrobe = (className:string) => <StudioWardrobe className={className} state={state} draft={draft} tab={tab} onTab={setTab} palettes={palettes} onGarment={selectGarment}
    onColor={palette=>update({type:'studio/setColor',payload:{colorPalette:palette.colors}})}
    onAccessory={accessoryId=>update({type:'studio/equip',payload:{accessoryId}})} />;
  const save = () => {
    const result = commitSession(session);
    if (result.ok) send({...result.command,payload:{...result.command.payload as object,name:name.trim() || content.garmentsById.get(draft.garmentId)?.name}});
    else notify(result.reason);
  };
  return <div className="room studio-room">
    <picture className="room-background"><img src={asset('assets/screens/studio/vietnamese-room--landscape.png')} alt="Phòng may gỗ Việt với lụa hồng, gốm men lam và thảm hoa sen" /></picture>
    <MannequinStage room="studio">
      <StudioCharacter draft={draft} direction={view.direction} preset={state.profile?.avatarPreset ?? 'an-default'}/>
      <div className="studio-turn-controls" role="group" aria-label="Xoay nhân vật">
        <button onClick={()=>turn(-1)} aria-label="Xoay nhân vật sang trái">‹</button>
        <span aria-live="polite">{view.label}</span>
        <button onClick={()=>turn(1)} aria-label="Xoay nhân vật sang phải">›</button>
      </div>
      <p className="doll-caption">{content.garmentsById.get(draft.garmentId)?.name}</p>
    </MannequinStage>
    <section className="studio-lookbook" aria-label="Lookbook của bạn">
      <h2 className="studio-lookbook-heading">Lookbook của bạn</h2>
      <div className="studio-lookbook-board">
      <div className="studio-lookbook-art" aria-hidden="true"><img src={asset('assets/screens/studio/lookbook-frame.png')} alt="" /></div>
      <div className="studio-lookbook-grid">
        {([
          {id:'front',direction:'down',label:'Chính diện'},
          {id:'side',direction:'left',label:'Góc nghiêng'},
          {id:'back',direction:'up',label:'Sau lưng'},
          {id:'closeup',direction:'down',label:'Cận cảnh'},
        ] as const).map(portrait=><figure key={portrait.id} className={`studio-lookbook-card ${portrait.id==='closeup'?'studio-lookbook-closeup':''}`}>
          <div className="studio-lookbook-portrait">
            <StudioCharacter id={`lookbook-${portrait.id}`} draft={draft} direction={portrait.direction} label={portrait.label} preset={state.profile?.avatarPreset ?? 'an-default'}/>
          </div>
          <figcaption>{portrait.label}</figcaption>
        </figure>)}
      </div>
      </div>
      <div className="studio-actions" role="group" aria-label="Lưu và tùy chỉnh bộ phối">
        <button onClick={()=>setOptionsOpen(true)}>Tùy chỉnh bộ phối</button>
        <button className="primary" onClick={save}>Lưu bộ phối</button>
      </div>
      <div className="studio-lookbook-edge" aria-hidden="true"><img src={asset('assets/screens/studio/lookbook-frame.png')} alt="" /></div>
    </section>
    {wardrobe('studio-wardrobe-dock')}
    {optionsOpen && <Modal title="Tùy chỉnh bộ phối" className="studio-options" onClose={()=>setOptionsOpen(false)}>
      <label className="outfit-name">Tên bộ phối<input maxLength={36} placeholder="Nếp áo của An" value={name} onChange={e=>setName(e.target.value)} /></label>
      <button className="studio-pin" onClick={()=>setComparison(comparison?null:structuredClone(draft))}>{comparison?'Đóng so sánh':'Ghim để so sánh'}</button>
      {comparison && <div className="studio-comparison"><Paperdoll id="comparison-doll" draft={comparison}/><p>Bộ phối đã ghim<br/><strong>{content.garmentsById.get(comparison.garmentId)?.name}</strong></p></div>}
      <label className="studio-event">Sự kiện<select value={draft.eventContextId} onChange={e=>update({type:'studio/selectEvent',payload:{eventId:e.target.value}})}>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
      {(tab==='accessory'||tab==='footwear') && <button className="studio-pin" onClick={()=>setSession(s=>dispatchSession(s,d=>({...d,equippedAccessories:{}})))}>Tháo phụ kiện</button>}
      <div className="session-tools"><button disabled={!session.history.length} onClick={()=>setSession(s=>undoSession(s).session)}>Hoàn tác</button><button disabled={!session.future.length} onClick={()=>setSession(s=>redoSession(s).session)}>Làm lại</button><button onClick={()=>setSession(s=>resetSession(s))}>Đặt lại</button></div>
      <div className="evaluation"><strong>Độ hài hòa · {evaluation.score}/100</strong><meter min={0} max={100} value={evaluation.score} />{evaluation.feedback.filter(f=>f.type!=='info').map((f,i)=><p key={i}>{f.message}</p>)}</div>
      <p className="fine-print">Bốn ô Lookbook tự cập nhật theo bộ đồ đang phối.</p>
    </Modal>}
  </div>;
}
