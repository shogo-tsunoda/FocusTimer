# AGENTS.md

このファイルは Codex や他のエージェント向けの入口です。  
このリポジトリで作業する際は、このファイルを起点として詳細ドキュメントと skills を参照してください。

---

## プロジェクト概要

このプロジェクトは、Tauri + Rust + React + TypeScript で構築する
**軽量・高速・シンプルなポモドーロデスクトップアプリ**です。

対象プラットフォーム:

- Windows
- macOS

このプロジェクトでは、以下を最重要とします。

1. Pencil デザインへの忠実な実装
2. 低CPU・低メモリ
3. 速い起動
4. 正確で安定したタイマー
5. シンプルな UX
6. 保守しやすい構成

---

## 最初に参照するファイル

必ず以下を読むこと。

1. `docs/agent-core.md`
2. `docs/architecture.md`
3. `docs/coding-standards.md`

必要に応じて以下も参照すること。

- `docs/workflows/tauri-react.md`
- `docs/workflows/testing.md`
- `docs/workflows/release.md`

---

## Skills の使い方

このリポジトリでは、具体的な作業知識を `.agents/skills/` に分離しています。  
タスクの種類に応じて、適切な skill を読んでから作業してください。

### UI / デザイン
- `.agents/skills/design-implementation/SKILL.md`

### React UI 実装
- `.agents/skills/react-ui-implementation/SKILL.md`

### Tauri 軽量実装
- `.agents/skills/tauri-performance/SKILL.md`

### Rust バックエンド / タイマー / OS連携
- `.agents/skills/rust-backend/SKILL.md`

### 品質レビュー / 最適化
- `.agents/skills/quality-assurance/SKILL.md`

### テスト設計 / 検証
- `.agents/skills/testing-and-validation/SKILL.md`

### リリース前確認
- `.agents/skills/release-check/SKILL.md`

---

## 中核原則

### Pencil を正本とする
- `.pen` ファイルと書き出し画像を UI の正本とする
- 独断で UI を変更しない
- 変更が必要なら理由を明示する

### パフォーマンス優先
- 常駐型ユーティリティとして低負荷を優先する
- 重い依存を避ける
- フロントエンドに不要な負荷を持ち込まない

### 単純さ優先
- 多機能化しない
- 過剰設計しない
- 必要十分な設計と実装を選ぶ

### OS差分への配慮
- Windows / macOS の自然な挙動を損なわない
- ただし UI の統一感は維持する

---

## 実装方針

### フロントエンド
- React は表示層中心
- state は最小限
- 不要な再レンダリングを避ける
- タイマーの主制御を持たない

### バックエンド
- Rust / Tauri がタイマー主制御を持つ
- OS機能連携を担う
- 通知・トレイ・ウィンドウ制御を扱う

### UI
- タイマー表示を最優先
- Focus は青系
- Break は緑系
- ミニマルな情報構造を維持する

---

## 変更前に明示すべきこと

大きな変更を行う場合、作業前に簡潔に以下をまとめること。

1. 何を変えるか
2. なぜ変えるか
3. Pencil デザインとの関係
4. パフォーマンスへの影響
5. 依存追加の有無

---

## 禁止事項

- Pencil デザインの独断変更
- 不要な依存追加
- 重い UI フレームワークの導入
- 毎フレーム更新前提の実装
- フロントだけでタイマー主制御を持つこと
- 修正と無関係なリファクタ混入
- 先回りした過剰設計

---

## 推奨作業順

1. docs を読む
2. relevant skills を読む
3. 実装方針を短く示す
4. 小さい単位で実装する
5. 型・lint・テストを確認する
6. パフォーマンス観点で見直す

---

## 最終目標

このアプリは以下を実現すること。

- 軽量
- 高速
- デザイン忠実
- Windows / macOS 両対応
- 単機能でわかりやすい
- 常駐しても気にならない