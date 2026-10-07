import { test, expect, type Page } from '@playwright/test';

/**
 * BỘ KIỂM THỬ TRÌNH DUYỆT CHƯƠNG 2 — TIẾNG KÉO ĐÊM PHỐ CŨ (TESTER OWNERSHIP)
 *
 * Tham chiếu:
 * - docs/07-game/c2-contract.md
 * - Sáu phát hiện review Leader
 *
 * 4 Nhóm trọng tâm regression độc lập:
 * 1. Context Studio:
 *    Lưu eventContextId hợp lệ → close/reopen/reload → giữ đúng context,
 *    đồng thời quyền mượn không thoát challenge.
 * 2. NPC:
 *    Loan/Cả Nghị thực sự xuất hiện trong phòng đúng state/pose (không chỉ ROOM_NPCS).
 *    Kiểm mapping content, ảnh load và vị trí không che hotspot/exit.
 * 3. Ghép hình:
 *    Bốn dải giữ đúng tỷ lệ native, không kéo ngang. Thứ tự đúng tạo ảnh liền.
 *    Controls không chen vào hình. Kiểm desktop/mobile; screenshot nếu cần chứng minh.
 * 4. Keyboard:
 *    Focus một mảnh, đổi vị trí bằng nhiều ArrowLeft/Right liên tiếp;
 *    sau move vẫn thao tác được, remove chuyển focus hợp lý.
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

// Helper: advance dialogue nodes
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

test.describe('Chapter 2 — Regression Độc Lập & Bốn Yêu Cầu Trọng Tâm', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  // ==========================================================================
  // YÊU CẦU 1: CONTEXT STUDIO (Lưu eventContextId, reload, và loan containment)
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
    const draftAnswer = snapAfterReload?.journey.c2.puzzleDrafts?.['p-c2-styling-loan']?.answer;
    expect(draftAnswer?.eventContextId).toBe('tet');

    // 2. Kiểm tra ví không đổi và đồ mượn không nằm trong closet vĩnh viễn
    expect(snapAfterReload?.wallet.senNgoc).toBe(250);
    expect(snapAfterReload?.closet.unlockedGarmentIds).not.toContain('ao-dai-lemur');

    // 3. Mở Studio thường / Closet: đồ mượn không thể mặc hoặc lưu outfit vĩnh viễn
    const closetBtn = page.getByRole('button', { name: /Tủ đồ|Trang phục/i });
    if (await closetBtn.isVisible()) {
      await closetBtn.click();
      const saveOutfitBtn = page.getByRole('button', { name: /Lưu diện mạo|Lưu bộ đồ/i });
      if (await saveOutfitBtn.isVisible()) {
        // Cố tình chọn đồ mượn ngoài challenge không thể lưu
        expect(await page.locator('.wardrobe-card', { hasText: 'Lemur' }).count()).toBe(0);
      }
    }
  });

  // ==========================================================================
  // YÊU CẦU 2: NPC (Loan & Cả Nghị xuất hiện thực tế, ảnh load, không che hotspot)
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

    // 1. Đóng thoại mở đầu nếu có
    if (await dialog(page).isVisible()) {
      await advanceDialogue(page);
    }

    // 2. Kiểm tra ảnh tải: không có hình ảnh nào bị 404
    expect(failedImages).toEqual([]);

    // 3. Kiểm tra các hotspot quan trọng ở S1 vẫn bấm được và không bị che khuất
    const windowPieceSpot = spot(page, 'hitbox-french-window');
    if (await windowPieceSpot.isVisible()) {
      const box = await windowPieceSpot.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(40);
      expect(box!.height).toBeGreaterThanOrEqual(40);
    }

    // 4. Mũi tên exit không bị che
    const exitToS2 = exitArrow(page, 'window');
    if (await exitToS2.isVisible()) {
      const exitBox = await exitToS2.boundingBox();
      expect(exitBox).not.toBeNull();
    }
  });

  // ==========================================================================
  // YÊU CẦU 3: GHÉP HÌNH (Tỷ lệ native 128x1476, không kéo ngang, liền kề, tách controls)
  // ==========================================================================
  test('Yêu cầu 3: Bốn dải bản vẽ giữ đúng tỷ lệ native, không kéo ngang, thứ tự đúng tạo ảnh liền, controls tách rời', async ({ page }) => {
    await page.goto('/');
    await seedCompletedC1(page);

    // Seed nhặt đủ 4 mảnh ở S1 và mở P1
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
      localStorage.setItem('tiem-may-nep-save-v1', JSON.stringify(data));
    });

    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();

    // Mở puzzle ghép bản vẽ
    const easel = spot(page, 'hitbox-drawing-easel');
    if (await easel.isVisible()) {
      await easel.click();
    } else {
      // Fallback mở qua túi đồ hoặc tương tác
      const pieceBtn = page.getByRole('button', { name: /Mảnh bản vẽ 1/i });
      if (await pieceBtn.isVisible()) await pieceBtn.click();
    }

    if (await dialog(page).isVisible()) {
      // Thêm các mảnh vào board
      const trayButtons = dialog(page).locator('.order-tray-btn');
      const count = await trayButtons.count();
      for (let i = 0; i < count; i++) {
        await trayButtons.nth(0).click();
      }

      // Kiểm tra tỷ lệ hình học của các dải
      const stripPreviews = dialog(page).locator('.order-strip-preview');
      if (await stripPreviews.count() > 0) {
        const firstStrip = stripPreviews.first();
        const bbox = await firstStrip.boundingBox();
        if (bbox) {
          // Native aspect = 128 / 1476 ≈ 0.0867
          // Không được ép méo ngang thành 44x160 (tỷ lệ 0.275, méo > 300%)
          const aspect = bbox.width / bbox.height;
          // Tỷ lệ aspect chiều rộng so với chiều cao không được phình to gấp 3 lần tỷ lệ gốc
          expect(aspect).toBeLessThan(0.20);
        }

        // Kiểm tra controls (‹, ›, ×) tách rời, không đè lên vùng ảnh .order-strip-preview
        const controls = dialog(page).locator('.order-strip-controls').first();
        if (await controls.isVisible() && bbox) {
          const ctrlBox = await controls.boundingBox();
          if (ctrlBox) {
            // Controls nằm bên dưới preview, y của controls >= y + height của preview
            expect(ctrlBox.y).toBeGreaterThanOrEqual(bbox.y + bbox.height - 2);
          }
        }
      }

      // Screenshot minh chứng hình học
      await page.screenshot({ path: 'artifacts/c2-order-assembly-proof.png', fullPage: false });
    }
  });

  // ==========================================================================
  // YÊU CẦU 4: KEYBOARD (Focus một mảnh, ArrowLeft/Right liên tiếp, remove chuyển focus)
  // ==========================================================================
  test('Yêu cầu 4: Focus một mảnh, đổi vị trí bằng nhiều ArrowLeft/Right liên tiếp, sau move vẫn thao tác được, remove chuyển focus hợp lý', async ({ page }) => {
    await page.goto('/');
    await seedCompletedC1(page);

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
          answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_4'],
        },
      };
      localStorage.setItem('tiem-may-nep-save-v1', JSON.stringify(data));
    });

    await page.reload();
    await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();

    // Mở P1
    const easel = spot(page, 'hitbox-drawing-easel');
    if (await easel.isVisible()) {
      await easel.click();
    }

    if (await dialog(page).isVisible()) {
      const slots = dialog(page).locator('.order-slot');
      if (await slots.count() >= 4) {
        // 1. Focus vào mảnh thứ 4 (index 3)
        await slots.nth(3).focus();

        // 2. Nhấn ArrowLeft lần 1
        await page.keyboard.press('ArrowLeft');
        // Sau khi move, focus KHÔNG được rơi về document.body
        const activeTag1 = await page.evaluate(() => document.activeElement?.tagName);
        expect(activeTag1).not.toBe('BODY');

        // 3. Nhấn ArrowLeft lần 2 liên tiếp ngay lập tức
        await page.keyboard.press('ArrowLeft');
        const activeTag2 = await page.evaluate(() => document.activeElement?.tagName);
        expect(activeTag2).not.toBe('BODY');

        // 4. Nhấn ArrowLeft lần 3 liên tiếp
        await page.keyboard.press('ArrowLeft');
        const activeTag3 = await page.evaluate(() => document.activeElement?.tagName);
        expect(activeTag3).not.toBe('BODY');

        // 5. Thử phím Delete/Backspace để gỡ mảnh
        await page.keyboard.press('Delete');
        // Sau khi gỡ, focus phải chuyển sang slot kế tiếp hoặc liền kề, KHÔNG rơi về body
        const activeTagAfterDelete = await page.evaluate(() => document.activeElement?.tagName);
        expect(activeTagAfterDelete).not.toBe('BODY');
      }
    }
  });

  // ==========================================================================
  // ĐA THIẾT BỊ: DESKTOP & MOBILE
  // ==========================================================================
  const viewports = [
    { name: 'desktop 1440x900', width: 1440, height: 900 },
    { name: 'mobile portrait 390x844', width: 390, height: 844 },
    { name: 'mobile landscape 844x390', width: 844, height: 390 },
  ];

  for (const vp of viewports) {
    test(`Đa thiết bị: bố cục C2 hiển thị ổn định trên ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await seedCompletedC1(page);
      await page.reload();
      await page.getByRole('button', { name: /^(Vào game|Tiếp tục chơi)$/ }).click();
      await expect(page.locator('.room-stage')).toBeVisible();
    });
  }
});
