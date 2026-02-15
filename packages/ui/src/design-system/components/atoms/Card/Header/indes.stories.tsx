import type { Meta, StoryObj } from "@storybook/react";
import { CardHeader } from "./index";

const meta = {
  title: "atoms/Card/Header",
  component: CardHeader,
} satisfies Meta<typeof CardHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Header",
  },
};
