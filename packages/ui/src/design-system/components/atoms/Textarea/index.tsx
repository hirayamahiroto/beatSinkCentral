import React from "react";
import { Textarea as PrimitiveTextarea } from "@ui/design-system/primitives/textarea";
import { cn } from "@ui/shared/utils/mergeClassNames";

type TextareaProps = React.ComponentProps<typeof PrimitiveTextarea>;

export type { TextareaProps };

// 色のみブランド調（背景の透過とボーダー）。サイズや余白は shadcn の既定を維持（Input と同方針）
const defaultClasses = "bg-white/5 border-white/10";

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
