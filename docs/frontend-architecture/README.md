# フロントエンド Atomic Design 設計ドキュメント

> **Note**
> 本ドキュメントはフロントエンド開発における基本的な方針・設計指針を示したものです。
> 実際の実装においては、プロジェクトの要件・規模・チーム構成に応じて方針や構造を最適化する必要があります。
> ここに記載された内容をベースラインとして、各プロジェクトで適切にカスタマイズしてください。

---

## ドキュメント一覧

| # | カテゴリ | 説明 |
|---|---------|------|
| 0 | [環境構築](./environment.md) | 技術スタック、Storybook、CI/CD、Linter設定 |
| 1 | [アプリケーション方針](./application-policy.md) | SEO対策、SSR/CSRの選択基準 |
| 2 | [実装の前提](./implementation.md) | Next.js App Router、実装パターン |
| 3 | [Tailwind CSS実装規約](./tailwind.md) | スタイリング方針、クラス名の結合ルール |
| 4 | [コンポーネント設計](./component-design.md) | Atomic Design階層定義、命名規則 |
| 5 | [フォーム設計](./form-design.md) | react hook formを用いたフォームの実装定義 |
| 6 | [状態管理](./state-management.md) | グローバル状態、ローカル状態の管理方針 |
| 7 | [レスポンシブ対応](./responsive.md) | ブレイクポイント、モバイルファースト設計 |
| 8 | [パフォーマンス](./performance.md) | Core Web Vitals、最適化手法 |
| 9 | [アクセシビリティ](./accessibility.md) | WCAG準拠、WAI-ARIA対応 |
| 10 | [開発ルール](./development-rules.md) | コードレビュー、Git運用 |
| 11 | [禁止事項](./prohibited.md) | 技術的制約、実装制約 |
| 12 | [UIライブラリ選定](./ui-library.md) | Headless UI、ShadCN/UI、スタイル付きライブラリの比較 |

---

## 参考資料
- [Atomic Design - Brad Frost](https://atomicdesign.bradfrost.com/table-of-contents/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/colors)
- [ShadCN/UI 公式ドキュメント](https://ui.shadcn.com/)
- [Radix UI 公式ドキュメント](https://www.radix-ui.com/)
