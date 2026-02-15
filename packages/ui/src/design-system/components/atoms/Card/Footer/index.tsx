import React from "react";
import { CardFooter as PrimitiveCardFooter } from "@ui/design-system/primitives/card";

type CardFooterProps = React.ComponentProps<typeof PrimitiveCardFooter>;

export type { CardFooterProps };

export const CardFooter = (props: CardFooterProps) => (
  <PrimitiveCardFooter {...props} />
);
