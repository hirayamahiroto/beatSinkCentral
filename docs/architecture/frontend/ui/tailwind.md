# Tailwind CSS実装規約

## 基本方針

- **カスタム定義は使用禁止** - Tailwindの標準クラスのみ使用
- `tailwind.config.ts`でのカスタマイズは最小限に留める
- カラー定義: https://tailwindcss.com/docs/colors

---

## 許可されるスタイリング方法

```tsx
// ✅ 良い例
className="px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded-lg"

// ❌ 避けるべき
className="custom-button-style"           // カスタムクラス
className="text-[#カラーコード]"           // 任意値指定
style={{ backgroundColor: '#custom' }}   // インラインスタイル
```

---

## クラス名の結合

- `cn()`ユーティリティ関数を使用してクラス名を結合
