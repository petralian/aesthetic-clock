// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Timezone indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
  });

  test('shows cute tz chip and overrides clock via settings', async ({ page }) => {
    await expect(page.locator('#tzChip')).toBeVisible();
    await expect(page.locator('#tzChipLabel')).not.toBeEmpty();

    await page.locator('#settingsOpenBtn').click();
    await page.locator('#timezoneSelect').selectOption('Asia/Tokyo');
    await page.locator('#settingsCloseBtn').click();

    await expect(page.locator('#tzChipLabel')).toHaveText('Tokyo');
    await expect(page.locator('#tzChipEmoji')).toHaveText('🗼');
    await expect(page.locator('#quoteDisplay')).toBeVisible();
    await expect(page.locator('#quoteDisplay')).not.toBeEmpty();

    await page.waitForTimeout(150);
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'clock');
  });
});
