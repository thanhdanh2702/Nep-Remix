import { test, expect, type Page } from '@playwright/test';

async function openCloset(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Tủ đồ', exact: true }).first().click();
  await expect(page.locator('#closet-doll')).toHaveAttribute('data-ready', 'true');
}
const outfit = (page: Page, selector = '#closet-doll') => page.locator(selector).evaluate(el => JSON.parse((el as HTMLElement).dataset.outfit!));
const savedState = (page: Page) => page.evaluate(() => { const save = JSON.parse(localStorage.getItem('tiem-may-nep-save-v1')!); return save.tree.nodes[save.tree.headId].snapshot; });

test('shop hats visibly preview before purchase and clicking again removes them', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await openCloset(page);
  const model = page.locator('#closet-doll');
  const pixels = () => model.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const bare = await pixels(), before = await savedState(page);
  await page.getByRole('button', { name: 'Ghé quầy phụ kiện', exact: true }).click();
  for (const [id, name] of [['non-quai-thao', 'Nón ba tầm quai thao'], ['non-la', 'Nón lá chóp nhọn']]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(model).toHaveAttribute('data-accessory-layers', JSON.stringify([`assets/accessories/${id}/${id}.png`]));
    expect(await pixels()).not.toEqual(bare);
    await page.screenshot({ path: `artifacts/headwear/closet-${id}.png`, animations: 'disabled' });
    await page.getByRole('button', { name, exact: true }).click();
    await expect(model).toHaveAttribute('data-accessory-layers', '[]');
    expect(await pixels()).toEqual(bare);
  }
  const after = await savedState(page);
  expect(after.wallet).toEqual(before.wallet);
  expect(after.closet.unlockedAccessoryIds).toEqual(before.closet.unlockedAccessoryIds);
});

