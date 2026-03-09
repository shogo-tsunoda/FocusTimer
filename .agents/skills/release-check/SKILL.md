# Release Check Skill

## 目的
Windows / macOS 向けのリリース前チェックを漏れなく実施する。

---

## チェック項目
- type check
- lint
- clippy
- build
- key user flows
- settings persistence
- notifications
- tray behavior
- startup speed
- memory / cpu sanity check

---

## UI確認
- Pencil との差分が許容範囲か
- Focus / Break の色と状態差が正しいか
- Settings の表示崩れがないか

---

## OS確認
### Windows
- tray
- notification
- always-on-top
- packaging basics

### macOS
- launch
- notification
- tray/menu bar behavior
- packaging basics

---

## 禁止
- 片OSのみ確認での出荷
- 型・lint 未通過での出荷
- 主要フロー未確認での出荷