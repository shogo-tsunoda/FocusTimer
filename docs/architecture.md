# architecture.md

このファイルは、このプロジェクトの設計方針を定義します。

---

## 技術スタック

- Tauri v2
- Rust
- React
- TypeScript

---

## 設計目標

- 軽量
- 高速起動
- 常駐に向く
- OS連携が自然
- UIは Pencil に忠実
- 役割分離が明確

---

## 責務分離

### Rust / Tauri 側
責務:

- タイマー主制御
- 状態遷移
- 通知
- トレイ
- always-on-top
- 永続化
- OS依存差異吸収

### React 側
責務:

- UI描画
- 設定入力
- 表示用 state
- Rust 状態の受信と反映

---

## タイマー設計

### 原則
- タイマーの主制御は Rust 側に置く
- フロントは表示に専念する

### 理由
- CPU負荷の低減
- 精度向上
- バックグラウンド時の安定性
- OS統合しやすい

### 非推奨
- フロントのみでタイマー制御
- setInterval 主体の実装
- 高頻度更新ループ

---

## 状態モデル

主要状態の例:

- Idle
- RunningFocus
- PausedFocus
- RunningBreak
- PausedBreak
- SessionCompleted
- DayCompleted

Rust 側で状態を持ち、React 側はそれを信頼する。

---

## 画面構成

### Timer - Focus
- 円形タイマー
- 残り時間
- セッション進行
- タスク名
- 操作ボタン
- 今日の実績

### Timer - Break
- Focus と同構造
- 緑系アクセント

### Settings
- タイマー
- 長休憩
- 自動開始
- 通知
- メッセージ
- 一般設定

### Settings - Custom ON
- セッション別メッセージ一覧

---

## 推奨ディレクトリ構成

```text
src/
  components/
  screens/
  features/
    timer/
    settings/
    stats/
  hooks/
  lib/
  styles/
  types/

src-tauri/
  src/
    main.rs
    timer/
    settings/
    tray/
    notifications/
    platform/