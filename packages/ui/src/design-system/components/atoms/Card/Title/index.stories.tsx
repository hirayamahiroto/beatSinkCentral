import type { Meta, StoryObj } from "@storybook/react";
import { CardTitle } from "./index";

export const meta = {
  title: "atoms/Card/Title",
  component: CardTitle,
} satisfies Meta<typeof CardTitle>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Title",
  },
};
