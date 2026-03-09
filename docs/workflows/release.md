# release.md

リリース前の基本ワークフロー。

---

## 対象

- Windows リリース
- macOS リリース

---

## リリース前に必ず行うこと

1. 型チェック
2. lint
3. Rust clippy
4. build 確認
5. 主要画面の目視確認
6. タイマー動作確認
7. 設定保存確認
8. 通知確認
9. tray / minimize 確認
10. 起動速度確認

---

## UI確認

- Pencil との差分が大きくないか
- Focus / Break 色が正しいか
- テキスト崩れがないか
- 設定画面が詰まりすぎていないか
- OS別で不自然な崩れがないか

---

## パフォーマンス確認

- 常駐時 CPU 使用率
- メモリ消費
- タイマー実行中の負荷
- 起動時間

---

## 配布前確認

### Windows
- 実行ファイル起動確認
- tray 動作
- 通知
- always-on-top
- installer / signing 方針確認

### macOS
- 起動確認
- notification
- tray / menu bar 系挙動
- signing / notarization 方針確認

---

## 禁止

- テスト未確認のまま配布
- OS片方しか確認しない
- 依存追加の影響未確認で配布