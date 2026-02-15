import * as React from "react";
import { cn } from "@ui/shared/utils/mergeClassNames";

type CardTitleProps = React.HTMLAttributes<HTMLDivElement>;

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-title"
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export { CardTitle, type CardTitleProps };
