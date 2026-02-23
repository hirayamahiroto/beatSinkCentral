import React from "react";
import { SelectContent as PrimitiveSelectContent } from "@ui/design-system/primitives/select";

type SelectContentProps = React.ComponentProps<typeof PrimitiveSelectContent>;

export type { SelectContentProps };

export const SelectContent = (props: SelectContentProps) => (
  <PrimitiveSelectContent {...props} />
);
