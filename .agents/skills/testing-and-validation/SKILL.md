# Testing And Validation Skill

## 目的

ポモドーロアプリの主要機能を、壊れやすい観点から漏れなく検証するためのスキルです。

## 主要機能の検証観点

- timer state transitions
- Focus / Break / Long Break switching
- settings persistence
- tray / notification
- session progress
- 起動直後と再起動後の整合性

## timer state transitions

- `start`
- `pause`
- `resume`
- `reset`
- `skip`

それぞれで残り時間、表示状態、ボタン活性が一致するか確認する。

## session progress

- Focus 完了時だけカウントが進むか
- Break 完了時の扱いが仕様通りか
- Long Break 発火条件が正しいか

## settings persistence

- 起動時ロード
- 保存後反映
- 再起動後復元
- 不正値や欠損時のデフォルト復帰

## tray / notification

- セッション完了通知
- 通知タイミングの二重発火防止
- トレイからの開始、停止、表示切替
- OS ごとの違和感の有無

## Focus / Break switching

- 色差
- ラベル差
- 残り時間表示
- 操作可能ボタンの違い

## 確認時の姿勢

- 成功系だけでなく中断系も見る
- 手動確認結果は再現手順つきで残す
- 未確認項目と残リスクを明示する
