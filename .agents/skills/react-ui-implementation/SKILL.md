# React UI Implementation Skill

## 目的
React + TypeScript で、軽量かつ保守しやすい UI を実装する。

---

## 原則
- React は表示層中心
- state は最小限
- strict mode 前提
- コンポーネントは小さく分割

---

## 実装指針
- screen と component を分ける
- props を明示する
- derived state を増やさない
- 再レンダリングを抑える
- スタイリングは軽量に保つ

---

## 禁止
- context 濫用
- 無意味な custom hooks
- 重いUIライブラリ導入
- UIだけのための過剰抽象化

---

## 重点
- Timer screen の視認性
- Settings の整理された入力構造
- Focus / Break の状態差