import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1672, height: 941 }, { width: 1366, height: 768 }, { width: 390, height: 667 }, { width: 844, height: 390 }]) {
  test(`shared room navigation stays above the scene at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.getByRole('button', { name: 'Phòng phối đồ', exact: true }).first().click();
    const nav = page.getByRole('navigation', { name: 'Các khu vực', exact: true });
    for (const label of ['Phòng phối đồ', 'Tủ đồ', 'Bảo tàng', 'Cốt truyện']) {
      await nav.getByRole('button', { name: label, exact: true }).click();
      await expect(nav.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(nav.getByRole('button')).toHaveCount(6);
      const navigation = (await nav.boundingBox())!;
      const header = (await page.locator('.nep-header').boundingBox())!;
      const scene = (await page.locator('.game-stage').boundingBox())!;
      expect(navigation.y).toBeGreaterThanOrEqual(header.y);
      expect(navigation.y + navigation.height).toBeLessThanOrEqual(scene.y);
      expect(scene.y + scene.height).toBe(viewport.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      for (const button of await nav.getByRole('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      if (label === 'Bảo tàng') {
        await expect(page.locator('.museum-main-art canvas')).toHaveAttribute('data-ready', 'true');
        await page.screenshot({ path: `artifacts/room-navigation-${viewport.width}x${viewport.height}.png` });
      }
    }
    await nav.getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Diện mạo & Cài đặt' })).toBeVisible();
    await expect(nav.getByRole('button', { name: '‹ Về sân nhà', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(nav.getByRole('button', { name: 'Cài đặt', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
    await page.getByRole('button', { name: 'Cách chơi', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Ghé tiệm, chơi thế nào?' })).toBeVisible();
    await page.keyboard.press('Escape');
    await nav.getByRole('button', { name: '‹ Về sân nhà', exact: true }).click();
    await expect(page.locator('.app-shell')).toHaveClass('app-shell screen-hub');
    await expect(page.locator('.nep-header .main-nav')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
