import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../index";
import { SelectTrigger } from "./index";
import { SelectValue } from "../Value";

const SelectTriggerDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
  </Select>
);

const meta = {
  title: "atoms/Select/Trigger",
  component: SelectTriggerDemo,
} satisfies Meta<typeof SelectTriggerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
