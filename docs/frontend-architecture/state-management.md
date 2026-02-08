# 状態管理

## クライアント状態

- React標準hooks（`useState`, `useReducer`）を使用
- Next.jsに依存しないこと
- `use client`や`next/~~~~`を用いた実装を行わない

---

## サーバー状態

- page.tsx（SSR）で初期データ取得を行う

---

## グローバル状態

- （未定義）

---

## 既存実装の課題

- インタラクティブなコンポーネントは`use client`を用いて実装
  - CSRのインターフェースを介する検討が必要
- `next/Link`、`next/Image`などが使用できないため最適化されていない
  - Reactベースでの代替実装が必要
