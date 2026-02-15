import React from "react";
import {
  Input as PrimitiveInput,
  type InputProps,
} from "@ui/design-system/primitives/input";

export type { InputProps };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <PrimitiveInput ref={ref} {...props} />
);
