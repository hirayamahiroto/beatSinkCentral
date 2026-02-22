import type { Meta, StoryObj } from "@storybook/react";
import { CardDescription } from "./index";

const meta = {
  title: "atoms/Card/Description",
  component: CardDescription,
} satisfies Meta<typeof CardDescription>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card description text",
  },
};
