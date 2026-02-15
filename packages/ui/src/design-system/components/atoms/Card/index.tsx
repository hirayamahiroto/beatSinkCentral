import React from "react";
import { Card as PrimitiveCard } from "@ui/design-system/primitives/card";

type CardProps = React.ComponentProps<typeof PrimitiveCard>;

export type { CardProps };

export const Card = (props: CardProps) => <PrimitiveCard {...props} />;
