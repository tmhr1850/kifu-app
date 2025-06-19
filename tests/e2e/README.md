# E2E Tests with Playwright

このディレクトリには、Playwrightを使用したEnd-to-End（E2E）テストが含まれています。

## 概要

E2Eテストは、実際のブラウザ環境でアプリケーション全体の動作を検証します。主要なユーザーフローと機能が正しく動作することを確認します。

## ディレクトリ構造

```
tests/e2e/
├── fixtures/          # テストフィクスチャとヘルパー
│   ├── test-base.ts   # カスタムテストフィクスチャ
│   └── test-data.ts   # テストデータとヘルパー関数
├── pages/             # Page Object Model
│   ├── BasePage.ts    # 基底ページクラス
│   ├── HomePage.ts    # ホームページ
│   ├── LoginPage.ts   # ログインページ
│   └── GamePage.ts    # ゲームページ
├── specs/             # テストスペック
│   ├── navigation.spec.ts  # ナビゲーションテスト
│   ├── game-flow.spec.ts   # ゲームフローテスト
│   ├── auth-flow.spec.ts   # 認証フローテスト
│   └── analysis.spec.ts    # 解析機能テスト
└── screenshots/       # スクリーンショット（自動生成）
```

## セットアップ

### 1. Playwrightのインストール

```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール
npm run postinstall
# または
./scripts/install-playwright.sh
```

### 2. 環境変数の設定（オプション）

認証テストを実行する場合は、`.env.test`ファイルを作成し、以下の環境変数を設定します：

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## テストの実行

### 基本的な実行方法

```bash
# すべてのテストを実行
npm run test:e2e

# UIモードで実行（インタラクティブ）
npm run test:e2e:ui

# デバッグモードで実行
npm run test:e2e:debug
```

### 特定のブラウザでの実行

```bash
# Chromiumのみ
npm run test:e2e -- --project=chromium

# Firefoxのみ
npm run test:e2e -- --project=firefox

# WebKit（Safari）のみ
npm run test:e2e -- --project=webkit
```

### 特定のテストファイルの実行

```bash
# ナビゲーションテストのみ
npm run test:e2e -- tests/e2e/specs/navigation.spec.ts

# 認証フローテストのみ
npm run test:e2e -- tests/e2e/specs/auth-flow.spec.ts
```

### ヘッドレスモードの無効化

```bash
# ブラウザを表示して実行
npm run test:e2e -- --headed
```

## Page Object Model

このE2Eテストでは、Page Object Model（POM）パターンを採用しています。各ページの要素と操作をクラスとしてカプセル化することで、テストの保守性を向上させています。

### 例：新しいページオブジェクトの作成

```typescript
// tests/e2e/pages/NewPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
  readonly selectors = {
    mainElement: '[data-testid="main-element"]',
    submitButton: 'button[type="submit"]',
  };

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate('/new-page');
    await this.waitForPageLoad();
  }

  async submitForm(data: any) {
    // フォーム送信ロジック
  }
}
```

## テストの書き方

### 基本的なテスト構造

```typescript
import { test, expect } from '../fixtures/test-base';

test.describe('機能名', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前の準備
  });

  test('テストケース名', async ({ page, homePage }) => {
    // Arrange: 準備
    await homePage.goto();
    
    // Act: 実行
    await homePage.navigateToAIGame();
    
    // Assert: 検証
    await expect(page).toHaveURL(/\/ai$/);
  });
});
```

### カスタムフィクスチャの使用

```typescript
test('ページオブジェクトを使用したテスト', async ({ homePage, gamePage }) => {
  await homePage.goto();
  await homePage.navigateToAIGame();
  await gamePage.waitForGameReady();
  
  // ゲーム操作
  await gamePage.makeMove(6, 6, 5, 6);
});
```

## ベストプラクティス

1. **セレクタの優先順位**
   - `data-testid`属性を最優先
   - ロールベースのセレクタ（`role`）
   - テキストベースのセレクタ（最終手段）

2. **待機処理**
   - 明示的な待機を使用（`waitForSelector`、`waitForURL`）
   - 固定時間の待機（`waitForTimeout`）は避ける

3. **テストの独立性**
   - 各テストは独立して実行可能にする
   - テスト間で状態を共有しない

4. **エラーハンドリング**
   - 期待される失敗と予期しない失敗を区別
   - スクリーンショットを活用してデバッグ

## CI/CD統合

GitHub ActionsでE2Eテストが自動実行されます：

- プッシュ時（main、developブランチ）
- プルリクエスト時
- 全ブラウザで並列実行
- テスト結果のアーティファクト保存

## トラブルシューティング

### ブラウザがインストールされていない

```bash
npx playwright install --with-deps
```

### タイムアウトエラー

`playwright.config.ts`でタイムアウトを調整：

```typescript
use: {
  // アクションのタイムアウト
  actionTimeout: 10000,
  // ナビゲーションのタイムアウト
  navigationTimeout: 30000,
}
```

### ローカル環境とCIの差異

- ローカル開発サーバーの起動を確認
- 環境変数の設定を確認
- ネットワーク設定を確認

## 関連ドキュメント

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [テストのベストプラクティス](https://playwright.dev/docs/best-practices)