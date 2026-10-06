import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const saveKey = 'tiem-may-nep-save-v1';
const prologue = JSON.parse(readFileSync('src/content/chapters/prologue.json', 'utf8'));
const cards = JSON.parse(readFileSync('src/content/culture-cards.json', 'utf8'));
const items = JSON.parse(readFileSync('src/content/items.json', 'utf8'));
const spot = (page: Page, id: string) => page.locator(`[data-hotspot="${id}"]`);
const saved = (page: Page) => page.evaluate(key => {
  const tree = JSON.parse(localStorage.getItem(key)!).tree;
  return tree.nodes[tree.headId].snapshot;
}, saveKey);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
}

async function loft(page: Page) {
  await start(page);
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await page.locator('[data-exit="stairs"]').click();
  await page.getByRole('button', { name: 'Bước lên gác xép' }).click();
  await spot(page, 'hitbox-chest-cloth').click();
  await page.getByRole('button', { name: 'Gỡ tấm vải phủ' }).click();
  await spot(page, 'hitbox-sewing-basket').click();
}

test('item selection persists after wrong submit, close and reload', async ({ page }) => {
  await loft(page);
  await spot(page, 'hitbox-mannequin-hand').click();
  const scissors = page.getByRole('dialog').getByRole('button', { name: 'Kéo may bằng đồng', exact: true });
  await scissors.click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await expect(scissors).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await spot(page, 'hitbox-mannequin-hand').click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Kéo may bằng đồng', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect((await saved(page)).journey.prologue.puzzleDrafts['p-c0-mannequin-hand'].answer).toBe('keo_may_bang_dong');
});

test('fresh prologue ending resolves every reward label and does not pre-read the card', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await loft(page);
  await spot(page, 'hitbox-mannequin-hand').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Kim gút bằng bạc', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await spot(page, 'hitbox-chest-lock').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chìa khóa đồng ba chấu', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lời kể', exact: true }).click();
  const ending = page.getByRole('dialog', { name: 'Nếp ký ức đầu tiên', exact: true });
  await expect(ending).toContainText(cards.find((card: { id: string }) => card.id === 'card-tiem-may-nep-origins').title);
  await expect(ending).toContainText(items.find((item: { id: string }) => item.id === 'thuoc_go_tho_may_1888').name);
  const state = await saved(page);
  expect(state.wallet.senNgoc).toBe(150);
  expect(state.museum.unlockedCardIds).toContain('card-tiem-may-nep-origins');
  expect(state.museum.readCardIds).toEqual([]);
  expect(errors).toEqual([]);
});

test('completed but unclaimed save resumes reward claim once', async ({ page }) => {
  await start(page);
  await page.evaluate(({ key, puzzleIds }) => {
    const envelope = JSON.parse(localStorage.getItem(key)!);
    const progress = envelope.tree.nodes[envelope.tree.headId].snapshot.journey.prologue;
    progress.status = 'completed';
    progress.solvedPuzzleIds = puzzleIds;
    progress.completedDialogueIds = ['d-c0-ba-dan-do'];
    localStorage.setItem(key, JSON.stringify(envelope));
  }, { key: saveKey, puzzleIds: prologue.puzzles.map((p: { id: string }) => p.id) });
  await page.reload();
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await expect.poll(async () => (await saved(page)).journey.prologue.claimed).toBe(true);
  expect((await saved(page)).wallet.senNgoc).toBe(150);
  await page.reload();
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  expect((await saved(page)).wallet.senNgoc).toBe(150);
});

test('corrupt save is preserved and the UI reports that the new session is unsaved', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken-save'), saveKey);
  await start(page);
  await expect(page.locator('.toast')).toContainText('Bản gốc được giữ lại');
  expect(await page.evaluate(key => localStorage.getItem(key), saveKey)).toBe('{broken-save');
});
