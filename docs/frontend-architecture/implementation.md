# 実装の前提

## Next.js App Router準拠

- 各`page.tsx`では**Server Side Rendering (SSR)**を基本とする
- クライアントサイド処理が必要な場合は、adapterを用いて`"use client"`ディレクティブを明示的に記述

---

## 実装パターン

### SSRのみの場合

```tsx
import ComponentPage from "@ui/design-system/components/pages/ComponentPage";

export default function Page() {
  return <ComponentPage />;
}
```

### SSR + CSR（動的な動きが必要な場合）

`page.tsx`:

```tsx
import { ClientAdapter } from "./ClientAdapter";

export default async function Page() {
  const data = await fetch("/api/data");
  const initialData = await data.json();
  return <ClientAdapter initialData={initialData} />;
}
```

`ClientAdapter/index.tsx`:

```tsx
"use client";

import { useState } from "react";
import ComponentPage from "@ui/design-system/components/pages/ComponentPage";

export function ClientAdapter({ initialData }: ClientAdapterProps) {
  const [data, setData] = useState(initialData);
  return <ComponentPage data={data} onDataUpdate={setData} />;
}
```

---

## ディレクトリ構造（Colocation）

各 ClientAdapter は **フォルダ + `index.tsx`** で構成し、その Adapter からしか使わない hooks・テストを**同じフォルダ配下に colocate** する。共有しない関心ごとを 1 つの単位にまとめることで、Adapter の追加・削除・移動が局所で完結する。

- ClientAdapter は `〇〇ClientAdapter/index.tsx`（フラットな `〇〇ClientAdapter.tsx` にしない）
- その Adapter 専用の hook は `〇〇ClientAdapter/hooks/{useXxx}/index.ts` に colocate する
- テストは対象と同ディレクトリに `index.test.ts(x)` を置く（[testing/strategy.md](../testing/strategy.md) §10 の配置規約に従う）
- `page.tsx` からの import は `./〇〇ClientAdapter`（フォルダ）に向ける。`index.tsx` に解決される
- 複数の Adapter で共有する hook のみ、より上位（例: ページ直下の `hooks/`）へ引き上げる

```
dashboard/
├── page.tsx
├── EmailEditorClientAdapter/
│   ├── index.tsx              # "use client" の Adapter 本体
│   ├── index.test.tsx         # Adapter のテスト
│   └── hooks/
│       └── useUpdateMyEmail/
│           ├── index.ts       # この Adapter 専用の hook
│           └── index.test.ts  # hook のテスト
└── AccountIdEditorClientAdapter/
    ├── index.tsx
    ├── index.test.tsx
    └── hooks/
        └── useUpdateMyAccountId/
            ├── index.ts
            └── index.test.ts
```
