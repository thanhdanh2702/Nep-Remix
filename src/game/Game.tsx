import { useCallback, useEffect, useRef, useState } from 'react';
import './game.css';
import './fullscreen.css';
import './hub.css';
import './stage-embed.css';
import { type Command, type GameState, type StudioDraft } from '../core';
import { content, execute, freshTree, restoreGame, saveGame } from './store';
import { asset, itemAsset, brandingAssets } from './assets';
import { Scene, type Destination } from './Scene';
import { RoomScene } from './RoomScene';
import { flyToInventory } from './fly-to-inventory';
import { Slice, CARD_FRAME } from './Slice';
import { Studio } from './Studio';
import { Closet } from './Rooms';
import { Museum } from './Museum';
import { Modal } from './Modal';
import { PuzzleModal, StyleChallengeBar, ChapterEnding, ACTION_LABEL, unlockerOf } from './PuzzleModal';
import { InventoryCombine } from './InventoryCombine';
import type { ChapterId, ExitArrow, Puzzle } from '../content/schema';
import { AreaSign } from './AreaSign';
import { JourneyMap } from './JourneyMap';
import { Toast, toneFor } from './Toast';
import { DialogueBox } from './DialogueBox';
import { ErrorBoundary } from './ErrorBoundary';
import { countUp, shake, withViewTransition } from '../ui/motion';

