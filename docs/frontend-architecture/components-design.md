---

# Atomic Design 定義

## 概要

Atomic Designは、UIコンポーネントを階層に分けて設計する方法論です。
本プロジェクトでは、以下の5階層を採用します。

**重要: 設計に関しては都度認識合わせをすることを基本とする**

---

## 本設計のスコープと位置づけ（重要）

本ドキュメントで定義する Atomic Design は、
**フロントエンドアプリケーション内の「UIコンポーネント設計」に限定した分類規約**である。

本プロジェクトでは UI コンポーネントを `packages/ui` で管理しており、
Atomic Design の各階層（Atoms / Molecules / Organisms / Templates / Pages）は
**すべて UI コンポーネントとしての責務のみを持つもの**とする。

### packages/ui における基本原則

`packages/ui` に配置されるコンポーネントは、
**アプリケーションレイヤーではなく UI レイヤーである**ため、以下の原則を厳守する。

#### packages/ui が担う責務

- UIの描画（見た目・構造）
- ユーザー操作の受け取り
- イベントの通知（`onClick` / `onChange` / `onSubmit` など）
- UI 状態の管理（hover / focus / open / close など、表示に閉じた状態）

#### packages/ui に持ち込まない責務（禁止）

- API 呼び出し・データ取得
- ルーティング制御
- グローバル状態管理（Redux / Zustand 等）
- 認証・権限・業務ルール
- フォームライブラリ（React Hook Form 等）への直接依存
- ドメインモデルやアプリケーション固有の型への依存

> **packages/ui は「UIとしてどう見え、どう操作できるか」だけを責務とする。
> アプリケーションの都合は一切持ち込まない。**

---

## なぜ Atomic Design を採用するのか

コンポーネント設計手法には FSD（Feature-Sliced Design）などの選択肢もあるが、本プロジェクトでは Atomic Design を採用する。

### FSD（Feature-Sliced Design）を採用しない理由

FSD はフロントエンドアプリケーション全体のスキャフォールディング手法であり、コード体系化のルール・規約・ツールチェーン（リンター、フォルダジェネレーター等）を包括的に提供する。

しかし、本プロジェクトにおいては以下の理由から採用しない。

1. **スコープが広すぎる**
   FSD は「フロントエンドアプリケーション全体のアーキテクチャ」を対象としており、UIコンポーネントの設計手法としては概念が大きすぎる。
   本プロジェクトで必要なのは **UIの構造化** であり、アプリケーション全体の設計規約ではない。

2. **UIに他の責務が混在する**
   FSD の層構造には model や data といったUI以外の関心事が含まれる。
   UIコンポーネントの本質的な責務は **「データを受け取り、表示する」** ことであり、
   データ取得・加工・状態管理が同じ設計レイヤーに入り込むと、UI実装の判断基準が曖昧になる。

---

## Atomic Design の利点

Atomic Design は **純粋にUIの構造と粒度だけ** を基準にコンポーネントを分類する。
スコープがUIに限定されているからこそ、判断基準がシンプルで迷いが生まれにくい。

- **UIの責務に集中できる**
  各階層の判断基準が「見た目の粒度と再利用性」に限定されるため、
  データの扱いやビジネスロジックがUIコンポーネントの設計に影響しない

- **責務の境界が明確**
  データ取得・フォーム管理・状態管理・ビジネスロジックは
  `packages/ui` の外（アプリケーションレイヤー）で扱い、
  Atoms / Molecules は純粋なUIパーツとして保たれる

- **共通言語としての明快さ**
  「Atom か Molecule か Organism か」という **UI粒度の議論だけ** で
  コンポーネントの配置が決まる

## レイヤー間の関係図

```
Pages
  └── Templates (レイアウト)
        └── Organisms (プロダクト固有)
              └── Molecules (汎用・組み合わせ)
                    └── Atoms (最小単位)
```

---

## 階層定義

### 1. Atoms（原子）

> "If atoms are the basic building blocks of matter, then the atoms of our interfaces serve as the foundational building blocks that comprise all our user interfaces."

UIを構成する最小単位のパーツ。

**特徴:**

