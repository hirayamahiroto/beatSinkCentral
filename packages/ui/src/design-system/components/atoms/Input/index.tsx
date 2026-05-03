import React from "react";
import { Input as PrimitiveInput } from "@ui/design-system/primitives/input";
import { cn } from "@ui/shared/utils/mergeClassNames";

type InputProps = React.ComponentProps<typeof PrimitiveInput>;

export type { InputProps };

// 入力欄の見た目はカードと揃える（少し elevation・大きめ角丸・余白広め）
const defaultClasses = "h-12 rounded-xl bg-card px-4 py-3";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <PrimitiveInput
      ref={ref}
      className={cn(defaultClasses, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
