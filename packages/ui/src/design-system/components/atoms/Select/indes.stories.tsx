import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./index";
import { SelectTrigger } from "./Trigger";
import { SelectValue } from "./Value";
import { SelectContent } from "./Content";
import { SelectItem } from "./Item";

const SelectDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Region" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="kanto">関東</SelectItem>
      <SelectItem value="kansai">関西</SelectItem>
      <SelectItem value="other">その他</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select",
  component: SelectDemo,
} satisfies Meta<typeof SelectDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
