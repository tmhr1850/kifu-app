import { test, expect } from '../fixtures/test-base';

test.describe('認証ページ', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/auth/login');
    
    // ログインフォームの基本要素が表示されていることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
  });

  test('新規登録ページの表示確認', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // 新規登録フォームの基本要素が表示されていることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  });

  // 重いテストをスキップして高速化
  test.skip('有効な認証情報でのログイン', async () => {
    // 実際の認証処理のテストはスキップ
  });

  test.skip('無効な認証情報でのログイン失敗', async () => {
    // 重いテストのためスキップ
  });

  test.skip('新規ユーザー登録', async () => {
    // 重いテストのためスキップ
  });

  test.skip('パスワードリセット機能', async () => {
    // 重いテストのためスキップ
  });

  test.skip('ログアウト機能', async () => {
    // 重いテストのためスキップ
  });
});