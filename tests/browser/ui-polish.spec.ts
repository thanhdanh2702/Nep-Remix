import { test, expect, type Page } from '@playwright/test';

// Visual-system guards for the UI redesign: two font families only, readable sizes,
// touch-friendly targets, touch controls on coarse pointers, no map label collisions.
const FONTS = /^"?(VT323|Be Vietnam Pro)"?/;

async function enter(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.locator('.scene canvas').waitFor();
}

/** Visible elements that directly own text, with their computed font and box. */
async function textNodes(page: Page) {
  return page.evaluate(() => {
    const out: { text: string; family: string; size: number; tag: string }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const el = node.parentElement;
      if (!text || !el || el.closest('.screen-reader-only, [aria-hidden="true"], .dialogue-untyped, script, style')) continue;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      if (style.visibility === 'hidden' || style.display === 'none' || box.width === 0 || box.height === 0) continue;
      if (box.bottom < 0 || box.top > innerHeight || box.right < 0 || box.left > innerWidth) continue;
      out.push({ text: text.slice(0, 40), family: style.fontFamily, size: parseFloat(style.fontSize), tag: el.tagName });
    }
    return out;
  });
}

async function visitScreens(page: Page, check: (screen: string) => Promise<void>) {
  await enter(page);
  await check('hub');
  for (const name of ['Phòng phối đồ', 'Tủ đồ', 'Bảo tàng', 'Cốt truyện']) {
    await page.goto('/');
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await page.getByRole('button', { name, exact: true }).first().click();
    await page.waitForTimeout(name === 'Cốt truyện' ? 3500 : 800);
    await check(name);
  }
}

for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
  test(`only the two UI fonts and no text under 12px at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await visitScreens(page, async screen => {
      for (const node of await textNodes(page)) {
        expect(node.family, `${screen}: "${node.text}"`).toMatch(FONTS);
        expect(node.size, `${screen}: "${node.text}"`).toBeGreaterThanOrEqual(12);
      }
      await page.screenshot({ path: `artifacts/ui-polish/${viewport.width}-${screen}.png` });
    });
    expect(errors).toEqual([]);
  });
}

test.describe('touch landscape phone', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

  test('shows touch controls in the hub only, readable text and 44px targets in the room', async ({ page }) => {
    await enter(page);
    await expect(page.locator('.touch-controls')).toBeVisible();
    await page.screenshot({ path: 'artifacts/ui-polish/844-hub.png' });
    await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
    await page.locator('[data-chapter="prologue"] .journey-map-label').click();
    await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('.touch-controls')).toHaveCount(0);
    await page.screenshot({ path: 'artifacts/ui-polish/844-scene.png' });
    for (const node of await textNodes(page)) expect(node.size, node.text).toBeGreaterThanOrEqual(12);
    const small = await page.locator('button:visible').evaluateAll(buttons => buttons
      .map(button => ({ name: button.getAttribute('aria-label') || button.textContent?.trim(), box: button.getBoundingClientRect() }))
      .filter(({ box }) => box.width < 44 || box.height < 44)
      .map(({ name, box }) => `${name} ${Math.round(box.width)}×${Math.round(box.height)}`));
    expect(small).toEqual([]);
  });
});

async function openRoom(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await page.locator('[data-chapter="prologue"] .journey-map-label').click();
  await expect(page.locator('.room-stage canvas')).toHaveAttribute('data-ready', 'true');
}

test('room and dialogue keep the two UI fonts and no text under 12px at 1366×768', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await openRoom(page);
  await page.locator('.room-hotspots button[data-hotspot="hitbox-mirror"]').hover();
  await expect(page.locator('.room-tip')).toBeVisible();
  const check = async (screen: string) => {
    for (const node of await textNodes(page)) {
      expect(node.family, `${screen}: "${node.text}"`).toMatch(FONTS);
      expect(node.size, `${screen}: "${node.text}"`).toBeGreaterThanOrEqual(12);
    }
  };
  await check('room');
  await page.screenshot({ path: 'artifacts/ui-polish/1366-room.png' });
  await page.locator('.room-hotspots button[data-hotspot="hitbox-cat"]').click();
  await expect(page.getByRole('dialog', { name: 'Mèo Nếp' }).locator('.dialogue-text')).toContainText('Ngoao');
  await check('dialogue');
  await page.screenshot({ path: 'artifacts/ui-polish/1366-dialogue.png' });
  expect(errors).toEqual([]);
});

// Chrome that sits over the painted room (header buttons, back button, Soi, toolbar, inventory, nav) must stay a small
// share of the stage so the art is the main thing on screen.
for (const viewport of [{ width: 1366, height: 768 }, { width: 844, height: 390 }]) {
  test(`HUD covers under 15% of the room stage at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openRoom(page);
    await expect(page.locator('.room-soi')).toBeVisible();
    const share = await page.evaluate(() => {
      const stage = document.querySelector('.room-stage')!.getBoundingClientRect();
      const hit = (r: DOMRect) => r.left < stage.right && stage.left < r.right && r.top < stage.bottom && stage.top < r.bottom;
      const parts = [...document.querySelectorAll<HTMLElement>('.back-home, .room-soi, .main-nav, .site-header button, .site-header .hud, .site-header .hub-wallet, .journey-toolbar, .inventory-strip')]
        .filter(el => { const s = getComputedStyle(el), r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; })
        .map(el => ({ name: el.className || el.tagName, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => hit(rect));
      const area = (r: DOMRect) => r.width * r.height;
      return { ratio: parts.reduce((sum, { rect }) => sum + area(rect), 0) / area(stage), parts: parts.map(({ name, rect }) => `${name} ${Math.round(rect.width)}×${Math.round(rect.height)}`) };
    });
    console.log(`HUD share ${viewport.width}×${viewport.height}: ${share.ratio.toFixed(3)} [${share.parts.join(', ')}]`);
    expect(share.ratio).toBeLessThan(0.15);
  });
}

test('map labels never cover a character portrait', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await enter(page);
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await expect(page.locator('.journey-map-screen')).toHaveAttribute('data-revealing', 'false');
  const overlaps = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('.journey-map-label')].map(el => el.getBoundingClientRect());
    const people = [...document.querySelectorAll('.journey-map-character img, .journey-map-character canvas')].map(el => el.getBoundingClientRect());
    const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return labels.flatMap((label, i) => people.flatMap((person, j) => hit(label, person) ? [`label ${i} × portrait ${j}`] : []));
  });
  expect(overlaps).toEqual([]);
});

test('toasts stay under modals and reduced motion removes movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await page.getByRole('button', { name: 'Cài đặt' }).first().click();
  const modal = page.locator('.modal-backdrop');
  await expect(modal).toBeVisible();
  const z = await page.evaluate(() => {
    const value = (selector: string) => Number(getComputedStyle(document.querySelector(selector)!).zIndex);
    const probe = document.createElement('div'); probe.className = 'toast'; document.body.append(probe);
    const toast = Number(getComputedStyle(probe).zIndex); probe.remove();
    return { toast, modal: value('.modal-backdrop') };
  });
  expect(z.toast).toBeLessThan(z.modal);
  const running = await modal.evaluate(el => [el, ...el.querySelectorAll('*')].flatMap(node => node.getAnimations())
    .filter(animation => Number(animation.effect?.getComputedTiming().duration) > 1).length);
  expect(running).toBe(0);
});
