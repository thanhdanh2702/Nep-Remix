import { test, expect, type Page } from '@playwright/test';

async function openAlbum(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await expect(page.locator('.journey-album')).toBeVisible();
}

test('album previews chapters, opens ready rooms, and preserves old save progress', async ({ page }) => {
  await openAlbum(page);
  await expect(page.locator('.journey-album-row')).toHaveCount(6);
  await page.evaluate(() => {
    const key = 'tiem-may-nep-save-v1', save = JSON.parse(localStorage.getItem(key)!);
    for (const node of Object.values(save.tree.nodes) as { snapshot: { journey: Record<string, { status: string }> } }[]) {
      for (const id of ['c1', 'c2', 'c3']) node.snapshot.journey[id].status = 'locked';
    }
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  for (const id of ['c4', 'c5']) {
    await page.locator(`[data-chapter="${id}"]`).click();
    await expect(page.locator('.journey-enter-chapter')).toBeDisabled();
    await expect(page.locator('.journey-chapter-status:not(.is-ready)')).toHaveCount(2);
  }
  for (const [id, area] of [['c1', 'c1-s1-buong-det-khoa-kin'], ['c2', 'c2-s1-gac-lung-ve-tranh'], ['c3', 'c3-s1-tiem-may-da-kao']]) {
    await page.locator(`[data-chapter="${id}"]`).click();
    await expect(page.locator(`[data-chapter="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.journey-enter-chapter')).toBeEnabled();
    if (id === 'c3') await page.screenshot({ path: 'artifacts/journey-album-desktop.png' });
    if (id !== 'c3') continue;
    await page.locator('.journey-enter-chapter').click();
    await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-area', area);

  }
  const state = await page.evaluate(() => {
    const tree = JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!).tree;
    return tree.nodes[tree.headId].snapshot;
  });
  expect(state.wallet.senNgoc).toBe(100);
  expect(state.journey.prologue.solvedPuzzleIds).toEqual([]);
  expect(state.journey.c3.claimed).toBe(false);
});

test('mobile album fits the viewport and opens the selected chapter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openAlbum(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('[data-chapter="c3"]').click();
  await expect(page.locator('#journey-chapter-title')).toHaveText('Sài Gòn · Đa Kao');
  await page.screenshot({ path: 'artifacts/journey-album-mobile.png' });
  await page.locator('.journey-enter-chapter').click();
  await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-area', 'c3-s1-tiem-may-da-kao');
});

