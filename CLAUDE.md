# CLAUDE.md

このファイルは Claude Code 向けの入口です。  
このリポジトリで作業する際は、まずこのファイルを読み、その後に指定の詳細ドキュメントを参照してください。

---

## 目的

このプロジェクトは、Tauri + Rust + React + TypeScript で実装する、
**軽量・高速・シンプルなポモドーロデスクトップアプリ**です。

対象OS:

- Windows
- macOS

最重要目標:

1. Pencil の `.pen` デザインに忠実であること
2. CPU / メモリ使用量を最小化すること
3. 起動が速く、常駐に向くこと
4. タイマーの精度と操作のわかりやすさを両立すること
5. 単機能で迷わない体験を維持すること

---

## 最初に読むべきファイル

作業開始時は、以下を優先順で読んでください。

1. `docs/agent-core.md`
2. `docs/architecture.md`
3. `docs/coding-standards.md`

タスクに応じて、以下も参照してください。

- Tauri / React 実装: `docs/workflows/tauri-react.md`
- テスト: `docs/workflows/testing.md`
- リリース: `docs/workflows/release.md`

---

## スキル参照ルール

このリポジトリでは、詳細知識を `.agents/skills/` に分離しています。  
タスク内容に応じて、関連するスキルを参照してください。

### 必須スキル選択の目安

- Pencil デザインを UI に落とし込む:
  - `.agents/skills/design-implementation/SKILL.md`

- React の画面実装・コンポーネント実装:
  - `.agents/skills/react-ui-implementation/SKILL.md`

- Tauri / Rust で軽量なタイマー・トレイ・通知を実装:
  - `.agents/skills/tauri-performance/SKILL.md`
  - `.agents/skills/rust-backend/SKILL.md`

- 品質、レビュー、最適化:
  - `.agents/skills/quality-assurance/SKILL.md`

- テスト設計と検証:
  - `.agents/skills/testing-and-validation/SKILL.md`

- リリース前チェック:
  - `.agents/skills/release-check/SKILL.md`

---

## 行動原則

### 1. Pencil を正本とする
- `.pen` ファイルとエクスポート画像を UI の正本とする
- デザインを独断で変更しない
- 微修正が必要なら、理由を説明して提案する

### 2. パフォーマンス優先
- このアプリは常駐型ユーティリティである
- 重い依存を避ける
- 無駄な再レンダリングやイベント購読を避ける
- タイマーの主制御は Rust 側に寄せる

### 3. 単純さ優先
- 多機能化しない
- 先回りした過剰設計を避ける
- 必要十分な実装に留める

### 4. OS差分を意識する
- Windows / macOS 両対応を前提にする
- ただし UI 世界観は揃える
- OS ごとの自然な挙動を損なわない

---

## 実装時の基本ルール

### UI
- タイマー表示を最優先で目立たせる
- Focus は青系、Break は緑系
- 情報密度は低く保つ
- 過剰なアニメーションは禁止

### React
- 表示層を中心にする
- 状態は最小限
- 型安全を維持する
- 不要な global state を増やさない

### Rust / Tauri
- タイマー主制御を持つ
- OS連携を担う
- 通知・トレイ・always-on-top 等を実装する
- 不要な非同期や過剰な共有状態を避ける

---

## 変更時の出力ルール

大きな変更を行う前に、簡潔に以下を示してください。

1. 何を変更するか
2. なぜ必要か
3. UI再現性への影響
4. パフォーマンスへの影響
5. 追加依存がある場合はその理由

---

## 禁止事項

- Pencil デザインからの独断変更
- 重い UI ライブラリの安易な導入
- タイマー主制御をフロントだけで持つこと
- 毎フレーム更新前提の実装
- 使わない依存の追加
- 修正と無関係なリファクタの混入
- 過剰な抽象化
- 先回りしすぎたアーキテクチャ

---

## 作業の進め方

原則として以下の順で進めてください。

1. 既存コードと docs を読む
2. 必要な skills を選ぶ
3. 実装方針を短くまとめる
4. 小さな単位で実装する
5. 動作確認する
6. 型・lint・テストを確認する
7. 必要なら軽量化・整理を行う

---

## 最終ゴール

このプロジェクトでは、機能の多さではなく、以下を価値とします。

- 軽い
- 速い
- 美しい
- わかりやすい
- 迷わない
- 常駐しても気にならない

詳細は `docs/` と `.agents/skills/` を参照してください。