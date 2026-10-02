import { test, expect } from '@playwright/test';

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
