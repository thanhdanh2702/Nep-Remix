import { test, expect, type Page } from '@playwright/test';

const PHOTO = 'assets/screens/welcome/welcome-courtyard.png'; // 1774x887: larger than the 768 px downscale target
const CONSENT = /Tôi đồng ý gửi ảnh này tới Google Gemini/;
const result = (hairLength: string) => ({ ok: true, data: { hairLength, hairColor: 'den', glasses: 'khong_kinh', avatarPreset: 'an-default' } });
const fallback = { ok: false, fallback: { hairLength: 'ngang_vai', hairColor: 'den', glasses: 'khong_kinh', avatarPreset: 'an-default', reason: 'ai_unavailable', message: 'Tín hiệu AI gián đoạn.' } };

/** Width/height from the first JPEG start-of-frame marker. */
function jpegSize(buffer: Buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    const marker = buffer[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  throw new Error('No JPEG frame header found');
}

async function pickPhoto(page: Page) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Tải ảnh của bạn', exact: true }).click();
  await (await chooser).setFiles(PHOTO);
  await expect(page.getByRole('img', { name: 'Ảnh bạn đã chọn' })).toBeVisible();
}
async function analyze(page: Page) {
  await page.getByRole('checkbox', { name: CONSENT }).check();
  await page.getByRole('button', { name: 'Phân tích bằng Gemini', exact: true }).click();
}
async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Diện mạo & Cài đặt' })).toBeVisible();
}

test('picking a photo never calls AI; analysis needs consent first', async ({ page }) => {
  const aiRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/ai/')) aiRequests.push(request.url()); });
  await page.goto('/');
  await pickPhoto(page);
  const analyzeButton = page.getByRole('button', { name: 'Phân tích bằng Gemini', exact: true });
  const consent = page.getByRole('checkbox', { name: CONSENT });
  await expect(consent).not.toBeChecked();
  await expect(analyzeButton).toBeDisabled();
  await consent.check();
  await expect(analyzeButton).toBeEnabled();
  await consent.uncheck();
  await expect(analyzeButton).toBeDisabled();
  expect(aiRequests).toEqual([]);
});

test('consent + analyze sends a downscaled JPEG; the suggested look is applied in game and nothing is stored', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let body: { imageBase64: string; mimeType: string } | undefined;
  await page.route('**/api/ai/analyze-selfie', route => { body = route.request().postDataJSON(); return route.fulfill({ json: result('ngan') }); });
  await page.goto('/');
  await pickPhoto(page);
  await analyze(page);
  const status = page.locator('.nep-selfie-result');
  await expect(status.locator('.ai-badge')).toHaveText('Gemini');
  await expect(status).toContainText('Nếp gợi ý: tóc ngắn');

  expect(body!.mimeType).toBe('image/jpeg');
  expect(body!.imageBase64).toMatch(/^data:image\/jpeg;base64,/);
  const size = jpegSize(Buffer.from(body!.imageBase64.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
  expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(768);
  expect(size.width).toBeGreaterThan(size.height);

  await status.getByRole('button', { name: 'Dùng diện mạo này', exact: true }).click();
  await expect(status).toContainText('Đã chọn diện mạo này');
  await page.getByRole('dialog').getByRole('button', { name: 'Vào game', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Đã áp diện mạo mới');
  await openSettings(page);
  await expect(page.getByLabel('Nếp tóc')).toHaveValue('bob');
  await expect(page.getByLabel('Nếp tóc').locator('option:checked')).toHaveText('Tóc ngắn');

  const stored = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  expect(JSON.stringify(stored)).toContain('an-bob-default');
  expect(JSON.stringify(stored)).not.toMatch(/base64|data:image/);
  expect(errors).toEqual([]);
});

test('applying a suggestion keeps the outfit variant already chosen', async ({ page }) => {
  await page.route('**/api/ai/analyze-selfie', route => route.fulfill({ json: result('dai') }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Vào game', exact: true }).click();
  await openSettings(page);
  await page.getByLabel('Nếp tóc').selectOption('bob');
  await page.getByLabel('Nếp áo').selectOption('jade');
  await page.getByRole('button', { name: 'Lưu diện mạo', exact: true }).click();
  await page.getByRole('button', { name: 'Tiệm May Nếp · Về màn chờ', exact: true }).click();

  await pickPhoto(page);
  await analyze(page);
  await expect(page.locator('.nep-selfie-result')).toContainText('Nếp gợi ý: tóc dài');
  await page.getByRole('button', { name: 'Dùng diện mạo này', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tiếp tục chơi', exact: true }).click();
  await openSettings(page);
  await expect(page.getByLabel('Nếp tóc')).toHaveValue('long');
  await expect(page.getByLabel('Nếp áo')).toHaveValue('jade');
});

test('AI fallback shows the offline badge and never blocks entering the game', async ({ page }) => {
  await page.route('**/api/ai/analyze-selfie', route => route.fulfill({ json: fallback }));
  await page.goto('/');
  await pickPhoto(page);
  await analyze(page);
  const status = page.locator('.nep-selfie-result');
  await expect(status.locator('.ai-badge')).toHaveText('AI offline – chọn diện mạo trong Cài đặt');
  await expect(status).toContainText('Bạn vẫn có thể chọn diện mạo trong Cài đặt');
  await expect(status.getByRole('button', { name: 'Dùng diện mạo này' })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('ai_unavailable');
  await page.getByRole('dialog').getByRole('button', { name: 'Vào game', exact: true }).click();
  await expect(page.locator('.scene canvas')).toHaveAttribute('data-position', '440.0,340.0');
  await openSettings(page);
  await expect(page.getByLabel('Nếp tóc')).toHaveValue('long');
});

test('closing the modal drops the preview and the result, and aborts a running request', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/ai/analyze-selfie', async route => { await gate; await route.fulfill({ json: result('ngan') }).catch(() => undefined); });
  await page.goto('/');
  await pickPhoto(page);
  await analyze(page);
  await expect(page.getByRole('button', { name: 'Gemini đang xem ảnh…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  release();

  // Reopen without choosing a file: nothing of the previous photo or result is left.
  await page.getByRole('button', { name: 'Tải ảnh của bạn', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Một phiên bản pixel của bạn' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Ảnh bạn đã chọn' })).toHaveCount(0);
  await expect(dialog.getByRole('checkbox')).toHaveCount(0);
  await expect(dialog.locator('.nep-selfie-result')).toHaveCount(0);
  await page.waitForTimeout(300);
  await expect(dialog.locator('.ai-badge')).toHaveCount(0);
});
