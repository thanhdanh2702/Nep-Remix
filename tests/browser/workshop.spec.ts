import { test, expect, type Page } from '@playwright/test';

const aoDai = (garmentId: string, extra: Record<string, unknown> = {}) => ({
  isVietnameseAoDai: true, garmentCategory: 'ao_dai', identifiedSilhouette: 'ngu_than_tay_chen', garmentId,
  collarType: 'dung', patternType: 'theu', dominantColorHex: '#B83A24', secondaryColorHex: '#F3DF9F', ...extra,
});
const hanbok = {
  isVietnameseAoDai: false, garmentCategory: 'hanbok', foreignGarmentType: 'hanbok', differentiationCardId: 'diff-ao-dai-vs-hanbok',
  differentiationTitle: 'Phân biệt Áo dài và Hanbok Hàn Quốc', differentiationExplanation: 'Bộ trang phục trong ảnh là hanbok truyền thống.',
};

async function openWorkshop(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Tủ đồ', exact: true }).first().click();
  await page.getByRole('button', { name: 'Xưởng may', exact: true }).click();
}

// A real 1600x1000 PNG made in the page, so the downscale path runs on a genuinely large image.
async function chooseImage(page: Page, name = 'ao.png') {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600; canvas.height = 1000;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#B83A24'; context.fillRect(0, 0, 1600, 1000);
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('Chọn ảnh áo').setInputFiles({ name, mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') });
  await expect(page.getByRole('img', { name: 'Ảnh áo bạn đã chọn' })).toBeVisible();
}

// Reads width/height from the JPEG SOF marker so the test needs no image library.
function jpegSize(bytes: Buffer) {
  expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8]);
  for (let i = 2; i < bytes.length - 9;) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  throw new Error('JPEG size marker not found');
}

test('choosing an image makes no AI request until the button is pressed', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/ai/')) calls.push(request.url()); });
  await page.route('**/api/ai/analyze-garment', route => route.fulfill({ json: { ok: true, data: aoDai('ao-tu-than') } }));
  await openWorkshop(page);
  await expect(page.getByText('Ảnh chỉ dùng để nhận diện, không được lưu.')).toBeVisible();
  await chooseImage(page);
  await page.waitForTimeout(500);
  expect(calls).toEqual([]);
  await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
  await expect(page.locator('.workshop-card')).toBeVisible();
  expect(calls).toHaveLength(1);
  // Leaving the tab drops the preview and the result.
  await page.getByRole('button', { name: 'Áo đã có', exact: true }).click();
  await page.getByRole('button', { name: 'Xưởng may', exact: true }).click();
  await expect(page.locator('.workshop-preview, .workshop-card')).toHaveCount(0);
});

test('Vietnamese ao dai: result card, Phối thử opens the Studio with that garment', async ({ page }) => {
  await page.route('**/api/ai/analyze-garment', route => route.fulfill({ json: { ok: true, data: aoDai('ao-ngu-than-tay-chen') } }));
  await openWorkshop(page);
  await chooseImage(page);
  await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
  const card = page.locator('.workshop-card');
  await expect(card).toContainText('Áo ngũ thân tay chẽn');
  await expect(card).toContainText('Cổ đứng');
  await expect(card).toContainText('Thêu tay');
  await expect(card.locator('.studio-ai-swatches span')).toHaveCount(2);
  await expect(page.locator('.workshop-result .ai-badge')).toHaveText('Gemini');
  await expect(card).not.toContainText('chưa có trong tủ');
  await card.getByRole('button', { name: 'Phối thử trong Phòng phối đồ', exact: true }).click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.doll-caption')).toHaveText('Áo ngũ thân tay chẽn');
});

