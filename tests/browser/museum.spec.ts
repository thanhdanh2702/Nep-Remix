import { test, expect, type Page } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`Museum books open and turn pages at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.getByRole('button', { name: 'Bảo tàng', exact: true }).first().click();
    await expect(page.locator('.screen-museum > .site-header')).toBeHidden();
    await expect(page.locator('.screen-museum > .main-nav')).toBeHidden();
    await expect(page.locator('.screen-museum > .save-state')).toBeHidden();
    const books = page.getByRole('group', { name: 'Kệ 12 cuốn sách văn hóa' }).getByRole('button');
    await expect(books).toHaveCount(12);
    await page.locator('.museum-background img').evaluate((image: HTMLImageElement) => image.decode());
    await page.screenshot({ path: `artifacts/museum-room-${viewport.width}.png` });
    for (let i = 0; i < 12; i++) {
      await books.nth(i).click();
      await expect(page.getByRole('dialog', { name: `Sổ tay ${String(i + 1).padStart(2, '0')}` })).toBeVisible();
      const pageCount = i === 11 ? 4 : 6;
      await expect(page.getByRole('status').filter({ hasText: `Trang 1 / ${pageCount}` })).toBeVisible();
      await expect(page.getByRole('button', { name: '‹ Trang trước', exact: true })).toBeDisabled();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('status').filter({ hasText: `Trang 2 / ${pageCount}` })).toBeVisible();
      await page.keyboard.press('ArrowLeft');
      await expect(page.getByRole('status').filter({ hasText: `Trang 1 / ${pageCount}` })).toBeVisible();
      if (i === 0) {
        await page.screenshot({ path: `artifacts/museum-book-${viewport.width}.png` });
        for (let n = 0; n < 5; n++) await page.getByRole('button', { name: 'Trang sau ›', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Trang sau ›', exact: true })).toBeDisabled();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('status').filter({ hasText: 'Trang 6 / 6' })).toBeVisible();
        await page.getByRole('button', { name: '‹ Trang trước', exact: true }).click();
        await expect(page.getByRole('status').filter({ hasText: 'Trang 5 / 6' })).toBeVisible();
        // Keyboard focus stays inside the reader and the surrounding game is blocked.
        await expect(page.getByRole('button', { name: '‹ Về sân nhà', exact: true })).toBeDisabled();
        for (let n = 0; n < 8; n++) {
          await page.keyboard.press('Tab');
          expect(await page.getByRole('dialog').evaluate(dialog => dialog.contains(document.activeElement))).toBe(true);
        }
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(books.nth(i)).toBeFocused();
    }
    await page.locator('.museum-catalog summary').click();
    await page.getByLabel('Tìm tư liệu').fill('không có sách này');
    await expect(page.getByText('Chưa tìm thấy tư liệu phù hợp. Hãy thử từ khóa khác.')).toBeVisible();
    await page.getByLabel('Tìm tư liệu').fill('Lemur');
    await page.locator('.museum-catalog-results button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

// Codex ("Nhân vật" / "Kỷ vật"): silhouettes until the story reveals them.
const room = (page: Page) => page.locator('.room-stage canvas');
const spot = (page: Page, id: string) => page.locator(`.room-hotspots button[data-hotspot="${id}"]`);
const exitArrow = (page: Page, key: string) => page.locator(`.room-exit[data-exit="${key}"]`);
const enterGame = async (page: Page) => page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
const openMuseum = async (page: Page) => page.getByRole('button', { name: 'Bảo tàng', exact: true }).first().click();
const openCodex = async (page: Page, name: 'Nhân vật' | 'Kỷ vật') => {
  await page.getByRole('button', { name: `Mở sổ tay ${name}`, exact: true }).click();
  await expect(page.getByRole('dialog', { name, exact: true })).toBeVisible();
};

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
const gridColumns = (page: Page) => page.locator('.codex-grid').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length);

test.describe('Museum codex', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('a fresh save shows only silhouettes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await enterGame(page);
    await openMuseum(page);
    await openCodex(page, 'Nhân vật');
    const cells = page.locator('.codex-cell');
    await expect(cells).toHaveCount(12);
    await expect(page.getByRole('button', { name: 'Nhân vật chưa gặp' })).toHaveCount(12);
    await expect(page.locator('.codex-count')).toHaveText('0/12 đã gặp');
    await expect(page.locator('.codex-label', { hasText: '???' })).toHaveCount(12);
    await cells.first().click();
    await expect(page.locator('.codex-detail')).toContainText('Chưa gặp');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mở sổ tay Nhân vật' })).toBeFocused();
    await openCodex(page, 'Kỷ vật');
    await expect(page.locator('.codex-cell')).toHaveCount(29);
    // The family scissors (Kéo may bằng đồng) start in the bag; every other keepsake is a silhouette.
    await expect(page.getByRole('button', { name: 'Kỷ vật chưa tìm thấy' })).toHaveCount(28);
    await expect(page.getByRole('button', { name: 'Kéo may bằng đồng · đã tìm thấy', exact: true })).toBeVisible();
    await expect(page.locator('.codex-count')).toHaveText('1/29 đã tìm thấy');
    await expect(page.locator('.codex-icon.is-locked')).toHaveCount(28);
    expect(errors).toEqual([]);
  });

  test('after the prologue its speakers and items are revealed', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await enterGame(page);
    await playPrologue(page);
    await openMuseum(page);
    await openCodex(page, 'Nhân vật');
    await expect(page.getByRole('button', { name: /^Mèo Nếp · / })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Bà Ngoại · / })).toBeVisible();
    // Ông Lệ whispers from behind the flipped fabric (side not playable yet): still a silhouette.
    await expect(page.getByRole('button', { name: 'Nhân vật chưa gặp' })).toHaveCount(10);
    await expect(page.locator('.codex-count')).toHaveText('2/12 đã gặp');
    await page.getByRole('button', { name: /^Mèo Nếp · / }).click();
    await expect(page.locator('.codex-detail')).toContainText('Mèo Nếp');
    await page.keyboard.press('Escape');
    await openCodex(page, 'Kỷ vật');
    // Kéo (start) and kim gút are in the bag with the thước reward; the key was spent opening the chest, so it comes from solved puzzles.
    for (const name of ['Kim gút bằng bạc', 'Chìa khóa đồng ba chấu', 'Thước gỗ thợ may 1888']) {
      await expect(page.getByRole('button', { name: `${name} · đã tìm thấy`, exact: true })).toBeVisible();
    }
    await expect(page.locator('.codex-count')).toHaveText('4/29 đã tìm thấy');
    await expect(page.getByRole('button', { name: 'Kỷ vật chưa tìm thấy' })).toHaveCount(25);
    await page.getByRole('button', { name: 'Thước gỗ thợ may 1888 · đã tìm thấy' }).click();
    await expect(page.locator('.codex-detail')).toContainText('Kỷ vật truyền đời của Cụ Cầm');
    const icon = page.locator('.codex-icon:not(.is-locked) img').first();
    expect(await icon.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.getBoundingClientRect().width])).toEqual([48, 96]);
    expect(errors).toEqual([]);
  });

  for (const { width, height, columns } of [{ width: 390, height: 844, columns: 3 }, { width: 844, height: 390, columns: 3 }, { width: 1366, height: 900, columns: 6 }]) {
    test(`codex grid has ${columns} columns and fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await enterGame(page);
      await openMuseum(page);
      for (const name of ['Nhân vật', 'Kỷ vật'] as const) {
        await openCodex(page, name);
        expect(await gridColumns(page)).toBe(columns);
        const sizes = await page.locator('.codex-cell').evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect()).map(r => ({ w: r.width, h: r.height })));
        for (const { w, h } of sizes) {
          expect(w).toBeGreaterThanOrEqual(name === 'Kỷ vật' ? 96 : 80);
          expect(h).toBeGreaterThanOrEqual(44);
        }
        await page.screenshot({ path: `artifacts/museum-codex-${name === 'Nhân vật' ? 'characters' : 'items'}-${width}.png` });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.keyboard.press('Escape');
      }
    });
  }
});
