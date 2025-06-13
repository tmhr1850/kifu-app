<div align="center">

  <h1>🎯 Kifu App - 将棋アプリケーション</h1>

  <p>
    <img alt="GitHub" src="https://img.shields.io/github/license/tmhr1850/kifu-app" />
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/tmhr1850/kifu-app" />
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/tmhr1850/kifu-app" />
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/tmhr1850/kifu-app" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15.3.3-black?logo=next.js" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css" />
  </p>

  <p>
    将棋の対局を楽しみ、棋譜の記録・管理・共有ができる次世代Webアプリケーション<br>
    <b>初心者から上級者まで</b>、すべての将棋愛好家のために✨
  </p>

  <p>
    <a href="README_EN.md">🇺🇸 English</a> |
    <a href="README.md">🇯🇵 日本語</a>
  </p>
</div>

## 📖 目次

- [🌟 主な機能](#-主な機能)
- [🚀 はじめに](#-はじめに)
- [💻 技術スタック](#-技術スタック)
- [🛠️ インストール](#️-インストール)
- [🎮 使い方](#-使い方)
- [📋 開発ロードマップ](#-開発ロードマップ)
- [🤝 コントリビューション](#-コントリビューション)
- [📄 ライセンス](#-ライセンス)

## 🌟 主な機能

### 🎯 対局機能
- **多様な対局モード**
  - 👥 ローカル対局（同一デバイスでの対面対局）
  - 🌐 オンライン対局（リアルタイム通信）
  - 🤖 AI対局（初級・中級・上級）
- **詳細な対局設定**
  - ⏱️ 持ち時間管理（切れ負け、秒読み、フィッシャールール）
  - 🎯 先手・後手の選択
  - 💭 AI思考時間の調整

### 📝 棋譜管理機能
- **保存・読み込み**
  - 💾 対局の自動保存
  - 📥 KIF/KI2/CSA形式のインポート
  - 📤 多様な形式でのエクスポート
- **検索・整理**
  - 🔍 対局日時、対局者名、戦型での検索
  - 📊 サムネイル付き一覧表示
  - ⭐ お気に入り登録機能

### 🔍 棋譜再生・分析機能
- **再生コントロール**
  - ⏮️⏭️ 一手進む/戻る
  - 🎬 自動再生（速度調整可能）
  - 🌲 分岐変化の管理
- **分析ツール**
  - 💬 各手へのコメント追加
  - 📈 AI局面評価
  - 📊 形勢判断グラフ

### 👤 ユーザー機能
- **アカウント管理**
  - 📧 メールアドレス認証
  - 🔐 ソーシャルログイン（Google, Twitter）
  - 👤 プロフィール設定
- **統計・成績**
  - 📊 対局成績の表示
  - 🏆 レーティングシステム
  - 📈 戦型別分析

## 🚀 はじめに

### 動作環境

- Node.js 18.0以上
- npm 9.0以上
- モダンブラウザ（Chrome、Firefox、Safari、Edge の最新版）

### 対応デバイス

- 💻 デスクトップPC
- 📱 タブレット
- 📱 スマートフォン（iOS 14以上、Android 10以上）

## 💻 技術スタック

- **フロントエンド**
  - ⚛️ Next.js 15.3.3 (App Router)
  - 📘 TypeScript
  - 🎨 Tailwind CSS v4
  - 🔄 React Context API / Zustand

- **バックエンド**
  - 🚀 Next.js API Routes
  - 🔐 NextAuth.js
  - 🔌 Socket.io / WebSocket

- **データベース**
  - 🐘 PostgreSQL
  - 🚀 Redis（キャッシュ）

- **インフラ**
  - ▲ Vercel
  - 🌐 Vercel Edge Network
  - 📊 Vercel Analytics

## 🛠️ インストール

### 1. リポジトリをクローン

```bash
git clone https://github.com/tmhr1850/kifu-app.git
cd kifu-app
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルを作成し、必要な環境変数を設定します：

```env
# 認証関連
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/kifu_app

# その他の設定
REDIS_URL=redis://localhost:6379
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてアプリケーションにアクセスします。

## 🎮 使い方

### 基本的な使い方

1. **対局を始める**
   - ホーム画面から「対局開始」をクリック
   - 対局モードを選択（ローカル/オンライン/AI）
   - 必要に応じて詳細設定を行う

2. **棋譜を管理する**
   - 対局終了後、自動的に棋譜が保存されます
   - 「棋譜一覧」から過去の対局を確認
   - KIF形式でのインポート/エクスポートが可能

3. **棋譜を分析する**
   - 保存した棋譜を選択して「再生」
   - 各手にコメントを追加
   - AI分析で局面評価を確認

### コマンド一覧

```bash
# 開発サーバーを起動
npm run dev

# 本番用にビルド
npm run build

# 本番サーバーを起動
npm run start

# リンターを実行
npm run lint

# テストを実行
npm run test

# テストカバレッジを確認
npm run test:coverage
```

## 📋 開発ロードマップ

### ✅ Phase 1: 基本機能実装（2ヶ月）
- [x] 将棋盤UI実装
- [x] ローカル対局機能
- [x] 基本的な棋譜保存・読み込み

### 🚧 Phase 2: 棋譜管理機能（1.5ヶ月）
- [ ] 棋譜一覧・検索機能
- [ ] 棋譜再生・分析機能
- [ ] エクスポート機能

### 📅 Phase 3: オンライン機能（2ヶ月）
- [ ] ユーザー認証システム
- [ ] オンライン対局機能
- [ ] リアルタイム通信実装

### 📅 Phase 4: AI機能（1.5ヶ月）
- [ ] AI対局機能
- [ ] 局面分析機能
- [ ] 棋力判定機能

### 📅 Phase 5: 最適化・公開準備（1ヶ月）
- [ ] パフォーマンス最適化
- [ ] セキュリティ監査
- [ ] ユーザビリティテスト

### 🔮 将来的な拡張機能
- 🏆 大会機能（トーナメント・リーグ戦）
- 📚 学習機能（詰将棋・定跡学習）
- 💬 コミュニティ機能
- 📺 プロ棋戦データ連携

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

---

<div align="center">
  <p>
    Made with ❤️ by <a href="https://github.com/tmhr1850">tmhr1850</a>
  </p>
  <p>
    <a href="https://github.com/tmhr1850/kifu-app/issues">🐛 バグ報告</a> •
    <a href="https://github.com/tmhr1850/kifu-app/issues">✨ 機能リクエスト</a>
  </p>
</div>