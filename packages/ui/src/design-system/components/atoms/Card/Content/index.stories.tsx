import type { Meta, StoryObj } from "@storybook/react";
import { CardContent } from "./index";

export const meta = {
  title: "atoms/Card/Content",
  component: CardContent,
} satisfies Meta<typeof CardContent>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card content area",
  },
};
