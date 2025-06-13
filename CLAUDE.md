# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際に Claude Code (claude.ai/code) に対するガイダンスを提供します。

## プロジェクト概要

これは App Router、TypeScript、Tailwind CSS v4 を使用した Next.js 15.3.3 アプリケーションです。プロジェクト名「kifu-app」は寄付・貢献アプリケーション向けのものと思われます。

## 開発コマンド

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

## アーキテクチャ

これは以下の構造を持つ Next.js App Router アプリケーションです：

- `src/app/` - App Router のページとレイアウト
- `src/app/layout.tsx` - Geist フォント設定を含むルートレイアウト
- `src/app/page.tsx` - ホームページコンポーネント
- `src/app/globals.css` - Tailwind ディレクティブを含むグローバルスタイル

このプロジェクトで使用している技術：

- React 19.0.0
- 厳密モード有効の TypeScript
- Tailwind CSS v4（PostCSS プラグイン経由）
- パスエイリアス：`@/*`は`./src/*`にマップされる

## 設定に関する注意事項

- **Tailwind CSS v4**：新しい PostCSS プラグインアプローチ（`@tailwindcss/postcss`）を使用
- **TypeScript**：ES2017 ターゲットで厳密モードが有効
- **ESLint**：Next.js の Core Web Vitals と TypeScript ルールで設定済み
