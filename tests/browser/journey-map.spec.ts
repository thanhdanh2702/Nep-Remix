import { test, expect, type Page } from '@playwright/test';

async function openMap(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await expect(page.locator('.journey-map-screen')).toBeVisible();
}

test('Map reveals through two clouds, shows the six representatives and preserves progress', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await openMap(page);
  await expect(page.locator('.journey-cloud')).toHaveCount(2);
  await expect(page.locator('.journey-map-screen')).toHaveAttribute('data-revealing', 'true');
  await expect(page.locator('.journey-map-art')).toHaveAttribute('inert', '');
  await page.screenshot({ path: 'artifacts/journey-map-clouds.png' });
  await expect(page.locator('.journey-map-screen')).toHaveAttribute('data-revealing', 'false');
  await expect(page.locator('.journey-cloud')).toHaveCount(0);
  await expect(page.locator('.journey-map-stop')).toHaveCount(6);
  await expect(page.locator('.is-locked .journey-map-label')).toHaveCount(5);
  await expect(page.locator('.is-locked .journey-map-label .journey-lock')).toHaveCount(5);
  await expect(page.locator('[data-chapter="c1"] .journey-map-label')).toBeDisabled();
  for (const id of ['prologue', 'c5']) await expect(page.locator(`[data-chapter="${id}"] canvas`)).toHaveAttribute('data-ready', 'true');
  expect(await page.locator('.journey-map-character img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const save = await page.evaluate(() => localStorage.getItem('tiem-may-nep-save-v1'));
  await page.screenshot({ path: 'artifacts/journey-map-desktop.png' });
  await page.locator('[data-chapter="prologue"] .journey-map-character').click();
  await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-area', 'c0-s1-tiem-may-chieu');
  await page.getByRole('button', { name: 'Bản đồ chương', exact: true }).click();
  await expect(page.locator('.journey-map-screen')).toHaveAttribute('data-revealing', 'false');
  expect(await page.evaluate(() => localStorage.getItem('tiem-may-nep-save-v1'))).toBe(save);
  await page.getByRole('button', { name: '‹ Về sân nhà', exact: true }).click();
  await expect(page.locator('.app-shell')).toHaveClass('app-shell screen-hub');
  expect(errors).toEqual([]);
});

test('Mobile map pans without page overflow and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openMap(page);
  await expect(page.locator('.journey-map-screen')).toHaveAttribute('data-revealing', 'false');
  await expect(page.locator('.journey-clouds')).toHaveCount(0);
  const scroll = page.locator('.journey-map-scroll');
  expect(await scroll.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('[data-chapter="prologue"] canvas')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'artifacts/journey-map-mobile.png' });
  await scroll.evaluate(el => { el.scrollLeft = 0; });
  await expect(page.locator('[data-chapter="c1"] .journey-map-label')).toBeInViewport();
  await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; });
  await expect(page.locator('[data-chapter="c5"] .journey-map-label')).toBeInViewport();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-world-width', '890');
  await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-area', 'c0-s1-tiem-may-chieu');
});
