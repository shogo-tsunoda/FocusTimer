# AGENTS.md

このファイルは Codex / Claude Code などの AI エージェント向けの入口です。  
詳細規約は `docs/` と `.agents/` 配下に分離し、このファイルでは着手順と参照先だけを短く示します。

## プロジェクト概要

このリポジトリは Tauri v2 + Rust + React + TypeScript で構築する、軽量なポモドーロデスクトップアプリです。

- 対象 OS: Windows / macOS
- UI 正本: `.design/design.pen`
- 重視事項: 軽量性、高速起動、正確なタイマー、自然な OS 挙動、保守性

## 最初に読むファイル

1. `docs/agent-core.md`
2. `docs/architecture.md`
3. `docs/coding-standards.md`

必要に応じて以下も読むこと。

- `docs/workflows/tauri-react.md`
- `docs/workflows/testing.md`
- `docs/workflows/release.md`

## 参照すべき skills

タスクに応じて以下を参照してください。

- UI 実装: `.agents/skills/design-implementation/SKILL.md`
- React 実装: `.agents/skills/react-ui-implementation/SKILL.md`
- Tauri 軽量化: `.agents/skills/tauri-performance/SKILL.md`
- Rust バックエンド: `.agents/skills/rust-backend/SKILL.md`
- 品質レビュー: `.agents/skills/quality-assurance/SKILL.md`
- テスト検証: `.agents/skills/testing-and-validation/SKILL.md`
- リリース前確認: `.agents/skills/release-check/SKILL.md`

## 中核原則の要約

- `.design/design.pen` を UI 実装の正本とする
- タイマー主制御は Rust / Tauri 側に寄せる
- React は表示層中心に保つ
- 低 CPU / 低メモリ / 高速起動を優先する
- Windows / macOS の自然な挙動を損なわない
- 変更は小さく、理由を明示する

## 禁止事項の要約

- `.design/design.pen` を無視した独断の UI 再設計
- 不要な依存追加
- 毎フレーム更新前提の実装
- フロントエンドだけでタイマー主制御を持つ設計
- 修正と無関係なリファクタの混入
- 過剰設計や先回り実装

## 基本の進め方

1. docs を読む
2. 関連 skill を読む
3. 変更対象、理由、性能影響を短く整理する
4. 小さく実装する
5. 型、lint、テスト、主要フローを確認する
