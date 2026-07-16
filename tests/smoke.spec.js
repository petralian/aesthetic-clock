// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('LunaClock smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
  });

  test('loads in clock mode with canvas digits', async ({ page }) => {
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'clock');
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'clock');
    await expect(page.locator('#modeIndicatorText')).toContainText('Clock');
    await expect(page.locator('#hoursTens canvas.digit-canvas')).toBeVisible();
    await expect(page.locator('#clockModeBtn')).toHaveClass(/active/);
  });

  test('switches stopwatch → pomodoro → clock without hanging', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await expect(page.locator('#modeIndicatorText')).toContainText('Stopwatch');
    await expect(page.locator('#stopwatchPanel')).toHaveClass(/show/);

    await page.locator('#pomodoroModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'pomodoro');
    await expect(page.locator('#modeIndicatorText')).toContainText('Pomodoro');
    await expect(page.locator('#pomodoroPanel')).toHaveClass(/show/);

    await page.locator('#clockModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'clock');
    await expect(page.locator('#modeIndicatorText')).toContainText('Clock');
    await expect(page.locator('#hoursTens canvas.digit-canvas')).toBeVisible();
  });

  test('reload stays on a coherent mode', async ({ page }) => {
    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('#clock')).toHaveAttribute('data-mode', 'stopwatch');
    await page.reload();
    await expect(page.locator('#clock')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-mode', /^(clock|stopwatch|pomodoro)$/);
    await expect(page.locator('#hoursTens canvas.digit-canvas, #clock.simple-digits .simple-digit').first()).toBeVisible();
  });
});
