// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const shotDir = path.join(__dirname, '..', 'test-results', 'visual-qa');

test.describe('LunaClock canvas visual QA', () => {
  test.beforeAll(() => {
    fs.mkdirSync(shotDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
    await page.waitForTimeout(100);
  });

  test('mode switch keeps canvas digits painted (clock ↔ pomodoro)', async ({ page }, testInfo) => {
    const clock = page.locator('#clock');
    const hoursCanvas = page.locator('#hoursTens canvas.digit-canvas');

    await expect(clock).toHaveAttribute('data-mode', 'clock');
    await expect(hoursCanvas).toBeVisible();

    // Sample pixel from hours canvas — must be opaque (not blank/transparent)
    const clockSample = await page.evaluate(() => {
      const c = document.querySelector('#hoursTens canvas.digit-canvas');
      const ctx = c.getContext('2d');
      const x = Math.floor(c.width / 2);
      const y = Math.floor(c.height / 4);
      const d = ctx.getImageData(x, y, 1, 1).data;
      return { w: c.width, h: c.height, r: d[0], g: d[1], b: d[2], a: d[3] };
    });
    expect(clockSample.w).toBeGreaterThan(10);
    expect(clockSample.h).toBeGreaterThan(10);
    expect(clockSample.a).toBe(255);

    await page.locator('#fullscreenStage').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-clock.png`),
    });

    await page.locator('#pomodoroModeBtn').click();
    await expect(clock).toHaveAttribute('data-mode', 'pomodoro');
    await page.waitForTimeout(80);

    await page.locator('#fullscreenStage').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-pomodoro.png`),
    });

    await page.locator('#clockModeBtn').click();
    await expect(clock).toHaveAttribute('data-mode', 'clock');
    await page.waitForTimeout(120);

    const after = await page.evaluate(() => {
      const c = document.querySelector('#hoursTens canvas.digit-canvas');
      const ctx = c.getContext('2d');
      const x = Math.floor(c.width / 2);
      const y = Math.floor(c.height / 4);
      const d = ctx.getImageData(x, y, 1, 1).data;
      const face = getComputedStyle(document.documentElement).getPropertyValue('--face').trim();
      return { w: c.width, h: c.height, r: d[0], g: d[1], b: d[2], a: d[3], face: face };
    });
    expect(after.w).toBeGreaterThan(10);
    expect(after.h).toBeGreaterThan(10);
    expect(after.a).toBe(255);
    // Hours card visible again after pomodoro
    await expect(page.locator('#hoursCard')).toBeVisible();
    await expect(hoursCanvas).toBeVisible();

    await page.locator('#fullscreenStage').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-clock-after-pomo.png`),
    });
  });

  test('theme face token paints canvas (not page gradient bleed)', async ({ page }) => {
    await page.locator('#settingsOpenBtn').click();
    await page.locator('.preset-btn[data-preset="charcoal"]').click();
    await page.locator('#settingsCloseBtn').click();
    await page.waitForTimeout(80);

    const sample = await page.evaluate(() => {
      const c = document.querySelector('#minutesOnes canvas.digit-canvas');
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(2, 2, 1, 1).data;
      const face = getComputedStyle(document.documentElement).getPropertyValue('--face').trim();
      return { r: d[0], g: d[1], b: d[2], a: d[3], face: face };
    });
    expect(sample.a).toBe(255);
    expect(sample.face.toLowerCase()).toContain('#');
    // Charcoal face is dark — corner pixel should be darkish, not light page bg
    expect(sample.r + sample.g + sample.b).toBeLessThan(200);
  });

  test('hold reset completes in ~2 seconds', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await page.locator('#startStopBtn').click();
    await page.waitForTimeout(300);

    const resetBtn = page.locator('#resetBtn');
    const box = await resetBtn.boundingBox();
    expect(box).toBeTruthy();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const t0 = Date.now();
    await page.mouse.down();
    await page.waitForFunction(() => {
      const btn = document.getElementById('resetBtn');
      return !!(btn && btn.classList.contains('holding'));
    });
    await page.waitForFunction(() => {
      const btn = document.getElementById('resetBtn');
      return !!(btn && !btn.classList.contains('holding'));
    });
    const elapsed = Date.now() - t0;
    await page.mouse.up();
    expect(elapsed).toBeGreaterThanOrEqual(1900);
    expect(elapsed).toBeLessThan(2600);
  });

  test('clock flip settles opaque without blanking mid-animation', async ({ page }) => {
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'clock');

    const before = await page.evaluate(() => {
      const canvas = document.querySelector('#secondsOnes canvas.digit-canvas');
      const ctx = canvas.getContext('2d');
      return { w: canvas.width, h: canvas.height, a: ctx.getImageData(2, 2, 1, 1).data[3] };
    });
    expect(before.w).toBeGreaterThan(10);
    expect(before.a).toBe(255);

    // Wait across a second boundary so FlipEngine animates, then assert still opaque
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => {
      const c = document.querySelector('#secondsOnes canvas.digit-canvas');
      const ctx = c.getContext('2d');
      const corner = ctx.getImageData(2, 2, 1, 1).data;
      const midY = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
      return {
        w: c.width,
        h: c.height,
        cornerA: corner[3],
        midA: midY[3]
      };
    });
    expect(after.w).toBeGreaterThan(10);
    expect(after.h).toBeGreaterThan(10);
    expect(after.cornerA).toBe(255);
    expect(after.midA).toBe(255);
  });
});
