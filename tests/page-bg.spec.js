// @ts-check
const { test, expect } = require('@playwright/test');

/** @param {import('@playwright/test').Page} page */
async function openStockPicker(page) {
  await page.locator('#settingsOpenBtn').click();
  await page.locator('#pageBgBrowseBtn').click();
  await expect(page.locator('#bgPickerOverlay')).toHaveClass(/open/);
}

/** @param {import('@playwright/test').Page} page */
async function waitForStockCards(page, min = 4) {
  await page.waitForFunction(
    (n) => document.querySelectorAll('#bgPickerGrid .bg-picker-item:not(.is-broken)').length >= n,
    min,
    { timeout: 15000 }
  );
}

/** @param {import('@playwright/test').Page} page */
async function assertNoGridOverlap(page) {
  const result = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#bgPickerGrid .bg-picker-item:not(.is-broken)')];
    const rects = items.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, height: r.height };
    });

    const sameColumn = (a, b) => Math.abs(a.left - b.left) < 8;
    const overlaps = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        if (!sameColumn(a, b)) continue;
        if (a.bottom > b.top + 1 && b.bottom > a.top + 1) {
          overlaps.push({ i, j, gap: Math.round(b.top - a.bottom) });
        }
      }
    }

    const shortRows = rects.filter((r) => r.height < 40).length;
    return { count: rects.length, overlaps, shortRows };
  });

  expect(result.count).toBeGreaterThan(0);
  expect(result.shortRows).toBe(0);
  expect(result.overlaps).toEqual([]);
}

test.describe('Page background cover + stock picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
  });

  test('stock background uses cover / no-repeat (not tiled)', async ({ page }) => {
    await openStockPicker(page);
    await expect(page.locator('#bgPickerCategory')).toBeVisible();
    await expect(page.locator('#bgPickerSearch')).toBeVisible();

    const first = page.locator('#bgPickerGrid .bg-picker-item:not(.is-broken)').first();
    await expect(first).toBeVisible({ timeout: 15000 });
    await first.locator('img.is-ready').waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    await first.click({ force: true });

    await expect(page.locator('body')).toHaveClass(/has-page-bg/);

    const bg = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        size: cs.backgroundSize,
        repeat: cs.backgroundRepeat,
        position: cs.backgroundPosition,
        hasImage: (cs.backgroundImage || '').includes('url('),
        inlineRepeat: document.body.style.backgroundRepeat,
        inlineSize: document.body.style.backgroundSize,
        inlinePos: document.body.style.backgroundPosition,
      };
    });

    expect(bg.hasImage).toBe(true);
    expect(bg.inlineSize).toMatch(/cover/i);
    expect(bg.inlineRepeat).toMatch(/no-repeat/i);
    // Computed may list two layers (veil + image)
    expect(bg.size).toMatch(/cover/i);
    expect(bg.repeat).toMatch(/no-repeat/i);
    // center computes to 50% — accept either form
    expect(bg.inlinePos || bg.position).toMatch(/center|50%/i);
  });

  test('stock picker grid cards do not overlap', async ({ page }) => {
    await openStockPicker(page);
    await waitForStockCards(page, 6);
    await assertNoGridOverlap(page);

    await page.locator('#bgPickerCategory').selectOption('nature');
    await page.waitForTimeout(100);
    await waitForStockCards(page, 2);
    await assertNoGridOverlap(page);
  });

  test('category filter shrinks curated grid client-side', async ({ page }) => {
    await openStockPicker(page);
    await waitForStockCards(page, 4);

    const allCount = await page.locator('#bgPickerGrid .bg-picker-item:not(.is-broken)').count();
    await page.locator('#bgPickerCategory').selectOption('space');
    await page.waitForTimeout(100);
    const spaceCount = await page.locator('#bgPickerGrid .bg-picker-item:not(.is-broken)').count();
    expect(spaceCount).toBeGreaterThan(0);
    expect(spaceCount).toBeLessThan(allCount);

    await page.locator('#bgPickerSearch').fill('galaxy');
    await page.waitForTimeout(280);
    const filtered = await page.locator('#bgPickerGrid .bg-picker-item:not(.is-broken)').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThanOrEqual(spaceCount);
  });
});
