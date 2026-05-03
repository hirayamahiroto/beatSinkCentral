import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@ui/shared/utils/mergeClassNames";

const stackVariants = cva("flex flex-col", {
  variants: {
    // 子要素間の縦方向の間隔。sm=8px / md=16px / lg=24px
    gap: {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    },
  },
});

export type StackProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> & {
  gap: NonNullable<VariantProps<typeof stackVariants>["gap"]>;
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap, ...props }, ref) => (
    <div ref={ref} className={cn(stackVariants({ gap }))} {...props} />
  ),
);
Stack.displayName = "Stack";
