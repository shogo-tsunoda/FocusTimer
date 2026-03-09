# Tauri Performance Skill

## 目的
Tauri アプリとして、軽量・高速・常駐向きの実装を行う。

---

## 原則
- Tauri API は必要最小限
- plugin は厳選
- フロントに重い処理を持ち込まない
- 起動速度を最優先する

---

## 実装指針
- タイマー主制御は Rust 側
- tray / notifications / always-on-top を適切に分離
- OS差分は platform 層に閉じる
- 毎フレーム更新を避ける

---

## チェック観点
- idle 時 CPU
- 常駐時メモリ
- 起動時間
- タイマー動作時の安定性

---

## 禁止
- 不要な plugin 追加
- 常時イベント監視の乱用
- フロント主導の高頻度更新