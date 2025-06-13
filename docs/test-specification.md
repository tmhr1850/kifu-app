# 将棋アプリケーション テスト仕様書

## 1. テスト戦略概要

### 1.1 テスト駆動開発（TDD）アプローチ

本プロジェクトでは、**テスト駆動開発（TDD）** を全面的に採用し、以下のワークフローに従います：

1. **Red Phase（失敗）**
   - 新機能の要件を満たすテストを先に書く
   - テストが失敗することを確認

2. **Green Phase（成功）**
   - テストを通過する最小限のコードを実装
   - 全てのテストが通過することを確認

3. **Refactor Phase（改善）**
   - コードの品質を向上させる
   - テストが引き続き通過することを確認

### 1.2 テスト環境

#### 開発環境
- **OS**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **Node.js**: 18.20.8以上
- **ブラウザ**: Chrome, Firefox, Safari, Edge（最新2バージョン）

#### テスティングフレームワーク
```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

### 1.3 テストレベルと責任範囲

| テストレベル | 責任範囲 | ツール | 実行タイミング |
|------------|---------|--------|--------------|
| 単体テスト | 関数、コンポーネント | Jest, RTL | 開発中（watch mode） |
| 統合テスト | API、データフロー | Jest, MSW | プッシュ前 |
| E2Eテスト | ユーザーシナリオ | Playwright | PR作成時 |
| 視覚的回帰テスト | UI変更 | Playwright | デプロイ前 |

## 2. TDDワークフロー詳細

### 2.1 機能開発フロー

```typescript
// Step 1: テストファイルの作成
// __tests__/features/game/move-piece.test.ts

describe('駒の移動', () => {
  it('歩兵は1マス前に移動できる', () => {
    // Arrange
    const board = createBoard();
    const pawn = { type: 'pawn', position: [7, 7] };
    
    // Act
    const result = movePiece(board, pawn, [6, 7]);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.board[6][7]).toEqual(pawn);
  });
});

// Step 2: 実装（最小限）
// src/features/game/move-piece.ts
export function movePiece(board, piece, to) {
  // 最小限の実装
  return { success: true, board: updateBoard(board, piece, to) };
}

// Step 3: リファクタリング
// バリデーション、エラーハンドリング、最適化を追加
```

### 2.2 コンポーネント開発フロー

```typescript
// Step 1: コンポーネントテスト
// __tests__/components/Board.test.tsx

describe('Board Component', () => {
  it('9x9のマス目を表示する', () => {
    render(<Board />);
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(81);
  });

  it('駒をクリックすると選択状態になる', async () => {
    const user = userEvent.setup();
    render(<Board initialPieces={defaultSetup} />);
    
    const piece = screen.getByTestId('piece-7-7');
    await user.click(piece);
    
    expect(piece).toHaveClass('selected');
  });
});
```

## 3. 単体テスト仕様

### 3.1 ビジネスロジックテスト

#### 3.1.1 将棋ルールエンジン
```typescript
// src/core/rules/__tests__/
├── move-validation.test.ts    // 移動検証
├── check-detection.test.ts    // 王手判定
├── checkmate.test.ts         // 詰み判定
├── promotion.test.ts         // 成り判定
└── special-rules.test.ts     // 千日手、持将棋
```

**テストケース例**:
- 各駒の正しい移動パターン（14種類 × 平均10ケース）
- 不正な移動の拒否（各駒5ケース以上）
- 王手の検出（20ケース以上）
- 詰みの判定（30ケース以上）

#### 3.1.2 棋譜処理
```typescript
// src/core/kifu/__tests__/
├── parser.test.ts           // 棋譜パース
├── formatter.test.ts        // 棋譜フォーマット
├── converter.test.ts        // 形式変換
└── validator.test.ts        // 棋譜検証
```

### 3.2 Reactコンポーネントテスト

#### 3.2.1 UIコンポーネント
```typescript
// src/components/__tests__/
├── Board/
│   ├── Board.test.tsx
│   ├── Cell.test.tsx
│   └── Piece.test.tsx
├── GameControls/
│   ├── Timer.test.tsx
│   ├── MoveList.test.tsx
│   └── ControlButtons.test.tsx
└── shared/
    ├── Button.test.tsx
    ├── Modal.test.tsx
    └── Toast.test.tsx
