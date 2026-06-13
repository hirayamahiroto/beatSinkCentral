import React from "react";
import { Switch as PrimitiveSwitch } from "@ui/design-system/primitives/switch";

type SwitchProps = React.ComponentProps<typeof PrimitiveSwitch>;

export type { SwitchProps };

export const Switch = React.forwardRef<
  React.ElementRef<typeof PrimitiveSwitch>,
  SwitchProps
>((props, ref) => <PrimitiveSwitch ref={ref} {...props} />);
Switch.displayName = "Switch";
