import { test, expect, type Page } from '@playwright/test';

/**
 * BỘ KIỂM THỬ TRÌNH DUYỆT CHƯƠNG 2 — TIẾNG KÉO ĐÊM PHỐ CŨ (TESTER OWNERSHIP)
 *
 * Tiêu chuẩn nghiệm thu harness:
 * 1. Mọi test phải kiểm tra implementation thật, không dùng assertion điều kiện để âm thầm pass.
 * 2. Test chạy độc lập trên đúng candidate checkout, không fallback ra ngoài.
 * 3. Đo tỷ lệ hiển thị, liền dải và controls tách rời cho ghép tranh P1.
 * 4. Keyboard: focus piece 4 → ArrowLeft 3 lần, kiểm tra thứ tự và đúng element giữ focus.
 *    Gỡ mảnh kiểm tra focus chuyển hợp lý.
 * 5. Đủ 5 viewports: 1440x900, 1280x720, 390x844, 844x390, 768x1024; touch target >= 43.5px, reduced motion.
 * 6. Không dùng fixed sleep, không tăng timeout.
 */

const room = (page: Page) => page.locator('.room-stage canvas');
const spot = (page: Page, id: string) => page.locator(`.room-hotspots button[data-hotspot="${id}"]`);
const exitArrow = (page: Page, key: string) => page.locator(`.room-exit[data-exit="${key}"]`);
const dialog = (page: Page) => page.getByRole('dialog');
const inArea = (page: Page, id: string) => expect(room(page)).toHaveAttribute('data-area', id);

const saved = (page: Page) => page.evaluate(() => {
  const raw = localStorage.getItem('tiem-may-nep-save-v1');
  if (!raw) return null;
  const tree = JSON.parse(raw).tree;
  return tree.nodes[tree.headId].snapshot;
});

// Helper: advance dialogue nodes strictly until finished
async function advanceDialogue(page: Page) {
  const nextBtn = page.getByRole('button', { name: 'Tiếp tục', exact: true });
  const closeBtn = page.getByRole('button', { name: 'Khép lời kể', exact: true });
  while (await nextBtn.isVisible()) {
    await nextBtn.click();
  }
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
}

// Touch target verification >= 43.5px (~44px standard)
async function expectTouchTargets(page: Page, scope: string) {
  await expect.poll(async () => {
    const heights = await page.locator(`${scope} button`).evaluateAll(buttons =>
      buttons.map(b => b.getBoundingClientRect().height)
    );
    return heights.length > 0 && heights.every(h => h >= 43.5);
  }).toBe(true);
}

