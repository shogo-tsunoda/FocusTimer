# Release Check Skill

## 目的

Windows / macOS 向けリリース前に、最低限落としてはいけない項目を詰めるためのスキルです。

## 必須確認

- 型チェック
- lint
- clippy
- build
- 主要フロー確認

## Windows / macOS 確認観点

- 起動、終了、再起動
- 通知
- トレイ
- ウィンドウ表示と最小化
- フォントやテキスト崩れ

## UI 確認

- `.design/design.pen` との差分が許容範囲か
- Focus は青系、Break は緑系か
- 余白、整列、強弱が破綻していないか
- hover / active / disabled が正しいか

## 性能確認

- idle 時 CPU
- セッション実行時 CPU
- 常駐時メモリ
- 起動速度

## 出荷停止条件

- タイマー精度に不安がある
- 主要フロー未確認
- OS 片方で破綻
- 型、lint、clippy、build の未通過
- 大きな UI 乖離
