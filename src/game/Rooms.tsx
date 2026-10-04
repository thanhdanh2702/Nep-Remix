import { useState } from 'react';
import type { Command, GameState, StudioDraft } from '../core';
import { content } from './store';
import { asset, accessoryAsset, garmentAsset, screenAssets } from './assets';
import { Slice, CARD_FRAME } from './Slice';
import { StudioCharacter } from './StudioCharacter';
import { makeDraft } from './Studio';
import { MannequinStage } from './MannequinStage';
import { Workshop } from './Workshop';

type RoomProps = {state:GameState;send:(cmd:Command)=>GameState|null};
export function Closet({state,send,onStudio}:RoomProps & {onStudio:(draft:StudioDraft)=>void}) {
  const [tab,setTab]=useState('garments');
  const [draft,setDraft]=useState(()=>makeDraft(content.garmentsById.get(state.closet.unlockedGarmentIds[0])!));
  return <div className="room closet-room">
    <picture className="room-background"><source media="(max-width:640px)" srcSet={asset(screenAssets.closet+'--portrait.png')}/><img src={asset(screenAssets.closet+'--landscape.png')} alt="Tủ gỗ đựng trang phục và gương soi"/></picture>
    <MannequinStage room="closet"><span className="eyebrow">NHỮNG NẾP ÁO CỦA BẠN</span><StudioCharacter id="closet-doll" draft={draft} direction="down" preset={state.profile?.avatarPreset ?? 'an-default'}/><p className="doll-caption">{content.garmentsById.get(draft.garmentId)?.name}</p><button onClick={()=>onStudio(draft)}>Phối tiếp trong Studio</button></MannequinStage>
    <Slice path={CARD_FRAME} className="room-panel"><span className="eyebrow">BỘ SƯU TẬP</span><h2>Tủ đồ của An</h2><div className="tabs">{[{id:'garments',name:'Áo đã có'},{id:'saved',name:'Bộ đã lưu'},{id:'shop',name:'Cửa hàng'},{id:'workshop',name:'Xưởng may'}].map(t=><button key={t.id} aria-pressed={tab===t.id} onClick={()=>setTab(t.id)}>{t.name}</button>)}</div>
      {tab==='garments' && <div className="catalog">{state.closet.unlockedGarmentIds.map(id=>{const g=content.garmentsById.get(id)!;return <button key={id} className="catalog-item" onClick={()=>setDraft(makeDraft(g))}><img src={asset(garmentAsset(id,true))} alt=""/><span>{g.name}</span></button>;})}</div>}
      {tab==='saved' && <div className="saved-outfits">{!state.closet.savedOutfits.length && <p>Chưa có bộ phối nào. Ghé Phòng phối đồ để lưu nếp áo đầu tiên của bạn.</p>}{state.closet.savedOutfits.map(o=><article key={o.id}><button onClick={()=>setDraft({...makeDraft(content.garmentsById.get(o.garmentId)!),...o,type:'studio'})}>{o.name} · Xem bộ phối</button><button onClick={()=>send({type:'closet/deleteOutfit',payload:{outfitId:o.id}})}>Xóa</button></article>)}</div>}
      {tab==='shop' && <><p className="fine-print">Bạn có {state.wallet.senNgoc} Sen Ngọc. Đọc tư liệu và khám phá câu chuyện để nhận thêm.</p><div className="catalog">{content.accessories.map(a=>{const owned=state.closet.unlockedAccessoryIds.includes(a.id);return <div key={a.id} className="catalog-item"><img src={asset(accessoryAsset(a.id,true))} alt=""/><strong>{a.name}</strong><small>{a.culturalNote}</small><button disabled={owned || state.wallet.senNgoc<a.senNgocPrice} onClick={()=>send({type:'shop/buy',payload:{accessoryId:a.id}})}>{owned?'Đã sở hữu':`${a.senNgocPrice} Sen Ngọc · Mua`}</button></div>;})}</div></>}
      {tab==='workshop' && <Workshop unlockedGarmentIds={state.closet.unlockedGarmentIds} onStudio={onStudio}/>}
    </Slice>
  </div>;
}
