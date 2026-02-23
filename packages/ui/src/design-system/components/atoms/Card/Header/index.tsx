import React from "react";
import { CardHeader as PrimitiveCardHeader } from "@ui/design-system/primitives/card";

type CardHeaderProps = React.ComponentProps<typeof PrimitiveCardHeader>;

export type { CardHeaderProps };

export const CardHeader = (props: CardHeaderProps) => (
  <PrimitiveCardHeader {...props} />
);
