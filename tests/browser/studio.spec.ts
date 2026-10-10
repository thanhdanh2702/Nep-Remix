import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('src/content/studio.json', 'utf8'));
const output = 'artifacts/design-options/implementation-c-lb1/final';
async function enter(page: Page, allGarments = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  if (allGarments) {
    await page.evaluate(catalog => {
      const key = 'tiem-may-nep-save-v1', envelope = JSON.parse(localStorage.getItem(key)!);
      const state = envelope.tree.nodes[envelope.tree.headId].snapshot;
      state.closet.unlockedGarmentIds = catalog.garments.map((g: { id: string }) => g.id);
      state.closet.unlockedAccessoryIds = catalog.accessories.map((a: { id: string }) => a.id);
      localStorage.setItem(key, JSON.stringify(envelope));
    }, catalog);
    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  }
  await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(async () => { await document.fonts.ready; });
}

test('both hats visibly equip in all four Studio views, replace each other and undo cleanly', async ({ page }) => {
  await enter(page, true);
  const model = page.locator('#paperdoll');
  const pixels = () => model.evaluate((canvas: HTMLCanvasElement) => Array.from(canvas.getContext('2d')!.getImageData(0, 0, 176, 160).data));
  const view = async (direction: string) => {
    if (direction === 'down') await page.getByRole('button', { name: 'Trước', exact: true }).click();
    if (direction === 'up') await page.getByRole('button', { name: 'Sau', exact: true }).click();
    if (direction === 'left' || direction === 'right') {
      await page.getByRole('button', { name: 'Trước', exact: true }).click();
      await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
      if (direction === 'right') await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
    }
    await expect(model).toHaveAttribute('data-direction', direction);
    await expect(model).toHaveAttribute('data-ready', 'true');
  };
  const bare = new Map<string, number[]>();
  for (const direction of ['down', 'left', 'up', 'right']) { await view(direction); bare.set(direction, await pixels()); }
  await page.getByRole('tab', { name: 'Phụ kiện', exact: true }).click();
  for (const id of ['non-quai-thao', 'non-la']) {
    if (id === 'non-la') await page.getByRole('button', { name: 'Trang trang phục tiếp', exact: true }).click();
    await page.getByRole('button', { name: catalog.accessories.find((a: { id: string }) => a.id === id).name, exact: true }).click();
    await expect(model).toHaveAttribute('data-accessory-layers', JSON.stringify([`assets/accessories/${id}/${id}.png`]));
    for (const direction of ['down', 'left', 'up', 'right']) {
      await view(direction);
      expect(await pixels()).not.toEqual(bare.get(direction));
      await model.screenshot({ path: `artifacts/headwear/${id}-${direction}.png`, animations: 'disabled' });
    }
  }
  await page.getByRole('button', { name: 'Tùy chỉnh bộ phối', exact: true }).click();
  await page.getByRole('button', { name: 'Tháo phụ kiện', exact: true }).click();
  await expect(model).toHaveAttribute('data-accessory-layers', '[]');
  expect(await pixels()).toEqual(bare.get('right'));
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.locator('.studio-history').getByRole('button', { name: 'Hoàn tác', exact: true }).click();
  await expect(model).toHaveAttribute('data-accessory-layers', '["assets/accessories/non-la/non-la.png"]');
  expect(await pixels()).not.toEqual(bare.get('right'));
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Concept C uses every existing garment in four native directions, with working color, history and save', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().includes('/api/ai/')) requests.push(r.url()); });
  await enter(page, true);
  const model = page.locator('#paperdoll');
  const garmentHashes = new Set();
  for (let index = 0; index < catalog.garments.length; index++) {
    const g = catalog.garments[index];
    if (index && index % 4 === 0) await page.getByRole('button', { name: 'Trang trang phục tiếp', exact: true }).click();
    await page.locator('.studio-book-catalog').getByRole('button', { name: g.name, exact: true }).click();
    await expect(model).toHaveAttribute('data-garment-layer', 'assets/garments/' + g.id + '/' + g.id + '.png');
    await expect(model).toHaveAttribute('data-ready', 'true');
    const images = new Set();
    for (const direction of ['down', 'left', 'up', 'right']) {
      if (direction === 'down') await page.getByRole('button', { name: 'Trước', exact: true }).click();
      if (direction === 'left') await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
      if (direction === 'up') await page.getByRole('button', { name: 'Sau', exact: true }).click();
      if (direction === 'right') {
        await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
        await expect(model).toHaveAttribute('data-direction', 'left');
        await page.getByRole('button', { name: 'Nghiêng', exact: true }).click();
      }
      await expect(model).toHaveAttribute('data-direction', direction);
      await expect(model).toHaveAttribute('data-ready', 'true');
      await expect(model).toHaveAttribute('data-garment-layer', 'assets/garments/' + g.id + '/' + g.id + (direction === 'right' ? '--right.png' : '.png'));
      const pixels = await model.evaluate((c: HTMLCanvasElement) => c.toDataURL());
      images.add(pixels);
      if (direction === 'down') {
        garmentHashes.add(pixels);
        await page.screenshot({ path: output + '/garment-' + g.id + '.png', animations: 'disabled' });
      }
      await model.screenshot({ path: output + '/wearables/' + g.id + '-' + direction + '.png', animations: 'disabled' });
    }
    expect(images.size).toBe(4);
    await page.getByRole('button', { name: 'Trước', exact: true }).click();
    await expect(model).toHaveAttribute('data-direction', 'down');
  }
  expect(garmentHashes.size).toBe(catalog.garments.length);
  await page.getByRole('button', { name: 'Men lam', exact: true }).click();
  await expect(model).toHaveAttribute('data-outfit', /#2D6A5D/);
  await expect(model).toHaveAttribute('data-ready', 'true');
  const colored = await model.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.locator('.studio-history').getByRole('button', { name: 'Hoàn tác', exact: true }).click();
  await expect.poll(() => model.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toEqual(colored);
  await page.locator('.studio-history').getByRole('button', { name: 'Làm lại', exact: true }).click();
  await expect.poll(() => model.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toEqual(colored);
  await page.getByLabel('Dịp sử dụng').selectOption('tet');
  await page.getByRole('button', { name: 'Tùy chỉnh bộ phối', exact: true }).click();
  await page.getByLabel('Tên bộ phối').fill('Sổ phối thử nghiệm');
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu bộ phối', exact: true }).click();
  const saved = await page.evaluate(() => {
    const e = JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!);
    return e.tree.nodes[e.tree.headId].snapshot.closet.savedOutfits;
  });
  expect(saved.some((o: { name: string }) => o.name === 'Sổ phối thử nghiệm')).toBe(true);
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('LB1 has empty states, isolated sample previews and fitted photo apertures on desktop and phone', async ({ page }) => {
  await enter(page, true);
  const calls: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/ai/')) calls.push(r.url()); });
  for (const viewport of [{ width: 1672, height: 941 }, { width: 1900, height: 872 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.locator('.studio-book-room').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: output + '/studio-' + viewport.width + 'x' + viewport.height + '.png', animations: 'disabled' });
    await page.getByRole('button', { name: 'Chụp Lookbook AI', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Lookbook AI' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.lookbook-slot-text')).toHaveText(['Chưa có ảnh', 'Chưa có ảnh', 'Chưa có ảnh', 'Chưa có ảnh']);
    await expect(dialog.getByRole('button', { name: 'Lưu ảnh PNG', exact: true })).toBeDisabled();
    await page.screenshot({ path: output + '/lookbook-empty-' + viewport.width + 'x' + viewport.height + '.png', animations: 'disabled' });
    await dialog.getByRole('button', { name: 'Xem ảnh mẫu', exact: true }).click();
    await expect(dialog.locator('.lookbook-sample-photo')).toHaveCount(4);
    await expect(dialog.locator('[data-status=done]')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Lưu ảnh PNG', exact: true })).toBeDisabled();
    if (viewport.width === 1672) {
      const targets = [[689, 165, 298, 242], [1105, 165, 307, 242], [680, 456, 302, 246], [1104, 457, 308, 246]];
      for (const [i, el] of (await dialog.locator('.lookbook-photo-aperture').all()).entries()) {
        const r = (await el.boundingBox())!;
        for (const [j, value] of [r.x, r.y, r.width, r.height].entries()) expect(Math.abs(value - targets[i][j])).toBeLessThan(12);
      }
    }
    await page.screenshot({ path: output + '/lookbook-sample-' + viewport.width + 'x' + viewport.height + '.png', animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Chụp Lookbook AI', exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth)).toBe(true);
  }
  expect(calls).toEqual([]);
});
