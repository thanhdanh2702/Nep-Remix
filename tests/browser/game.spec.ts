import { test, expect, type Page } from '@playwright/test';

const scene = (page:Page) => page.locator('.scene canvas');
const room = (page:Page) => page.locator('.room-stage canvas');
const spot = (page:Page,id:string) => page.locator(`.room-hotspots button[data-hotspot="${id}"]`);
const exitArrow = (page:Page,key:string) => page.locator(`.room-exit[data-exit="${key}"]`);
async function enterGame(page:Page) {
  await page.getByRole('button',{name:/^(Vào game|Tiếp tục chơi)$/}).click();
  await scene(page).waitFor();
}
async function pos(page:Page) { return (await scene(page).getAttribute('data-position'))!.split(',').map(Number); }
async function savedState(page:Page) {
  return page.evaluate(()=>{const tree=JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree;return tree.nodes[tree.headId].snapshot;});
}
test('An walks the hub, plays the prologue by clicking and restores the save without AI calls',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[],badRequests:string[]=[],aiRequests:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)badRequests.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(r.url().includes('/api/ai/'))aiRequests.push(r.url());});
  await page.goto('/');await enterGame(page); await expect(scene(page)).toHaveAttribute('data-position','440.0,340.0');
  const initialNodes=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree.nodes).length);
  await page.keyboard.down('d'); await expect(scene(page)).toHaveAttribute('data-motion','walk');
  await expect(scene(page)).toHaveAttribute('data-frame',/4[8-9]|5[0-5]/); await page.keyboard.up('d');
  await expect(scene(page)).toHaveAttribute('data-motion','idle');
  expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree.nodes).length)).toBe(initialNodes);
  await page.getByRole('button',{name:'Cốt truyện',exact:true}).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await expect(room(page)).toHaveAttribute('data-ready','true');
  await expect(room(page)).toHaveAttribute('data-area','c0-s1-tiem-may-chieu');
  await expect(page.locator('.app-shell')).toHaveClass(/in-room/);
  await expect(page.locator('.touch-controls')).toHaveCount(0);
  await spot(page,'hitbox-mirror').click(); await expect(page.getByRole('dialog',{name:'An',exact:true})).toBeVisible();
  await expect(spot(page,'hitbox-mirror')).toBeDisabled();
  await page.getByRole('button',{name:'Khép lời kể'}).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  // The stairs arrow opens a dialogue first; its button then moves An to the loft.
  await exitArrow(page,'stairs').click(); await expect(page.getByRole('dialog',{name:'An',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Bước lên gác xép'}).click();
  await expect(room(page)).toHaveAttribute('data-area','c0-s2-gac-xep-chiec-ruong');
  await expect(room(page)).toHaveAttribute('data-ready','true');
  await expect(spot(page,'hitbox-chest-lock')).toHaveCount(0); // appears only after the cloth is removed
  await spot(page,'hitbox-chest-cloth').click(); await page.getByRole('button',{name:'Gỡ tấm vải phủ'}).click();
  expect((await savedState(page)).journey.prologue.solvedPuzzleIds).toContain('p-c0-cloth');
  await expect(spot(page,'hitbox-chest-cloth')).toHaveCount(0);
  await expect(spot(page,'hitbox-chest-lock')).toBeVisible();
  await spot(page,'hitbox-sewing-basket').click(); expect((await savedState(page)).inventory.itemIds).toContain('kim_gut_bang_bac');
  await expect(spot(page,'hitbox-sewing-basket')).toHaveCount(0);
  await spot(page,'hitbox-mannequin-hand').click();
  await page.getByRole('dialog').getByRole('button',{name:'Kim gút bằng bạc',exact:true}).click();
  await page.getByRole('button',{name:'Dùng vật phẩm',exact:true}).click();
  expect((await savedState(page)).inventory.itemIds).toContain('chia_khoa_dong_ba_chau');
  await spot(page,'hitbox-chest-lock').click();
  await page.getByRole('dialog').getByRole('button',{name:'Chìa khóa đồng ba chấu',exact:true}).click();
  await page.getByRole('button',{name:'Dùng vật phẩm',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Bà Ngoại',exact:true})).toBeVisible();
  await expect(page.getByText('Chiếc rương này giữ năm nếp áo', {exact:false})).toBeVisible();
  await expect(page.locator('.dialogue-stage.is-emblem')).toHaveCount(1); // Bà Ngoại has no sprite: emblem layout
  await page.getByRole('button',{name:'Khép lời kể'}).click();
  await expect(page.getByRole('dialog',{name:'Nếp ký ức đầu tiên'})).toBeVisible();
  const completed=await savedState(page); expect(completed.wallet.senNgoc).toBe(150);
  expect(completed.journey.prologue.claimed).toBe(true);expect(completed.notebook.unlockedClueIds).toContain('clue-ba-dan-do');expect(completed.features.latVai).toBe(false);
  await page.screenshot({path:'artifacts/prologue-completed.png',fullPage:true});
  await page.getByRole('button',{name:'Xem bản đồ chương',exact:true}).click();
  await expect(page.locator('.journey-map-screen')).toHaveAttribute('data-revealing','false');
  await expect(page.locator('[data-chapter="prologue"]')).toHaveClass(/is-completed/);
  await expect(page.locator('[data-chapter="c1"] .journey-map-label')).toBeEnabled();
  await expect(page.locator('[data-chapter="c1"] .journey-lock')).toHaveCount(0);
  await expect(page.locator('[data-chapter="c2"] .journey-map-label')).toBeDisabled();
  await page.locator('[data-chapter="c1"] .journey-map-label').click();
  await expect(page.getByRole('dialog')).toContainText('Cụ Nguyễn Thị Cầm');
  await page.getByRole('button',{name:'Trở về bản đồ',exact:true}).click();
  await page.getByRole('button',{name:'‹ Về sân nhà',exact:true}).click();
  await page.reload();await enterGame(page);
  expect((await savedState(page)).wallet.senNgoc).toBe(150);
  await page.getByRole('button',{name:'Cốt truyện',exact:true}).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await expect(room(page)).toHaveAttribute('data-area','c0-s2-gac-xep-chiec-ruong');
  expect((await savedState(page)).journey.prologue.currentArea).toBe('c0-s2-gac-xep-chiec-ruong');
  await exitArrow(page,'back').click();
  await expect(room(page)).toHaveAttribute('data-area','c0-s1-tiem-may-chieu');
  expect((await savedState(page)).journey.prologue.solvedPuzzleIds).toHaveLength(3);
  expect(errors).toEqual([]);expect(badRequests).toEqual([]);expect(aiRequests).toEqual([]);
});

test('Studio saves one committed outfit, museum reward is single-use, shop owns purchases',async({page})=>{
  await page.goto('/');await enterGame(page);await scene(page).waitFor();
  await page.getByRole('button',{name:'Phòng phối đồ',exact:true}).first().click();
  await page.getByRole('tab',{name:'Màu vải'}).click();await page.getByRole('button',{name:'Chàm',exact:true}).click();
  await page.getByRole('button',{name:'Tùy chỉnh bộ phối',exact:true}).click();
  await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();await page.getByRole('button',{name:'Làm lại',exact:true}).click();
  await page.getByLabel('Tên bộ phối').fill('Nếp chàm');
  await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click();
  const before=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree.nodes).length);
  await page.getByRole('button',{name:'Lưu bộ phối',exact:true}).click();
  expect((await savedState(page)).closet.savedOutfits[0].name).toBe('Nếp chàm');
  expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree.nodes).length)).toBe(before+1);
  await expect(page.getByRole('button',{name:'Chụp Lookbook',exact:true})).toHaveCount(0);
  await expect(page.locator('.studio-lookbook canvas[data-ready="true"]')).toHaveCount(4);
  await page.getByRole('button',{name:'Bảo tàng',exact:true}).first().click();
  await page.getByRole('button',{name:/^Mở sách 1:/}).click();
  for(let i=0;i<5;i++)await page.getByRole('button',{name:'Trang sau ›',exact:true}).click();
  await page.getByRole('button',{name:'Đã hiểu · +15 Sen Ngọc',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'Đã đọc và nhận thưởng',exact:true})).toBeDisabled();
  expect((await savedState(page)).wallet.senNgoc).toBe(115);
  await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('button',{name:'‹ Về sân nhà',exact:true}).click();
  await page.getByRole('button',{name:'Tủ đồ',exact:true}).first().click();
  await page.getByRole('button',{name:'Cửa hàng',exact:true}).click();
  await page.getByRole('button',{name:'25 Sen Ngọc · Mua',exact:true}).click();
  const after=await savedState(page);expect(after.wallet.senNgoc).toBe(90);expect(after.closet.unlockedAccessoryIds).toContain('khan-van-hoang-yen');
  await page.reload();await enterGame(page);expect((await savedState(page)).closet.savedOutfits[0].name).toBe('Nếp chàm');
});