```

#### 3.2.2 カスタムフック
```typescript
// src/hooks/__tests__/
├── useGame.test.ts
├── useTimer.test.ts
├── useKifu.test.ts
└── useWebSocket.test.ts
```

## 4. 統合テスト仕様

### 4.1 API統合テスト

```typescript
// src/api/__tests__/
describe('Game API', () => {
  beforeAll(() => {
    server.listen(); // MSW mock server
  });

  it('新規ゲームを作成できる', async () => {
    const game = await createGame({
      player1: 'user1',
      player2: 'user2',
      timeControl: '10+30'
    });

    expect(game).toMatchObject({
      id: expect.any(String),
      status: 'waiting',
      board: expect.any(Array)
    });
  });
});
```

### 4.2 状態管理統合テスト

```typescript
// src/store/__tests__/
describe('Game Store Integration', () => {
  it('移動操作が全ての関連状態を更新する', () => {
    const store = createTestStore();
    
    store.dispatch(movePiece({ from: [7, 7], to: [6, 7] }));
    
    const state = store.getState();
    expect(state.board[6][7]).toBeDefined();
    expect(state.moveHistory).toHaveLength(1);
    expect(state.currentPlayer).toBe('white');
  });
});
```

## 5. E2Eテスト仕様

### 5.1 Playwright設定

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

### 5.2 E2Eテストシナリオ

#### 5.2.1 ユーザー認証フロー
```typescript
// e2e/auth/login.spec.ts
test.describe('ユーザー認証', () => {
  test('メールアドレスでログインできる', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Googleアカウントでログインできる', async ({ page }) => {
    // OAuth flow mock
  });
});
```

#### 5.2.2 対局フロー
```typescript
// e2e/game/play-game.spec.ts
test.describe('対局プレイ', () => {
  test('完全な対局を行える', async ({ page }) => {
    // ログイン
    await loginAsTestUser(page);
    
    // 新規対局開始
    await page.goto('/play');
    await page.click('text=対人戦');
    await page.click('text=ローカル対局');
    
    // 初手を指す
    await page.click('[data-testid="cell-7-7"]'); // 歩を選択
    await page.click('[data-testid="cell-7-6"]'); // 移動先
    
    // 相手の手番確認
    await expect(page.locator('[data-testid="current-player"]'))
      .toHaveText('後手番');
    
    // 対局終了まで継続...
  });
});
```

#### 5.2.3 棋譜管理フロー
```typescript
// e2e/kifu/manage-kifu.spec.ts
test.describe('棋譜管理', () => {
  test('棋譜をアップロードして再生できる', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/kifu');
    
    // ファイルアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/sample.kif');
    
    // アップロード確認
    await expect(page.locator('[data-testid="kifu-list"]'))
      .toContainText('sample.kif');
    
    // 再生
    await page.click('text=再生');
    await page.click('[data-testid="play-button"]');
    
    // 棋譜が進むことを確認
    await expect(page.locator('[data-testid="move-count"]'))
      .not.toHaveText('0');
  });
});
```

### 5.3 視覚的回帰テスト

```typescript
// e2e/visual/screenshots.spec.ts
test.describe('視覚的回帰テスト', () => {
  test('ホームページのスクリーンショット', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png');
  });

  test('将棋盤の表示', async ({ page }) => {
    await page.goto('/play/local');
    await expect(page.locator('[data-testid="game-board"]'))
      .toHaveScreenshot('board-initial.png');
  });
});
```

## 6. パフォーマンステスト

### 6.1 Lighthouse CI設定

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      http://localhost:3000
      http://localhost:3000/play
      http://localhost:3000/kifu
    uploadArtifacts: true
    temporaryPublicStorage: true
```

### 6.2 パフォーマンス基準

| メトリクス | 目標値 | 最低基準 |
|-----------|--------|---------|
| First Contentful Paint | < 1.0s | < 1.8s |
| Largest Contentful Paint | < 2.5s | < 4.0s |
| Time to Interactive | < 3.8s | < 7.3s |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| First Input Delay | < 100ms | < 300ms |

## 7. テスト実行とCI/CD

### 7.1 ローカル開発時

```bash
# TDDワークフロー
npm run test:watch      # Jestをwatchモードで実行

# 全テスト実行
npm run test           # 単体・統合テスト
npm run test:e2e       # E2Eテスト（ヘッドレス）
npm run test:e2e:ui    # E2Eテスト（UI付き）

# カバレッジ確認
npm run test:coverage
```

### 7.2 GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 8. Playground MCP統合テスト

### 8.1 開発環境での確認手順

1. **ローカルサーバー起動**
   ```bash
   npm run dev
   ```

2. **Playground MCP接続**
   ```bash
   npm run playground:connect
   ```

3. **自動テスト実行**
   - リアルタイムでの画面更新確認
   - コンポーネントの動作確認
   - ネットワークリクエストの監視

### 8.2 共有とフィードバック

```typescript
// playground.config.ts
export default {
  shareUrl: true,
  autoScreenshot: true,
  feedbackWidget: true,
  performanceMonitoring: true,
  hotReload: true
};
```

## 9. テストデータ管理

### 9.1 フィクスチャ

```
fixtures/
├── boards/          # 盤面状態
├── games/           # ゲームデータ
├── kifu/            # 棋譜ファイル
└── users/           # ユーザーデータ
```

### 9.2 テストユーティリティ

```typescript
// src/test-utils/
├── render.tsx       // カスタムrender関数
├── fixtures.ts      // テストデータ生成
├── mocks.ts        // APIモック
└── helpers.ts      // ヘルパー関数
```

## 10. バグトラッキングと品質メトリクス

### 10.1 バグ分類

| 優先度 | 説明 | 対応期限 |
|--------|------|---------|
| P0 | クリティカル（サービス停止） | 即時 |
| P1 | 重大（主要機能の不具合） | 24時間以内 |
| P2 | 中程度（一部機能の不具合） | 1週間以内 |
| P3 | 軽微（UIの不具合など） | 次回リリース |

### 10.2 品質ゲート

- コードカバレッジ: 80%以上
- E2Eテスト成功率: 95%以上
- パフォーマンススコア: 90以上
- セキュリティ脆弱性: 0件（High/Critical）

## 11. テスト完了基準

### 11.1 機能別完了基準

- [ ] 全ての受入基準に対するテストが存在
- [ ] 単体テストカバレッジ80%以上
- [ ] E2Eシナリオが全て成功
- [ ] パフォーマンス基準を満たす
- [ ] セキュリティテストに合格

### 11.2 リリース判定基準

- [ ] 全優先度P0, P1バグが解決済み
- [ ] 回帰テストが全て成功
- [ ] ステークホルダーによる承認
- [ ] 本番環境でのスモークテスト成功