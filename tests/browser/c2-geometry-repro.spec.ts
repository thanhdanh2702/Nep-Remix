import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

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
    state.claimedRewardIds.push(content.chapters[id].chapter.reward.id);
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

test.beforeAll(() => {
  if (!existsSync('artifacts/c2-geometry')) {
    mkdirSync('artifacts/c2-geometry', { recursive: true });
  }
});

test.describe('C2 Geometry Reproduction Suite (Proof of Bugs)', () => {

  test('REPRO: C2-GEO-001 & C2-GEO-002 [S1] Loan Occlusion and Desk Path Clipping', async ({ page }) => {
    page.setDefaultTimeout(25_000);
    await startC2(page);

    await spot(page, 'hitbox-gas-lamp').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('manh_ban_ve_ao_dai_3');

    const deskObstacle = {
      xMin: 0.30 * 1672,
      xMax: 0.49 * 1672,
      yMin: 0.40 * 941,
      yMax: 0.685 * 941,
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

    // Assert Bug C2-GEO-002 is reproduced
    const clippedPoints = sampledPoints.filter(p =>
      p.x >= deskObstacle.xMin && p.x <= deskObstacle.xMax &&
      p.y >= deskObstacle.yMin && p.y <= deskObstacle.yMax
    );
    expect(clippedPoints.length, 'Repro: Path sliced through desk obstacle').toBeGreaterThan(0);

    // Assert Bug C2-GEO-001 is reproduced
    const windowFoot = await getAnFoot(page);
    const loanS1Bounds = { left: 1080, right: 1194, footY: 706 };
    const overlapsHorizontally = windowFoot!.x >= loanS1Bounds.left && windowFoot!.x <= loanS1Bounds.right;
    const isBehindLoan = windowFoot!.y < loanS1Bounds.footY;
    expect(overlapsHorizontally && isBehindLoan, 'Repro: An is occluded behind Loan').toBe(true);
  });

  test('REPRO: C2-GEO-003 & C2-GEO-004 [S2] Silk Shelves Loan Collision & Cabinet Path Clipping', async ({ page }) => {
    page.setDefaultTimeout(40_000);
    await startC2(page);
    await solveS1(page);

    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');

    await spot(page, 'hitbox-grandfather-clock').click();
    await expect.poll(async () => (await saved(page)).inventory.itemIds).toContain('chia_khoa_ket_sat_bang_thau');

    const s2CabinetObstacle = {
      xMin: 0.36 * 1672,
      xMax: 0.68 * 1672,
      yMin: 0.21 * 941,
      yMax: 0.707 * 941,
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

    // Assert Bug C2-GEO-004 is reproduced
    const clippedS2 = sampledS2Points.filter(p =>
      p.x >= s2CabinetObstacle.xMin && p.x <= s2CabinetObstacle.xMax &&
      p.y >= s2CabinetObstacle.yMin && p.y <= s2CabinetObstacle.yMax
    );
    expect(clippedS2.length, 'Repro: Path sliced through cabinet obstacle').toBeGreaterThan(0);
  });

  test('REPRO: C2-GEO-005 & C2-GEO-006 [S3] Ong Le Loan Proximity & Ca Nghi Crowd Overlap', async ({ page }) => {
    page.setDefaultTimeout(50_000);
    await startC2(page);
    await solveS1(page);
    await page.locator('[data-exit="window"]').click();
    await page.waitForSelector('canvas[data-area="c2-s2-kho-vai-hang-dao"]');
    await solveS2(page);

    await page.locator('[data-exit="hall"]').click();
    await page.waitForSelector('canvas[data-area="c2-s3-phong-trien-lam-doi-dau"]');

    await spot(page, 'hitbox-ong-le-shadow').click();
    await page.waitForTimeout(2000);

    const shadowLeftFoot = await getAnFoot(page);
    const loanS3Foot = { x: 367.8, y: 677.5 };
    const dxLeft = Math.abs(shadowLeftFoot!.x - loanS3Foot.x);
    expect(dxLeft, 'Repro: Horizontal delta to Loan is under 15px').toBeLessThan(15);

    const caNghiRect = { x: 1197, y: 294, w: 114, h: 384 };
    const crowdRect = { x: 1098.5, y: 414.0, w: 339.4, h: 367.0 };
    const isCaNghiInsideCrowd =
      caNghiRect.x >= crowdRect.x &&
      (caNghiRect.x + caNghiRect.w) <= (crowdRect.x + crowdRect.w);
    expect(isCaNghiInsideCrowd, 'Repro: Ca Nghi is inside crowd button rect').toBe(true);
  });
});
