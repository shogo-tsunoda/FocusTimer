# Testing and Validation Skill

## 目的
タイマー、設定、UI、OS機能の主要動作を壊さないための検証を行う。

---

## テスト重点
- timer state transitions
- focus / break switching
- long break scheduling
- settings persistence
- UI state reflection
- tray / notification behavior

---

## 最低限の確認
- start
- pause
- resume
- reset
- skip
- session increment
- long break application
- settings load/save

---

## 方針
- ロジックの信頼性を優先
- UIは主要状態を重点確認
- 結合ポイントを意識する