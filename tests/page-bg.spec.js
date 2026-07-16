// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Page background cover + stock picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
  });

  test('stock background uses cover / no-repeat (not tiled)', async ({ page }) => {
    await page.locator('#settingsOpenBtn').click();
    await page.locator('#pageBgBrowseBtn').click();
    await expect(page.locator('#bgPickerOverlay')).toHaveClass(/open/);
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

  test('category filter shrinks curated grid client-side', async ({ page }) => {
    await page.locator('#settingsOpenBtn').click();
    await page.locator('#pageBgBrowseBtn').click();
    await expect(page.locator('#bgPickerOverlay')).toHaveClass(/open/);

    await page.waitForFunction(() => {
      return document.querySelectorAll('#bgPickerGrid .bg-picker-item:not(.is-broken)').length >= 4;
    }, null, { timeout: 15000 });

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
