import React from "react";
import {
  Button as PrimitiveButton,
  type ButtonProps,
} from "@ui/design-system/primitives/button";

export type { ButtonProps };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <PrimitiveButton ref={ref} {...props} />
);
