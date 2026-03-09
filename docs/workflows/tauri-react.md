# tauri-react.md

Tauri + React で実装する際の基本ワークフロー。

---

## 実装順序

1. UI骨格作成
2. Pencil デザイン再現
3. Rust 側タイマー実装
4. React と Rust の接続
5. 設定保存
6. トレイ・通知・OS機能
7. 最適化
8. テスト
9. リリース確認

---

## UI実装時の流れ

- Pencil を確認する
- 主要画面を静的実装する
- コンポーネントを小さく整理する
- Focus / Break の状態差を明示する
- 操作ボタンの意味を明確にする

---

## タイマー実装時の流れ

- Rust 側で状態モデルを作る
- 開始 / 一時停止 / リセット / スキップを定義する
- Focus / Break 切替を定義する
- セッション進行を管理する
- React 側は表示更新だけを担う

---

## 設定実装時の流れ

- Settings UI を作る
- 入力 state を管理する
- 保存形式を決める
- 起動時ロードと変更時反映を実装する

---

## OS機能実装時の流れ

- tray 挙動
- notifications
- always-on-top
- minimize to tray

Windows / macOS 差異は platform 層に閉じる。

---

## パフォーマンス確認

- 再レンダリング頻度
- 常駐時 CPU 負荷
- メモリ使用量
- 起動時間
- タイマー動作中の負荷

---

## PR前チェック

- 型エラーなし
- lint 通過
- clippy 通過
- UI崩れなし
- major OS 差異なし