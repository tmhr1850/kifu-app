import { test, expect } from '../fixtures/test-base';

test.describe('認証フロー', () => {
  test('ログインページの表示', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // ログインフォームの要素が表示されていることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('無効な認証情報でのログイン試行', async ({ loginPage }) => {
    await loginPage.goto();
    
    // 無効な認証情報でログイン
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // エラーメッセージが表示されることを確認
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('必須フィールドの検証', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // 空のフォームで送信
    await page.click('button[type="submit"]');
    
    // HTML5バリデーションまたはカスタムエラーを確認
    const emailInput = page.locator('input[type="email"]');
    const isEmailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailInvalid).toBeTruthy();
  });

  test('サインアップページへのナビゲーション', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.navigateToSignup();
    
    await expect(page).toHaveURL(/\/auth\/signup$/);
    await expect(page.locator('h1, h2')).toContainText(/サインアップ|新規登録|Sign up/i);
  });

  test('パスワードリセットページへのナビゲーション', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.navigateToResetPassword();
    
    await expect(page).toHaveURL(/\/auth\/reset-password$/);
    await expect(page.locator('h1, h2')).toContainText(/パスワード|リセット|reset/i);
  });

  test('ログイン後のリダイレクト', async ({ page }) => {
    // 環境変数でテストユーザーが設定されている場合のみ実行
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;
    
    if (!testEmail || !testPassword) {
      test.skip();
      return;
    }

    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // ホームページにリダイレクトされることを確認
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL(/\/$/);
  });

  test('ログアウト機能', async ({ page, homePage }) => {
    // ログイン状態のテストは環境依存のためスキップ
    const isLoggedIn = await homePage.isUserLoggedIn();
    if (!isLoggedIn) {
      test.skip();
      return;
    }

    await homePage.goto();
    await homePage.logout();
    
    // ログインボタンが表示されることを確認
    await expect(page.locator('a[href="/auth/login"]')).toBeVisible();
  });

  test('認証が必要なページへのアクセス', async ({ page }) => {
    // ログアウト状態を確認
    await page.goto('/');
    const loginLink = page.locator('a[href="/auth/login"]');
    if (await loginLink.count() === 0) {
      test.skip(); // Already logged in
      return;
    }

    // プロフィールページにアクセス
    await page.goto('/profile');
    
    // ログインページにリダイレクトされることを確認
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
  });
});