- 自分が何に使われるかは知らない
- UIとしての姿があるなしは関係ない（container/provider的なものも含む）
- `atoms/structure`という構造を置く場所を用意し、知識を持たない
- 自分は何ができるのかは知っている（表示しているもの、ボタンを押した時の挙動など）
- 自分が何に使われているのかは知らない
- 表示しているものが何を構成しているのかは知らない
- ボタンを押すとどうするかはわかるが、その結果がどうなるかは知らない
- いくらかの複雑性はもつが、これ単体では成立しない
- **ここまでは共通パーツとして使いまわせる**

**例:**

- FormField
- SearchBox
- Card
- MenuItem
- RadioGroup
- AlertBox

---

### 2. Molecules（分子）

Atomsを組み合わせた汎用的なUIコンポーネント。

**特徴:**

- Atomsを組み合わせて構成される
- プロダクトに依存しない汎用的なコンポーネント
- 同階層間の参照は例外的に許容される

**例:**

- FormField（Label + Input）
- RadioGroup（Label + RadioButton群）
- AlertBox（Icon + Text + Button）

---

### 3. Organisms（有機体）

> "Organisms are relatively complex UI components composed of groups of molecules and/or atoms and/or other organisms. These organisms form distinct sections of an interface."

特定のプロダクトについての知識を持つ。

**特徴:**

- プロダクト間では使いまわせない
- それ単体でWebサイト内で存在できる
- 何をするものかが一目でわかる

**例:**

- ShippingForm
- PaymentMethodSelector
- ConfirmationModal

---

### 4. Templates（テンプレート）

ページのレイアウト構造を定義する。

**特徴:**

- Organismsの配置・レイアウトを担当
- 具体的なデータは持たない

---

### 5. Pages（ページ）

Templatesにデータを流し込んだ実際のページ。

**特徴:**

- Templatesに具体的なデータを注入
- ルーティングと対応

---

## ディレクトリ構造

```
src/components/
├── atoms/
│   ├── structure/        # container/provider的なもの
│   ├── Button/
│   │   ├── index.tsx
│   │   └── index.stories.tsx
│   ├── Input/
│   ├── Label/
│   ├── Select/
│   └── RadioButton/
├── molecules/
│   ├── FormField/
│   ├── RadioGroup/
│   └── AlertBox/
├── organisms/
│   ├── ShippingForm/
│   ├── PaymentMethodSelector/
│   └── ConfirmationModal/
├── templates/
│   └── CheckoutTemplate/
└── index.ts
```

## コンポーネント実装規約

### ファイル構成

各コンポーネントは以下の構成とする：

```
ComponentName/
├── index.tsx           # 実装本体（関連の実装を集約）
└── index.stories.tsx   # Storybook Stories
```

### 命名規則

- **コンポーネント名**: PascalCase（例: `FormField`）
- **ファイル名**: コンポーネント名と同じディレクトリ名

### 1コンポーネント1役割の原則

コンポーネントは単一の責務を持つようにシンプルに保つ。機能を追加し続けて肥大化させない。

**悪い例:**

```tsx
// 機能を追加し続けて複雑化したコンポーネント
<FormField
  columns={2} // 複数カラム対応
  withError={true} // エラー表示
  withTooltip={true} // ツールチップ
  layout="horizontal" // レイアウト変更
/>
```

**良い例:**

```tsx
// 1コンポーネント1役割、必要に応じてAtomsを直接組み合わせる
<div className="flex flex-col gap-1">
  <Label required>氏名</Label>
  <div className="flex gap-2">
    <Input placeholder="姓" ... />
    <Input placeholder="名" ... />
  </div>
  {error && <p className="text-sm text-red-500">{error}</p>}
</div>
```

### 複雑なフィールドへの対応方針

1. **まずAtomsを直接組み合わせる**
   - Moleculesで対応できない要件（複数Input並列など）はPages/OrganismsでAtomsを直接組み合わせる
2. **パターンが繰り返されたらMolecules化を検討する**

---

## 依存関係ルール

```
Pages → Templates → Organisms → Molecules → Atoms
```

- 上位は下位のみ参照可能
- 同階層間の参照は原則禁止（Moleculesは例外的にMoleculeを含むことがある）
- 逆方向の参照は禁止
