import React from "react";
import { Textarea as PrimitiveTextarea } from "@ui/design-system/primitives/textarea";
import { cn } from "@ui/shared/utils/mergeClassNames";

type TextareaProps = React.ComponentProps<typeof PrimitiveTextarea>;

export type { TextareaProps };

const defaultClasses =
  "bg-white/5 border-white/10 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <PrimitiveTextarea
      ref={ref}
      className={cn(defaultClasses, className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
