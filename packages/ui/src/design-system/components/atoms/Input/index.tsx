import React from "react";
import { Input as PrimitiveInput } from "@ui/design-system/primitives/input";
import { cn } from "@ui/shared/utils/mergeClassNames";

type InputProps = React.ComponentProps<typeof PrimitiveInput>;

export type { InputProps };

const defaultClasses =
  "bg-white/5 border-white/10 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive";

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
