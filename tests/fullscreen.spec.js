// @ts-check
const { test, expect } = require('@playwright/test');

const DIGIT_IDS = [
  'hoursTens',
  'hoursOnes',
  'minutesTens',
  'minutesOnes',
  'secondsTens',
  'secondsOnes',
];

/** Horizontal center tolerance vs viewport center (px) */
const CENTER_TOL = 24;
/** Digit containment bleed vs #clock (px) */
const CONTAIN_TOL = 4;

/**
 * Enter CSS fullscreen via #fullscreenBtn.
 * Browser Fullscreen API may be denied in headless — body.fullscreen-mode is what matters.
 * @param {import('@playwright/test').Page} page
 */
async function enterFullscreen(page) {
  await page.evaluate(() => {
    // Prefer CSS-class path so layout tests are stable without real FS API
    const el = document.documentElement;
    el.requestFullscreen = () => Promise.reject(new Error('test-deny-fs'));
  });
  await page.locator('#fullscreenBtn').click();
  await expect(page.locator('body')).toHaveClass(/fullscreen-mode/);
  await expect(page.locator('#exitFullscreenBtn')).toBeVisible();
  await page.waitForTimeout(120);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function measureFullscreenLayout(page) {
  return page.evaluate((digitIds) => {
    const stage = document.getElementById('fullscreenStage');
    const clock = document.getElementById('clock');
    const modeRow = document.getElementById('modeRow');
    if (!stage || !clock || !modeRow) return null;
    const sr = stage.getBoundingClientRect();
    const cr = clock.getBoundingClientRect();
    const mr = modeRow.getBoundingClientRect();
    const digits = digitIds.map((id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      return { id, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      stage: { left: sr.left, right: sr.right, width: sr.width, centerX: sr.left + sr.width / 2 },
      clock: { left: cr.left, right: cr.right, top: cr.top, bottom: cr.bottom, width: cr.width, centerX: cr.left + cr.width / 2 },
      modeRow: { left: mr.left, right: mr.right, width: mr.width, centerX: mr.left + mr.width / 2 },
      digits,
    };
  }, DIGIT_IDS);
}

test.describe('LunaClock fullscreen centering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
    await expect(page.locator('#hoursTens canvas.digit-canvas')).toBeVisible();
    await page.waitForTimeout(100);
  });

  test('fullscreen stage + clock are horizontally centered', async ({ page }) => {
    await enterFullscreen(page);
    const layout = await measureFullscreenLayout(page);
    expect(layout).toBeTruthy();

    const viewCenter = layout.vw / 2;
    expect(Math.abs(layout.stage.centerX - viewCenter), 'stage center X').toBeLessThanOrEqual(CENTER_TOL);
    expect(Math.abs(layout.clock.centerX - viewCenter), 'clock center X').toBeLessThanOrEqual(CENTER_TOL);
    expect(Math.abs(layout.modeRow.centerX - viewCenter), 'modeRow center X').toBeLessThanOrEqual(CENTER_TOL);

    // Stage should cover the viewport (fixed inset)
    expect(layout.stage.width).toBeGreaterThan(layout.vw * 0.95);
    expect(layout.stage.left).toBeLessThanOrEqual(2);

    // Grey panel should hug content (not a near-full-bleed 1100px slab on wide screens)
    expect(layout.clock.width).toBeLessThan(layout.vw * 0.92);
  });

  test('fullscreen digits stay inside #clock', async ({ page }) => {
    await enterFullscreen(page);
    const layout = await measureFullscreenLayout(page);
    expect(layout).toBeTruthy();

    for (const d of layout.digits) {
      expect(d.left, `${d.id} left`).toBeGreaterThanOrEqual(layout.clock.left - CONTAIN_TOL);
      expect(d.right, `${d.id} right`).toBeLessThanOrEqual(layout.clock.right + CONTAIN_TOL);
      expect(d.top, `${d.id} top`).toBeGreaterThanOrEqual(layout.clock.top - CONTAIN_TOL);
      expect(d.bottom, `${d.id} bottom`).toBeLessThanOrEqual(layout.clock.bottom + CONTAIN_TOL);
    }
  });

  test('exit fullscreen restores normal layout', async ({ page }) => {
    await enterFullscreen(page);
    await page.locator('#exitFullscreenBtn').click();
    await expect(page.locator('body')).not.toHaveClass(/fullscreen-mode/);
    await expect(page.locator('#exitFullscreenBtn')).toBeHidden();
    await expect(page.locator('.top-bar')).toBeVisible();
    await expect(page.locator('#fullscreenBtn')).toBeVisible();
    await page.waitForTimeout(80);

    const normal = await page.evaluate(() => {
      const clock = document.getElementById('clock');
      const stage = document.getElementById('fullscreenStage');
      const cr = clock.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      return {
        clockW: cr.width,
        stagePos: getComputedStyle(stage).position,
        stageTop: sr.top,
      };
    });
    expect(normal.stagePos).not.toBe('fixed');
    expect(normal.clockW).toBeGreaterThan(80);
    // Stage back in document flow below top bar
    expect(normal.stageTop).toBeGreaterThan(40);
  });
});
