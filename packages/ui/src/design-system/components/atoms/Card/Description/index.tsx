import * as React from "react";
import { cn } from "@ui/shared/utils/mergeClassNames";

type CardDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export { CardDescription, type CardDescriptionProps };
