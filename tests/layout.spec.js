// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DIGIT_IDS = [
  'hoursTens',
  'hoursOnes',
  'minutesTens',
  'minutesOnes',
  'secondsTens',
  'secondsOnes',
];

const shotDir = path.join(__dirname, '..', 'test-results', 'layout-qa');
const TOL = 4; // px — allow subpixel / border / shadow bleed

/**
 * @param {import('@playwright/test').Page} page
 */
async function measureClockLayout(page) {
  return page.evaluate((ids) => {
    const clock = document.getElementById('clock');
    if (!clock) return null;
    const clockBox = clock.getBoundingClientRect();
    const digits = ids.map((id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      const canvas = el.querySelector('canvas.digit-canvas');
      return {
        id,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        aspect: r.height > 0 ? r.width / r.height : 0,
        canvasW: canvas ? canvas.width : 0,
        canvasH: canvas ? canvas.height : 0,
      };
    });
    return {
      clock: {
        left: clockBox.left,
        right: clockBox.right,
        top: clockBox.top,
        bottom: clockBox.bottom,
        width: clockBox.width,
        height: clockBox.height,
      },
      digits,
    };
  }, DIGIT_IDS);
}

test.describe('LunaClock flip layout containment', () => {
  test.beforeAll(() => {
    fs.mkdirSync(shotDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
    await expect(page.locator('#hoursTens canvas.digit-canvas')).toBeVisible();
    // Let FlipEngine syncSize + first paint settle
    await page.waitForTimeout(120);
  });

  test('#clock contains digit canvases with sane aspect', async ({ page }, testInfo) => {
    const layout = await measureClockLayout(page);
    expect(layout).toBeTruthy();
    expect(layout.clock.width).toBeGreaterThan(80);
    expect(layout.digits).toHaveLength(DIGIT_IDS.length);

    for (const d of layout.digits) {
      expect(d.width, `${d.id} width`).toBeGreaterThan(8);
      expect(d.height, `${d.id} height`).toBeGreaterThan(8);
      // Contained inside grey clock panel
      expect(d.left, `${d.id} left`).toBeGreaterThanOrEqual(layout.clock.left - TOL);
      expect(d.right, `${d.id} right`).toBeLessThanOrEqual(layout.clock.right + TOL);
      expect(d.top, `${d.id} top`).toBeGreaterThanOrEqual(layout.clock.top - TOL);
      expect(d.bottom, `${d.id} bottom`).toBeLessThanOrEqual(layout.clock.bottom + TOL);
      // Not the HTML canvas default 300×150 stretch (aspect ~2)
      expect(d.aspect, `${d.id} aspect`).toBeGreaterThan(0.45);
      expect(d.aspect, `${d.id} aspect`).toBeLessThan(1.35);
      // Single digit should be much narrower than the clock card
      expect(d.width, `${d.id} vs clock`).toBeLessThan(layout.clock.width * 0.28);
    }

    await page.locator('#clock').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-clock-panel.png`),
    });
  });

  test('labels sit under their digit cards', async ({ page }) => {
    const align = await page.evaluate(() => {
      const pairs = [
        ['hoursCard', 'hoursTens', 'hoursOnes'],
        ['minutesCard', 'minutesTens', 'minutesOnes'],
        ['secondsCard', 'secondsTens', 'secondsOnes'],
      ];
      return pairs.map(([cardId, a, b]) => {
        const card = document.getElementById(cardId);
        const label = card.querySelector('.label');
        const ra = document.getElementById(a).getBoundingClientRect();
        const rb = document.getElementById(b).getBoundingClientRect();
        const rl = label.getBoundingClientRect();
        const digitMid = (ra.left + rb.right) / 2;
        const labelMid = (rl.left + rl.right) / 2;
        return {
          cardId,
          labelText: (label.textContent || '').trim(),
          digitSpan: rb.right - ra.left,
          cardW: card.getBoundingClientRect().width,
          midDelta: Math.abs(digitMid - labelMid),
        };
      });
    });

    for (const row of align) {
      expect(row.labelText.length, row.cardId).toBeGreaterThan(0);
      // Label center tracks digit-pair center (not a stretched full-width card)
      expect(row.midDelta, `${row.cardId} label align`).toBeLessThan(24);
      expect(row.digitSpan, `${row.cardId} digit span`).toBeLessThan(row.cardW + 8);
    }
  });

  test('mode switch keeps digits inside #clock', async ({ page }, testInfo) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await page.waitForTimeout(100);

    await page.locator('#pomodoroModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'pomodoro');
    await page.waitForTimeout(100);

    await page.locator('#clockModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'clock');
    await page.waitForTimeout(120);

    const layout = await measureClockLayout(page);
    for (const d of layout.digits) {
      expect(d.left, `${d.id} left after modes`).toBeGreaterThanOrEqual(layout.clock.left - TOL);
      expect(d.right, `${d.id} right after modes`).toBeLessThanOrEqual(layout.clock.right + TOL);
      expect(d.aspect, `${d.id} aspect after modes`).toBeLessThan(1.35);
    }

    await page.locator('#fullscreenStage').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-after-modes.png`),
    });
  });
});