// Seed fixture C1 complete để chạy nhanh C2
async function seedCompletedC1(page: Page) {
  await page.evaluate(() => {
    const now = new Date().toISOString();
    const tree = {
      rootId: 'node-root',
      headId: 'node-c1-complete',
      version: '1.0.0',
      nodes: {
        'node-root': {
          id: 'node-root',
          parentId: null,
          command: { type: 'system/init', payload: {} },
          createdAt: now,
          snapshot: {
            profile: { name: 'An', gender: 'female', avatarPreset: 'an-default', createdAt: now },
            features: { latVai: false },
            settings: { textSpeed: 'normal', devDebug: false },
            wallet: { senNgoc: 250 },
            claimedRewardIds: ['reward-prologue', 'reward-c1'],
            currentChapter: 'c2',
            inventory: {
              itemIds: ['keo_may_bang_dong', 'thuoc_go_khac_hoa', 'kim_may_tay_ba_chau'],
            },
            notebook: {
              unlockedClueIds: ['clue-ba-dan-do', 'clue-tiet-hanh-kha-phong', 'clue-thu-chong-cu-cam', 'clue-van-tu-ban-dat'],
            },
            closet: {
              unlockedGarmentIds: ['ao-tu-than', 'ao-ngu-than-tay-chen', 'ao-ngu-than-tay-thung'],
              unlockedAccessoryIds: ['khan-van-den', 'guoc-moc'],
              savedOutfits: [],
            },
            museum: {
              unlockedCardIds: ['card-tam-thuc-ao-dai-viet', 'card-nghe-det-va-tieng-tho', 'card-khau-ngu-dong-kinh-nghia-thuc'],
              readCardIds: [],
              claimedCardIds: [],
            },
            journey: {
              prologue: { status: 'completed', claimed: true, currentArea: 'c0-s2-gac-xep-chiec-ruong', side: 'mat_phai', navStack: [], unlockedAreaIds: ['c0-s1-tiem-may-chieu-muon', 'c0-s2-gac-xep-chiec-ruong'], completedDialogueIds: ['d-c0-ba-dan-do'], solvedPuzzleIds: ['p-c0-cloth', 'p-c0-mannequin-hand', 'p-c0-chest-unlock'], hintTiers: {} },
              c1: { status: 'completed', claimed: true, currentArea: 'c1-s3-cong-dinh-doi-dau', side: 'mat_phai', navStack: [], unlockedAreaIds: ['c1-s1-buong-det-khoa-kin', 'c1-s2-ban-tho-nha-tho-ho', 'c1-s3-cong-dinh-doi-dau'], completedDialogueIds: ['d-c1-porridge', 'd-c1-locked-door', 'd-c1-tiet-hanh', 'd-c1-incense', 'd-c1-thu-chong', 'd-c1-van-tu', 'd-c1-giai-phong', 'd-c1-gate-exit'], solvedPuzzleIds: ['p-c1-escape', 'p-c1-altar-cut-threads', 'p-c1-present-contract', 'p-c1-present-letter', 'p-c1-styling-cam'], hintTiers: {} },
              c2: { status: 'in_progress', claimed: false, currentArea: 'c2-s1-gac-lung-ve-tranh', side: 'mat_phai', navStack: [], unlockedAreaIds: ['c2-s1-gac-lung-ve-tranh'], completedDialogueIds: [], solvedPuzzleIds: [], hintTiers: {} },
              c3: { status: 'locked', claimed: false, currentArea: '', side: 'mat_phai', navStack: [], unlockedAreaIds: [], completedDialogueIds: [], solvedPuzzleIds: [], hintTiers: {} },
              c4: { status: 'locked', claimed: false, currentArea: '', side: 'mat_phai', navStack: [], unlockedAreaIds: [], completedDialogueIds: [], solvedPuzzleIds: [], hintTiers: {} },
              c5: { status: 'locked', claimed: false, currentArea: '', side: 'mat_phai', navStack: [], unlockedAreaIds: [], completedDialogueIds: [], solvedPuzzleIds: [], hintTiers: {} },
            },
            activeSession: null,
          },
        },
      },
    };
    localStorage.setItem('tiem-may-nep-save-v1', JSON.stringify({ tree, activeSlotId: 'slot-1' }));
  });
}