test('ao dai whose shape is not unlocked falls back to an owned garment with a note', async ({ page }) => {
  await page.route('**/api/ai/analyze-garment', route => route.fulfill({ json: { ok: true, data: aoDai('ao-dai-tan-thoi-vang-mo-ga', { identifiedSilhouette: 'tan_thoi', dominantColorHex: 'not-a-colour' }) } }));
  await openWorkshop(page);
  await chooseImage(page);
  await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
  await expect(page.locator('.workshop-card')).toContainText('Dáng này chưa có trong tủ');
  await expect(page.locator('.workshop-card .studio-ai-swatches span')).toHaveCount(1);
  await page.getByRole('button', { name: 'Phối thử trong Phòng phối đồ', exact: true }).click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.doll-caption')).toHaveText('Áo tứ thân');
});

test('hanbok: shows the differentiation card, no Studio shortcut', async ({ page }) => {
  await page.route('**/api/ai/analyze-garment', route => route.fulfill({ json: { ok: true, data: hanbok } }));
  await openWorkshop(page);
  await chooseImage(page);
  await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
  const card = page.locator('.workshop-card');
  await expect(card).toContainText('Đây là hanbok Hàn Quốc');
  await expect(card).toContainText('Phân biệt Áo dài và Hanbok Hàn Quốc');
  await expect(card).toContainText('hanbok truyền thống');
  await expect(page.getByRole('button', { name: 'Phối thử trong Phòng phối đồ' })).toHaveCount(0);
});

test('HTTP 500: offline badge, message and Tự chọn opens the Studio', async ({ page }) => {
  await page.route('**/api/ai/analyze-garment', route => route.fulfill({ status: 500, body: 'boom' }));
  await openWorkshop(page);
  await chooseImage(page);
  await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
  await expect(page.locator('.workshop-result .ai-badge')).toHaveText('AI offline – chọn thủ công');
  await expect(page.locator('.workshop-result')).toContainText('Không phân tích được áo lúc này.');
  await expect(page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Tự chọn trong Phòng phối đồ', exact: true }).click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.doll-caption')).toHaveText('Áo tứ thân');
});

test('request body is a JPEG with its longest side at most 768 px', async ({ page }) => {
  let body: { imageBase64?: string; mimeType?: string } = {};
  await page.route('**/api/ai/analyze-garment', route => { body = route.request().postDataJSON(); return route.fulfill({ json: { ok: true, data: aoDai('ao-tu-than') } }); });
  await openWorkshop(page);
  await chooseImage(page);
  await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
  await expect(page.locator('.workshop-card')).toBeVisible();
  expect(body.mimeType).toBe('image/jpeg');
  const size = jpegSize(Buffer.from(body.imageBase64!, 'base64'));
  expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(768);
  expect(size).toEqual({ width: 768, height: 480 });
});

test('rejects non-images before any processing', async ({ page }) => {
  await openWorkshop(page);
  await page.getByLabel('Chọn ảnh áo').setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await expect(page.getByRole('alert')).toContainText('JPG, PNG hoặc WEBP');
  await expect(page.getByRole('button', { name: 'Nhờ Gemini xem áo' })).toHaveCount(0);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`closet tabs and Xưởng may do not overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/ai/analyze-garment', route => route.fulfill({ json: { ok: true, data: aoDai('ao-dai-tan-thoi-vang-mo-ga', { identifiedSilhouette: 'tan_thoi' }) } }));
    await openWorkshop(page);
    await chooseImage(page);
    await page.getByRole('button', { name: 'Nhờ Gemini xem áo', exact: true }).click();
    await expect(page.locator('.workshop-card')).toBeVisible();
    const panel = page.locator('.room-panel');
    const box = (await panel.boundingBox())!;
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const name of ['Áo đã có', 'Bộ đã lưu', 'Cửa hàng', 'Xưởng may']) {
      const tab = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
      expect(tab.x).toBeGreaterThanOrEqual(box.x);
      expect(tab.x + tab.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
    await panel.evaluate(element => element.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/workshop-${viewport.width}x${viewport.height}.png` });
  });
}
