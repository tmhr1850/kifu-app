import { test, expect } from '../fixtures/test-base';

test.describe('基本的なナビゲーション', () => {
  test('ホームページが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/将棋|Shogi/, { timeout: 8000 });
  });

  test('404ページの確認', async ({ page }) => {
    await page.goto('/non-existent-page');
    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
  });
});