# 🛡️ Sentry 設定ガイド

このガイドでは、kifu-app で Sentry エラー監視を有効にする方法を説明します。

## 📋 前提条件

1. **Sentry アカウントの作成**

   - [Sentry.io](https://sentry.io)でアカウントを作成
   - 無料プランでも十分な機能が利用可能

2. **Sentry プロジェクトの作成**
   - ダッシュボードで「Create Project」
   - プラットフォームとして「Next.js」を選択

## 🔧 環境変数の設定

### 1. .env.local ファイルの作成

プロジェクトルートに`.env.local`ファイルを作成し、以下の環境変数を追加：

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Optional: アップロード用の認証トークン
SENTRY_AUTH_TOKEN=your-auth-token
```

### 2. 各設定値の取得方法

#### DSN (Data Source Name)

1. Sentry プロジェクトの「Settings」→「Client Keys (DSN)」
2. 「DSN」をコピーして`NEXT_PUBLIC_SENTRY_DSN`に設定

#### Organization & Project

1. Sentry ダッシュボードの右上のアバター →「Organization settings」
2. 「Slug」の値を`SENTRY_ORG`に設定
3. プロジェクト設定の「Slug」を`SENTRY_PROJECT`に設定

#### Auth Token（オプション）

1. 「Settings」→「Account」→「API」→「Auth Tokens」
2. 「Create New Token」でトークンを生成
3. スコープ：`project:read`, `project:releases`, `org:read`

## 🎯 設定例

```bash
# 実際の設定例
NEXT_PUBLIC_SENTRY_DSN=https://abcd1234@o123456.ingest.sentry.io/7890123
SENTRY_ORG=my-company
SENTRY_PROJECT=kifu-app
SENTRY_AUTH_TOKEN=sntrys_1234567890abcdef
```

## ✅ 設定確認

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. ブラウザのコンソールで確認

- エラーがない場合：「Sentry DSN not configured. Sentry monitoring is disabled.」が表示されない
- エラーがある場合：設定された通知が表示される

### 3. テストエラーの送信

ブラウザのコンソールで以下を実行：

```javascript
throw new Error("Sentry test error");
```

Sentry ダッシュボードでエラーが受信されることを確認

## 🔒 セキュリティ注意事項

1. **`.env.local`ファイルを Git にコミットしない**

   - `.gitignore`に追加されていることを確認

2. **本番環境では適切な権限設定**

   - Auth Token は最小限の権限のみ付与
   - 定期的にトークンをローテーション

3. **DSN の公開について**
   - `NEXT_PUBLIC_SENTRY_DSN`はクライアントサイドで使用されるため、ブラウザで見える
   - これは設計上正常な動作です

## 🚫 Sentry を無効にする場合

環境変数を設定しなければ、Sentry は自動的に無効化されます：

```bash
# これらの行をコメントアウトまたは削除
# NEXT_PUBLIC_SENTRY_DSN=...
# SENTRY_ORG=...
# SENTRY_PROJECT=...
```

## 📊 監視できる機能

Sentry が有効になると、以下が監視されます：

### エラー監視

- JavaScript エラー
- Unhandled Promises
- React Error Boundaries

### パフォーマンス監視

- ページロード時間
- API レスポンス時間
- Core Web Vitals

### セッション再生

- ユーザーの操作を再生してエラーの原因を特定
- プライバシーに配慮した設定（テキストマスク等）

## 🔧 追加設定

### カスタムエラー追跡

```typescript
import { captureException } from "@/utils/monitoring";

try {
  // 何らかの処理
} catch (error) {
  captureException(error as Error, {
    context: "game-logic",
    userId: user.id,
  });
}
```

### ユーザーコンテキスト設定

```typescript
import { setUserContext } from "@/utils/monitoring";

setUserContext({
  id: user.id,
  email: user.email,
  username: user.username,
});
```

## 📞 サポート

設定で問題が発生した場合：

1. [Sentry 公式ドキュメント](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
2. [GitHub の Issues](https://github.com/tmhr1850/kifu-app/issues)

---

**参考リンク：**

- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Pricing](https://sentry.io/pricing/)
- [Core Web Vitals](https://web.dev/vitals/)
