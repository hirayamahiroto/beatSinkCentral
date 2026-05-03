import React from "react";
import {
  Button as PrimitiveButton,
  type ButtonProps,
} from "@ui/design-system/primitives/button";
import { cn } from "@ui/shared/utils/mergeClassNames";

export type { ButtonProps };

// default variant のときだけブランドのグラデーションを適用する。
// destructive / outline / ghost などは primitive の見た目を維持する。
const defaultVariantClasses =
  "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, className, ...props }, ref) => {
    const isDefault = variant === undefined || variant === "default";
    return (
      <PrimitiveButton
        ref={ref}
        variant={variant}
        className={cn(isDefault && defaultVariantClasses, className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
