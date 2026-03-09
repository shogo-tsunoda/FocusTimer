# CLAUDE.md

このファイルは Claude Code 向けの入口です。  
詳細な実装規約やチェック項目は `docs/` と `.agents/` にあるため、ここでは最低限の共通前提だけを示します。

## プロジェクト概要

- Tauri v2 + Rust + React + TypeScript のポモドーロアプリ
- 対象 OS は Windows / macOS
- UI 正本は `.design/design.pen`
- 単機能、軽量、高速、保守しやすい構成を優先

## 最初に読むべき docs

1. `docs/agent-core.md`
2. `docs/architecture.md`
3. `docs/coding-standards.md`

状況に応じて以下も参照してください。

- `docs/workflows/tauri-react.md`
- `docs/workflows/testing.md`
- `docs/workflows/release.md`

## 参照すべき skills

- デザイン忠実実装: `.agents/skills/design-implementation/SKILL.md`
- React UI 実装: `.agents/skills/react-ui-implementation/SKILL.md`
- Tauri 性能維持: `.agents/skills/tauri-performance/SKILL.md`
- Rust バックエンド: `.agents/skills/rust-backend/SKILL.md`
- 品質レビュー: `.agents/skills/quality-assurance/SKILL.md`
- テスト検証: `.agents/skills/testing-and-validation/SKILL.md`
- リリース確認: `.agents/skills/release-check/SKILL.md`

## 中核原則の要約

- `.design/design.pen` を UI の正本として扱う
- タイマー主制御は Rust / Tauri 側
- React は表示層中心、state は最小限
- 低 CPU、低メモリ、高速起動を優先
- Windows / macOS 差分は吸収しつつ自然な挙動を守る

## 禁止事項の要約

- 勝手な UI 再設計
- 不要依存の追加
- 毎フレーム更新や重い常時計算
- UI 都合のロジックを Rust に混ぜることと、その逆
- 無関係なリファクタ混入

詳細は `docs/` と `.agents/` を参照してください。