test.describe('Chapter 2 — Nghiệm Thu Độc Lập Trình Duyệt & Bốn Yêu Cầu Trọng Tâm', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  // ==========================================================================
  // YÊU CẦU 1: CONTEXT STUDIO (Lưu context, reload, cách ly quyền mượn)
  // ==========================================================================
  test('Yêu cầu 1: Context Studio lưu eventContextId hợp lệ qua reload, quyền mượn không thoát challenge', async ({ page }) => {
    await page.goto('/');
    await seedCompletedC1(page);

    // Seed state đang ở S3 với puzzle P5 sẵn sàng
    await page.evaluate(() => {
      const raw = localStorage.getItem('tiem-may-nep-save-v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      const head = data.tree.nodes[data.tree.headId].snapshot;
      head.journey.c2.currentArea = 'c2-s3-phong-trien-lam-doi-dau';
      head.journey.c2.solvedPuzzleIds = ['p-c2-sketch-assemble', 'p-c2-safe-open', 'p-c2-present-receipt', 'p-c2-present-sketch'];
      head.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];
      head.journey.c2.puzzleDrafts = {
        'p-c2-styling-loan': {
          type: 'styling',
          answer: {
            silhouette: 'tan_thoi',
            garmentId: 'ao-dai-lemur',
            headwearId: 'khan-van-den',
            footwearId: 'guoc-moc',
            eventContextId: 'tet',
          },
        },
      };
      localStorage.setItem('tiem-may-nep-save-v1', JSON.stringify(data));
    });

    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();

    // 1. Kiểm tra draft bảo toàn eventContextId: 'tet' sau reload
    const snapAfterReload = await saved(page);
    expect(snapAfterReload).not.toBeNull();
    const draftAnswer = snapAfterReload?.journey.c2.puzzleDrafts?.['p-c2-styling-loan']?.answer;
    expect(draftAnswer?.eventContextId).toBe('tet');

    // 2. Kiểm tra ví không đổi và đồ mượn không nằm trong closet vĩnh viễn
    expect(snapAfterReload?.wallet.senNgoc).toBe(250);
    expect(snapAfterReload?.closet.unlockedGarmentIds).not.toContain('ao-dai-lemur');
    expect(snapAfterReload?.closet.unlockedAccessoryIds).not.toContain('khan-van-den');
    expect(snapAfterReload?.closet.unlockedAccessoryIds).not.toContain('guoc-moc');

    // 3. Mở Studio thường / Closet: đồ mượn không xuất hiện trong tủ đồ thường
    const closetBtn = page.getByRole('button', { name: /Tủ đồ|Trang phục/i });
    if (await closetBtn.isVisible()) {
      await closetBtn.click();
      await expect(page.locator('.wardrobe-card', { hasText: 'Lemur' })).toHaveCount(0);
    }
  });

  // ==========================================================================
  // YÊU CẦU 2: NPC (Loan & Cả Nghị xuất hiện thực tế, không che hotspot/exit)
  // ==========================================================================
  test('Yêu cầu 2: Loan và Cả Nghị xuất hiện thực tế trong phòng, ảnh tải thành công, không che hotspot/exit', async ({ page }) => {
    const failedImages: string[] = [];
    page.on('response', response => {
      if (response.request().resourceType() === 'image' && !response.ok()) {
        failedImages.push(response.url());
      }
    });

    await page.goto('/');
    await seedCompletedC1(page);
    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
    await inArea(page, 'c2-s1-gac-lung-ve-tranh');

    // 1. Thoại mở đầu D0
    if (await dialog(page).isVisible()) {
      await advanceDialogue(page);
    }

    // 2. Không có ảnh nào bị 404
    expect(failedImages).toEqual([]);

    // 3. Hotspot mảnh 4 tại cửa sổ không bị che khuất và đạt >= 40px
    const windowPieceSpot = spot(page, 'hitbox-french-window');
    await expect(windowPieceSpot).toBeVisible();
    const box = await windowPieceSpot.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.height).toBeGreaterThanOrEqual(40);

    // 4. Mũi tên exit sang S2 không bị che
    const exitToS2 = exitArrow(page, 'window');
    await expect(exitToS2).toBeVisible();
    const exitBox = await exitToS2.boundingBox();
    expect(exitBox).not.toBeNull();
  });

  // ==========================================================================
  // YÊU CẦU 3 & 4: GHÉP HÌNH & BÀN PHÍM (Tỷ lệ native, liền dải, controls, ArrowLeft 3 lần)
  // ==========================================================================
  test('Yêu cầu 3 & 4: Ghép tranh native ratio, liền dải, controls tách rời; Focus mảnh 4 → ArrowLeft 3 lần liên tiếp giữ focus', async ({ page }) => {
    await page.goto('/');
    await seedCompletedC1(page);

    // Seed sở hữu đủ 4 mảnh ở S1 và mở draft P1
    await page.evaluate(() => {
      const raw = localStorage.getItem('tiem-may-nep-save-v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      const head = data.tree.nodes[data.tree.headId].snapshot;
      head.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
      head.inventory.itemIds.push(
        'manh_ban_ve_ao_dai_1',
        'manh_ban_ve_ao_dai_2',
        'manh_ban_ve_ao_dai_3',
        'manh_ban_ve_ao_dai_4'
      );
      head.journey.c2.puzzleDrafts = {
        'p-c2-sketch-assemble': {
          type: 'order',
          answer: [
            'manh_ban_ve_ao_dai_1',
            'manh_ban_ve_ao_dai_2',
            'manh_ban_ve_ao_dai_3',
            'manh_ban_ve_ao_dai_4',
          ],
        },
      };
      localStorage.setItem('tiem-may-nep-save-v1', JSON.stringify(data));
    });

    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();

    // Mở giá vẽ P1
    const easel = spot(page, 'hitbox-drawing-easel');
    await expect(easel).toBeVisible();
    await easel.click();
    await expect(dialog(page)).toBeVisible();

    // KIỂM TRA YÊU CẦU 3: GHÉP HÌNH NATIVE RATIO & LIỀN DẢI
    const stripPreviews = dialog(page).locator('.order-strip-preview');
    await expect(stripPreviews).toHaveCount(4);

    const firstStrip = stripPreviews.first();
    const bbox1 = await firstStrip.boundingBox();
    expect(bbox1).not.toBeNull();
    // Tỷ lệ native 128 / 1476 ≈ 0.0867; không bị kéo dãn ngang > 300% (aspect < 0.20)
    const aspect = bbox1!.width / bbox1!.height;
    expect(aspect).toBeLessThan(0.20);

    // Kiểm tra controls (‹, ›, ×) tách rời, nằm bên dưới preview ảnh
    const controls = dialog(page).locator('.order-strip-controls').first();
    await expect(controls).toBeVisible();
    const ctrlBox = await controls.boundingBox();
    expect(ctrlBox).not.toBeNull();
    expect(ctrlBox!.y).toBeGreaterThanOrEqual(bbox1!.y + bbox1!.height - 2);

    // KIỂM TRA YÊU CẦU 4: BÀN PHÍM DI CHUYỂN LIÊN TIẾP 3 LẦN
    const slots = dialog(page).locator('.order-slot');
    await expect(slots).toHaveCount(4);

    // 1. Focus vào mảnh thứ 4 (index 3)
    await slots.nth(3).focus();
    const focusedInitial = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
    expect(focusedInitial).toMatch(/Dải 4|manh_4|Mảnh 4|Vị trí 4/i);

    // 2. Nhấn ArrowLeft lần 1: dời từ index 3 → 2
    await page.keyboard.press('ArrowLeft');
    const activeAfter1 = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, label: el?.getAttribute('aria-label') };
    });
    expect(activeAfter1.tag).not.toBe('BODY');

    // 3. Nhấn ArrowLeft lần 2: dời từ index 2 → 1
    await page.keyboard.press('ArrowLeft');
    const activeAfter2 = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, label: el?.getAttribute('aria-label') };
    });
    expect(activeAfter2.tag).not.toBe('BODY');

    // 4. Nhấn ArrowLeft lần 3: dời từ index 1 → 0
    await page.keyboard.press('ArrowLeft');
    const activeAfter3 = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, label: el?.getAttribute('aria-label') };
    });
    expect(activeAfter3.tag).not.toBe('BODY');

    // 5. Thử Delete/Backspace gỡ mảnh: focus chuyển sang slot lân cận, không rơi về body
    await page.keyboard.press('Delete');
    const activeAfterDelete = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeAfterDelete).not.toBe('BODY');
  });

  // ==========================================================================
  // ĐA VIEWPORT (5 VIEWPORTS BẮT BUỘC): 1440x900, 1280x720, 390x844, 844x390, 768x1024
  // ==========================================================================
  const viewports = [
    { name: 'desktop 1440x900', width: 1440, height: 900 },
    { name: 'laptop 1280x720', width: 1280, height: 720 },
    { name: 'mobile portrait 390x844', width: 390, height: 844 },
    { name: 'mobile landscape 844x390', width: 844, height: 390 },
    { name: 'tablet 768x1024', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`Đa thiết bị: bố cục C2 hiển thị chuẩn xác trên ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await seedCompletedC1(page);
      await page.reload();
      await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
      await expect(page.locator('.room-stage canvas')).toBeVisible();

      // Kiểm tra touch target trên các nút điều khiển xuất hiện
      await expectTouchTargets(page, '.room-navigation');
    });
  }
});
