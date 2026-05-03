import React from "react";
import { Card as PrimitiveCard } from "@ui/design-system/primitives/card";
import { cn } from "@ui/shared/utils/mergeClassNames";

type CardProps = React.ComponentProps<typeof PrimitiveCard>;

// 背景に少し elevation を持たせ、角丸と余白をブランド標準に揃える
const defaultClasses = "rounded-2xl p-6";

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
