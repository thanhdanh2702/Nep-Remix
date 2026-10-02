import { useEffect, useRef, useState } from 'react';
import { type Command, type GameState, type StudioDraft } from '../core';
import { content, execute, freshTree, restoreGame, saveGame } from './store';
import { asset, itemAsset, brandingAssets } from './assets';
import { Scene, type Destination } from './Scene';
import { Slice, CARD_FRAME } from './Slice';
import { Studio } from './Studio';
import { Closet } from './Rooms';
import { Museum } from './Museum';
import { Modal } from './Modal';
import type { ChapterId } from '../content/schema';
import './game.css';
import './fullscreen.css';
import './hub.css';
import { AreaSign } from './AreaSign';
import { JourneyMap } from './JourneyMap';

type Screen = 'hub' | Destination;
type Panel = 'journal' | 'settings' | 'restart' | 'ending' | null;
const screenNames:Record<Screen,string>={hub:'Sân nhà',studio:'Phòng phối đồ',closet:'Tủ đồ',museum:'Bảo tàng',journey:'Cốt truyện'};
export default function Game({ embedded = false, paused = false, navigationRequest, onBlockedChange }: {
  embedded?: boolean;
  paused?: boolean;
  navigationRequest?: { screen: Destination; id: number } | null;
  onBlockedChange?: (blocked: boolean) => void;
} = {}) {
  const [restored] = useState(restoreGame);
  const [tree,setTree] = useState(restored.tree);
  const treeRef=useRef(tree); treeRef.current=tree;
  const state=tree.nodes[tree.headId].snapshot;
  const progress=state.journey[state.currentChapter];
  const chapter=content.chapters[state.currentChapter];
  const area=chapter.areas.find(a=>a.id===progress.currentArea)!;
  const [screen,setScreen]=useState<Screen>(progress.activeDialogue?'journey':'hub');
  const [journeyView,setJourneyView]=useState<'map'|'scene'>(progress.activeDialogue?'scene':'map');
  const [mapChapter,setMapChapter]=useState<ChapterId|null>(null);
  const showingMap=screen==='journey' && journeyView==='map';
  const [panel,setPanel]=useState<Panel>(null);
  const [museumReading,setMuseumReading]=useState(false);
  const [puzzleId,setPuzzleId]=useState<string|null>(null);
  const [selectedItem,setSelectedItem]=useState('');
  const [toast,setToast]=useState(restored.hasSave ? '' : restored.notice);
  const [saveFailed,setSaveFailed]=useState(false);
  const [portrait,setPortrait]=useState(()=>matchMedia('(max-width:640px)').matches);
  const [intro,setIntro]=useState(()=>{if(embedded)return false;try{return !localStorage.getItem('tiem-may-nep-visited');}catch{return true;}});
  const [studioDraft,setStudioDraft]=useState<StudioDraft|undefined>();
  const [profileName,setProfileName]=useState(state.profile?.name ?? 'An');
  const [preset,setPreset]=useState(state.profile?.avatarPreset ?? 'an-default');
  const [feedback,setFeedback]=useState('');
  const dialogue=chapter.dialogues.find(d=>d.id===progress.activeDialogue?.dialogueId);
  const node=dialogue?.nodes.find(n=>n.id===progress.activeDialogue?.currentNodeId);
  const puzzle=chapter.puzzles.find(p=>p.id===puzzleId);
  const internalBlocked=Boolean(panel || puzzle || progress.activeDialogue || museumReading || mapChapter);
  const blocked=paused || internalBlocked;
  useEffect(()=>{onBlockedChange?.(internalBlocked);},[internalBlocked,onBlockedChange]);

  function send(command:Command):GameState|null {
    const result=execute(treeRef.current,command);
    if(!result.ok){setToast(result.reason);return null;}
    treeRef.current=result.tree;setTree(result.tree);
    setSaveFailed(!saveGame(result.tree));
    const messages=result.events.map(event=>{
      if(event.type==='itemPicked')return `Đã nhận ${content.itemsById.get(event.payload.itemId)?.name ?? event.payload.itemId}.`;
      if(event.type==='clueCollected')return `Đã thêm “${content.cluesById.get(event.payload.clueId)?.title}” vào sổ manh mối.`;
      if(event.type==='rewardGranted')return `${(event.payload.amount ?? 0)>0?'+':''}${event.payload.amount} Sen Ngọc`;
      if(event.type==='outfitSaved')return 'Đã lưu bộ phối vào Tủ đồ.';
      return '';
    }).filter(Boolean);
    if(messages.length)setToast(messages.join(' '));
    return result.tree.nodes[result.tree.headId].snapshot;
  }
  useEffect(()=>{const media=matchMedia('(max-width:640px)');const update=()=>setPortrait(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),6000);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{setSaveFailed(!saveGame(treeRef.current));},[]);
  useEffect(()=>{
    if(state.currentChapter==='prologue' && !progress.claimed && !progress.activeDialogue && progress.completedDialogueIds.includes('d-c0-ba-dan-do') && chapter.puzzles.every(p=>progress.solvedPuzzleIds.includes(p.id))){
      const completed=send({type:'chapter/complete',payload:{chapterId:'prologue'}});
      if(completed && send({type:'reward/claim',payload:{chapterId:'prologue'}}))setPanel('ending');
    }
  },[tree.headId]);

  const navigate=(next:Screen)=>{if(blocked)return;setStudioDraft(undefined);if(next==='journey')setJourneyView('map');setScreen(next);};
  const openMap=()=>{setPanel(null);setJourneyView('map');setScreen('journey');};
  const selectChapter=(id:ChapterId)=>{
    if(blocked || state.journey[id].status==='locked')return;
    // Only the prologue currently has a complete world and collision map.
    if(id!=='prologue'){setMapChapter(id);return;}
    if(state.currentChapter!==id && !send({type:'chapter/enter',payload:{chapterId:id}}))return;
    setJourneyView('scene');
  };
  useEffect(()=>{
    if(navigationRequest)navigate(navigationRequest.screen);
  },[navigationRequest]);
  const interact=(id:string,pos:{x:number;y:number})=>{
    const target=area.interactables.find(i=>i.id===id);
    if(!target)return;
    if(!send({type:'interact',payload:{targetId:id,playerPos:pos}}))return;
    if(target.action.type==='puzzle'){setPuzzleId(target.action.targetId);setSelectedItem('');setFeedback('');}
  };
  const advance=()=>{
    const stairs=dialogue?.id==='d-c0-stairs';
    const next=send({type:'dialogue/advance',payload:{}});
    if(stairs && next && !next.journey[next.currentChapter].activeDialogue && area.exits.stairs)send({type:'area/goTo',payload:{areaId:area.exits.stairs}});
  };
  const submitPuzzle=()=>{
    if(!puzzle)return;
    const result=send({type:'puzzle/submit',payload:{puzzleId:puzzle.id,answer:puzzle.type==='use'&&!puzzle.solution.requiredItemId?'interact':selectedItem}});
    if(result?.journey[state.currentChapter].solvedPuzzleIds.includes(puzzle.id)){setPuzzleId(null);setFeedback('');}
    else setFeedback('Món này chưa dùng được ở đây. Hãy xem gợi ý của Nếp hoặc tìm thêm trong phòng.');
  };
  const visit=()=>{setIntro(false);try{localStorage.setItem('tiem-may-nep-visited','yes');}catch{/* Progress remains available in memory. */}};

  return <div className={`app-shell screen-${screen}${showingMap?' screen-journey-map':''}`}>
    <header className="site-header">
      <button className="brand" aria-label="Tiệm May Nếp · Về sân nhà" onClick={()=>navigate('hub')} disabled={blocked}><img src={asset(brandingAssets.logo)} alt="Việt Phục"/><span>TIỆM MAY NẾP</span></button>
      <Slice path="assets/screens/main-shop/ui-hud--3slice.png" className="tagline">Một tà áo. Muôn câu chuyện.</Slice>
      <div className="header-actions">
        {screen==='hub' ? <>
          <div className="hub-wallet">
            <img src={asset(brandingAssets.currencyHud)} alt=""/>
            <strong aria-label={`${state.wallet.senNgoc} Sen Ngọc`}>{state.wallet.senNgoc.toLocaleString('vi-VN')}</strong>
          </div>
          <button className="hub-settings-button" aria-label="Cài đặt" title="Cài đặt" disabled={blocked} onClick={()=>setPanel('settings')}>
            <img src={asset(brandingAssets.settingsButton)} alt=""/>
          </button>
        </> : <>
          <Slice path="assets/screens/main-shop/ui-hud--3slice.png" fillCenter={false} className="hud"><img src={asset(brandingAssets.coin)} alt=""/><strong aria-label={`${state.wallet.senNgoc} Sen Ngọc`}>{state.wallet.senNgoc.toLocaleString('vi-VN')} <span>Sen Ngọc</span></strong></Slice>
          <button className="settings-button" disabled={blocked} onClick={()=>setPanel('settings')}>Cài đặt</button>
        </>}
      </div>
    </header>
    {screen!=='hub' && <button className="back-home" disabled={blocked} onClick={()=>navigate('hub')}>‹ Về sân nhà</button>}
    {(screen!=='hub'||portrait) && <nav className="main-nav" aria-label="Các khu vực">{(['studio','closet','museum','journey'] as Screen[]).map(id=>screen==='hub'?<AreaSign key={id} disabled={blocked} onClick={()=>navigate(id)}>{screenNames[id]}</AreaSign>:<button key={id} aria-current={screen===id?'page':undefined} disabled={blocked} onClick={()=>navigate(id)}>{screenNames[id]}</button>)}</nav>}
    <main>
      <h1 className="screen-reader-only">{screenNames[screen]}</h1>
      {(screen==='hub'||(screen==='journey'&&!showingMap)) && <div className="play-area"><Scene key={screen} state={state} hub={screen==='hub'} portrait={portrait} blocked={blocked} onInteract={interact} onNavigate={navigate}/></div>}
      {showingMap && <JourneyMap state={state} paused={blocked} onSelect={selectChapter} onHome={()=>navigate('hub')}/>}
      {screen==='studio' && <Studio state={state} send={send} notify={setToast} initial={studioDraft}/>}
      {screen==='closet' && <Closet state={state} send={send} onStudio={draft=>{setStudioDraft(draft);setScreen('studio');}}/>}
      {screen==='museum' && <Museum state={state} send={send} onReadingChange={setMuseumReading}/>}
      {screen==='hub' && intro && <div className="hub-cards"><Slice path={CARD_FRAME} className="welcome-card"><img className="welcome-avatar" src={asset('assets/paperdoll/avatar-female-default.png')} alt="An"/><div><h2>Bắt đầu câu chuyện của bạn</h2><p>Đi cùng An qua những nếp áo và ký ức gia đình.</p><div className="actions"><button className="primary" onClick={()=>setPanel('settings')}>Chọn diện mạo</button><button onClick={visit}>Dạo quanh sân nhà</button></div></div></Slice></div>}
      {screen==='journey' && !showingMap && <><div className="journey-toolbar"><button disabled={blocked || !progress.navStack.length} onClick={()=>send({type:'area/goBack',payload:{}})}>Về tiệm may</button><button disabled={blocked} onClick={()=>setPanel('journal')}>Túi đồ & Sổ manh mối</button><button disabled={blocked} onClick={openMap}>Bản đồ chương</button><span>{progress.solvedPuzzleIds.length}/{chapter.puzzles.length} câu đố đã giải</span></div><div className="inventory-strip" aria-label="Túi đồ">{state.inventory.itemIds.map(id=>{const path=itemAsset(id);return <button key={id} disabled={blocked} onClick={()=>{setSelectedItem(id);setPanel('journal');}} title={content.itemsById.get(id)?.description}>{path&&<img src={asset(path)} alt=""/>}<span>{content.itemsById.get(id)?.name}</span></button>;})}</div></>}
      {screen==='journey' && !showingMap && <p className="controls-help"><kbd>W A S D</kbd> / phím mũi tên · Di chuyển <span><kbd>E</kbd> · Tương tác khi đến gần</span></p>}
    </main>
    {screen!=='hub' && <span className={`save-state ${saveFailed?'error':''}`} role="status">{saveFailed?'Chưa lưu được trên thiết bị':'Đã lưu trên thiết bị'}</span>}
    {toast && <div className="toast" role="status">{toast}<button onClick={()=>setToast('')} aria-label="Đóng thông báo">Đóng</button></div>}
    {dialogue && node && <Modal title={dialogue.speaker}><p className="dialogue-text">{node.text}</p>{node.choices?.length?<div className="actions">{node.choices.map((c,i)=><button key={i} onClick={()=>send({type:'dialogue/choose',payload:{choiceIndex:i}})}>{c.text}</button>)}</div>:<button className="primary" onClick={advance}>{dialogue.id==='d-c0-stairs'?'Bước lên gác xép':node.nextNodeId?'Tiếp tục':'Khép lời kể'}</button>}</Modal>}
    {puzzle && <Modal title={puzzle.title} onClose={()=>setPuzzleId(null)}><p>Chọn thao tác hoặc vật phẩm An đang mang theo.</p>{puzzle.type==='use' && puzzle.solution.requiredItemId && <div className="puzzle-items">{state.inventory.itemIds.map(id=><button key={id} className={selectedItem===id?'selected':''} onClick={()=>setSelectedItem(id)}>{itemAsset(id)&&<img src={asset(itemAsset(id)!)} alt=""/>}{content.itemsById.get(id)?.name}</button>)}</div>}<div className="actions"><button className="primary" disabled={puzzle.type==='use'&&Boolean(puzzle.solution.requiredItemId)&&!selectedItem} onClick={submitPuzzle}>{puzzle.id==='p-c0-cloth'?'Gỡ tấm vải phủ':'Dùng vật phẩm'}</button><button disabled={(progress.hintTiers[puzzle.id]??0)>=3} onClick={()=>send({type:'puzzle/hint',payload:{puzzleId:puzzle.id}})}>Nếp gợi ý ({progress.hintTiers[puzzle.id]??0}/3)</button></div>{puzzle.hints.slice(0,progress.hintTiers[puzzle.id]??0).map((hint,i)=><p key={i} className="hint">{hint}</p>)}{feedback && <p role="status" className="error">{feedback}</p>}</Modal>}
    {panel==='journal' && <Modal title="Túi đồ & Sổ manh mối" wide onClose={()=>setPanel(null)}><div className="journal-columns"><section><h3>Vật phẩm của An</h3>{state.inventory.itemIds.map(id=><article className="journal-item" key={id}>{itemAsset(id)&&<img src={asset(itemAsset(id)!)} alt=""/>}<div><strong>{content.itemsById.get(id)?.name}</strong><p>{content.itemsById.get(id)?.description}</p></div></article>)}</section><section><h3>Những lời đã ghi nhớ</h3>{!state.notebook.unlockedClueIds.length && <p>Trò chuyện và khám phá để ghi lại manh mối.</p>}{state.notebook.unlockedClueIds.map(id=><article key={id}><h4>{content.cluesById.get(id)?.title}</h4><p>{content.cluesById.get(id)?.description}</p></article>)}</section></div></Modal>}
    {panel==='settings' && <Modal title="Diện mạo & Cài đặt" onClose={()=>setPanel(null)}><label>Tên nhân vật<input value={profileName} maxLength={12} onChange={e=>setProfileName(e.target.value)}/></label><label>Nếp tóc<select value={preset.includes('bob')?'bob':'long'} onChange={e=>setPreset(`an-${e.target.value}-${preset.includes('jade')?'jade':preset.includes('rose')?'rose':'default'}`)}><option value="long">Tóc dài</option><option value="bob">Tóc ngắn</option></select></label><label>Nếp áo<select value={preset.includes('jade')?'jade':preset.includes('rose')?'rose':'default'} onChange={e=>setPreset(`an-${preset.includes('bob')?'bob':'long'}-${e.target.value}`)}><option value="default">Kem lụa</option><option value="jade">Xanh ngọc</option><option value="rose">Hồng sen</option></select></label><p className="fine-print">Chọn từ các lớp hình đã có trong tiệm. Hiện chưa có tệp âm thanh để phát.</p><div className="actions"><button className="primary" onClick={()=>{send({type:'profile/update',payload:{name:profileName.trim()||'An',avatarPreset:preset}});setPanel(null);}}>Lưu diện mạo</button><button onClick={()=>setPanel('restart')}>Chơi lại từ đầu</button></div></Modal>}
    {panel==='restart' && <Modal title="Bắt đầu lại câu chuyện?" onClose={()=>setPanel('settings')}><p>Thao tác này xóa tiến trình, Sen Ngọc và bộ phối đã lưu trên thiết bị này.</p><div className="actions"><button className="primary" onClick={()=>{const next=freshTree();treeRef.current=next;setTree(next);setSaveFailed(!saveGame(next));setPanel(null);setPuzzleId(null);setScreen('hub');setIntro(true);setToast('Một câu chuyện mới đã bắt đầu.');}}>Chơi lại từ đầu</button><button onClick={()=>setPanel('settings')}>Giữ câu chuyện hiện tại</button></div></Modal>}
    {mapChapter && <Modal title={content.chapters[mapChapter].chapter.title} onClose={()=>setMapChapter(null)}><p>{content.chapters[mapChapter].chapter.summary}</p><p className="fine-print">Bạn đã mở khóa ký ức này. Phần chơi của chương đang được chuẩn bị.</p><button onClick={()=>setMapChapter(null)}>Trở về bản đồ</button></Modal>}
    {panel==='ending' && <Modal title="Nếp ký ức đầu tiên" wide onClose={()=>setPanel(null)}><img className="ending-art" src={asset('assets/areas/prologue/c0-s2-gac-xep-chiec-ruong/cg-prologue-mo-ruong-hoi-sinh.png')} alt="An mở chiếc rương gia bảo trong ánh sáng vàng"/><p>{content.cluesById.get('clue-ba-dan-do')?.description}</p><strong>Đã hoàn thành Màn mở đầu · +50 Sen Ngọc</strong><div className="actions"><button className="primary" onClick={()=>{setPanel(null);setScreen('hub');}}>Về sân nhà</button><button onClick={openMap}>Xem bản đồ chương</button></div></Modal>}
  </div>;
}
