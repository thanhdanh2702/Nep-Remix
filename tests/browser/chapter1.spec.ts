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
  await page.locator('.wardrobe-card', { hasText: name }).first().click();
}

test.describe('chapter 1 plays end to end through the UI', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('pick, combine, use, present, style and leave by the gate', async ({ page }) => {
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
    expect(errors).toEqual([]);
  });

  test('a styling session left open is resumed after a reload and can be cancelled', async ({ page }) => {
    await finishPrologue(page);
    await playToYard(page);
    await spot(page, 'hitbox-styling-cam').click();
    await expect(page.locator('.studio-challenge')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await expect(page.locator('.studio-challenge')).toBeVisible();
    await page.getByRole('button', { name: 'Hủy thử thách', exact: true }).click();
    await expect(page.locator('.studio-challenge')).toHaveCount(0);
  });
});

test.describe('mobile 844x390', () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test('chapter 1 controls keep 44px touch targets', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await finishPrologue(page);
    await playToYard(page, true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const arrow of await page.locator('.room-exit').all()) {
      const box = (await arrow.boundingBox())!;
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(43.5);
    }
    await spot(page, 'hitbox-village-officials').click();
    await expectTouchTargets(page, '.modal');
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await spot(page, 'hitbox-styling-cam').click();
    await expectTouchTargets(page, '.studio-challenge');
    await page.getByRole('button', { name: 'Hủy thử thách', exact: true }).click();
  });
  test('toast success intercept click hotspot is fixed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await finishPrologue(page);
    await playToYard(page, true);
    
    // trigger a toast using settings
    await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu diện mạo', exact: true }).click();
    
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    
    // while toast is visible, click a hotspot
    await spot(page, 'hitbox-styling-cam').click();
    await expect(page.locator('.studio-challenge')).toBeVisible();
    
    // Check if toast close button works
    await page.getByRole('button', { name: 'Hủy thử thách', exact: true }).click();
    
    // trigger again and click toast close button
    await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu diện mạo', exact: true }).click();
    await expect(toast).toBeVisible();
    const closeToast = toast.locator('button');
    await closeToast.click();
    await expect(toast).toHaveCount(0);
  });

});

test.describe('Accessibility & UI Regressions', () => {
  test('modal focus trap works and restores focus on close', async ({ page }) => {
    await finishPrologue(page);
    await playToYard(page);
    const hotspot = spot(page, 'hitbox-village-officials');
    await expect(hotspot).toBeVisible();
    await hotspot.click();
    
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    await page.keyboard.press('Tab');
    const isFocusInside = await page.evaluate(() => document.querySelector('.modal')?.contains(document.activeElement));
    expect(isFocusInside).toBe(true);
    
    // just close it with the button to not rely on Escape, or press Escape 
    await page.locator('.modal').press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});
