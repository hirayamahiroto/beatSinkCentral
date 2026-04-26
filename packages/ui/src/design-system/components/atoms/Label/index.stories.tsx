import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./index";

const meta = {
  title: "atoms/Label",
  component: Label,
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    htmlFor: "input-id",
    children: "ラベルテキスト",
  },
};
