import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const items: { id: string; name: string }[] = JSON.parse(readFileSync('src/content/items.json', 'utf8'));
const accessories: { id: string; name: string }[] = JSON.parse(readFileSync('src/content/studio.json', 'utf8')).accessories;
const content = { itemsById: new Map(items.map(item => [item.id, item])), accessoriesById: new Map(accessories.map(item => [item.id, item])) };
const key = 'tiem-may-nep-save-v1';
const saved = (page: Page) => page.evaluate(saveKey => {
  const tree = JSON.parse(localStorage.getItem(saveKey)!).tree;
  return tree.nodes[tree.headId].snapshot;
}, key);
const spot = (page: Page, id: string) => page.locator(`[data-hotspot="${id}"]`);

// This is explicitly a C1-completed fixture, not evidence of a fresh C1 UI run.
// No C2 items, solves, reads or loan ownership are seeded.
function fixture() {
  // tsx owns JSON-module loading; Playwright's native ESM loader does not.
  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
  import { loadContent } from './src/content/index.ts';
  import { createInitialState, createInitialTree, toJSON } from './src/core/index.ts';
  const content = loadContent();
  const state = createInitialState(content);
  for (const id of ['prologue', 'c1']) {
    Object.assign(state.journey[id], {
      status: 'completed', claimed: true,
      solvedPuzzleIds: content.chapters[id].puzzles.map(p => p.id),
      completedDialogueIds: content.chapters[id].dialogues.map(d => d.id),
      activeDialogue: null, dialogueQueue: [],
    });
    state.claimedRewardIds.push(content.chapters[id].chapter.reward.id);
  }
  state.journey.c2.status = 'unlocked';
  state.wallet.senNgoc = 250;
  process.stdout.write(toJSON(createInitialTree(state)));
  `], { encoding: 'utf8' });
}

for (const [width, height] of [[1440, 900], [390, 844]]) {
  test(`C2 candidate menu → five puzzles → ending → +100 → Hub (${width}×${height})`, async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => { errors.push(error.message); console.log('PAGE ERROR:', error.message); });
    page.on('console', message => { if (message.type() === 'error') console.log('BROWSER ERROR:', message.text()); });
    await page.addInitScript(({ saveKey, raw }) => {
      if (!sessionStorage.getItem('c2-playtest-fixture')) {
        localStorage.setItem(saveKey, raw);
        localStorage.setItem('tiem-may-nep-visited', 'true');
        sessionStorage.setItem('c2-playtest-fixture', 'true');
      }
    }, { saveKey: key, raw: fixture() });
    await page.goto('/');
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
    await page.locator('[data-chapter="c2"] .journey-map-label').click();
    console.log('C2 selected from real map');
    await expect(page.getByRole('button', { name: 'Khép lời kể' })).toBeVisible();
    await page.getByRole('button', { name: 'Khép lời kể' }).click();
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
    await page.screenshot({ path: `artifacts/c2-playtest-ending-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Về sân nhà', exact: true }).click();
    await expect(page.locator('.studio-challenge')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
