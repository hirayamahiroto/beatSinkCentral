# フォーム実装ポリシー

## 1. 基本方針

本プロジェクトでは、**React Hook Form（RHF）の思想に沿った実装を優先し、Controller への安易な統一は行わない**。

- **RHF の利用は Organisms 以上の階層に限定**する
- **Atoms / Molecules はフォームライブラリに依存しない、純粋で再利用可能な UI コンポーネントとして定義**する
- フォームとの接続方式（`register` / `Controller`）は、**入力の性質と責務に応じて適切に選択する**

> 実装の統一よりも、
> **RHF が本来想定している使い方・パフォーマンス特性・責務分離を優先する**

---

## 2. register と Controller の動作の違い

### register（Uncontrolled 方式）

RHF が DOM を直接監視する方式。

```
ユーザーが入力
  → ブラウザの DOM (input要素) が値を保持
  → RHF が ref を通じて DOM から直接値を読み取る
  → React の再レンダーは起きない
```

```tsx
const { register } = useForm();

<input {...register("email")} />
```

内部的には以下と同等のことが行われている。

```tsx
<input
  ref={rhfが渡すref}         // DOM要素を直接掴む
  onChange={rhfが渡すhandler} // イベントを監視
  onBlur={rhfが渡すhandler}  // バリデーショントリガー
  name="email"               // フィールド識別子
/>
```

**特徴**

- RHF の推奨方式であり、パフォーマンスが最も高い
- ネイティブ `<input>` / `<select>` / `<textarea>` に直接使用する
- 再レンダーが発生しないため、大量フィールドでも快適

### Controller（Controlled 方式）

RHF が React の state 経由で値を管理する方式。

```
ユーザーが入力
  → RHF の内部 state が更新
  → React が再レンダー
  → UI に反映
```

```tsx
<Controller
  name="email"
  control={control}
  render={({ field }) => (
    <Input
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
    />
  )}
/>
```

**特徴**

- カスタム UI や複合入力に対応できる
- UI コンポーネントを Controlled API で統一できる
- 再レンダーが発生するため、フィールド数が多い場合は注意が必要

### 比較表

| 観点 | register | Controller |
|------|----------|------------|
| 値の管理 | DOM が保持 | RHF state |
| 再レンダー | 原則発生しない | 発生する |
| パフォーマンス | 高い | やや劣る |
| 対応対象 | ネイティブ要素のみ | 任意の UI |
| 実装量 | 少ない | 多い |

---

## 3. Controller に「統一しない」理由

### ① RHF 本来の思想を尊重する

RHF の公式ドキュメントは `register` を第一選択として推奨している。Controller は「制御コンポーネントや外部UIライブラリとの統合」のために用意されたアダプタである。

### ② パフォーマンス特性を活かす

`register` は DOM を直接参照するため再レンダーが発生しない。フィールド数が多いフォームでは、この差が体感に影響する。

### ③ Atoms の再利用性は「両方の方式」で成立する

Atoms が `value` / `onChange` / `ref` を受け取る設計であれば、`register` でも `Controller` でも接続可能。Controller に統一しなくても再利用性は損なわれない。

### Controller が必要な場面

- DatePicker や Select など、値の型が `string / boolean` 以外
- 内部で独自の state を保持・合成する複合入力
- `value` / `onChange` で統一された UI コンポーネントを利用する場合

> Controller は **例外対応のためのアダプタ**であり、常に使う前提のものではない

---

## 4. register / Controller の採用基準

### Controller を使用する条件（いずれか該当）

- ネイティブな `<input>` / `<select>` / `<textarea>` ではない
- 値の型が `string / boolean` 以外
- 入力値の真実を内部 state が持っている
- 複数の Atoms を合成して 1 つの値を返す

### register を使用できる条件（すべて満たす）

- ネイティブ要素に直結している
- 値の真実が DOM にある
- `name` / `ref` / `onChange` / `onBlur` を透過できる
- 値が単純なプリミティブである

---

## 5. ref の扱い（forwardRef）

Atoms / Molecules は `forwardRef` で実装する。

### なぜ ref を受け取る必要があるのか

1. **バリデーションエラー時のフォーカス制御**: エラーのあるフィールドに自動フォーカスさせる RHF の標準機能を利用するには、DOM への `ref` が必要。
2. **アクセシビリティ**: スクリーンリーダーやキーボード操作において、プログラム側から適切なタイミングでフォーカスを制御するため。
3. **実装の簡略化**: `forwardRef` で実装しておけば、Organisms での記述が `render={({ field }) => <Input {...field} />}` の一行で完結する。

### React 19 以降の注意

React 19 では `forwardRef` が不要になり、props として直接 `ref` を受け取れるようになった。プロジェクトの React バージョンに応じて適切な方式を選択すること。

```tsx
// React 18 以前
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, ...props }, ref) => (
    <input ref={ref} {...props} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} />
  )
);

// React 19 以降
export const Input = ({ value, onChange, ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) => (
  <input ref={ref} {...props} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} />
);
```

---

## 6. 階層ごとの実装例

### Atoms：最小UIの責務（RHF を一切知らない）

```tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
    />
  )
);
```

### Molecules：複合UIの責務（RHF を一切知らない）

Label、Input、ErrorMessage を組み合わせた複合コンポーネント。
`ref` は内部の入力要素にフォワードする。

```tsx
type FormFieldProps = {
  label: string;
  error?: string;
} & InputProps;

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, ...inputProps }, ref) => (
    <div>
      <label>{label}</label>
      <Input ref={ref} {...inputProps} />
      {error && <span role="alert">{error}</span>}
    </div>
  )
);
```

### Organisms：接続の責務（RHF と UI を橋渡しする）

`register` と `Controller` を入力の性質に応じて使い分ける。

```tsx
export const UserForm = () => {
  const { register, control, handleSubmit } = useForm<UserFormValues>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ネイティブ入力 → register */}
      <input {...register("name")} />

      {/* カスタム UI → Controller */}
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <FormField {...field} label="メールアドレス" error={fieldState.error?.message} />
        )}
      />
    </form>
  );
};
```

---

## 7. よくあるパターンへの対応

### 配列フィールド（useFieldArray）

```tsx
const { fields, append, remove } = useFieldArray({ control, name: "tags" });

{fields.map((field, index) => (
  <Controller
    key={field.id}
    name={`tags.${index}.value`}
    control={control}
    render={({ field }) => <Input {...field} />}
  />
))}
```

### 非同期バリデーション

```tsx
<Controller
  name="username"
  control={control}
  rules={{
    validate: async (value) => {
      const exists = await checkUsernameExists(value);
      return exists ? "このユーザー名は使用済みです" : true;
    },
  }}
  render={({ field, fieldState: { error } }) => (
    <FormField {...field} label="ユーザー名" error={error?.message} />
  )}
/>
```

### パフォーマンスが問題になった場合の対処

1. `watch` の使用範囲を限定する
2. 表示領域を分離・`React.memo` でメモ化
3. フォームを分割する
4. 計測の上で、該当フィールドの接続方式を見直す

---

## 8. まとめ

| 階層 | RHF 依存 | 責務 |
|------|----------|------|
| Atoms | なし | `value` / `onChange` / `ref` の Controlled API |
| Molecules | なし | Atoms の組み合わせ |
| Organisms | あり | RHF との接続・判断 |

- **Controller への安易な統一は行わない**
- RHF の思想に沿い、`register` を第一選択とする
- Controller は「必要な場面」でのみ使用する
- UI コンポーネントの再利用性は Atoms / Molecules で保証する
