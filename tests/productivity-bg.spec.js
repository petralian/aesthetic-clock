// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Enter CSS fullscreen via #fullscreenBtn (deny native FS API in headless).
 * @param {import('@playwright/test').Page} page
 */
async function enterFullscreen(page) {
  await page.evaluate(() => {
    document.documentElement.requestFullscreen = () => Promise.reject(new Error('test-deny-fs'));
  });
  await page.locator('#fullscreenBtn').click();
  await expect(page.locator('body')).toHaveClass(/fullscreen-mode/);
  await page.waitForTimeout(120);
}

test.describe('LunaClock productivity timers + fullscreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
    await page.waitForTimeout(100);
  });

  test('stopwatch keeps time when tab hidden then visible', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await page.locator('#startStopBtn').click();
    await page.waitForTimeout(80);

    const before = await page.evaluate(() => window.__LUNACLOCK_TEST__.getStopwatchTime());

    await page.evaluate(() => {
      window.__LUNACLOCK_TEST__.backdateStopwatch(2500);
      window.__LUNACLOCK_TEST__.simulateHidden();
    });

    const after = await page.evaluate(() => {
      window.__LUNACLOCK_TEST__.simulateVisible();
      return window.__LUNACLOCK_TEST__.getStopwatchTime();
    });

    expect(after - before).toBeGreaterThanOrEqual(2400);
  });

  test('pomodoro catches up after simulated hidden elapsed time', async ({ page }) => {
    await page.locator('#pomodoroModeBtn').click();
    await page.locator('#pomodoroStartBtn').click();
    await page.waitForTimeout(80);

    const before = await page.evaluate(() => window.__LUNACLOCK_TEST__.getPomodoroRemaining());

    const after = await page.evaluate(() => {
      window.__LUNACLOCK_TEST__.backdatePomodoro(3000);
      window.__LUNACLOCK_TEST__.simulateVisible();
      return window.__LUNACLOCK_TEST__.getPomodoroRemaining();
    });

    expect(before - after).toBeGreaterThanOrEqual(2900);
  });

  test('switching modes preserves both running timers', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await page.locator('#startStopBtn').click();
    await page.waitForTimeout(120);

    await page.locator('#pomodoroModeBtn').click();
    await page.locator('#pomodoroStartBtn').click();
    await page.waitForTimeout(80);

    const swRunning = await page.evaluate(() => window.__LUNACLOCK_TEST__.isStopwatchRunning());
    const pomoRunning = await page.evaluate(() => window.__LUNACLOCK_TEST__.isPomodoroRunning());
    expect(swRunning).toBe(true);
    expect(pomoRunning).toBe(true);

    await page.locator('#stopwatchModeBtn').click();
    await page.waitForTimeout(80);

    const swTime = await page.evaluate(() => window.__LUNACLOCK_TEST__.getStopwatchTime());
    expect(swTime).toBeGreaterThanOrEqual(100);
  });

  test('fullscreen productivity shows stopwatch controls', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await enterFullscreen(page);

    await expect(page.locator('body')).toHaveClass(/productivity-fs/);
    await expect(page.locator('#fsProductivity')).toBeVisible();
    await expect(page.locator('#fsStartStopBtn')).toBeVisible();
    await expect(page.locator('#fsLapBtn')).toBeVisible();
    await expect(page.locator('#fsResetBtn')).toBeVisible();
  });

  test('fullscreen productivity shows pomodoro controls', async ({ page }) => {
    await page.locator('#pomodoroModeBtn').click();
    await enterFullscreen(page);

    await expect(page.locator('body')).toHaveClass(/productivity-fs/);
    await expect(page.locator('#fsPomoStartBtn')).toBeVisible();
    await expect(page.locator('#fsPomoResetBtn')).toBeVisible();
  });

  test('fullscreen mode switch pills change active pane', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.locator('#stopwatchModeBtn').click();
    await enterFullscreen(page);

    await page.locator('#fsPillPomodoro').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'pomodoro');
    await expect(page.locator('#fsPanePomodoro')).toHaveClass(/active/);

    await page.locator('#fsPillStopwatch').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await expect(page.locator('#fsPaneStopwatch')).toHaveClass(/active/);
  });

  test('wide viewport dual fullscreen shows both panes', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.locator('#stopwatchModeBtn').click();
    await enterFullscreen(page);

    await expect(page.locator('#fsPaneStopwatch')).toBeVisible();
    await expect(page.locator('#fsPanePomodoro')).toBeVisible();
    await expect(page.locator('#fsModePills')).toBeHidden();
  });

  test('clock mode fullscreen stays clean without productivity strip', async ({ page }) => {
    await enterFullscreen(page);
    await expect(page.locator('body')).not.toHaveClass(/productivity-fs/);
    await expect(page.locator('#fsProductivity')).toBeHidden();
  });
});