test('Mobile camera, touch controls, input focus and corrupt saves work',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await enterGame(page);
  await expect(scene(page)).toHaveAttribute('data-world-width','800');
  await expect(scene(page)).toHaveAttribute('data-position','440.0,340.0');
  const right=page.getByRole('button',{name:'Phải',exact:true});await right.hover();await page.mouse.down();await page.waitForTimeout(250);await page.mouse.up();
  expect((await pos(page))[0]).toBeGreaterThan(455);
  await page.screenshot({path:'artifacts/mobile-hub.png',fullPage:true});
  await page.getByRole('button',{name:'Cài đặt',exact:true}).click();const p=await pos(page);
  await page.getByLabel('Tên nhân vật').fill('An Nếp');await page.keyboard.press('w');expect(await pos(page)).toEqual(p);
  await page.getByRole('button',{name:'Lưu diện mạo',exact:true}).click();
  expect((await savedState(page)).profile.name).toBe('An Nếpw');
  await page.getByRole('button',{name:'Cốt truyện',exact:true}).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();await expect(room(page)).toHaveAttribute('data-world-width','890');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.evaluate(()=>localStorage.setItem('tiem-may-nep-save-v1','broken-json'));await page.reload();await enterGame(page);
  expect((await savedState(page)).wallet.senNgoc).toBe(100);await expect(page.getByRole('status').filter({hasText:'Bản lưu không hợp lệ'})).toBeVisible();
});

