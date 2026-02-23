import React from "react";
import { CardContent as PrimitiveCardContent } from "@ui/design-system/primitives/card";

type CardContentProps = React.ComponentProps<typeof PrimitiveCardContent>;

export type { CardContentProps };

export const CardContent = (props: CardContentProps) => (
  <PrimitiveCardContent {...props} />
);
