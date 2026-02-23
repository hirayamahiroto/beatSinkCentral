import React from "react";
import { SelectTrigger as PrimitiveSelectTrigger } from "@ui/design-system/primitives/select";

type SelectTriggerProps = React.ComponentProps<typeof PrimitiveSelectTrigger>;

export type { SelectTriggerProps };

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>((props, ref) => <PrimitiveSelectTrigger ref={ref} {...props} />);
