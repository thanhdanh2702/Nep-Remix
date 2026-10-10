import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const cultureCards: { id: string; title: string; garmentId?: string; sourceIds: string[]; sourceNote: string }[] = JSON.parse(readFileSync(new URL('../../src/content/culture-cards.json', import.meta.url), 'utf8'));
const garmentCatalog: { id: string }[] = JSON.parse(readFileSync(new URL('../../src/content/studio.json', import.meta.url), 'utf8')).garments;
const collectionPages = Math.ceil(cultureCards.length / 6);

const enterGame = async (page: Page) => page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
const openMuseum = async (page: Page) => page.getByRole('button', { name: 'Bảo tàng', exact: true }).first().click();
const room = (page: Page) => page.locator('.room-stage canvas');
const spot = (page: Page, id: string) => page.locator(`.room-hotspots button[data-hotspot="${id}"]`);
const exitArrow = (page: Page, key: string) => page.locator(`.room-exit[data-exit="${key}"]`);
const search = (page: Page) => page.getByRole('searchbox', { name: 'Tìm trong bộ sưu tập' });
const cards = (page: Page) => page.locator('.museum-collection-card');
const start = async (page: Page) => { await page.goto('/'); await enterGame(page); await openMuseum(page); };

test('every culture entry opens its own reader; rewards are granted once and restored', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1672, height: 941 });
  await start(page);
  await expect(page.locator('.museum-count')).toHaveText(`0/${cultureCards.length} tư liệu đã đọc`);
  const before = Number((await page.locator('.hud strong').getAttribute('aria-label'))!.split(' ')[0]);
  const visited = new Set<string>();
  for (let p = 0; p < collectionPages; p++) {
    const count = await cards(page).count();
    for (let i = 0; i < count; i++) {
      const target = cards(page).nth(i), id = (await target.getAttribute('data-entry'))!;
      visited.add(id); await target.click();
      const card = cultureCards.find(c => c.id === id)!, title = card.title;
      if (card.garmentId) {
        await expect(page.locator('.museum-main-art canvas')).toHaveAttribute('data-ready', 'true');
        await expect(page.locator('.museum-main-art canvas')).toHaveAttribute('data-asset', new RegExp(`/garments/${card.garmentId}/${card.garmentId}--hanging\\.png$`));
      }
      await page.getByRole('button', { name: 'Mở tư liệu', exact: false }).click();
      await expect(page.getByRole('dialog', { name: `Tư liệu · ${title}` })).toBeVisible();
      await expect(page.getByRole('button', { name: '‹ Trang trước', exact: true })).toBeDisabled();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('status').filter({ hasText: 'Trang 2 / 4' })).toBeVisible();
      await page.keyboard.press('ArrowLeft');
      await expect(page.getByRole('status').filter({ hasText: 'Trang 1 / 4' })).toBeVisible();
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('dialog')).toContainText(card.sourceNote);
      const sourceLinks = page.getByRole('dialog').locator('.museum-sources a');
      await expect(sourceLinks).toHaveCount(card.sourceIds.length);
      for (const link of await sourceLinks.all()) {
        await expect(link).toHaveAttribute('href', /^https:\/\//);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      await expect(page.getByRole('dialog')).not.toContainText('sẽ được bổ sung');
      await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
      if (p === 0 && i === 0) {
        await page.screenshot({ path: 'artifacts/museum-reader-desktop.png' });
        await expect(page.getByRole('button', { name: '‹ Về sân nhà', exact: true })).toBeDisabled();
        for (let n = 0; n < 8; n++) { await page.keyboard.press('Tab'); expect(await page.getByRole('dialog').evaluate(dialog => dialog.contains(document.activeElement))).toBe(true); }
        for (let n = 0; n < 3; n++) await page.getByRole('button', { name: 'Trang sau ›', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Trang sau ›', exact: true })).toBeDisabled();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('status').filter({ hasText: 'Trang 4 / 4' })).toBeVisible();
        await page.getByRole('button', { name: 'Đã hiểu · +15 Sen Ngọc', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Đã đọc và nhận thưởng', exact: true })).toBeDisabled();
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Mở tư liệu', exact: false })).toBeFocused();
    }
    if (p < collectionPages - 1) await page.getByRole('button', { name: 'Trang bộ sưu tập tiếp' }).click();
  }
  expect(visited.size).toBe(cultureCards.length);
  expect(new Set(cultureCards.map(c => c.garmentId).filter(Boolean))).toEqual(new Set(garmentCatalog.map(g => g.id)));
  await expect(page.locator('.museum-count')).toHaveText(`1/${cultureCards.length} tư liệu đã đọc`);
  await expect(page.locator('.hud strong')).toHaveAttribute('aria-label', `${before + 15} Sen Ngọc`);
  await page.reload(); await enterGame(page); await openMuseum(page);
  await expect(page.locator('.museum-count')).toHaveText(`1/${cultureCards.length} tư liệu đã đọc`);
  await page.getByRole('button', { name: 'Mở tư liệu', exact: false }).click();
  for (let n = 0; n < 3; n++) await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Đã đọc và nhận thưởng', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud strong')).toHaveAttribute('aria-label', `${before + 15} Sen Ngọc`);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 1672, height: 941 }, { width: 1900, height: 872 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 390, height: 667 }, { width: 844, height: 390 }]) {
  test(`gallery and reader fit at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(viewport); const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await start(page);
    const navigation = page.locator('.nep-header .main-nav');
    await expect(navigation).toBeVisible();
    await expect(page.locator('.screen-museum > .main-nav')).toHaveCount(0);
    await expect(navigation.getByRole('button')).toHaveCount(6);
    await expect(page.locator('.museum-main-art canvas')).toHaveAttribute('data-ready', 'true');
    await page.waitForFunction(() => [...document.querySelectorAll('.museum-room img')].every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0));
    const dock = (await page.locator('.museum-collection').boundingBox())!, stage = (await page.locator('.game-stage').boundingBox())!;
    const nav = (await navigation.boundingBox())!;
    expect(nav.y + nav.height).toBeLessThanOrEqual(stage.y);
    const exhibit = (await page.locator('.museum-exhibit').boundingBox())!, info = (await page.locator('.museum-info').boundingBox())!;
    expect(dock.x).toBe(stage.x); expect(dock.width).toBe(stage.width);
    expect(dock.y + dock.height).toBe(stage.y + stage.height);
    expect(exhibit.y + exhibit.height).toBeLessThan(dock.y);
    expect(info.y + info.height).toBeLessThan(dock.y);
    if (viewport.width > 640 && viewport.height > 500) {
      expect(exhibit.x + exhibit.width).toBeLessThan(info.x);
      expect(Math.abs((exhibit.x + exhibit.width / 2) / stage.width - .48)).toBeLessThan(.025);
      expect(info.width / stage.width).toBeCloseTo(.3, 1);
      expect(dock.height / stage.height).toBeGreaterThan(.32);
    }
    expect(await page.locator('.museum-background img').evaluate(img => getComputedStyle(img).objectFit)).toBe('cover');
    await page.screenshot({ path: `artifacts/museum-gallery-${viewport.width}x${viewport.height}.png` });
    await search(page).fill('không có tư liệu này');
    await expect(page.getByText('Chưa tìm thấy ký ức phù hợp')).toBeVisible();
    await search(page).fill('Lemur');
    await expect(cards(page)).toHaveCount(2);
    await page.getByLabel('Thời kỳ', { exact: true }).selectOption('1934');
    await expect(cards(page)).toHaveCount(2);
    await cards(page).first().click();
    await page.getByRole('button', { name: 'Mở tư liệu', exact: false }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: `artifacts/museum-reader-${viewport.width}x${viewport.height}.png` });
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    const sourceLink = page.getByRole('dialog').locator('.museum-sources a').first();
    await sourceLink.scrollIntoViewIfNeeded(); await expect(sourceLink).toBeVisible();
    await page.screenshot({ path: `artifacts/museum-sources-${viewport.width}x${viewport.height}.png` });
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth && document.documentElement.scrollHeight === innerHeight)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('locked collections conceal names and descriptions while totals span all pages', async ({ page }) => {
  await start(page); await page.getByRole('tab', { name: 'Nhân vật', exact: true }).click();
  await expect(page.locator('.museum-count')).toHaveText('0/14 nhân vật đã gặp');
  const characterPageSizes = [6, 6, 2];
  for (let p = 0; p < characterPageSizes.length; p++) {
    await expect(cards(page)).toHaveCount(characterPageSizes[p]);
    await expect(page.locator('.museum-card-label')).toHaveText(Array(characterPageSizes[p]).fill('???'));
    await expect(page.locator('.museum-open')).toBeDisabled();
    if (p < characterPageSizes.length - 1) await page.getByRole('button', { name: 'Trang bộ sưu tập tiếp' }).click();
  }
  await search(page).fill('Bà Mai'); await expect(cards(page)).toHaveCount(0);
  await page.getByRole('tab', { name: 'Kỷ vật', exact: true }).click();
  await expect(page.locator('.museum-count')).toHaveText('1/29 kỷ vật đã tìm thấy');
  let total = 0, locked = 0;
  for (let p = 0; p < 5; p++) {
    total += await cards(page).count(); locked += await page.locator('.museum-collection-card .is-locked').count();
    if (p < 4) await page.getByRole('button', { name: 'Trang bộ sưu tập tiếp' }).click();
  }
  expect(total).toBe(29); expect(locked).toBe(28);
  await search(page).fill('Kéo may'); await expect(cards(page)).toHaveCount(1);
  await cards(page).first().click(); await expect(page.locator('.museum-open')).toBeEnabled();
  await page.getByRole('button', { name: 'Xem chi tiết', exact: false }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Kéo may bằng đồng');
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Tư liệu', exact: true }).focus();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Nhân vật', exact: true })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Nhân vật', exact: true })).toHaveAttribute('aria-selected', 'true');
});

// Prologue by clicking (as chapter1.spec): the cat talks first, then the loft puzzles end with Bà Ngoại.
async function playPrologue(page: Page) {
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await expect(room(page)).toHaveAttribute('data-ready', 'true');
  await spot(page, 'hitbox-cat').click();
  await page.getByRole('button', { name: 'Khép lời kể' }).click();
  await exitArrow(page, 'stairs').click();
  await page.getByRole('button', { name: 'Bước lên gác xép' }).click();
  await expect(room(page)).toHaveAttribute('data-area', 'c0-s2-gac-xep-chiec-ruong');
  await spot(page, 'hitbox-chest-cloth').click();
  await page.getByRole('button', { name: 'Gỡ tấm vải phủ' }).click();
  await spot(page, 'hitbox-sewing-basket').click();
  await expect(page.locator('.inventory-strip')).toContainText('Kim gút bằng bạc');
  await spot(page, 'hitbox-mannequin-hand').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Kim gút bằng bạc', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await spot(page, 'hitbox-chest-lock').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chìa khóa đồng ba chấu', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng vật phẩm', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lời kể' }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Nếp ký ức đầu tiên');
  await page.getByRole('button', { name: 'Xem bản đồ chương', exact: true }).click();
  await page.getByRole('button', { name: '‹ Về sân nhà', exact: true }).click();
}

test('story discoveries reveal portraits and spent keepsakes in the gallery', async ({ page }) => {
  await page.goto('/'); await enterGame(page); await playPrologue(page); await openMuseum(page);
  await page.getByRole('tab', { name: 'Nhân vật', exact: true }).click();
  await expect(page.locator('.museum-count')).toHaveText('2/14 nhân vật đã gặp');
  for (const name of ['Mèo Nếp', 'Bà Ngoại']) {
    await search(page).fill(name); await expect(cards(page)).toHaveCount(1); await cards(page).first().click();
    await expect(page.locator('.museum-info')).toContainText(name);
    await expect(page.locator('.museum-open')).toBeEnabled();
  }
  await page.getByRole('tab', { name: 'Kỷ vật', exact: true }).click();
  await expect(page.locator('.museum-count')).toHaveText('4/29 kỷ vật đã tìm thấy');
  for (const name of ['Kim gút bằng bạc', 'Chìa khóa đồng ba chấu', 'Thước gỗ thợ may 1888']) {
    await search(page).fill(name); await expect(cards(page)).toHaveCount(1); await cards(page).first().click();
    await expect(page.locator('.museum-info')).toContainText(name); await expect(page.locator('.museum-open')).toBeEnabled();
  }
  await expect(page.locator('.museum-info')).toContainText('Kỷ vật truyền đời của Cụ Cầm');
  await page.screenshot({ path: 'artifacts/museum-keepsakes-unlocked.png' });
});
