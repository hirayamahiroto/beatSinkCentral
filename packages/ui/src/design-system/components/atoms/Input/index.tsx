import React from "react";
import { Input as PrimitiveInput } from "@ui/design-system/primitives/input";
import { cn } from "@ui/shared/utils/mergeClassNames";

type InputProps = React.ComponentProps<typeof PrimitiveInput>;

export type { InputProps };

// 色のみブランド調（背景の透過とボーダー）。サイズや余白は shadcn の既定を維持
const defaultClasses = "bg-white/5 border-white/10";

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
