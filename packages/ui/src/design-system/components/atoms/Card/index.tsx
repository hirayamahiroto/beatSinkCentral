import React from "react";
import { Card as PrimitiveCard } from "@ui/design-system/primitives/card";
import { cn } from "@ui/shared/utils/mergeClassNames";

type CardProps = React.ComponentProps<typeof PrimitiveCard>;

// 透過ベースのガラス調デザイン。背景色は親要素のトーンに依存して自然になじむ
const defaultClasses =
  "backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10";

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <PrimitiveCard
      ref={ref}
      className={cn(defaultClasses, className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";
