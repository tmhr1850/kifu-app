import { test, expect } from '../fixtures/test-base';

test.describe('解析ページ', () => {
  test('解析ページが表示される', async ({ page }) => {
    await page.goto('/analysis');
    await expect(page.locator('body')).toBeVisible({ timeout: 8000 });
  });
});