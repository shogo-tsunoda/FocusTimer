# Rust Backend Skill

## 目的
Rust 側でタイマー・設定・通知・OS連携のコアを安全かつ明快に実装する。

---

## 原則
- 状態遷移を明示する
- エラーを握りつぶさない
- clippy clean
- 不要 clone を避ける

---

## 実装対象
- timer state machine
- session progress
- long break rules
- settings persistence
- OS integrations

---

## 推奨
- 小さい module に分割
- enum で状態を表現
- フロントに依存しない core を保つ

---

## 禁止
- 過剰な async
- 複雑すぎる共有状態
- UI都合のロジック混入