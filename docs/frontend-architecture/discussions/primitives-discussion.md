# Primitives 層の設計議論まとめ

## 議論の出発点

UIコンポーネント実装において、primitives層の役割と必要性を再検討した。

### 当初の設計とその問題

初期構想では、shadcn/ui のデフォルトスタイルをベースにデザインを組み上げる方式を採用していた。そのため primitives 層に shadcn 生成コードをロックし、改造を禁止していた。

```
primitives/ (shadcn/ui 生成コード、改造禁止)
  → atoms/ (薄いラッパー、スタイルなし)
    → molecules/
```

しかし、この方式ではデザインを広く適用できず、カスタム性が必要になった。これにより primitives 層のロックが障害となったため、撤廃を決定した。

**問題点:**

- shadcn のデフォルトスタイルに縛られ、デザインのカスタマイズ性が制限される
- atoms が primitives の実質パススルーで存在意義が薄い
- primitives 層が Atomic Design の外にあり、UIライブラリの選択がアーキテクチャに直接露出している
- shadcn/ui は「コード生成ツール」であり、生成コードはカスタマイズ前提で提供されている。「改造禁止」は shadcn/ui の思想に反している

---

## 決定事項

### 1. primitives 層を廃止し、atoms に直接配置する

```
before:  shadcn install → primitives（ロック）→ atoms（パススルー）
after:   shadcn install → atoms（ここでカスタム）
```

### 2. サブコンポーネントを個別の atom に分解する

shadcn の1ファイルに含まれるサブコンポーネントはそれぞれ atom になり、以下のディレクトリ構造で配置する:

```
atoms/card/
├── card/index.tsx
├── card-header/index.tsx
├── card-title/index.tsx
├── card-description/index.tsx
├── card-content/index.tsx
└── card-footer/index.tsx
```

### 3. 関連性のある atoms はディレクトリでグルーピングする

- shadcn の1ファイルに含まれる関連コンポーネント群は、親コンポーネント名のディレクトリ配下にまとめる
- 各パーツは最小単位の atom として個別に export する
- molecules で必要なパーツだけを選んで組み合わせる（全パーツの使用を強制しない）

### 4. atoms 層の責務

| 責務 | 内容 |
|------|------|
| スタイルの定義と保護 | cva でバリアントを定義し、見た目をロック |
| headless UI のラップ | Radix UI を内部実装として使用 |
| 契約の提供 | 外部に公開する props のインターフェース |

必要な atom を選んで組み合わせ、新しい意味を創出する

---

## アップデート運用

- **shadcn/ui 自体のアップデートは行わない** — コードを取り込みカスタムする運用のため、shadcn CLI での再生成は行わない。shadcn/ui 自体はバージョン管理されていないため、アップデートの概念がない
- **内部で使用している headless UI（Radix UI）のアップデートで運用する** — `npm update @radix-ui/*` により、アクセシビリティやブラウザ対応等の改善を取り込む

---

## 未決事項

- **cva と tailwind-variants（tv）の使い分け** — shadcn 由来は cva、それ以外は tv という棲み分けの是非・統一の検討
- **自作 atoms の粒度基準** — shadcn が提供していないコンポーネントを自作する際の判断基準
  - → 基本方針: UIライブラリ（shadcn/ui）で提供されている構成をもとに最小単位として取り扱う
- **ドキュメントの更新** — 既存の設計ドキュメントへの反映
