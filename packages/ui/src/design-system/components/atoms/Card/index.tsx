import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Card as PrimitiveCard } from "@ui/design-system/primitives/card";
import { cn } from "@ui/shared/utils/mergeClassNames";

// Card は文脈を持つ容器なので、中の縦リズムも自身が所有する。
// 外から Stack を被せて構造を外注せず、`gap` で密度を切り替える。
const cardVariants = cva(
  "backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col",
  {
    variants: {
      gap: {
        none: "",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
      },
    },
    defaultVariants: {
      gap: "sm",
    },
  },
);

type CardProps = React.ComponentProps<typeof PrimitiveCard> & {
  gap?: NonNullable<VariantProps<typeof cardVariants>["gap"]>;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, gap, ...props }, ref) => (
    <PrimitiveCard
      ref={ref}
      className={cn(cardVariants({ gap }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";
