import { test, expect, type Page } from '@playwright/test';

const room = (page: Page) => page.locator('.room-stage canvas');
const spot = (page: Page, id: string) => page.locator(`.room-hotspots button[data-hotspot="${id}"]`);
const exitArrow = (page: Page, key: string) => page.locator(`.room-exit[data-exit="${key}"]`);
const dialog = (page: Page) => page.getByRole('dialog');
const saved = (page: Page) => page.evaluate(() => {
  const tree = JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree;
  return tree.nodes[tree.headId].snapshot;
});
const inArea = (page: Page, id: string) => expect(room(page)).toHaveAttribute('data-area', id);

async function openStory(page: Page) {
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
}
async function enterRoom(page: Page, chapter: string) {
  await page.locator(`[data-chapter="${chapter}"] .journey-map-label`).click();
  await expect(room(page)).toHaveAttribute('data-ready', 'true');
}
// Plays the prologue by clicking (same route as game.spec) and lands on the chapter map.
async function finishPrologue(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await openStory(page);
  await enterRoom(page, 'prologue');
  await exitArrow(page, 'stairs').click();
  await page.getByRole('button', { name: 'Bước lên gác xép' }).click();
  await inArea(page, 'c0-s2-gac-xep-chiec-ruong');
  await spot(page, 'hitbox-chest-cloth').click();
  await page.getByRole('button', { name: 'Gỡ tấm vải phủ' }).click();
  await spot(page, 'hitbox-sewing-basket').click();
  await spot(page, 'hitbox-mannequin-hand').click();
  await dialog(page).getByRole('button', { name: 'Kim gút bằng bạc', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await spot(page, 'hitbox-chest-lock').click();
  await dialog(page).getByRole('button', { name: 'Chìa khóa đồng ba chấu', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lời kể' }).click();
  await expect(dialog(page)).toHaveAccessibleName('Nếp ký ức đầu tiên');
  await page.getByRole('button', { name: 'Xem bản đồ chương', exact: true }).click();
  await expect(page.locator('[data-chapter="c1"] .journey-map-label')).toBeEnabled();
}
// Every c1 dialogue has two nodes: "Tiếp tục" then "Khép lời kể".
async function advanceDialogue(page: Page) {
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lời kể', exact: true }).click();
}
async function closeDialogue(page: Page) {
  await advanceDialogue(page);
}
// Every button in the open dialog / challenge bar must be a comfortable touch target.
async function expectTouchTargets(page: Page, scope: string) {
  await expect.poll(async () => {
    const heights = await page.locator(`${scope} button`).evaluateAll(buttons => buttons.map(b => b.getBoundingClientRect().height));
    return heights.length > 0 && heights.every(h => h >= 43.5);
  }).toBe(true);
}

// Chapter 1, rooms 1 and 2: pick, combine, use, then the altar. Ends in the yard.
async function playToYard(page: Page, mobile = false) {
  await enterRoom(page, 'c1');
  await inArea(page, 'c1-s1-buong-det-khoa-kin');
  await spot(page, 'hitbox-loom-shuttle').click();
  await spot(page, 'hitbox-belt-rack').click();
  await page.getByRole('button', { name: 'Túi đồ & Sổ manh mối' }).click();
  await dialog(page).getByRole('button', { name: /^Con thoi gỗ mun/ }).click();
  await expect(dialog(page).getByRole('button', { name: 'Ghép', exact: true })).toBeDisabled();
  await dialog(page).getByRole('button', { name: /^Thắt lưng lụa chàm/ }).click();
  if (mobile) await expectTouchTargets(page, '.modal');
  await dialog(page).getByRole('button', { name: 'Ghép', exact: true }).click();
  expect((await saved(page)).inventory.itemIds).toContain('dung_cu_moc_then_cua');
  expect((await saved(page)).inventory.itemIds).not.toContain('con_thoi_go_mun');
  await dialog(page).getByRole('button', { name: 'Đóng', exact: true }).click();
  // The window exit is still locked and sits on the window itself: the arrow opens the lock puzzle.
  await exitArrow(page, 'window').click();
  await expect(dialog(page)).toHaveAccessibleName('Chế tạo dụng cụ mở then cửa sau buồng dệt');
  await inArea(page, 'c1-s1-buong-det-khoa-kin');
  if (mobile) await expectTouchTargets(page, '.modal');
  await dialog(page).getByRole('button', { name: 'Kéo may bằng đồng', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click(); // wrong item: stays open
  await expect(page.getByRole('status').filter({ hasText: 'chưa dùng được' })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Dụng cụ móc then cửa', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await expect(dialog(page)).toHaveCount(0);
  await exitArrow(page, 'window').click();
  await inArea(page, 'c1-s2-ban-tho-nha-tho-ho');
  await expect(room(page)).toHaveAttribute('data-ready', 'true');
  await spot(page, 'hitbox-honor-plaque').click();
  await closeDialogue(page);
  await spot(page, 'hitbox-ancestor-altar').click();
  await dialog(page).getByRole('button', { name: 'Kéo may bằng đồng', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await closeDialogue(page);
  await closeDialogue(page);
  await expect(dialog(page)).toHaveCount(0);
  const state = await saved(page);
  expect(state.inventory.itemIds).toEqual(expect.arrayContaining(['buc_thu_tay_chong_cu_Cam', 'to_van_tu_cam_co_dat']));
  expect(state.notebook.unlockedClueIds).toEqual(expect.arrayContaining(['clue-thu-chong-cu-cam', 'clue-van-tu-ban-dat']));
  await exitArrow(page, 'yard').click();
  await inArea(page, 'c1-s3-cong-dinh-doi-dau');
  await expect(room(page)).toHaveAttribute('data-ready', 'true');
}
async function present(page: Page, hotspot: string, item: string) {
  await spot(page, hotspot).click();
  await dialog(page).getByRole('button', { name: item, exact: true }).click();
  await page.getByRole('button', { name: 'Đưa chứng cứ', exact: true }).click();
  await expect(dialog(page)).toHaveCount(0);
}
async function wardrobePick(page: Page, tab: string, name: string) {
  await page.getByRole('tab', { name: tab }).click();
  const card = page.locator('.wardrobe-card', { hasText: name }).first();
  const next = page.getByRole('button', { name: 'Trang trang phục tiếp', exact: true });
  for (let i = 0; i < 10 && !(await card.count()); i++) {
    if (!(await next.isEnabled())) break;
    await next.click();
  }
  await card.click();
}

import { readFileSync } from 'node:fs';
const items = JSON.parse(readFileSync('src/content/items.json','utf8'));
const accessories = JSON.parse(readFileSync('src/content/studio.json','utf8')).accessories;
const content = {itemsById:new Map<string, {name:string}>(items.map((i:{id:string;name:string})=>[i.id,i])),accessoriesById:new Map<string,{name:string}>(accessories.map((i:{id:string;name:string})=>[i.id,i]))};

test('natural menu journey Prologue → C1 → C2 → C3 demo', async ({page})=>{
 test.setTimeout(360000);
 page.setDefaultTimeout(15000);
 await page.emulateMedia({reducedMotion:'reduce'});

    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/');
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await openStory(page);
    await expect(page.locator('[data-chapter="c1"] .journey-map-label')).toBeDisabled(); // still locked
    await finishPrologue(page);
    expect((await saved(page)).wallet.senNgoc).toBe(150);
    await playToYard(page);

    // The gate cannot end the story while puzzles remain.
    await exitArrow(page, 'exit').click();
    await expect(page.locator('.toast')).toContainText('Còn 3 câu đố chưa giải');
    await expect(dialog(page)).toHaveCount(0);

    await present(page, 'hitbox-village-officials', 'Tờ văn tự cầm cố đất làng');
    await spot(page, 'hitbox-ong-le-entity').click();
    await dialog(page).getByRole('button', { name: 'Tờ văn tự cầm cố đất làng', exact: true }).click();
    await page.getByRole('button', { name: 'Đưa chứng cứ', exact: true }).click(); // wrong evidence for Ông Lệ
    await expect(page.getByRole('status').filter({ hasText: 'chưa dùng được' })).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Bức thư tay của chồng Cụ Cầm', exact: true }).click();
    await page.getByRole('button', { name: 'Đưa chứng cứ', exact: true }).click();
    await expect(dialog(page)).toHaveCount(0);

    // Styling: the Studio opens in challenge mode, cancel closes the session, a wrong outfit is refused.
    await spot(page, 'hitbox-styling-cam').click();
    await expect(page.locator('.studio-challenge')).toBeVisible();
    expect((await saved(page)).activeSession?.type).toBe('puzzle');
    await page.getByRole('button', { name: 'Hủy thử thách', exact: true }).click();
    await expect(page.locator('.studio-challenge')).toHaveCount(0);
    expect((await saved(page)).activeSession).toBeNull();
    await spot(page, 'hitbox-styling-cam').click();
    await page.getByRole('button', { name: 'Trình diện', exact: true }).click();
    await expect(page.locator('.studio-challenge [role="status"]')).toBeVisible();
    await wardrobePick(page, 'Áo dài', 'Áo ngũ thân tay chẽn');
    await wardrobePick(page, 'Phụ kiện', 'Khăn vấn nhung đen');
    await wardrobePick(page, 'Giày', 'Guốc mộc quai nhung');
    await page.getByRole('button', { name: 'Trình diện', exact: true }).click();
    await expect(page.locator('.studio-challenge')).toHaveCount(0);
    expect((await saved(page)).activeSession).toBeNull();
    expect((await saved(page)).journey.c1.solvedPuzzleIds).toHaveLength(5);
    await expect(room(page)).toHaveAttribute('data-ready', 'true');

    await exitArrow(page, 'exit').click();
    await advanceDialogue(page);
    await expect(dialog(page)).toHaveAccessibleName('Chương 1: Nếp Áo Khóa Chặt Thanh Xuân');
    await expect(dialog(page)).toContainText('+100 Sen Ngọc');
    await expect(dialog(page)).toContainText('Tấm biển Tiết Hạnh Khả Phong');
    const done = await saved(page);
    expect(done.journey.c1.status).toBe('completed');
    expect(done.journey.c1.claimed).toBe(true);
    expect(done.wallet.senNgoc).toBe(250);
    await page.getByRole('button', { name: 'Trở về bản đồ', exact: true }).click();
    await expect(page.locator('[data-chapter="c1"]')).toHaveClass(/is-completed/);
    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    expect((await saved(page)).wallet.senNgoc).toBe(250);

 await openStory(page);
 await enterRoom(page,'c2');
 await page.getByRole('button',{name:'Khép lời kể',exact:true}).click();
    const pickups = ['hitbox-drawing-desk', 'hitbox-fabric-basket', 'hitbox-gas-lamp', 'hitbox-french-window'];
    for (let i = 0; i < pickups.length; i++) {
      await spot(page, pickups[i]).click();
      await expect.poll(async () => (await saved(page)).inventory.itemIds)
        .toContain(`manh_ban_ve_ao_dai_${i + 1}`);
    }
    await spot(page, 'hitbox-drawing-easel').click();
    console.log('C2 four pickups complete');
    for (let i = 1; i <= 4; i++) await page.getByRole('button', { name: `Thêm Mảnh bản vẽ ${i}`, exact: true }).click();
    await expect(page.locator('.order-strip-slot')).toHaveCount(4);
    await page.getByRole('button', { name: 'Ghép bản vẽ', exact: true }).click();
    await page.getByRole('button', { name: 'Khép lời kể' }).click();
    await page.locator('[data-exit="window"]').click();
    console.log('C2 S1 complete');
    await spot(page, 'hitbox-grandfather-clock').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('chia_khoa_ket_sat_bang_thau');
    await spot(page, 'hitbox-iron-safe').click();
    await page.getByRole('dialog').getByRole('button', { name: content.itemsById.get('chia_khoa_ket_sat_bang_thau')!.name, exact: true }).click();
    await page.getByRole('button', { name: 'Mở hòm sắt', exact: true }).click();
    await page.getByRole('button', { name: 'Khép lời kể' }).click();
    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.getByRole('button', { name: 'Khép lời kể' }).click();
    await page.locator('[data-exit="hall"]').click();
    console.log('C2 papers complete');
    for (const [hotspot, itemId] of [
      ['hitbox-reporters-crowd', 'bien_lai_tra_no_goc_1935'],
      ['hitbox-ong-le-shadow', 'ban_ve_ao_dai_tan_thoi'],
    ]) {
      await spot(page, hotspot).click();
      await page.getByRole('dialog').getByRole('button', { name: content.itemsById.get(itemId)!.name, exact: true }).click();
      await page.getByRole('button', { name: itemId === 'bien_lai_tra_no_goc_1935' ? 'Trình biên lai' : 'Trình bản vẽ', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    await spot(page, 'hitbox-exhibition-podium').click();
    await expect(page.locator('.studio-challenge')).toBeVisible();
    await page.getByRole('tab', { name: 'Phụ kiện', exact: true }).click();
    await page.locator('.studio-wardrobe-dock .wardrobe-card').filter({ hasText: content.accessoriesById.get('khan-van-den')!.name }).click();
    await page.getByRole('tab', { name: 'Giày', exact: true }).click();
    await page.locator('.studio-wardrobe-dock .wardrobe-card').filter({ hasText: content.accessoriesById.get('guoc-moc')!.name }).click();
    await expect.poll(async () => (await saved(page)).journey.c2.puzzleDrafts['p-c2-styling-loan'].answer.footwearId).toBe('guoc-moc');
    expect((await saved(page)).wallet.senNgoc).toBe(250);
    expect((await saved(page)).closet.unlockedGarmentIds).not.toContain('ao-dai-lemur');
    await page.getByRole('button', { name: 'Trình diện', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    await page.getByRole('button', { name: 'Khép lời kể', exact: true }).click();
    await expect.poll(async () => (await saved(page)).journey.c2.claimed).toBe(true);
    expect((await saved(page)).wallet.senNgoc).toBe(350);
    await expect(page.getByRole('dialog')).toContainText('Đã hoàn thành Chương 2');

    await page.getByRole('button', { name: 'Về sân nhà', exact: true }).click();
    await openStory(page);
    await enterRoom(page, 'c3');
    await inArea(page, 'c3-s1-tiem-may-da-kao');
    expect((await saved(page)).journey.c3.solvedPuzzleIds).toEqual([]);
    await expect(spot(page, 'hitbox-c3-read-receipt')).toHaveCount(0);
    await spot(page, 'hitbox-fabric-attic').click();
    await expect.poll(async()=> (await saved(page)).inventory.itemIds).toContain('bien_nhan_tien_thay_boi');
    await spot(page, 'hitbox-c3-read-receipt').click();
    await page.getByRole('button',{name:'Xác nhận đã đọc',exact:true}).click();
    await spot(page,'hitbox-street-exit').click();
    await page.getByRole('button',{name:'Ra phố Đa Kao',exact:true}).click();
    await exitArrow(page,'street').click();
    await inArea(page,'c3-s2-phong-phong-thuy');
    await spot(page,'hitbox-bagua-mirror').click();
    await page.getByRole('button',{name:'Xem ghi chú Bát Quái',exact:true}).click();
    await spot(page,'hitbox-bagua-chest').click();
    await page.getByRole('radiogroup',{name:'Vòng thứ nhất'}).getByRole('button',{name:/Càn$/}).click();
    await page.getByRole('radiogroup',{name:'Vòng thứ hai'}).getByRole('button',{name:/Tốn$/}).click();
    await page.getByRole('button',{name:'Mở khóa Bát Quái',exact:true}).click();
    await page.getByRole('button',{name:'Đọc tiếp thư thỏa thuận',exact:true}).click();
    await page.reload();
    await page.getByRole('button',{name:/^(Vào game|Tiếp tục chơi)$/}).click();
    await page.getByRole('button',{name:'Xác nhận đã đọc',exact:true}).click();
    await exitArrow(page,'mansion').click();
    await inArea(page,'c3-s3-dinh-thu-doi-dau');
    await spot(page,'hitbox-c3-read-revision').click();
    await page.getByRole('button',{name:'Xác nhận đã đọc',exact:true}).click();
    await spot(page,'hitbox-salon-table').click();
    await dialog(page).getByRole('button',{name:content.itemsById.get('so_tu_vi_nguyen_ban_1962')!.name,exact:true}).click();
    await page.getByRole('button',{name:'Trình chứng cứ',exact:true}).click();
    await page.getByRole('button',{name:'Khép lời kể',exact:true}).click();
    await page.getByRole('button',{name:'Khép lời kể',exact:true}).click();
    await spot(page,'hitbox-styling-mai').click();
    await wardrobePick(page,'Áo dài','Áo dài tay raglan');
    await wardrobePick(page,'Phụ kiện','Kính mắt mèo');
    await wardrobePick(page,'Giày','Guốc mộc');
    const before=(await saved(page)).wallet.senNgoc;
    expect((await saved(page)).closet.unlockedGarmentIds).not.toContain('ao-dai-raglan');
    await page.getByRole('button',{name:'Trình diện',exact:true}).click();
    await expect(dialog(page)).toContainText('Tôi không cần một lời phán tốt hơn.');
    await page.getByRole('button',{name:'Khép lời kể',exact:true}).click();
    await expect.poll(async()=> (await saved(page)).journey.c3.claimed).toBe(true);
    expect((await saved(page)).wallet.senNgoc).toBe(before+100);
    await page.reload();
    await page.getByRole('button',{name:/^(Vào game|Tiếp tục chơi)$/}).click();
    expect((await saved(page)).wallet.senNgoc).toBe(before+100);
    await page.screenshot({path:'artifacts/c3-demo-natural-complete.png',fullPage:true});
    expect(errors).toEqual([]);

});
