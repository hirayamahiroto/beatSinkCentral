# コンポーネント設計

## Atomic Designの定義

> 参考: [Atomic Design - Brad Frost](https://atomicdesign.bradfrost.com/table-of-contents/)

### Atoms（原子）

> "If atoms are the basic building blocks of matter, then the atoms of our interfaces serve as the foundational building blocks that comprise all our user interfaces."

- UIを構成する最小単位のパーツ
- 自分が何に使われるかは知らない
- UIとしての姿があるなしは関係ない（container/provider的なものも含む）
- `atoms/structure`という構造を置く場所を用意する

**例:** Button, Input, Label, Icon, Typography

### Molecules（分子）

> "In interfaces, molecules are relatively simple groups of UI elements functioning together as a unit. For example, a form label, search input, and button can join together to create a search form molecule."

- いくつかのAtom（またはMolecule）を組み合わせて構成
- Web UIの知識や機能を持つが、特定のプロダクトについての知識を持たない
- 自分は何ができるのかは知っている（表示しているもの、ボタンを押した時の挙動など）
- 自分が何に使われているのかは知らない
  - 表示しているものが何を構成しているのかは知らない
  - ボタンを押すとどうするかはわかるが、その結果がどうなるかは知らない
- いくらかの複雑性はもつが、これ単体では成立しない
- **ここまでは共通パーツとして使いまわせる**

**例:** FormField, SearchBox, Card, MenuItem

### Organisms（有機体）

> "Organisms are relatively complex UI components composed of groups of molecules and/or atoms and/or other organisms. These organisms form distinct sections of an interface."

- 特定のプロダクトについての知識を持つ
- **プロダクト間では使いまわせない**
- それ単体でWebサイト内で存在できる
- 何をするものかが一目でわかる（プロダクト的な意味で）

**例:** Header, Footer, Navigation, Form, List

### Templates（テンプレート）

- レイアウトの骨組み
- ヘッダーやサイドバーの組み合わせを配置
- スケルトンはここに配置
- 中身はchildrenとして受け取る

**例:** PageLayout, AuthLayout, DashboardLayout

### Pages（ページ）

- 完成品
- Templateとページ固有のOrganismを配置
- Templateにchildrenとしてそのページのorganismsを配置して完成

### レイヤー間の関係図

```
Pages
  └── Templates (レイアウト)
        └── Organisms (プロダクト固有)
              └── Molecules (汎用・組み合わせ)
                    └── Atoms (最小単位)
```

**重要:** 設計に関しては都度認識合わせをすることを基本とする

---

## 構造（Structure）とは

空間の並び・配置・流れ・骨格を定義し、DOM構造に影響を与えるもの

### atoms/structureに該当するもの

- DOM構造や要素の空間的配置に直接影響を与える
- Flex/Grid/Flow/Positionの概念に基づいている
- レイアウト上の並び方を定義している

### structureではないもの

- スタイリング（見た目の微調整）にとどまっている
- 特定のコンポーネント内でしか使われない

### Storybookでデザインを作るもの/作らないもの

| 分類 | Storybookでデザインあり | Storybookでデザインなし |
|------|------------------------|------------------------|
| 説明 | 見た目のコンポーネント、structureのコンポーネント | プロバイダーなどのコンポーネント、スタイリング優先のコンポーネント |
| 例 | Button, Card, Grid | ThemeProvider, DialogFooter, BreadcrumbList |

**デザインがない対象:**
- プロバイダーなどのコンポーネント
- スタイリング（見た目）を優先したコンポーネント
- 構造を持っているが特定のコンポーネント下でしか使われないもの

---

## ディレクトリ構造

```
packages/ui/src/design-system/
├── components/
│   ├── atoms/                 # shadcn/ui を直接配置しカスタムする最小単位
│   │   ├── structure/         # 構造を定義するatoms
│   │   ├── Button/
│   │   │   ├── index.tsx      # shadcn Button（cva + Radix）
│   │   │   └── index.stories.tsx
│   │   ├── Card/
│   │   │   ├── index.tsx
│   │   │   ├── index.stories.tsx
│   │   │   ├── Header/
│   │   │   │   └── index.tsx
│   │   │   ├── Title/
│   │   │   │   └── index.tsx
│   │   │   ├── Description/
│   │   │   │   └── index.tsx
│   │   │   ├── Content/
│   │   │   │   └── index.tsx
│   │   │   └── Footer/
│   │   │       └── index.tsx
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Image/
│   │   └── Link/
│   ├── molecules/
│   ├── organisms/
│   ├── templates/
│   └── pages/
└── index.ts
```

### Atoms のディレクトリ設計ルール

- **shadcn/ui のコードを atoms に直接配置する**（primitives 層は廃止）
- **shadcn の1ファイルに含まれるサブコンポーネントは個別の atom ディレクトリに分解する**
  - 例: shadcn の `card.tsx` が `Card`, `CardHeader`, `CardContent` 等を含む → `atoms/Card/card/`, `atoms/Card/card-header/`, `atoms/Card/card-content/` にそれぞれ配置
- **関連性のある atoms は親コンポーネント名のディレクトリでグルーピングする**
- **各パーツは最小単位の atom として個別に export する**（molecules で必要なパーツだけを選んで組み合わせる）
- **atoms の最小単位の基準は、UIライブラリ（shadcn/ui）で提供されている構成をもとに決定する**
  - shadcn install で生成されたファイル内の `export` されているコンポーネント、または `const` で定義されているコンポーネント単位を atom として扱う
  - 例: `card.tsx` が `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` を export → それぞれが個別の atom
- **スタイル定義は atoms 層に閉じ込める。molecules 以上のレイヤーにスタイルを漏らさない**

### Atoms 層の責務

| 責務 | 内容 |
|------|------|
| **スタイルの定義と保護** | cva でバリアントを定義し、見た目をロック |
| **headless UI のラップ** | Radix UI を内部実装として使用 |
| **契約の提供** | 外部に公開する props のインターフェース |

---

## shadcn/ui の運用方針

### 基本原則

shadcn/ui は npm パッケージではなく**コード生成ツール**である。生成されたコードはカスタマイズ前提で提供されている。

- **shadcn/ui のコードは atoms に直接配置し、自由にカスタマイズする**
- **shadcn/ui 自体のアップデート（CLI 再生成）は行わない** — コードを取り込みカスタムする運用のため
- **内部で使用している headless UI（Radix UI）のアップデートで運用する** — `npm update @radix-ui/*`

### アップデートフロー

```
Radix UI のアップデート
  → npm update で headless UI の挙動を更新
  → atoms のスタイル定義は変更なし（ロック）
  → ビジュアルの一貫性を保証

デザイン変更
  → atoms の cva / className を変更
  → headless UI には影響なし
  → スタイルのみ意図的に更新
```

---

## デザイントークン

### カラー定義

**基本方針:**
- 色はCSS変数で定義
- OKLCH形式を採用

**globals.css:**
```css
:root {
  --primary: oklch(0.21 0.006 285.885);
}

@theme inline {
  --color-primary: var(--primary);
}
```

**tailwind.config.js:**
```js
colors: {
  primary: "var(--color-primary)",
}
```

---

## 命名規則

- **コンポーネント**: PascalCase（例: `PlayerCard`）
- **ファイル構成**: 関連するものは同一ディレクトリ内に配置
  - `index.tsx`
  - `index.stories.ts(tsx)`

---

## バリアント管理

### Atoms（スタイル定義層）

atoms 内部で `class-variance-authority`（cva）を使用してバリアントを定義する。

```tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-purple-600 text-white hover:bg-purple-700",
        ghost: "hover:bg-gray-800 text-gray-400",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

### Molecules

- **スタイルを定義しない** — atoms を組み合わせるのみ
- バリアントは atoms の props として公開される

### Organisms / Templates / Pages

- classNameに直接記述
- スタイリング管理が必要な場合のみvariantsを定義

---

## UIコンポーネントの責務

### 基本原則

**UIコンポーネントは「propsで受け取った値を表示する」ことに専念する**

```tsx
// ✅ 良い例: propsを受け取って表示するだけ
function UserCard({ name, email, avatarUrl }: UserCardProps) {
  return (
    <div className="card">
      <img src={avatarUrl} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

// ❌ 避けるべき: コンポーネント内でデータ取得
function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(res => res.json()).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### UIコンポーネントで避けるべきこと

| 避けるべき | 理由 |
|-----------|------|
| `useEffect`でのデータ取得 | SSRで動作しない、テストが困難 |
| `useEffect`での副作用実行 | 責務が不明確になる |
| グローバル状態への直接アクセス | 再利用性が低下 |
| API呼び出し | UIとデータ層の結合 |
| 複雑なビジネスロジック | テスト・保守が困難 |

### 責務の分離パターン

```
┌─────────────────────────────────────────────────────┐
│ Page (SSR)                                          │
│  - データ取得                                        │
│  - 初期状態の決定                                    │
└─────────────────────────────────────────────────────┘
                        ↓ props
┌─────────────────────────────────────────────────────┐
│ ClientAdapter ("use client")                        │
│  - インタラクティブな状態管理                         │
│  - イベントハンドラの定義                            │
│  - useEffect（必要最小限）                           │
└─────────────────────────────────────────────────────┘
                        ↓ props
┌─────────────────────────────────────────────────────┐
│ UI Component (純粋なReactコンポーネント)             │
│  - propsを受け取って表示                             │
│  - イベントをコールバックで通知                       │
│  - 状態を持たない or UIのみの状態(hover等)           │
└─────────────────────────────────────────────────────┘
```

### useEffectの使用指針

**原則: UIコンポーネントではuseEffectを使用しない**

許可されるケース:
- フォーカス管理（アクセシビリティ対応）
- スクロール位置の制御
- アニメーションのトリガー
- サードパーティライブラリとの連携

```tsx
// ✅ 許可される例: フォーカス管理
function Dialog({ isOpen, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  return <div ref={dialogRef} tabIndex={-1}>{children}</div>;
}
```

---

## Hooksの切り出しルール

- `useXxx`で始まるカスタムフックは、必ずUIコンポーネント本体から分離して配置
- **責務分離**: 描画（JSX）とロジック（状態・副作用）を物理的に切り分け
- **テスト容易性**: UIを描画せずにロジックだけをユニットテスト可能
- JSXが並ぶファイルにロジックを直書きしない
- フックに型・テスト・モックが必要な場合は、フックと同じディレクトリに近接配置する
- 配置形式（`index.hooks.ts`か`hooks/useXxx/index.ts`）は検討中

---

## Storybookの役割分類

### ユーザーに見えるもの

- ユーザーが実際に見る・操作する要素
- **サンプル内容あり**でStorybookに表示
- 単体で意味を持つ

**レビューポイント:**
- デザインシステムやFigma通りか
- ホバー・フォーカスなど状態は適切か
- サンプル内容が実際の使用を想定できるか

### レイアウト・連携コンポーネント

- 状態管理やラッパーなど、枠組みを提供する要素
- **内容なし（空）**でStorybookに表示
- 子要素を置いて初めて意味を持つ

**レビューポイント:**
- 何も表示されないことが正しいか
- エラーなく動作しているか
- 依存するコンポーネントとの連携が正しく組まれているか

---

## Storybook設計方針

- **Moleculeのストーリーでは使い方を表現する**
- ただし、Input系はその限りではない:
  - **DropdownMenu / Dialog / AlertDialog**: 構造・レイアウトを定義 → 組み合わせパターンを見せる
  - **Select / RadioGroup / Input**: データを入れる器 → 器の形を見せれば十分

---

## コンポーネント設計原則

- コンポーネントのあり方は議論するが、デザインの是非は議論しない
- **Moleculeまでは汎用コンポーネントを目指す**
  - プロダクト特有のデザインは当てない
  - 特有のデザインを当てる場合は、外側で当てるかpropsとして渡せるようにする
