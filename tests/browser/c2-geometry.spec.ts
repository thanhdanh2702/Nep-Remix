import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const items: { id: string; name: string }[] = JSON.parse(readFileSync('src/content/items.json', 'utf8'));
const content = { itemsById: new Map(items.map(item => [item.id, item])) };
const key = 'tiem-may-nep-save-v1';

const saved = (page: Page) => page.evaluate(saveKey => {
  const tree = JSON.parse(localStorage.getItem(saveKey)!).tree;
  return tree.nodes[tree.headId].snapshot;
}, key);

const spot = (page: Page, id: string) => page.locator(`[data-hotspot="${id}"]`);

function fixture() {
  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
  import { loadContent } from './src/content/index.ts';
  import { createInitialState, createInitialTree, toJSON } from './src/core/index.ts';
  const content = loadContent();
  const state = createInitialState(content);
  for (const id of ['prologue', 'c1']) {
    Object.assign(state.journey[id], {
      status: 'completed', claimed: true,
      solvedPuzzleIds: content.chapters[id].puzzles.map(p => p.id),
      completedDialogueIds: content.chapters[id].dialogues.map(d => d.id),
      activeDialogue: null, dialogueQueue: [],
    });
    state.claimedRewardIds.push(content.chapters[id].reward?.id ?? content.chapters[id].chapter?.reward?.id);
  }
  state.journey.c2.status = 'unlocked';
  state.wallet.senNgoc = 250;
  process.stdout.write(toJSON(createInitialTree(state)));
  `], { encoding: 'utf8' });
}

async function getAnFoot(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return null;
    const worldW = parseFloat(canvas.dataset.worldWidth || '1672');
    const worldH = parseFloat(canvas.dataset.worldHeight || '941');
    const x = parseFloat(canvas.dataset.anX || '0');
    const y = parseFloat(canvas.dataset.anY || '0');
    const h = parseFloat(canvas.dataset.anH || '0');
    return {
      x, y, h, worldW, worldH,
      normX: x / worldW,
      normY: y / worldH,
    };
  });
}

async function startC2(page: Page, width = 1440, height = 900, motion: 'no-preference' | 'reduce' = 'no-preference') {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: motion });
  await page.addInitScript(({ saveKey, raw }) => {
    if (!sessionStorage.getItem('c2-geo-init')) {
      localStorage.setItem(saveKey, raw);
      localStorage.setItem('tiem-may-nep-visited', 'true');
      sessionStorage.setItem('c2-geo-init', 'true');
    }
  }, { saveKey: key, raw: fixture() });

  await page.goto('/');
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Cốt truyện', exact: true }).first().click();
  await page.locator('[data-chapter="c2"] .journey-map-label').click();
  const closeBtn = page.getByRole('button', { name: 'Khép lời kể' });
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click();
  }
  await page.waitForSelector('.room-scene');
}

async function solveS1(page: Page) {
  const pickups = ['hitbox-drawing-desk', 'hitbox-fabric-basket', 'hitbox-gas-lamp', 'hitbox-french-window'];
  for (let i = 0; i < pickups.length; i++) {
    await spot(page, pickups[i]).click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain(`manh_ban_ve_ao_dai_${i + 1}`);
  }
  await spot(page, 'hitbox-drawing-easel').click();
  for (let i = 1; i <= 4; i++) await page.getByRole('button', { name: `Thêm Mảnh bản vẽ ${i}`, exact: true }).click();
  await page.getByRole('button', { name: 'Ghép bản vẽ', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lời kể' }).click();
}

async function solveS2(page: Page) {
  await spot(page, 'hitbox-grandfather-clock').click();
  await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('chia_khoa_ket_sat_bang_thau');
  await spot(page, 'hitbox-iron-safe').click();
  await page.getByRole('dialog').getByRole('button', { name: content.itemsById.get('chia_khoa_ket_sat_bang_thau')!.name, exact: true }).click();
  await page.getByRole('button', { name: 'Mở hòm sắt', exact: true }).click();
  await page.getByRole('button', { name: 'Khép lời kể' }).click();
  await page.reload();
  await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
  await page.getByRole('button', { name: 'Khép lời kể' }).click();
}

test.describe('C2 Geometry & Movement Standard Acceptance Suite (RED until fixed)', () => {

  // 1. Normal motion route test: detects furniture intersection during walker interpolation
  test('[REGRESSION RED] S1: Walker route must not clip through drawing desk obstacle in normal motion (C2-GEO-002)', async ({ page }) => {
    page.setDefaultTimeout(25_000);
    await startC2(page, 1440, 900, 'no-preference');

    await spot(page, 'hitbox-gas-lamp').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('manh_ban_ve_ao_dai_3');

    const deskObstacle = {
      xMin: 0.30 * 1672, // 501.6
      xMax: 0.49 * 1672, // 819.3
      yMin: 0.40 * 941,  // 376.4
      yMax: 0.685 * 941, // 644.6
    };
    const sampledPoints: { x: number; y: number }[] = [];
    const interval = setInterval(async () => {
      try {
        const p = await getAnFoot(page);
        if (p) sampledPoints.push({ x: p.x, y: p.y });
      } catch {}
    }, 25);

    await spot(page, 'hitbox-french-window').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('manh_ban_ve_ao_dai_4');
    clearInterval(interval);

    const clippedPoints = sampledPoints.filter(p =>
      p.x >= deskObstacle.xMin && p.x <= deskObstacle.xMax &&
      p.y >= deskObstacle.yMin && p.y <= deskObstacle.yMax
    );

    // REGRESSION ASSERTION: Zero points inside obstacle during active walk
    expect(clippedPoints.length, 'Regression failure C2-GEO-002: Route must navigate around drawing desk').toBe(0);
  });

  // 2. Evaluates destination standing point in both normal and reduced motion
  test('[REGRESSION RED] S1: An arrived foot at french window must not be occluded behind Loan (C2-GEO-001)', async ({ page }) => {
    page.setDefaultTimeout(25_000);
    await startC2(page, 1440, 900, 'reduce');

    await spot(page, 'hitbox-french-window').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('manh_ban_ve_ao_dai_4');

    const windowFoot = await getAnFoot(page);
    // Loan S1 bounds: [1080, 1194], foot y = 706
    const loanS1Bounds = { left: 1080, right: 1194, footY: 706 };
    const overlapsHorizontally = windowFoot!.x >= loanS1Bounds.left && windowFoot!.x <= loanS1Bounds.right;
    const isBehindLoan = windowFoot!.y < loanS1Bounds.footY;

    // REGRESSION ASSERTION: An must not be occluded behind Loan silhouette
    expect(overlapsHorizontally && isBehindLoan, 'Regression failure C2-GEO-001: An must not stand directly behind Loan silhouette').toBe(false);
  });

  // 3. Normal motion route test: detects cabinet intersection during walker interpolation
  test('[REGRESSION RED] S2: Walker route must not clip through fabric cabinet in normal motion (C2-GEO-004)', async ({ page }) => {
    page.setDefaultTimeout(40_000);
    await startC2(page, 1440, 900, 'no-preference');
    await solveS1(page);

    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');

    await spot(page, 'hitbox-grandfather-clock').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('chia_khoa_ket_sat_bang_thau');

    const s2CabinetObstacle = {
      xMin: 0.36 * 1672, // 601.9
      xMax: 0.68 * 1672, // 1137.0
      yMin: 0.21 * 941,  // 197.6
      yMax: 0.707 * 941, // 665.3
    };
    const sampledS2Points: { x: number; y: number }[] = [];
    const interval = setInterval(async () => {
      try {
        const p = await getAnFoot(page);
        if (p) sampledS2Points.push({ x: p.x, y: p.y });
      } catch {}
    }, 25);

    await spot(page, 'hitbox-iron-safe').click();
    await page.waitForTimeout(2000);
    clearInterval(interval);

    const clippedS2 = sampledS2Points.filter(p =>
      p.x >= s2CabinetObstacle.xMin && p.x <= s2CabinetObstacle.xMax &&
      p.y >= s2CabinetObstacle.yMin && p.y <= s2CabinetObstacle.yMax
    );

    // REGRESSION ASSERTION: Zero points inside cabinet obstacle
    expect(clippedS2.length, 'Regression failure C2-GEO-004: Route must not cut through S2 cabinet obstacle').toBe(0);
  });

  // 4. Evaluates destination standing point: checks visual body overlap
  test('[REGRESSION RED] S2: An arrived foot at silk shelves must maintain clearance from Loan (C2-GEO-003)', async ({ page }) => {
    page.setDefaultTimeout(40_000);
    await startC2(page, 1440, 900, 'reduce');
    await solveS1(page);

    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');

    // Walk to silk shelves from left
    await spot(page, 'hitbox-silk-shelves').click();
    await page.waitForTimeout(1000);

    const shelvesFoot = await getAnFoot(page);
    // Loan in S2: foot (601.9, 658.7), horizontal sprite bounds [545, 659]
    const loanS2Bounds = { left: 545, right: 659, footX: 601.9, footY: 658.7 };
    const insideLoanWidth = shelvesFoot!.x >= loanS2Bounds.left && shelvesFoot!.x <= loanS2Bounds.right;

    // REGRESSION ASSERTION: An must not stand inside Loan horizontal body width [545, 659]
    expect(insideLoanWidth, 'Regression failure C2-GEO-003: An must not stand inside Loan horizontal bounds [545, 659]').toBe(false);
  });

  // 5. Evaluates destination standing point: checks visible box overlap & occlusion
  test('[REGRESSION RED] S3: An arrived foot at Ong Le shadow must not overlap visible bounds with Loan (C2-GEO-005)', async ({ page }) => {
    page.setDefaultTimeout(50_000);
    await startC2(page, 1440, 900, 'reduce');
    await solveS1(page);
    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');
    await solveS2(page);

    await page.locator('[data-exit="hall"]').click();
    await page.waitForSelector('canvas[data-area="c2-s3-phong-trien-lam-doi-dau"]');

    await spot(page, 'hitbox-ong-le-shadow').click();
    await page.waitForTimeout(1000);

    const shadowLeftFoot = await getAnFoot(page);
    const loanS3 = { footX: 367.8, footY: 677.5, box: { x: 310.8, y: 293.5, w: 114, h: 384 } };

    // An estimated visible box at arrived foot
    const anBox = {
      x: shadowLeftFoot!.x - 93,
      y: shadowLeftFoot!.y - shadowLeftFoot!.h,
      w: 186,
      h: shadowLeftFoot!.h,
    };

    // Bounding box overlap calculation
    const xOverlap = Math.max(0, Math.min(loanS3.box.x + loanS3.box.w, anBox.x + anBox.w) - Math.max(loanS3.box.x, anBox.x));
    const yOverlap = Math.max(0, Math.min(loanS3.box.y + loanS3.box.h, anBox.y + anBox.h) - Math.max(loanS3.box.y, anBox.y));
    const hasBoxOverlap = xOverlap > 0 && yOverlap > 0;

    // REGRESSION ASSERTION: Visible bounding boxes of An and Loan must not overlap
    expect(hasBoxOverlap, 'Regression failure C2-GEO-005: Visible bounding boxes of An and Loan must not overlap').toBe(false);
  });

  // 6. Navigation test: Exit back S2 -> S1 and S3 -> S2
  test('[PASS / GREEN] S2 & S3: Navigation through Exit back returns to previous room on valid floor', async ({ page }) => {
    page.setDefaultTimeout(50_000);
    await startC2(page);
    await solveS1(page);

    // 1. Enter S2 from S1
    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');

    // In S2, click Exit back to return to S1
    await page.locator('[data-exit="back"]').click();
    await page.waitForSelector('canvas[data-area="c2-s1-gac-lung-ve-tranh"]');

    // Verify An is back in S1 on valid floor: floorTop=0.58, floorBottom=0.92
    const returnS1Foot = await getAnFoot(page);
    expect(returnS1Foot).not.toBeNull();
    expect(returnS1Foot!.normY, 'An foot in S1 after return must be on floor strip').toBeGreaterThanOrEqual(0.57);
    expect(returnS1Foot!.normY, 'An foot in S1 after return must be on floor strip').toBeLessThanOrEqual(0.93);

    // 2. Go back to S2, solve S2, enter S3
    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');
    await solveS2(page);
    await page.locator('[data-exit="hall"]').click();
    await page.waitForSelector('canvas[data-area="c2-s3-phong-trien-lam-doi-dau"]');

    // In S3, click Exit back to return to S2
    await page.locator('[data-exit="back"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');

    // Verify An is back in S2 on valid floor
    const returnS2Foot = await getAnFoot(page);
    expect(returnS2Foot).not.toBeNull();
    expect(returnS2Foot!.normY, 'An foot in S2 after return must be on floor strip').toBeGreaterThanOrEqual(0.57);
    expect(returnS2Foot!.normY, 'An foot in S2 after return must be on floor strip').toBeLessThanOrEqual(0.93);
  });

  // 7. Multi-viewport touch targets
  test('[PASS / GREEN] Multi-viewport Touch Targets >= 43.5px across all 5 viewports (C2-GEO-007)', async ({ page }) => {
    page.setDefaultTimeout(60_000);
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 768, height: 1024 }
    ];

    for (const vp of viewports) {
      await startC2(page, vp.width, vp.height, 'reduce');
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.room-hotspots button')).map(b => {
          const r = b.getBoundingClientRect();
          return {
            id: b.getAttribute('data-hotspot') || b.getAttribute('data-exit') || 'unknown',
            w: r.width,
            h: r.height,
          };
        });
      });

      for (const b of buttons) {
        expect(b.w, `Target ${b.id} width at ${vp.width}x${vp.height}`).toBeGreaterThanOrEqual(43.5);
        expect(b.h, `Target ${b.id} height at ${vp.width}x${vp.height}`).toBeGreaterThanOrEqual(43.5);
      }
    }
  });

  // 8. Mid-walk retargeting dynamics reaches destination
  test('[PASS / GREEN] Mid-walk retargeting dynamics reaches destination (C2-GEO-008 observation)', async ({ page }) => {
    page.setDefaultTimeout(15_000);
    await startC2(page);

    await spot(page, 'hitbox-french-window').click();
    await page.waitForTimeout(200);

    // Retarget to gas lamp
    await spot(page, 'hitbox-gas-lamp').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('manh_ban_ve_ao_dai_3');

    const finalFoot = await getAnFoot(page);
    expect(finalFoot!.x).toBeCloseTo(275.9, 1);
  });
});
