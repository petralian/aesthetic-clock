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

const STOPWATCH_DIGIT_IDS = [
  'hoursTens',
  'hoursOnes',
  'minutesTens',
  'minutesOnes',
  'secondsTens',
  'secondsOnes',
  'millisTens',
  'millisOnes',
];

const POMODORO_DIGIT_IDS = [
  'hoursTens',
  'hoursOnes',
  'minutesTens',
  'minutesOnes',
  'secondsTens',
  'secondsOnes',
];

const shotDir = path.join(__dirname, '..', 'test-results', 'layout-qa');
const TOL = 4; // px — allow subpixel / border / shadow bleed
const MS_BOTTOM_TOL = 6; // px — ms digit bottoms vs seconds digit bottoms

/**
 * @param {import('@playwright/test').Page} page
 * @param {string[]} ids
 */
async function measureClockLayout(page, ids = DIGIT_IDS) {
  return page.evaluate((digitIds) => {
    const clock = document.getElementById('clock');
    if (!clock) return null;
    const clockBox = clock.getBoundingClientRect();
    const digits = digitIds.map((id) => {
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
  }, ids);
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
    await expect(page.locator('#tzChip')).not.toBeVisible();
    await expect(page.locator('#hoursCard')).toBeVisible();
    await expect(page.locator('#hoursCard')).not.toHaveClass(/hidden/);
    await page.waitForTimeout(100);

    await page.locator('#pomodoroModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'pomodoro');
    await expect(page.locator('#tzChip')).not.toBeVisible();
    await expect(page.locator('#hoursCard')).toBeVisible();
    await expect(page.locator('#hoursCard')).not.toHaveClass(/hidden/);
    await page.waitForTimeout(100);

    await page.locator('#clockModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'clock');
    await expect(page.locator('#tzChip')).toBeVisible();
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

  test('stopwatch with hours+ms keeps digits inside #clock and MS bottoms align', async ({ page }, testInfo) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await expect(page.locator('#hoursCard')).toBeVisible();
    await expect(page.locator('#hoursCard')).not.toHaveClass(/hidden/);
    await expect(page.locator('#millisecondsCard')).toBeVisible();
    await expect(page.locator('#millisecondsCard')).not.toHaveClass(/hidden/);

    await page.locator('#startStopBtn').click();
    await page.waitForTimeout(180);

    const layout = await measureClockLayout(page, STOPWATCH_DIGIT_IDS);
    expect(layout).toBeTruthy();
    expect(layout.digits).toHaveLength(STOPWATCH_DIGIT_IDS.length);

    for (const d of layout.digits) {
      expect(d.width, `${d.id} width`).toBeGreaterThan(6);
      expect(d.height, `${d.id} height`).toBeGreaterThan(6);
      expect(d.left, `${d.id} left`).toBeGreaterThanOrEqual(layout.clock.left - TOL);
      expect(d.right, `${d.id} right`).toBeLessThanOrEqual(layout.clock.right + TOL);
      expect(d.top, `${d.id} top`).toBeGreaterThanOrEqual(layout.clock.top - TOL);
      expect(d.bottom, `${d.id} bottom`).toBeLessThanOrEqual(layout.clock.bottom + TOL);
      expect(d.aspect, `${d.id} aspect`).toBeGreaterThan(0.45);
      expect(d.aspect, `${d.id} aspect`).toBeLessThan(1.35);
    }

    const millis = layout.digits.filter((d) => d.id.startsWith('millis'));
    const seconds = layout.digits.filter((d) => d.id.startsWith('seconds'));
    const hours = layout.digits.filter((d) => d.id.startsWith('hours'));
    const avgMsH = millis.reduce((s, d) => s + d.height, 0) / millis.length;
    const avgSecH = seconds.reduce((s, d) => s + d.height, 0) / seconds.length;
    expect(avgMsH, 'ms digits smaller than seconds').toBeLessThan(avgSecH * 0.9);
    expect(hours.length, 'hours visible in stopwatch').toBe(2);

    const avgMsBottom = millis.reduce((s, d) => s + d.bottom, 0) / millis.length;
    const avgSecBottom = seconds.reduce((s, d) => s + d.bottom, 0) / seconds.length;
    expect(Math.abs(avgMsBottom - avgSecBottom), 'ms digit bottoms ≈ seconds digit bottoms').toBeLessThanOrEqual(MS_BOTTOM_TOL);

    await page.locator('#clock').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-stopwatch-ms.png`),
    });
  });

  test('pomodoro shows hours and keeps digits inside #clock', async ({ page }, testInfo) => {
    await page.locator('#pomodoroModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'pomodoro');
    await expect(page.locator('#hoursCard')).toBeVisible();
    await expect(page.locator('#hoursCard')).not.toHaveClass(/hidden/);
    await expect(page.locator('#millisecondsCard')).toHaveClass(/hidden/);
    await page.waitForTimeout(120);

    const layout = await measureClockLayout(page, POMODORO_DIGIT_IDS);
    expect(layout).toBeTruthy();
    for (const d of layout.digits) {
      expect(d.left, `${d.id} left`).toBeGreaterThanOrEqual(layout.clock.left - TOL);
      expect(d.right, `${d.id} right`).toBeLessThanOrEqual(layout.clock.right + TOL);
      expect(d.aspect, `${d.id} aspect`).toBeLessThan(1.35);
    }

    await page.locator('#clock').screenshot({
      path: path.join(shotDir, `${testInfo.project.name}-pomodoro-hours.png`),
    });
  });

  test('pomodoro slider and number input stay in sync', async ({ page }) => {
    await page.locator('#settingsOpenBtn').click();
    await expect(page.locator('#pomodoroSettingsSection')).toBeVisible();

    const slider = page.locator('#focusTime');
    const num = page.locator('#focusTimeVal');
    await expect(num).toHaveAttribute('type', 'number');

    await slider.fill('40');
    await expect(num).toHaveValue('40');

    await num.fill('12');
    await expect(slider).toHaveValue('12');

    // Clamp to slider max
    await num.fill('99');
    await num.blur();
    await expect(slider).toHaveValue('60');
    await expect(num).toHaveValue('60');
  });

  test('stopwatch laps show HH:MM:SS:cs', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await page.locator('#startStopBtn').click();
    await page.waitForTimeout(120);
    await page.locator('#lapBtn').click();
    const lapTime = page.locator('.lap-item .lap-time').first();
    await expect(lapTime).toBeVisible();
    const text = await lapTime.textContent();
    expect(text).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
  });

  test('stopwatch laps show delta + cumulative and expand details', async ({ page }, testInfo) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await page.locator('#startStopBtn').click();

    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(80);
      await page.locator('#lapBtn').click();
    }

    const items = page.locator('.lap-item');
    await expect(items).toHaveCount(3);

    const first = items.first();
    await expect(first.locator('.lap-delta')).toBeVisible();
    await expect(first.locator('.lap-cum-compact')).toBeVisible();
    const deltaText = await first.locator('.lap-delta').textContent();
    const cumCompact = await first.locator('.lap-cum-compact').textContent();
    expect(deltaText).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    expect(cumCompact).toMatch(/^Σ \d{2}:\d{2}:\d{2}:\d{2}$/);

    // Best lap badge among ≥2 laps
    await expect(page.locator('.lap-item.best-lap')).toHaveCount(1);

    // Expand via click (works on mobile + desktop)
    await first.click();
    await expect(first).toHaveClass(/expanded/);
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(first.locator('.lap-cum')).toBeVisible();
    const cumText = await first.locator('.lap-cum').textContent();
    expect(cumText).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    // Newest lap (not chronological first) should show vs prior
    await expect(first.locator('.lap-vs')).toBeVisible();

    // Accordion: opening another collapses the first
    await items.nth(1).click();
    await expect(items.nth(1)).toHaveClass(/expanded/);
    await expect(first).not.toHaveClass(/expanded/);

    // Desktop: hover also reveals details without requiring .expanded
    if (!testInfo.project.name.includes('mobile')) {
      await first.hover();
      await expect(first.locator('.lap-details-inner')).toBeVisible();
    }
  });

  test('laps container grows without fixed max-height scroll box', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await page.locator('#startStopBtn').click();

    const container = page.locator('#lapsContainer');
    const style0 = await container.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { maxHeight: cs.maxHeight, overflowY: cs.overflowY, scrollHeight: el.scrollHeight };
    });
    expect(style0.maxHeight === 'none' || style0.maxHeight === '0px' || parseFloat(style0.maxHeight) > 5000).toBeTruthy();
    expect(['visible', 'auto', 'clip'].includes(style0.overflowY) || style0.overflowY === 'visible').toBeTruthy();
    // Must not be a short clipped scroll box
    expect(style0.overflowY).not.toBe('scroll');
    if (style0.maxHeight !== 'none' && style0.maxHeight !== '0px') {
      expect(parseFloat(style0.maxHeight)).toBeGreaterThan(400);
    }

    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(60);
      await page.locator('#lapBtn').click();
    }

    const after = await container.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      maxHeight: getComputedStyle(el).maxHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));
    expect(after.scrollHeight).toBeGreaterThan(style0.scrollHeight);
    // Content not trapped in a shorter scroll viewport
    expect(after.clientHeight).toBeGreaterThanOrEqual(after.scrollHeight - 2);
    expect(after.maxHeight).toBe('none');
  });
});
