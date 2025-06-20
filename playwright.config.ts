import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Global setup */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  /* 超高速化設定 */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // リトライなし
  workers: 1, // 1つのワーカーで実行
  reporter: 'line', // 最低限のレポート
  timeout: 20 * 1000, // 20秒タイムアウト
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off', // トレース無効

    /* Take screenshot on failure */
    screenshot: 'off', // スクリーンショット無効
    
    /* Navigation timeout */
    navigationTimeout: 8 * 1000, // 8秒
    
    /* Action timeout */
    actionTimeout: 3 * 1000, // 3秒

    video: 'off', // ビデオ無効
  },

  /* Configure projects for major browsers - 高速化のため最小限に */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 開発中は1つのブラウザのみでテスト実行を高速化
    // 本番時は以下のコメントを外してクロスブラウザテストを実行
    /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000, // 30秒で高速起動
    stdout: 'ignore',
    stderr: 'pipe',
  },
});