test('The game fills the screen below the cream header and Back returns home',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.goto('/');await enterGame(page);await scene(page).waitFor();
    const size=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));
    expect(size).toEqual({w:viewport.width,h:viewport.height});
    const box=(await scene(page).boundingBox())!;
    const stage=(await page.locator('.game-stage').boundingBox())!;
    const header=(await page.locator('.nep-header').boundingBox())!;
    await expect(page.locator('.nep-footer')).toHaveCount(0);
    expect(box).toEqual(stage);expect(box.x).toBe(0);expect(box.width).toBe(viewport.width);
    expect(stage.y).toBe(header.y+header.height);
    expect(stage.y+stage.height).toBe(viewport.height);
    await expect(page.locator('.nep-wordmark .nep-icon')).toBeVisible();
    await expect(page.locator('.hub-wallet img')).toBeVisible();
    for(const name of ['Phòng phối đồ','Tủ đồ','Bảo tàng','Cốt truyện']){
      await page.getByRole('button',{name,exact:true}).first().click();
      const panel=page.locator(name==='Phòng phối đồ'?'.studio-lookbook':'.room-panel');
      if(name!=='Cốt truyện'){
        const background=await page.locator('.room-background').boundingBox();expect(background).toEqual(stage);
        const bounds=await panel.boundingBox();expect(bounds!.y).toBeGreaterThanOrEqual(stage.y);expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(stage.y+stage.height);
        expect(await page.locator('.nep-header').boundingBox()).toEqual(header);
        expect(stage.y+stage.height).toBe(viewport.height);
      }
      await page.getByRole('button',{name:'‹ Về sân nhà',exact:true}).click();
      await expect(page.locator('.app-shell')).toHaveClass('app-shell screen-hub');
    }
  }
});

// ---- Point-and-click room behaviour (flow tests run with reduced motion; Soi/pulse tests with motion on) ----
async function openRoom(page:Page,motion=false) {
  if(!motion)await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');await enterGame(page);
  await page.getByRole('button',{name:'Cốt truyện',exact:true}).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await expect(room(page)).toHaveAttribute('data-ready','true');
}
const frame = (page:Page) => room(page).evaluate(canvas=>(canvas as HTMLCanvasElement).toDataURL());

