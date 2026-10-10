import { test, expect, type Page } from '@playwright/test';

const suggestion = (garmentId: string, garmentName: string, accessoryIds: string[], accessoryNames: string[]) => ({
  garmentId, garmentName, silhouette: 'ngu_than_tay_chen', colorPalette: ['#E6A1B0', '#C25975', '#802D45', '#3A0D1B'],
  accessoryIds, accessoryNames, cultureCardId: 'card-x', templateId: 'mac_dinh_nep', catComment: `Nếp thích ${garmentName}.`,
});
const suggestions = [
  suggestion('ao-tu-than', 'Áo tứ thân', ['khan-van-den'], ['Khăn vấn nhung đen']),
  suggestion('ao-ngu-than-tay-chen', 'Áo ngũ thân tay chẽn', ['guoc-moc'], ['Guốc mộc quai nhung']),
  suggestion('ao-dai-lemur', 'Áo dài Le Mur (Lemur)', ['quat-lua'], ['Quạt lụa thêu hoa']),
];
async function openStudio(page: Page) {
  const errors: string[] = [];
  // A stale dev server can hold the Vite HMR websocket port; those errors are environmental, not ours.
  page.on('pageerror', error => { if (!/24678|\[vite\]|WebSocket closed without opened/.test(error.message)) errors.push(error.message); });
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  return errors;
}

test('stylist ok: 3 cards, locked parts are labelled, Mặc thử changes the garment', async ({ page }) => {
  let body: unknown;
  await page.route('**/api/ai/stylist', route => { body = route.request().postDataJSON(); return route.fulfill({ json: { ok: true, data: { suggestions } } }); });
  const errors = await openStudio(page);
  await page.getByRole('button', { name: 'Gợi ý từ Gemini', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Gợi ý từ Nếp' });
  await expect(dialog.locator('.studio-ai-card')).toHaveCount(3);
  expect(body).toEqual({ eventId: 'dao_pho' });
  await expect(dialog.locator('.ai-badge')).toHaveText('Gemini');
  await expect(dialog.locator('.studio-ai-card').nth(2)).toContainText('Chưa mở khóa');
  await expect(dialog.locator('.studio-ai-card').nth(0)).not.toContainText('Chưa mở khóa');
  await expect(page.locator('.doll-caption')).toHaveText('Áo tứ thân');
  await dialog.getByRole('button', { name: 'Mặc thử Áo ngũ thân tay chẽn' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.doll-caption')).toHaveText('Áo ngũ thân tay chẽn');
  // Undo works like any other studio command.
  await page.locator('.studio-history').getByRole('button', { name: 'Hoàn tác' }).click();
  await expect(page.locator('.doll-caption')).toHaveText('Áo tứ thân');
  expect(errors).toEqual([]);
});

test('stylist fallback: neutral offline badge, static suggestions, no raw reason', async ({ page }) => {
  await page.route('**/api/ai/stylist', route => route.fulfill({ json: { ok: false, fallback: { suggestions, reason: 'ai_unavailable', message: 'Chú mèo Stylist đang bận.' } } }));
  await openStudio(page);
  await page.getByRole('button', { name: 'Gợi ý từ Gemini', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Gợi ý từ Nếp' });
  await expect(dialog.locator('.studio-ai-card')).toHaveCount(3);
  await expect(dialog.locator('.ai-badge')).toHaveText('AI offline – dùng gợi ý có sẵn');
  await expect(page.locator('body')).not.toContainText('ai_unavailable');
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.locator('.studio-ai-row .ai-badge')).toHaveText('AI offline – dùng gợi ý có sẵn');
  // The offline announcement must not steal the neighboring Lookbook button.
  for (const viewport of [{ width: 1672, height: 941 }, { width: 1900, height: 872 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: `artifacts/studio-ui-fix/fallback-${viewport.width}x${viewport.height}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Chụp Lookbook AI', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Lookbook AI' })).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

test('entering the Studio makes no AI request', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/ai/')) calls.push(request.url()); });
  await openStudio(page);
  await expect(page.locator('.studio-book')).toBeVisible();
  await page.waitForTimeout(500);
  expect(calls).toEqual([]);
});
