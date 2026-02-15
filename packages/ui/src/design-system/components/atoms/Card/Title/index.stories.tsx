import type { Meta, StoryObj } from "@storybook/react";
import { CardTitle } from "./index";

const meta = {
  title: "atoms/Card/Title",
  component: CardTitle,
} satisfies Meta<typeof CardTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Title",
  },
};
