import React from "react";
import { Label as PrimitiveLabel } from "@ui/design-system/primitives/label";

type LabelProps = React.ComponentProps<typeof PrimitiveLabel>;

export type { LabelProps };

export const Label = React.forwardRef<
  React.ElementRef<typeof PrimitiveLabel>,
  LabelProps
>((props, ref) => <PrimitiveLabel ref={ref} {...props} />);

Label.displayName = "Label";
