import { test, expect } from '@playwright/test';

test('The fitting model stays anchored with a bottom wardrobe and four live lookbook views', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
  const canvas = page.locator('#paperdoll');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.studio-room .room-background img')).toHaveAttribute('src', /vietnamese-room--landscape/);
  await expect(page.locator('.studio-room .room-panel')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Chụp Lookbook', exact: true })).toHaveCount(0);
  const portraits = page.locator('.studio-lookbook canvas');
  await expect(portraits).toHaveCount(4);
  for (const portrait of await portraits.all()) await expect(portrait).toHaveAttribute('data-ready', 'true');
  expect(await portraits.evaluateAll(canvases => canvases.map(canvas => (canvas as HTMLElement).dataset.direction))).toEqual(['down', 'left', 'up', 'down']);
  await expect(page.locator('.studio-lookbook-card figcaption')).toHaveText(['Chính diện', 'Góc nghiêng', 'Sau lưng', 'Cận cảnh']);
  const wardrobe = page.locator('.studio-wardrobe:visible');
  await expect(wardrobe.locator('.wardrobe-card')).toHaveCount(6);
  await expect(wardrobe.locator('.wardrobe-card[aria-pressed="true"]')).toHaveCount(1);
  for (const preview of await wardrobe.locator('.wardrobe-garment').all()) {
    await expect(preview).toHaveAttribute('data-ready', 'true');
    expect(await preview.evaluate((canvas: HTMLCanvasElement) => Array.from(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data).some((value, i) => i % 4 === 3 && value > 0))).toBe(true);
    const image = (await preview.boundingBox())!;
    const card = (await preview.locator('..').boundingBox())!;
    expect(image.x).toBeGreaterThanOrEqual(card.x);
    expect(image.y).toBeGreaterThanOrEqual(card.y);
    expect(image.x + image.width).toBeLessThanOrEqual(card.x + card.width + 1);
    expect(image.y + image.height).toBeLessThanOrEqual(card.y + card.height + 1);
  }
  await page.getByRole('button', { name: 'Trang trang phục tiếp', exact: true }).click();
  await expect(wardrobe.locator('.wardrobe-pagination span')).toHaveText('2/2');
  await page.getByRole('button', { name: 'Trang trang phục trước', exact: true }).click();
  const initialBox = (await canvas.boundingBox())!;
  const images = new Set<string>();
  for (const direction of ['down', 'left', 'up', 'right']) {
    await expect(canvas).toHaveAttribute('data-direction', direction);
    await expect(canvas).toHaveAttribute('data-ready', 'true');
    images.add(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()));
    expect(await canvas.boundingBox()).toEqual(initialBox);
    await page.screenshot({ path: `artifacts/studio-${direction}.png` });
    await page.getByRole('button', { name: 'Xoay nhân vật sang phải' }).click();
  }
  expect(images.size).toBe(4);
  await expect(canvas).toHaveAttribute('data-direction', 'down');
  await page.getByRole('button', { name: 'Xoay nhân vật sang trái' }).click();
  await expect(canvas).toHaveAttribute('data-direction', 'right');
  await page.getByRole('button', { name: 'Tùy chỉnh bộ phối', exact: true }).click();
  await page.getByRole('button', { name: 'Ghim để so sánh', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  expect(await canvas.boundingBox()).toEqual(initialBox);
  await page.getByRole('tab', { name: 'Màu vải' }).click();
  const beforeColor = await portraits.evaluateAll(canvases => canvases.map(canvas => (canvas as HTMLCanvasElement).toDataURL()));
  await page.getByRole('button', { name: 'Men lam', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  expect(await canvas.boundingBox()).toEqual(initialBox);
  await expect(wardrobe.getByRole('button', { name: 'Men lam', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => portraits.evaluateAll(canvases => canvases.map(canvas => (canvas as HTMLCanvasElement).toDataURL()))).not.toEqual(beforeColor);
  for (const portrait of await portraits.all()) await expect(portrait).toHaveAttribute('data-ready', 'true');
  expect((await portraits.evaluateAll(canvases => canvases.map(canvas => (canvas as HTMLCanvasElement).toDataURL()))).every((value, i) => value !== beforeColor[i])).toBe(true);
  await page.getByRole('button', { name: 'Tùy chỉnh bộ phối', exact: true }).click();
  await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-direction', 'right');
  await page.keyboard.press('w');
  expect(await canvas.boundingBox()).toEqual(initialBox);

  for (const viewport of [{ width: 1900, height: 872 }, { width: 1520, height: 698 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 390, height: 667 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const box = (await canvas.boundingBox())!;
      const stage = (await page.locator('.game-stage').boundingBox())!;
      return box.y >= stage.y && box.y + box.height <= stage.y + stage.height;
    }).toBe(true);
    const model = (await canvas.boundingBox())!;
    const panel = (await page.locator('.studio-lookbook').boundingBox())!;
    const dock = (await page.locator('.studio-wardrobe-dock').boundingBox())!;
    const stage = (await page.locator('.game-stage').boundingBox())!;
    const rotate = (await page.locator('.studio-turn-controls').boundingBox())!;
    expect(model.x + model.width).toBeLessThan(panel.x);
    expect(rotate.y + rotate.height).toBeLessThanOrEqual(dock.y);
    const caption = (await page.locator('.studio-room .doll-caption').boundingBox())!;
    expect(caption.y + caption.height).toBeLessThanOrEqual(dock.y);
    expect(panel.y + panel.height).toBeLessThanOrEqual(dock.y);
    expect(dock.x).toBe(stage.x);
    expect(dock.width).toBe(stage.width);
    expect(dock.y + dock.height).toBe(stage.y + stage.height);
    for (const portrait of await portraits.all()) {
      const box = (await portrait.locator('..').boundingBox())!;
      expect(box.height).toBeGreaterThan(20);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth && document.documentElement.scrollHeight === innerHeight)).toBe(true);
    await page.screenshot({ path: `artifacts/studio-${viewport.width}x${viewport.height}.png` });
    await page.getByRole('button', { name: 'Xoay nhân vật sang phải' }).click();
    await expect(canvas).toHaveAttribute('data-ready', 'true');
  }
  expect(errors).toEqual([]);
});