test('wardrobe previews owned garments and explains locked items without changing ownership', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openCloset(page);
  await expect(page.locator('.closet-card')).toHaveCount(6);
  await expect(page.locator('.closet-card.is-locked')).toHaveCount(4);
  await expect(page.getByRole('tab', { name: 'Áo của bạn' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Áo ngũ thân tay chẽn', exact: true }).click();
  await expect.poll(async () => (await outfit(page)).garmentId).toBe('ao-ngu-than-tay-chen');
  const before = await outfit(page), owned = (await savedState(page)).closet.unlockedGarmentIds;
  await page.locator('.closet-card.is-locked').first().click();
  expect(await outfit(page)).toEqual(before);
  await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Chương 1');
  await expect(page.getByRole('button', { name: 'Cài đặt', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem chi tiết', exact: true })).toBeFocused();
  expect((await savedState(page)).closet.unlockedGarmentIds).toEqual(owned);
  await page.getByRole('button', { name: 'Trang tủ đồ tiếp' }).click();
  await expect(page.locator('.closet-page-number')).toHaveText('2 / 2');
  expect(errors).toEqual([]);
});

test('shop previews are free, purchases persist once and unpaid items are removed before Studio', async ({ page }) => {
  await openCloset(page);
  const before = (await savedState(page)).wallet.senNgoc;
  await page.getByRole('button', { name: 'Ghé quầy phụ kiện', exact: true }).click();
  await page.getByRole('button', { name: 'Khăn vấn hoàng yến', exact: true }).click();
  await expect.poll(async () => (await outfit(page)).accessories.headwear).toBe('khan-van-hoang-yen');
  expect((await savedState(page)).wallet.senNgoc).toBe(before);
  await page.getByRole('button', { name: 'Mua · 25 Sen Ngọc', exact: true }).click();
  await expect.poll(async () => (await savedState(page)).wallet.senNgoc).toBe(before - 25);
  await expect(page.getByRole('button', { name: 'Mua · 25 Sen Ngọc' })).toHaveCount(0);
  expect((await savedState(page)).closet.unlockedAccessoryIds.filter((id: string) => id === 'khan-van-hoang-yen')).toHaveLength(1);
  await page.getByRole('tab', { name: 'Phụ kiện', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Khăn vấn hoàng yến', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ghé quầy phụ kiện', exact: true }).click();
  await page.getByRole('button', { name: 'Khăn mỏ quạ', exact: true }).click();
  await page.getByRole('button', { name: 'Phối tiếp', exact: true }).click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  expect((await outfit(page, '#paperdoll')).accessories.headwear).toBeUndefined();
  expect((await savedState(page)).wallet.senNgoc).toBe(before - 25);
  await page.reload();
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  expect((await savedState(page)).closet.unlockedAccessoryIds).toContain('khan-van-hoang-yen');
});

test('saved outfit thumbnail, rename, delete and restore preserve colours and accessories', async ({ page }) => {
  await openCloset(page);
  await page.getByRole('button', { name: 'Phối tiếp', exact: true }).click();
  await page.getByRole('button', { name: 'Đỏ son', exact: true }).click();
  await page.getByRole('button', { name: 'Tùy chỉnh bộ phối', exact: true }).click();
  await page.getByLabel('Tên bộ phối').fill('Nếp áo đã lưu');
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu bộ phối', exact: true }).click();
  const original = (await savedState(page)).closet.savedOutfits[0];
  await page.getByRole('button', { name: 'Tủ đồ', exact: true }).first().click();
  await page.getByRole('tab', { name: 'Bộ đã lưu', exact: true }).click();
  const thumbnail = page.locator('.closet-card .studio-character');
  await expect(thumbnail).toHaveAttribute('data-ready', 'true');
  await expect.poll(async () => (await outfit(page)).bottom).toEqual(original.bottomPalette);
  expect(JSON.parse((await thumbnail.getAttribute('data-outfit'))!)).toEqual(await outfit(page));
  await page.getByRole('button', { name: 'Quản lý bộ phối', exact: true }).click();
  await page.getByLabel('Tên bộ phối').fill('Nếp hồng');
  await page.getByRole('button', { name: 'Lưu tên', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nếp hồng', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Quản lý bộ phối', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa bộ phối', exact: true }).click();
  await expect(page.locator('.closet-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Hoàn tác xóa', exact: true }).click();
  expect((await savedState(page)).closet.savedOutfits[0]).toEqual({ ...original, name: 'Nếp hồng' });
  await page.getByRole('button', { name: 'Phối tiếp', exact: true }).click();
  await expect(page.locator('#paperdoll')).toHaveAttribute('data-ready', 'true');
  expect((await outfit(page, '#paperdoll')).bottom).toEqual(original.bottomPalette);
});

test('cabinet, character and controls fit desktop, portrait and landscape without image distortion', async ({ page }) => {
  await openCloset(page);
  for (const viewport of [{ width: 1672, height: 941 }, { width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 390, height: 667 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => { const box = (await page.locator('.closet-continue').boundingBox())!; return box.y + box.height <= viewport.height; }).toBe(true);
    const stage = (await page.locator('.game-stage').boundingBox())!;
    const cabinet = (await page.locator('.closet-cabinet').boundingBox())!;
    const main = (await page.locator('#closet-doll').boundingBox())!;
    const nav = (await page.locator('.main-nav').boundingBox())!;
    expect(main.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    expect(main.y + main.height).toBeLessThanOrEqual(viewport.width <= 640 ? cabinet.y : viewport.height);
    expect(cabinet.x).toBeGreaterThanOrEqual(stage.x);
    expect(cabinet.x + cabinet.width).toBeLessThanOrEqual(stage.x + stage.width);
    expect(cabinet.y + cabinet.height).toBeLessThanOrEqual(stage.y + stage.height);
    for (const element of await page.locator('.closet-tabs button,.closet-pagination button,.closet-shortcuts button,.closet-selection button').all()) {
      const box = (await element.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(cabinet.x);
      expect(box.x + box.width).toBeLessThanOrEqual(cabinet.x + cabinet.width + 1);
    }
    const image = (await page.locator('.closet-room .room-background img').boundingBox())!;
    expect(Math.abs(image.width / image.height - 1672 / 941)).toBeLessThan(.002);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const preview of await page.locator('.closet-card canvas.wardrobe-garment').all()) {
      await expect(preview).toHaveAttribute('data-ready', 'true');
      const box = (await preview.boundingBox())!;
      expect(box.height).toBeGreaterThan(25);
    }
    await page.screenshot({ path: `artifacts/closet-redesign-${viewport.width}x${viewport.height}.png` });
  }
});
