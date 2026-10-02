import { test, expect, type Page } from '@playwright/test';

const scene = (page:Page) => page.locator('.scene canvas');
async function enterGame(page:Page) {
  await page.getByRole('button',{name:/^(Vào game|Tiếp tục chơi)$/}).click();
  await scene(page).waitFor();
}
async function pos(page:Page) { return (await scene(page).getAttribute('data-position'))!.split(',').map(Number); }
async function walk(page:Page,key:string,ms:number) {
  await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key);
  await page.waitForTimeout(40);
}
async function axis(page:Page,target:number,index:number) {
  const delta=target-(await pos(page))[index];
  if(Math.abs(delta)<4)return;
  const key=index===0?(delta>0?'d':'a'):(delta>0?'s':'w');
  await page.keyboard.down(key);
  try{
    await page.waitForFunction(([coordinate,axisIndex])=>{
      const position=document.querySelector<HTMLCanvasElement>('.scene canvas')?.dataset.position?.split(',').map(Number);
      return position && Math.abs(position[axisIndex]-coordinate)<6;
    },[target,index],{polling:'raf',timeout:12000});
  }finally{await page.keyboard.up(key);}
}
async function savedState(page:Page) {
  return page.evaluate(()=>{const tree=JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree;return tree.nodes[tree.headId].snapshot;});
}
test('An walks, interacts, completes the prologue and restores the save without AI calls',async({page})=>{
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
  await expect(scene(page)).toHaveAttribute('data-position','140.0,380.0');
  await expect(scene(page)).toHaveAttribute('data-target','hitbox-mirror');
  await page.keyboard.press('e'); await expect(page.getByRole('dialog')).toBeVisible();
  const blockedPos=await pos(page); await walk(page,'d',300); expect(await pos(page)).toEqual(blockedPos);
  await page.getByRole('button',{name:'Khép lời kể'}).click();
  // The table blocks horizontal movement; reach the stairs by its front aisle.
  await axis(page,460,1); await axis(page,728,0); await expect(scene(page)).toHaveAttribute('data-target','hitbox-stairs');
  await page.keyboard.press('e'); await page.getByRole('button',{name:'Bước lên gác xép'}).click();
  await expect(scene(page)).toHaveAttribute('data-position','112.0,388.0');
  await axis(page,400,0); await expect(scene(page)).toHaveAttribute('data-target','');
  await axis(page,372,1); await expect(scene(page)).toHaveAttribute('data-target','hitbox-chest-cloth');
  await page.keyboard.press('e'); await page.getByRole('button',{name:'Gỡ tấm vải phủ'}).click();
  expect((await savedState(page)).journey.prologue.solvedPuzzleIds).toContain('p-c0-cloth');
  await axis(page,400,1); await axis(page,668,0); await axis(page,392,1);
  await expect(scene(page)).toHaveAttribute('data-target','hitbox-sewing-basket');
  await page.keyboard.press('e'); expect((await savedState(page)).inventory.itemIds).toContain('kim_gut_bang_bac');
  await axis(page,400,1); await axis(page,200,0); await axis(page,352,1);
  await expect(scene(page)).toHaveAttribute('data-target','hitbox-mannequin-hand');
  await page.keyboard.press('e');
  await page.getByRole('dialog').getByRole('button',{name:'Kim gút bằng bạc',exact:true}).click();
  await page.getByRole('button',{name:'Dùng vật phẩm',exact:true}).click();
  expect((await savedState(page)).inventory.itemIds).toContain('chia_khoa_dong_ba_chau');
  await axis(page,400,1); await axis(page,408,0); await axis(page,360,1);
  await expect(scene(page)).toHaveAttribute('data-target','hitbox-chest-lock');
  await page.keyboard.press('e');
  await page.getByRole('dialog').getByRole('button',{name:'Chìa khóa đồng ba chấu',exact:true}).click();
  await page.getByRole('button',{name:'Dùng vật phẩm',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Bà Ngoại',exact:true})).toBeVisible();
  await expect(page.getByText('Chiếc rương này giữ năm nếp áo', {exact:false})).toBeVisible();
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
  await expect(scene(page)).toHaveAttribute('data-position','112.0,388.0');
  expect((await savedState(page)).journey.prologue.currentArea).toBe('c0-s2-gac-xep-chiec-ruong');
  await page.getByRole('button',{name:'Về tiệm may',exact:true}).click();
  await expect(scene(page)).toHaveAttribute('data-position','140.0,380.0');
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
  await expect(scene(page)).toHaveAttribute('width','320');await expect(scene(page)).toHaveAttribute('data-world-width','800');
  await expect(scene(page)).toHaveAttribute('data-position','440.0,340.0');
  const right=page.getByRole('button',{name:'Phải',exact:true});await right.hover();await page.mouse.down();await page.waitForTimeout(250);await page.mouse.up();
  expect((await pos(page))[0]).toBeGreaterThan(455);
  await page.screenshot({path:'artifacts/mobile-hub.png',fullPage:true});
  await page.getByRole('button',{name:'Cài đặt',exact:true}).click();const p=await pos(page);
  await page.getByLabel('Tên nhân vật').fill('An Nếp');await page.keyboard.press('w');expect(await pos(page)).toEqual(p);
  await page.getByRole('button',{name:'Lưu diện mạo',exact:true}).click();
  expect((await savedState(page)).profile.name).toBe('An Nếpw');
  await page.getByRole('button',{name:'Cốt truyện',exact:true}).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();await expect(scene(page)).toHaveAttribute('data-world-width','800');
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