test.describe('point-and-click room',()=>{
  test.use({viewport:{width:1366,height:768}});

  test('hover highlights the hotspot, exit arrows report their key and the pixels change',async({page})=>{
    await openRoom(page);
    await expect(room(page)).toHaveAttribute('data-hover','');
    const idle=await frame(page);
    await spot(page,'hitbox-mirror').hover();
    await expect(room(page)).toHaveAttribute('data-hover','hitbox-mirror');
    await expect(page.locator('.room-tip')).toHaveText('An');
    await expect.poll(()=>frame(page)).not.toBe(idle);
    await exitArrow(page,'stairs').hover();
    await expect(room(page)).toHaveAttribute('data-hover','hitbox-stairs');
    await page.mouse.move(5,5);
    await expect(room(page)).toHaveAttribute('data-hover','');
    await expect(page.locator('.room-tip')).toHaveCount(0);
    await expect.poll(()=>frame(page)).toBe(idle);
    await exitArrow(page,'stairs').click();await page.getByRole('button',{name:'Bước lên gác xép'}).click();
    await expect(room(page)).toHaveAttribute('data-area','c0-s2-gac-xep-chiec-ruong');
    await exitArrow(page,'back').hover();
    await expect(room(page)).toHaveAttribute('data-hover','exit:back');
    await expect(exitArrow(page,'back')).toHaveClass(/dir-down/);
  });

  test('Tab reaches hotspots in order, shows the highlight and Enter opens the dialogue',async({page})=>{
    await openRoom(page);
    const seen:string[]=[];
    for(let i=0;i<12;i++){
      await page.keyboard.press('Tab');
      const id=await page.evaluate(()=>(document.activeElement as HTMLElement).dataset.hotspot??'');
      if(!id)continue;
      seen.push(id);
      await expect(room(page)).toHaveAttribute('data-hover',id);
      if(id==='hitbox-mirror')break;
    }
    expect(seen[0]).toBe('hitbox-table'); // largest hotspot is first in DOM order
    expect(seen.at(-1)).toBe('hitbox-mirror');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog',{name:'An',exact:true})).toBeVisible();
    await expect(room(page)).toHaveAttribute('data-hover','');
  });

  test('Soi reveals every hotspot for about 1.5s, by button and by Space, and is locked during dialogue',async({page})=>{
    await openRoom(page,true);
    const soi=page.getByRole('button',{name:'Soi',exact:true});
    await expect(soi).toHaveAttribute('aria-pressed','false');
    const lit=async()=>{const t=Date.now();await expect(soi).toHaveAttribute('aria-pressed','true');await expect(soi).toHaveAttribute('aria-pressed','false',{timeout:4000});return Date.now()-t;};
    await soi.click();
    expect(await lit()).toBeGreaterThan(1000);
    await page.evaluate(()=>(document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Space');
    expect(await lit()).toBeGreaterThan(1000);
    await spot(page,'hitbox-mirror').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(soi).toBeDisabled();
  });

  test('Soi paints brackets on the canvas (reduced motion keeps the art otherwise static)',async({page})=>{
    await openRoom(page);
    const idle=await frame(page);
    await page.getByRole('button',{name:'Soi',exact:true}).click();
    await expect.poll(()=>frame(page)).not.toBe(idle);
    await expect(page.getByRole('button',{name:'Soi',exact:true})).toHaveAttribute('aria-pressed','false',{timeout:4000});
    await expect.poll(()=>frame(page)).toBe(idle);
  });

  test('dialogue shows the standing stage with An dimmed and pixel-native NPC art',async({page})=>{
    await openRoom(page);
    await spot(page,'hitbox-cat').click();
    const dialog=page.getByRole('dialog',{name:'Mèo Nếp',exact:true});
    await expect(dialog).toBeVisible();
    await expect(page.locator('.dialogue-stage')).toBeVisible();
    await expect(page.locator('.standing-art .standing-slot.is-an.is-dim')).toHaveCount(1);
    await expect(page.locator('canvas.standing-an')).toHaveAttribute('data-ready','true');
    const npc=page.locator('canvas.standing-npc');
    await expect(npc).toHaveAttribute('data-ready','true');
    const scale=Number(await npc.getAttribute('data-scale'));
    expect(scale).toBeGreaterThanOrEqual(3);
    expect(await npc.evaluate(canvas=>canvas.clientHeight)).toBe(32*scale); // cat-nep is a 32x32 sprite, drawn whole-number scaled
    await expect(dialog.locator('.dialogue-text')).toContainText('Ngoao');
    await expect(dialog.locator('.dialogue-actions').getByRole('button',{name:'Khép lời kể'})).toBeVisible();
    await page.screenshot({path:'artifacts/ui-polish/dialogue-npc.png'});
    await page.getByRole('button',{name:'Khép lời kể'}).click();
    await expect(page.locator('.dialogue-stage')).toHaveCount(0);
    await expect(page.locator('.standing-art')).toHaveCount(0);
    await spot(page,'hitbox-mirror').click();
    await expect(page.getByRole('dialog',{name:'An',exact:true})).toBeVisible();
    await expect(page.locator('.dialogue-stage.is-emblem')).toHaveCount(0); // An speaks: she is lit and there is no NPC art
    await expect(page.locator('.standing-slot.is-an.is-dim')).toHaveCount(0);
    await expect(page.locator('canvas.standing-npc')).toHaveCount(0);
  });
});

test('hub: walking to a destination lights exactly that sign and leaving clears it',async({page})=>{
  await page.goto('/');await enterGame(page);
  const lit=page.locator('.area-sign.is-highlighted');
  await expect(lit).toHaveCount(0);
  await page.keyboard.down('w');
  try{
    await expect(scene(page)).toHaveAttribute('data-target','journey',{timeout:10000});
    await expect(lit).toHaveCount(1);
    await expect(lit).toHaveText('Cốt truyện');
  }finally{await page.keyboard.up('w');}
  await page.keyboard.down('s');
  try{
    await expect(scene(page)).toHaveAttribute('data-target','',{timeout:10000});
    await expect(lit).toHaveCount(0);
  }finally{await page.keyboard.up('s');}
});
