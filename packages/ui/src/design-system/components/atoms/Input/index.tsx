import React from "react";
import { Input as PrimitiveInput } from "@ui/design-system/primitives/input";

type InputProps = React.ComponentProps<typeof PrimitiveInput>;

export type { InputProps };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <PrimitiveInput ref={ref} {...props} />
);
