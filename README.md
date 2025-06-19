<div align="center">
  
  <h1>🎯 kifu-app (棋譜アプリ)</h1>

  <p>
    <img alt="GitHub" src="https://img.shields.io/github/license/tmhr1850/kifu-app" />
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/tmhr1850/kifu-app" />
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/tmhr1850/kifu-app" />
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/tmhr1850/kifu-app" />
  </p>

  <p>
    将棋の対局を楽しみ、棋譜の記録・管理・共有ができるモダンなWebアプリケーション<br/>
    <b>初心者から上級者まで</b>、すべての将棋愛好家のための統合プラットフォーム✨
  </p>

  <p>
    <a href="README_EN.md">🇺🇸 English</a> |
    <a href="README.md">🇯🇵 日本語</a>
  </p>
</div>

## 📖 概要

kifu-app は、将棋の対局と棋譜管理を一体化した次世代の Web アプリケーションです。リアルタイムオンライン対局、AI 対戦、棋譜の保存・分析・共有など、将棋を楽しむために必要なすべての機能を提供します。

## ✨ 主な機能

### 🎮 対局機能

- **人対人の対局** - ローカル対局とリアルタイムオンライン対局に対応
- **AI 対局** - 初級・中級・上級の難易度選択可能
- **持ち時間管理** - 切れ負け、秒読み、フィッシャールールに対応

### 📝 棋譜管理

- **自動保存** - 対局終了後に自動で棋譜を保存
- **インポート/エクスポート** - KIF/KI2/CSA 形式に対応
- **検索機能** - 対局日時、対局者名、戦型での絞り込み

### 🔍 分析機能

- **棋譜再生** - 一手ずつの再生、自動再生、特定手数へのジャンプ
- **分岐管理** - 変化手順の追加・削除、ツリー表示
- **コメント機能** - 各手へのコメント追加と局面評価

### 👤 ユーザー機能

- **アカウント管理** - メール認証、ソーシャルログイン対応
- **プロフィール** - 棋力設定、アバター、対局成績の表示

## 🚀 技術スタック

- **フロントエンド**: Next.js 15.3.3 (App Router), React 19.0.0, TypeScript
- **スタイリング**: Tailwind CSS v4
- **認証**: NextAuth.js (予定)
- **リアルタイム通信**: Socket.io / WebSocket (予定)
- **データベース**: PostgreSQL (予定)

## 📦 インストール

```bash
# リポジトリのクローン
git clone https://github.com/tmhr1850/kifu-app.git
cd kifu-app

# 依存関係のインストール
npm install

# 環境変数の設定（必要に応じて）
cp .env.example .env.local

# 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 🔧 環境変数の設定

アプリケーションの各機能を有効にするために、以下の環境変数を設定することができます。

### 📁 .env.local ファイルを作成

```bash
# Supabase Configuration (データベース・認証)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Sentry Configuration (エラー監視・パフォーマンス監視)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Analytics Configuration (アナリティクス)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/api

# Alert Configuration (アラート通知)
NEXT_PUBLIC_ALERT_WEBHOOK=https://your-webhook-url.com/alert

# Environment
NODE_ENV=development
```

### 🔧 設定項目の説明

#### Supabase（必須 - データベース・認証機能）

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクトの URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase の匿名キー

#### Sentry（オプション - エラー監視）

- `NEXT_PUBLIC_SENTRY_DSN`: Sentry プロジェクトの DSN
- `SENTRY_ORG`: Sentry 組織名
- `SENTRY_PROJECT`: Sentry プロジェクト名

#### Analytics（オプション - 使用状況分析）

- `NEXT_PUBLIC_ANALYTICS_ENDPOINT`: アナリティクス API のエンドポイント

#### Alert（オプション - システム通知）

- `NEXT_PUBLIC_ALERT_WEBHOOK`: アラート通知用の Webhook URL

### 📝 注意事項

- 環境変数が設定されていない場合、該当機能は自動的に無効化されます
- 本番環境では適切なセキュリティ設定を行ってください
- `.env.local`ファイルは Git にコミットしないでください

## 🛠️ 開発コマンド

```bash
# 開発サーバーを起動
npm run dev

# 本番用にビルド
npm run build

# 本番サーバーを起動
npm run start

# リンターを実行
npm run lint
```

## 📁 プロジェクト構造

```
kifu-app/
├── src/
│   └── app/              # Next.js App Router
│       ├── layout.tsx    # ルートレイアウト
│       ├── page.tsx      # ホームページ
│       └── globals.css   # グローバルスタイル
├── public/               # 静的ファイル
├── docs/                 # ドキュメント
│   ├── requirements.md   # 要件定義書
│   └── test-specification.md # テスト仕様書
└── package.json          # プロジェクト設定
```

## 🗓️ 開発ロードマップ

### Phase 1: 基本機能実装（2 ヶ月）

- [ ] 将棋盤 UI 実装
- [ ] ローカル対局機能
- [ ] 基本的な棋譜保存・読み込み

### Phase 2: 棋譜管理機能（1.5 ヶ月）

- [ ] 棋譜一覧・検索機能
- [ ] 棋譜再生・分析機能
- [ ] エクスポート機能

### Phase 3: オンライン機能（2 ヶ月）

- [ ] ユーザー認証システム
- [ ] オンライン対局機能
- [ ] リアルタイム通信実装

### Phase 4: AI 機能（1.5 ヶ月）

- [ ] AI 対局機能
- [ ] 局面分析機能
- [ ] 棋力判定機能

### Phase 5: 最適化・公開準備（1 ヶ月）

- [ ] パフォーマンス最適化
- [ ] セキュリティ監査
- [ ] ユーザビリティテスト

## 💻 動作環境

### ブラウザ要件

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

### モバイル対応

- iOS 14 以上
- Android 10 以上

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を行う場合は、まず issue を作成して変更内容について議論してください。

1. プロジェクトをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 📞 お問い合わせ

質問や提案がある場合は、[Issues](https://github.com/tmhr1850/kifu-app/issues)でお知らせください。

---

<div align="center">
  Made with ❤️ by tmhr1850
</div>
