import { test, expect } from '../fixtures/test-base';

test.describe('ナビゲーション', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('ホームページが正しく表示される', async ({ page, homePage }) => {
    await expect(page).toHaveTitle(/将棋|Shogi/);
    expect(await homePage.isGameBoardVisible()).toBeTruthy();
  });

  test('AI対戦ページへのナビゲーション', async ({ page }) => {
    await page.click('a[href="/ai"]');
    await page.waitForURL('**/ai');
    await expect(page).toHaveURL(/\/ai$/);
  });

  test('オンライン対戦ページへのナビゲーション', async ({ page }) => {
    await page.click('a[href="/online"]');
    await page.waitForURL('**/online');
    await expect(page).toHaveURL(/\/online$/);
  });

  test('棋譜一覧ページへのナビゲーション', async ({ page }) => {
    await page.click('a[href="/kifu"]');
    await page.waitForURL('**/kifu');
    await expect(page).toHaveURL(/\/kifu$/);
  });

  test('解析ページへのナビゲーション', async ({ page }) => {
    await page.click('a[href="/analysis"]');
    await page.waitForURL('**/analysis');
    await expect(page).toHaveURL(/\/analysis$/);
  });

  test('ログインページへのナビゲーション', async ({ page }) => {
    // Check if login link exists (user not logged in)
    const loginLink = page.locator('a[href="/auth/login"]');
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForURL('**/auth/login');
      await expect(page).toHaveURL(/\/auth\/login$/);
    }
  });

  test('モバイルビューでのナビゲーション', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile menu button exists
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.count() > 0) {
      await menuButton.click();
      // Verify menu items are visible
      await expect(page.locator('a[href="/ai"]')).toBeVisible();
      await expect(page.locator('a[href="/online"]')).toBeVisible();
      await expect(page.locator('a[href="/kifu"]')).toBeVisible();
    }
  });

  test('404ページのハンドリング', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Check for 404 content or redirect to home
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|見つかりません|not found/i);
  });
});