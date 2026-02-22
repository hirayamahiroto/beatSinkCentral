import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./index";

const meta = {
  title: "atoms/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
