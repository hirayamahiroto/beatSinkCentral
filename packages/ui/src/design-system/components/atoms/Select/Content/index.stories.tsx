import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../index";
import { SelectTrigger } from "../Trigger";
import { SelectValue } from "../Value";
import { SelectContent } from "./index";
import { SelectItem } from "../Item";

const SelectContentDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">Item A</SelectItem>
      <SelectItem value="b">Item B</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select/Content",
  component: SelectContentDemo,
} satisfies Meta<typeof SelectContentDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
