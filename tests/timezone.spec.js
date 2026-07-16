// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Timezone indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clock7.html');
    await expect(page.locator('#clock')).toBeVisible();
  });

  test('shows cute tz chip beside clock mode indicator', async ({ page }) => {
    await expect(page.locator('#tzChip')).toBeVisible();
    await expect(page.locator('#tzChip')).toHaveClass(/visible/);
    await expect(page.locator('#tzChipLabel')).not.toBeEmpty();

    const beside = await page.evaluate(() => {
      const row = document.getElementById('modeRow');
      const mode = document.getElementById('modeIndicator');
      const chip = document.getElementById('tzChip');
      if (!row || !mode || !chip) return null;
      const mr = mode.getBoundingClientRect();
      const cr = chip.getBoundingClientRect();
      return {
        chipInRow: row.contains(chip) && row.contains(mode),
        sameRow: Math.abs(mr.top - cr.top) < 28,
        chipRightOfMode: cr.left >= mr.left - 4,
      };
    });
    expect(beside).toBeTruthy();
    expect(beside.chipInRow).toBe(true);
    expect(beside.sameRow).toBe(true);
    expect(beside.chipRightOfMode).toBe(true);

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

  test('hides tz chip in stopwatch and pomodoro', async ({ page }) => {
    await expect(page.locator('#tzChip')).toBeVisible();

    await page.locator('#stopwatchModeBtn').click();
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'stopwatch');
    await expect(page.locator('#tzChip')).not.toBeVisible();
    await expect(page.locator('#tzChip')).not.toHaveClass(/visible/);

    await page.locator('#pomodoroModeBtn').click();
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'pomodoro');
    await expect(page.locator('#tzChip')).not.toBeVisible();

    await page.locator('#clockModeBtn').click();
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'clock');
    await expect(page.locator('#tzChip')).toBeVisible();
    await expect(page.locator('#tzChip')).toHaveClass(/visible/);
  });

  test('dropdown includes Brussels + Hong Kong, UTC labels, offset sort', async ({ page }) => {
    await page.locator('#settingsOpenBtn').click();
    const select = page.locator('#timezoneSelect');
    await expect(select).toBeVisible();

    const data = await select.evaluate((el) => {
      const opts = Array.from(el.options).map((o) => ({
        value: o.value,
        text: o.textContent || '',
      }));
      return {
        opts,
        hasBrussels: opts.some((o) => o.value === 'Europe/Brussels'),
        hasHongKong: opts.some((o) => o.value === 'Asia/Hong_Kong'),
        autoFirst: opts[0] && opts[0].value === '',
      };
    });

    expect(data.autoFirst).toBe(true);
    expect(data.hasBrussels).toBe(true);
    expect(data.hasHongKong).toBe(true);
    expect(data.opts[0].text).toMatch(/UTC[+-]\d/i);

    const cityOpts = data.opts.filter((o) => o.value);
    for (const o of cityOpts) {
      expect(o.text, o.value).toMatch(/·\s*UTC[+-]/i);
    }

    const brussels = cityOpts.find((o) => o.value === 'Europe/Brussels');
    expect(brussels.text).toMatch(/Brussels/i);
    expect(brussels.text).toMatch(/UTC[+-]/i);

    const hk = cityOpts.find((o) => o.value === 'Asia/Hong_Kong');
    expect(hk.text).toMatch(/Hong Kong/i);
    expect(hk.text).toMatch(/UTC\+8/i);

    // Sorted by UTC offset ascending (ties alphabetical by city label)
    const offsets = await select.evaluate((el) => {
      function parseMins(text) {
        const m = text.match(/UTC([+-])(\d{1,2})(?::(\d{2}))?/i);
        if (!m) return null;
        const sign = m[1] === '-' ? -1 : 1;
        return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3] || '0', 10));
      }
      return Array.from(el.options)
        .filter((o) => o.value)
        .map((o) => ({
          value: o.value,
          mins: parseMins(o.textContent || ''),
          label: (o.textContent || '').replace(/^[^\s]+\s/, '').replace(/\s·\s*UTC.*$/i, '').trim(),
        }));
    });

    for (let i = 1; i < offsets.length; i++) {
      const prev = offsets[i - 1];
      const cur = offsets[i];
      expect(prev.mins, `${prev.value} vs ${cur.value}`).not.toBeNull();
      expect(cur.mins, cur.value).not.toBeNull();
      if (prev.mins === cur.mins) {
        expect(prev.label.localeCompare(cur.label)).toBeLessThanOrEqual(0);
      } else {
        expect(prev.mins).toBeLessThanOrEqual(cur.mins);
      }
    }

    await select.selectOption('Europe/Brussels');
    await page.locator('#settingsCloseBtn').click();
    await expect(page.locator('#tzChipLabel')).toHaveText('Brussels');
  });
});
