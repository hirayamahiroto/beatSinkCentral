import React from "react";
import { CardTitle as PrimitiveCardTitle } from "@ui/design-system/primitives/card";

type CardTitleProps = React.ComponentProps<typeof PrimitiveCardTitle>;

export type { CardTitleProps };

export const CardTitle = (props: CardTitleProps) => (
  <PrimitiveCardTitle {...props} />
);
