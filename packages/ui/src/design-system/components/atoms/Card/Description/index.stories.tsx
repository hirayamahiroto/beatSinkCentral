import type { Meta, StoryObj } from "@storybook/react";
import { CardDescription } from "./index";

export const meta = {
  title: "atoms/Card/Description",
  component: CardDescription,
} satisfies Meta<typeof CardDescription>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card description text",
  },
};
