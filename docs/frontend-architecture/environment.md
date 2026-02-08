# 環境構築

## 技術スタック

| カテゴリ | ツール |
|---------|--------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UIプリミティブ | shadcn/ui |
| バリアント管理 | tailwind-variants |
| パッケージマネージャー | pnpm |
| モノレポ管理 | Turborepo |

---

## Storybook

コンポーネントのカタログ化・開発・テストに使用

### セットアップ

```bash
pnpm add -D storybook @storybook/react-vite
pnpm dlx storybook init
```

### 設定ファイル

```
.storybook/
├── main.ts          # Storybook設定
├── preview.ts       # グローバルデコレーター
└── preview-head.html # カスタムhead要素
```

### 運用方針

- 各コンポーネントに`*.stories.tsx`を作成
- Atoms/Moleculesは必須、Organisms以上は任意
- インタラクションテストを活用

---

## CI/CD

### リグレッションテスト

**ビジュアルリグレッションテスト（VRT）**

| ツール | 用途 |
|--------|------|
| Chromatic | Storybookベースのビジュアル差分検出 |
| Percy | スナップショット比較 |
| Playwright | E2Eでのスクリーンショット比較 |

```yaml
# GitHub Actions例
- name: Visual Regression Test
  run: pnpm chromatic --project-token=${{ secrets.CHROMATIC_TOKEN }}
```

**コンポーネントテスト**

```yaml
- name: Storybook Test
  run: |
    pnpm build-storybook
    pnpm test-storybook
```

### CI パイプライン構成

```
PR作成時:
├── Lint (ESLint, Prettier)
├── Type Check (tsc)
├── Unit Test (Vitest)
├── Storybook Build
└── Visual Regression Test

マージ時:
├── Production Build
└── Storybook Deploy
```

---

## Linter / Formatter

| ツール | 用途 |
|--------|------|
| ESLint | コード品質チェック |
| Prettier | コードフォーマット |
| stylelint | CSSリント（任意） |

### 推奨ESLint設定

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:storybook/recommended"
  ]
}
```

---

## 開発環境セットアップ手順

```bash
# 1. リポジトリクローン
git clone <repository-url>

# 2. 依存関係インストール
pnpm install

# 3. 開発サーバー起動
pnpm dev

# 4. Storybook起動
pnpm storybook
```

---

## 推奨VSCode拡張

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
