import { SelectItem as PrimitiveSelectItem } from "@ui/design-system/primitives/select";

type SelectItemProps = React.ComponentProps<typeof PrimitiveSelectItem>;

export type { SelectItemProps };

export const SelectItem = (props: SelectItemProps) => (
  <PrimitiveSelectItem {...props} />
);
