import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../index";
import { SelectTrigger } from "../Trigger";
import { SelectValue } from "../Value";
import { SelectContent } from "../Content";
import { SelectItem } from "./index";

const SelectItemDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="item1">Item 1</SelectItem>
      <SelectItem value="item2">Item 2</SelectItem>
      <SelectItem value="item3">Item 3</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select/Item",
  component: SelectItemDemo,
} satisfies Meta<typeof SelectItemDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
