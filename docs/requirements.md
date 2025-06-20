# 将棋アプリケーション要件定義書

## 1. プロジェクト概要

### 1.1 プロジェクト名
kifu-app (棋譜アプリ)

### 1.2 目的
将棋の対局を楽しみ、棋譜の記録・管理・共有ができるWebアプリケーションの開発

### 1.3 対象ユーザー
- 将棋初心者から上級者まで
- 棋譜を記録・分析したい将棋愛好家
- オンラインで対局を楽しみたいユーザー

## 2. 機能要件

### 2.1 基本機能

#### 2.1.1 対局機能
- **人対人の対局**
  - ローカル対局（同一デバイスでの対局）
  - オンライン対局（リアルタイム通信）
- **AI対局**
  - 難易度選択（初級・中級・上級）
  - AI思考時間の設定
- **持ち時間管理**
  - 切れ負け、秒読み、フィッシャールール対応

#### 2.1.2 棋譜管理機能
- **棋譜の保存**
  - 対局終了後の自動保存
  - 手動保存（対局途中でも可能）
- **棋譜の読み込み**
  - KIF/KI2形式のインポート
  - CSA形式のインポート
- **棋譜の出力**
  - KIF/KI2形式でのエクスポート
  - 画像形式での局面出力
- **棋譜の検索・フィルタリング**
  - 対局日時、対局者名、戦型での検索

#### 2.1.3 棋譜再生・分析機能
- **再生コントロール**
  - 一手進む/戻る
  - 最初/最後へジャンプ
  - 自動再生（速度調整可能）
- **分岐変化の管理**
  - 変化手順の追加・削除
  - 分岐のツリー表示
- **コメント機能**
  - 各手へのコメント追加
  - 局面評価値の表示（AI分析時）

#### 2.1.4 ユーザー管理機能
- **アカウント登録・ログイン**
  - メールアドレス認証
  - ソーシャルログイン（Google, Twitter）
- **プロフィール管理**
  - 棋力設定
  - アバター画像
  - 対局成績の表示

### 2.2 画面構成

#### 2.2.1 ホーム画面
- 対局開始ボタン
- 棋譜一覧への遷移
- お知らせ・更新情報

#### 2.2.2 対局画面
- 将棋盤（9×9マス）
- 持ち駒表示エリア
- 対局者情報（名前、持ち時間）
- 棋譜表示エリア
- 操作ボタン（投了、待った、中断）

#### 2.2.3 棋譜管理画面
- 棋譜一覧（サムネイル付き）
- 検索・フィルター機能
- 棋譜の編集・削除ボタン

#### 2.2.4 棋譜再生画面
- 将棋盤
- 再生コントロール
- 棋譜表示（手順リスト）
- コメント入力エリア

## 3. 非機能要件

### 3.1 パフォーマンス要件
- **レスポンス時間**
  - 画面遷移: 2秒以内
  - 着手操作: 100ms以内
  - AI思考時間: 設定値±10%以内
- **同時接続数**
  - 最大1000ユーザーの同時接続をサポート

### 3.2 セキュリティ要件
- **認証・認可**
  - JWT(JSON Web Token)による認証
  - HTTPS通信の強制
- **データ保護**
  - パスワードのハッシュ化（bcrypt）
  - SQLインジェクション対策
  - XSS対策

### 3.3 ユーザビリティ要件
- **マルチデバイス対応**
  - レスポンシブデザイン（PC、タブレット、スマートフォン）
  - タッチ操作への最適化
- **アクセシビリティ**
  - WCAG 2.1 Level AAに準拠
  - キーボード操作のサポート
  - スクリーンリーダー対応

### 3.4 互換性要件
- **ブラウザサポート**
  - Chrome (最新版)
  - Firefox (最新版)
  - Safari (最新版)
  - Edge (最新版)
- **モバイルOS**
  - iOS 14以上
  - Android 10以上

## 4. 技術仕様

### 4.1 フロントエンド
- **フレームワーク**: Next.js 15.3.3 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **状態管理**: React Context API / Zustand
- **将棋盤描画**: Canvas API / SVG

### 4.2 バックエンド
- **API**: Next.js API Routes
- **認証**: NextAuth.js
- **リアルタイム通信**: Socket.io / WebSocket

### 4.3 データベース
- **主データベース**: PostgreSQL
- **キャッシュ**: Redis
- **棋譜保存形式**: JSON形式でのKIF互換データ

### 4.4 インフラストラクチャ
- **ホスティング**: Vercel
- **CDN**: Vercel Edge Network
- **モニタリング**: Vercel Analytics

## 5. 開発スケジュール

### Phase 1: 基本機能実装（2ヶ月）
- 将棋盤UI実装
- ローカル対局機能
- 基本的な棋譜保存・読み込み

### Phase 2: 棋譜管理機能（1.5ヶ月）
- 棋譜一覧・検索機能
- 棋譜再生・分析機能
- エクスポート機能

### Phase 3: オンライン機能（2ヶ月）
- ユーザー認証システム
- オンライン対局機能
- リアルタイム通信実装

### Phase 4: AI機能（1.5ヶ月）
- AI対局機能
- 局面分析機能
- 棋力判定機能

### Phase 5: 最適化・公開準備（1ヶ月）
- パフォーマンス最適化
- セキュリティ監査
- ユーザビリティテスト

## 6. 制約事項

### 6.1 技術的制約
- 既存のNext.js環境を活用
- モバイルファーストの設計
- Progressive Web App (PWA)対応を検討

### 6.2 法的制約
- 将棋の棋譜に関する著作権への配慮
- 個人情報保護法への準拠
- 利用規約・プライバシーポリシーの整備

## 7. 今後の拡張機能（将来的な実装候補）

- **大会機能**
  - トーナメント・リーグ戦の開催
  - 自動組み合わせ機能
- **学習機能**
  - 詰将棋問題
  - 定跡学習モード
- **コミュニティ機能**
  - 棋譜へのいいね・コメント
  - フォロー機能
- **プロ棋戦データ連携**
  - プロ棋譜の閲覧
  - 戦型分析