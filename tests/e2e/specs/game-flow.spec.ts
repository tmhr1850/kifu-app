import { test, expect } from '../fixtures/test-base';

test.describe('ゲームページ', () => {
  test('ホームページのゲーム画面が表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible({ timeout: 8000 });
  });
});