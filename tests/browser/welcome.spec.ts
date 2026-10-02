import { test, expect } from '@playwright/test';

test('Welcome waits for explicit entry; upload previews locally and never calls AI', async ({ page }) => {
  const aiRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/ai/')) aiRequests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Áo dài Việt. Chất riêng bạn.' })).toBeVisible();
  await expect(page.locator('.scene canvas')).toHaveCount(0);
  await page.keyboard.press('e');
  expect(await page.evaluate(() => localStorage.getItem('tiem-may-nep-save-v1'))).toBeNull();
  await page.getByRole('button', { name: 'Về Nếp', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chào bạn, tiệm là Nếp!' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Tải ảnh của bạn', exact: true }).click();
  await (await chooserPromise).setFiles('assets/screens/welcome/welcome-courtyard.png');
  await expect(page.getByRole('img', { name: 'Ảnh bạn đã chọn' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Đã chọn ảnh.');
  await expect(page.getByRole('status')).toContainText('Sắp có');
  await page.getByLabel('Chọn ảnh chân dung').setInputFiles({ name: 'not-an-image.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('alert')).toContainText('JPG, PNG hoặc WEBP');
  await page.getByLabel('Chọn ảnh chân dung').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken image') });
  await expect(page.getByRole('alert')).toContainText('chưa mở được ảnh');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.locator('.scene canvas')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('tiem-may-nep-save-v1'))).toBeNull();

  await page.getByRole('button', { name: 'Vào game', exact: true }).click();
  await expect(page.locator('.scene canvas')).toHaveAttribute('data-position', '440.0,340.0');
  const saved = await page.evaluate(() => localStorage.getItem('tiem-may-nep-save-v1'));
  await page.getByRole('button', { name: 'Tiệm May Nếp · Về màn chờ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục chơi', exact: true })).toBeVisible();
  await expect(page.locator('.scene canvas')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('tiem-may-nep-save-v1'))).toBe(saved);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Tiếp tục chơi', exact: true })).toBeVisible();
  await expect(page.locator('.scene canvas')).toHaveCount(0);
  expect(aiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('Shared information pauses movement; signs route rooms below the shared header', async ({ page }) => {
  await page.goto('/');
  const header = await page.locator('.nep-header').boundingBox();
  await expect(page.locator('.nep-footer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Vào game', exact: true }).click();
  const canvas = page.locator('.scene canvas');
  await expect(canvas).toHaveAttribute('data-position', '440.0,340.0');
  await page.getByRole('button', { name: 'Cách chơi', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const position = await canvas.getAttribute('data-position');
  await page.keyboard.down('d'); await page.waitForTimeout(200); await page.keyboard.up('d');
  expect(await canvas.getAttribute('data-position')).toBe(position);
  await page.keyboard.press('Escape');

  for (const [label, room] of [['Phòng phối đồ', 'studio'], ['Bảo tàng', 'museum']] as const) {
    await page.getByRole('button', { name: label, exact: true }).first().click();
    await expect(page.locator('.app-shell')).toHaveClass('app-shell screen-' + room);
    const stage = (await page.locator('.game-stage').boundingBox())!;
    expect(await page.locator('.room-background').boundingBox()).toEqual(stage);
    expect(await page.locator('.nep-header').boundingBox()).toEqual(header);
    expect(stage.y + stage.height).toBe(page.viewportSize()!.height);
    await expect(page.locator('.nep-footer')).toHaveCount(0);
    await page.getByRole('button', { name: '‹ Về sân nhà', exact: true }).click();
  }
});

test('Phone welcome and menu keep controls reachable; returning and resuming keeps the save', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const button = (await page.getByRole('button', { name: 'Vào game', exact: true }).boundingBox())!;
  expect(button.y + button.height).toBeLessThan(844);
  const upload = (await page.getByRole('button', { name: 'Tải ảnh của bạn', exact: true }).boundingBox())!;
  expect(upload.y + upload.height).toBeLessThan(844);
  expect(await page.evaluate(() => document.querySelector('.nep-app')!.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await page.getByRole('button', { name: 'Về Nếp', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chào bạn, tiệm là Nếp!' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Vào game', exact: true }).click();
  await expect(page.locator('.scene canvas')).toHaveAttribute('data-position', '440.0,340.0');
  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await page.getByRole('button', { name: '‹ Màn chờ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục chơi', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục chơi', exact: true }).click();
  await expect(page.locator('.scene canvas')).toHaveAttribute('data-position', '440.0,340.0');
  await expect(page.locator('.nep-header')).toBeVisible();
  await expect(page.locator('.nep-footer')).toHaveCount(0);
  const stage = (await page.locator('.game-stage').boundingBox())!;
  expect(stage.y + stage.height).toBe(844);
});