type Screen = 'hub' | Destination;
// Sen Ngọc balance that counts up/down when it changes instead of jumping.
function Coins({ value }: { value: number }) {
  const ref=useRef<HTMLSpanElement>(null);
  const previous=useRef(value);
  useEffect(()=>{const from=previous.current;previous.current=value;return countUp(ref.current,from,value,480,n=>n.toLocaleString('vi-VN'));},[value]);
  return <span ref={ref}>{value.toLocaleString('vi-VN')}</span>;
}
type Panel = 'journal' | 'settings' | 'restart' | 'ending' | null;
const PLAYABLE:ChapterId[]=['prologue','c1']; // chapters with a complete world; the rest show the "being prepared" note
const screenNames:Record<Screen,string>={hub:'Sân nhà',studio:'Phòng phối đồ',closet:'Tủ đồ',museum:'Bảo tàng',journey:'Cốt truyện'};
export default function Game({ embedded = false, paused = false, navigationRequest, onBlockedChange, pendingAvatarPreset, onAvatarApplied }: {
  embedded?: boolean;
  paused?: boolean;
  navigationRequest?: { screen: Destination; id: number } | null;
  onBlockedChange?: (blocked: boolean) => void;
  pendingAvatarPreset?: string | null;
  onAvatarApplied?: () => void;
} = {}) {
  const [restored] = useState(restoreGame);
  const [tree,setTree] = useState(restored.tree);
  const treeRef=useRef(tree); treeRef.current=tree;
  const state=tree.nodes[tree.headId].snapshot;
  const progress=state.journey[state.currentChapter];
  const chapter=content.chapters[state.currentChapter];
  const area=chapter.areas.find(a=>a.id===progress.currentArea)!;
  const [screen,setScreen]=useState<Screen>(progress.activeDialogue||state.activeSession?.type==='puzzle'?'journey':'hub');
  const [journeyView,setJourneyView]=useState<'map'|'scene'>(progress.activeDialogue||state.activeSession?.type==='puzzle'?'scene':'map');
  const [mapChapter,setMapChapter]=useState<ChapterId|null>(null);
  const showingMap=screen==='journey' && journeyView==='map';
  const inRoom=screen==='journey' && !showingMap;
  const [panel,setPanel]=useState<Panel>(null);
  const [museumReading,setMuseumReading]=useState(false);
  const [puzzleId,setPuzzleId]=useState<string|null>(null);
  const [puzzleDrafts,setPuzzleDrafts]=useState<Record<string, unknown>>({});
  const [selectedItem,setSelectedItem]=useState(''); // item preselected when the bag opens from the inventory strip
  const [toast,setToast]=useState(restored.hasSave ? '' : restored.notice);
  const [saveFailed,setSaveFailed]=useState(false);
  const [portrait,setPortrait]=useState(()=>matchMedia('(max-width:640px)').matches);
  const [intro,setIntro]=useState(()=>{if(embedded)return false;try{return !localStorage.getItem('tiem-may-nep-visited');}catch{return true;}});
  const [studioDraft,setStudioDraft]=useState<StudioDraft|undefined>();
  const [profileName,setProfileName]=useState(state.profile?.name ?? 'An');
  const [preset,setPreset]=useState(state.profile?.avatarPreset ?? 'an-default');
  const [feedback,setFeedback]=useState('');
  const lastTarget=useRef(''); // hotspot the last click came from: start point of the item-to-bag animation
  const dialogue=chapter.dialogues.find(d=>d.id===progress.activeDialogue?.dialogueId);
  const node=dialogue?.nodes.find(n=>n.id===progress.activeDialogue?.currentNodeId);
  const puzzle=chapter.puzzles.find(p=>p.id===puzzleId && p.type!=='styling');
  const sessionId=state.activeSession?.type==='puzzle'?state.activeSession.puzzleId:'';
  const challenge=inRoom?chapter.puzzles.find(p=>p.id===sessionId && p.type==='styling'):undefined; // styling puzzle = Studio session kept in the save, so a reload resumes it
  const internalBlocked=Boolean(panel || puzzle || challenge || progress.activeDialogue || museumReading || mapChapter);
  const blocked=paused || internalBlocked;
  useEffect(()=>{onBlockedChange?.(internalBlocked);},[internalBlocked,onBlockedChange]);
  // Avatar suggested from the welcome selfie flow: applied once, then the parent clears it. Read the live tree
  // (not the render closure) so a repeated effect run never sends the same update twice.
  useEffect(()=>{
    if(!pendingAvatarPreset)return;
    const head=treeRef.current.nodes[treeRef.current.headId].snapshot;
    if(!head.profile)return;
    if(head.profile.avatarPreset!==pendingAvatarPreset && send({type:'profile/update',payload:{avatarPreset:pendingAvatarPreset}})){
      setPreset(pendingAvatarPreset);
      setToast('Đã áp diện mạo mới');
    }
    onAvatarApplied?.();
  },[pendingAvatarPreset]);

  function send(command:Command):GameState|null {
    const result=execute(treeRef.current,command);
    if(!result.ok){setToast(result.reason);return null;}
    treeRef.current=result.tree;setTree(result.tree);
    setSaveFailed(!saveGame(result.tree));
    result.events.forEach(event=>{if(event.type==='itemPicked'){const icon=itemAsset(event.payload.itemId);if(icon)flyToInventory(asset(icon),lastTarget.current);}});
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
  const closeToast=useCallback(()=>setToast(''),[]);
  useEffect(()=>{setSaveFailed(!saveGame(treeRef.current));},[]);

  const navigate=(next:Screen)=>{if(blocked)return;withViewTransition(()=>{setStudioDraft(undefined);if(next==='journey')setJourneyView('map');setScreen(next);});};
  const openMap=()=>{setPanel(null);setJourneyView('map');setScreen('journey');};
  const selectChapter=(id:ChapterId)=>{
    if(blocked || state.journey[id].status==='locked')return;
    if(!PLAYABLE.includes(id)){setMapChapter(id);return;}
    if(state.currentChapter!==id && !send({type:'chapter/enter',payload:{chapterId:id}}))return;
    setJourneyView('scene');
  };
  useEffect(()=>{if(navigationRequest)navigate(navigationRequest.screen);},[navigationRequest]);
  const interact=(id:string,pos:{x:number;y:number})=>{
    const target=area.interactables.find(i=>i.id===id);
    if(!target)return;
    lastTarget.current=id;
    const left=chapter.puzzles.filter(p=>!progress.solvedPuzzleIds.includes(p.id)).length;
    if(target.action.type==='dialogue' && target.action.targetId===chapter.chapter.completionDialogueId && left){setToast(`Còn ${left} câu đố chưa giải. Hãy xem lại các căn phòng trước khi rời đi.`);return;}
    if(!send({type:'interact',payload:{targetId:id,playerPos:pos}}))return;
    if(target.action.type==='puzzle'){setPuzzleId(target.action.targetId);setFeedback('');}
  };
  const exitArea=(arrow:ExitArrow)=>{const areaId=area.exits[arrow.exit];if(!areaId)return;const opener=unlockerOf(chapter,area,progress.solvedPuzzleIds,progress.unlockedAreaIds,areaId);if(opener)interact(opener.id,opener.pos);else send({type:'area/goTo',payload:{areaId}});};
  const advance=()=>{
    const arrow=(area.exitArrows??[]).find(a=>a.via && area.interactables.find(i=>i.id===a.via)?.action.targetId===dialogue?.id);
    const dest=arrow && area.exits[arrow.exit]; // a dialogue opened by an exit arrow carries the player through it once it ends
    const next=send({type:'dialogue/advance',payload:{}});
    if(dest && dest!==area.id && next && !next.journey[next.currentChapter].activeDialogue)send({type:'area/goTo',payload:{areaId:dest}});
    
    if (next && !next.journey[next.currentChapter].activeDialogue && dialogue?.id === chapter.chapter.completionDialogueId) {
      const p = next.journey[next.currentChapter];
      if (!p.claimed && p.completedDialogueIds.includes(dialogue.id) && chapter.puzzles.every(pz => p.solvedPuzzleIds.includes(pz.id))) {
        if (send({type:'chapter/complete',payload:{chapterId: state.currentChapter}}) && send({type:'reward/claim',payload:{chapterId: state.currentChapter}})) {
          setPanel('ending');
        }
      }
    }
  };
  const submitPuzzle=(target:Puzzle,answer:unknown)=>{
    const result=send({type:'puzzle/submit',payload:{puzzleId:target.id,answer}});
    if(result?.journey[state.currentChapter].solvedPuzzleIds.includes(target.id)){
      setPuzzleId(null);setFeedback('');if(result.activeSession?.type==='puzzle')send({type:'puzzle/close',payload:{}});
    } else {setFeedback(target.type==='styling'?'Bộ này chưa hợp bối cảnh. Hãy xem gợi ý của Nếp rồi phối lại.':'Món này chưa dùng được ở đây. Hãy xem gợi ý của Nếp hoặc tìm thêm trong phòng.');shake(document.querySelector('.modal[role="dialog"], .studio-challenge'));}
  };
  const hint=(target:Puzzle)=>send({type:'puzzle/hint',payload:{puzzleId:target.id}});
  const heading=useRef<HTMLHeadingElement>(null);
  // After a screen swap the old focus target is gone; keep keyboard users in the new screen.
  useEffect(()=>{if(document.activeElement===document.body)heading.current?.focus({preventScroll:true});},[screen,journeyView]);
  const visit=()=>{setIntro(false);try{localStorage.setItem('tiem-may-nep-visited','yes');}catch{/* Progress remains available in memory. */}};

  return <div className={`app-shell screen-${screen}${showingMap?' screen-journey-map':''}${inRoom?' in-room':''}`}>
    <header className="site-header">
      <button className="brand" aria-label="Tiệm May Nếp · Về sân nhà" onClick={()=>navigate('hub')} disabled={blocked}><img src={asset(brandingAssets.logo)} alt="Việt Phục"/><span>TIỆM MAY NẾP</span></button>
      <Slice path="assets/screens/main-shop/ui-hud--3slice.png" className="tagline">Một tà áo. Muôn câu chuyện.</Slice>
      <div className="header-actions">
        {screen==='hub' ? <>
          <div className="hub-wallet">
            <img src={asset(brandingAssets.currencyHud)} alt=""/>
            <strong aria-label={`${state.wallet.senNgoc} Sen Ngọc`}><Coins value={state.wallet.senNgoc}/></strong>
          </div>
          <button className="hub-settings-button" aria-label="Cài đặt" title="Cài đặt" disabled={blocked} onClick={()=>setPanel('settings')}>
            <img src={asset(brandingAssets.settingsButton)} alt=""/>
          </button>
        </> : <>
          <Slice path="assets/screens/main-shop/ui-hud--3slice.png" fillCenter={false} className="hud"><img src={asset(brandingAssets.coin)} alt=""/><strong aria-label={`${state.wallet.senNgoc} Sen Ngọc`}><Coins value={state.wallet.senNgoc}/> <span className="hud-unit">Sen Ngọc</span></strong></Slice>
          <button className="settings-button hud-ic hud-ic-settings" disabled={blocked} onClick={()=>setPanel('settings')}>Cài đặt</button>
        </>}
      </div>
    </header>
    {screen!=='hub' && <button className="back-home" disabled={blocked} onClick={()=>navigate('hub')}>‹ Về sân nhà</button>}
    {(screen!=='hub'||portrait) && !inRoom && <nav className="main-nav" aria-label="Các khu vực">{(['studio','closet','museum','journey'] as Screen[]).map(id=>screen==='hub'?<AreaSign key={id} disabled={blocked} onClick={()=>navigate(id)}>{screenNames[id]}</AreaSign>:<button key={id} aria-current={screen===id?'page':undefined} disabled={blocked} onClick={()=>navigate(id)}>{screenNames[id]}</button>)}</nav>}
    <main>
      <ErrorBoundary resetKey={`${screen}-${journeyView}`} onReset={()=>{setPanel(null);setScreen('hub');}}>
      <h1 ref={heading} tabIndex={-1} className="screen-reader-only">{screenNames[screen]}</h1>
      {screen==='hub' && <div className="play-area"><Scene key={screen} state={state} hub portrait={portrait} blocked={blocked} onInteract={interact} onNavigate={navigate}/></div>}
      {inRoom && !challenge && <div className="play-area"><RoomScene state={state} blocked={blocked} onInteract={interact} onExit={exitArea}/></div>}
      {inRoom && challenge && <Studio state={state} send={send} notify={setToast} challenge={draft=><StyleChallengeBar puzzle={challenge} draft={draft} hintTier={progress.hintTiers[challenge.id]??0} feedback={feedback} onSubmit={answer=>submitPuzzle(challenge,answer)} onHint={()=>hint(challenge)} onCancel={()=>{setFeedback('');send({type:'puzzle/close',payload:{}});}}/>}/>}
      {showingMap && <JourneyMap state={state} paused={blocked} onSelect={selectChapter} onHome={()=>navigate('hub')}/>}
      {screen==='studio' && <Studio state={state} send={send} notify={setToast} initial={studioDraft}/>}
      {screen==='closet' && <Closet state={state} send={send} onStudio={draft=>{setStudioDraft(draft);setScreen('studio');}}/>}
      {screen==='museum' && <Museum state={state} send={send} onReadingChange={setMuseumReading}/>}
      {screen==='hub' && intro && <div className="hub-cards"><Slice path={CARD_FRAME} className="welcome-card"><img className="welcome-avatar" src={asset('assets/paperdoll/avatar-female-default.png')} alt="An"/><div><h2>Bắt đầu câu chuyện của bạn</h2><p>Đi cùng An qua những nếp áo và ký ức gia đình.</p><div className="actions"><button className="primary" onClick={()=>setPanel('settings')}>Chọn diện mạo</button><button onClick={visit}>Dạo quanh sân nhà</button></div></div></Slice></div>}
      {screen==='journey' && !showingMap && !challenge && <div className="journey-hud"><div className="journey-toolbar"><button className="hud-ic hud-ic-bag" disabled={blocked} onClick={()=>setPanel('journal')}>Túi đồ & Sổ manh mối</button><button className="hud-ic hud-ic-map" disabled={blocked} onClick={openMap}>Bản đồ chương</button><span>{progress.solvedPuzzleIds.length}/{chapter.puzzles.length} câu đố đã giải</span></div><div className="inventory-strip" aria-label="Túi đồ">{state.inventory.itemIds.map(id=>{const path=itemAsset(id);return <button key={id} disabled={blocked} onClick={()=>{setSelectedItem(id);setPanel('journal');}} title={content.itemsById.get(id)?.description}>{path&&<img src={asset(path)} alt=""/>}<span>{content.itemsById.get(id)?.name}</span></button>;})}</div></div>}
      </ErrorBoundary>
    </main>
    {screen!=='hub' && <span className={`save-state ${saveFailed?'error':''}`} role="status">{saveFailed?'Chưa lưu được trên thiết bị':'Đã lưu trên thiết bị'}</span>}
    {toast && <Toast message={toast} tone={toneFor(toast)} onClose={closeToast}/>}
    {dialogue && node && <DialogueBox key={dialogue.id} speaker={dialogue.speaker} text={node.text} preset={state.profile?.avatarPreset ?? 'an-default'}>{node.choices?.length?<div className="actions">{node.choices.map((c,i)=><button key={i} onClick={()=>send({type:'dialogue/choose',payload:{choiceIndex:i}})}>{c.text}</button>)}</div>:<button className="primary" onClick={advance}>{ACTION_LABEL[dialogue.id]??(node.nextNodeId?'Tiếp tục':'Khép lời kể')}</button>}</DialogueBox>}
    {puzzle && <PuzzleModal key={puzzle.id} puzzle={puzzle} itemIds={state.inventory.itemIds} hintTier={progress.hintTiers[puzzle.id]??0} feedback={feedback} draft={puzzleDrafts[puzzle.id]} onUpdateDraft={(draft) => setPuzzleDrafts(prev => ({...prev, [puzzle.id]: draft}))} onSubmit={answer=>{submitPuzzle(puzzle,answer); setPuzzleDrafts(prev => {const next = {...prev}; delete next[puzzle.id]; return next;})}} onHint={()=>hint(puzzle)} onClose={()=>setPuzzleId(null)}/>}
    {panel==='journal' && <InventoryCombine state={state} initialItem={selectedItem} send={command=>{lastTarget.current='';return send(command);}} notify={setToast} onClose={()=>setPanel(null)}/>}
    {panel==='settings' && <Modal title="Diện mạo & Cài đặt" onClose={()=>setPanel(null)}><label>Tên nhân vật<input value={profileName} maxLength={12} onChange={e=>setProfileName(e.target.value)}/></label><label>Nếp tóc<select value={preset.includes('bob')?'bob':'long'} onChange={e=>setPreset(`an-${e.target.value}-${preset.includes('jade')?'jade':preset.includes('rose')?'rose':'default'}`)}><option value="long">Tóc dài</option><option value="bob">Tóc ngắn</option></select></label><label>Nếp áo<select value={preset.includes('jade')?'jade':preset.includes('rose')?'rose':'default'} onChange={e=>setPreset(`an-${preset.includes('bob')?'bob':'long'}-${e.target.value}`)}><option value="default">Kem lụa</option><option value="jade">Xanh ngọc</option><option value="rose">Hồng sen</option></select></label><p className="fine-print">Chọn từ các lớp hình đã có trong tiệm. Hiện chưa có tệp âm thanh để phát.</p><div className="actions"><button className="primary" onClick={()=>{send({type:'profile/update',payload:{name:profileName.trim()||'An',avatarPreset:preset}});setPanel(null);}}>Lưu diện mạo</button><button onClick={()=>setPanel('restart')}>Chơi lại từ đầu</button></div></Modal>}
    {panel==='restart' && <Modal title="Bắt đầu lại câu chuyện?" onClose={()=>setPanel('settings')}><p>Thao tác này xóa tiến trình, Sen Ngọc và bộ phối đã lưu trên thiết bị này.</p><div className="actions"><button className="primary" onClick={()=>{const next=freshTree();treeRef.current=next;setTree(next);setSaveFailed(!saveGame(next));setPanel(null);setPuzzleId(null);setScreen('hub');setIntro(true);setToast('Một câu chuyện mới đã bắt đầu.');}}>Chơi lại từ đầu</button><button onClick={()=>setPanel('settings')}>Giữ câu chuyện hiện tại</button></div></Modal>}
    {mapChapter && <Modal title={content.chapters[mapChapter].chapter.title} onClose={()=>setMapChapter(null)}><p>{content.chapters[mapChapter].chapter.summary}</p><p className="fine-print">Bạn đã mở khóa ký ức này. Phần chơi của chương đang được chuẩn bị.</p><button onClick={()=>setMapChapter(null)}>Trở về bản đồ</button></Modal>}
    {panel==='ending' && <ChapterEnding chapter={chapter} clueIds={state.notebook.unlockedClueIds} onHome={()=>{setPanel(null);setScreen('hub');}} onMap={openMap} onClose={()=>setPanel(null)}/>}
  </div>;
}
