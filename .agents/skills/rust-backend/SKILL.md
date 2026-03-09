# Rust Backend Skill

## 目的

Rust 側で timer、state machine、session progress、settings persistence、OS integration を安定して実装するためのスキルです。

## 担当責務

- タイマー主制御
- セッション状態遷移
- Focus / Break / Long Break 進行管理
- 設定ロード / 保存
- 通知、トレイ、ウィンドウなどの OS 連携

## 実装原則

- 状態遷移は enum とイベントで明確化する
- UI 都合のロジックをコアに混ぜない
- 時刻依存は経過時刻ベースで扱い、ドリフトを抑える
- 永続化は必要最小限に留める
- 失敗時のデフォルト復帰戦略を持つ

## timer 実装指針

- `start / pause / resume / reset / skip` を明示イベントとして扱う
- Focus 完了時の session increment を確実に定義する
- Long Break 条件を設定値で制御できるようにする
- スリープ復帰や時刻ずれを考慮する

## settings persistence

- 保存対象を限定する
- バージョン差分が出ても移行しやすい構造を選ぶ
- 読み込み失敗時は安全なデフォルトに戻せるようにする

## OS integration

- 通知、トレイ、ウィンドウ制御は OS 差分前提で書く
- OS ごとの差異は専用関数やモジュールで分ける
- React 側に OS 個別事情を漏らしすぎない

## 品質基準

- `cargo fmt` を通す
- `cargo clippy` を clean に近づける
- 状態遷移テストを用意する
- エラー経路を把握できるようにする
