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

```tsx
// page.tsx
import { ClientAdapter } from "./ClientAdapter";

export default async function Page() {
  const data = await fetch('/api/data');
  const initialData = await data.json();
  return <ClientAdapter initialData={initialData} />;
}

// ClientAdapter/index.tsx
"use client";
import { useState } from "react";
import ComponentPage from "@ui/design-system/components/pages/ComponentPage";

export function ClientAdapter({ initialData }: ClientAdapterProps) {
  const [data, setData] = useState(initialData);
  return (
    <ComponentPage
      data={data}
      onDataUpdate={setData}
    />
  );
}
```
