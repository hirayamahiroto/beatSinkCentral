import React from "react";
import { CardDescription as PrimitiveCardDescription } from "@ui/design-system/primitives/card";

type CardDescriptionProps = React.ComponentProps<
  typeof PrimitiveCardDescription
>;

export type { CardDescriptionProps };

export const CardDescription = (props: CardDescriptionProps) => (
  <PrimitiveCardDescription {...props} />
);
