import type { Meta, StoryObj } from "@storybook/react";
import { CardHeader } from "./index";

export const meta = {
  title: "atoms/Card/Header",
  component: CardHeader,
} satisfies Meta<typeof CardHeader>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Header",
  },
};
